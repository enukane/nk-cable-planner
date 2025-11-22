# nk-cable-planner

A web application for visually designing network cable routing between devices (Router, PoE SW, AP, PC) at event venues and automatically calculating the required number and length of LAN cables.

## Features

- 📸 **Load Venue Map**: Upload venue floor plans as the foundation for cable design
- 📏 **Scale Setting**: Convert image distances to actual lengths
- 📍 **Device Placement**: Freely place routers, PoE switches, APs, and PCs
- 🔌 **Two Cable Modes**:
  - **Detailed**: Draw actual cable routes via waypoints with automatic length calculation
  - **Simple**: Connect start and end points with a straight line and manual length input
- 📊 **Automatic Calculation**:
  - Apply margin rate (0-100%)
  - Round to standard lengths (1m, 2m, 3m, 5m increments)
  - Summarize required quantities by cable length
- 💾 **Data Management**:
  - Auto-save (local storage)
  - Export/Import projects (JSON)
  - Screenshot export (PNG)
  - CSV export (cable list & summary)

## Supported Devices

- **Router**
- **PoE Switch** (PoE SW)
- **Access Point** (AP)
- **PC**

## Getting Started

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
npm run dev

# The app will be available at http://localhost:3000
# Open http://localhost:3000 in your browser
```

## How to Use

### 1. Load Image
Upload a venue map image (JPG, PNG, GIF).

### 2. Set Scale
1. Click the "📏 Set Scale" button
2. Click two reference points on the image
3. Enter the actual length in meters

### 3. Place Devices
1. Click the "📍 Place Device" button
2. Select the device type (Router / PoE SW / AP / PC)
3. Click anywhere on the image
4. Enter a device name (auto-generated if left empty)

### 4. Create Cables

#### Detailed Cable (Draw Actual Route)
1. Click the "🔌 Detailed Cable" button
2. Click the start device
3. Click intermediate waypoints as needed
4. Click the end device
5. Enter cable name
6. Length is calculated automatically

#### Simple Cable (Manual Length Input)
1. Click the "⚡ Simple Cable" button
2. Click the start device
3. Click the end device
4. Enter cable name and length in meters

### 5. Adjust Settings

- **Margin**: Percentage to add to cable length (0-100%)
- **Rounding Mode**:
  - **On**: Round up to 1m, 2m, 3m, 5m increments
  - **Off**: Use length as-is after margin application
- **Show Labels**: Toggle cable labels on canvas
- **Show Grid**: Toggle grid lines on canvas

### 6. View Summary

In the "Summary" tab, you can see:
- Required quantity by cable length
- Total cables
- Total length
- Breakdown by mode (Detailed/Simple)

### 7. Save & Share Data

- **New**: Reset project
- **Export**: Save project as JSON file
- **Import**: Load saved project
- **Screenshot**: Save current cable layout as PNG image
- **Export CSV**: Export cable list and summary to CSV

## Keyboard Shortcuts

- **Esc**: Cancel cable creation
- **Enter**: Finalize detailed cable
- **Delete**: Delete selected device/cable
- **Space + Drag**: Pan canvas
- **Mouse Wheel**: Zoom in/out

## Development

### Installation

```bash
npm install
```

### Running the Application

```bash
# Start development server on port 3000
npm start
# or
npm run dev
```

Then open your browser and navigate to: **http://localhost:3000**

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in UI mode
npm run test:ui

# Run once (no watch)
npm run test:run
```

### Test Structure

```
tests/
├── unit/               # Unit tests
│   ├── utils.test.js
│   ├── devices.test.js
│   ├── cables.test.js
│   ├── project.test.js
│   ├── storage.test.js
│   └── canvas.test.js
└── integration/        # Integration tests
    └── workflow.test.js
```

### Test Results

- **Total Tests**: 106
- **Pass Rate**: 100%
- **Core Logic Coverage**:
  - utils.js: 100%
  - devices.js: 98.55%
  - cables.js: 88.34%
  - canvas.js: 87.84%
  - project.js: 95.85%
  - constants.js: 100%

### Tech Stack

- **Frontend**:
  - HTML5
  - CSS3
  - JavaScript (ES6+)
  - Canvas API

- **Testing**:
  - Vitest
  - @testing-library/dom
  - jsdom

### Project Structure

```
nk-cable-planner/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js          # Application entry point
│   ├── canvas.js        # Canvas rendering
│   ├── project.js       # Project data management
│   ├── devices.js       # Device management
│   ├── cables.js        # Cable management
│   ├── storage.js       # Storage & file I/O
│   ├── utils.js         # Utility functions
│   └── constants.js     # Constants definition
├── tests/
│   ├── setup.js
│   ├── unit/
│   └── integration/
├── package.json
├── vitest.config.js
└── README.md
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

This project is released under the MIT License.

## Development Approach

This project was implemented using **Test-Driven Development (TDD)**:

1. **Phase 1**: Environment setup
2. **Phase 2**: Utility layer tests and implementation
3. **Phase 3**: Data layer tests and implementation (devices, cables, project, storage)
4. **Phase 4**: Rendering layer tests and implementation (canvas)
5. **Phase 5**: UI layer implementation (HTML, CSS, main.js)
6. **Phase 6**: Integration & E2E tests
7. **Phase 7**: Final verification and documentation

Each phase follows the test-first principle, ensuring high-quality and maintainable code.
