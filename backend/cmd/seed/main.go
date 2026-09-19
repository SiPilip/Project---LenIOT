package main

import (
	"context"
	"flag"
	"log"

	"geo-entity-manager/backend/internal/config"
	"geo-entity-manager/backend/internal/repository"
)

func main() {
	reset := flag.Bool("reset", true, "Reset existing entities and seed 46 Java geospatial entities")
	flag.Parse()

	cfg := config.Load()
	log.Printf("Connecting to SQLite at: %s", cfg.DBPath)

	repo, err := repository.NewSQLiteRepository(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to initialize SQLite repository: %v", err)
	}

	if *reset {
		log.Println("Resetting database and seeding 46 Java geospatial entities...")
		if err := repo.ResetAndSeed(context.Background()); err != nil {
			log.Fatalf("Reset and seed failed: %v", err)
		}
	} else {
		log.Println("Seeding sample entities if database is empty...")
		if err := repo.SeedInitialDataIfEmpty(context.Background()); err != nil {
			log.Fatalf("Seed failed: %v", err)
		}
	}

	log.Println("Seeding completed successfully! (46 entities across Java)")
}
