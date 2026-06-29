.PHONY: dev start stop restart logs build clean wipe showdb pull-model dev-full deploy-ec2

# Start infrastructure (MongoDB, Redis, Qdrant, Ollama) for local development
dev:
	docker compose up -d mongodb redis qdrant ollama

redis:
	docker compose up -d redis
# Start infra + auto-pull the embedding model (first-time setup)
dev-full: dev pull-model

# Wait for Ollama to be healthy, then pull nomic-embed-text if not already present
pull-model:
	@echo "Waiting for Ollama to be ready..."
	@until docker exec mitorix_ollama ollama list >/dev/null 2>&1; do sleep 2; done
	@if ! docker exec mitorix_ollama ollama list 2>/dev/null | grep -q "nomic-embed-text"; then \
		echo "Pulling nomic-embed-text model..."; \
		docker exec mitorix_ollama ollama pull nomic-embed-text; \
	else \
		echo "nomic-embed-text already available ✓"; \
	fi

# Start the full application in the background
start:
	docker compose up -d

# Stop the application
stop:
	docker compose down

# Restart the application
restart:
	docker compose down
	docker compose up -d

# View live logs for all services
logs:
	docker compose logs -f

# Rebuild the images (useful if you change code and need to update the containers)
build:
	docker compose up -d --build

# Stop the app and delete database volumes (resets MongoDB, Redis, etc.)
clean:
	docker compose down -v

# WIPE EVERYTHING: Stop app, delete volumes, and manually delete Qdrant storage
wipe:
	docker compose down -v
	rm -rf backend/qdrant_storage
	@echo "All data has been completely wiped. You can run 'make start' to begin fresh."

showdb:
	docker exec -it mitorix_mongo mongosh Mitorix

nomic:
	docker exec -it mitorix_ollama ollama pull nomic-embed-text

# Deploy only Backend and Redis for EC2 (Cloud architecture)
deploy-ec2:
	docker compose up -d --build backend redis