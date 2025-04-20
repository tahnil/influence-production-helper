# Influence Production Helper

A specialized visualization tool for optimizing production chains in Influence - the blockchain-based space economy simulator.

## 📖 Overview

Influence Production Helper is an interactive web application designed to help players of Influence visualize, configure, and optimize their industrial production chains. The application allows users to:

- Create hierarchical visualizations of product manufacturing processes
- Calculate resource requirements for desired output quantities
- Save and load production chain configurations
- Explore alternative manufacturing processes
- Generate ingredient lists for procurement planning

## 🚀 Features

### Interactive Production Chain Visualization

- Hierarchical node-based visualization using React Flow
- Automatic layout calculation with dagre
- Visual distinction between products, processes, and side products
- Real-time updating of quantities when changing desired output amount

### Advanced Production Planning

- Select from all available production processes for each product
- Calculate required input materials based on desired output
- Support for complex production chains with multiple levels
- Side product visualization and tracking

### Resource Management

- Automatic calculation of total weights and volumes for logistics planning
- Time requirement calculations for production planning
- Raw materials summary for resource gathering

### Configuration Management

- Save production chain configurations locally
- Load and reuse configurations for frequently used chains
- Replace segments of production chains with saved configurations

## 🔧 Technical Architecture

The application is built using:

- **Next.js**: React framework for the frontend
- **React Flow**: Visualization library for node-based interfaces
- **PouchDB**: Client-side database for configuration storage
- **Dagre**: Graph layout library for automatic node positioning
- **ShadCN UI**: Component library for the user interface

The architecture follows a component-based approach with:

- Clear separation between domain logic and UI presentation
- Custom hooks for business logic encapsulation
- Context-based state management
- Type-safe implementation with TypeScript

## 🏗️ Production Chain Hierarchy

In Influence Production Helper, production chains follow a specific hierarchical structure:

- **Outflows** (products produced by processes) are positioned higher in the visualization
- **Inflows** (products consumed by processes) are positioned lower in the visualization
- **Side Products** branch horizontally from their parent processes

This hierarchy reflects the manufacturing flow in Influence, where raw materials are processed upward through the chain to create finished products.

## 📋 Usage Guide

### Getting Started

1. Select a product from the dropdown in the control panel
2. Enter the desired amount of the product you want to produce
3. Select a manufacturing process for your product

The application will automatically:
- Create the necessary process node
- Calculate required input products and quantities
- Position all nodes in a hierarchical layout

### Working with the Visualization

- Zoom and pan to navigate large production chains
- View detailed information in node tooltips
- Adjust desired quantity to recalculate the entire chain
- Save configurations for future use

### Saving and Loading Configurations

- Click the save icon on any product node to save its production chain
- Use the configuration selector to load a saved configuration
- Replace parts of your production chain with saved configurations

## 🛠️ Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/influence-production-helper.git

# Navigate to the project directory
cd influence-production-helper

# Install dependencies
npm install
# or
yarn install
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
# or
yarn build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's coding philosophy and practices.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Roadmap

- [ ] Process efficiency optimization suggestions
- [ ] Export to CSV functionality
- [ ] Mobile-friendly responsive design
- [ ] Dark/light theme toggle
- [ ] Import/export of configurations for sharing

## 🙏 Acknowledgements

- Influence game developers for creating the space economy simulator
- React Flow for the powerful visualization library
- The open source community for the various libraries used

---

*This project is not affiliated with or endorsed by the official Influence game developers.*