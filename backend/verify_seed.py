import sys
from app.db import SessionLocal
from app.models import Event, TrajectoryPoint, WeatherField, Risk


def verify():
    db = SessionLocal()
    try:
        # 1. All 3 events exist
        events = db.query(Event).all()
        print(f"[CHECK 1] Events count: {len(events)}")
        assert len(events) == 3, f"Expected 3 events, got {len(events)}"
        event_ids = {e.id for e in events}
        assert "EVT-2026-001" in event_ids, "EVT-2026-001 missing"
        assert "EVT-2026-002" in event_ids, "EVT-2026-002 missing"
        assert "EVT-2026-003" in event_ids, "EVT-2026-003 missing"
        print(" -> All 3 events exist: EVT-2026-001, EVT-2026-002, EVT-2026-003. PASS.")

        # 2. EVT-2026-001 has exactly 6 trajectory points, chronological order, NE->E shift
        evt1_tps = (
            db.query(TrajectoryPoint)
            .filter_by(event_id="EVT-2026-001")
            .order_by(TrajectoryPoint.timestep_hours_offset)
            .all()
        )
        print(f"[CHECK 2] EVT-2026-001 trajectory points count: {len(evt1_tps)}")
        assert len(evt1_tps) == 6, f"Expected 6 trajectory points, got {len(evt1_tps)}"

        offsets = [tp.timestep_hours_offset for tp in evt1_tps]
        print(f" -> Timestep offsets: {offsets}")
        assert offsets == [0, 6, 12, 18, 24, 48], "Offsets not in expected chronological order"

        # Check NE -> E bearing shift: lat increases (North), lon increases (East)
        lats = [tp.lat for tp in evt1_tps]
        lons = [tp.lon for tp in evt1_tps]
        print(f" -> Latitudes: {lats}")
        print(f" -> Longitudes: {lons}")
        
        # Verify monotonically non-decreasing latitude/longitude along NE->E bearing
        for i in range(len(evt1_tps) - 1):
            assert lats[i+1] >= lats[i], f"Latitude regressed at step {i}"
            assert lons[i+1] > lons[i], f"Longitude did not move East at step {i}"
        print(" -> Centroid trajectory correctly moves NE -> E. PASS.")

        # 3. EVT-2026-001 risk at +18h is "severe" and at NOW is "moderate"
        now_risk = (
            db.query(Risk)
            .filter_by(event_id="EVT-2026-001", timestep_label="NOW")
            .first()
        )
        p18_risk = (
            db.query(Risk)
            .filter_by(event_id="EVT-2026-001", timestep_label="+18h")
            .first()
        )
        print(f" -> NOW overall risk: {now_risk.overall_risk}")
        print(f" -> +18h overall risk: {p18_risk.overall_risk}")
        assert now_risk.overall_risk == "moderate", f"Expected moderate, got {now_risk.overall_risk}"
        assert p18_risk.overall_risk == "severe", f"Expected severe, got {p18_risk.overall_risk}"
        print(" -> Risk timeline matches expected arc (NOW=moderate, +18h=severe). PASS.")

        # 4. 5km weather field rows paired with 12km rows, and 5km peak_rainfall_mm > 12km rainfall_mm
        for step in ["NOW", "+6h", "+12h", "+18h", "+24h", "+48h"]:
            wf12 = (
                db.query(WeatherField)
                .filter_by(event_id="EVT-2026-001", timestep_label=step, resolution_km=12.0)
                .first()
            )
            wf5 = (
                db.query(WeatherField)
                .filter_by(event_id="EVT-2026-001", timestep_label=step, resolution_km=5.0)
                .first()
            )
            assert wf12 is not None, f"Missing 12km row for {step}"
            assert wf5 is not None, f"Missing 5km row for {step}"
            print(
                f" -> Timestep {step:5s}: 12km rain={wf12.rainfall_mm:5.1f}mm | 5km peak={wf5.peak_rainfall_mm:5.1f}mm"
            )
            assert (
                wf5.peak_rainfall_mm > wf12.rainfall_mm
            ), f"5km peak ({wf5.peak_rainfall_mm}) not greater than 12km ({wf12.rainfall_mm}) at {step}"
        print(" -> Downscaled 5km weather fields properly sharpen coarse 12km fields. PASS.")

        print("\nAll spot-checks passed cleanly!\n")
    finally:
        db.close()


if __name__ == "__main__":
    verify()
