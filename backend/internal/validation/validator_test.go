package validation_test

import (
	"testing"

	"geo-entity-manager/backend/internal/domain"
	"geo-entity-manager/backend/internal/validation"
)

func TestValidationRules(t *testing.T) {
	v := validation.New()

	descValid := "A test entity description"
	descTooLong := string(make([]byte, 501))

	tests := []struct {
		name        string
		input       domain.CreateEntityInput
		expectValid bool
		errField    string
	}{
		{
			name: "Valid input",
			input: domain.CreateEntityInput{
				Name:        "Test IoT Sensor",
				Type:        "iot_device",
				Status:      "active",
				Description: &descValid,
				Latitude:    -2.98,
				Longitude:   104.75,
			},
			expectValid: true,
		},
		{
			name: "Missing name",
			input: domain.CreateEntityInput{
				Name:      "",
				Type:      "vehicle",
				Status:    "active",
				Latitude:  10.0,
				Longitude: 20.0,
			},
			expectValid: false,
			errField:    "name",
		},
		{
			name: "Invalid type enum",
			input: domain.CreateEntityInput{
				Name:      "Valid Name",
				Type:      "airplane",
				Status:    "active",
				Latitude:  10.0,
				Longitude: 20.0,
			},
			expectValid: false,
			errField:    "type",
		},
		{
			name: "Invalid status enum",
			input: domain.CreateEntityInput{
				Name:      "Valid Name",
				Type:      "vehicle",
				Status:    "destroyed",
				Latitude:  10.0,
				Longitude: 20.0,
			},
			expectValid: false,
			errField:    "status",
		},
		{
			name: "Latitude out of range (> 90)",
			input: domain.CreateEntityInput{
				Name:      "Valid Name",
				Type:      "facility",
				Status:    "active",
				Latitude:  95.0,
				Longitude: 20.0,
			},
			expectValid: false,
			errField:    "latitude",
		},
		{
			name: "Latitude out of range (< -90)",
			input: domain.CreateEntityInput{
				Name:      "Valid Name",
				Type:      "facility",
				Status:    "active",
				Latitude:  -95.0,
				Longitude: 20.0,
			},
			expectValid: false,
			errField:    "latitude",
		},
		{
			name: "Longitude out of range (> 180)",
			input: domain.CreateEntityInput{
				Name:      "Valid Name",
				Type:      "other",
				Status:    "inactive",
				Latitude:  10.0,
				Longitude: 185.0,
			},
			expectValid: false,
			errField:    "longitude",
		},
		{
			name: "Longitude out of range (< -180)",
			input: domain.CreateEntityInput{
				Name:      "Valid Name",
				Type:      "other",
				Status:    "inactive",
				Latitude:  10.0,
				Longitude: -185.0,
			},
			expectValid: false,
			errField:    "longitude",
		},
		{
			name: "Description too long (> 500)",
			input: domain.CreateEntityInput{
				Name:        "Valid Name",
				Type:        "facility",
				Status:      "maintenance",
				Description: &descTooLong,
				Latitude:    10.0,
				Longitude:   20.0,
			},
			expectValid: false,
			errField:    "description",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			details := v.ValidateStruct(tt.input)
			if tt.expectValid {
				if len(details) != 0 {
					t.Fatalf("expected valid input, got errors: %+v", details)
				}
			} else {
				if len(details) == 0 {
					t.Fatalf("expected validation error for field %q, got none", tt.errField)
				}
				found := false
				for _, d := range details {
					if d.Field == tt.errField {
						found = true
						break
					}
				}
				if !found {
					t.Fatalf("expected error on field %q, got: %+v", tt.errField, details)
				}
			}
		})
	}
}
