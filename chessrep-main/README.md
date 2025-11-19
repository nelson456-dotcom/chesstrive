# Chess Analysis Board

A production-quality interactive chess analysis board built with React, TypeScript, and Node.js. This application provides comprehensive chess analysis tools including engine integration, opening exploration, tablebase support, and game reporting.

## 🚀 Features

### Interactive Chess Board
- **Drag & Drop**: Intuitive piece movement with visual feedback
- **Click-to-Move**: Alternative input method for precise control
- **Board Flipping**: View from either side (F key or button)
- **Mobile Responsive**: Optimized for all device sizes
- **Last Move Highlighting**: Visual indication of the most recent move
- **Custom Annotations**: Right-click for arrows, Shift+click for circles
- **Legal Move Indicators**: Optional highlighting of valid moves

### Move Tree & Notation
- **Nested Sublines**: Create and navigate variations with proper indentation
- **Standard Notation**: 1. e4, 1... e5 format with proper move numbering
- **Clickable Moves**: Jump to any position by clicking moves
- **Variation Management**: Add, delete, and promote sublines
- **Move Navigation**: Arrow keys and keyboard shortcuts

### Annotation Tools
- **Text Comments**: Add detailed explanations to any move
- **Symbolic Annotations**: !, ?, !!, ??, !?, ?! for move quality
- **Visual Annotations**: Arrows and colored highlights
- **Persistent Storage**: Annotations saved per move node
- **Export Support**: Include annotations in PGN export

### Engine Integration
- **Stockfish WASM**: Powerful chess engine running in Web Worker
- **Multi-PV Analysis**: View multiple candidate moves
- **Real-time Evaluation**: Live position assessment
- **Depth Control**: Configurable analysis depth
- **Cloud Analysis**: Optional deeper analysis via cloud services
- **Error Detection**: Automatic identification of mistakes and blunders

### Game Management
- **PGN Import/Export**: Full game portability with variations
- **FEN Support**: Load custom positions via URL or input
- **Game Reports**: Automated analysis with accuracy percentages
- **Study Management**: Save and organize chess studies
- **Shareable Links**: Generate URLs that preserve position and analysis

### Bot Play
- **Configurable Levels**: Beginner (1200), Intermediate (1600), Advanced (1800), Expert (2000+)
- **Personality Traits**: Aggressive, Positional, Tactical, Defensive
- **Realistic Play**: Engine-based moves with appropriate randomness
- **Difficulty Scaling**: Adjustable thinking time and depth

### Opening Explorer
- **Lichess Database**: Access to millions of master games
- **Move Statistics**: Win rates, popularity, and performance data
- **ECO Codes**: Standard opening classification
- **Search Functionality**: Find openings by name or ECO code
- **Hover Effects**: Display suggested moves with statistics

### Tablebase Support
- **Syzygy Integration**: Perfect endgame solutions for ≤7 pieces
- **WDL/DTZ/DTM**: Win/Draw/Loss, Distance to Zero, Distance to Mate
- **Move Recommendations**: Best moves in tablebase positions
- **Endgame Training**: Learn perfect endgame technique

### Accessibility & UX
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Screen Reader**: Compatible with assistive technologies
- **High Contrast**: Support for visual accessibility
- **Help Panel**: Comprehensive keyboard shortcut reference
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **React-Chessboard** for interactive board
- **Chess.js** for game logic
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **MongoDB** for data storage
- **Stockfish** chess engine
- **Syzygy** tablebase
- **WebSocket** for real-time updates

### Development Tools
- **TypeScript** for type safety
- **Jest** for unit testing
- **Cypress** for e2e testing
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for git hooks

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Stockfish chess engine
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chess-analysis-board.git
   cd chess-analysis-board
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start the development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## 🎮 Usage

### Basic Navigation
- **Move Pieces**: Drag and drop or click to move
- **Navigate Moves**: Use arrow keys (←/→) or A/D keys
- **Go to Start/End**: Use ↑/↓ or W/S keys
- **Flip Board**: Press F key or click flip button
- **Undo/Redo**: Ctrl+Z / Ctrl+Y

### Creating Variations
1. Navigate back to any move using arrow keys
2. Play a different move than the main line
3. The system automatically creates a subline
4. Click on moves to switch between main line and variations

### Adding Annotations
1. Click on any move in the move tree
2. Use the annotation controls to add:
   - Comments (💬 button)
   - Symbols (!, ?, !!, ??, !?, ?!)
   - Visual arrows and circles

### Engine Analysis
1. The engine automatically analyzes the current position
2. View multiple candidate moves in the engine panel
3. Click on engine moves to play them
4. Monitor evaluation changes in real-time

### Bot Play
1. Select a difficulty level from the dropdown
2. Make your move on the board
3. The bot will automatically respond
4. Stop bot play by selecting "Select Bot Level" again

## 🧪 Testing

### Unit Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

### Coverage Report
```bash
cd frontend
npm run test:coverage
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints
- `POST /api/analysis/position` - Analyze chess position
- `GET /api/opening/moves` - Get opening moves for position
- `POST /api/tablebase/query` - Query endgame tablebase
- `GET /api/games` - Get user's saved games

## 🔧 Configuration

### Engine Settings
```typescript
const analysisConfig = {
  depth: 15,           // Analysis depth
  multiPV: 3,          // Number of candidate moves
  timeLimit: 5000,     // Time limit in ms
  useCloudAnalysis: false
};
```

### Board Settings
```typescript
const boardConfig = {
  orientation: 'white',    // Board orientation
  showCoordinates: true,   // Show file/rank labels
  showLastMove: true,      // Highlight last move
  showLegalMoves: false,   // Show legal move indicators
  animationDuration: 200   // Move animation speed
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stockfish** - Chess engine
- **Lichess** - Opening database and inspiration
- **Chess.js** - JavaScript chess library
- **React-Chessboard** - Chess board component
- **Syzygy** - Endgame tablebase

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/chess-analysis-board/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/chess-analysis-board/discussions)
- **Email**: support@chessanalysis.com

## 🗺️ Roadmap

### Version 2.0
- [ ] Multiplayer support
- [ ] Tournament mode
- [ ] Advanced puzzle creation
- [ ] Video analysis integration
- [ ] Mobile app (React Native)

### Version 2.1
- [ ] AI coaching features
- [ ] Advanced statistics
- [ ] Custom themes
- [ ] Plugin system
- [ ] Offline mode

## 📊 Performance

- **Bundle Size**: ~2MB (gzipped)
- **First Paint**: <1s
- **Interactive**: <2s
- **Memory Usage**: <100MB
- **Engine Response**: <500ms

## 🔒 Security

- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- XSS protection
- CSRF protection
- Secure headers

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Built with ❤️ for the chess community**
A production-quality interactive chess analysis board built with React, TypeScript, and Node.js. This application provides comprehensive chess analysis tools including engine integration, opening exploration, tablebase support, and game reporting.

## 🚀 Features

### Interactive Chess Board
- **Drag & Drop**: Intuitive piece movement with visual feedback
- **Click-to-Move**: Alternative input method for precise control
- **Board Flipping**: View from either side (F key or button)
- **Mobile Responsive**: Optimized for all device sizes
- **Last Move Highlighting**: Visual indication of the most recent move
- **Custom Annotations**: Right-click for arrows, Shift+click for circles
- **Legal Move Indicators**: Optional highlighting of valid moves

### Move Tree & Notation
- **Nested Sublines**: Create and navigate variations with proper indentation
- **Standard Notation**: 1. e4, 1... e5 format with proper move numbering
- **Clickable Moves**: Jump to any position by clicking moves
- **Variation Management**: Add, delete, and promote sublines
- **Move Navigation**: Arrow keys and keyboard shortcuts

### Annotation Tools
- **Text Comments**: Add detailed explanations to any move
- **Symbolic Annotations**: !, ?, !!, ??, !?, ?! for move quality
- **Visual Annotations**: Arrows and colored highlights
- **Persistent Storage**: Annotations saved per move node
- **Export Support**: Include annotations in PGN export

### Engine Integration
- **Stockfish WASM**: Powerful chess engine running in Web Worker
- **Multi-PV Analysis**: View multiple candidate moves
- **Real-time Evaluation**: Live position assessment
- **Depth Control**: Configurable analysis depth
- **Cloud Analysis**: Optional deeper analysis via cloud services
- **Error Detection**: Automatic identification of mistakes and blunders

### Game Management
- **PGN Import/Export**: Full game portability with variations
- **FEN Support**: Load custom positions via URL or input
- **Game Reports**: Automated analysis with accuracy percentages
- **Study Management**: Save and organize chess studies
- **Shareable Links**: Generate URLs that preserve position and analysis

### Bot Play
- **Configurable Levels**: Beginner (1200), Intermediate (1600), Advanced (1800), Expert (2000+)
- **Personality Traits**: Aggressive, Positional, Tactical, Defensive
- **Realistic Play**: Engine-based moves with appropriate randomness
- **Difficulty Scaling**: Adjustable thinking time and depth

### Opening Explorer
- **Lichess Database**: Access to millions of master games
- **Move Statistics**: Win rates, popularity, and performance data
- **ECO Codes**: Standard opening classification
- **Search Functionality**: Find openings by name or ECO code
- **Hover Effects**: Display suggested moves with statistics

### Tablebase Support
- **Syzygy Integration**: Perfect endgame solutions for ≤7 pieces
- **WDL/DTZ/DTM**: Win/Draw/Loss, Distance to Zero, Distance to Mate
- **Move Recommendations**: Best moves in tablebase positions
- **Endgame Training**: Learn perfect endgame technique

### Accessibility & UX
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Screen Reader**: Compatible with assistive technologies
- **High Contrast**: Support for visual accessibility
- **Help Panel**: Comprehensive keyboard shortcut reference
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **React-Chessboard** for interactive board
- **Chess.js** for game logic
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **MongoDB** for data storage
- **Stockfish** chess engine
- **Syzygy** tablebase
- **WebSocket** for real-time updates

### Development Tools
- **TypeScript** for type safety
- **Jest** for unit testing
- **Cypress** for e2e testing
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for git hooks

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Stockfish chess engine
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chess-analysis-board.git
   cd chess-analysis-board
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start the development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## 🎮 Usage

### Basic Navigation
- **Move Pieces**: Drag and drop or click to move
- **Navigate Moves**: Use arrow keys (←/→) or A/D keys
- **Go to Start/End**: Use ↑/↓ or W/S keys
- **Flip Board**: Press F key or click flip button
- **Undo/Redo**: Ctrl+Z / Ctrl+Y

### Creating Variations
1. Navigate back to any move using arrow keys
2. Play a different move than the main line
3. The system automatically creates a subline
4. Click on moves to switch between main line and variations

### Adding Annotations
1. Click on any move in the move tree
2. Use the annotation controls to add:
   - Comments (💬 button)
   - Symbols (!, ?, !!, ??, !?, ?!)
   - Visual arrows and circles

### Engine Analysis
1. The engine automatically analyzes the current position
2. View multiple candidate moves in the engine panel
3. Click on engine moves to play them
4. Monitor evaluation changes in real-time

### Bot Play
1. Select a difficulty level from the dropdown
2. Make your move on the board
3. The bot will automatically respond
4. Stop bot play by selecting "Select Bot Level" again

## 🧪 Testing

### Unit Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

### Coverage Report
```bash
cd frontend
npm run test:coverage
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints
- `POST /api/analysis/position` - Analyze chess position
- `GET /api/opening/moves` - Get opening moves for position
- `POST /api/tablebase/query` - Query endgame tablebase
- `GET /api/games` - Get user's saved games

## 🔧 Configuration

### Engine Settings
```typescript
const analysisConfig = {
  depth: 15,           // Analysis depth
  multiPV: 3,          // Number of candidate moves
  timeLimit: 5000,     // Time limit in ms
  useCloudAnalysis: false
};
```

### Board Settings
```typescript
const boardConfig = {
  orientation: 'white',    // Board orientation
  showCoordinates: true,   // Show file/rank labels
  showLastMove: true,      // Highlight last move
  showLegalMoves: false,   // Show legal move indicators
  animationDuration: 200   // Move animation speed
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stockfish** - Chess engine
- **Lichess** - Opening database and inspiration
- **Chess.js** - JavaScript chess library
- **React-Chessboard** - Chess board component
- **Syzygy** - Endgame tablebase

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/chess-analysis-board/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/chess-analysis-board/discussions)
- **Email**: support@chessanalysis.com

## 🗺️ Roadmap

### Version 2.0
- [ ] Multiplayer support
- [ ] Tournament mode
- [ ] Advanced puzzle creation
- [ ] Video analysis integration
- [ ] Mobile app (React Native)

### Version 2.1
- [ ] AI coaching features
- [ ] Advanced statistics
- [ ] Custom themes
- [ ] Plugin system
- [ ] Offline mode

## 📊 Performance

- **Bundle Size**: ~2MB (gzipped)
- **First Paint**: <1s
- **Interactive**: <2s
- **Memory Usage**: <100MB
- **Engine Response**: <500ms

## 🔒 Security

- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- XSS protection
- CSRF protection
- Secure headers

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Built with ❤️ for the chess community**
A production-quality interactive chess analysis board built with React, TypeScript, and Node.js. This application provides comprehensive chess analysis tools including engine integration, opening exploration, tablebase support, and game reporting.

## 🚀 Features

### Interactive Chess Board
- **Drag & Drop**: Intuitive piece movement with visual feedback
- **Click-to-Move**: Alternative input method for precise control
- **Board Flipping**: View from either side (F key or button)
- **Mobile Responsive**: Optimized for all device sizes
- **Last Move Highlighting**: Visual indication of the most recent move
- **Custom Annotations**: Right-click for arrows, Shift+click for circles
- **Legal Move Indicators**: Optional highlighting of valid moves

### Move Tree & Notation
- **Nested Sublines**: Create and navigate variations with proper indentation
- **Standard Notation**: 1. e4, 1... e5 format with proper move numbering
- **Clickable Moves**: Jump to any position by clicking moves
- **Variation Management**: Add, delete, and promote sublines
- **Move Navigation**: Arrow keys and keyboard shortcuts

### Annotation Tools
- **Text Comments**: Add detailed explanations to any move
- **Symbolic Annotations**: !, ?, !!, ??, !?, ?! for move quality
- **Visual Annotations**: Arrows and colored highlights
- **Persistent Storage**: Annotations saved per move node
- **Export Support**: Include annotations in PGN export

### Engine Integration
- **Stockfish WASM**: Powerful chess engine running in Web Worker
- **Multi-PV Analysis**: View multiple candidate moves
- **Real-time Evaluation**: Live position assessment
- **Depth Control**: Configurable analysis depth
- **Cloud Analysis**: Optional deeper analysis via cloud services
- **Error Detection**: Automatic identification of mistakes and blunders

### Game Management
- **PGN Import/Export**: Full game portability with variations
- **FEN Support**: Load custom positions via URL or input
- **Game Reports**: Automated analysis with accuracy percentages
- **Study Management**: Save and organize chess studies
- **Shareable Links**: Generate URLs that preserve position and analysis

### Bot Play
- **Configurable Levels**: Beginner (1200), Intermediate (1600), Advanced (1800), Expert (2000+)
- **Personality Traits**: Aggressive, Positional, Tactical, Defensive
- **Realistic Play**: Engine-based moves with appropriate randomness
- **Difficulty Scaling**: Adjustable thinking time and depth

### Opening Explorer
- **Lichess Database**: Access to millions of master games
- **Move Statistics**: Win rates, popularity, and performance data
- **ECO Codes**: Standard opening classification
- **Search Functionality**: Find openings by name or ECO code
- **Hover Effects**: Display suggested moves with statistics

### Tablebase Support
- **Syzygy Integration**: Perfect endgame solutions for ≤7 pieces
- **WDL/DTZ/DTM**: Win/Draw/Loss, Distance to Zero, Distance to Mate
- **Move Recommendations**: Best moves in tablebase positions
- **Endgame Training**: Learn perfect endgame technique

### Accessibility & UX
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Screen Reader**: Compatible with assistive technologies
- **High Contrast**: Support for visual accessibility
- **Help Panel**: Comprehensive keyboard shortcut reference
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **React-Chessboard** for interactive board
- **Chess.js** for game logic
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **MongoDB** for data storage
- **Stockfish** chess engine
- **Syzygy** tablebase
- **WebSocket** for real-time updates

### Development Tools
- **TypeScript** for type safety
- **Jest** for unit testing
- **Cypress** for e2e testing
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for git hooks

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Stockfish chess engine
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chess-analysis-board.git
   cd chess-analysis-board
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start the development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## 🎮 Usage

### Basic Navigation
- **Move Pieces**: Drag and drop or click to move
- **Navigate Moves**: Use arrow keys (←/→) or A/D keys
- **Go to Start/End**: Use ↑/↓ or W/S keys
- **Flip Board**: Press F key or click flip button
- **Undo/Redo**: Ctrl+Z / Ctrl+Y

### Creating Variations
1. Navigate back to any move using arrow keys
2. Play a different move than the main line
3. The system automatically creates a subline
4. Click on moves to switch between main line and variations

### Adding Annotations
1. Click on any move in the move tree
2. Use the annotation controls to add:
   - Comments (💬 button)
   - Symbols (!, ?, !!, ??, !?, ?!)
   - Visual arrows and circles

### Engine Analysis
1. The engine automatically analyzes the current position
2. View multiple candidate moves in the engine panel
3. Click on engine moves to play them
4. Monitor evaluation changes in real-time

### Bot Play
1. Select a difficulty level from the dropdown
2. Make your move on the board
3. The bot will automatically respond
4. Stop bot play by selecting "Select Bot Level" again

## 🧪 Testing

### Unit Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

### Coverage Report
```bash
cd frontend
npm run test:coverage
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints
- `POST /api/analysis/position` - Analyze chess position
- `GET /api/opening/moves` - Get opening moves for position
- `POST /api/tablebase/query` - Query endgame tablebase
- `GET /api/games` - Get user's saved games

## 🔧 Configuration

### Engine Settings
```typescript
const analysisConfig = {
  depth: 15,           // Analysis depth
  multiPV: 3,          // Number of candidate moves
  timeLimit: 5000,     // Time limit in ms
  useCloudAnalysis: false
};
```

### Board Settings
```typescript
const boardConfig = {
  orientation: 'white',    // Board orientation
  showCoordinates: true,   // Show file/rank labels
  showLastMove: true,      // Highlight last move
  showLegalMoves: false,   // Show legal move indicators
  animationDuration: 200   // Move animation speed
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stockfish** - Chess engine
- **Lichess** - Opening database and inspiration
- **Chess.js** - JavaScript chess library
- **React-Chessboard** - Chess board component
- **Syzygy** - Endgame tablebase

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/chess-analysis-board/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/chess-analysis-board/discussions)
- **Email**: support@chessanalysis.com

## 🗺️ Roadmap

### Version 2.0
- [ ] Multiplayer support
- [ ] Tournament mode
- [ ] Advanced puzzle creation
- [ ] Video analysis integration
- [ ] Mobile app (React Native)

### Version 2.1
- [ ] AI coaching features
- [ ] Advanced statistics
- [ ] Custom themes
- [ ] Plugin system
- [ ] Offline mode

## 📊 Performance

- **Bundle Size**: ~2MB (gzipped)
- **First Paint**: <1s
- **Interactive**: <2s
- **Memory Usage**: <100MB
- **Engine Response**: <500ms

## 🔒 Security

- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- XSS protection
- CSRF protection
- Secure headers

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Built with ❤️ for the chess community**
A production-quality interactive chess analysis board built with React, TypeScript, and Node.js. This application provides comprehensive chess analysis tools including engine integration, opening exploration, tablebase support, and game reporting.

## 🚀 Features

### Interactive Chess Board
- **Drag & Drop**: Intuitive piece movement with visual feedback
- **Click-to-Move**: Alternative input method for precise control
- **Board Flipping**: View from either side (F key or button)
- **Mobile Responsive**: Optimized for all device sizes
- **Last Move Highlighting**: Visual indication of the most recent move
- **Custom Annotations**: Right-click for arrows, Shift+click for circles
- **Legal Move Indicators**: Optional highlighting of valid moves

### Move Tree & Notation
- **Nested Sublines**: Create and navigate variations with proper indentation
- **Standard Notation**: 1. e4, 1... e5 format with proper move numbering
- **Clickable Moves**: Jump to any position by clicking moves
- **Variation Management**: Add, delete, and promote sublines
- **Move Navigation**: Arrow keys and keyboard shortcuts

### Annotation Tools
- **Text Comments**: Add detailed explanations to any move
- **Symbolic Annotations**: !, ?, !!, ??, !?, ?! for move quality
- **Visual Annotations**: Arrows and colored highlights
- **Persistent Storage**: Annotations saved per move node
- **Export Support**: Include annotations in PGN export

### Engine Integration
- **Stockfish WASM**: Powerful chess engine running in Web Worker
- **Multi-PV Analysis**: View multiple candidate moves
- **Real-time Evaluation**: Live position assessment
- **Depth Control**: Configurable analysis depth
- **Cloud Analysis**: Optional deeper analysis via cloud services
- **Error Detection**: Automatic identification of mistakes and blunders

### Game Management
- **PGN Import/Export**: Full game portability with variations
- **FEN Support**: Load custom positions via URL or input
- **Game Reports**: Automated analysis with accuracy percentages
- **Study Management**: Save and organize chess studies
- **Shareable Links**: Generate URLs that preserve position and analysis

### Bot Play
- **Configurable Levels**: Beginner (1200), Intermediate (1600), Advanced (1800), Expert (2000+)
- **Personality Traits**: Aggressive, Positional, Tactical, Defensive
- **Realistic Play**: Engine-based moves with appropriate randomness
- **Difficulty Scaling**: Adjustable thinking time and depth

### Opening Explorer
- **Lichess Database**: Access to millions of master games
- **Move Statistics**: Win rates, popularity, and performance data
- **ECO Codes**: Standard opening classification
- **Search Functionality**: Find openings by name or ECO code
- **Hover Effects**: Display suggested moves with statistics

### Tablebase Support
- **Syzygy Integration**: Perfect endgame solutions for ≤7 pieces
- **WDL/DTZ/DTM**: Win/Draw/Loss, Distance to Zero, Distance to Mate
- **Move Recommendations**: Best moves in tablebase positions
- **Endgame Training**: Learn perfect endgame technique

### Accessibility & UX
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Screen Reader**: Compatible with assistive technologies
- **High Contrast**: Support for visual accessibility
- **Help Panel**: Comprehensive keyboard shortcut reference
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **React-Chessboard** for interactive board
- **Chess.js** for game logic
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **MongoDB** for data storage
- **Stockfish** chess engine
- **Syzygy** tablebase
- **WebSocket** for real-time updates

### Development Tools
- **TypeScript** for type safety
- **Jest** for unit testing
- **Cypress** for e2e testing
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for git hooks

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Stockfish chess engine
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chess-analysis-board.git
   cd chess-analysis-board
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start the development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## 🎮 Usage

### Basic Navigation
- **Move Pieces**: Drag and drop or click to move
- **Navigate Moves**: Use arrow keys (←/→) or A/D keys
- **Go to Start/End**: Use ↑/↓ or W/S keys
- **Flip Board**: Press F key or click flip button
- **Undo/Redo**: Ctrl+Z / Ctrl+Y

### Creating Variations
1. Navigate back to any move using arrow keys
2. Play a different move than the main line
3. The system automatically creates a subline
4. Click on moves to switch between main line and variations

### Adding Annotations
1. Click on any move in the move tree
2. Use the annotation controls to add:
   - Comments (💬 button)
   - Symbols (!, ?, !!, ??, !?, ?!)
   - Visual arrows and circles

### Engine Analysis
1. The engine automatically analyzes the current position
2. View multiple candidate moves in the engine panel
3. Click on engine moves to play them
4. Monitor evaluation changes in real-time

### Bot Play
1. Select a difficulty level from the dropdown
2. Make your move on the board
3. The bot will automatically respond
4. Stop bot play by selecting "Select Bot Level" again

## 🧪 Testing

### Unit Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

### Coverage Report
```bash
cd frontend
npm run test:coverage
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints
- `POST /api/analysis/position` - Analyze chess position
- `GET /api/opening/moves` - Get opening moves for position
- `POST /api/tablebase/query` - Query endgame tablebase
- `GET /api/games` - Get user's saved games

## 🔧 Configuration

### Engine Settings
```typescript
const analysisConfig = {
  depth: 15,           // Analysis depth
  multiPV: 3,          // Number of candidate moves
  timeLimit: 5000,     // Time limit in ms
  useCloudAnalysis: false
};
```

### Board Settings
```typescript
const boardConfig = {
  orientation: 'white',    // Board orientation
  showCoordinates: true,   // Show file/rank labels
  showLastMove: true,      // Highlight last move
  showLegalMoves: false,   // Show legal move indicators
  animationDuration: 200   // Move animation speed
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stockfish** - Chess engine
- **Lichess** - Opening database and inspiration
- **Chess.js** - JavaScript chess library
- **React-Chessboard** - Chess board component
- **Syzygy** - Endgame tablebase

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/chess-analysis-board/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/chess-analysis-board/discussions)
- **Email**: support@chessanalysis.com

## 🗺️ Roadmap

### Version 2.0
- [ ] Multiplayer support
- [ ] Tournament mode
- [ ] Advanced puzzle creation
- [ ] Video analysis integration
- [ ] Mobile app (React Native)

### Version 2.1
- [ ] AI coaching features
- [ ] Advanced statistics
- [ ] Custom themes
- [ ] Plugin system
- [ ] Offline mode

## 📊 Performance

- **Bundle Size**: ~2MB (gzipped)
- **First Paint**: <1s
- **Interactive**: <2s
- **Memory Usage**: <100MB
- **Engine Response**: <500ms

## 🔒 Security

- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- XSS protection
- CSRF protection
- Secure headers

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Built with ❤️ for the chess community**