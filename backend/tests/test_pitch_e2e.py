"""BazaarMind End-to-End 15-Step Pitch Scenario Test.

Validates the full live pitch demonstration flow before the judges:
Step 1: System Health & Gemini Configuration
Step 2: Canonical Demo Market Identity (INA Market - Demo Mode)
Step 3: Deterministic Market Pulse
Step 4: Standardized /markets/{id}/pulse endpoint
Step 5: Standardized /markets/{id}/evidence endpoint
Step 6: Voice/Hinglish Gemini Signal Interpretation
Step 7: Signal Confirmation & Persistence
Step 8: Shopper Demand Contribution
Step 9: Vendor Observation Contribution
Step 10: Smart Shopping Route Planning
Step 11: Grounded Market Q&A via Ask BazaarMind
Step 12: Strict Off-Topic Guardrail Protection
Step 13: Browser Reverse Geocoding (Human-readable locality)
Step 14: Market Discovery & State Classification
Step 15: Deterministic Demo Reset
"""

import pytest
from starlette.testclient import TestClient
from server import app
import demo_seed


@pytest.fixture(scope="module")
def client():
    # Use TestClient with lifespan context manager so seed_if_empty runs
    with TestClient(app) as test_client:
        test_client.post("/api/demo/reset")
        yield test_client


def test_pitch_15_step_scenario(client):
    # -------------------------------------------------------------
    # Step 1: Health & Gemini status
    # -------------------------------------------------------------
    r = client.get("/api/health")
    assert r.status_code == 200
    health = r.json()
    assert health["ok"] is True
    assert "geminiConfigured" in health

    # -------------------------------------------------------------
    # Step 2: Canonical Demo Market Identity
    # -------------------------------------------------------------
    r = client.get("/api/markets/demo-ina")
    assert r.status_code == 200
    market = r.json()
    assert market["id"] == "demo-ina"
    assert "INA" in market["name"]
    assert market["dataSource"] == "DEMO"
    assert market["state"] == "DEMO"
    assert market["isDemo"] is True

    # -------------------------------------------------------------
    # Step 3: Market Pulse retrieval
    # -------------------------------------------------------------
    r = client.get("/api/market-pulse?marketId=demo-ina&dataSource=DEMO")
    assert r.status_code == 200
    pulse = r.json()
    assert pulse["marketId"] == "demo-ina"
    assert len(pulse.get("products", [])) > 0
    product_names = [p["product"] for p in pulse["products"]]
    assert "Tomatoes" in product_names
    assert "Onions" in product_names

    # -------------------------------------------------------------
    # Step 4: Standardized /markets/{id}/pulse
    # -------------------------------------------------------------
    r = client.get("/api/markets/demo-ina/pulse")
    assert r.status_code == 200
    std_pulse = r.json()
    assert std_pulse["marketId"] == "demo-ina"
    assert "products" in std_pulse

    # -------------------------------------------------------------
    # Step 5: Standardized /markets/{id}/evidence
    # -------------------------------------------------------------
    r = client.get("/api/markets/demo-ina/evidence")
    assert r.status_code == 200
    evidence = r.json()
    assert evidence["marketId"] == "demo-ina"
    assert "signals" in evidence
    assert "vendors" in evidence
    assert "shopperDemands" in evidence

    # -------------------------------------------------------------
    # Step 6: Voice/Hinglish Gemini Signal Interpretation
    # -------------------------------------------------------------
    interpret_payload = {
        "text": "Aaj tamatar 70 rupaye hai aur thoda kam stock aaya hai",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    }
    r = client.post("/api/signals/interpret", json=interpret_payload)
    assert r.status_code == 200
    interpreted = r.json()
    assert interpreted.get("ok") is True
    signal = interpreted.get("signal", {})
    assert signal.get("product") == "Tomatoes"
    assert signal.get("availability") in ("LOW", "LIMITED", "MODERATE", "HIGH")
    assert signal.get("reportedPrice") is not None

    # -------------------------------------------------------------
    # Step 7: Signal Confirmation & Persistence
    # -------------------------------------------------------------
    confirm_payload = {
        "marketId": "demo-ina",
        "dataSource": "DEMO",
        "product": signal.get("product", "Tomatoes"),
        "availability": signal.get("availability", "LOW"),
        "reportedPrice": signal.get("reportedPrice", 70),
        "confidence": "HIGH",
        "rawText": interpret_payload["text"]
    }
    r = client.post("/api/signals/confirm", json=confirm_payload)
    assert r.status_code == 200
    confirmed = r.json()
    assert confirmed.get("ok") is True

    # -------------------------------------------------------------
    # Step 8: Shopper Demand Contribution
    # -------------------------------------------------------------
    demand_payload = {
        "marketId": "demo-ina",
        "dataSource": "DEMO",
        "items": ["Tomatoes", "Coriander"],
        "maxBudget": 150,
        "note": "Looking for fresh red tomatoes"
    }
    r = client.post("/api/shopper/demand", json=demand_payload)
    assert r.status_code == 200
    demand_res = r.json()
    assert demand_res.get("ok") is True
    assert demand_res.get("demandId")

    # -------------------------------------------------------------
    # Step 9: Vendor Observation Contribution
    # -------------------------------------------------------------
    obs_payload = {
        "marketId": "demo-ina",
        "dataSource": "DEMO",
        "product": "Tomatoes",
        "price": 68,
        "availability": "MODERATE",
        "note": "Fresh stock arrived from mandi"
    }
    r = client.post("/api/vendor/observation", json=obs_payload)
    assert r.status_code == 200
    obs_res = r.json()
    assert obs_res.get("ok") is True

    # -------------------------------------------------------------
    # Step 10: Smart Route Planning
    # -------------------------------------------------------------
    route_payload = {
        "marketId": "demo-ina",
        "dataSource": "DEMO",
        "items": ["Tomatoes", "Onions"]
    }
    r = client.post("/api/shopper/plan-route", json=route_payload)
    assert r.status_code == 200
    route = r.json()
    assert route.get("ok") is True
    assert "stops" in route
    assert len(route["stops"]) > 0

    # -------------------------------------------------------------
    # Step 11: Grounded Market Q&A via Ask BazaarMind
    # -------------------------------------------------------------
    ask_payload = {
        "question": "What is the tomato price and availability right now?",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    }
    r = client.post("/api/ask", json=ask_payload)
    assert r.status_code == 200
    ask_res = r.json()
    assert ask_res.get("ok") is True
    assert len(ask_res.get("answer", "")) > 10

    # -------------------------------------------------------------
    # Step 12: Off-Topic Guardrail
    # -------------------------------------------------------------
    off_topic_payload = {
        "question": "Who won the cricket world cup in 2011?",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    }
    r = client.post("/api/ask", json=off_topic_payload)
    assert r.status_code == 200
    guardrail_res = r.json()
    answer_text = guardrail_res.get("answer", "")
    assert "market" in answer_text.lower() or "evidence" in answer_text.lower()

    # -------------------------------------------------------------
    # Step 13: Reverse Geocoding
    # -------------------------------------------------------------
    r = client.get("/api/location/reverse?lat=28.5687&lng=77.2094")
    assert r.status_code == 200
    geo = r.json()
    assert geo.get("ok") is True
    assert geo.get("locality") or geo.get("area") or geo.get("city")

    # -------------------------------------------------------------
    # Step 14: Market Discovery & State Classification
    # -------------------------------------------------------------
    r = client.get("/api/market/discover?lat=28.5687&lng=77.2094")
    assert r.status_code == 200
    discovery = r.json()
    assert discovery.get("ok") is True
    assert "markets" in discovery

    # -------------------------------------------------------------
    # Step 15: Demo Reset
    # -------------------------------------------------------------
    r = client.post("/api/demo/reset")
    assert r.status_code == 200
    reset_res = r.json()
    assert reset_res.get("ok") is True
    assert reset_res.get("message")
