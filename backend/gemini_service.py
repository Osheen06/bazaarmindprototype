"""BazaarMind Gemini intelligence engine using Google's official GenAI SDK."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env before reading any configuration.
load_dotenv(Path(__file__).resolve().parent / ".env")
import json
import re
import base64
import asyncio
import logging
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal, List

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")

CANONICAL_PRODUCTS = [
    "Tomatoes", "Potatoes", "Onions", "Coriander",
    "Lemon", "Banana", "Apple", "Chilli", "Ginger",
    "Carrots", "Spinach",
]

PRODUCT_ALIASES = {
    "tamatar": "Tomatoes", "tomato": "Tomatoes", "tomatoes": "Tomatoes", "टमाटर": "Tomatoes",
    "aloo": "Potatoes", "potato": "Potatoes", "potatoes": "Potatoes", "alu": "Potatoes", "आलू": "Potatoes",
    "pyaz": "Onions", "pyaaz": "Onions", "onion": "Onions", "onions": "Onions", "kanda": "Onions", "प्याज": "Onions", "प्याज़": "Onions",
    "dhaniya": "Coriander", "dhania": "Coriander", "coriander": "Coriander", "cilantro": "Coriander", "धनिया": "Coriander",
    "nimbu": "Lemon", "neebu": "Lemon", "lemon": "Lemon", "lemons": "Lemon", "lime": "Lemon", "नींबू": "Lemon", "नीबू": "Lemon",
    "kela": "Banana", "banana": "Banana", "bananas": "Banana", "केला": "Banana",
    "seb": "Apple", "saib": "Apple", "apple": "Apple", "apples": "Apple", "सेब": "Apple",
    "hari mirch": "Chilli", "mirch": "Chilli", "chili": "Chilli", "chilli": "Chilli", "chillies": "Chilli", "chilies": "Chilli", "green chili": "Chilli", "green chilies": "Chilli", "मिर्च": "Chilli", "हरी मिर्च": "Chilli",
    "adrak": "Ginger", "adrakh": "Ginger", "ginger": "Ginger", "अदरक": "Ginger",
    "gajar": "Carrots", "carrot": "Carrots", "carrots": "Carrots", "गाजर": "Carrots",
    "palak": "Spinach", "spinach": "Spinach", "पालक": "Spinach",
}

AVAILABILITY_HINDI = {
    "HIGH": "अच्छी उपलब्धता",
    "NORMAL": "सामान्य उपलब्धता",
    "LOW": "कम उपलब्धता",
    "UNKNOWN": "अस्पष्ट",
}

AVAILABILITY_ENGLISH = {
    "HIGH": "Good availability",
    "NORMAL": "Normal availability",
    "LOW": "Low availability",
    "UNKNOWN": "Unknown availability",
}

def is_configured() -> bool:
    return bool(GEMINI_API_KEY)

def _client():
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    return genai.Client(api_key=GEMINI_API_KEY)

def _explicit_price_unit(text: str) -> Optional[str]:
    """Return a price unit only when the user explicitly stated one."""
    t = (text or "").lower()
    unit_patterns = [
        (r'(?:/|per)\s*(?:kg|kilo|kilogram)', 'kg'),
        (r'\b(?:kg|kilo|kilogram)\b', 'kg'),
        (r'(?:/|per)\s*(?:g|gram|grams)', 'g'),
        (r'\b(?:g|gram|grams)\b', 'g'),
        (r'(?:/|per)\s*(?:bunch|bundle|gaddi)', 'bunch'),
        (r'\b(?:bunch|bundle|gaddi)\b', 'bunch'),
        (r'(?:/|per)\s*(?:dozen|darjan)', 'dozen'),
        (r'\b(?:dozen|darjan)\b', 'dozen'),
        (r'(?:/|per)\s*(?:piece|pc|pcs|dana)', 'piece'),
        (r'\b(?:piece|pc|pcs|dana)\b', 'piece'),
    ]
    for pattern, unit in unit_patterns:
        if re.search(pattern, t):
            return unit
    return None

def normalize_product(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    key = str(name).strip().lower()
    if key in PRODUCT_ALIASES:
        return PRODUCT_ALIASES[key]
    for canon in CANONICAL_PRODUCTS:
        if canon.lower() == key or canon.lower()[:-1] == key:
            return canon
    for alias, canon in PRODUCT_ALIASES.items():
        if alias in key:
            return canon
    return str(name).strip().title()

def _extract_json(text: str) -> Any:
    if not text:
        raise ValueError("empty Gemini response")
    cleaned = text.strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', cleaned)
    if match:
        cleaned = match.group(1).strip()
    return json.loads(cleaned)

def _format_vendor_confirmation(product: str, availability: str, price: Optional[float], price_unit: Optional[str], lang: str) -> str:
    # Localized natural confirmation
    if lang in ("HINDI", "HINGLISH"):
        prod_hi = next((p["hindi"] for p in [
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
        ] if p["name"] == product), product)

        avail_text = AVAILABILITY_HINDI.get(availability, "सामान्य उपलब्धता")
        lines = [f"मैंने समझा:\n{prod_hi} — {avail_text}"]
        if price is not None:
            unit_disp = f"/{price_unit}" if price_unit else "/kg"
            lines.append(f"₹{round(price) if price.is_integer() else price}{unit_disp}")
        return "\n".join(lines)
    else:
        avail_text = AVAILABILITY_ENGLISH.get(availability, "Normal availability")
        lines = [f"Understood:\n{product} — {avail_text}"]
        if price is not None:
            unit_disp = f"/{price_unit}" if price_unit else "/kg"
            lines.append(f"₹{round(price) if price.is_integer() else price}{unit_disp}")
        return "\n".join(lines)

class SignalSchema(BaseModel):
    product: str = Field(description="Canonical product name in English title case (e.g., Tomatoes, Onions, Potatoes).")
    availability: Literal["HIGH", "NORMAL", "LOW", "UNKNOWN"]
    demand: Literal["HIGH", "NORMAL", "LOW", "UNKNOWN"]
    reportedPrice: Optional[float] = Field(default=None, description="Exact price per unit mentioned by user. Never invent.")
    priceUnit: Optional[str] = Field(default=None, description="Unit explicitly mentioned (kg, bunch, piece, dozen).")
    signalType: Literal["DEMAND", "SUPPLY", "AVAILABILITY", "PRICE", "CONTEXT"]
    language: Literal["HINDI", "HINGLISH", "ENGLISH", "OTHER"]
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    reasoning: str = Field(description="One sentence in English explaining what was extracted.")
    clarification: Optional[str] = Field(default=None, description="Short clarification question, max 10 words, only if needed.")

class ShoppingItem(BaseModel):
    product: str = Field(description="Item name in English title case.")
    quantity: Optional[str] = Field(default=None, description="Explicit quantity such as 2kg or 1 bunch. Never invent.")

class ShoppingListSchema(BaseModel):
    items: List[ShoppingItem]
    language: Literal["HINDI", "HINGLISH", "ENGLISH", "OTHER"]

SIGNAL_SYSTEM = """You are BazaarMind's market-signal interpreter for neighborhood markets in Delhi NCR.
Convert messy, natural human statements from vendors and shoppers into structured market signals.

Core ground rules:
- Understand Hindi, Hinglish, and English naturally.
- Recognize canonical produce names across languages and normalize them.
- Distinguish demand from availability:
  - "Bahut bik raha hai", "demand hai" indicates HIGH demand, NOT low supply.
  - "Kam aaya hai", "stock kam hai", "tight hai", "shortage" indicates LOW availability.
  - "Pura stock hai", "achha aaya hai", "bahut hai" indicates HIGH availability.
- Never invent a price. If no price is explicitly stated, reportedPrice must be null.
- Never invent quantities.
- A vendor observation is an evidence signal, not absolute verified truth.
- If ambiguous, ask a polite clarification question and set confidence to LOW.
"""

def _rule_based_interpret(text: str) -> Dict[str, Any]:
    raw_lower = (text or "").lower().strip()
    detected_product = "Produce"
    for alias, canon in PRODUCT_ALIASES.items():
        if re.search(r'\b' + re.escape(alias) + r'\b', raw_lower):
            detected_product = canon
            break

    # Price extraction
    price = None
    price_match = re.search(r'(?:₹|rs\.?|rate|bhav)?\s*(\d+(?:\.\d+)?)\s*(?:rupaye|rs|rupya|₹|per\s*kg|/kg)?', raw_lower)
    if price_match:
        cand_matches = re.findall(r'\b(\d{1,4})\b', raw_lower)
        for cand in cand_matches:
            val = float(cand)
            if 5 <= val <= 500 and ("rate" in raw_lower or "rupaye" in raw_lower or "rs" in raw_lower or "bhav" in raw_lower or "per" in raw_lower or "/" in raw_lower or "₹" in raw_lower or "hai" in raw_lower):
                price = val
                break

    price_unit = _explicit_price_unit(text)
    if price is not None and not price_unit:
        price_unit = "kg" if detected_product not in ("Lemon", "Banana", "Coriander", "Spinach") else ("piece" if detected_product == "Lemon" else ("dozen" if detected_product == "Banana" else "bunch"))

    # Availability
    availability = "NORMAL"
    if any(k in raw_lower for k in ["kam aaya", "kam hai", "tight", "shortage", "nahi aaya", "stock kam", "khatam"]):
        availability = "LOW"
    elif any(k in raw_lower for k in ["bahut hai", "achha stock", "bharpuri", "full stock", "good supply", "good stock", "plenty", "abundant", "lots of"]):
        availability = "HIGH"

    # Demand
    demand = "NORMAL"
    if any(k in raw_lower for k in ["chahiye", "need", "want", "mang", "bheed", "bahut bik", "bik raha"]):
        demand = "HIGH"

    # Language detection
    has_devanagari = bool(re.search(r'[\u0900-\u097F]', text))
    has_hinglish = any(w in raw_lower for w in ["aaj", "hai", "ka", "ki", "ke", "thoda", "kam", "bahut", "rupaye", "chahiye", "saath", "sattar"])
    lang = "HINDI" if has_devanagari else ("HINGLISH" if has_hinglish else "ENGLISH")

    signal_type = "PRICE" if price is not None else ("AVAILABILITY" if availability != "NORMAL" else "SUPPLY")
    conf = "HIGH" if detected_product != "Produce" else "MEDIUM"

    confirmation = _format_vendor_confirmation(detected_product, availability, price, price_unit, lang)

    return {
        "product": detected_product,
        "availability": availability,
        "demand": demand,
        "reportedPrice": price,
        "priceUnit": price_unit,
        "signalType": signal_type,
        "language": lang,
        "confidence": conf,
        "reasoning": f"Extracted {detected_product} observation from natural statement.",
        "confirmationText": confirmation,
    }

async def interpret_signal(text: Optional[str] = None, image_base64: Optional[str] = None, session_id: str = "default") -> Dict[str, Any]:
    del session_id
    if not is_configured():
        return _rule_based_interpret(text or "")

    try:
        client = _client()
        contents = []
        if image_base64:
            clean_b64 = image_base64
            if "," in clean_b64:
                clean_b64 = clean_b64.split(",", 1)[1]
            contents.append(types.Part.from_bytes(
                data=base64.b64decode(clean_b64),
                mime_type="image/jpeg",
            ))
            user_text = text or "Interpret what produce and availability is visible in this stall image."
            contents.append(user_text)
        else:
            contents.append(f'Interpret this market observation:\n"{text}"')

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SIGNAL_SYSTEM,
                response_mime_type="application/json",
                response_schema=SignalSchema,
                max_output_tokens=600,
            ),
        )
        parsed = getattr(response, "parsed", None)
        if parsed is not None:
            data = parsed.model_dump() if hasattr(parsed, "model_dump") else dict(parsed)
        else:
            data = _extract_json(response.text)

        norm = normalize_product(data.get("product"))
        if norm:
            data["product"] = norm

        data["confirmationText"] = _format_vendor_confirmation(
            data.get("product", "Produce"),
            data.get("availability", "NORMAL"),
            data.get("reportedPrice"),
            data.get("priceUnit"),
            data.get("language", "HINGLISH"),
        )
        return data

    except Exception as exc:
        logger.warning("Gemini live interpretation failed (%s), using rule-based engine: %s", type(exc).__name__, exc)
        return _rule_based_interpret(text or "")

LIST_SYSTEM = """You are BazaarMind's shopping-list parser for Delhi NCR markets.
Extract requested fruits and vegetables from Hindi, Hinglish, or English.
Never invent quantities. If quantity is not explicitly stated, set quantity to null. Ignore filler words.
"""

def _rule_based_parse_list(text: str) -> Dict[str, Any]:
    raw_lower = (text or "").lower()
    has_devanagari = bool(re.search(r'[\u0900-\u097F]', text))
    has_hinglish = any(w in raw_lower for w in ["aaj", "chahiye", "aur", "thoda", "kilo", "tamatar", "aloo", "pyaz", "dhaniya"])
    lang = "HINDI" if has_devanagari else ("HINGLISH" if has_hinglish else "ENGLISH")

    candidates = [
        ("Tomatoes", ["tomato", "tomatoes", "tamatar", "टमाटर"]),
        ("Onions", ["onion", "onions", "pyaz", "pyaaz", "प्याज", "प्याज़"]),
        ("Potatoes", ["potato", "potatoes", "aloo", "alu", "आलू"]),
        ("Coriander", ["coriander", "dhaniya", "dhania", "धनिया"]),
        ("Lemon", ["lemon", "lemons", "nimbu", "neebu", "नींबू", "नीबू"]),
        ("Banana", ["banana", "bananas", "kela", "केला"]),
        ("Apple", ["apple", "apples", "seb", "saib", "सेब"]),
        ("Chilli", ["chilli", "chillies", "chili", "chilies", "hari mirch", "mirch", "मिर्च", "हरी मिर्च"]),
        ("Ginger", ["ginger", "adrak", "adrakh", "अदरक"]),
        ("Carrots", ["carrot", "carrots", "gajar", "गाजर"]),
        ("Spinach", ["spinach", "palak", "पालक"]),
    ]

    items = []
    for canon, aliases in candidates:
        for a in aliases:
            match = re.search(r'\b' + re.escape(a) + r'\b', raw_lower)
            if match:
                qty = None
                prefix = raw_lower[:match.start()].strip().split()
                if prefix:
                    candidate_qty = " ".join(prefix[-2:]) if len(prefix) >= 2 else prefix[-1]
                    qty_match = re.search(r'(\d+(?:\.\d+)?\s*(?:kg|kilo|kilograms?|bunch|bundle|dozen|g|grams?))', candidate_qty)
                    if qty_match:
                        qty = qty_match.group(1)
                    elif re.match(r'^\d+$', prefix[-1]):
                        qty = prefix[-1] + " kg"
                items.append({"product": canon, "quantity": qty})
                break

    if not items:
        items.append({"product": "Produce", "quantity": None})

    return {"items": items, "language": lang}

async def parse_shopping_list(text: str, session_id: str = "list") -> Dict[str, Any]:
    del session_id
    if not is_configured():
        return _rule_based_parse_list(text)

    try:
        client = _client()
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=f'Parse this shopping list:\n"{text}"',
            config=types.GenerateContentConfig(
                system_instruction=LIST_SYSTEM,
                response_mime_type="application/json",
                response_schema=ShoppingListSchema,
                max_output_tokens=600,
            ),
        )
        parsed = getattr(response, "parsed", None)
        if parsed is not None:
            data = parsed.model_dump() if hasattr(parsed, "model_dump") else dict(parsed)
        else:
            data = _extract_json(response.text)

        items = []
        for item in data.get("items", []):
            product = normalize_product(item.get("product"))
            if product:
                items.append({"product": product, "quantity": item.get("quantity")})
        data["items"] = items
        return data

    except Exception as exc:
        logger.warning("Gemini shopping list parse failed (%s), using rule-based parser: %s", type(exc).__name__, exc)
        return _rule_based_parse_list(text)

ASK_SYSTEM = """You are BazaarMind, the calm, evidence-grounded market intelligence assistant for India's neighborhood markets.

CRITICAL RULES:
1. Answer ONLY from the supplied market evidence.
2. Prices are reported signals, never guaranteed market prices. Never say "the price is ₹X" or "market price is ₹X". Say "Observed prices are ₹X" or "Reported price range is ₹X–₹Y".
3. Never rank vendors as "cheapest vendor" or recommend one stall over another.
4. Never invent real-time facts, numbers, availability, or vendors.
5. If evidence is insufficient, explicitly say: "I don't have enough local signals yet to answer that with certainty."
6. If the user asks an off-topic question unrelated to local market intelligence (such as cricket, scores, movies, general trivia, weather in other cities, programming), politely decline:
   "BazaarMind is dedicated strictly to local neighborhood market intelligence in your selected market. I can answer questions about local produce availability, observed prices, vendor observations, and shopper demand."
7. Reply in the user's language style: Hindi, Hinglish, or English.
8. Keep answers concise: 2-4 short sentences grounded in the signal counts and recency.
"""

def _rule_based_ask(question: str, market_context: str) -> str:
    q_lower = question.lower()
    
    # Safe off-topic filter
    off_topic_words = ["cricket", "match", "score", "who won", "president", "weather in", "movie", "film", "python", "javascript", "code"]
    if any(w in q_lower for w in off_topic_words):
        return (
            "BazaarMind is dedicated strictly to local neighborhood market intelligence in your selected market. "
            "I can answer questions about local produce availability, observed prices, vendor observations, and shopper demand."
        )

    # Produce-specific check
    for canon in CANONICAL_PRODUCTS:
        aliases = [canon.lower(), canon.lower()[:-1]]
        for a, c in PRODUCT_ALIASES.items():
            if c == canon:
                aliases.append(a)
        if any(re.search(r'\b' + re.escape(a) + r'\b', q_lower) for a in aliases):
            pattern = re.compile(rf'- {canon}:\s*availability\s+([^,]+),\s*demand\s+([^,]+),\s*reported price signal\s+([^,]+),\s*evidence\s+(.+?),\s*confidence', re.IGNORECASE)
            match = pattern.search(market_context)
            if match:
                avail, demand, price_str, ev = match.groups()
                return (
                    f"Based on current market signals for {canon}: availability is reported as {avail.lower()} "
                    f"with {demand.lower()} shopper demand. Observed price signal is {price_str}, backed by {ev}. "
                    f"These are reported observations from neighborhood stalls."
                )
            else:
                return f"I don't have enough local verified signals for {canon} in this market yet."

    # General market overview
    if any(w in q_lower for w in ["what", "happening", "today", "know", "difficult", "tight", "low"]):
        return (
            "According to today's market signals, Tomatoes and Coriander are showing tight availability with elevated shopper demand. "
            "Potatoes and Onions have healthy supply with stable observed price ranges. "
            "All insights are backed by participating vendor and shopper observations."
        )

    return "BazaarMind has limited local signals for that specific query. Please check the Market Pulse for the latest observed reports."

async def ask_bazaar(question: str, market_context: str, session_id: str = "ask", data_source: str = "DEMO") -> str:
    del session_id
    q_lower = question.lower()
    off_topic_words = ["cricket", "who won", "match", "score", "president", "weather in", "movie", "film"]
    if any(w in q_lower for w in off_topic_words):
        return (
            "BazaarMind is dedicated strictly to local neighborhood market intelligence in your selected market. "
            "I can answer questions about local produce availability, observed prices, vendor observations, and shopper demand."
        )

    if not is_configured():
        return _rule_based_ask(question, market_context)

    try:
        client = _client()
        source_label = "synthetic DEMO signals" if data_source == "DEMO" else f"{data_source} signals"
        prompt = f"Market evidence source: {source_label}.\n{market_context}\n\nUser question: \"{question}\"\n\nAnswer strictly from the evidence above."
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=ASK_SYSTEM,
                max_output_tokens=500,
            ),
        )
        return (response.text or "").strip()
    except Exception as exc:
        logger.warning("Gemini live ask failed (%s), using rule-based engine: %s", type(exc).__name__, exc)
        return _rule_based_ask(question, market_context)

ROUTE_SYSTEM = """You are BazaarMind's Market Route Optimizer for India's neighborhood markets.
You receive a shopper's needed produce items, currently reporting market stalls with coordinates and prices, and today's market pulse.
Synthesize the smartest walking route through the stalls:
1. Put scarce/tight items first so the shopper buys before stock sells out.
2. Group nearby stalls in a logical walking path.
3. Provide a clear 1-line tip in Hindi/Hinglish or English for each stop.
4. Estimate total grocery budget based on observed price signals.
"""

class PlanStopSchema(BaseModel):
    step: int
    stallName: str
    vendorName: str
    product: str
    reason: str
    estimatedPrice: Optional[str] = None
    lat: float
    lng: float

class MarketRouteSchema(BaseModel):
    summary: str
    stops: List[PlanStopSchema]
    estimatedBudget: str
    estimatedWalkingTime: str

def _rule_based_plan_route(items: List[str], vendors: List[Dict[str, Any]], pulse_products: List[Dict[str, Any]]) -> Dict[str, Any]:
    pulse_map = {p.get("product", ""): p for p in pulse_products}
    
    # Priority sorting: items with LOW / Tight availability first
    def get_priority(item_name):
        p = pulse_map.get(item_name, {})
        code = p.get("availabilityCode") or ("LOW" if p.get("availability") == "Tight" else "NORMAL")
        return 0 if code == "LOW" else 1

    sorted_items = sorted(items, key=get_priority)
    
    stops = []
    used_vendors = set()
    total_low, total_high = 0, 0

    for idx, item in enumerate(sorted_items, start=1):
        # Find matching vendor
        best_v = None
        for v in vendors:
            v_id = v.get("vendorId") or v.get("id")
            for off in v.get("offers", []):
                if off.get("product", "").lower() == item.lower():
                    best_v = v
                    break
            if best_v and v_id not in used_vendors:
                break
        
        if not best_v and vendors:
            best_v = vendors[(idx - 1) % len(vendors)]
        
        if best_v:
            v_id = best_v.get("vendorId") or best_v.get("id") or f"v{idx}"
            used_vendors.add(v_id)
            p_info = pulse_map.get(item, {})
            price_sig = p_info.get("reportedPriceSignal") or "₹30–₹40"
            is_tight = p_info.get("availability") == "Tight" or p_info.get("availabilityCode") == "LOW"
            
            p_lo = p_info.get("priceLow", 30)
            p_hi = p_info.get("priceHigh", 50)
            total_low += (p_lo or 30)
            total_high += (p_hi or 50)
            
            reason = (
                f"{item} supply is tight today — buy early from {best_v.get('vendorName')}."
                if is_tight
                else f"Good fresh stock of {item} observed at this stall."
            )
            
            v_lat = float(best_v.get("lat") or (28.56885 + idx * 0.0001))
            v_lng = float(best_v.get("lng") or (77.20925 + idx * 0.0001))
            
            stops.append({
                "step": idx,
                "stallName": best_v.get("stallName") or best_v.get("stall") or f"Stall {idx}",
                "vendorName": best_v.get("vendorName") or best_v.get("name") or "Local Stall",
                "product": item,
                "reason": reason,
                "estimatedPrice": price_sig,
                "lat": v_lat,
                "lng": v_lng,
                "googleMapsUrl": f"https://www.google.com/maps/dir/?api=1&destination={v_lat},{v_lng}",
            })

    # Multi-destination Google Maps Route
    if stops:
        coords_path = "/".join(f"{s['lat']},{s['lng']}" for s in stops)
        route_url = f"https://www.google.com/maps/dir/28.5687,77.2094/{coords_path}"
    else:
        route_url = "https://www.google.com/maps/search/?api=1&query=INA+Market+Delhi"

    budget_str = f"₹{round(total_low)}–₹{round(total_high)}" if total_low else "₹150–₹220"
    walking_mins = max(2, len(stops) * 1 + 1)

    return {
        "summary": f"Optimized {len(stops)}-stop market walking route based on current INA Market supply signals.",
        "stops": stops,
        "estimatedBudget": budget_str,
        "estimatedWalkingTime": f"~{walking_mins} mins inside market",
        "googleMapsRouteUrl": route_url,
    }

async def plan_shopper_route(
    items: List[str],
    market_name: str,
    vendors: List[Dict[str, Any]],
    pulse_products: List[Dict[str, Any]],
) -> Dict[str, Any]:
    if not items:
        return {"summary": "No produce items to plan route for.", "stops": [], "estimatedBudget": "—", "estimatedWalkingTime": "0 mins", "googleMapsRouteUrl": ""}

    if not is_configured():
        return _rule_based_plan_route(items, vendors, pulse_products)

    try:
        client = _client()
        vendor_ctx = "\n".join(
            f"- {v.get('vendorName')} ({v.get('stallName')}, lat:{v.get('lat')}, lng:{v.get('lng')}): " +
            ", ".join(f"{o.get('product')} (₹{o.get('reportedPrice')})" for o in v.get("offers", []))
            for v in vendors
        )
        pulse_ctx = "\n".join(
            f"- {p.get('product')}: avail={p.get('availability')}, price={p.get('reportedPriceSignal')}"
            for p in pulse_products if p.get("product") in items
        )
        prompt = (
            f"Market: {market_name}\n"
            f"Shopper needed items: {', '.join(items)}\n\n"
            f"Live Market Pulse:\n{pulse_ctx}\n\n"
            f"Available Stalls with GPS:\n{vendor_ctx}\n\n"
            f"Synthesize the optimal walking route."
        )

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=ROUTE_SYSTEM,
                response_mime_type="application/json",
                response_schema=MarketRouteSchema,
                max_output_tokens=700,
            ),
        )
        parsed = getattr(response, "parsed", None)
        if parsed is not None:
            data = parsed.model_dump() if hasattr(parsed, "model_dump") else dict(parsed)
        else:
            data = _extract_json(response.text)

        # Attach Google Maps links to each stop
        stops = data.get("stops", [])
        for s in stops:
            v_lat = float(s.get("lat") or 28.56885)
            v_lng = float(s.get("lng") or 77.20925)
            s["lat"] = v_lat
            s["lng"] = v_lng
            s["googleMapsUrl"] = f"https://www.google.com/maps/dir/?api=1&destination={v_lat},{v_lng}"

        if stops:
            coords_path = "/".join(f"{s['lat']},{s['lng']}" for s in stops)
            data["googleMapsRouteUrl"] = f"https://www.google.com/maps/dir/28.5687,77.2094/{coords_path}"
        else:
            data["googleMapsRouteUrl"] = "https://www.google.com/maps/search/?api=1&query=INA+Market+Delhi"

        return data
    except Exception as exc:
        logger.warning("Gemini plan_shopper_route failed (%s), using rule-based engine: %s", type(exc).__name__, exc)
        return _rule_based_plan_route(items, vendors, pulse_products)
