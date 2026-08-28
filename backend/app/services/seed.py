from datetime import datetime, timedelta
from app.db import engine, Base, SessionLocal
from app.models import Event, TrajectoryPoint, WeatherField, Risk


def seed_database(reset=True):
    if reset:
        print("Dropping existing database tables...")
        Base.metadata.drop_all(bind=engine)

    print("Creating database schema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        base_time = datetime(2026, 8, 27, 12, 0, 0)

        # -------------------------------------------------------------------------
        # 1. EVT-2026-001: Extreme Rainfall over Gujarat (Primary Demo Event)
        # -------------------------------------------------------------------------
        evt1 = Event(
            id="EVT-2026-001",
            type="extreme_rainfall",
            status="active",
            location_name="Gujarat",
            centroid_lat=22.50,
            centroid_lon=71.80,
            severity="severe",
            probability=0.87,
            confidence="high",
            rainfall_efi=0.91,
            temperature_efi=0.18,
            wind_efi=0.73,
            ensemble_agreement=0.87,
            movement_direction="NE_E",
            movement_speed_kmh=18.0,
            forecast_lead_time_hours=48,
            detected_at=base_time,
            created_at=base_time + timedelta(minutes=5),
        )
        db.add(evt1)

        # Timesteps arc data for EVT-2026-001
        timesteps_evt1 = [
            {
                "label": "NOW",
                "offset": 0,
                "lat": 22.50,
                "lon": 71.80,
                "intensity": 120.0,
                "prob": 0.71,
                "radius": 15.0,
                "risk_level": "moderate",
                "overall_risk": "moderate",
                "flood_level": "high",
                "flood_prob": 0.71,
                "wind_level": "moderate",
                "wind_prob": 0.45,
                "heat_level": "low",
                "heat_prob": 0.10,
                "region": "Saurashtra & Central Gujarat",
                "impact_r": 45.0,
                # Weather fields
                "wf_12": {"rain": 95.0, "temp": 27.5, "wind": 35.0, "pres": 998.0, "hum": 88.0, "efi": 0.78, "max_i": 18.5, "conf": "high"},
                "wf_5": {"rain": 120.0, "peak_rain": 138.0, "temp": 27.2, "wind": 38.0, "pres": 997.5, "hum": 90.0, "efi": 0.85, "max_i": 26.0, "preservation": 92.0, "conf": "high"},
            },
            {
                "label": "+6h",
                "offset": 6,
                "lat": 22.72,
                "lon": 72.15,
                "intensity": 148.0,
                "prob": 0.76,
                "radius": 25.0,
                "risk_level": "high",
                "overall_risk": "high",
                "flood_level": "high",
                "flood_prob": 0.76,
                "wind_level": "moderate",
                "wind_prob": 0.52,
                "heat_level": "low",
                "heat_prob": 0.08,
                "region": "Central & North-Central Gujarat",
                "impact_r": 60.0,
                "wf_12": {"rain": 118.0, "temp": 26.8, "wind": 42.0, "pres": 995.0, "hum": 92.0, "efi": 0.82, "max_i": 24.0, "conf": "high"},
                "wf_5": {"rain": 148.0, "peak_rain": 168.0, "temp": 26.5, "wind": 46.0, "pres": 994.2, "hum": 94.0, "efi": 0.88, "max_i": 33.5, "preservation": 93.5, "conf": "high"},
            },
            {
                "label": "+12h",
                "offset": 12,
                "lat": 22.98,
                "lon": 72.58,
                "intensity": 178.0,
                "prob": 0.81,
                "radius": 38.0,
                "risk_level": "high",
                "overall_risk": "high",
                "flood_level": "severe",
                "flood_prob": 0.81,
                "wind_level": "high",
                "wind_prob": 0.60,
                "heat_level": "low",
                "heat_prob": 0.05,
                "region": "Vadodara & Mahi River Basin",
                "impact_r": 80.0,
                "wf_12": {"rain": 142.0, "temp": 26.0, "wind": 50.0, "pres": 992.0, "hum": 95.0, "efi": 0.87, "max_i": 31.0, "conf": "high"},
                "wf_5": {"rain": 178.0, "peak_rain": 202.0, "temp": 25.8, "wind": 55.0, "pres": 991.0, "hum": 96.0, "efi": 0.91, "max_i": 41.0, "preservation": 94.8, "conf": "high"},
            },
            {
                "label": "+18h",
                "offset": 18,
                "lat": 23.18,
                "lon": 73.08,
                "intensity": 214.0,
                "prob": 0.87,
                "radius": 52.0,
                "risk_level": "severe",
                "overall_risk": "severe",
                "flood_level": "severe",
                "flood_prob": 0.88,
                "wind_level": "high",
                "wind_prob": 0.68,
                "heat_level": "low",
                "heat_prob": 0.02,
                "region": "Panchmahal, Dahod & Eastern Gujarat Tributaries",
                "impact_r": 110.0,
                "wf_12": {"rain": 172.0, "temp": 25.2, "wind": 58.0, "pres": 989.0, "hum": 98.0, "efi": 0.91, "max_i": 38.0, "conf": "high"},
                "wf_5": {"rain": 214.0, "peak_rain": 245.0, "temp": 24.9, "wind": 64.0, "pres": 987.8, "hum": 99.0, "efi": 0.95, "max_i": 52.0, "preservation": 96.0, "conf": "high"},
            },
            {
                "label": "+24h",
                "offset": 24,
                "lat": 23.25,
                "lon": 73.65,
                "intensity": 150.0,
                "prob": 0.62,
                "radius": 70.0,
                "risk_level": "moderate",
                "overall_risk": "moderate",
                "flood_level": "high",
                "flood_prob": 0.62,
                "wind_level": "moderate",
                "wind_prob": 0.40,
                "heat_level": "low",
                "heat_prob": 0.05,
                "region": "Gujarat-Madhya Pradesh Border",
                "impact_r": 90.0,
                "wf_12": {"rain": 115.0, "temp": 26.5, "wind": 40.0, "pres": 994.0, "hum": 93.0, "efi": 0.74, "max_i": 22.0, "conf": "moderate"},
                "wf_5": {"rain": 150.0, "peak_rain": 172.0, "temp": 26.2, "wind": 44.0, "pres": 993.2, "hum": 95.0, "efi": 0.81, "max_i": 30.0, "preservation": 93.0, "conf": "high"},
            },
            {
                "label": "+48h",
                "offset": 48,
                "lat": 23.28,
                "lon": 74.60,
                "intensity": 45.0,
                "prob": 0.35,
                "radius": 110.0,
                "risk_level": "low",
                "overall_risk": "low",
                "flood_level": "moderate",
                "flood_prob": 0.35,
                "wind_level": "low",
                "wind_prob": 0.20,
                "heat_level": "low",
                "heat_prob": 0.10,
                "region": "Western Madhya Pradesh (Dissipating)",
                "impact_r": 65.0,
                "wf_12": {"rain": 32.0, "temp": 28.0, "wind": 25.0, "pres": 1001.0, "hum": 80.0, "efi": 0.42, "max_i": 8.0, "conf": "low"},
                "wf_5": {"rain": 45.0, "peak_rain": 54.0, "temp": 27.8, "wind": 28.0, "pres": 1000.5, "hum": 82.0, "efi": 0.49, "max_i": 12.0, "preservation": 91.0, "conf": "moderate"},
            },
        ]

        for step in timesteps_evt1:
            ts_time = base_time + timedelta(hours=step["offset"])
            deg_offset = step["radius"] / 111.0

            tp = TrajectoryPoint(
                event_id="EVT-2026-001",
                timestep_label=step["label"],
                timestep_hours_offset=step["offset"],
                timestamp=ts_time,
                lat=step["lat"],
                lon=step["lon"],
                intensity=step["intensity"],
                probability=step["prob"],
                uncertainty_radius_km=step["radius"],
                bbox_min_lat=round(step["lat"] - deg_offset, 3),
                bbox_min_lon=round(step["lon"] - deg_offset, 3),
                bbox_max_lat=round(step["lat"] + deg_offset, 3),
                bbox_max_lon=round(step["lon"] + deg_offset, 3),
                risk_level=step["risk_level"],
            )
            db.add(tp)

            # Weather field 12km
            wf12 = WeatherField(
                event_id="EVT-2026-001",
                timestep_label=step["label"],
                resolution_km=12.0,
                rainfall_mm=step["wf_12"]["rain"],
                temperature_c=step["wf_12"]["temp"],
                wind_speed_kmh=step["wf_12"]["wind"],
                pressure_hpa=step["wf_12"]["pres"],
                humidity_pct=step["wf_12"]["hum"],
                efi=step["wf_12"]["efi"],
                max_intensity_mmhr=step["wf_12"]["max_i"],
                model_confidence=step["wf_12"]["conf"],
            )
            db.add(wf12)

            # Weather field 5km
            wf5 = WeatherField(
                event_id="EVT-2026-001",
                timestep_label=step["label"],
                resolution_km=5.0,
                rainfall_mm=step["wf_5"]["rain"],
                peak_rainfall_mm=step["wf_5"]["peak_rain"],
                temperature_c=step["wf_5"]["temp"],
                wind_speed_kmh=step["wf_5"]["wind"],
                pressure_hpa=step["wf_5"]["pres"],
                humidity_pct=step["wf_5"]["hum"],
                efi=step["wf_5"]["efi"],
                max_intensity_mmhr=step["wf_5"]["max_i"],
                extreme_preservation_pct=step["wf_5"]["preservation"],
                model_confidence=step["wf_5"]["conf"],
            )
            db.add(wf5)

            # Risk per timestep
            r = Risk(
                event_id="EVT-2026-001",
                timestep_label=step["label"],
                overall_risk=step["overall_risk"],
                flood_risk_level=step["flood_level"],
                flood_risk_probability=step["flood_prob"],
                wind_risk_level=step["wind_level"],
                wind_risk_probability=step["wind_prob"],
                heat_risk_level=step["heat_level"],
                heat_risk_probability=step["heat_prob"],
                impact_radius_km=step["impact_r"],
                impact_region_name=step["region"],
                expected_start=base_time,
                peak_period=base_time + timedelta(hours=18),
                expected_end=base_time + timedelta(hours=36),
            )
            db.add(r)

        # -------------------------------------------------------------------------
        # 2. EVT-2026-002: High Wind over Arabian Sea (Secondary Event)
        # -------------------------------------------------------------------------
        evt2 = Event(
            id="EVT-2026-002",
            type="high_wind",
            status="active",
            location_name="Arabian Sea",
            centroid_lat=18.50,
            centroid_lon=67.20,
            severity="moderate",
            probability=0.71,
            confidence="moderate",
            rainfall_efi=0.22,
            temperature_efi=0.15,
            wind_efi=0.84,
            ensemble_agreement=0.75,
            movement_direction="NW",
            movement_speed_kmh=22.0,
            forecast_lead_time_hours=24,
            detected_at=base_time,
            created_at=base_time,
        )
        db.add(evt2)

        tp2 = TrajectoryPoint(
            event_id="EVT-2026-002",
            timestep_label="NOW",
            timestep_hours_offset=0,
            timestamp=base_time,
            lat=18.50,
            lon=67.20,
            intensity=78.0,
            probability=0.71,
            uncertainty_radius_km=20.0,
            bbox_min_lat=18.32,
            bbox_min_lon=67.01,
            bbox_max_lat=18.68,
            bbox_max_lon=67.39,
            risk_level="moderate",
        )
        db.add(tp2)

        wf2_12 = WeatherField(
            event_id="EVT-2026-002",
            timestep_label="NOW",
            resolution_km=12.0,
            rainfall_mm=15.0,
            temperature_c=28.5,
            wind_speed_kmh=65.0,
            pressure_hpa=996.0,
            humidity_pct=85.0,
            efi=0.76,
            model_confidence="moderate",
        )
        db.add(wf2_12)

        wf2_5 = WeatherField(
            event_id="EVT-2026-002",
            timestep_label="NOW",
            resolution_km=5.0,
            rainfall_mm=22.0,
            peak_rainfall_mm=28.0,
            temperature_c=28.2,
            wind_speed_kmh=78.0,
            pressure_hpa=995.0,
            humidity_pct=87.0,
            efi=0.84,
            max_intensity_mmhr=12.0,
            extreme_preservation_pct=91.5,
            model_confidence="high",
        )
        db.add(wf2_5)

        r2 = Risk(
            event_id="EVT-2026-002",
            timestep_label="NOW",
            overall_risk="moderate",
            flood_risk_level="low",
            flood_risk_probability=0.15,
            wind_risk_level="high",
            wind_risk_probability=0.71,
            heat_risk_level="low",
            heat_risk_probability=0.05,
            impact_radius_km=120.0,
            impact_region_name="Offshore North Arabian Sea",
            expected_start=base_time,
            peak_period=base_time + timedelta(hours=12),
            expected_end=base_time + timedelta(hours=24),
        )
        db.add(r2)

        # -------------------------------------------------------------------------
        # 3. EVT-2026-003: Extreme Heat over Rajasthan (Secondary Event)
        # -------------------------------------------------------------------------
        evt3 = Event(
            id="EVT-2026-003",
            type="extreme_heat",
            status="active",
            location_name="Rajasthan",
            centroid_lat=26.90,
            centroid_lon=71.20,
            severity="severe",
            probability=0.82,
            confidence="high",
            rainfall_efi=0.05,
            temperature_efi=0.93,
            wind_efi=0.31,
            ensemble_agreement=0.84,
            movement_direction="E_NE",
            movement_speed_kmh=10.0,
            forecast_lead_time_hours=48,
            detected_at=base_time,
            created_at=base_time,
        )
        db.add(evt3)

        tp3 = TrajectoryPoint(
            event_id="EVT-2026-003",
            timestep_label="NOW",
            timestep_hours_offset=0,
            timestamp=base_time,
            lat=26.90,
            lon=71.20,
            intensity=47.5,
            probability=0.82,
            uncertainty_radius_km=30.0,
            bbox_min_lat=26.63,
            bbox_min_lon=70.89,
            bbox_max_lat=27.17,
            bbox_max_lon=71.51,
            risk_level="severe",
        )
        db.add(tp3)

        wf3_12 = WeatherField(
            event_id="EVT-2026-003",
            timestep_label="NOW",
            resolution_km=12.0,
            rainfall_mm=0.0,
            temperature_c=44.5,
            wind_speed_kmh=18.0,
            pressure_hpa=1002.0,
            humidity_pct=22.0,
            efi=0.86,
            model_confidence="high",
        )
        db.add(wf3_12)

        wf3_5 = WeatherField(
            event_id="EVT-2026-003",
            timestep_label="NOW",
            resolution_km=5.0,
            rainfall_mm=0.0,
            peak_rainfall_mm=0.0,
            temperature_c=47.5,
            wind_speed_kmh=22.0,
            pressure_hpa=1001.2,
            humidity_pct=18.0,
            efi=0.93,
            extreme_preservation_pct=94.0,
            model_confidence="high",
        )
        db.add(wf3_5)

        r3 = Risk(
            event_id="EVT-2026-003",
            timestep_label="NOW",
            overall_risk="severe",
            flood_risk_level="low",
            flood_risk_probability=0.02,
            wind_risk_level="low",
            wind_risk_probability=0.20,
            heat_risk_level="severe",
            heat_risk_probability=0.82,
            impact_radius_km=150.0,
            impact_region_name="Thar Desert & Western Rajasthan",
            expected_start=base_time,
            peak_period=base_time + timedelta(hours=24),
            expected_end=base_time + timedelta(hours=48),
        )
        db.add(r3)

        db.commit()

        # Print summary
        event_count = db.query(Event).count()
        tp_count = db.query(TrajectoryPoint).count()
        wf_count = db.query(WeatherField).count()
        risk_count = db.query(Risk).count()

        print("\n=======================================================")
        print("Database Seeding Completed Successfully!")
        print(f"Events Created:           {event_count}")
        print(f"Trajectory Points:        {tp_count}")
        print(f"Weather Fields:           {wf_count}")
        print(f"Risk Assessments:         {risk_count}")
        print("=======================================================\n")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


def seed_if_empty():
    db = SessionLocal()
    try:
        count = db.query(Event).count()
        if count == 0:
            print("Database is empty. Populating seed dataset...")
            seed_database(reset=False)
    except Exception as e:
        print(f"Error checking DB seed status: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
