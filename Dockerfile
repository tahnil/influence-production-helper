# Use a node image as base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY app/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY app .

# Copy the SDK folder to the working directory
COPY sdk /app/sdk

# Install the SDK dependencies
RUN cd /app/sdk && npm install && npm install -g rollup

# Build the SDK
RUN cd /app/sdk && npm run build

# Run the export-production-chains command
RUN cd /app/sdk && npm run export-production-chains file=productionChains.json
# Verify the JSON file is created
RUN ls -l /app/sdk/productionChains.json && cat /app/sdk/productionChains.json

# Move the JSON file to the appropriate directory
RUN mkdir -p /app/src/sdk && mv /app/sdk/productionChains.json /app/src/sdk/productionChains.json

# Build the Next.js app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]
