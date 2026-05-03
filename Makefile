.PHONY: start stop restart logs build clean wipe

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
