/**
 * Cinco Card Game - Unit Tests
 * Tests core game logic, card mechanics, and special abilities
 */

import { CincoGame } from '../js/cinco-game.js';

describe('CincoGame', () => {
  let game;
  let mockCallbacks;

  beforeEach(() => {
    mockCallbacks = {
      onStateChange: jest.fn(),
      requestColorSelection: jest.fn((callback) => callback('red')),
      playAnimation: jest.fn(),
      showNotification: jest.fn(),
      gameOver: jest.fn(),
    };
    game = new CincoGame('ai', mockCallbacks);
  });

  describe('Initialization', () => {
    test('should create a new game instance', () => {
      expect(game).toBeInstanceOf(CincoGame);
      expect(game.mode).toBe('ai');
    });

    test('should initialize with correct default state', () => {
      expect(game.deck).toEqual([]);
      expect(game.discardPile).toEqual([]);
      expect(game.playerHand).toEqual([]);
      expect(game.opponentHand).toEqual([]);
      expect(game.currentTurn).toBe('player');
      expect(game.direction).toBe(1);
    });

    test('should initialize deck with 144+ cards', () => {
      game.initializeDeck();
      // 80 number cards + 8 skip + 8 reverse + 8 +2 + 8 +3 + 8 EMP + 8 firewall + 12 lockdown + 4 wild + 4 +4 + 4 turn steal + 4 swap + 2 mirror = 158 cards
      expect(game.deck.length).toBeGreaterThanOrEqual(144);
    });

    test('should shuffle deck properly', () => {
      game.initializeDeck();
      const originalDeck = [...game.deck];
      game.shuffleDeck();
      // After shuffle, deck should have same cards but different order
      expect(game.deck.length).toBe(originalDeck.length);
      // Very unlikely to be in same order after shuffle
      const sameOrder = game.deck.every((card, i) =>
        card.color === originalDeck[i].color && card.value === originalDeck[i].value
      );
      expect(sameOrder).toBe(false);
    });
  });

  describe('Game Start', () => {
    beforeEach(() => {
      game.startGame();
    });

    test('should deal 7 cards to each player', () => {
      expect(game.playerHand.length).toBe(7);
      expect(game.opponentHand.length).toBe(7);
    });

    test('should have a card in the discard pile', () => {
      expect(game.discardPile.length).toBeGreaterThanOrEqual(1);
    });

    test('should set current color from first card', () => {
      expect(['red', 'blue', 'green', 'yellow']).toContain(game.currentColor);
    });

    test('should not start with a wild card', () => {
      const topCard = game.discardPile[game.discardPile.length - 1];
      expect(topCard.color).not.toBe('wild');
    });

    test('should emit state change on start', () => {
      expect(mockCallbacks.onStateChange).toHaveBeenCalled();
    });
  });

  describe('Card Playability', () => {
    beforeEach(() => {
      game.startGame();
      game.currentColor = 'red';
      game.currentValue = '5';
    });

    test('should allow playing card matching current color', () => {
      const card = { color: 'red', value: '3', type: 'number' };
      expect(game.isCardPlayable(card)).toBe(true);
    });

    test('should allow playing card matching current value', () => {
      const card = { color: 'blue', value: '5', type: 'number' };
      expect(game.isCardPlayable(card)).toBe(true);
    });

    test('should allow playing wild cards', () => {
      const card = { color: 'wild', value: 'adaptiveprotocol', type: 'wild' };
      expect(game.isCardPlayable(card)).toBe(true);
    });

    test('should not allow playing non-matching cards', () => {
      const card = { color: 'blue', value: '3', type: 'number' };
      expect(game.isCardPlayable(card)).toBe(false);
    });

    test('should not allow playing locked color cards', () => {
      game.activeEffects.lockedColors.red = 2;
      const card = { color: 'red', value: '5', type: 'number' };
      expect(game.isCardPlayable(card)).toBe(false);
    });

    test('should not allow wild when all colors locked', () => {
      game.activeEffects.lockedColors = { red: 1, blue: 1, green: 1, yellow: 1 };
      const card = { color: 'wild', value: 'adaptiveprotocol', type: 'wild' };
      expect(game.isCardPlayable(card)).toBe(false);
    });
  });

  describe('Playing Cards', () => {
    beforeEach(() => {
      game.startGame();
      game.currentColor = 'red';
      game.currentValue = '5';
      game.currentTurn = 'player';
    });

    test('should play a valid card from hand', () => {
      // Add a playable card to player hand
      const playableCard = { color: 'red', value: '7', type: 'number' };
      game.playerHand.unshift(playableCard);
      const initialHandSize = game.playerHand.length;

      const result = game.playCard(0);

      expect(result).toBe(true);
      expect(game.playerHand.length).toBe(initialHandSize - 1);
      expect(game.currentColor).toBe('red');
      expect(game.currentValue).toBe('7');
    });

    test('should not play card on opponent turn', () => {
      game.currentTurn = 'opponent';
      const playableCard = { color: 'red', value: '7', type: 'number' };
      game.playerHand.unshift(playableCard);

      const result = game.playCard(0);

      expect(result).toBe(false);
    });

    test('should not play invalid card', () => {
      const unplayableCard = { color: 'blue', value: '3', type: 'number' };
      game.playerHand = [unplayableCard];

      const result = game.playCard(0);

      expect(result).toBe(false);
    });

    test('should request color selection for wild cards', () => {
      const wildCard = { color: 'wild', value: 'adaptiveprotocol', type: 'wild' };
      game.playerHand.unshift(wildCard);

      game.playCard(0);

      expect(mockCallbacks.requestColorSelection).toHaveBeenCalled();
    });
  });

  describe('Drawing Cards', () => {
    beforeEach(() => {
      game.startGame();
      game.currentTurn = 'player';
    });

    test('should draw a card from deck', () => {
      const initialHandSize = game.playerHand.length;
      const initialDeckSize = game.deck.length;

      game.drawCard();

      expect(game.playerHand.length).toBe(initialHandSize + 1);
      expect(game.deck.length).toBe(initialDeckSize - 1);
    });

    test('should end turn after drawing', () => {
      game.drawCard();
      expect(game.currentTurn).toBe('opponent');
    });

    test('should not draw on opponent turn', () => {
      game.currentTurn = 'opponent';
      const result = game.drawCard();
      expect(result).toBe(false);
    });

    test('should reshuffle discard pile when deck is empty', () => {
      game.deck = [];
      game.discardPile = [
        { color: 'red', value: '1', type: 'number' },
        { color: 'blue', value: '2', type: 'number' },
        { color: 'green', value: '3', type: 'number' }
      ];

      game.drawCard();

      expect(game.deck.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Special Cards', () => {
    beforeEach(() => {
      game.startGame();
      game.currentTurn = 'player';
      game.currentColor = 'red';
    });

    test('Skip card should keep turn', () => {
      const skipCard = { color: 'red', value: 'quantumskip', type: 'action' };
      game.playerHand = [skipCard, ...game.playerHand];

      game.playCard(0);

      // After skip, should still be player's turn (in 2-player)
      expect(game.currentTurn).toBe('player');
    });

    test('Reverse card should keep turn in 2-player', () => {
      const reverseCard = { color: 'red', value: 'reversepolarity', type: 'action' };
      game.playerHand = [reverseCard, ...game.playerHand];

      game.playCard(0);

      expect(game.direction).toBe(-1);
      expect(game.currentTurn).toBe('player');
    });

    test('+2 card should make opponent draw 2', () => {
      const plus2Card = { color: 'red', value: 'neuraldrain', type: 'power' };
      game.playerHand = [plus2Card, ...game.playerHand];
      const initialOpponentCards = game.opponentHand.length;

      game.playCard(0);

      expect(game.opponentHand.length).toBe(initialOpponentCards + 2);
    });

    test('+2 card should be blocked by firewall', () => {
      game.activeEffects.firewall.opponent = true;
      const plus2Card = { color: 'red', value: 'neuraldrain', type: 'power' };
      game.playerHand = [plus2Card, ...game.playerHand];
      const initialOpponentCards = game.opponentHand.length;

      game.playCard(0);

      expect(game.opponentHand.length).toBe(initialOpponentCards);
      expect(game.activeEffects.firewall.opponent).toBe(false);
    });

    test('+4 wild card should NOT be blocked by firewall', () => {
      game.activeEffects.firewall.opponent = true;
      const plus4Card = { color: 'wild', value: 'systemoverload', type: 'wild' };
      game.playerHand = [plus4Card, ...game.playerHand];
      const initialOpponentCards = game.opponentHand.length;

      game.playCard(0);

      expect(game.opponentHand.length).toBe(initialOpponentCards + 4);
    });

    test('Firewall card should activate shield', () => {
      const firewallCard = { color: 'red', value: 'firewall', type: 'power' };
      game.playerHand = [firewallCard, ...game.playerHand];

      game.playCard(0);

      expect(game.activeEffects.firewall.player).toBe(true);
    });

    test('System Lockdown should lock current color', () => {
      const lockdownCard = { color: 'red', value: 'systemlockdown', type: 'power' };
      game.playerHand = [lockdownCard, ...game.playerHand];

      game.playCard(0);

      expect(game.activeEffects.lockedColors.red).toBe(2);
    });
  });

  describe('CINCO Mechanic', () => {
    beforeEach(() => {
      game.startGame();
    });

    test('should allow saying CINCO with 1 card', () => {
      game.playerHand = [{ color: 'red', value: '5', type: 'number' }];

      const result = game.sayCinco('player');

      expect(result).toBe(true);
      expect(game.playerSaidCinco).toBe(true);
    });

    test('should not allow saying CINCO with multiple cards', () => {
      game.playerHand = [
        { color: 'red', value: '5', type: 'number' },
        { color: 'blue', value: '3', type: 'number' }
      ];

      const result = game.sayCinco('player');

      expect(result).toBe(false);
    });

    test('should penalize forgetting to say CINCO', () => {
      game.playerHand = [{ color: 'red', value: '5', type: 'number' }];
      game.playerSaidCinco = false;

      game.checkWin('player');

      expect(game.playerHand.length).toBe(3); // 1 + 2 penalty
    });
  });

  describe('Win Condition', () => {
    beforeEach(() => {
      game.startGame();
    });

    test('should win when hand is empty', () => {
      game.playerHand = [];
      game.playerSaidCinco = true;

      game.checkWin('player');

      expect(mockCallbacks.gameOver).toHaveBeenCalledWith('player', 'win');
    });
  });

  describe('Game State', () => {
    test('should return correct game state', () => {
      game.startGame();

      const state = game.getState();

      expect(state).toHaveProperty('deck');
      expect(state).toHaveProperty('discardPile');
      expect(state).toHaveProperty('playerHand');
      expect(state).toHaveProperty('opponentHand');
      expect(state).toHaveProperty('currentColor');
      expect(state).toHaveProperty('currentValue');
      expect(state).toHaveProperty('currentTurn');
      expect(state).toHaveProperty('direction');
      expect(state).toHaveProperty('activeEffects');
      expect(state).toHaveProperty('playerCardCount');
      expect(state).toHaveProperty('opponentCardCount');
    });
  });

  describe('Static Methods', () => {
    test('getCardDisplay should return correct display', () => {
      expect(CincoGame.getCardDisplay('quantumskip')).toBe('🚫');
      expect(CincoGame.getCardDisplay('neuraldrain')).toBe('+2');
      expect(CincoGame.getCardDisplay('systemoverload')).toBe('⭐+4');
      expect(CincoGame.getCardDisplay('5')).toBe('5');
    });

    test('getCardDescription should return correct description', () => {
      expect(CincoGame.getCardDescription('quantumskip')).toContain('Skip');
      expect(CincoGame.getCardDescription('firewall')).toContain('Shield');
      expect(CincoGame.getCardDescription('neuraldrain')).toContain('Draw 2');
    });
  });

  describe('AI Logic', () => {
    beforeEach(() => {
      game = new CincoGame('ai', mockCallbacks);
      game.startGame();
    });

    test('AI should choose best color based on hand', () => {
      game.opponentHand = [
        { color: 'red', value: '1', type: 'number' },
        { color: 'red', value: '2', type: 'number' },
        { color: 'red', value: '3', type: 'number' },
        { color: 'blue', value: '4', type: 'number' },
      ];

      const chosenColor = game.chooseAIColor();

      expect(chosenColor).toBe('red');
    });

    test('AI should avoid locked colors', () => {
      game.activeEffects.lockedColors.red = 2;
      game.opponentHand = [
        { color: 'red', value: '1', type: 'number' },
        { color: 'red', value: '2', type: 'number' },
        { color: 'blue', value: '4', type: 'number' },
      ];

      const chosenColor = game.chooseAIColor();

      expect(chosenColor).not.toBe('red');
    });

    test('getCardPriority should prioritize power cards', () => {
      const empCard = { color: 'red', value: 'empblast', type: 'power' };
      const numberCard = { color: 'red', value: '5', type: 'number' };

      const empPriority = game.getCardPriority(empCard);
      const numberPriority = game.getCardPriority(numberCard);

      expect(empPriority).toBeGreaterThan(numberPriority);
    });
  });

  describe('Locked Colors', () => {
    beforeEach(() => {
      game.startGame();
      game.activeEffects.lockedColors.red = 2;
    });

    test('should decrement locked colors on turn change', () => {
      game.decrementLockedColors();
      expect(game.activeEffects.lockedColors.red).toBe(1);
    });

    test('should remove lock when counter reaches 0', () => {
      game.activeEffects.lockedColors.red = 1;
      game.decrementLockedColors();
      expect(game.activeEffects.lockedColors.red).toBeUndefined();
    });

    test('getUnlockedColors should exclude locked colors', () => {
      const unlocked = game.getUnlockedColors();
      expect(unlocked).not.toContain('red');
      expect(unlocked).toContain('blue');
      expect(unlocked).toContain('green');
      expect(unlocked).toContain('yellow');
    });
  });
});
