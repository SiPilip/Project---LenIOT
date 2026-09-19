package handler_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"geo-entity-manager/backend/internal/handler"
	"geo-entity-manager/backend/internal/repository"
	"geo-entity-manager/backend/internal/service"
	"geo-entity-manager/backend/internal/validation"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

func setupTestRouter(t *testing.T) (*gin.Engine, repository.EntityRepository) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite in memory: %v", err)
	}

	repo, err := repository.NewSQLiteRepositoryFromDB(db)
	if err != nil {
		t.Fatalf("failed to initialize repo: %v", err)
	}

	t.Cleanup(func() {
		_ = db.Close()
	})

	v := validation.New()
	svc := service.NewEntityService(repo, v)
	h := handler.NewEntityHandler(svc)

	r := gin.New()
	h.RegisterRoutes(r)

	return r, repo
}

func TestHealthCheck(t *testing.T) {
	r, _ := setupTestRouter(t)

	req, _ := http.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
}

func TestEntityLifecycle(t *testing.T) {
	r, _ := setupTestRouter(t)

	// 1. Initial List should be empty
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/entities", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	// 2. Create Entity - Validation Failure (invalid type)
	invalidBody := []byte(`{
		"name": "Vehicle A",
		"type": "spaceship",
		"status": "active",
		"latitude": 10.0,
		"longitude": 20.0
	}`)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/entities", bytes.NewBuffer(invalidBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422 for invalid type, got %d", w.Code)
	}

	// 3. Create Entity - Malformed JSON
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/entities", bytes.NewBufferString(`{bad json`))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for malformed json, got %d", w.Code)
	}

	// 4. Create Entity - Success
	validBody := []byte(`{
		"name": "Patrol Drone 01",
		"type": "iot_device",
		"status": "active",
		"description": "Aerial surveillance drone",
		"latitude": -2.976074,
		"longitude": 104.775431
	}`)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/entities", bytes.NewBuffer(validBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 created, got %d: %s", w.Code, w.Body.String())
	}

	var createResp struct {
		Success bool `json:"success"`
		Data    struct {
			ID          string                 `json:"id"`
			Name        string                 `json:"name"`
			Type        string                 `json:"type"`
			Status      string                 `json:"status"`
			Description string                 `json:"description"`
			Attributes  map[string]interface{} `json:"attributes"`
			Latitude    float64                `json:"latitude"`
			Longitude   float64                `json:"longitude"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &createResp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !createResp.Success {
		t.Fatalf("expected createResp.Success to be true")
	}
	entityID := createResp.Data.ID
	if entityID == "" {
		t.Fatalf("expected non-empty entity ID")
	}

	// 5. Get Entity by ID - Success
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/entities/"+entityID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	// 6. Get Entity by ID - Not Found
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/entities/"+uuid.NewString(), nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for random UUID, got %d", w.Code)
	}

	// 7. Get Entity by ID - Bad UUID Format
	req, _ = http.NewRequest(http.MethodGet, "/api/v1/entities/invalid-uuid-123", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for bad UUID, got %d", w.Code)
	}

	// 8. Update Entity - Success
	updateBody := []byte(`{
		"name": "Patrol Drone 01 - Docked",
		"type": "iot_device",
		"status": "maintenance",
		"description": "Charging battery",
		"latitude": -2.976074,
		"longitude": 104.775431
	}`)
	req, _ = http.NewRequest(http.MethodPut, "/api/v1/entities/"+entityID, bytes.NewBuffer(updateBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// 9. Update Entity - Validation error (latitude > 90)
	invalidUpdate := []byte(`{
		"name": "Patrol Drone 01",
		"type": "iot_device",
		"status": "active",
		"latitude": 95.0,
		"longitude": 104.775431
	}`)
	req, _ = http.NewRequest(http.MethodPut, "/api/v1/entities/"+entityID, bytes.NewBuffer(invalidUpdate))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422 for latitude out of range, got %d", w.Code)
	}

	// 10. Delete Entity - Success
	req, _ = http.NewRequest(http.MethodDelete, "/api/v1/entities/"+entityID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204 no content, got %d", w.Code)
	}

	// 11. Delete Entity - Not Found after deletion
	req, _ = http.NewRequest(http.MethodDelete, "/api/v1/entities/"+entityID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 when deleting non-existent entity, got %d", w.Code)
	}
}
