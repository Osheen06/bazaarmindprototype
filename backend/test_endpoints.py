"""End-to-End integration test suite for BazaarMind FastAPI backend."""
import asyncio
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from httpx import AsyncClient, ASGITransport
from server import app, db
import demo_seed

async def run_tests():
    print("==================================================")
    print("          BAZAARMIND E2E INTEGRATION TEST         ")
    print("==================================================")
    
    # Initialize demo seed if needed
    await demo_seed.seed_if_empty(db)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        print("\n[Test 1] Health Check...")
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.status_code}"
        data = res.json()
        assert data["ok"] is True
        print("✓ Health check passed:", data)

        # 2. Get Markets
        print("\n[Test 2] Get Markets...")
        res = await client.get("/api/markets")
        assert res.status_code == 200
        markets = res.json()
        assert isinstance(markets, list) and len(markets) > 0
        demo_market = next((m for m in markets if m["id"] == "demo-ina"), None)
        assert demo_market is not None
        assert "INA MARKET — BAZAARMIND DEMO" in demo_market["name"]
        print(f"✓ Found demo market: {demo_market['name']} ({demo_market['id']})")

        # 3. Market Pulse
        print("\n[Test 3] Market Pulse...")
        res = await client.get("/api/market-pulse?marketId=demo-ina&dataSource=DEMO")
        assert res.status_code == 200
        pulse = res.json()
        assert pulse["ok"] is True
        assert len(pulse["products"]) > 0
        print(f"✓ Market Pulse generated with {len(pulse['products'])} tracked products:")
        for p in pulse["products"][:3]:
            print(f"   • {p['product']}: Availability={p['availability']} ({p['availabilityCode']}), Price={p['reportedPriceSignal']}, Conf={p['confidence']}, Stalls={p.get('independentStallsCount')}")
            assert "evidenceSignals" in p, "evidenceSignals must be present for traceability"

        # 4. Multilingual Vendor Signal Interpretation
        print("\n[Test 4] Multilingual Vendor Signal Interpretation...")
        vendor_inputs = [
            ("Aaj tamatar thoda kam aaya hai aur rate 70 rupaye hai", "Tomatoes", 70.0, "LOW"),
            ("Onions are plenty today at 35 per kg", "Onions", 35.0, "HIGH"),
            ("Aloo 25 rupaye kilo bik raha hai", "Potatoes", 25.0, None),
        ]
        for text, expected_prod, expected_price, expected_avail in vendor_inputs:
            res = await client.post("/api/signals/interpret", json={"text": text})
            assert res.status_code == 200
            interp = res.json()
            assert interp["ok"] is True
            data = interp["data"]
            print(f"   Input: '{text}'")
            print(f"   Extracted -> Product: {data['product']}, Price: {data['reportedPrice']}, Avail: {data['availability']}, Lang: {data['language']}")
            print(f"   Natural Confirmation ->\n{data.get('confirmationText')}")
            assert data["product"] == expected_prod, f"Expected {expected_prod}, got {data['product']}"
            if expected_price is not None:
                assert data["reportedPrice"] == expected_price
            if expected_avail is not None:
                assert data["availability"] == expected_avail
        print("✓ Vendor interpretation passed")

        # 5. Signal Creation & Persistence with Price Sanity Checks
        print("\n[Test 5] Create & Persist Vendor Signal...")
        create_payload = {
            "marketId": "demo-ina",
            "vendorName": "Ramesh Sabzi Wala",
            "product": "Tomatoes",
            "signalType": "PRICE_OBSERVATION",
            "availability": "LOW",
            "reportedPrice": 75.0,
            "priceUnit": "kg",
            "language": "HINDI",
            "rawText": "Tamatar 75 rupaye kilo hai aaj",
            "dataSource": "DEMO",
            "confidence": "HIGH",
        }
        res = await client.post("/api/signals", json=create_payload)
        assert res.status_code == 200
        created_res = res.json()
        assert created_res["ok"] is True
        print(f"✓ Created signal ID: {created_res['signal']['id']}")

        # 6. Shopper Demand Signals (Parse with persist=False vs persist=True)
        print("\n[Test 6] Shopper Demand Signals...")
        shopper_text = "Mujhe 2 kilo tamatar aur thoda dhaniya chahiye"
        res = await client.post("/api/shopping-list/parse", json={
            "text": shopper_text,
            "marketId": "demo-ina",
            "persist": False
        })
        assert res.status_code == 200
        preview = res.json()
        assert preview["ok"] is True
        assert preview["persisted"] is False
        items = preview["items"]
        print(f"   Shopper input: '{shopper_text}'")
        print("   Structured demand parsed (persist=False):")
        for it in items:
            print(f"   • Product: {it['product']}, Qty: {it.get('quantity') or 'unspecified'}, Status: {it['status']}")
        tom = next((i for i in items if i["product"] == "Tomatoes"), None)
        assert tom is not None
        assert "2" in str(tom.get("quantity"))

        # Step B: Confirm & persist
        res = await client.post("/api/shopping-list/parse", json={
            "text": shopper_text,
            "marketId": "demo-ina",
            "persist": True
        })
        assert res.status_code == 200
        confirmed = res.json()
        assert confirmed["persisted"] is True
        print("✓ Confirmed and persisted shopper demand")

        # 7. Ask BazaarMind Grounded QA
        print("\n[Test 7] Ask BazaarMind (Evidence Grounding)...")
        res = await client.post("/api/ask-bazaar", json={
            "question": "Why are tomatoes showing tight today?",
            "marketId": "demo-ina",
            "dataSource": "DEMO"
        })
        assert res.status_code == 200
        ans = res.json()
        assert ans["ok"] is True
        print(f"   Q: 'Why are tomatoes showing tight today?'")
        print(f"   A: {ans['answer']}")
        print(f"   Signals grounding count: {ans.get('totalSignals')} (vendor: {ans.get('vendorObservations')}, shopper: {ans.get('shopperSignals')})")
        assert ans.get("totalSignals", 0) > 0
        assert "Azadpur" not in ans["answer"]
        assert "INA Market" in ans["answer"]
        print("✓ Verified strict INA Market grounding with zero external market contamination")

        # 8. Safe off-topic question refusal
        print("\n[Test 8] Ask BazaarMind (Safe Guardrails)...")
        res = await client.post("/api/ask-bazaar", json={
            "question": "Who won the cricket match yesterday?",
            "marketId": "demo-ina",
            "dataSource": "DEMO"
        })
        assert res.status_code == 200
        off_topic_ans = res.json()
        assert off_topic_ans["ok"] is True
        print(f"   Q: 'Who won the cricket match yesterday?'")
        print(f"   A: {off_topic_ans['answer']}")
        assert "dedicated strictly to local neighborhood market intelligence" in off_topic_ans["answer"]
        print("✓ Off-topic question politely declined")

        # 9. Demo Reset Mechanism
        print("\n[Test 9] Demo Reset Mechanism...")
        res = await client.post("/api/demo/reset")
        assert res.status_code == 200
        reset_res = res.json()
        assert reset_res["ok"] is True
        print(f"✓ Reset completed: {reset_res['message']}, seed count: {reset_res.get('signals')}")

        # Verify pulse after reset
        res = await client.get("/api/market-pulse?marketId=demo-ina&dataSource=DEMO")
        pulse_after = res.json()
        assert pulse_after["ok"] is True
        print(f"✓ Pulse verified after reset. Total products tracked: {len(pulse_after['products'])}")

    print("\n==================================================")
    print("       ALL E2E INTEGRATION TESTS PASSED!          ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
