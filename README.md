# Infinity Storm - Marvel Slot Game

A 6x5 cascading slot game featuring the epic battle between Thanos and Scarlet Witch, built with Phaser.js.

## 🎮 Game Overview

"Infinity Storm" is a high-volatility video slot game that immerses players in the Marvel Avengers universe. With "Candy Crush"-style cascading mechanics and engaging bonus features, the game offers a maximum win potential of 5,000x the bet.

### Key Features
- **6x5 Grid Layout** with cascading mechanics
- **8+ Symbol Matching** requirement for wins
- **High Volatility** gameplay with 96% RTP
- **Marvel Theme** focused on Thanos vs Scarlet Witch
- **Infinity Power Feature** - transforms random symbols into multipliers
- **Free Spins** with accumulating multipliers
- **Mobile Optimized** for web browsers

## 🚀 Quick Start

### Prerequisites
- Node.js (for development server)
- Modern web browser with WebGL support

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ElricStormking/GloveProject.git
   cd GloveProject
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx http-server -c-1 -p 8080
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:8080
   ```

## 🎯 Game Mechanics

### Symbols
| Symbol Type | Description | Payout (8+ Matches) |
|-------------|-------------|---------------------|
| **Low-Paying** | Space Gem, Mind Gem, Reality Gem, Power Gem, Time Gem, Soul Gem | 2x to 6x bet |
| **High-Paying** | Thanos, Scarlet Witch, Scarlet Magic Spell | 10x to 25x bet |
| **Scatter** | Infinity Glove (triggers bonus features) | N/A |

### Bonus Features

#### Infinity Power (Base Game)
- **Trigger:** When all 6 Infinity Gem symbols + Thanos appear on the grid
- **Effect:** Transforms one random symbol into a multiplier symbol (2x to 500x)
- **Visual:** Golden glow effect with multiplier text display

#### Free Spins
- **Trigger:** Landing 4+ Scatter symbols (Infinity Glove)
- **Awards:** 15-20 Free Spins depending on scatter count
- **Mechanics:** 
  - Every winning cascade applies random multipliers
  - Multipliers accumulate throughout the bonus round
  - Additional scatters award +2 extra spins

## 🛠️ Technical Specifications

### Built With
- **Phaser 3.70.0** - Game engine
- **JavaScript ES6** - Programming language
- **HTML5/WebGL** - Rendering
- **CSS3** - Styling

### Project Structure
```
infinity-storm/
├── src/
│   ├── config/
│   │   └── GameConfig.js      # Game configuration and constants
│   ├── core/
│   │   ├── GameStateManager.js # Game state management
│   │   └── Symbol.js          # Symbol class with animations
│   ├── systems/
│   │   ├── GridManager.js     # Grid mechanics and cascading
│   │   └── WinCalculator.js   # Win calculation and RTP tracking
│   ├── ui/
│   │   └── UIManager.js       # User interface management
│   ├── scenes/
│   │   ├── LoadingScene.js    # Asset loading and placeholders
│   │   ├── MenuScene.js       # Main menu
│   │   └── GameScene.js       # Main gameplay scene
│   └── main.js                # Game initialization
├── assets/                    # Game assets (images, audio, fonts)
├── index.html                 # Main HTML file
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🎮 Controls

### Keyboard Shortcuts
- **Space/Enter** - Spin
- **Up/Down Arrow** - Adjust bet
- **A** - Toggle autoplay
- **Q** - Quick spin toggle
- **M** - Return to menu
- **S** - Show session statistics

### Mouse/Touch
- Click buttons for all game functions
- Fully responsive design for mobile devices

## 🔧 Configuration

Key game settings can be modified in `src/config/GameConfig.js`:

```javascript
// Game Settings
MIN_MATCH_COUNT: 8,        // Minimum symbols required for win
RTP: 0.96,                 // Return to Player percentage
MAX_WIN_MULTIPLIER: 5000,  // Maximum win multiplier
VOLATILITY: 'HIGH',        // Game volatility

// Bet Configuration
MIN_BET: 0.20,
MAX_BET: 200.00,
DEFAULT_BET: 1.00,
```

## 📊 Game Statistics

The game tracks comprehensive session statistics including:
- Win rate and RTP calculation
- Biggest wins and win categories
- Total spins and win streaks
- Match size distribution

## 🎨 Visual Design

- High-quality placeholder graphics with color-coded symbols
- Smooth cascading animations
- Particle effects for wins and bonuses
- Marvel-themed UI with responsive design
- Professional slot machine interface

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly controls
- Optimized performance for mobile browsers
- Portrait and landscape orientation support

## 🔊 Audio System

- SafeSound wrapper for graceful audio handling
- Background music and sound effects
- Audio controls in settings
- Silent fallbacks for missing audio files

## 🚧 Development Status

**Current Phase:** Core gameplay complete with placeholder assets
**Next Phase:** Enhanced graphics, audio, and visual effects

### Completed Features ✅
- ✅ Complete 6x5 cascading slot mechanics
- ✅ 8+ symbol matching with flood-fill algorithm
- ✅ Free spins system with multiplier accumulation
- ✅ Infinity Power feature
- ✅ Session statistics and RTP tracking
- ✅ Mobile-responsive design
- ✅ Autoplay and keyboard controls

### Upcoming Features 🔄
- 🔄 Enhanced Marvel-themed graphics
- 🔄 Professional audio and sound effects
- 🔄 Advanced visual effects and animations
- 🔄 Additional bonus features

## 🤝 Contributing

This is a private project, but feedback and suggestions are welcome!

## 📄 License

This project is for educational and demonstration purposes.

## 🎯 Game Design

Based on the comprehensive [Game Design Document](../InfinityStormGameDesign.markdown) featuring:
- Marvel Cinematic Universe theme
- High-volatility slot mechanics
- Cascading grid system inspired by "Candy Crush"
- Professional casino game standards

---

**Enjoy the epic battle between Thanos and Scarlet Witch in Infinity Storm!** ⚡💎🎰
