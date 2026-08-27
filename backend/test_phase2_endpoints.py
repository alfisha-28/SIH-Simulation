import sys
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_endpoints():
    print("Beginning Phase 2 API Verification...\n")

    # Test 0: OpenAPI schema validation
    print("[0] Testing GET /openapi.json ...")
    response = client.get("/openapi.json")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    schema = response.json()
    assert "paths" in schema
    paths = schema["paths"]
    print(" -> Paths in OpenAPI schema:", list(paths.keys()))
    assert "/events" in paths
    assert "/events/{event_id}" in paths
    assert "/events/{event_id}/forecast" in paths
    assert "/events/{event_id}/risk" in paths
    assert "/risk" in paths
    print(" -> OpenAPI schema generated cleanly with all expected routes. PASS.")

    # Test 1: GET /events
    print("\n[1] Testing GET /events ...")
    response = client.get("/events")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "events" in data, "Response missing 'events' key"
    events = data["events"]
    assert len(events) == 3, f"Expected 3 events, got {len(events)}"
    print(f" -> Found {len(events)} events.")
    severities = [e["severity"] for e in events]
    probs = [e["probability"] for e in events]
    print(f" -> Severities: {severities}")
    print(f" -> Probabilities: {probs}")
    assert severities[0] == "severe" and severities[1] == "severe" and severities[2] == "moderate", \
        f"Incorrect severity ordering: {severities}"
    assert probs[0] >= probs[1], f"Probability not descending among severe events: {probs[:2]}"
    print(" -> GET /events PASS.")

    # Test 2: GET /events/EVT-2026-001
    print("\n[2] Testing GET /events/EVT-2026-001 ...")
    response = client.get("/events/EVT-2026-001")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    detail = response.json()
    assert detail["event_id"] == "EVT-2026-001"
    assert "centroid" in detail and "lat" in detail["centroid"] and "lon" in detail["centroid"]
    assert "bbox" in detail and "min_lat" in detail["bbox"] and "max_lon" in detail["bbox"]
    assert "efi_breakdown" in detail
    efi = detail["efi_breakdown"]
    assert efi["rainfall"] == 0.91 and efi["temperature"] == 0.18 and efi["wind"] == 0.73
    assert detail["movement"]["direction"] == "NE_E" and detail["movement"]["speed_kmh"] == 18.0
    print(" -> Full EventDetail payload & EFI breakdown correct. PASS.")

    # Test 3: GET /events/EVT-2026-999 (404)
    print("\n[3] Testing GET /events/EVT-2026-999 (Nonexistent) ...")
    response = client.get("/events/EVT-2026-999")
    assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    err = response.json()
    assert err.get("detail") == "Event EVT-2026-999 not found", f"Unexpected error detail: {err}"
    print(" -> 404 clean error response verified. PASS.")

    # Test 4: GET /events/EVT-2026-001/forecast
    print("\n[4] Testing GET /events/EVT-2026-001/forecast ...")
    response = client.get("/events/EVT-2026-001/forecast")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    fc = response.json()
    assert fc["event_id"] == "EVT-2026-001"
    timeline = fc["timeline"]
    assert len(timeline) == 6, f"Expected 6 timesteps, got {len(timeline)}"
    for step in timeline:
        coarse = step["coarse"]
        downscaled = step["downscaled"]
        assert coarse is not None, f"Missing coarse data for timestep {step['timestep_label']}"
        assert downscaled is not None, f"Missing downscaled data for timestep {step['timestep_label']}"
        assert coarse["resolution_km"] == 12.0
        assert downscaled["resolution_km"] == 5.0
        assert downscaled["peak_rainfall_mm"] > coarse["rainfall_mm"], \
            f"5km peak ({downscaled['peak_rainfall_mm']}) not > 12km ({coarse['rainfall_mm']}) at {step['timestep_label']}"
    print(" -> 6 timesteps with paired coarse/downscaled fields and peak_rainfall_mm > rainfall_mm verified. PASS.")

    # Test 5: GET /events/EVT-2026-001/risk?timestep=+18h
    print("\n[5] Testing GET /events/EVT-2026-001/risk?timestep=+18h ...")
    response = client.get("/events/EVT-2026-001/risk?timestep=+18h")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    risk_p18 = response.json()
    assert risk_p18["overall_risk"] == "severe", f"Expected 'severe', got {risk_p18['overall_risk']}"
    print(" -> +18h overall_risk is 'severe'. PASS.")

    # Test 6: GET /events/EVT-2026-001/risk (no param, default NOW)
    print("\n[6] Testing GET /events/EVT-2026-001/risk (default NOW) ...")
    response = client.get("/events/EVT-2026-001/risk")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    risk_now = response.json()
    assert risk_now["overall_risk"] == "moderate", f"Expected 'moderate', got {risk_now['overall_risk']}"
    print(" -> Default NOW overall_risk is 'moderate'. PASS.")

    # Test 7: GET /risk?lat=21.17&lon=72.83 (Near Gujarat)
    print("\n[7] Testing GET /risk?lat=21.17&lon=72.83 (Near Gujarat) ...")
    response = client.get("/risk?lat=21.17&lon=72.83")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    geo_risk = response.json()
    assert geo_risk["nearest_event_id"] == "EVT-2026-001", f"Expected EVT-2026-001, got {geo_risk['nearest_event_id']}"
    assert geo_risk["primary_threat"] == "flash_flood", f"Expected flash_flood, got {geo_risk['primary_threat']}"
    print(f" -> Near Gujarat geo-risk: nearest={geo_risk['nearest_event_id']}, threat={geo_risk['primary_threat']}, risk={geo_risk['risk']}, prob={geo_risk['probability']}. PASS.")

    # Test 8: GET /risk?lat=8.0&lon=77.0 (Far South)
    print("\n[8] Testing GET /risk?lat=8.0&lon=77.0 (Far South) ...")
    response = client.get("/risk?lat=8.0&lon=77.0")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    geo_risk_far = response.json()
    assert geo_risk_far["nearest_event_id"] is None, f"Expected None, got {geo_risk_far['nearest_event_id']}"
    assert geo_risk_far["risk"] == "low"
    assert geo_risk_far["primary_threat"] == "none"
    assert geo_risk_far["probability"] == 0.05
    print(" -> Far South fallback low/none verified. PASS.")

    # Test 9: GET /risk (Missing params validation test)
    print("\n[9] Testing GET /risk without params (422 expected) ...")
    response = client.get("/risk")
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    print(" -> Missing parameters returns 422 Unprocessable Entity. PASS.")

    print("\n=======================================================")
    print("ALL PHASE 2 ENDPOINT VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=======================================================\n")


if __name__ == "__main__":
    test_endpoints()
