default:
	@echo "Please specify a target to build"

build:
	@echo "Building the UI"
	bun run build

TAG=0.0.1e
TAG_NAME=am8850/aiselfassessment
docker-build: build
	@echo "Building the Docker image"
	docker build -t $(TAG_NAME):$(TAG) .

docker-run: build
	@echo "Running the Docker image"
	docker run --rm -p 8080:80 $(TAG_NAME):$(TAG)

docker-push:
	@echo "Pushing the Docker image"	
	docker push $(TAG_NAME):$(TAG)