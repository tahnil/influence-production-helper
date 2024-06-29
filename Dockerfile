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

# Build the React app using npm run build which will call craco build
RUN npm run build

# Copy the SDK
COPY sdk ./sdk

# Install rollup globally and build the SDK
WORKDIR /usr/src/app/sdk
RUN npm install
RUN npm install -g rollup
RUN npm run build

# Generate the production chains JSON file
RUN npm run export-production-chains file=productionChains.json
# RUN ls -l ./productionChains.json  # List the JSON file for verification
# RUN cat ./productionChains.json  # Output the contents of the JSON file for verification

# Set the working directory back to root
WORKDIR /usr/src/app

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["npm", "start"]