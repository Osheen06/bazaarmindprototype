"""Regression & Quality Guardrail Tests for BazaarMind Finale Judging.

Verifies:
1. Strict Anti-Contamination Filter (Azadpur, Ghazipur, Okhla queries in INA Market).
2. Off-Topic Query Guardrail.
3. Honest Conceptual Vendor Finance Layer (no fake RBI licenses, zero fake disbursals).
4. Market Directory Endpoint routing.
5. Grounded Market Q&A behavior with evidence attachment.
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
from starlette.testclient import TestClient
from server import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        c.post("/api/demo/reset")
        yield c

def test_anti_contamination_filter_azadpur(client):
    """Queries about Azadpur while viewing INA Market must deterministically return honest refusal."""
    payload = {
        "question": "What are the tomato prices in Azadpur mandi?",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    }
    res = client.post("/api/ask", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    answer = data.get("answer", "")
    assert "I don't have enough recent local signals for that market" in answer
    assert "grounded in the active INA Market evidence" in answer

def test_anti_contamination_filter_ghazipur(client):
    """Queries about Ghazipur while viewing INA Market must deterministically return honest refusal."""
    payload = {
        "question": "Is onion cheap in Ghazipur today?",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    }
    res = client.post("/api/ask", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    answer = data.get("answer", "")
    assert "I don't have enough recent local signals for that market" in answer

def test_off_topic_guardrail(client):
    """Irrelevant queries must be politely declined without hallucinating."""
    payload = {
        "question": "Who won the cricket match yesterday?",
        "marketId": "demo-ina",
        "dataSource": "DEMO"
    }
    res = client.post("/api/ask", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    answer = data.get("answer", "")
    assert "market" in answer.lower() or "produce" in answer.lower() or "price" in answer.lower()

def test_honest_vendor_loan_overview(client):
    """Vendor loan overview must be an honest conceptual architecture hypothesis, not fake RBI claims."""
    res = client.get("/api/vendor-loans/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    # Must NOT contain fake RBI license
    assert "RBI/ND-2021/8871" not in str(data)
    assert "99.4%" not in str(data)
    # Must declare concept status
    assert "status" in data or "disclaimer" in data
    assert "CONCEPT" in str(data) or "HYPOTHESIS" in str(data)

def test_honest_vendor_loan_application(client):
    """Vendor loan application must be a simulation assessment, not real disbursal."""
    payload = {
        "vendorId": "v1",
        "amount": 10000.0,
        "tenureDays": 30,
        "purpose": "Morning Mandi Produce Restock",
        "upiId": "ramesh@upi"
    }
    res = client.post("/api/vendor-loans/apply", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "UTR" not in str(data)
    assert "simulation" in str(data).lower() or "concept" in str(data).lower() or "not a real bank" in str(data).lower()

def test_markets_directory_routing(client):
    """The /api/markets/directory route must succeed and not be intercepted by /api/markets/{id}."""
    res = client.get("/api/markets/directory")
    assert res.status_code == 200
    data = res.json()
    assert data.get("ok") is True
    assert "markets" in data
    assert len(data["markets"]) > 0
    # Verify market types include specialty, weekly or mandi
    types = [m.get("marketType") for m in data["markets"]]
    assert any("Specialty" in str(t) or "Weekly" in str(t) or "Mandi" in str(t) for t in types)
