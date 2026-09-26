"""Synthetic demo dataset for BazaarMind.

Everything here is clearly-labelled SYNTHETIC demo data used to demonstrate the
product during founder pitches and live demos. It is generated as real MarketSignal
documents so the intelligence engine operates on the same shape it would use with
real pilot data.

No fabricated real-world traction, testimonials, users, or pilot results.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

DEMO_MARKET = {
    "id": "demo-ina",
    "name": "INA MARKET — BAZAARMIND DEMO",
    "area": "South Delhi, Delhi NCR",
    "community": "Green Meadows RWA (demo community)",
    "lat": 28.5687,
    "lng": 77.2094,
    "synthetic": True,
}

EXTRA_MARKETS = [
    {"id": "demo-sarojini", "name": "Sarojini Nagar Market", "area": "South West Delhi, Delhi NCR",
     "community": "Sarojini RWA (demo)", "lat": 28.5775, "lng": 77.1969, "synthetic": True},
    {"id": "demo-ghazipur", "name": "Ghazipur Mandi", "area": "East Delhi, Delhi NCR",
     "community": "Kondli RWA (demo)", "lat": 28.6255, "lng": 77.3255, "synthetic": True},
]

DEMO_VENDORS = [
    {"id": "v1", "name": "Ramesh Sabzi Wala", "stall": "Stall 3"},
    {"id": "v2", "name": "Sharma Fruits", "stall": "Stall 7"},
    {"id": "v3", "name": "Green Basket", "stall": "Stall 11"},
    {"id": "v4", "name": "Fresh Corner", "stall": "Stall 14"},
]

DEMO_PRODUCTS = [
    {"name": "Tomatoes", "hindi": "टमाटर"},
    {"name": "Onions", "hindi": "प्याज"},
    {"name": "Potatoes", "hindi": "आलू"},
    {"name": "Coriander", "hindi": "धनिया"},
    {"name": "Lemon", "hindi": "नींबू"},
    {"name": "Banana", "hindi": "केला"},
    {"name": "Apple", "hindi": "सेब"},
    {"name": "Chilli", "hindi": "हरी मिर्च"},
    {"name": "Ginger", "hindi": "अदरक"},
    {"name": "Carrots", "hindi": "गाजर"},
    {"name": "Spinach", "hindi": "पालक"},
]

# product -> (availability, demand, price_low, price_high, unit, vendor_obs, shopper_signals)
_SPEC = {
    "Tomatoes": ("LOW", "HIGH", 65, 72, "kg", 5, 8),
    "Onions": ("HIGH", "NORMAL", 30, 35, "kg", 4, 6),
    "Potatoes": ("HIGH", "NORMAL", 24, 28, "kg", 4, 5),
    "Coriander": ("LOW", "HIGH", 25, 30, "bunch", 4, 7),
    "Lemon": ("NORMAL", "NORMAL", 8, 10, "piece", 3, 4),
    "Banana": ("NORMAL", "NORMAL", 55, 60, "dozen", 3, 5),
    "Apple": ("NORMAL", "NORMAL", 140, 160, "kg", 3, 4),
    "Chilli": ("LOW", "HIGH", 80, 95, "kg", 3, 6),
    "Ginger": ("NORMAL", "NORMAL", 120, 140, "kg", 2, 4),
    "Carrots": ("HIGH", "NORMAL", 35, 40, "kg", 3, 3),
    "Spinach": ("LOW", "HIGH", 25, 30, "bunch", 3, 5),
}

_VENDOR_TEXTS = {
    "Tomatoes": [
        "Aaj tamatar thoda kam aaya hai aur rate 70 rupaye hai.",
        "Tomato supply is tight today, selling around 68 to 72.",
        "टमाटर आज कम आया है, 65 रुपये किलो चल रहा है।",
        "Stock is finishing fast for tomatoes today.",
    ],
    "Onions": [
        "Pyaz achha aaya hai aaj, 32 rupaye kilo.",
        "Onion supply is strong, 30 to 35 per kg.",
        "Good fresh onions in stock today.",
    ],
    "Potatoes": [
        "Aloo ka stock pura hai, 25 rupaye rate.",
        "Potatoes running smooth at 24 to 28 per kg.",
        "Fresh pahadi aloo arrived this morning.",
    ],
    "Coriander": [
        "Dhaniya thoda kam hai aaj, 25 ka ek gaddi.",
        "Coriander supply limited due to morning rain.",
        "धनिया आज बहुत कम आया है।",
    ],
    "Lemon": [
        "Nimbu 10 rupaye piece hai aaj.",
        "Fresh juicy lemons available at 8 to 10 each.",
    ],
    "Banana": [
        "Kela 60 rupaye darjan hai.",
        "Robusta bananas 55 to 60 per dozen, good ripeness.",
    ],
    "Apple": [
        "Shimla apple 150 rupaye kilo.",
        "Fresh apples in stock, 140 to 160.",
    ],
    "Chilli": [
        "Hari mirch tight hai aaj, rate 90 rupaye.",
        "Green chillies shortage today across stalls.",
    ],
    "Ginger": [
        "Adrak 130 rupaye kilo chal raha hai.",
        "Fresh washed ginger available.",
    ],
    "Carrots": [
        "Gajar ka supply achha hai, 38 rupaye.",
        "Fresh carrots plenty in stock.",
    ],
    "Spinach": [
        "Palak subah fresh aayi thi, ab thodi bachi hai.",
        "Palak limited availability today.",
    ],
}

def _iso(dt: datetime) -> str:
    return dt.isoformat()

def _build_signals() -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    signals = []

    for prod in DEMO_PRODUCTS:
        name = prod["name"]
        if name not in _SPEC:
            continue
        avail, demand, plo, phi, unit, vobs, sobs = _SPEC[name]
        texts = _VENDOR_TEXTS.get(name, [f"{name} observation."])

        # Vendor observation signals
        for i in range(vobs):
            vendor = DEMO_VENDORS[i % len(DEMO_VENDORS)]
            created = now - timedelta(hours=min(i * 1.2 + 0.3, 11))
            price_val = None
            if plo is not None:
                step = (phi - plo) / max(vobs - 1, 1)
                price_val = round(plo + i * step, 1)

            signals.append({
                "id": str(uuid.uuid4()),
                "marketId": DEMO_MARKET["id"],
                "vendorId": vendor["id"],
                "vendorName": vendor["name"],
                "product": name,
                "signalType": "PRICE_OBSERVATION" if price_val else "AVAILABILITY",
                "availability": avail,
                "reportedPrice": price_val,
                "priceUnit": unit,
                "quantity": None,
                "demandLevel": demand,
                "language": "HINDI" if i % 2 == 0 else "ENGLISH",
                "rawText": texts[i % len(texts)],
                "imageUrl": None,
                "source": "VENDOR",
                "confidence": "HIGH" if i < 3 else "MEDIUM",
                "reasoning": "Demonstration vendor observation signal.",
                "createdAt": _iso(created),
                "expiresAt": _iso(created + timedelta(hours=14)),
                "status": "confirmed",
                "corroborationCount": vobs,
                "synthetic": True,
                "dataSource": "DEMO",
            })

        # Shopper demand signals
        for j in range(sobs):
            created = now - timedelta(hours=min(j * 0.8 + 0.2, 10))
            qty_str = f"{j + 1} kg" if unit == "kg" else (f"{j + 1} bunch" if unit == "bunch" else None)
            signals.append({
                "id": str(uuid.uuid4()),
                "marketId": DEMO_MARKET["id"],
                "vendorId": None,
                "vendorName": None,
                "product": name,
                "signalType": "DEMAND",
                "availability": None,
                "reportedPrice": None,
                "priceUnit": None,
                "quantity": qty_str,
                "demandLevel": demand,
                "language": "HINGLISH",
                "rawText": f"Mujhe {name.lower()} chahiye {qty_str or ''}".strip(),
                "imageUrl": None,
                "source": "SHOPPER",
                "confidence": "MEDIUM",
                "reasoning": "Synthetic demonstration shopper demand signal.",
                "createdAt": _iso(created),
                "expiresAt": _iso(created + timedelta(hours=12)),
                "status": "confirmed",
                "corroborationCount": sobs,
                "synthetic": True,
                "dataSource": "DEMO",
            })

    return signals

def _build_snapshots() -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "snap-today", "marketId": DEMO_MARKET["id"], "label": "Today",
            "capturedAt": _iso(now), "synthetic": True, "dataSource": "DEMO",
            "changes": [
                {"product": "Tomatoes", "field": "availability", "from": "Normal", "to": "Tight"},
                {"product": "Coriander", "field": "demand", "from": "Normal", "to": "Elevated"},
                {"product": "Chilli", "field": "availability", "from": "Normal", "to": "Tight"},
            ],
        },
        {
            "id": "snap-yesterday", "marketId": DEMO_MARKET["id"], "label": "Yesterday",
            "capturedAt": _iso(now - timedelta(days=1)), "synthetic": True, "dataSource": "DEMO",
            "changes": [
                {"product": "Onions", "field": "price", "from": "₹28/kg", "to": "₹32/kg"},
                {"product": "Spinach", "field": "availability", "from": "Good", "to": "Limited"},
            ],
        },
    ]

_AVAIL_DISP = {"HIGH": "Good", "NORMAL": "Normal", "LOW": "Tight", "UNKNOWN": "Unknown"}
_DEMAND_DISP = {"HIGH": "Elevated", "NORMAL": "Normal", "LOW": "Low", "UNKNOWN": "Unknown"}

def _build_snapshot_history() -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    docs = []
    for d in range(6, -1, -1):
        i = 6 - d
        captured = now - timedelta(days=d, hours=2)
        products = []
        for prod in DEMO_PRODUCTS:
            name = prod["name"]
            if name not in _SPEC:
                continue
            avail, demand, plo, phi, unit, vobs, sobs = _SPEC[name]
            factor = 1.0 + (i - 3) * 0.03
            lo = round(plo * factor) if plo is not None else None
            hi = round(phi * factor) if phi is not None else None
            av = avail
            if name == "Tomatoes":
                av = "NORMAL" if i < 4 else "LOW"
            elif name == "Coriander":
                av = "NORMAL" if i < 5 else "LOW"
            price_signal = (f"₹{lo}/{unit}" if lo == hi else f"₹{lo}–₹{hi}/{unit}") if lo is not None else None
            products.append({
                "product": name, "availability": _AVAIL_DISP.get(av, "Unknown"),
                "demand": _DEMAND_DISP.get(demand, "Normal"), "reportedPriceSignal": price_signal,
                "priceLow": lo, "priceHigh": hi, "confidence": "Medium",
                "signalCount": vobs + sobs, "vendorObservations": vobs, "shopperSignals": sobs,
            })
        docs.append({
            "id": f"{DEMO_MARKET['id']}-DEMO-hist-{i}", "marketId": DEMO_MARKET["id"],
            "dataSource": "DEMO", "capturedAt": captured.isoformat(),
            "overallConfidence": "Medium", "totalSignals": 88, "products": products,
        })
    return docs

async def seed_if_empty(db):
    # Ensure demo market has the canonical demonstration name
    await db.markets.update_one(
        {"id": DEMO_MARKET["id"]},
        {"$set": {**DEMO_MARKET}},
        upsert=True
    )
    for m in EXTRA_MARKETS:
        await db.markets.update_one({"id": m["id"]}, {"$set": m}, upsert=True)

    # Seed vendors
    existing_vendors = await db.vendors.count_documents({"marketId": DEMO_MARKET["id"]})
    if existing_vendors == 0:
        await db.vendors.insert_many([
            {**v, "marketId": DEMO_MARKET["id"]}
            for v in DEMO_VENDORS
        ])

    demo_filter = {
        "marketId": DEMO_MARKET["id"],
        "dataSource": "DEMO",
        "synthetic": True,
    }
    now = datetime.now(timezone.utc)
    active_demo = await db.market_signals.count_documents({
        **demo_filter,
        "status": "confirmed",
        "expiresAt": {"$gt": _iso(now)},
    })
    if active_demo == 0:
        await db.market_signals.delete_many(demo_filter)
        await db.market_signals.insert_many(_build_signals())

    snap_count = await db.market_snapshots.count_documents({"dataSource": "DEMO"})
    if snap_count == 0:
        await db.market_snapshots.insert_many(_build_snapshots())

    hist_count = await db.snapshot_history.count_documents({"dataSource": "DEMO"})
    if hist_count == 0:
        await db.snapshot_history.insert_many(_build_snapshot_history())

async def reset_demo(db):
    """Safely reset the demo market state to pristine demo values without touching PILOT/LIVE data."""
    demo_filter = {
        "marketId": DEMO_MARKET["id"],
        "dataSource": "DEMO",
        "synthetic": True,
    }
    await db.market_signals.delete_many(demo_filter)
    new_signals = _build_signals()
    await db.market_signals.insert_many(new_signals)
    await db.market_snapshots.delete_many({"marketId": DEMO_MARKET["id"], "dataSource": "DEMO"})
    await db.market_snapshots.insert_many(_build_snapshots())
    await db.snapshot_history.delete_many({"marketId": DEMO_MARKET["id"], "dataSource": "DEMO"})
    await db.snapshot_history.insert_many(_build_snapshot_history())
    await db.markets.update_one({"id": DEMO_MARKET["id"]}, {"$set": {**DEMO_MARKET}}, upsert=True)
    return {"ok": True, "reset": True, "market": DEMO_MARKET["name"], "signals": len(new_signals)}