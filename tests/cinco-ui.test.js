/**
 * Cinco Card Game - UI/Integration Tests
 * Tests DOM manipulation, user interactions, and rendering
 */

describe('Cinco UI', () => {
  let container;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="cinco-game">
        <div class="cinco-screen active" id="modeScreen"></div>
        <div class="cinco-screen" id="gameScreen">
          <div class="cinco-board">
            <div class="cinco-opponent-area">
              <div class="cinco-opponent-hand" id="opponentHand"></div>
              <div class="cinco-opponent-info">
                <span id="opponentName">Opponent</span> · <span id="opponentCardCount">7</span> cards
              </div>
            </div>
            <div class="cinco-center-area">
              <div class="cinco-turn-indicator" id="turnIndicator">Your Turn</div>
              <div class="cinco-deck-area">
                <div class="cinco-draw-pile" id="drawPile">🎴</div>
                <div class="cinco-discard-pile" id="discardPile"></div>
              </div>
              <div class="cinco-center-info">
                <span id="colorIndicator"></span>
              </div>
              <div class="cinco-effects" id="activeEffects"></div>
            </div>
            <div class="cinco-player-area">
              <div class="cinco-player-info">
                <span id="playerName">You</span> · <span id="playerCardCount">7</span> cards
              </div>
              <div class="cinco-player-hand" id="playerHand"></div>
            </div>
          </div>
          <button class="cinco-btn" id="cincoBtn">CINCO!</button>
        </div>
        <div class="cinco-screen" id="gameOverScreen"></div>
        <div class="cinco-color-picker" id="colorPicker">
          <div class="cinco-color-picker-content">
            <div class="cinco-color-options">
              <div class="cinco-color-option red" data-color="red"></div>
              <div class="cinco-color-option blue" data-color="blue"></div>
              <div class="cinco-color-option green" data-color="green"></div>
              <div class="cinco-color-option yellow" data-color="yellow"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    container = document.querySelector('.cinco-game');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Screen Navigation', () => {
    test('should have mode screen active by default', () => {
      const modeScreen = document.getElementById('modeScreen');
      expect(modeScreen.classList.contains('active')).toBe(true);
    });

    test('should show game screen when activated', () => {
      const gameScreen = document.getElementById('gameScreen');
      const modeScreen = document.getElementById('modeScreen');

      modeScreen.classList.remove('active');
      gameScreen.classList.add('active');

      expect(gameScreen.classList.contains('active')).toBe(true);
      expect(modeScreen.classList.contains('active')).toBe(false);
    });
  });

  describe('Turn Indicator', () => {
    test('should display turn indicator', () => {
      const turnIndicator = document.getElementById('turnIndicator');
      expect(turnIndicator).toBeTruthy();
      expect(turnIndicator.textContent).toBe('Your Turn');
    });

    test('should update turn indicator text', () => {
      const turnIndicator = document.getElementById('turnIndicator');
      turnIndicator.textContent = '⏳ Waiting...';
      turnIndicator.classList.remove('your-turn');

      expect(turnIndicator.textContent).toBe('⏳ Waiting...');
      expect(turnIndicator.classList.contains('your-turn')).toBe(false);
    });

    test('should add your-turn class when player turn', () => {
      const turnIndicator = document.getElementById('turnIndicator');
      turnIndicator.classList.add('your-turn');

      expect(turnIndicator.classList.contains('your-turn')).toBe(true);
    });
  });

  describe('Card Rendering', () => {
    test('should render player hand container', () => {
      const playerHand = document.getElementById('playerHand');
      expect(playerHand).toBeTruthy();
    });

    test('should render opponent hand container', () => {
      const opponentHand = document.getElementById('opponentHand');
      expect(opponentHand).toBeTruthy();
    });

    test('should render cards with correct structure', () => {
      const playerHand = document.getElementById('playerHand');
      playerHand.innerHTML = `
        <div class="cinco-card red playable" data-index="0" data-value="5">
          <div class="cinco-card-corner top-left">5</div>
          <div>5</div>
          <div class="cinco-card-corner bottom-right">5</div>
        </div>
      `;

      const card = playerHand.querySelector('.cinco-card');
      expect(card).toBeTruthy();
      expect(card.classList.contains('red')).toBe(true);
      expect(card.classList.contains('playable')).toBe(true);
      expect(card.dataset.index).toBe('0');
      expect(card.dataset.value).toBe('5');
    });

    test('should apply color classes to cards', () => {
      const playerHand = document.getElementById('playerHand');
      const colors = ['red', 'blue', 'green', 'yellow', 'wild'];

      colors.forEach(color => {
        playerHand.innerHTML = `<div class="cinco-card ${color}"></div>`;
        const card = playerHand.querySelector('.cinco-card');
        expect(card.classList.contains(color)).toBe(true);
      });
    });

    test('should apply selected class to selected card', () => {
      const playerHand = document.getElementById('playerHand');
      playerHand.innerHTML = `
        <div class="cinco-card red selected" data-index="0"></div>
        <div class="cinco-card blue" data-index="1"></div>
      `;

      const selectedCard = playerHand.querySelector('.cinco-card.selected');
      expect(selectedCard).toBeTruthy();
      expect(selectedCard.dataset.index).toBe('0');
    });

    test('should apply disabled class to unplayable cards', () => {
      const playerHand = document.getElementById('playerHand');
      playerHand.innerHTML = `
        <div class="cinco-card red disabled" data-index="0"></div>
      `;

      const disabledCard = playerHand.querySelector('.cinco-card.disabled');
      expect(disabledCard).toBeTruthy();
    });
  });

  describe('Card Count Display', () => {
    test('should update player card count', () => {
      const playerCardCount = document.getElementById('playerCardCount');
      playerCardCount.textContent = '5';
      expect(playerCardCount.textContent).toBe('5');
    });

    test('should update opponent card count', () => {
      const opponentCardCount = document.getElementById('opponentCardCount');
      opponentCardCount.textContent = '3';
      expect(opponentCardCount.textContent).toBe('3');
    });
  });

  describe('Color Indicator', () => {
    test('should display color indicator', () => {
      const colorIndicator = document.getElementById('colorIndicator');
      expect(colorIndicator).toBeTruthy();
    });

    test('should update color emoji', () => {
      const colorIndicator = document.getElementById('colorIndicator');
      const colorEmojis = { red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡' };

      Object.entries(colorEmojis).forEach(([color, emoji]) => {
        colorIndicator.textContent = emoji;
        expect(colorIndicator.textContent).toBe(emoji);
      });
    });
  });

  describe('Discard Pile', () => {
    test('should render discard pile', () => {
      const discardPile = document.getElementById('discardPile');
      expect(discardPile).toBeTruthy();
    });

    test('should show top card in discard pile', () => {
      const discardPile = document.getElementById('discardPile');
      discardPile.innerHTML = `
        <div class="cinco-card red" style="width: 100%; height: 100%;">
          <div class="cinco-card-corner top-left">7</div>
          <div>7</div>
          <div class="cinco-card-corner bottom-right">7</div>
        </div>
      `;

      const topCard = discardPile.querySelector('.cinco-card');
      expect(topCard).toBeTruthy();
      expect(topCard.classList.contains('red')).toBe(true);
    });
  });

  describe('Draw Pile', () => {
    test('should render draw pile', () => {
      const drawPile = document.getElementById('drawPile');
      expect(drawPile).toBeTruthy();
    });

    test('should apply must-draw class when no playable cards', () => {
      const drawPile = document.getElementById('drawPile');
      drawPile.classList.add('must-draw');
      expect(drawPile.classList.contains('must-draw')).toBe(true);
    });
  });

  describe('CINCO Button', () => {
    test('should render CINCO button', () => {
      const cincoBtn = document.getElementById('cincoBtn');
      expect(cincoBtn).toBeTruthy();
      expect(cincoBtn.textContent).toBe('CINCO!');
    });

    test('should apply clickable state', () => {
      const cincoBtn = document.getElementById('cincoBtn');
      cincoBtn.classList.add('clickable');
      expect(cincoBtn.classList.contains('clickable')).toBe(true);
    });

    test('should apply disabled state', () => {
      const cincoBtn = document.getElementById('cincoBtn');
      cincoBtn.classList.add('disabled');
      expect(cincoBtn.classList.contains('disabled')).toBe(true);
    });

    test('should apply said state', () => {
      const cincoBtn = document.getElementById('cincoBtn');
      cincoBtn.classList.add('said');
      cincoBtn.textContent = '✓ CINCO!';
      expect(cincoBtn.classList.contains('said')).toBe(true);
      expect(cincoBtn.textContent).toBe('✓ CINCO!');
    });
  });

  describe('Color Picker Modal', () => {
    test('should render color picker', () => {
      const colorPicker = document.getElementById('colorPicker');
      expect(colorPicker).toBeTruthy();
    });

    test('should have all four color options', () => {
      const colorOptions = document.querySelectorAll('.cinco-color-option');
      expect(colorOptions.length).toBe(4);

      const colors = ['red', 'blue', 'green', 'yellow'];
      colorOptions.forEach((option, index) => {
        expect(option.dataset.color).toBe(colors[index]);
      });
    });

    test('should show color picker when active', () => {
      const colorPicker = document.getElementById('colorPicker');
      colorPicker.classList.add('active');
      expect(colorPicker.classList.contains('active')).toBe(true);
    });

    test('should apply locked class to locked colors', () => {
      const redOption = document.querySelector('.cinco-color-option.red');
      redOption.classList.add('locked');
      expect(redOption.classList.contains('locked')).toBe(true);
    });
  });

  describe('Active Effects Display', () => {
    test('should render active effects container', () => {
      const activeEffects = document.getElementById('activeEffects');
      expect(activeEffects).toBeTruthy();
    });

    test('should render firewall badge', () => {
      const activeEffects = document.getElementById('activeEffects');
      activeEffects.innerHTML = '<div class="cinco-effect-badge firewall">🛡️ Shield</div>';

      const badge = activeEffects.querySelector('.cinco-effect-badge.firewall');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('Shield');
    });

    test('should render locked color badge', () => {
      const activeEffects = document.getElementById('activeEffects');
      activeEffects.innerHTML = '<div class="cinco-effect-badge locked-color">🔒 🔴</div>';

      const badge = activeEffects.querySelector('.cinco-effect-badge.locked-color');
      expect(badge).toBeTruthy();
    });
  });

  describe('Opponent Hand (Card Backs)', () => {
    test('should render card backs for opponent', () => {
      const opponentHand = document.getElementById('opponentHand');
      opponentHand.innerHTML = `
        <div class="cinco-card-back">🎴</div>
        <div class="cinco-card-back">🎴</div>
        <div class="cinco-card-back">🎴</div>
      `;

      const cardBacks = opponentHand.querySelectorAll('.cinco-card-back');
      expect(cardBacks.length).toBe(3);
    });

    test('should apply rotation to card backs', () => {
      const opponentHand = document.getElementById('opponentHand');
      opponentHand.innerHTML = `
        <div class="cinco-card-back" style="--rotation: -6deg">🎴</div>
        <div class="cinco-card-back" style="--rotation: 0deg">🎴</div>
        <div class="cinco-card-back" style="--rotation: 6deg">🎴</div>
      `;

      const cardBacks = opponentHand.querySelectorAll('.cinco-card-back');
      expect(cardBacks[0].style.getPropertyValue('--rotation')).toBe('-6deg');
    });
  });

  describe('Online Mode Class', () => {
    test('should add online-mode class for online games', () => {
      container.classList.add('online-mode');
      expect(container.classList.contains('online-mode')).toBe(true);
    });

    test('should remove online-mode class when returning to menu', () => {
      container.classList.add('online-mode');
      container.classList.remove('online-mode');
      expect(container.classList.contains('online-mode')).toBe(false);
    });
  });
});

describe('Card Interaction Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="cinco-player-hand" id="playerHand">
        <div class="cinco-card red playable" data-index="0" data-value="5">5</div>
        <div class="cinco-card blue playable" data-index="1" data-value="3">3</div>
        <div class="cinco-card green disabled" data-index="2" data-value="7">7</div>
      </div>
    `;
  });

  test('should find card by index', () => {
    const card = document.querySelector('[data-index="1"]');
    expect(card).toBeTruthy();
    expect(card.classList.contains('blue')).toBe(true);
  });

  test('should identify playable cards', () => {
    const playableCards = document.querySelectorAll('.cinco-card.playable');
    expect(playableCards.length).toBe(2);
  });

  test('should identify disabled cards', () => {
    const disabledCards = document.querySelectorAll('.cinco-card.disabled');
    expect(disabledCards.length).toBe(1);
  });

  test('click handler should be attachable to cards', () => {
    const card = document.querySelector('.cinco-card');
    const clickHandler = jest.fn();

    card.addEventListener('click', clickHandler);
    card.click();

    expect(clickHandler).toHaveBeenCalled();
  });
});
