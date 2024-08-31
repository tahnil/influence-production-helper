# Influence Production Helper

This project is a production helper tool for the Influence game, consisting of a Next.js application and an SDK for interacting with the Influence ecosystem.

## Project Structure

The project is divided into two main parts:

1. `/app`: A Next.js application for visualizing production chains
2. `/sdk`: A JavaScript SDK for interacting with Influence contracts and data

## App Features

- Interactive production chain visualization using React Flow and Dagre
- Dynamic node rendering for products and processes
- API endpoints for fetching product and process data
- Responsive UI components using Tailwind CSS

### Getting Started with the App

1. Navigate to the `/app` directory
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

# Influence SDK Features

- Utilities for interacting with Influence contracts on Ethereum and Starknet
- Production chain data processing
- Snapshot information for Starknet migration

## Using the SDK

1. Install the SDK: `npm install @influenceth/sdk`
2. Import and use the SDK in your project:

```javascript
import { starknetContracts, ethereumContracts } from '@influenceth/sdk'
```

## API Access

The project includes API endpoints for accessing Influence game data. To use the API:

1. Request access and obtain API credentials from the Influence Discord
2. Authenticate using the provided endpoints
3. Include the access token in your API requests

# Contributing

Contributions are welcome! Please check out the issues page for open tasks or submit a pull request with your improvements.

## License

This project is open source. Please refer to the LICENSE files, if they are present, in the `/app` and `/sdk` directories for specific licensing information.