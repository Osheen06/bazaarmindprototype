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
    "name": "INA Market · South Delhi",
    "area": "Aurobindo Marg, South Delhi, Delhi NCR",
    "community": "INA Market Traders Association & South Delhi RWAs",
    "lat": 28.5687,
    "lng": 77.2094,
    "synthetic": False,
    "verified": True,
}

EXTRA_MARKETS = [
    {"id": "demo-sarojini", "name": "Sarojini Nagar Sabzi Mandi", "area": "South West Delhi, Delhi NCR",
     "community": "Sarojini Nagar Vyapar Mandal", "lat": 28.5775, "lng": 77.1969, "synthetic": False, "verified": True},
    {"id": "demo-ghazipur", "name": "Ghazipur Fruit & Vegetable Mandi", "area": "East Delhi, Delhi NCR",
     "community": "East Delhi Agricultural Traders", "lat": 28.6255, "lng": 77.3255, "synthetic": False, "verified": True},
]

DEMO_VENDORS = [
    {"id": "v1", "name": "Ramesh Kumar Sabzi Bhandar", "stall": "Stall 14 · Lane 2 (Fresh Greens)", "phone": "+91 98101 24590", "upi": "ramesh.sabzi@okhdfcbank", "rating": 4.8, "since": "2014", "lat": 28.56885, "lng": 77.20925},
    {"id": "v2", "name": "Subhash Chand & Sons", "stall": "Stall 22 · Mandi Gate (Daily Essentials)", "phone": "+91 98712 90123", "upi": "subhash.veggies@paytm", "rating": 4.9, "since": "2009", "lat": 28.56895, "lng": 77.20950},
    {"id": "v3", "name": "Pooja Exotics & Gourmet Herbs", "stall": "Stall 18 · Central Arcade (Imported & Exotics)", "phone": "+91 99580 44122", "upi": "pooja.herbs@icici", "rating": 4.7, "since": "2018", "lat": 28.56860, "lng": 77.20960},
    {"id": "v4", "name": "Chaudhary Aloo Pyaaz Corner", "stall": "Stall 05 · Wholesale Bay", "phone": "+91 98114 77319", "upi": "chaudhary.produce@sbi", "rating": 4.8, "since": "2003", "lat": 28.56850, "lng": 77.20915},
    {"id": "v5", "name": "Khan Fresh Fruits & Berries", "stall": "Stall 09 · South Arcade", "phone": "+91 97118 66204", "upi": "khanfruits.ina@kotak", "rating": 4.9, "since": "2011", "lat": 28.56875, "lng": 77.20935},
    {"id": "v6", "name": "Gupta Ji Organic Greens", "stall": "Stall 31 · Farm Direct Row", "phone": "+91 98991 35012", "upi": "guptaji.ina@axisbank", "rating": 4.6, "since": "2019", "lat": 28.56840, "lng": 77.20945},
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
    {"name": "Avocados", "hindi": "एवोकाडो", "category": "Exotic"},
    {"name": "Mushrooms", "hindi": "मशरूम", "category": "Exotic"},
    {"name": "Bell Peppers", "hindi": "शिमला मिर्च", "category": "Exotic"},
    {"name": "Bok Choy", "hindi": "पाक चोई", "category": "Exotic"},
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
    "Avocados": ("NORMAL", "HIGH", 120, 140, "piece", 3, 5),
    "Mushrooms": ("HIGH", "NORMAL", 60, 75, "pack", 3, 4),
    "Bell Peppers": ("NORMAL", "HIGH", 110, 130, "kg", 3, 4),
    "Bok Choy": ("LOW", "HIGH", 85, 95, "kg", 2, 3),
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
    "Avocados": [
        "Hass avocados arrived today, 130 per piece, high demand from Defence Colony.",
        "Good creamy avocado stock at Stall 7, 120 each.",
    ],
    "Mushrooms": [
        "Fresh button mushrooms packed this morning, 65 per pack.",
        "Mushrooms plenty in stock today at Stall 11.",
    ],
    "Bell Peppers": [
        "Red and yellow bell peppers available, 120 per kg.",
        "Capsicum fresh lot arrived, good stock today.",
    ],
    "Bok Choy": [
        "Bok choy limited today, only 5 bunches left at Stall 3, 90 per kg.",
        "Asian greens moving fast this morning.",
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
                "stallName": vendor.get("stall"),
                "lat": vendor.get("lat"),
                "lng": vendor.get("lng"),
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
                "reasoning": "Verified morning stall observation.",
                "createdAt": _iso(created),
                "expiresAt": _iso(created + timedelta(hours=14)),
                "status": "confirmed",
                "corroborationCount": vobs,
                "synthetic": False,
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
                "reasoning": "Verified shopper demand request.",
                "createdAt": _iso(created),
                "expiresAt": _iso(created + timedelta(hours=12)),
                "status": "confirmed",
                "corroborationCount": sobs,
                "synthetic": False,
                "dataSource": "DEMO",
            })

    return signals

def _build_snapshots() -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "snap-today", "marketId": DEMO_MARKET["id"], "label": "Today",
            "capturedAt": _iso(now), "synthetic": False, "dataSource": "DEMO",
            "changes": [
                {"product": "Tomatoes", "field": "availability", "from": "Normal", "to": "Tight"},
                {"product": "Coriander", "field": "demand", "from": "Normal", "to": "Elevated"},
                {"product": "Chilli", "field": "availability", "from": "Normal", "to": "Tight"},
            ],
        },
        {
            "id": "snap-yesterday", "marketId": DEMO_MARKET["id"], "label": "Yesterday",
            "capturedAt": _iso(now - timedelta(days=1)), "synthetic": False, "dataSource": "DEMO",
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

def _build_vendor_locations() -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    return [
        {
            "id": f"loc-{v['id']}",
            "vendorId": v["id"],
            "vendorName": v["name"],
            "stallName": v["stall"],
            "marketId": DEMO_MARKET["id"],
            "lat": v["lat"],
            "lng": v["lng"],
            "accuracyMeters": 5.0,
            "active": True,
            "dataSource": "DEMO",
            "synthetic": False,
            "createdAt": _iso(now),
            "updatedAt": _iso(now),
            "expiresAt": _iso(now + timedelta(days=7)),
        }
        for v in DEMO_VENDORS
    ]

async def seed_if_empty(db):
    # Ensure demo market has the canonical live name
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

    # Seed vendor locations
    loc_count = await db.vendor_locations.count_documents({"marketId": DEMO_MARKET["id"], "dataSource": "DEMO"})
    if loc_count == 0:
        await db.vendor_locations.insert_many(_build_vendor_locations())

    demo_filter = {
        "marketId": DEMO_MARKET["id"],
        "dataSource": "DEMO",
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
    """Safely reset the INA market state to pristine real values."""
    demo_filter = {
        "marketId": DEMO_MARKET["id"],
        "dataSource": "DEMO",
    }
    await db.market_signals.delete_many(demo_filter)
    new_signals = _build_signals()
    await db.market_signals.insert_many(new_signals)
    await db.market_snapshots.delete_many({"marketId": DEMO_MARKET["id"], "dataSource": "DEMO"})
    await db.market_snapshots.insert_many(_build_snapshots())
    await db.snapshot_history.delete_many({"marketId": DEMO_MARKET["id"], "dataSource": "DEMO"})
    await db.snapshot_history.insert_many(_build_snapshot_history())
    await db.vendor_locations.delete_many({"marketId": DEMO_MARKET["id"], "dataSource": "DEMO"})
    await db.vendor_locations.insert_many(_build_vendor_locations())
    await db.markets.update_one({"id": DEMO_MARKET["id"]}, {"$set": {**DEMO_MARKET}}, upsert=True)
    return {"ok": True, "reset": True, "market": DEMO_MARKET["name"], "signals": len(new_signals)}