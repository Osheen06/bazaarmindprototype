import os
import uuid
import math
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger("bazaarmind")

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Query, UploadFile, File, Header, BackgroundTasks
from fastapi.responses import JSONResponse, PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from utils import haversine_km

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ.get("MONGO_URL", "mock://localhost:27017")
db_name = os.environ.get("DB_NAME", "bazaarmind")

def _init_db():
    use_mock = mongo_url.startswith("mock://") or os.environ.get("USE_MOCK_MONGO") == "true"
    if not use_mock:
        try:
            import certifi
            from pymongo import MongoClient
            test_c = MongoClient(mongo_url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=2000)
            test_c.admin.command("ping")
            real_c = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
            logger.info("Connected to MongoDB Atlas successfully.")
            return real_c, real_c[db_name]
        except Exception as err:
            logger.warning(
                "MongoDB Atlas connection not ready (%s). If using Atlas, add 0.0.0.0/0 to Network Access. "
                "Starting with resilient in-memory store for demo.",
                type(err).__name__,
            )
    from mongomock_motor import AsyncMongoMockClient
    mock_c = AsyncMongoMockClient()
    return mock_c, mock_c[db_name]

client, db = _init_db()

WEBHOOK_CRON_SECRET = os.environ.get("WEBHOOK_CRON_SECRET", "")

@asynccontextmanager
async def lifespan(app):
    # --- startup ---
    loc_router = globals().get("location_router")
    st_router = globals().get("stall_router")
    ensure_location_indexes = getattr(loc_router, "ensure_indexes", None)
    ensure_stall_indexes = getattr(st_router, "ensure_indexes", None)

    if ensure_location_indexes:
        await ensure_location_indexes()
    if ensure_stall_indexes:
        await ensure_stall_indexes()

    try:
        await db.pilot_invites.create_index([("code", 1)], unique=True)
    except Exception:
        pass

    try:
        await db.market_signals.create_index([("marketId", 1), ("status", 1), ("createdAt", -1)])
        await db.market_signals.create_index([("marketId", 1), ("dataSource", 1), ("status", 1)])
        await db.market_signals.create_index([("marketId", 1), ("product", 1), ("status", 1)])
        await db.markets.create_index([("id", 1)], unique=True)
    except Exception:
        pass

    await demo_seed.seed_if_empty(db)

    logger.info(
        "BazaarMind ready. Gemini=%s WhatsApp configured=%s Voice=%s",
        gemini_service.GEMINI_MODEL,
        whatsapp_service.is_configured(),
        voice_service.is_configured(),
    )

    yield

    # --- shutdown ---
    client.close()

app = FastAPI(title="BazaarMind API", lifespan=lifespan)
api = APIRouter(prefix="/api")

import location_routes
import gemini_service
import intelligence
import demo_seed
import whatsapp_service
import voice_service
import conversation
import stall_routes

DEFAULT_MARKET = demo_seed.DEMO_MARKET["id"]

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# ----------------------------- Models -----------------------------
class InterpretRequest(BaseModel):
    text: str = ""
    imageBase64: Optional[str] = None

class SignalCreate(BaseModel):
    marketId: str = DEFAULT_MARKET
    vendorId: Optional[str] = None
    vendorName: Optional[str] = None
    product: str
    signalType: str = "SUPPLY"
    availability: Optional[str] = None
    reportedPrice: Optional[float] = None
    priceUnit: Optional[str] = None
    quantity: Optional[str] = None
    demandLevel: Optional[str] = None
    language: str = "HINGLISH"
    rawText: str = ""
    imageUrl: Optional[str] = None
    source: str = "VENDOR"
    confidence: str = "MEDIUM"
    reasoning: str = ""
    participantId: Optional[str] = None
    dataSource: Optional[str] = None

class ShoppingListRequest(BaseModel):
    text: str
    marketId: str = DEFAULT_MARKET
    participantId: Optional[str] = None
    persist: bool = True

class PlanRouteRequest(BaseModel):
    items: List[str] = Field(default_factory=list)
    marketId: str = DEFAULT_MARKET
    dataSource: str = "DEMO"

class AskRequest(BaseModel):
    question: str
    marketId: str = DEFAULT_MARKET
    dataSource: str = "DEMO"

class AnalyticsEvent(BaseModel):
    event: str
    props: Dict[str, Any] = {}

class OnboardShopper(BaseModel):
    name: Optional[str] = None
    community: str
    marketId: str = DEFAULT_MARKET
    language: str = "HINGLISH"
    consent: bool = False

class OnboardVendor(BaseModel):
    name: Optional[str] = None
    stall: Optional[str] = None
    category: Optional[str] = None
    marketId: str = DEFAULT_MARKET
    language: str = "HINGLISH"
    consent: bool = False
    signalMethod: str = "text"

def _resolve_source(participant_id: Optional[str], explicit: Optional[str]) -> str:
    if explicit in ("DEMO", "PILOT", "REAL"):
        return explicit
    return "PILOT" if participant_id else "DEMO"

async def _resolve_source_async(participant_id: Optional[str], explicit: Optional[str]) -> str:
    if participant_id:
        exists = await db.pilot_participants.find_one({"id": participant_id}, {"_id": 1})
        if exists:
            return "PILOT" if explicit != "REAL" else "REAL"
        return "DEMO"
    if explicit in ("DEMO", "REAL"):
        return explicit
    return "DEMO"

# ----------------------------- Health -----------------------------
@app.get("/health")
@api.get("/health")
async def health():
    try:
        await db.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False

    return {
        "ok": mongo_ok,
        "service": "bazaarmind-api",
        "geminiConfigured": bool(getattr(gemini_service, "GEMINI_API_KEY", "")),
        "whatsappConfigured": whatsapp_service.is_configured(),
        "voiceConfigured": voice_service.is_configured(),
        "mongo": mongo_ok,
    }

# ----------------------------- Basic -----------------------------
@api.get("/")
async def root():
    return {"app": "BazaarMind", "tagline": "The Market That Thinks as One.", "model": gemini_service.GEMINI_MODEL}

@api.get("/markets")
async def get_markets():
    return await db.markets.find({}, {"_id": 0}).to_list(100)

@api.get("/markets/nearby")
async def get_markets_nearby(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    dataSource: str = Query("DEMO"),
    radiusKm: float = Query(25.0),
):
    all_markets = await db.markets.find({}, {"_id": 0}).to_list(100)
    user_has_coords = lat is not None and lng is not None
    markets_with_dist = []
    for m in all_markets:
        d_km = None
        if user_has_coords and m.get("lat") is not None and m.get("lng") is not None:
            d_km = round(haversine_km(lat, lng, m["lat"], m["lng"]), 1)
        markets_with_dist.append({**m, "distanceKm": d_km})

    if user_has_coords:
        within_radius = [m for m in markets_with_dist if m["distanceKm"] is not None and m["distanceKm"] <= radiusKm]
        within_radius.sort(key=lambda x: x["distanceKm"])
    else:
        within_radius = markets_with_dist

    markets_to_use = within_radius if within_radius else markets_with_dist
    enriched = []
    recommended = None
    for m in markets_to_use:
        query: Dict[str, Any] = {"marketId": m["id"], "status": "confirmed"}
        if dataSource in ("DEMO", "PILOT", "REAL"):
            query["dataSource"] = dataSource
        sig_count = await db.market_signals.count_documents(query)
        has_intel = sig_count > 0
        market_entry = {
            **m,
            "signalCount": sig_count,
            "hasIntelligence": has_intel,
            "intelligenceAvailable": has_intel,
            "status": "active" if has_intel else "discovery_only",
        }
        enriched.append(market_entry)
        if has_intel and recommended is None:
            recommended = m["id"]

    return {
        "userLocation": {"lat": lat, "lng": lng} if user_has_coords else None,
        "radiusKm": radiusKm,
        "dataSource": dataSource,
        "markets": enriched,
        "recommendedMarketId": recommended,
        "hasNearbyIntelligence": recommended is not None,
    }

@api.get("/products")
async def get_products():
    return [{"name": p} for p in gemini_service.CANONICAL_PRODUCTS]

# ----------------------------- Market Pulse -----------------------------
@api.get("/market-pulse")
async def market_pulse(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO"):
    market = await db.markets.find_one({"id": marketId}, {"_id": 0})
    pulse = await intelligence.compute_market_pulse(db, marketId, data_source=dataSource)
    pulse["market"] = market or {"id": marketId, "name": "INA MARKET — BAZAARMIND DEMO"}
    pulse["dataSource"] = dataSource
    pulse["ok"] = True
    return pulse

# ----------------------------- Gemini: interpret signal -----------------------------
@api.post("/signals/interpret")
async def signals_interpret(req: InterpretRequest):
    if not req.text and not req.imageBase64:
        raise HTTPException(status_code=400, detail="Provide text or an image to interpret.")
    try:
        result = await gemini_service.interpret_signal(req.text, req.imageBase64, session_id=str(uuid.uuid4()))
        return {"ok": True, "signal": result, "data": result, "live": True}
    except Exception:
        logger.exception("interpret failed")
        return JSONResponse(status_code=200, content={"ok": False, "error": "BazaarMind couldn't interpret that right now. Please try again."})

# ----------------------------- Persist signal -----------------------------
def _moderate(signal: Dict[str, Any]) -> str:
    price = signal.get("reportedPrice")
    if price is not None and (price <= 0 or price > 10000):
        return "pending"
    prod = signal.get("product")
    if not prod or prod == "Unknown" or len(prod) > 50:
        return "pending"
    valid_types = ("DEMAND", "SUPPLY", "AVAILABILITY", "PRICE", "CONTEXT", "PRICE_OBSERVATION")
    if signal.get("signalType") and signal.get("signalType") not in valid_types:
        return "pending"
    return "confirmed"

@api.post("/signals")
async def create_signal(req: SignalCreate):
    doc = req.model_dump()
    participant_id = doc.pop("participantId", None)
    explicit = doc.pop("dataSource", None)
    doc["dataSource"] = await _resolve_source_async(participant_id, explicit)
    doc["participantId"] = participant_id
    doc["id"] = str(uuid.uuid4())
    created = datetime.now(timezone.utc)
    doc["createdAt"] = created.isoformat()
    doc["expiresAt"] = (created + timedelta(hours=18)).isoformat()
    doc["corroborationCount"] = 1
    doc["synthetic"] = doc["dataSource"] == "DEMO"
    doc["status"] = _moderate(doc)

    # 30-second anti-spam deduplication
    recent_dup = await db.market_signals.find_one({
        "marketId": doc["marketId"],
        "vendorName": doc.get("vendorName"),
        "product": doc["product"],
        "reportedPrice": doc.get("reportedPrice"),
        "createdAt": {"$gt": (created - timedelta(seconds=30)).isoformat()}
    })
    if recent_dup:
        recent_dup.pop("_id", None)
        return {"ok": True, "signal": recent_dup, "published": True, "duplicate": True}

    await db.market_signals.insert_one({**doc})
    doc.pop("_id", None)
    return {"ok": True, "signal": doc, "published": doc["status"] == "confirmed"}

@api.get("/signals")
async def list_signals(
    marketId: str = DEFAULT_MARKET,
    product: Optional[str] = None,
    dataSource: Optional[str] = None,
    limit: int = 60,
):
    query: Dict[str, Any] = {"marketId": marketId, "status": "confirmed"}
    if product:
        norm = gemini_service.normalize_product(product) or product
        query["product"] = norm
    if dataSource:
        query["dataSource"] = dataSource
    cursor = db.market_signals.find(query, {"_id": 0}).sort("createdAt", -1).limit(limit)
    return await cursor.to_list(limit)

@api.post("/demo/reset")
async def demo_reset():
    result = await demo_seed.reset_demo(db)
    return {"ok": True, "message": "Demo market reset to initial state.", **result}

# ----------------------------- Shopping list -----------------------------
@api.post("/shopping-list/parse")
async def shopping_list_parse(req: ShoppingListRequest):
    try:
        parsed = await gemini_service.parse_shopping_list(req.text, session_id=str(uuid.uuid4()))
    except Exception:
        logger.exception("list parse failed")
        return JSONResponse(status_code=200, content={"ok": False, "error": "BazaarMind couldn't read that list right now. Please try again."})

    data_source = await _resolve_source_async(req.participantId, None)
    pulse = await intelligence.compute_market_pulse(db, req.marketId, data_source=data_source)
    pulse_map = {p["product"]: p for p in pulse["products"]}

    items, tight = [], 0
    for it in parsed.get("items", []):
        p = pulse_map.get(it["product"])
        if p:
            status = "tight" if p["availabilityCode"] == "LOW" else "ok"
            if status == "tight":
                tight += 1
            items.append({"product": it["product"], "quantity": it.get("quantity"),
                          "availability": p["availability"], "demand": p["demand"],
                          "reportedPriceSignal": p["reportedPriceSignal"], "confidence": p["confidence"],
                          "status": status, "known": True})
        else:
            items.append({"product": it["product"], "quantity": it.get("quantity"), "status": "unknown", "known": False})

    created = datetime.now(timezone.utc)
    demand_docs = []
    for it in items:
        if it["known"]:
            demand_docs.append({
                "id": str(uuid.uuid4()), "marketId": req.marketId, "vendorId": None, "vendorName": None,
                "product": it["product"], "signalType": "DEMAND", "availability": None, "reportedPrice": None,
                "priceUnit": None, "quantity": it.get("quantity"), "demandLevel": "NORMAL", "language": parsed.get("language", "ENGLISH"),
                "rawText": req.text, "imageUrl": None, "source": "SHOPPER", "confidence": "MEDIUM",
                "reasoning": f"Shopper requested {it.get('quantity') or 'unspecified amount'}.", "createdAt": created.isoformat(),
                "expiresAt": (created + timedelta(hours=12)).isoformat(), "status": "confirmed",
                "corroborationCount": 1, "synthetic": data_source == "DEMO", "dataSource": data_source,
                "participantId": req.participantId,
            })
    if req.persist:
        if demand_docs:
            await db.market_signals.insert_many(demand_docs)
        await db.shopping_lists.insert_one({
            "id": str(uuid.uuid4()), "marketId": req.marketId, "rawText": req.text,
            "items": [i["product"] for i in items], "dataSource": data_source,
            "participantId": req.participantId, "createdAt": created.isoformat(),
        })

    summary = f"BazaarMind noticed {tight} item{'s' if tight > 1 else ''} with tighter availability today." if tight else None
    return {
        "ok": True,
        "items": items,
        "tightCount": tight,
        "summary": summary,
        "language": parsed.get("language", "ENGLISH"),
        "persisted": req.persist,
    }

@api.post("/shopper/plan-route")
async def plan_shopper_route_endpoint(req: PlanRouteRequest):
    data_source = req.dataSource or "DEMO"
    pulse = await intelligence.compute_market_pulse(db, req.marketId, data_source=data_source)
    market = await db.markets.find_one({"id": req.marketId}, {"_id": 0})
    market_name = market["name"] if market else "INA MARKET — BAZAARMIND DEMO"

    now_str = now_iso()
    locations = await db.vendor_locations.find(
        {"marketId": req.marketId, "dataSource": data_source, "active": True, "expiresAt": {"$gt": now_str}},
        {"_id": 0}
    ).to_list(100)

    if not locations and data_source == "DEMO" and req.marketId == "demo-ina":
        locations = [
            {"vendorId": "v1", "vendorName": "Ramesh Sabzi Wala", "stallName": "Stall 3 · Fresh Greens", "lat": 28.56885, "lng": 77.20925},
            {"vendorId": "v2", "vendorName": "Sharma Fruits", "stallName": "Stall 7 · Fruit Row", "lat": 28.56895, "lng": 77.20950},
            {"vendorId": "v3", "vendorName": "Green Basket", "stallName": "Stall 11 · Center Lane", "lat": 28.56860, "lng": 77.20960},
            {"vendorId": "v4", "vendorName": "Fresh Corner", "stallName": "Stall 14 · Main Gate", "lat": 28.56850, "lng": 77.20915},
        ]

    vendor_list = []
    for loc in locations:
        signals = await db.market_signals.find(
            {"marketId": req.marketId, "vendorId": loc["vendorId"], "source": "VENDOR", "status": "confirmed", "dataSource": data_source},
            {"_id": 0}
        ).sort("createdAt", -1).limit(20).to_list(20)
        offers = []
        seen = set()
        for s in signals:
            p_name = s.get("product")
            if p_name and p_name not in seen:
                seen.add(p_name)
                offers.append({
                    "product": p_name,
                    "reportedPrice": s.get("reportedPrice"),
                    "priceUnit": s.get("priceUnit"),
                    "availability": s.get("availability"),
                })
        vendor_list.append({
            "vendorId": loc["vendorId"],
            "vendorName": loc.get("vendorName") or "Local Stall",
            "stallName": loc.get("stallName") or "Stall",
            "lat": float(loc.get("lat") or 28.5687),
            "lng": float(loc.get("lng") or 77.2094),
            "offers": offers,
        })

    route_plan = await gemini_service.plan_shopper_route(
        items=req.items,
        market_name=market_name,
        vendors=vendor_list,
        pulse_products=pulse.get("products", []),
    )
    return {"ok": True, **route_plan}

# ----------------------------- Ask BazaarMind -----------------------------
@api.post("/ask-bazaar")
async def ask_bazaar(req: AskRequest):
    pulse = await intelligence.compute_market_pulse(db, req.marketId, data_source=req.dataSource)
    market = await db.markets.find_one({"id": req.marketId}, {"_id": 0})
    market_name = market["name"] if market else "INA MARKET — BAZAARMIND DEMO"
    if not pulse["products"]:
        return {
            "ok": True,
            "answer": "BazaarMind doesn't have enough local signals in this market yet to answer that with certainty.",
            "live": True,
            "totalSignals": 0,
            "vendorObservations": 0,
            "shopperSignals": 0,
            "freshness": "No signals yet",
        }
    context = intelligence.build_pulse_context(pulse, market_name)
    try:
        answer = await gemini_service.ask_bazaar(req.question, context, session_id=str(uuid.uuid4()), data_source=req.dataSource)
        return {
            "ok": True,
            "answer": answer,
            "live": True,
            "totalSignals": pulse.get("activeSignalsCount", len(pulse["products"])),
            "vendorObservations": pulse.get("vendorObservationsCount", 0),
            "shopperSignals": pulse.get("shopperSignalsCount", 0),
            "generatedAt": pulse.get("generatedAt"),
            "freshness": pulse.get("freshness", "Active today"),
        }
    except Exception:
        logger.exception("ask failed")
        fallback_answer = gemini_service._rule_based_ask(req.question, context)
        return {
            "ok": True,
            "answer": fallback_answer,
            "live": False,
            "totalSignals": pulse.get("activeSignalsCount", len(pulse["products"])),
            "vendorObservations": pulse.get("vendorObservationsCount", 0),
            "shopperSignals": pulse.get("shopperSignalsCount", 0),
            "generatedAt": pulse.get("generatedAt"),
            "freshness": pulse.get("freshness", "Active today"),
        }

# ----------------------------- Voice (Whisper STT) -----------------------------
@api.get("/voice/status")
async def voice_status():
    return {
        "configured": voice_service.is_configured(),
        "model": voice_service.TRANSCRIBE_MODEL,
    }

@api.post("/voice/transcribe")
async def voice_transcribe(audio: UploadFile = File(...)):
    if not voice_service.is_configured():
        return JSONResponse(status_code=200, content={"ok": False, "error": "Speech-to-text is not configured in this environment."})
    try:
        content = await audio.read()
        transcript = await voice_service.transcribe_audio(content, audio.filename or "audio.webm")
        return {"ok": True, "transcript": transcript, "live": True}
    except Exception:
        logger.exception("transcription failed")
        return JSONResponse(status_code=200, content={"ok": False, "error": "BazaarMind couldn't transcribe that audio. Please try again."})

# ----------------------------- Vendor demand -----------------------------
@api.get("/vendor/demand")
async def vendor_demand(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO"):
    cursor = db.market_signals.find({"marketId": marketId, "source": "SHOPPER", "status": "confirmed", "dataSource": dataSource}, {"_id": 0})
    signals = await cursor.to_list(5000)
    counts: Dict[str, int] = {}
    for s in signals:
        counts[s["product"]] = counts.get(s["product"], 0) + 1
    ranked = sorted(counts.items(), key=lambda x: -x[1])
    total = sum(counts.values())

    def level(c):
        if c >= 18: return "High interest"
        if c >= 10: return "Medium-high interest"
        if c >= 5: return "Medium interest"
        return "Normal"

    return {"marketId": marketId, "totalRequests": total,
            "products": [{"product": p, "requests": c, "level": level(c)} for p, c in ranked]}

# ----------------------------- Market network -----------------------------
@api.get("/market-network")
async def market_network(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO"):
    market = await db.markets.find_one({"id": marketId}, {"_id": 0})
    vendors = await db.vendors.find({"marketId": marketId}, {"_id": 0}).to_list(100)
    cursor = db.market_signals.find({"marketId": marketId, "status": "confirmed", "dataSource": dataSource}, {"_id": 0})
    signals = await cursor.to_list(5000)

    vendor_counts: Dict[str, int] = {}
    shopper_total = 0
    for s in signals:
        if s.get("source") == "VENDOR" and s.get("vendorId"):
            vendor_counts[s["vendorId"]] = vendor_counts.get(s["vendorId"], 0) + 1
        elif s.get("source") == "SHOPPER":
            shopper_total += 1

    vendor_nodes = [{"id": v["id"], "name": v["name"], "stall": v.get("stall"),
                     "supplySignals": vendor_counts.get(v["id"], 0)} for v in vendors]
    return {"market": market or {"id": marketId, "name": "INA MARKET — BAZAARMIND DEMO"}, "vendors": vendor_nodes,
            "shopperSignals": shopper_total, "supplySignals": sum(vendor_counts.values()), "dataSource": dataSource}

# ----------------------------- Snapshots -----------------------------
@api.get("/snapshots")
async def snapshots(marketId: str = DEFAULT_MARKET):
    snaps = await db.market_snapshots.find({"marketId": marketId}, {"_id": 0}).to_list(50)
    order = {"Today": 0, "Yesterday": 1, "7 days ago": 2}
    snaps.sort(key=lambda s: order.get(s.get("label"), 99))
    return {"snapshots": snaps, "synthetic": True, "label": "Demo historical data"}

@api.post("/snapshots/capture")
async def snapshots_capture(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO"):
    pulse = await intelligence.compute_market_pulse(db, marketId, data_source=dataSource)
    if not pulse["products"]:
        return {"ok": False, "reason": "No signals to snapshot for this market/data source yet."}
    doc = await intelligence.capture_snapshot(db, marketId, dataSource)
    return {"ok": True, "snapshot": doc}

@api.get("/snapshots/history")
async def snapshots_history(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO"):
    cursor = db.snapshot_history.find({"marketId": marketId, "dataSource": dataSource}, {"_id": 0}).sort("capturedAt", -1).limit(14)
    history = await cursor.to_list(14)
    comparison = await intelligence.compare_snapshots(db, marketId, dataSource)
    return {"history": history, "comparison": comparison, "dataSource": dataSource}

AVAIL_SCORE = {"Good": 3, "Normal": 2, "Tight": 1, "Limited": 1, "Unknown": 0}

@api.get("/snapshots/trends")
async def snapshots_trends(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO", days: int = 7):
    cursor = db.snapshot_history.find({"marketId": marketId, "dataSource": dataSource}, {"_id": 0}).sort("capturedAt", 1).limit(200)
    snaps = await cursor.to_list(200)
    snaps = snaps[-days:] if len(snaps) > days else snaps
    series: Dict[str, list] = {}
    for s in snaps:
        date = s["capturedAt"][:10]
        for p in s.get("products", []):
            lo, hi = p.get("priceLow"), p.get("priceHigh")
            price_mid = round((lo + hi) / 2) if (lo is not None and hi is not None) else (lo if lo is not None else None)
            series.setdefault(p["product"], []).append({
                "date": date, "priceMid": price_mid, "availability": p.get("availability"),
                "availabilityScore": AVAIL_SCORE.get(p.get("availability"), 0),
                "reportedPriceSignal": p.get("reportedPriceSignal"),
            })
    return {"dataSource": dataSource, "synthetic": dataSource == "DEMO",
            "products": [{"product": k, "points": v} for k, v in series.items()]}

# ----------------------------- Pilot -----------------------------
@api.get("/pilot/metrics")
async def pilot_metrics():
    return {
        "setup": {"community": 1, "market": 1, "vendors": "10–15", "households": "20–50", "durationDays": 14},
        "metrics": [
            {"name": "Shopper activation", "target": "60% of onboarded households", "status": "Awaiting pilot data"},
            {"name": "Repeat usage (weekly)", "target": "2–4 visits/week", "status": "Awaiting pilot data"},
            {"name": "7-day retention", "target": "≥ 40%", "status": "Awaiting pilot data"},
            {"name": "Market Pulse views", "target": "1 per shopper per market day", "status": "Awaiting pilot data"},
            {"name": "Shopping-list queries", "target": "≥ 3 per active shopper/week", "status": "Awaiting pilot data"},
            {"name": "Vendor signal frequency", "target": "≥ 1 signal/vendor/day", "status": "Awaiting pilot data"},
            {"name": "Vendor retention", "target": "≥ 60% at day 14", "status": "Awaiting pilot data"},
            {"name": "Signal corroboration", "target": "≥ 3 sources per key product", "status": "Awaiting pilot data"},
            {"name": "Perceived usefulness", "target": "Qualitative interviews", "status": "Awaiting pilot data"},
            {"name": "Willingness to pay", "target": "Validate via interviews", "status": "Awaiting pilot data"},
        ],
    }

@api.post("/pilot/onboard/shopper")
async def onboard_shopper(req: OnboardShopper):
    if not req.consent:
        raise HTTPException(status_code=400, detail="Consent is required to join the pilot.")
    doc = {"id": str(uuid.uuid4()), "role": "shopper", **req.model_dump(), "createdAt": now_iso()}
    await db.pilot_participants.insert_one({**doc})
    doc.pop("_id", None)
    return {"ok": True, "participant": doc}

@api.post("/pilot/onboard/vendor")
async def onboard_vendor(req: OnboardVendor):
    if not req.consent:
        raise HTTPException(status_code=400, detail="Consent is required to join the pilot.")
    doc = {"id": str(uuid.uuid4()), "role": "vendor", **req.model_dump(), "createdAt": now_iso()}
    await db.pilot_participants.insert_one({**doc})
    doc.pop("_id", None)
    return {"ok": True, "participant": doc}

@api.get("/pilot/status")
async def pilot_status(marketId: str = DEFAULT_MARKET):
    households = await db.pilot_participants.count_documents({"role": "shopper"})
    vendors = await db.pilot_participants.count_documents({"role": "vendor"})
    pilot_signals = await db.market_signals.count_documents({"dataSource": "PILOT"})
    pilot_lists = await db.shopping_lists.count_documents({"dataSource": "PILOT"})
    pulse_views = await db.analytics_events.count_documents({"event": "market_pulse_viewed"})
    has_pilot = households > 0 or vendors > 0
    AWAIT = "Awaiting pilot data"
    return {
        "hasPilotData": has_pilot,
        "environment": "PILOT" if has_pilot else "DEMO",
        "target": {"households": "20–50", "vendors": "10–15", "durationDays": 14},
        "metrics": [
            {"name": "Households joined", "value": households, "display": households if has_pilot else AWAIT},
            {"name": "Vendors joined", "value": vendors, "display": vendors if has_pilot else AWAIT},
            {"name": "Signals contributed", "value": pilot_signals, "display": pilot_signals if has_pilot else AWAIT},
            {"name": "Shopping lists created", "value": pilot_lists, "display": pilot_lists if has_pilot else AWAIT},
            {"name": "Market Pulse views", "value": pulse_views, "display": pulse_views if has_pilot else AWAIT},
            {"name": "Vendor participation", "value": vendors, "display": f"{vendors} vendors" if has_pilot else AWAIT},
            {"name": "Signal corroboration", "value": pilot_signals, "display": f"{pilot_signals} signals" if has_pilot else AWAIT},
        ],
    }

class InviteCreate(BaseModel):
    community: str
    marketId: str = DEFAULT_MARKET

@api.post("/pilot/invite")
async def create_invite(req: InviteCreate):
    code = uuid.uuid4().hex[:12]
    doc = {"code": code, "community": req.community, "marketId": req.marketId, "createdAt": now_iso()}
    await db.pilot_invites.insert_one({**doc})
    return {"ok": True, **doc}

@api.get("/pilot/invite/{code}")
async def get_invite(code: str):
    inv = await db.pilot_invites.find_one({"code": code}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found")
    market = await db.markets.find_one({"id": inv["marketId"]}, {"_id": 0})
    inv["market"] = market or {"id": inv["marketId"], "name": "INA MARKET — BAZAARMIND DEMO"}
    return inv

# ----------------------------- WhatsApp (integration-ready) -----------------------------
@api.get("/whatsapp/status")
async def whatsapp_status():
    return whatsapp_service.status()

@api.get("/whatsapp/webhook")
async def whatsapp_verify(request: Request):
    if not whatsapp_service.verify_ready():
        raise HTTPException(status_code=503, detail="verify token not configured")
    params = request.query_params
    challenge = whatsapp_service.verify_challenge(
        params.get("hub.mode", ""), params.get("hub.verify_token", ""), params.get("hub.challenge", ""))
    if challenge is not None:
        return PlainTextResponse(content=challenge, status_code=200)
    raise HTTPException(status_code=403, detail="verification failed")

@api.post("/whatsapp/webhook")
async def whatsapp_inbound(request: Request):
    if not whatsapp_service.is_configured():
        raise HTTPException(status_code=503, detail="integration ready — production credentials required")
    raw = await request.body()
    if not whatsapp_service.valid_signature(raw, request.headers.get("X-Hub-Signature-256")):
        raise HTTPException(status_code=401, detail="invalid signature")
    import json
    event = json.loads(raw)
    for from_number, text, wamid in whatsapp_service.extract_text_messages(event):
        existing = await db.messages.find_one({"wamid": wamid})
        if existing:
            continue
        await db.messages.insert_one({"id": str(uuid.uuid4()), "wamid": wamid, "conversationId": from_number,
                                      "direction": "inbound", "text": text, "channel": "whatsapp", "at": now_iso()})
        participant = await db.pilot_participants.find_one({"phone": from_number}) or await db.pilot_participants.find_one({"id": from_number})
        data_source = "PILOT" if participant else "DEMO"
        user_role = participant.get("role", "shopper") if participant else "shopper"
        market_id = participant.get("marketId", DEFAULT_MARKET) if participant else DEFAULT_MARKET
        result = await conversation.process_message(db, text, market_id, role=user_role, data_source=data_source)
        reply = result.get("reply", "")
        send = await whatsapp_service.send_text(from_number, reply)
        await db.messages.insert_one({"id": str(uuid.uuid4()), "conversationId": from_number, "direction": "outbound",
                                      "text": reply, "channel": "whatsapp", "sent": send.get("sent"), "at": now_iso()})
    return {"received": True}

# ----------------------------- Analytics -----------------------------
@api.post("/analytics/event")
async def analytics_event(evt: AnalyticsEvent):
    await db.analytics_events.insert_one({"id": str(uuid.uuid4()), "event": evt.event, "props": evt.props, "at": now_iso()})
    return {"ok": True}

@api.get("/analytics/summary")
async def analytics_summary():
    pipeline = [{"$group": {"_id": "$event", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    rows = await db.analytics_events.aggregate(pipeline).to_list(100)
    return {"events": [{"event": r["_id"], "count": r["count"]} for r in rows]}

# ----------------------------- Cron -----------------------------
async def _capture_all_snapshots():
    markets = await db.markets.find({}, {"_id": 0, "id": 1}).to_list(100)
    for m in markets:
        for src in ("DEMO", "PILOT"):
            try:
                pulse = await intelligence.compute_market_pulse(db, m["id"], data_source=src)
                if pulse["products"]:
                    await intelligence.capture_snapshot(db, m["id"], src)
            except Exception:
                logger.exception("snapshot capture failed for %s/%s", m["id"], src)

@api.post("/cron/capture-snapshot")
async def cron_capture_snapshot(background: BackgroundTasks, authorization: str = Header(None), x_webhook_id: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="unauthorized")
    token = authorization.split(" ", 1)[1]
    if not WEBHOOK_CRON_SECRET or token != WEBHOOK_CRON_SECRET:
        raise HTTPException(status_code=401, detail="unauthorized")
    background.add_task(_capture_all_snapshots)
    return {"ok": True, "accepted": True, "runId": x_webhook_id}

location_router = location_routes.build_router(db)
api.include_router(location_router)

stall_router = stall_routes.build_router(db)
api.include_router(stall_router)

app.include_router(api)

_raw_cors = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
_cors_origins = [origin.strip().rstrip("/") for origin in _raw_cors.split(",") if origin.strip()]
_cors_wildcard = "*" in _cors_origins

if all("localhost" in o or "127.0.0.1" in o for o in _cors_origins):
    logger.warning(
        "CORS_ORIGINS is set to localhost only (%s). "
        "Set CORS_ORIGINS to your Vercel frontend URL for production.",
        _raw_cors,
    )

app.add_middleware(
    CORSMiddleware,
    allow_credentials=not _cors_wildcard,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
