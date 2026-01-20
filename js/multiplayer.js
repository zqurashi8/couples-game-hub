// Multiplayer Session Management
import { database, ref, set, get, onValue, update, remove, serverTimestamp } from './firebase-config.js';

class MultiplayerSession {
    constructor(gameType) {
        this.gameType = gameType;
        this.sessionId = null;
        this.playerNumber = null;
        this.playerName = null;
        this.opponentName = null;
        this.sessionRef = null;
        this.listeners = {};
        this.isConnected = false;
    }

    // Generate a random 6-character session code
    generateSessionCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, 1, I
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Create a new game session
    async createSession(playerName) {
        this.sessionId = this.generateSessionCode();
        this.playerNumber = 1;
        this.playerName = playerName;
        this.sessionRef = ref(database, `sessions/${this.sessionId}`);

        const sessionData = {
            gameType: this.gameType,
            createdAt: serverTimestamp(),
            expiresAt: Date.now() + (48 * 60 * 60 * 1000), // 48 hours
            status: 'waiting',
            players: {
                player1: {
                    name: playerName,
                    connected: true,
                    joinedAt: serverTimestamp()
                }
            },
            gameState: {}
        };

        try {
            await set(this.sessionRef, sessionData);
            this.isConnected = true;
            this.startListening();
            this.saveToHistory(this.sessionId, playerName, 1);
            this.saveActiveSession(this.sessionId, playerName, 1);
            return { success: true, sessionId: this.sessionId };
        } catch (error) {
            console.error('Error creating session:', error);
            return { success: false, error: error.message };
        }
    }

    // Join an existing session
    async joinSession(sessionId, playerName) {
        this.sessionId = sessionId.toUpperCase();
        this.playerName = playerName;
        this.sessionRef = ref(database, `sessions/${this.sessionId}`);

        try {
            const snapshot = await get(this.sessionRef);

            if (!snapshot.exists()) {
                return { success: false, error: 'Session not found. Please check the code.' };
            }

            const sessionData = snapshot.val();

            // Check if session has expired
            if (sessionData.expiresAt < Date.now()) {
                return { success: false, error: 'This session has expired.' };
            }

            // Check if game type matches
            if (sessionData.gameType !== this.gameType) {
                return { success: false, error: `This session is for ${sessionData.gameType}, not ${this.gameType}.` };
            }

            // Check if player is rejoining (reconnecting)
            if (sessionData.players.player2) {
                // If player2 exists, check if it's the same player reconnecting
                if (sessionData.players.player2.name === playerName) {
                    console.log('Player 2 reconnecting to session...');
                    this.playerNumber = 2;
                    this.opponentName = sessionData.players.player1.name;

                    // Update connection status
                    await update(this.sessionRef, {
                        'players/player2/connected': true,
                        'players/player2/lastReconnectAt': serverTimestamp()
                    });

                    this.isConnected = true;
                    this.startListening();
                    this.saveActiveSession(this.sessionId, playerName, 2);
                    return { success: true, sessionId: this.sessionId, opponentName: this.opponentName, reconnected: true };
                } else {
                    // Different player trying to join - session is full
                    return { success: false, error: 'This session is already full.' };
                }
            }

            // Join as player 2 (first time)
            this.playerNumber = 2;
            this.opponentName = sessionData.players.player1.name;

            await update(this.sessionRef, {
                'players/player2': {
                    name: playerName,
                    connected: true,
                    joinedAt: serverTimestamp()
                },
                status: 'in-progress'
            });

            this.isConnected = true;
            this.startListening();
            this.saveToHistory(this.sessionId, playerName, 2);
            this.saveActiveSession(this.sessionId, playerName, 2);
            return { success: true, sessionId: this.sessionId, opponentName: this.opponentName };
        } catch (error) {
            console.error('Error joining session:', error);
            return { success: false, error: error.message };
        }
    }

    // Start listening for changes
    startListening() {
        // Listen for player 2 joining
        const player2Ref = ref(database, `sessions/${this.sessionId}/players/player2`);
        onValue(player2Ref, (snapshot) => {
            if (snapshot.exists() && this.playerNumber === 1) {
                const player2Data = snapshot.val();
                this.opponentName = player2Data.name;
                if (this.listeners.onPlayerJoined) {
                    this.listeners.onPlayerJoined(player2Data.name);
                }
            }
        });

        // Listen for game state changes
        const gameStateRef = ref(database, `sessions/${this.sessionId}/gameState`);
        onValue(gameStateRef, (snapshot) => {
            if (snapshot.exists() && this.listeners.onGameStateChange) {
                this.listeners.onGameStateChange(snapshot.val());
            }
        });

        // Listen for opponent disconnect
        const opponentNum = this.playerNumber === 1 ? 2 : 1;
        const opponentRef = ref(database, `sessions/${this.sessionId}/players/player${opponentNum}/connected`);
        onValue(opponentRef, (snapshot) => {
            if (snapshot.exists() && !snapshot.val() && this.listeners.onOpponentDisconnect) {
                this.listeners.onOpponentDisconnect();
            }
        });
    }

    // Update game state
    async updateGameState(stateUpdates) {
        if (!this.isConnected) return;

        try {
            const gameStateRef = ref(database, `sessions/${this.sessionId}/gameState`);
            await update(gameStateRef, stateUpdates);
        } catch (error) {
            console.error('Error updating game state:', error);
        }
    }

    // Get current game state
    async getGameState() {
        try {
            const gameStateRef = ref(database, `sessions/${this.sessionId}/gameState`);
            const snapshot = await get(gameStateRef);
            return snapshot.exists() ? snapshot.val() : {};
        } catch (error) {
            console.error('Error getting game state:', error);
            return {};
        }
    }

    // Register event listeners
    on(event, callback) {
        this.listeners[event] = callback;
    }

    // Disconnect from session
    async disconnect() {
        if (!this.isConnected) return;

        try {
            await update(this.sessionRef, {
                [`players/player${this.playerNumber}/connected`]: false
            });
            this.isConnected = false;
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    }

    // End session (clean up)
    async endSession() {
        if (!this.sessionId) return;

        try {
            await update(this.sessionRef, {
                status: 'completed',
                completedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error ending session:', error);
        }
    }

    // Save session to local storage history
    saveToHistory(sessionId, playerName, playerNumber) {
        const history = JSON.parse(localStorage.getItem('gameSessionHistory') || '[]');

        history.unshift({
            sessionId,
            gameType: this.gameType,
            playerName,
            playerNumber,
            timestamp: Date.now()
        });

        // Keep only last 10 sessions
        if (history.length > 10) {
            history.splice(10);
        }

        localStorage.setItem('gameSessionHistory', JSON.stringify(history));
    }

    // Get session history from local storage
    static getHistory() {
        return JSON.parse(localStorage.getItem('gameSessionHistory') || '[]');
    }

    // Save active session to local storage
    static saveActiveSession(sessionId, playerName, playerNumber, gameType) {
        const activeSession = {
            sessionId,
            playerName,
            playerNumber,
            gameType,
            timestamp: Date.now()
        };
        localStorage.setItem('activeGameSession', JSON.stringify(activeSession));
    }

    // Get active session from local storage
    static getActiveSession() {
        const sessionData = localStorage.getItem('activeGameSession');
        if (!sessionData) return null;

        const session = JSON.parse(sessionData);
        // Check if session is less than 24 hours old
        const age = Date.now() - session.timestamp;
        if (age > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('activeGameSession');
            return null;
        }
        return session;
    }

    // Clear active session from local storage
    static clearActiveSession() {
        localStorage.removeItem('activeGameSession');
    }

    // Rejoin a previous session
    async rejoinSession(sessionId, playerName, playerNumber) {
        this.sessionId = sessionId;
        this.playerNumber = playerNumber;
        this.playerName = playerName;
        this.sessionRef = ref(database, `sessions/${this.sessionId}`);

        try {
            const snapshot = await get(this.sessionRef);

            if (!snapshot.exists()) {
                return { success: false, error: 'Session no longer exists.' };
            }

            const sessionData = snapshot.val();

            // Update connection status
            await update(this.sessionRef, {
                [`players/player${this.playerNumber}/connected`]: true,
                [`players/player${this.playerNumber}/lastReconnectAt`]: serverTimestamp()
            });

            this.isConnected = true;
            this.startListening();

            // Get opponent name
            const opponentNum = playerNumber === 1 ? 2 : 1;
            if (sessionData.players[`player${opponentNum}`]) {
                this.opponentName = sessionData.players[`player${opponentNum}`].name;
            }

            this.saveActiveSession(sessionId, playerName, playerNumber);
            return { success: true, sessionId: this.sessionId, gameState: sessionData.gameState, reconnected: true };
        } catch (error) {
            console.error('Error rejoining session:', error);
            return { success: false, error: error.message };
        }
    }

    // Save active session to localStorage (for reconnection)
    saveActiveSession(sessionId, playerName, playerNumber) {
        const activeSession = {
            sessionId,
            gameType: this.gameType,
            playerName,
            playerNumber,
            timestamp: Date.now()
        };
        localStorage.setItem('activeGameSession', JSON.stringify(activeSession));
    }

    // Get active session from localStorage
    static getActiveSession() {
        const activeSession = localStorage.getItem('activeGameSession');
        return activeSession ? JSON.parse(activeSession) : null;
    }

    // Clear active session from localStorage
    static clearActiveSession() {
        localStorage.removeItem('activeGameSession');
    }

    // Check if there's an active session and auto-reconnect
    static async autoReconnect(gameType) {
        const activeSession = MultiplayerSession.getActiveSession();

        if (!activeSession) {
            return null;
        }

        // Check if session is for the same game type
        if (activeSession.gameType !== gameType) {
            return null;
        }

        // Check if session is still recent (within last 24 hours)
        const hoursSinceLastActive = (Date.now() - activeSession.timestamp) / (1000 * 60 * 60);
        if (hoursSinceLastActive > 24) {
            MultiplayerSession.clearActiveSession();
            return null;
        }

        console.log('Found active session, attempting to reconnect...');

        // Try to reconnect
        const session = new MultiplayerSession(gameType);
        const result = await session.rejoinSession(
            activeSession.sessionId,
            activeSession.playerName,
            activeSession.playerNumber
        );

        if (result.success) {
            console.log('Successfully reconnected to session:', activeSession.sessionId);
            return { session, result };
        } else {
            console.log('Could not reconnect to session:', result.error);
            MultiplayerSession.clearActiveSession();
            return null;
        }
    }
}

// Export the class (both named and default for compatibility)
export { MultiplayerSession };
export default MultiplayerSession;
