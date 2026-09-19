package domain

import (
	"errors"
	"time"
)

// Common domain errors
var (
	ErrNotFound       = errors.New("entity not found")
	ErrInvalidID      = errors.New("invalid entity ID format")
	ErrValidationFail = errors.New("validation failed")
)

// EntityType represents the category of the entity.
type EntityType string

const (
	EntityTypeVehicle   EntityType = "vehicle"
	EntityTypeIoTDevice EntityType = "iot_device"
	EntityTypeFacility  EntityType = "facility"
	EntityTypeOther     EntityType = "other"
)

// EntityStatus represents the operational status of the entity.
type EntityStatus string

const (
	EntityStatusActive      EntityStatus = "active"
	EntityStatusInactive    EntityStatus = "inactive"
	EntityStatusMaintenance EntityStatus = "maintenance"
)

// Entity represents a geo-located entity in the system.
type Entity struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Type        EntityType             `json:"type"`
	Status      EntityStatus           `json:"status"`
	Description string                 `json:"description,omitempty"`
	Attributes  map[string]interface{} `json:"attributes,omitempty"`
	Latitude    float64                `json:"latitude"`
	Longitude   float64                `json:"longitude"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// CreateEntityInput holds data needed to create an entity.
type CreateEntityInput struct {
	Name        string                 `json:"name" validate:"required,min=3,max=100"`
	Type        string                 `json:"type" validate:"required,oneof=vehicle iot_device facility other VEHICLE IOT_DEVICE FACILITY OTHER"`
	Status      string                 `json:"status" validate:"required,oneof=active inactive maintenance ACTIVE INACTIVE MAINTENANCE"`
	Description *string                `json:"description" validate:"omitempty,max=500"`
	Attributes  map[string]interface{} `json:"attributes" validate:"omitempty"`
	Latitude    float64                `json:"latitude" validate:"required,latitude"`
	Longitude   float64                `json:"longitude" validate:"required,longitude"`
}

// UpdateEntityInput holds data needed to update an existing entity.
type UpdateEntityInput struct {
	Name        string                 `json:"name" validate:"required,min=3,max=100"`
	Type        string                 `json:"type" validate:"required,oneof=vehicle iot_device facility other VEHICLE IOT_DEVICE FACILITY OTHER"`
	Status      string                 `json:"status" validate:"required,oneof=active inactive maintenance ACTIVE INACTIVE MAINTENANCE"`
	Description *string                `json:"description" validate:"omitempty,max=500"`
	Attributes  map[string]interface{} `json:"attributes" validate:"omitempty"`
	Latitude    float64                `json:"latitude" validate:"required,latitude"`
	Longitude   float64                `json:"longitude" validate:"required,longitude"`
}
