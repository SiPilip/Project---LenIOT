package config

import (
	"bufio"
	"os"
	"strings"
)

// Config holds the application configuration.
type Config struct {
	Port               string
	DBPath             string
	CORSAllowedOrigins []string
}

// Load reads configuration from environment variables, falling back to defaults.
// It also parses a local .env file if present.
func Load() *Config {
	loadDotEnv(".env")

	port := getEnv("PORT", "8080")
	dbPath := getEnv("DB_PATH", "./data/app.db")
	corsOrigins := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")

	origins := make([]string, 0)
	for _, o := range strings.Split(corsOrigins, ",") {
		trimmed := strings.TrimSpace(o)
		if trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	if len(origins) == 0 {
		origins = append(origins, "http://localhost:5173")
	}

	return &Config{
		Port:               port,
		DBPath:             dbPath,
		CORSAllowedOrigins: origins,
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// loadDotEnv parses a simple KEY=VALUE .env file without external dependencies.
func loadDotEnv(filepath string) {
	file, err := os.Open(filepath)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)
			if _, exists := os.LookupEnv(key); !exists {
				os.Setenv(key, val)
			}
		}
	}
}
