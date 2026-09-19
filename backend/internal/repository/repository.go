package repository

import (
	"context"
	"geo-entity-manager/backend/internal/domain"
)

// EntityRepository defines data access methods for entities.
type EntityRepository interface {
	Create(ctx context.Context, entity *domain.Entity) error
	GetByID(ctx context.Context, id string) (*domain.Entity, error)
	List(ctx context.Context) ([]*domain.Entity, error)
	Update(ctx context.Context, entity *domain.Entity) error
	Delete(ctx context.Context, id string) error
	SeedInitialDataIfEmpty(ctx context.Context) error
}
