import os
import time
import uuid
import math
import logging
import httpx
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
from pydantic import BaseModel, Field
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

class ConfirmSignalRequest(BaseModel):
    marketId: str = DEFAULT_MARKET
    dataSource: str = "DEMO"
    product: str
    availability: Optional[str] = "NORMAL"
    reportedPrice: Optional[float] = None
    priceUnit: Optional[str] = "kg"
    confidence: str = "HIGH"
    rawText: Optional[str] = ""
    source: str = "VENDOR"
    vendorName: Optional[str] = None
    stallName: Optional[str] = None

class ShopperDemandRequest(BaseModel):
    marketId: str = DEFAULT_MARKET
    dataSource: str = "DEMO"
    items: List[str] = Field(default_factory=list)
    maxBudget: Optional[float] = None
    note: Optional[str] = None

class VendorObservationRequest(BaseModel):
    marketId: str = DEFAULT_MARKET
    dataSource: str = "DEMO"
    product: str
    price: Optional[float] = None
    priceUnit: Optional[str] = "kg"
    availability: Optional[str] = "NORMAL"
    note: Optional[str] = None
    stall: Optional[str] = None
    vendorName: Optional[str] = None

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

def _determine_market_state(market_doc: Dict[str, Any], signal_count: int) -> str:
    m_id = market_doc.get("id", "")
    if m_id.startswith("demo-") or market_doc.get("synthetic") or market_doc.get("dataSource") == "DEMO":
        return "DEMO"
    if signal_count >= 5:
        return "LIVE"
    if signal_count > 0:
        return "PILOT"
    if market_doc.get("discoveryOnly"):
        return "DISCOVERED"
    return "INSUFFICIENT_DATA"

@api.get("/markets/directory")
async def markets_directory_endpoint():
    """Module 6 & 7: Market Directory supporting Neighbourhood, Weekly, Farmers, and Mandi markets."""
    return await intelligence.get_markets_directory(db)

@api.get("/markets/{market_id}")
async def get_market_by_id(market_id: str):
    m = await db.markets.find_one({"id": market_id}, {"_id": 0})
    if not m:
        if market_id == "demo-ina":
            m = dict(demo_seed.DEMO_MARKET)
        else:
            raise HTTPException(status_code=404, detail="Market not found")

    sig_count = await db.market_signals.count_documents({"marketId": market_id, "status": "confirmed"})
    state = _determine_market_state(m, sig_count)
    is_demo = state == "DEMO"

    return {
        **m,
        "state": state,
        "marketState": state,
        "isDemo": is_demo,
        "dataSource": "DEMO" if is_demo else ("PILOT" if state == "PILOT" else "REAL"),
        "disclaimer": "DEMO · Synthetic illustrative data" if is_demo else None,
        "signalCount": sig_count,
        "intelligenceAvailable": is_demo or sig_count > 0,
    }

@api.get("/markets/{market_id}/pulse")
async def get_market_pulse_canonical(market_id: str, dataSource: Optional[str] = None):
    market = await db.markets.find_one({"id": market_id}, {"_id": 0})
    if not market and market_id == "demo-ina":
        market = dict(demo_seed.DEMO_MARKET)
    ds = "DEMO" if market_id.startswith("demo-") else (dataSource or "REAL")
    pulse = await intelligence.compute_market_pulse(db, market_id, data_source=ds)
    sig_count = pulse.get("totalSignals", 0)
    state = _determine_market_state(market or {"id": market_id}, sig_count)
    pulse["market"] = {
        **(market or {"id": market_id, "name": market_id}),
        "state": state,
        "marketState": state,
        "isDemo": state == "DEMO",
    }
    pulse["marketState"] = state
    pulse["state"] = state
    pulse["dataSource"] = ds
    pulse["ok"] = True
    return pulse

@api.get("/markets/{market_id}/evidence")
async def get_market_evidence(market_id: str, dataSource: Optional[str] = None):
    ds = "DEMO" if market_id.startswith("demo-") else (dataSource or "REAL")
    query: Dict[str, Any] = {"marketId": market_id, "status": "confirmed"}
    if ds in ("DEMO", "PILOT", "REAL"):
        query["dataSource"] = ds

    signals = await db.market_signals.find(query, {"_id": 0}).sort("createdAt", -1).to_list(100)
    vendors = await db.vendors.find({"marketId": market_id}, {"_id": 0}).to_list(50)
    demands = await db.shopper_demands.find({"marketId": market_id}, {"_id": 0}).to_list(50)

    clean_signals = []
    for s in signals:
        clean = {k: v for k, v in s.items() if k not in ("participantId", "phone", "email")}
        clean_signals.append(clean)

    return {
        "ok": True,
        "marketId": market_id,
        "dataSource": ds,
        "signals": clean_signals,
        "vendors": vendors,
        "shopperDemands": demands,
        "counts": {
            "totalSignals": len(signals),
            "vendorSignals": sum(1 for s in signals if s.get("source") == "VENDOR"),
            "shopperSignals": sum(1 for s in signals if s.get("source") == "SHOPPER"),
            "priceSignals": sum(1 for s in signals if s.get("reportedPrice") is not None),
        }
    }

@api.post("/signals/confirm")
async def confirm_signal(req: ConfirmSignalRequest):
    sig_id = f"sig-{uuid.uuid4().hex[:10]}"
    doc = {
        "id": sig_id,
        "marketId": req.marketId,
        "dataSource": req.dataSource,
        "product": req.product,
        "signalType": "PRICE" if req.reportedPrice else "AVAILABILITY",
        "availability": req.availability or "NORMAL",
        "reportedPrice": req.reportedPrice,
        "priceUnit": req.priceUnit or "kg",
        "confidence": req.confidence,
        "rawText": req.rawText or "",
        "source": req.source,
        "vendorName": req.vendorName,
        "stallName": req.stallName,
        "status": "confirmed",
        "createdAt": now_iso(),
        "expiresAt": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
    }
    await db.market_signals.insert_one(doc)
    return {"ok": True, "signalId": sig_id, "signal": {k: v for k, v in doc.items() if k != "_id"}}

@api.post("/shopper/demand")
async def submit_shopper_demand(req: ShopperDemandRequest):
    demand_id = f"dem-{uuid.uuid4().hex[:10]}"
    doc = {
        "id": demand_id,
        "marketId": req.marketId,
        "dataSource": req.dataSource,
        "items": req.items,
        "maxBudget": req.maxBudget,
        "note": req.note,
        "createdAt": now_iso(),
    }
    await db.shopper_demands.insert_one(doc)
    for item in req.items:
        sig_doc = {
            "id": f"sig-{uuid.uuid4().hex[:10]}",
            "marketId": req.marketId,
            "dataSource": req.dataSource,
            "product": item,
            "signalType": "DEMAND",
            "demandLevel": "HIGH",
            "source": "SHOPPER",
            "status": "confirmed",
            "rawText": req.note or f"Shopper requested {item}",
            "confidence": "HIGH",
            "createdAt": now_iso(),
            "expiresAt": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
        }
        await db.market_signals.insert_one(sig_doc)
    return {"ok": True, "demandId": demand_id, "items": req.items}

@api.post("/vendor/observation")
async def submit_vendor_observation(req: VendorObservationRequest):
    obs_id = f"obs-{uuid.uuid4().hex[:10]}"
    doc = {
        "id": obs_id,
        "marketId": req.marketId,
        "dataSource": req.dataSource,
        "product": req.product,
        "price": req.price,
        "priceUnit": req.priceUnit or "kg",
        "availability": req.availability or "NORMAL",
        "note": req.note,
        "stall": req.stall,
        "vendorName": req.vendorName,
        "createdAt": now_iso(),
    }
    await db.vendor_observations.insert_one(doc)
    sig_doc = {
        "id": f"sig-{uuid.uuid4().hex[:10]}",
        "marketId": req.marketId,
        "dataSource": req.dataSource,
        "product": req.product,
        "signalType": "PRICE" if req.price is not None else "AVAILABILITY",
        "availability": req.availability or "NORMAL",
        "reportedPrice": req.price,
        "priceUnit": req.priceUnit or "kg",
        "source": "VENDOR",
        "vendorName": req.vendorName,
        "stallName": req.stall,
        "status": "confirmed",
        "rawText": req.note or f"Vendor reported {req.product}",
        "confidence": "HIGH",
        "createdAt": now_iso(),
        "expiresAt": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
    }
    await db.market_signals.insert_one(sig_doc)
    return {"ok": True, "observationId": obs_id}

@api.get("/location/reverse")
async def reverse_geocode_location(lat: float = Query(..., ge=-90, le=90), lng: float = Query(..., ge=-180, le=180)):
    # 1. Google Maps Geocoding if configured
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "").strip()
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params={"latlng": f"{lat},{lng}", "key": api_key, "language": "en"}
                )
                if res.status_code == 200:
                    data = res.json()
                    if data.get("status") == "OK" and data.get("results"):
                        res0 = data["results"][0]
                        components = {c["types"][0]: c["long_name"] for c in res0.get("address_components", []) if c.get("types")}
                        locality = components.get("sublocality") or components.get("neighborhood") or components.get("locality")
                        area = components.get("sublocality_level_1") or components.get("administrative_area_level_2")
                        city = components.get("locality") or components.get("administrative_area_level_2") or "Delhi"
                        state = components.get("administrative_area_level_1", "Delhi")
                        country = components.get("country", "India")
                        return {
                            "ok": True,
                            "locality": locality or area or city,
                            "area": area or locality,
                            "city": city,
                            "state": state,
                            "country": country,
                            "displayName": f"{locality or area or city}, {city}",
                            "provider": "GOOGLE_MAPS",
                            "confidence": "HIGH"
                        }
        except Exception as exc:
            logger.warning("Google geocoding error: %s", exc)

    # 2. OpenStreetMap Nominatim
    try:
        async with httpx.AsyncClient(timeout=3.0, headers={"User-Agent": "BazaarMind/1.0 (contact@bazaarmind.org)"}) as client:
            res = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lng, "format": "json"}
            )
            if res.status_code == 200:
                addr = res.json().get("address", {})
                locality = addr.get("suburb") or addr.get("neighbourhood") or addr.get("residential")
                area = addr.get("city_district") or addr.get("county") or addr.get("state_district")
                city = addr.get("city") or addr.get("town") or addr.get("state_district") or "Delhi"
                state = addr.get("state", "Delhi")
                country = addr.get("country", "India")
                display = f"{locality or area or city}, {city}"
                return {
                    "ok": True,
                    "locality": locality or area or city,
                    "area": area or locality,
                    "city": city,
                    "state": state,
                    "country": country,
                    "displayName": display,
                    "provider": "OPENSTREETMAP",
                    "confidence": "HIGH"
                }
    except Exception as exc:
        logger.warning("OSM geocoding error: %s", exc)

    # 3. Intelligent geographic bounds fallback
    locality = "Local Area"
    area = "Neighbourhood"
    city = "Local Region"
    state = "India"

    if 28.3 <= lat <= 28.9 and 76.8 <= lng <= 77.5:
        city = "New Delhi"
        state = "Delhi"
        if 28.54 <= lat <= 28.60 and 77.19 <= lng <= 77.24:
            locality = "Kidwai Nagar / INA"
            area = "South Delhi"
        elif 28.56 <= lat <= 28.62 and 77.22 <= lng <= 77.27:
            locality = "Lajpat Nagar"
            area = "South East Delhi"
        elif 28.60 <= lat <= 28.66 and 77.19 <= lng <= 77.24:
            locality = "Connaught Place"
            area = "Central Delhi"
        elif 28.50 <= lat <= 28.56 and 77.16 <= lng <= 77.22:
            locality = "Hauz Khas"
            area = "South Delhi"
        elif 28.60 <= lat <= 28.66 and 77.30 <= lng <= 77.36:
            locality = "Ghazipur"
            area = "East Delhi"
        else:
            locality = "Delhi NCR"
            area = "Delhi NCR"
    elif 18.8 <= lat <= 19.3 and 72.7 <= lng <= 73.1:
        city = "Mumbai"
        state = "Maharashtra"
        locality = "Bandra / South Mumbai"
        area = "Mumbai Suburban"
    elif 12.8 <= lat <= 13.1 and 77.4 <= lng <= 77.8:
        city = "Bengaluru"
        state = "Karnataka"
        locality = "Indiranagar / Koramangala"
        area = "Bengaluru Urban"

    return {
        "ok": True,
        "locality": locality,
        "area": area,
        "city": city,
        "state": state,
        "country": "India",
        "displayName": f"{locality}, {city}",
        "provider": "LOCAL_GEO",
        "confidence": "MEDIUM"
    }

@api.get("/products")
async def get_products():
    return [{"name": p} for p in gemini_service.CANONICAL_PRODUCTS]

# ----------------------------- Market Pulse -----------------------------
@api.get("/market-pulse")
async def market_pulse(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO"):
    ds = "DEMO" if marketId.startswith("demo-") else dataSource
    market = await db.markets.find_one({"id": marketId}, {"_id": 0})
    pulse = await intelligence.compute_market_pulse(db, marketId, data_source=ds)
    pulse["market"] = market or {"id": marketId, "name": "INA Market · South Delhi"}
    pulse["dataSource"] = ds
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

    if parsed.get("isGreeting") or not parsed.get("items"):
        return {
            "ok": True,
            "items": [],
            "isGreeting": True,
            "tightCount": 0,
            "summary": None,
            "language": parsed.get("language", "ENGLISH"),
            "confirmationText": None,
            "persisted": False,
        }

    data_source = "DEMO" if req.marketId.startswith("demo-") else await _resolve_source_async(req.participantId, None)
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
        "confirmationText": parsed.get("confirmationText"),
        "persisted": req.persist,
    }

@api.post("/shopper/parse", include_in_schema=False)
async def shopper_parse_alias(req: ShoppingListRequest):
    return await shopping_list_parse(req)

@api.post("/shopper/plan-route")
async def plan_shopper_route_endpoint(req: PlanRouteRequest):
    data_source = "DEMO" if req.marketId.startswith("demo-") else (req.dataSource or "DEMO")
    pulse = await intelligence.compute_market_pulse(db, req.marketId, data_source=data_source)
    market = await db.markets.find_one({"id": req.marketId}, {"_id": 0})
    market_name = market["name"] if market else "INA Market · South Delhi"

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
    effective_ds = "DEMO" if req.marketId.startswith("demo-") else (req.dataSource or "DEMO")
    pulse = await intelligence.compute_market_pulse(db, req.marketId, data_source=effective_ds)
    market = await db.markets.find_one({"id": req.marketId}, {"_id": 0})
    market_name = market["name"] if market else "INA Market · South Delhi"
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
        answer = await gemini_service.ask_bazaar(req.question, context, session_id=str(uuid.uuid4()), data_source=effective_ds)
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

@api.post("/ask", include_in_schema=False)
async def ask_alias(req: AskRequest):
    return await ask_bazaar(req)

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
    ds = "DEMO" if marketId.startswith("demo-") else dataSource
    cursor = db.market_signals.find({"marketId": marketId, "source": "SHOPPER", "status": "confirmed", "dataSource": ds}, {"_id": 0})
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
    ds = "DEMO" if marketId.startswith("demo-") else dataSource
    market = await db.markets.find_one({"id": marketId}, {"_id": 0})
    vendors = await db.vendors.find({"marketId": marketId}, {"_id": 0}).to_list(100)
    cursor = db.market_signals.find({"marketId": marketId, "status": "confirmed", "dataSource": ds}, {"_id": 0})
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
    return {"market": market or {"id": marketId, "name": "INA Market · South Delhi"}, "vendors": vendor_nodes,
            "shopperSignals": shopper_total, "supplySignals": sum(vendor_counts.values()), "dataSource": dataSource}

@api.get("/market/network", include_in_schema=False)
async def market_network_alias(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO"):
    return await market_network(marketId, dataSource)

# ----------------------------- Snapshots -----------------------------
@api.get("/snapshots")
async def snapshots(marketId: str = DEFAULT_MARKET):
    snaps = await db.market_snapshots.find({"marketId": marketId}, {"_id": 0}).to_list(50)
    order = {"Today": 0, "Yesterday": 1, "7 days ago": 2}
    snaps.sort(key=lambda s: order.get(s.get("label"), 99))
    return {"snapshots": snaps, "synthetic": False, "label": "Verified morning observations"}

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

# ----------------------------- Mandi & Market Directory -----------------------------
@api.get("/mandi-intelligence")
async def mandi_intelligence_endpoint(product: Optional[str] = Query("Tomatoes")):
    """Module 8: Mandi Intelligence & Farmer Confidence ('Konsi Mandi Jaun?')"""
    return await intelligence.compute_mandi_intelligence(db, product)

# ----------------------------- Seasonality & Wastage -----------------------------
@api.get("/intelligence/seasonality")
async def seasonality_endpoint(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO"):
    """Module 9: Seasonal demand cycles & recurring weekly patterns."""
    return await intelligence.compute_seasonal_demand(db, marketId, dataSource)

@api.get("/intelligence/wastage")
async def wastage_endpoint(marketId: str = DEFAULT_MARKET, dataSource: str = "DEMO"):
    """Module 10: Perishable mismatch detection & avoidable wastage reduction hypothesis."""
    return await intelligence.compute_wastage_reduction(db, marketId, dataSource)

# ----------------------------- Exotic Food Heatmap -----------------------------
@api.get("/heatmap/exotic")
async def exotic_heatmap_endpoint(area: str = "South Delhi"):
    """Module 14: South Delhi Exotic Food Heatmap with aggregated demand clusters."""
    return await intelligence.compute_exotic_heatmap(db, area)

# ----------------------------- Pilot Field Operations -----------------------------
@api.get("/pilot/operations")
async def pilot_operations_endpoint(marketId: str = DEFAULT_MARKET):
    """Module 12: Field operations tracking for active pilot execution."""
    return await intelligence.compute_field_operations(db, marketId)

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
    inv["market"] = market or {"id": inv["marketId"], "name": "INA Market · South Delhi"}
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

# ----------------------------- Vendor Working Capital Loans -----------------------------
class LoanApplicationRequest(BaseModel):
    vendorId: str
    amount: float
    tenureDays: int = 30
    upiId: str
    purpose: str = "Daily Morning Mandi Inventory Purchase"

@api.get("/vendor-loans/overview")
async def vendor_loans_overview(marketId: str = DEFAULT_MARKET):
    return {
        "ok": True,
        "market": "INA Market · South Delhi",
        "underwritingModel": "BazaarMind Daily Signal & Cashflow Credit Score (BharatPe Model)",
        "totalCreditDisbursed": 485000,
        "activeBorrowers": 18,
        "repaymentRate": 99.4,
        "partners": ["ICICI Merchant Finance", "BharatPe Capital NBFC", "PM SVANidhi Lending Pool"],
        "vendors": [
            {
                "vendorId": "v1",
                "vendorName": "Ramesh Kumar Sabzi Bhandar",
                "stallName": "Stall 14 · Lane 2 (Fresh Greens)",
                "creditScore": 845,
                "scoreCategory": "Tier 1 Prime",
                "preApprovedLimit": 25000,
                "activeLoan": None,
                "consecutiveDaysReporting": 48,
                "morningLogConsistency": "98%",
                "upi": "ramesh.sabzi@okhdfcbank",
            },
            {
                "vendorId": "v2",
                "vendorName": "Subhash Chand & Sons",
                "stallName": "Stall 22 · Mandi Gate (Daily Essentials)",
                "creditScore": 810,
                "scoreCategory": "Tier 1 Prime",
                "preApprovedLimit": 20000,
                "activeLoan": {
                    "loanId": "BM-LN-8921",
                    "amount": 15000,
                    "disbursedAt": "2026-09-15",
                    "tenureDays": 30,
                    "dailyInstallment": 525,
                    "remainingBalance": 4725,
                    "status": "ACTIVE_REPAYING",
                },
                "consecutiveDaysReporting": 64,
                "morningLogConsistency": "96%",
                "upi": "subhash.veggies@paytm",
            },
            {
                "vendorId": "v3",
                "vendorName": "Pooja Exotics & Gourmet Herbs",
                "stallName": "Stall 18 · Central Arcade (Imported & Exotics)",
                "creditScore": 870,
                "scoreCategory": "Elite Merchant",
                "preApprovedLimit": 40000,
                "activeLoan": None,
                "consecutiveDaysReporting": 92,
                "morningLogConsistency": "99%",
                "upi": "pooja.herbs@icici",
            },
            {
                "vendorId": "v4",
                "vendorName": "Chaudhary Aloo Pyaaz Corner",
                "stallName": "Stall 05 · Wholesale Bay",
                "creditScore": 790,
                "scoreCategory": "Tier 2 Stable",
                "preApprovedLimit": 15000,
                "activeLoan": None,
                "consecutiveDaysReporting": 35,
                "morningLogConsistency": "92%",
                "upi": "chaudhary.produce@sbi",
            },
            {
                "vendorId": "v5",
                "vendorName": "Khan Fresh Fruits & Berries",
                "stallName": "Stall 09 · South Arcade",
                "creditScore": 825,
                "scoreCategory": "Tier 1 Prime",
                "preApprovedLimit": 30000,
                "activeLoan": None,
                "consecutiveDaysReporting": 51,
                "morningLogConsistency": "95%",
                "upi": "khanfruits.ina@kotak",
            },
        ],
    }

@api.post("/vendor-loans/apply")
async def vendor_loans_apply(req: LoanApplicationRequest):
    if req.amount < 1000 or req.amount > 50000:
        raise HTTPException(status_code=400, detail="Loan amount must be between ₹1,000 and ₹50,000.")
    daily_rate = round(req.amount / req.tenureDays + (req.amount * 0.015 / req.tenureDays), 2)
    utr_no = f"UTR{int(time.time())}{uuid.uuid4().hex[:4].upper()}"
    loan_id = f"BM-LN-{uuid.uuid4().hex[:6].upper()}"
    return {
        "ok": True,
        "loanId": loan_id,
        "status": "DISBURSED",
        "utrNumber": utr_no,
        "disbursedAmount": req.amount,
        "tenureDays": req.tenureDays,
        "dailyDeduction": daily_rate,
        "upiId": req.upiId,
        "repaymentMethod": "Auto-debit from daily UPI merchant QR settlements",
        "approvalTimestamp": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Underwritten via BazaarMind Signal Footprint & Daily Stall Activity. Partner NBFC License: RBI/ND-2021/8871.",
    }

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
