.PHONY: dev dev-full deploy-ec2 redis start stop restart build logs showdb mongo clean wipe

# ============================================
#  🔥 Most Used — Daily Development
# ============================================

# Start Redis and Qdrant for local development
dev:
	docker compose up -d redis qdrant

# Start MongoDB, Redis, and Qdrant for local development (with Mongo in Docker)
dev-full:
	docker compose up -d mongodb redis qdrant

# Deploy only Backend and Redis for EC2 (Cloud architecture)
deploy-ec2:
	docker compose up -d --build backend redis

# Start only Redis
redis:
	docker compose up -d redis

# ============================================
#  🐳 Docker Lifecycle
# ============================================

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

# Rebuild the images (useful if you change code and need to update the containers)
build:
	docker compose up -d --build

# View live logs for all services
logs:
	docker compose logs -f

# ============================================
#  🗄️ Database
# ============================================

# Open MongoDB shell
showdb:
	docker exec -it mitorix_mongo mongosh Mitorix

# Start local MongoDB service (non-Docker)
mongo:
	sudo systemctl start mongod

# ============================================
#  🧹 Cleanup (Destructive)
# ============================================

# Stop the app and delete database volumes (resets MongoDB, Redis, etc.)
clean:
	docker compose down -v

# WIPE EVERYTHING: Stop app, delete volumes, and manually delete Qdrant storage
wipe:
	docker compose down -v
	rm -rf backend/qdrant_storage
	@echo "All data has been completely wiped. You can run 'make start' to begin fresh."