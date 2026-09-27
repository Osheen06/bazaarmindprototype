"""Comprehensive unit and integration tests for all BazaarMind Master Modules.

Uses in-process FastAPI TestClient for deterministic, fast, offline-capable verification.
"""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
from starlette.testclient import TestClient
from server import app
import gemini_service
import intelligence

client = TestClient(app)

# ---------------- Module 1: Shopper Flow ----------------

def test_shopper_parse_hindi_and_hinglish():
    res = client.post("/api/shopping-list/parse", json={
        "text": "Mujhe 2 kilo tamatar aur thoda dhaniya chahiye",
        "marketId": "demo-ina",
        "persist": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert len(data["items"]) >= 2
    prods = [i["product"] for i in data["items"]]
    assert "Tomatoes" in prods
    assert "Coriander" in prods
    assert data.get("confirmationText") is not None
    assert "मैंने समझा" in data["confirmationText"]
    assert "टमाटर" in data["confirmationText"] or "Tomatoes" in data["confirmationText"]

def test_shopper_parse_english():
    res = client.post("/api/shopping-list/parse", json={
        "text": "I need 2kg tomatoes, 1kg potatoes and coriander",
        "marketId": "demo-ina",
        "persist": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    prods = [i["product"] for i in data["items"]]
    assert "Tomatoes" in prods
    assert "Potatoes" in prods

# ---------------- Module 2: Vendor Flow ----------------

def test_vendor_voice_interpretation():
    res = client.post("/api/signals/interpret", json={
        "text": "Aaj tamatar thoda kam aaya hai aur rate 70 rupaye hai"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    sig = data["signal"]
    assert sig["product"] == "Tomatoes"
    assert sig["availability"] == "LOW"
    assert sig["reportedPrice"] == 70.0
    assert "मैंने समझा" in sig.get("confirmationText", "")
    assert "₹70" in sig.get("confirmationText", "")

def test_vendor_confirmation_gated_persistence():
    # Signal creation should persist only when valid and confirmed
    res = client.post("/api/signals", json={
        "marketId": "demo-ina",
        "product": "Tomatoes",
        "signalType": "PRICE",
        "availability": "LOW",
        "reportedPrice": 72.0,
        "priceUnit": "kg",
        "source": "VENDOR",
        "confidence": "HIGH",
        "rawText": "Aaj tamatar ka rate 72 hai",
        "vendorName": "Ramesh Sabzi Wala",
        "dataSource": "DEMO"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["published"] is True
    assert data["signal"]["reportedPrice"] == 72.0

# ---------------- Module 3 & 4: Market Pulse & Evidence ----------------

def test_market_pulse_deterministic_contract():
    res = client.get("/api/market-pulse?marketId=demo-ina&dataSource=DEMO")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "products" in data
    assert len(data["products"]) > 0

    tomatoes = next((p for p in data["products"] if p["product"] == "Tomatoes"), None)
    assert tomatoes is not None
    assert "observedPrice" in tomatoes
    assert "observedPriceLabel" in tomatoes
    assert "patternStatus" in tomatoes
    assert tomatoes["patternStatus"] in ("EARLY SIGNAL", "EMERGING PATTERN", "STRONGER LOCAL SIGNAL", "MIXED LOCAL SIGNALS")

    # Evidence traceability checks
    ev_list = tomatoes.get("evidence", [])
    assert len(ev_list) > 0
    first_ev = ev_list[0]
    assert "source" in first_ev
    assert "timestamp" in first_ev
    assert "freshness" in first_ev
    assert "observedValue" in first_ev

# ---------------- Module 5: Ask BazaarMind ----------------

def test_ask_bazaar_grounding():
    res = client.post("/api/ask-bazaar", json={
        "question": "What is happening with tomatoes?",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    ans = data["answer"].lower()
    assert "tomatoes" in ans or "tamatar" in ans or "tight" in ans or "observed" in ans or "signals" in ans

def test_ask_bazaar_anti_contamination():
    # Asking about Azadpur in INA Market demo should NOT hallucinate Azadpur data
    res = client.post("/api/ask-bazaar", json={
        "question": "What is the price of apples in Azadpur Mandi?",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    ans = data["answer"]
    assert "don't have enough" in ans.lower() or "ina market" in ans.lower()

def test_ask_bazaar_off_topic_refusal():
    res = client.post("/api/ask-bazaar", json={
        "question": "Who won the cricket match yesterday?",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "dedicated strictly to local neighborhood market intelligence" in data["answer"]

# ---------------- Module 8: Farmer / Mandi Intelligence ----------------

def test_mandi_intelligence_endpoint():
    res = client.get("/api/mandi-intelligence?product=Tomatoes")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "mandis" in data
    assert len(data["mandis"]) >= 4
    mandi_names = [m["name"] for m in data["mandis"]]
    assert any("Azadpur" in n for n in mandi_names)
    assert any("INA" in n for n in mandi_names)
    assert "recommendedMandi" in data

# ---------------- Module 6 & 7: Market Directory ----------------

def test_markets_directory_endpoint():
    res = client.get("/api/markets/directory")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "markets" in data
    assert len(data["markets"]) >= 4
    first_market = data["markets"][0]
    assert "marketType" in first_market
    assert "operatingDays" in first_market
    assert "operatingHours" in first_market
    assert "categories" in first_market
    assert "verificationStatus" in first_market

# ---------------- Module 9: Seasonality ----------------

def test_seasonality_endpoint():
    res = client.get("/api/intelligence/seasonality?marketId=demo-ina&dataSource=DEMO")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "weeklyPatterns" in data
    assert "seasonalCycles" in data
    assert "trendSeries" in data

# ---------------- Module 10: Wastage Reduction ----------------

def test_wastage_endpoint():
    res = client.get("/api/intelligence/wastage?marketId=demo-ina&dataSource=DEMO")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "mismatches" in data
    assert "metrics" in data

# ---------------- Module 14: South Delhi Exotic Heatmap ----------------

def test_exotic_heatmap_endpoint():
    res = client.get("/api/heatmap/exotic?area=South+Delhi")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "clusters" in data
    assert len(data["clusters"]) >= 3
    assert "privacyNotice" in data

# ---------------- Module 12: Pilot Field Operations ----------------

def test_field_operations_endpoint():
    res = client.get("/api/pilot/operations?marketId=demo-ina")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "vendorOnboarding" in data
    assert "shopperOnboarding" in data
    assert "signalOperations" in data
