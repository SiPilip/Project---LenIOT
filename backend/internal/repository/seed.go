package repository

import (
	"context"
	"time"

	"geo-entity-manager/backend/internal/domain"

	"github.com/google/uuid"
)

// SeedInitialDataIfEmpty seeds sample realistic Indonesian geospatial entities if the database is empty.
func (r *sqliteEntityRepository) SeedInitialDataIfEmpty(ctx context.Context) error {
	var count int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM entities").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	now := time.Now().UTC()
	samples := []*domain.Entity{
		{
			ID:          uuid.NewString(),
			Name:        "Logistics Truck Alpha-01",
			Type:        domain.EntityTypeVehicle,
			Status:      domain.EntityStatusActive,
			Description: "Refrigerated freight truck delivering medical and food supplies in South Sumatra route.",
			Attributes: map[string]interface{}{
				"license_plate":  "BG 8421 LN",
				"fuel_level_pct": 82,
				"speed_kmh":      58,
				"cargo_type":     "Vaccines & Pharmaceuticals",
				"driver_name":    "Rahmat Hidayat",
			},
			Latitude:  -2.9835,
			Longitude: 104.7565, // Palembang (Ampera area)
			CreatedAt: now.Add(-3 * time.Hour),
			UpdatedAt: now.Add(-10 * time.Minute),
		},
		{
			ID:          uuid.NewString(),
			Name:        "Water Quality Telemetry Node #4",
			Type:        domain.EntityTypeIoTDevice,
			Status:      domain.EntityStatusActive,
			Description: "Solar-powered IoT sensor monitoring Musi River acidity, dissolved oxygen, and water level.",
			Attributes: map[string]interface{}{
				"battery_pct":      95,
				"dissolved_oxygen": 6.4,
				"water_temp_c":     28.2,
				"firmware_version": "v3.1.2-len",
				"solar_charging":   true,
			},
			Latitude:  -2.9921,
			Longitude: 104.7628, // Musi River station
			CreatedAt: now.Add(-24 * time.Hour),
			UpdatedAt: now.Add(-5 * time.Minute),
		},
		{
			ID:          uuid.NewString(),
			Name:        "Central Distribution Hub Palembang",
			Type:        domain.EntityTypeFacility,
			Status:      domain.EntityStatusActive,
			Description: "Primary regional cold storage and sorting terminal serving southern Sumatra operations.",
			Attributes: map[string]interface{}{
				"capacity_sqm":     4500,
				"facility_manager": "Ir. Hendra Wijaya",
				"dock_doors":       12,
				"operating_hours":  "24/7",
				"security_level":   "Tier 3 Biometric",
			},
			Latitude:  -2.9348,
			Longitude: 104.7214, // Sukarami / Airport corridor
			CreatedAt: now.Add(-48 * time.Hour),
			UpdatedAt: now.Add(-1 * time.Hour),
		},
		{
			ID:          uuid.NewString(),
			Name:        "Smart Weather Station West",
			Type:        domain.EntityTypeIoTDevice,
			Status:      domain.EntityStatusMaintenance,
			Description: "Micro-climate radar station undergoing ultrasonic wind vane calibration.",
			Attributes: map[string]interface{}{
				"battery_pct":         42,
				"maintenance_reason":  "Anemometer recalibration",
				"technician_assigned": "Siti Nurhaliza",
				"firmware_version":    "v2.8.4",
			},
			Latitude:  -2.9654,
			Longitude: 104.7189, // Bukit Besar area
			CreatedAt: now.Add(-72 * time.Hour),
			UpdatedAt: now.Add(-30 * time.Minute),
		},
		{
			ID:          uuid.NewString(),
			Name:        "Emergency Response Unit E-03",
			Type:        domain.EntityTypeVehicle,
			Status:      domain.EntityStatusActive,
			Description: "All-terrain emergency response cruiser equipped with satellite uplink.",
			Attributes: map[string]interface{}{
				"license_plate":  "BG 1945 RI",
				"fuel_level_pct": 96,
				"speed_kmh":      0,
				"equipment":      "Defibrillator, SatComm, Rescue Winch",
			},
			Latitude:  -3.0012,
			Longitude: 104.7891, // Jakabaring area
			CreatedAt: now.Add(-12 * time.Hour),
			UpdatedAt: now.Add(-2 * time.Minute),
		},
	}

	for _, s := range samples {
		if err := r.Create(ctx, s); err != nil {
			return err
		}
	}

	return nil
}
