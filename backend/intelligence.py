"""BazaarMind deterministic market intelligence engine.

Aggregates structured market signals into an evidence-backed Market Pulse.
Gemini interprets unstructured human inputs into signals; this engine computes
availability, demand, observed price ranges, source diversity, and confidence.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import statistics
import logging

from gemini_service import CANONICAL_PRODUCTS

logger = logging.getLogger(__name__)

AVAILABILITY_DISPLAY = {
    "HIGH": "Good",
    "NORMAL": "Normal",
    "LOW": "Tight",
    "UNKNOWN": "Unknown",
}

DEMAND_DISPLAY = {
    "HIGH": "Elevated",
    "NORMAL": "Normal",
    "LOW": "Low",
    "UNKNOWN": "Unknown",
}

def _now() -> datetime:
    return datetime.now(timezone.utc)

def _parse_dt(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None

def _minutes_ago(dt: Optional[datetime]) -> Optional[int]:
    if not dt:
        return None
    delta = _now() - dt
    return max(0, int(delta.total_seconds() // 60))

def _humanize_minutes(mins: Optional[int]) -> str:
    if mins is None:
        return "recently"
    if mins < 1:
        return "just now"
    if mins < 60:
        return f"{mins}m ago"
    hours = mins // 60
    if hours < 24:
        return f"{hours}h ago"
    return f"{hours // 24}d ago"

def _mode_or_last(items: List[str]) -> Optional[str]:
    if not items:
        return None
    try:
        return statistics.mode(items)
    except statistics.StatisticsError:
        return items[-1]

def _compute_price_range(prices: List[float], unit: Optional[str] = "kg") -> Optional[str]:
    if not prices:
        return None
    u = unit or "kg"
    p_min = round(min(prices))
    p_max = round(max(prices))
    if p_min == p_max:
        return f"₹{p_min}/{u}"
    return f"₹{p_min}–₹{p_max}/{u}"

def build_product_pulse(product: str, signals: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Build aggregated market evidence for a single produce item."""
    now_iso = _now().isoformat()
    # Filter active, non-expired signals
    active = [s for s in signals if s.get("status") == "confirmed" and s.get("expiresAt", "") > now_iso]
    if not active:
        return None

    vendor_signals = [s for s in active if s.get("source") == "VENDOR"]
    shopper_signals = [s for s in active if s.get("source") == "SHOPPER"]

    # Source diversity: count distinct independent stalls
    stalls = set()
    for s in vendor_signals:
        v_id = s.get("vendorId") or s.get("vendorName")
        if v_id:
            stalls.add(v_id)
    independent_vendor_count = max(len(stalls), 1 if vendor_signals else 0)

    # Availability aggregation
    avails = [s.get("availability") for s in vendor_signals if s.get("availability") and s.get("availability") != "UNKNOWN"]
    avail = _mode_or_last(avails) if avails else "NORMAL"

    # Conflicting conditions check
    conflicting = False
    conflict_note = None
    if len(set(avails)) > 1:
        if "LOW" in avails and ("HIGH" in avails or "NORMAL" in avails):
            conflicting = True
            conflict_note = "Different stalls report varying stock levels today."

    # Demand aggregation
    demands = [s.get("demandLevel") for s in shopper_signals if s.get("demandLevel") and s.get("demandLevel") != "UNKNOWN"]
    if not demands:
        demands = [s.get("demandLevel") for s in vendor_signals if s.get("demandLevel") and s.get("demandLevel") != "UNKNOWN"]
    demand = _mode_or_last(demands) if demands else "NORMAL"

    # Reported observed prices
    prices = [float(s["reportedPrice"]) for s in vendor_signals if s.get("reportedPrice") is not None]
    price_units = [s.get("priceUnit") for s in vendor_signals if s.get("priceUnit")]
    price_unit = _mode_or_last(price_units) or ("piece" if product == "Lemon" else ("dozen" if product == "Banana" else "kg"))
    price_signal = _compute_price_range(prices, price_unit)
    price_low = round(min(prices), 1) if prices else None
    price_high = round(max(prices), 1) if prices else None
    price_count = len(prices)

    # Explainable confidence calculation
    v_count = len(vendor_signals)
    s_count = len(shopper_signals)
    if v_count >= 3 and independent_vendor_count >= 2:
        conf = "HIGH"
    elif v_count >= 1 or s_count >= 2:
        conf = "MEDIUM"
    else:
        conf = "EARLY SIGNAL"

    # Freshness
    dts = [_parse_dt(s.get("createdAt")) for s in active if _parse_dt(s.get("createdAt"))]
    recent_dt = max(dts) if dts else None
    recent_mins = _minutes_ago(recent_dt)
    is_stale = recent_mins is not None and recent_mins > 720  # older than 12h
    stale_warning = "Evidence is older than 12 hours. Stalls may have new arrivals." if is_stale else None

    # Embedded evidence signals for complete traceability
    sorted_active = sorted(active, key=lambda s: s.get("createdAt") or "", reverse=True)
    evidence_items = []
    for s in sorted_active[:15]:
        s_dt = _parse_dt(s.get("createdAt"))
        s_mins = _minutes_ago(s_dt)
        src = s.get("source", "VENDOR")
        
        if src == "VENDOR":
            val_parts = []
            if s.get("reportedPrice"):
                u = s.get("priceUnit") or price_unit
                val_parts.append(f"₹{round(s['reportedPrice'])}/{u}")
            if s.get("availability"):
                val_parts.append(f"Availability: {AVAILABILITY_DISPLAY.get(s['availability'], s['availability'])}")
            obs_val = " · ".join(val_parts) if val_parts else "Stall observation"
        else:
            qty = s.get("quantity")
            obs_val = f"{qty} requested" if qty else "Shopper demand"

        evidence_items.append({
            "id": s.get("id"),
            "source": src,
            "sourceLabel": "Vendor observation" if src == "VENDOR" else "Shopper demand",
            "observedValue": obs_val,
            "reportedPrice": s.get("reportedPrice"),
            "priceUnit": s.get("priceUnit"),
            "availability": s.get("availability"),
            "rawText": s.get("rawText", ""),
            "confidence": s.get("confidence", "MEDIUM"),
            "timestamp": s.get("createdAt"),
            "timeAgo": _humanize_minutes(s_mins),
            "dataSource": s.get("dataSource", "DEMO"),
            "vendorName": s.get("vendorName") if src == "VENDOR" else None,
        })

    return {
        "product": product,
        "availability": AVAILABILITY_DISPLAY.get(avail, "Unknown"),
        "availabilityCode": avail or "UNKNOWN",
        "demand": DEMAND_DISPLAY.get(demand, "Normal"),
        "demandCode": demand or "NORMAL",
        "reportedPriceSignal": price_signal,
        "priceLow": price_low,
        "priceHigh": price_high,
        "priceUnit": price_unit,
        "priceObservationCount": price_count,
        "vendorObservations": v_count,
        "independentVendors": independent_vendor_count,
        "independentStallsCount": independent_vendor_count,
        "shopperSignals": s_count,
        "signalCount": len(active),
        "confidence": conf,
        "conflicting": conflicting,
        "conflictNote": conflict_note,
        "isStale": is_stale,
        "staleWarning": stale_warning,
        "lastUpdatedMinutes": recent_mins,
        "lastUpdated": _humanize_minutes(recent_mins),
        "evidence": evidence_items,
        "evidenceSignals": evidence_items,
    }

def _overall_confidence(products: List[Dict[str, Any]]) -> str:
    if not products:
        return "Early signal"
    high_count = sum(1 for p in products if p.get("confidence") == "HIGH")
    if high_count >= len(products) * 0.5:
        return "High"
    if any(p.get("confidence") in ("HIGH", "MEDIUM") for p in products):
        return "Medium"
    return "Early signal"

async def compute_market_pulse(db, market_id: str, data_source: Optional[str] = "DEMO") -> Dict[str, Any]:
    """Compute living market pulse for a given market from persisted database signals."""
    query: Dict[str, Any] = {
        "marketId": market_id,
        "status": "confirmed",
    }
    if data_source in ("DEMO", "PILOT", "REAL"):
        query["dataSource"] = data_source

    projection = {
        "_id": 0,
        "id": 1,
        "marketId": 1,
        "product": 1,
        "status": 1,
        "source": 1,
        "vendorId": 1,
        "vendorName": 1,
        "availability": 1,
        "demandLevel": 1,
        "reportedPrice": 1,
        "priceUnit": 1,
        "quantity": 1,
        "rawText": 1,
        "confidence": 1,
        "createdAt": 1,
        "expiresAt": 1,
        "dataSource": 1,
    }
    cursor = db.market_signals.find(query, projection=projection).sort("createdAt", -1)
    signals = await cursor.to_list(5000)

    by_product: Dict[str, List[Dict[str, Any]]] = {}
    for s in signals:
        by_product.setdefault(s.get("product"), []).append(s)

    products = []
    for product in CANONICAL_PRODUCTS:
        pulse = build_product_pulse(product, by_product.get(product, []))
        if pulse:
            products.append(pulse)

    # Any non-canonical items with signals
    for product, sigs in by_product.items():
        if product not in CANONICAL_PRODUCTS:
            pulse = build_product_pulse(product, sigs)
            if pulse:
                products.append(pulse)

    last_dts = [_parse_dt(s.get("createdAt")) for s in signals if _parse_dt(s.get("createdAt"))]
    last_updated = max(last_dts) if last_dts else None
    recent_mins = _minutes_ago(last_updated)

    v_obs = sum(p.get("vendorObservations", 0) for p in products)
    s_sig = sum(p.get("shopperSignals", 0) for p in products)

    return {
        "marketId": market_id,
        "products": products,
        "overallConfidence": _overall_confidence(products),
        "totalSignals": len(signals),
        "activeSignalsCount": len(signals),
        "vendorObservationsCount": v_obs,
        "shopperSignalsCount": s_sig,
        "lastUpdated": _humanize_minutes(recent_mins),
        "freshness": "Active today" if (recent_mins is None or recent_mins < 720) else "Stale (last updated > 12h ago)",
        "isStale": recent_mins is not None and recent_mins > 720,
        "generatedAt": _now().isoformat(),
        "synthetic": data_source == "DEMO",
        "dataSource": data_source or "DEMO",
    }

def build_pulse_context(pulse: Dict[str, Any], market_name: str) -> str:
    """Compact textual evidence used to ground Ask BazaarMind answers."""
    source = pulse.get("dataSource", "DEMO")
    source_label = "synthetic DEMO signals" if source == "DEMO" else f"{source} signals"
    lines = [
        f"Market: {market_name} (Delhi NCR). Evidence source: {source_label}. Overall confidence: {pulse['overallConfidence']}."
    ]
    for p in pulse["products"]:
        price = p["reportedPriceSignal"] or "no price reported"
        lines.append(
            f"- {p['product']}: availability {p['availability']}, demand {p['demand']}, "
            f"reported price signal {price}, evidence {p['vendorObservations']} vendor observations "
            f"({p.get('independentVendors', 1)} independent vendors) + {p['shopperSignals']} shopper signals, confidence {p['confidence']}"
            + (", vendors reporting conflicting conditions" if p.get('conflicting') else "")
            + f", updated {p['lastUpdated']}."
        )
    return "\n".join(lines)
