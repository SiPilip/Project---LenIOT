package main

import (
	"log"
	"net/http"
	"time"

	"geo-entity-manager/backend/internal/config"
	"geo-entity-manager/backend/internal/handler"
	"geo-entity-manager/backend/internal/repository"
	"geo-entity-manager/backend/internal/service"
	"geo-entity-manager/backend/internal/validation"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	log.Printf("Starting Geo Entity Manager API on port %s...", cfg.Port)
	log.Printf("Database path: %s", cfg.DBPath)

	repo, err := repository.NewSQLiteRepository(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to initialize SQLite repository: %v", err)
	}

	v := validation.New()
	svc := service.NewEntityService(repo, v)
	h := handler.NewEntityHandler(svc)

	router := gin.Default()

	// CORS Configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSAllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	h.RegisterRoutes(router)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	log.Printf("Server listening on http://localhost:%s", cfg.Port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}
