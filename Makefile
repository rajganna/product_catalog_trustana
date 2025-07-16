SHELL := /bin/bash
ENV := dev
APP_NAME := product-service

build:
	DOCKER_BUILDKIT=1 docker build -f docker/Dockerfile --target dev -t $(APP_NAME):dev .; \
	DOCKER_BUILDKIT=1 docker build -f docker/Dockerfile --target build -t $(APP_NAME):build .; \
	DOCKER_BUILDKIT=1 docker build -f docker/Dockerfile --target prod -t $(APP_NAME):prod .;

start:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml up

start-detached:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d

stop:
	docker-compose stop

clean:
	docker-compose down -v
	docker image prune -f

create-migration:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml run --rm web npm run db:create-migration -- ${ARG}

migrator-start:
	docker-compose --compatibility -f docker-compose.yml -f docker-compose.local.yml run --rm --service-ports -e IS_MIGRATION=true web npm run start:migrator

migrate:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml run -e IS_MIGRATION=true --rm web npm run db:migrate

migrate-undo:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml run -e IS_MIGRATION=true --rm web npm run db:migrate:undo

migrate-data:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml run --rm web npm run db:migrate:data

reset-db: stop
	docker-compose -f docker-compose.yml -f docker-compose.local.yml down -v
	docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d postgres redis
	sleep 5
	$(MAKE) migrate

sh:
	docker-compose exec web /bin/sh

logs:
	docker-compose logs -f web

test: unit

unit:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml -f tests/unit/docker-compose.yml run --rm test npm run test

smoke:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml -f tests/e2e/docker-compose.yml run --rm test npm run test:smoke

e2e:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml -f tests/e2e/docker-compose.yml run --rm test npm run test:e2e

smoke-debug:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml -f tests/e2e/docker-compose.yml run --rm --service-ports test npm run test:smoke:debug

e2e-debug:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml -f tests/e2e/docker-compose.yml run --rm --service-ports test npm run test:debug

lint:
	docker run --rm $(APP_NAME):build npm run lint

lint-fix:
	docker run --rm -v `pwd`:/app $(APP_NAME):build npm run lint:fix

lint-oas:
	docker run --rm -v `pwd`/docs/swagger/oas3.yaml:/tmp/openapi.yaml stoplight/spectral lint /tmp/openapi.yaml

validate-oas:
	docker run --rm -v `pwd`/docs/swagger/oas3.yaml:/tmp/openapi.yaml openapitools/openapi-generator-cli validate -i /tmp/openapi.yaml

generate-docs:
	docker run --rm -v `pwd`/docs/swagger:/local openapitools/openapi-generator-cli generate \
		-i /local/oas3.yaml \
		-g html2 \
		-o /local/generated

health:
	curl -f http://localhost:3000/api/v1/health || exit 1

# Development helpers
dev-setup: build migrate start-detached
	@echo "Product catalog service is ready!"
	@echo "API: http://localhost:3000/api/v1"
	@echo "Health: http://localhost:3000/api/v1/health"

dev-teardown: stop clean

# Database helpers
seed-data:
	docker-compose -f docker-compose.yml -f docker-compose.local.yml run --rm web npm run db:seed

# Production-like testing
prod-test:
	docker run --rm $(APP_NAME):prod npm test

# Help target
help:
	@echo "Available targets:"
	@echo "  build          - Build all Docker images"
	@echo "  start          - Start services in foreground"
	@echo "  start-detached - Start services in background"
	@echo "  stop           - Stop services"
	@echo "  clean          - Stop and remove containers/volumes"
	@echo "  migrate        - Run database migrations"
	@echo "  reset-db       - Reset database completely"
	@echo "  test           - Run all tests"
	@echo "  unit           - Run unit tests"
	@echo "  e2e            - Run e2e tests"
	@echo "  lint           - Run linting"
	@echo "  lint-oas       - Lint OpenAPI specification"
	@echo "  validate-oas   - Validate OpenAPI specification"
	@echo "  generate-docs  - Generate API documentation"
	@echo "  dev-setup      - Complete development setup"
	@echo "  dev-teardown   - Clean development environment"
	@echo "  health         - Check service health"
	@echo "  help           - Show this help"

.PHONY: build start start-detached stop clean migrate migrate-undo reset-db sh logs test unit smoke e2e lint lint-oas validate-oas generate-docs health dev-setup dev-teardown seed-data prod-test help
