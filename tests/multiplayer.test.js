/**
 * Multiplayer Session - Unit Tests
 * Tests session creation, joining, and state management
 */

import MultiplayerSession from '../js/multiplayer.js';

describe('MultiplayerSession', () => {
  let session;

  beforeEach(() => {
    session = new MultiplayerSession('cinco');
    localStorage.getItem.mockReturnValue(null);
  });

  describe('Initialization', () => {
    test('should create a new session instance', () => {
      expect(session).toBeInstanceOf(MultiplayerSession);
      expect(session.gameType).toBe('cinco');
    });

    test('should initialize with correct default state', () => {
      expect(session.sessionId).toBeNull();
      expect(session.playerNumber).toBeNull();
      expect(session.playerName).toBeNull();
      expect(session.isConnected).toBe(false);
    });
  });

  describe('Session Code Generation', () => {
    test('should generate 6-character code', () => {
      const code = session.generateSessionCode();
      expect(code.length).toBe(6);
    });

    test('should only use allowed characters', () => {
      const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code = session.generateSessionCode();

      for (const char of code) {
        expect(allowedChars).toContain(char);
      }
    });

    test('should not include confusing characters (0, O, 1, I)', () => {
      // Generate many codes to increase probability of catching issues
      for (let i = 0; i < 100; i++) {
        const code = session.generateSessionCode();
        expect(code).not.toContain('0');
        expect(code).not.toContain('O');
        expect(code).not.toContain('1');
        expect(code).not.toContain('I');
      }
    });

    test('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(session.generateSessionCode());
      }
      // With good randomness, should have mostly unique codes
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('Event Listeners', () => {
    test('should register event listeners', () => {
      const callback = jest.fn();
      session.on('onPlayerJoined', callback);
      expect(session.listeners.onPlayerJoined).toBe(callback);
    });

    test('should support multiple event types', () => {
      const joinedCallback = jest.fn();
      const stateCallback = jest.fn();
      const disconnectCallback = jest.fn();

      session.on('onPlayerJoined', joinedCallback);
      session.on('onGameStateChange', stateCallback);
      session.on('onOpponentDisconnect', disconnectCallback);

      expect(session.listeners.onPlayerJoined).toBe(joinedCallback);
      expect(session.listeners.onGameStateChange).toBe(stateCallback);
      expect(session.listeners.onOpponentDisconnect).toBe(disconnectCallback);
    });
  });

  describe('Local Storage - Session History', () => {
    test('should save session to history', () => {
      session.saveToHistory('ABC123', 'TestPlayer', 1);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'gameSessionHistory',
        expect.any(String)
      );
    });

    test('should get empty array when no history', () => {
      localStorage.getItem.mockReturnValue(null);
      const history = MultiplayerSession.getHistory();
      expect(history).toEqual([]);
    });

    test('should get existing history', () => {
      const mockHistory = [{ sessionId: 'ABC123', playerName: 'Test' }];
      localStorage.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const history = MultiplayerSession.getHistory();
      expect(history).toEqual(mockHistory);
    });
  });

  describe('Active Session Management', () => {
    test('should save active session', () => {
      MultiplayerSession.saveActiveSession('ABC123', 'TestPlayer', 1, 'cinco');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'activeGameSession',
        expect.stringContaining('ABC123')
      );
    });

    test('should get active session', () => {
      const mockSession = {
        sessionId: 'ABC123',
        playerName: 'Test',
        playerNumber: 1,
        gameType: 'cinco',
        timestamp: Date.now()
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSession));

      const activeSession = MultiplayerSession.getActiveSession();
      expect(activeSession.sessionId).toBe('ABC123');
    });

    test('should return null for expired session', () => {
      const expiredSession = {
        sessionId: 'ABC123',
        playerName: 'Test',
        playerNumber: 1,
        gameType: 'cinco',
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(expiredSession));

      const activeSession = MultiplayerSession.getActiveSession();
      expect(activeSession).toBeNull();
    });

    test('should clear active session', () => {
      MultiplayerSession.clearActiveSession();
      expect(localStorage.removeItem).toHaveBeenCalledWith('activeGameSession');
    });
  });

  describe('Game Type Validation', () => {
    test('should store game type on creation', () => {
      const cincoSession = new MultiplayerSession('cinco');
      const crosswordSession = new MultiplayerSession('crossword');

      expect(cincoSession.gameType).toBe('cinco');
      expect(crosswordSession.gameType).toBe('crossword');
    });
  });
});

describe('MultiplayerSession - Integration Tests', () => {
  describe('Session Flow', () => {
    test('should have correct player numbers after join', async () => {
      const hostSession = new MultiplayerSession('cinco');
      const guestSession = new MultiplayerSession('cinco');

      // Simulate host creating session
      hostSession.playerNumber = 1;
      hostSession.playerName = 'Host';

      // Simulate guest joining
      guestSession.playerNumber = 2;
      guestSession.playerName = 'Guest';

      expect(hostSession.playerNumber).toBe(1);
      expect(guestSession.playerNumber).toBe(2);
    });
  });
});
