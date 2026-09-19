package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"geo-entity-manager/backend/internal/domain"
	_ "modernc.org/sqlite"
)

type sqliteEntityRepository struct {
	db *sql.DB
}

const initSchemaSQL = `
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    attributes TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
`

func migrateDB(db *sql.DB) error {
	if _, err := db.Exec(initSchemaSQL); err != nil {
		return fmt.Errorf("failed to run schema migration: %w", err)
	}
	// Gracefully ensure attributes column exists if older schema is loaded
	_, _ = db.Exec("ALTER TABLE entities ADD COLUMN attributes TEXT;")
	return nil
}

// NewSQLiteRepository initializes SQLite database connection and runs migrations.
func NewSQLiteRepository(dbPath string) (EntityRepository, error) {
	dir := filepath.Dir(dbPath)
	if dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create db directory: %w", err)
		}
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// Enable WAL mode and foreign keys for optimal performance and safety
	if _, err := db.Exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to set sqlite pragma: %w", err)
	}

	if err := migrateDB(db); err != nil {
		_ = db.Close()
		return nil, err
	}

	return &sqliteEntityRepository{db: db}, nil
}

// NewSQLiteRepositoryFromDB wraps an existing sql.DB for testing.
func NewSQLiteRepositoryFromDB(db *sql.DB) (EntityRepository, error) {
	if err := migrateDB(db); err != nil {
		return nil, err
	}
	return &sqliteEntityRepository{db: db}, nil
}

func (r *sqliteEntityRepository) Create(ctx context.Context, e *domain.Entity) error {
	attributesJSON, err := json.Marshal(e.Attributes)
	if err != nil || e.Attributes == nil {
		attributesJSON = []byte("{}")
	}

	query := `
		INSERT INTO entities (id, name, type, status, description, attributes, latitude, longitude, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = r.db.ExecContext(ctx, query,
		e.ID,
		e.Name,
		string(e.Type),
		string(e.Status),
		e.Description,
		string(attributesJSON),
		e.Latitude,
		e.Longitude,
		e.CreatedAt.Format(time.RFC3339),
		e.UpdatedAt.Format(time.RFC3339),
	)
	if err != nil {
		return fmt.Errorf("failed to insert entity: %w", err)
	}
	return nil
}

func (r *sqliteEntityRepository) GetByID(ctx context.Context, id string) (*domain.Entity, error) {
	query := `
		SELECT id, name, type, status, description, attributes, latitude, longitude, created_at, updated_at
		FROM entities
		WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)

	var (
		e             domain.Entity
		eType         string
		eStatus       string
		description   sql.NullString
		rawAttributes sql.NullString
		createdAt     string
		updatedAt     string
	)

	err := row.Scan(
		&e.ID,
		&e.Name,
		&eType,
		&eStatus,
		&description,
		&rawAttributes,
		&e.Latitude,
		&e.Longitude,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("failed to query entity: %w", err)
	}

	e.Type = domain.EntityType(eType)
	e.Status = domain.EntityStatus(eStatus)
	if description.Valid {
		e.Description = description.String
	}

	e.Attributes = make(map[string]interface{})
	if rawAttributes.Valid && rawAttributes.String != "" {
		_ = json.Unmarshal([]byte(rawAttributes.String), &e.Attributes)
	}

	if t, err := time.Parse(time.RFC3339, createdAt); err == nil {
		e.CreatedAt = t
	}
	if t, err := time.Parse(time.RFC3339, updatedAt); err == nil {
		e.UpdatedAt = t
	}

	return &e, nil
}

func (r *sqliteEntityRepository) List(ctx context.Context) ([]*domain.Entity, error) {
	query := `
		SELECT id, name, type, status, description, attributes, latitude, longitude, created_at, updated_at
		FROM entities
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query entities: %w", err)
	}
	defer rows.Close()

	entities := make([]*domain.Entity, 0)
	for rows.Next() {
		var (
			e             domain.Entity
			eType         string
			eStatus       string
			description   sql.NullString
			rawAttributes sql.NullString
			createdAt     string
			updatedAt     string
		)

		if err := rows.Scan(
			&e.ID,
			&e.Name,
			&eType,
			&eStatus,
			&description,
			&rawAttributes,
			&e.Latitude,
			&e.Longitude,
			&createdAt,
			&updatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan entity row: %w", err)
		}

		e.Type = domain.EntityType(eType)
		e.Status = domain.EntityStatus(eStatus)
		if description.Valid {
			e.Description = description.String
		}

		e.Attributes = make(map[string]interface{})
		if rawAttributes.Valid && rawAttributes.String != "" {
			_ = json.Unmarshal([]byte(rawAttributes.String), &e.Attributes)
		}

		if t, err := time.Parse(time.RFC3339, createdAt); err == nil {
			e.CreatedAt = t
		}
		if t, err := time.Parse(time.RFC3339, updatedAt); err == nil {
			e.UpdatedAt = t
		}

		entities = append(entities, &e)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error during entities iteration: %w", err)
	}

	return entities, nil
}

func (r *sqliteEntityRepository) Update(ctx context.Context, e *domain.Entity) error {
	attributesJSON, err := json.Marshal(e.Attributes)
	if err != nil || e.Attributes == nil {
		attributesJSON = []byte("{}")
	}

	query := `
		UPDATE entities
		SET name = ?, type = ?, status = ?, description = ?, attributes = ?, latitude = ?, longitude = ?, updated_at = ?
		WHERE id = ?
	`
	res, err := r.db.ExecContext(ctx, query,
		e.Name,
		string(e.Type),
		string(e.Status),
		e.Description,
		string(attributesJSON),
		e.Latitude,
		e.Longitude,
		e.UpdatedAt.Format(time.RFC3339),
		e.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update entity: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return domain.ErrNotFound
	}

	return nil
}

func (r *sqliteEntityRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM entities WHERE id = ?`
	res, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete entity: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return domain.ErrNotFound
	}

	return nil
}
