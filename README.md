# achyml

A visual editor for YAML-based architecture diagrams, focused on microservices and APIs.

## Features

- **Visual Canvas:** Interactive D3-based diagram for components and their relationships.
- **Palette:** Add new components (microservice, database, queue, etc.) with custom properties.
- **Properties Panel:** Edit properties and dependencies of components and elements.
- **Chain Filter:** Filter and highlight chains of dependencies.
- **Swagger Import:** Import OpenAPI/Swagger specs to auto-generate routes.
- **YAML Editor:** Edit the underlying YAML with live validation.
- **Resizable & Hideable Sidebars:** Adjust or hide the editor and palette panels.
- **Dependency Management:** Add/remove dependencies visually; links are auto-managed.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Open your browser:**  
   Visit [http://localhost:5173](http://localhost:5173)

## File Structure

- `src/components/canvas_area/` — D3 canvas rendering and controls.
- `src/components/palette/` — Palette and properties panels.
- `src/components/editor/` — YAML editor and toolbar.
- `src/store/` — Zustand store for app state.
- `src/utils/` — D3 layout, style, and helper functions.
- `src/workers/` — Web worker for Swagger/OpenAPI import.

## How It Works

- **Add Components:** Use the palette to add microservices, databases, queues, etc.
- **Edit Properties:** Select a node to edit its properties and dependencies.
- **Manage Dependencies:** Add or remove dependencies between elements; links update automatically.
- **Import Swagger:** Use the Swagger import button to generate routes from an OpenAPI spec.
- **Edit YAML:** Directly edit the YAML and see changes reflected in the diagram.

## Technologies

- React
- Zustand (state management)
- D3.js (SVG rendering)
- Monaco Editor (YAML editing)
- Vite (build tool)

## License

MIT
