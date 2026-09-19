package service

import (
	"context"
	"strings"
	"time"

	"geo-entity-manager/backend/internal/domain"
	"geo-entity-manager/backend/internal/repository"
	"geo-entity-manager/backend/internal/validation"

	"github.com/google/uuid"
)

// EntityService defines the business logic operations for entities.
type EntityService interface {
	Create(ctx context.Context, input domain.CreateEntityInput) (*domain.Entity, []validation.FieldErrorDetail, error)
	Get(ctx context.Context, id string) (*domain.Entity, error)
	List(ctx context.Context) ([]*domain.Entity, error)
	Update(ctx context.Context, id string, input domain.UpdateEntityInput) (*domain.Entity, []validation.FieldErrorDetail, error)
	Delete(ctx context.Context, id string) error
}

type entityService struct {
	repo      repository.EntityRepository
	validator *validation.Validator
}

// NewEntityService creates a new instance of EntityService.
func NewEntityService(repo repository.EntityRepository, v *validation.Validator) EntityService {
	return &entityService{
		repo:      repo,
		validator: v,
	}
}

func (s *entityService) Create(ctx context.Context, input domain.CreateEntityInput) (*domain.Entity, []validation.FieldErrorDetail, error) {
	input.Name = strings.TrimSpace(input.Name)

	if errs := s.validator.ValidateStruct(input); len(errs) > 0 {
		return nil, errs, domain.ErrValidationFail
	}

	now := time.Now().UTC()
	desc := ""
	if input.Description != nil {
		desc = strings.TrimSpace(*input.Description)
	}

	entity := &domain.Entity{
		ID:          uuid.NewString(),
		Name:        input.Name,
		Type:        domain.EntityType(input.Type),
		Status:      domain.EntityStatus(input.Status),
		Description: desc,
		Latitude:    input.Latitude,
		Longitude:   input.Longitude,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.repo.Create(ctx, entity); err != nil {
		return nil, nil, err
	}

	return entity, nil, nil
}

func (s *entityService) Get(ctx context.Context, id string) (*domain.Entity, error) {
	if _, err := uuid.Parse(id); err != nil {
		return nil, domain.ErrInvalidID
	}
	return s.repo.GetByID(ctx, id)
}

func (s *entityService) List(ctx context.Context) ([]*domain.Entity, error) {
	return s.repo.List(ctx)
}

func (s *entityService) Update(ctx context.Context, id string, input domain.UpdateEntityInput) (*domain.Entity, []validation.FieldErrorDetail, error) {
	if _, err := uuid.Parse(id); err != nil {
		return nil, nil, domain.ErrInvalidID
	}

	input.Name = strings.TrimSpace(input.Name)

	if errs := s.validator.ValidateStruct(input); len(errs) > 0 {
		return nil, errs, domain.ErrValidationFail
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}

	desc := ""
	if input.Description != nil {
		desc = strings.TrimSpace(*input.Description)
	}

	existing.Name = input.Name
	existing.Type = domain.EntityType(input.Type)
	existing.Status = domain.EntityStatus(input.Status)
	existing.Description = desc
	existing.Latitude = input.Latitude
	existing.Longitude = input.Longitude
	existing.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, nil, err
	}

	return existing, nil, nil
}

func (s *entityService) Delete(ctx context.Context, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return domain.ErrInvalidID
	}
	return s.repo.Delete(ctx, id)
}
