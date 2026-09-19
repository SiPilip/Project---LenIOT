package main

import (
	"context"
	"log"

	"geo-entity-manager/backend/internal/config"
	"geo-entity-manager/backend/internal/repository"
)

func main() {
	cfg := config.Load()
	log.Printf("Connecting to SQLite at: %s", cfg.DBPath)

	repo, err := repository.NewSQLiteRepository(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to initialize SQLite repository: %v", err)
	}

	log.Println("Seeding sample entities...")
	if err := repo.SeedInitialDataIfEmpty(context.Background()); err != nil {
		log.Fatalf("Seed failed: %v", err)
	}

	log.Println("Seeding completed successfully!")
}
