package repository_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"geo-entity-manager/backend/internal/domain"
	"geo-entity-manager/backend/internal/repository"
	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

func setupTestDB(t *testing.T) repository.EntityRepository {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open in-memory db: %v", err)
	}

	repo, err := repository.NewSQLiteRepositoryFromDB(db)
	if err != nil {
		t.Fatalf("failed to initialize sqlite repo from db: %v", err)
	}

	t.Cleanup(func() {
		_ = db.Close()
	})

	return repo
}

func TestSQLiteRepository_CRUD(t *testing.T) {
	repo := setupTestDB(t)
	ctx := context.Background()

	id := uuid.NewString()
	now := time.Now().UTC().Truncate(time.Second)

	entity := &domain.Entity{
		ID:          id,
		Name:        "Warehouse Gate Sensor",
		Type:        domain.EntityTypeIoTDevice,
		Status:      domain.EntityStatusActive,
		Description: "Monitoring gate entrance",
		Attributes: map[string]interface{}{
			"firmware": "v1.0.0",
			"battery":  float64(98),
		},
		Latitude:  -6.2088,
		Longitude: 106.8456,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// 1. Create
	if err := repo.Create(ctx, entity); err != nil {
		t.Fatalf("failed to create entity: %v", err)
	}

	// 2. GetByID
	got, err := repo.GetByID(ctx, id)
	if err != nil {
		t.Fatalf("failed to get entity by ID: %v", err)
	}
	if got.Name != entity.Name || got.Type != entity.Type || got.Latitude != entity.Latitude {
		t.Fatalf("retrieved entity does not match created entity: got %+v, want %+v", got, entity)
	}
	if got.Attributes == nil || got.Attributes["firmware"] != "v1.0.0" {
		t.Fatalf("expected attributes to persist, got: %+v", got.Attributes)
	}

	// 3. List
	list, err := repo.List(ctx)
	if err != nil {
		t.Fatalf("failed to list entities: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 entity in list, got %d", len(list))
	}

	// 4. Update
	got.Name = "Updated Warehouse Sensor"
	got.Status = domain.EntityStatusMaintenance
	got.UpdatedAt = time.Now().UTC().Truncate(time.Second)
	if err := repo.Update(ctx, got); err != nil {
		t.Fatalf("failed to update entity: %v", err)
	}

	updated, err := repo.GetByID(ctx, id)
	if err != nil {
		t.Fatalf("failed to get updated entity: %v", err)
	}
	if updated.Name != "Updated Warehouse Sensor" || updated.Status != domain.EntityStatusMaintenance {
		t.Fatalf("updated entity did not persist properly: %+v", updated)
	}

	// 5. Delete
	if err := repo.Delete(ctx, id); err != nil {
		t.Fatalf("failed to delete entity: %v", err)
	}

	// 6. Verify Delete
	_, err = repo.GetByID(ctx, id)
	if err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound after deletion, got %v", err)
	}
}
