"""Tests specifically validating the 4 reported issues:
1. Greetings like 'hii' do not create fake 'Produce' demand signals.
2. Produce expansion (Mango / aam / आम, Garlic, Cucumber, etc.) parses correctly.
3. Devanagari Hindi voice notes ('आज टमाटर थोड़ा कम आया है और रेट 70 रुपये है।')
   accurately extract produce, LOW availability, and 70 price.
4. Demo market queries to /api/ask and /api/market-pulse always use DEMO data even
   if client session sends dataSource='PILOT'.
"""
import pytest
from starlette.testclient import TestClient
from server import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_greeting_does_not_create_produce_demand(client):
    for greeting in ["hii", "hi", "hello", "namaste", "hey"]:
        res = client.post("/api/shopper/parse", json={
            "text": greeting,
            "marketId": "demo-ina",
            "dataSource": "DEMO"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["ok"] is True
        assert data.get("isGreeting") is True
        assert len(data.get("items", [])) == 0, f"Expected 0 items for greeting '{greeting}', got {data.get('items')}"

def test_mango_and_extended_produce_parsed(client):
    res = client.post("/api/shopper/parse", json={
        "text": "1 dozen aam aur 2 kilo tamatar",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    prods = [i["product"] for i in data["items"]]
    assert "Mangoes" in prods
    assert "Tomatoes" in prods

def test_hindi_devanagari_vendor_signal(client):
    text = "आज टमाटर थोड़ा कम आया है और रेट 70 रुपये है।"
    res = client.post("/api/signals/interpret", json={"text": text})
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    sig = data["signal"]
    assert sig["product"] == "Tomatoes"
    assert sig["reportedPrice"] == 70
    assert sig["availability"] == "LOW"
    assert sig["language"] == "HINDI"

def test_ask_bazaar_on_demo_market_with_pilot_datasource(client):
    # User had participant state causing dataSource="PILOT" to be sent for demo-ina
    res = client.post("/api/ask-bazaar", json={
        "question": "What is the observed price range for onions?",
        "marketId": "demo-ina",
        "dataSource": "PILOT"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["totalSignals"] > 0
    assert "doesn't have enough local signals" not in data["answer"]
    assert "onion" in data["answer"].lower() or "48" in data["answer"] or "58" in data["answer"]
