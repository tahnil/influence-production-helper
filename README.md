# Docker Configuration for Influence Production Helper

This document explains how to build and run the Influence Production Helper application using Docker.

## Prerequisites

Before proceeding, ensure you have the following installed on your system:

- [Docker](https://www.docker.com/get-started)
- Git (to clone the repository)

## Building the Docker Image

The provided Dockerfile handles all necessary steps to build the application, including:
- Setting up a Node.js environment
- Installing dependencies for both the app and SDK
- Building the SDK
- Generating the production chains data
- Building the Next.js application

To build the Docker image, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/influence-production-helper.git
   cd influence-production-helper
   ```

2. Build the Docker image:
   ```bash
   docker build -t influence-production-helper .
   ```
   This command builds a Docker image tagged as `influence-production-helper` based on the Dockerfile in the current directory.

## Running the Application

Once the image is built, you can run the application with:

```bash
docker run -p 3000:3000 influence-production-helper
```

This command:
- Runs a container from the `influence-production-helper` image
- Maps port 3000 from the container to port 3000 on your host machine
- Starts the Next.js application inside the container

You can then access the application by opening a web browser and navigating to:
```
http://localhost:3000
```

## Docker Image Details

The Docker image is built using the following process:

1. **Base Image**: Uses `node:18-alpine` as the lightweight base image
2. **Working Directory**: Sets `/app` as the working directory
3. **Dependencies**: 
   - Installs app dependencies from package.json
   - Installs SDK dependencies and rollup globally
4. **SDK Building**:
   - Builds the SDK using rollup
   - Generates the production chains data JSON file
5. **App Building**:
   - Builds the Next.js application
6. **Execution**:
   - Exposes port 3000
   - Runs the Next.js application with `npm start`

## Environment Variables

You can configure the container by passing environment variables when running it:

```bash
docker run -p 3000:3000 -e NODE_ENV=production influence-production-helper
```

## Data Persistence

If you need to persist configurations between container restarts, you can mount a volume:

```bash
docker run -p 3000:3000 -v influence-data:/app/.data influence-production-helper
```

This will store the application's PouchDB data in a Docker volume named `influence-data`.

## Running in Development Mode

For development purposes, you can run the container with hot reloading:

```bash
docker run -p 3000:3000 -v $(pwd)/app:/app influence-production-helper npm run dev
```

This mounts your local `app` directory into the container and runs the application in development mode.

## Troubleshooting

If you encounter issues:

1. **Build Errors**: Ensure your Docker daemon has enough resources allocated
2. **Runtime Errors**: Check the container logs with `docker logs CONTAINER_ID`
3. **Permission Issues**: The container runs as the node user, which might cause permission issues when mounting volumes

## Advanced Configuration

For production deployments, consider using Docker Compose to manage the container alongside other services:

```yaml
# docker-compose.yml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - influence-data:/app/.data
volumes:
  influence-data:
```

Run with:
```bash
docker-compose up -d
```