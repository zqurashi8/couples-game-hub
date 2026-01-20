# Couples Game Hub - Project Documentation

## Overview

Couples Game Hub is a collection of browser-based multiplayer games designed for couples to play together. The application supports local (pass-and-play), AI, and online multiplayer modes using Firebase Realtime Database.

**Live URL:** https://zqurashi8.github.io/couples-game-hub/

---

## Project Structure

```
couples-game-hub/
├── index.html              # Main hub/landing page
├── css/
│   ├── style.css           # Global styles
│   ├── components.css      # Reusable UI components
│   ├── design-system.css   # Design tokens and variables
│   ├── auth.css            # Authentication UI styles
│   └── cinco.css           # Cinco game-specific styles
├── js/
│   ├── firebase-config.js  # Firebase initialization
│   ├── multiplayer.js      # Multiplayer session management
│   ├── cinco-game.js       # Cinco card game logic
│   ├── cinco-online.js     # Cinco online multiplayer sync
│   ├── online-lobby.js     # Reusable lobby UI component
│   ├── mode-toggle.js      # Dark/light mode toggle
│   └── auth/
│       ├── auth-manager.js   # Authentication state management
│       ├── auth-ui.js        # Auth UI components & notifications
│       └── profile-manager.js # User profile & stats
├── games/
│   ├── cinco.html          # Cinco card game
│   ├── crossword-clash.html # Crossword puzzle game
│   ├── memory-match.html   # Memory matching game
│   ├── trivia-duel.html    # Trivia quiz game
│   ├── word-rush.html      # Word game
│   ├── math-dash.html      # Math challenges
│   ├── quick-draw.html     # Drawing game
│   ├── memory-lane.html    # Memory sharing game
│   ├── date-designer.html  # Date planning tool
│   └── inside-our-space.html # Shared space/board
├── tests/
│   ├── setup.js            # Jest test configuration
│   ├── cinco-game.test.js  # Cinco game logic tests
│   ├── cinco-ui.test.js    # Cinco UI tests
│   └── multiplayer.test.js # Multiplayer session tests
├── package.json            # NPM dependencies and scripts
└── CLAUDE.md               # This documentation file
```

---

## Games

### Cinco (Primary Focus)
UNO-style card game with special power-up cards.

**Game Modes:**
- `ai` - Play against AI opponent
- `local` - Pass-and-play on same device
- `online` - Real-time multiplayer via Firebase

**Card Types:**
1. **Number Cards (0-9)** - 4 colors, 2 each = 80 cards
2. **Action Cards:**
   - `quantumskip` (🚫) - Skip opponent's turn
   - `reversepolarity` (🔄) - Reverse direction (acts as skip in 2-player)
3. **Power Cards:**
   - `neuraldrain` (+2) - Opponent draws 2
   - `overdrive` (+3) - Opponent draws 3
   - `empblast` (💥) - Wipe opponent's hand, they draw 5
   - `firewall` (🛡️) - Block next attack (except +4)
   - `systemlockdown` (🔒) - Lock current color for 2 rounds
4. **Wild Cards:**
   - `adaptiveprotocol` (⭐) - Choose any color
   - `systemoverload` (⭐+4) - Wild +4 (CANNOT be blocked)
   - `turnsteal` (⚡) - Take another turn
   - `datacorruption` (🔀) - Swap hands + opponent draws 4
   - `mirrorcode` (👥) - Copy last power-up (except turnsteal, empblast, mirrorcode)

**CINCO Mechanic:**
- Must say "CINCO!" when down to 1 card
- Forgetting = 2 card penalty
- Wrong claim = 2 card penalty

---

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JavaScript (ES Modules)
- **Backend:** Firebase Realtime Database
- **Auth:** Firebase Anonymous + Google Auth
- **Hosting:** GitHub Pages
- **Testing:** Jest with jsdom

---

## Key Classes & Functions

### CincoGame (js/cinco-game.js)
Core game logic for Cinco.

```javascript
// Constructor
new CincoGame(mode, callbacks)
// mode: 'ai' | 'local' | 'online'
// callbacks: { onStateChange, requestColorSelection, playAnimation, showNotification, gameOver }

// Key Methods
game.startGame()           // Initialize new game
game.isCardPlayable(card)  // Check if card can be played
game.selectCard(index)     // Select/play card at index
game.drawCard()            // Draw from deck (ends turn)
game.sayCinco(player)      // Declare CINCO
game.getState()            // Get current game state

// Static Methods
CincoGame.getCardDisplay(value)      // Get emoji/symbol for card
CincoGame.getCardDescription(value)  // Get card description
```

### MultiplayerSession (js/multiplayer.js)
Manages online game sessions.

```javascript
// Constructor
new MultiplayerSession(gameType)

// Key Methods
session.createSession(playerName)         // Create new session, get code
session.joinSession(sessionId, playerName) // Join existing session
session.updateGameState(stateUpdates)     // Sync state to Firebase
session.on(event, callback)               // Register event listener
session.disconnect()                       // Leave session

// Events
'onPlayerJoined'      // Player 2 joined
'onGameStateChange'   // Game state updated
'onOpponentDisconnect' // Opponent disconnected

// Static Methods
MultiplayerSession.getHistory()         // Get session history
MultiplayerSession.getActiveSession()   // Get current active session
MultiplayerSession.clearActiveSession() // Clear stored session
```

### CincoOnline (js/cinco-online.js)
Syncs Cinco game state with Firebase.

```javascript
// Constructor
new CincoOnline(session, playerRole, callbacks)

// Key Methods
onlineGame.initializeGame(initialState)  // Set initial state in Firebase
onlineGame.playCard(card, newState)      // Sync card play
onlineGame.drawCard(newState)            // Sync draw action
onlineGame.sayCinco()                    // Sync CINCO call
onlineGame.cleanup()                     // Remove listeners
```

---

## CSS Architecture

### Design Tokens (css/design-system.css)
```css
:root {
  /* Colors */
  --color-bg-dark: #1a2332;
  --card-red: #FF5252;
  --card-blue: #42A5F5;
  --card-green: #66BB6A;
  --card-yellow: #FFEE58;
  --card-wild: #AB47BC;

  /* Typography */
  --font-primary: 'Inter', sans-serif;
  --font-display: 'Rajdhani', sans-serif;
}
```

### Cinco-Specific (css/cinco.css)
- Card styling with color gradients
- Player/opponent hand layouts
- Card overlap with negative margins
- Selected card lift animation
- CINCO button states (clickable, disabled, said)
- Color picker modal
- Responsive breakpoints for mobile

---

## Firebase Structure

```
firebase-realtime-database/
├── sessions/
│   └── {sessionId}/
│       ├── gameType: "cinco"
│       ├── createdAt: timestamp
│       ├── expiresAt: timestamp
│       ├── status: "waiting" | "in-progress" | "completed"
│       ├── players/
│       │   ├── player1/
│       │   │   ├── name: string
│       │   │   ├── connected: boolean
│       │   │   └── joinedAt: timestamp
│       │   └── player2/
│       │       └── ...
│       └── gameState/
│           ├── currentColor: string
│           ├── currentValue: string
│           ├── currentTurn: "player" | "opponent"
│           ├── discardPile: []
│           ├── activeEffects: {}
│           └── players/
│               ├── player1/
│               │   ├── cardCount: number
│               │   ├── saidCinco: boolean
│               │   └── lastAction: {}
│               └── player2/
│                   └── ...
├── privateHands/
│   └── {sessionId}/
│       ├── player1: [cards]
│       └── player2: [cards]
```

---

## Development Guide

### Local Development
```bash
# Install dependencies
npm install

# Start local server (http://localhost:3000)
npm start

# Start with browser auto-open
npm dev

# Alternative (Python)
npm run serve
```

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage
npm test:coverage
```

### Deploying
```bash
# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub (auto-deploys to GitHub Pages)
git push origin main
```

---

## UI/UX Guidelines

### Card Interaction (Two-Tap System)
1. **First tap:** Select card (lifts up with glow)
2. **Second tap:** Play card (if playable)
3. **Tap elsewhere:** Deselect

### Card Colors (Bright & Saturated)
- Red: `#FF5252` to `#D32F2F`
- Blue: `#42A5F5` to `#1976D2`
- Green: `#66BB6A` to `#388E3C`
- Yellow: `#FFEE58` to `#F9A825`
- Wild: `#AB47BC` to `#7B1FA2`

### Card Layout
- Player cards overlap with `-15px` margin
- Cards use `65x95px` base size
- Selected cards translate `-30px` up
- Playable cards have green border glow

### CINCO Button Visibility
- **AI Mode:** Hidden
- **Local Mode:** Hidden
- **Online Mode:** Visible
  - Disabled state: Gray
  - Clickable state (1 card): Red, pulsing
  - Said state: Green with checkmark

---

## Common Tasks

### Adding a New Card Type
1. Add to `POWER_UPS` object in `CincoGame` constructor
2. Add to `initializeDeck()` with quantity
3. Add case in `handleCardEffect()`
4. Add display emoji in `getCardDisplay()`
5. Add description in `getCardDescription()`
6. Add AI priority in `getCardPriority()`

### Modifying Card Colors
1. Update CSS variables in `:root`
2. Update `.cinco-card.{color}` gradients
3. Update color picker `.cinco-color-option.{color}`

### Adding a New Game Mode
1. Add button in mode selection screen
2. Add click handler in JavaScript
3. Create new `startGame(mode)` logic if needed
4. Update UI rendering for mode-specific features

### Fixing Layout Issues
1. Check `.cinco-board` flex layout
2. Verify `.cinco-player-area` takes remaining space
3. Check media queries for target screen size
4. Test with different card counts (7, 15, 20+ cards)

---

## Testing Guidelines

### What to Test
- Card playability rules
- Special card effects
- Win/lose conditions
- CINCO mechanic (penalty, success)
- AI decision making
- State synchronization
- UI rendering

### Test File Naming
- `{feature}.test.js` - Unit tests
- `{feature}-ui.test.js` - UI/Integration tests

### Mocking Firebase
Firebase is mocked in `tests/setup.js`. All Firebase operations return resolved promises by default.

---

## Troubleshooting

### Cards Cut Off on Mobile
- Check `overflow` properties on containers
- Verify `flex-shrink: 0` on cards
- Check media query breakpoints

### Opponent Actions Not Syncing
- Check Firebase listener setup in `CincoOnline`
- Verify session ID matches
- Check browser console for Firebase errors

### CINCO Button Not Showing
- Verify `gameMode === 'online'`
- Check `.online-mode` class on container
- Verify CSS rules for `.cinco-game.online-mode .cinco-btn`

### Tests Failing
- Run `npm install` to ensure dependencies
- Check `tests/setup.js` for mock configuration
- Clear Jest cache: `npx jest --clearCache`

---

## Important Rules

1. **Never push Firebase credentials** - Use environment variables
2. **Test on mobile** - Primary target is phone screens
3. **Keep cards readable** - Minimum 50px width
4. **Maintain offline capability** - AI/Local modes work without internet
5. **Session cleanup** - Sessions expire after 48 hours
6. **Turn always passes after draw** - No option to play drawn card
7. **+4 bypasses Firewall** - By design, cannot be blocked
8. **Colors can stack locks** - Multiple lockdowns can lock multiple colors

---

## Version History

- **v1.0** - Initial release with Cinco game
- **v1.1** - Added online multiplayer
- **v1.2** - UI improvements, two-tap card selection
- **v1.3** - Bright color scheme, card overlap layout

---

## Contact

For issues or contributions, visit:
https://github.com/zqurashi8/couples-game-hub
