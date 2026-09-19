package handler

import (
	"errors"
	"net/http"

	"geo-entity-manager/backend/internal/domain"
	"geo-entity-manager/backend/internal/service"
	"geo-entity-manager/backend/internal/validation"

	"github.com/gin-gonic/gin"
)

// EntityHandler handles HTTP requests for entity management.
type EntityHandler struct {
	svc service.EntityService
}

// NewEntityHandler creates a new EntityHandler.
func NewEntityHandler(svc service.EntityService) *EntityHandler {
	return &EntityHandler{svc: svc}
}

// RegisterRoutes registers API routes to Gin engine.
func (h *EntityHandler) RegisterRoutes(r *gin.Engine) {
	r.GET("/health", h.Health)

	v1 := r.Group("/api/v1")
	{
		entities := v1.Group("/entities")
		{
			entities.GET("", h.List)
			entities.POST("", h.Create)
			entities.GET("/:id", h.Get)
			entities.PUT("/:id", h.Update)
			entities.DELETE("/:id", h.Delete)
		}
	}
}

// Health handles health check endpoint.
func (h *EntityHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// List handles listing all entities.
func (h *EntityHandler) List(c *gin.Context) {
	entities, err := h.svc.List(c.Request.Context())
	if err != nil {
		respondError(c, err, nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": entities})
}

// Create handles creating a new entity.
func (h *EntityHandler) Create(c *gin.Context) {
	var input domain.CreateEntityInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, validation.ErrorResponse{
			Error: validation.ErrorPayload{
				Code:    "BAD_REQUEST",
				Message: "Malformed JSON request body",
			},
		})
		return
	}

	entity, valErrors, err := h.svc.Create(c.Request.Context(), input)
	if err != nil {
		respondError(c, err, valErrors)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": entity})
}

// Get handles retrieving a single entity by ID.
func (h *EntityHandler) Get(c *gin.Context) {
	id := c.Param("id")
	entity, err := h.svc.Get(c.Request.Context(), id)
	if err != nil {
		respondError(c, err, nil)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": entity})
}

// Update handles updating an existing entity by ID.
func (h *EntityHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input domain.UpdateEntityInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, validation.ErrorResponse{
			Error: validation.ErrorPayload{
				Code:    "BAD_REQUEST",
				Message: "Malformed JSON request body",
			},
		})
		return
	}

	entity, valErrors, err := h.svc.Update(c.Request.Context(), id, input)
	if err != nil {
		respondError(c, err, valErrors)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": entity})
}

// Delete handles deleting an entity by ID.
func (h *EntityHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		respondError(c, err, nil)
		return
	}

	c.Status(http.StatusNoContent)
}

func respondError(c *gin.Context, err error, valErrors []validation.FieldErrorDetail) {
	if errors.Is(err, domain.ErrValidationFail) || len(valErrors) > 0 {
		c.JSON(http.StatusUnprocessableEntity, validation.ErrorResponse{
			Error: validation.ErrorPayload{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid input",
				Details: valErrors,
			},
		})
		return
	}

	if errors.Is(err, domain.ErrNotFound) {
		c.JSON(http.StatusNotFound, validation.ErrorResponse{
			Error: validation.ErrorPayload{
				Code:    "NOT_FOUND",
				Message: "Entity not found",
			},
		})
		return
	}

	if errors.Is(err, domain.ErrInvalidID) {
		c.JSON(http.StatusBadRequest, validation.ErrorResponse{
			Error: validation.ErrorPayload{
				Code:    "BAD_REQUEST",
				Message: "Invalid entity ID format (must be UUID)",
			},
		})
		return
	}

	c.JSON(http.StatusInternalServerError, validation.ErrorResponse{
		Error: validation.ErrorPayload{
			Code:    "INTERNAL_SERVER_ERROR",
			Message: "An unexpected error occurred",
		},
	})
}
