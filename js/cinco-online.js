/**
 * Cinco Online Multiplayer Integration
 * Integrates with existing Firebase Realtime Database and multiplayer.js
 */

import { database } from './firebase-config.js';
import { ref, onValue, update, set, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

export class CincoOnline {
    constructor(session, playerRole, callbacks = {}) {
        this.session = session; // MultiplayerSession instance
        this.playerRole = playerRole; // 'player1' or 'player2'
        this.callbacks = callbacks;
        this.gameStateRef = null;
        this.listeners = [];
        this.isHost = playerRole === 'player1';
    }

    /**
     * Initialize online game
     */
    async initializeGame(initialState) {
        const gamePath = `sessions/${this.session.sessionId}/gameState`;
        this.gameStateRef = ref(database, gamePath);

        if (this.isHost) {
            // Host initializes the game state
            await set(this.gameStateRef, {
                deck: this.encryptDeck(initialState.deck),
                discardPile: initialState.discardPile,
                currentColor: initialState.currentColor,
                currentValue: initialState.currentValue,
                currentTurn: initialState.currentTurn,
                direction: initialState.direction,
                activeEffects: initialState.activeEffects,
                players: {
                    player1: {
                        cardCount: initialState.playerHand.length,
                        saidCinco: false
                    },
                    player2: {
                        cardCount: initialState.opponentHand.length,
                        saidCinco: false
                    }
                },
                lastPowerUp: null,
                timestamp: Date.now()
            });

            // Store BOTH player hands in private storage
            const player1HandRef = ref(database, `sessions/${this.session.sessionId}/privateHands/player1`);
            const player2HandRef = ref(database, `sessions/${this.session.sessionId}/privateHands/player2`);
            await set(player1HandRef, initialState.playerHand);
            await set(player2HandRef, initialState.opponentHand);

            // Store the deck so both players can draw from it
            const deckRef = ref(database, `sessions/${this.session.sessionId}/sharedDeck`);
            await set(deckRef, initialState.deck);
        }

        // Listen for game state changes
        this.setupListeners();
    }

    /**
     * Join game as player 2 - fetch hand and setup listeners
     * Uses a listener-based approach to reliably wait for host data
     */
    async joinGame() {
        const gamePath = `sessions/${this.session.sessionId}/gameState`;
        this.gameStateRef = ref(database, gamePath);

        // Wait for all required data using listeners (more reliable than polling)
        const [hand, initialState, deck] = await Promise.all([
            this.waitForPlayerHand(15000),   // 15s timeout
            this.waitForGameState(15000),    // 15s timeout
            this.waitForSharedDeck(15000)    // 15s timeout
        ]);

        if (hand && hand.length > 0) {
            this.callbacks.onHandUpdate?.(hand);
        }

        // Setup persistent hand listener so future updates are received
        this.setupHandListener();

        // Setup game state listeners
        this.setupListeners();

        return { hand, gameState: initialState, deck };
    }

    /**
     * Wait for player hand data using a Firebase listener with timeout
     */
    waitForPlayerHand(timeoutMs = 15000) {
        return new Promise((resolve) => {
            const myRole = this.playerRole;
            const handRef = ref(database, `sessions/${this.session.sessionId}/privateHands/${myRole}`);
            let resolved = false;

            const listener = onValue(handRef, (snapshot) => {
                const hand = snapshot.val();
                if (!resolved && hand && Array.isArray(hand) && hand.length > 0) {
                    resolved = true;
                    off(handRef, 'value', listener);
                    resolve(hand);
                }
            });

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    off(handRef, 'value', listener);
                    console.warn('Timed out waiting for player hand');
                    resolve([]);
                }
            }, timeoutMs);
        });
    }

    /**
     * Wait for game state data using a Firebase listener with timeout
     */
    waitForGameState(timeoutMs = 15000) {
        return new Promise((resolve) => {
            const stateRef = ref(database, `sessions/${this.session.sessionId}/gameState`);
            let resolved = false;

            const listener = onValue(stateRef, (snapshot) => {
                const state = snapshot.val();
                if (!resolved && state && state.currentColor) {
                    resolved = true;
                    off(stateRef, 'value', listener);
                    resolve(state);
                }
            });

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    off(stateRef, 'value', listener);
                    console.warn('Timed out waiting for game state');
                    resolve(null);
                }
            }, timeoutMs);
        });
    }

    /**
     * Wait for shared deck data using a Firebase listener with timeout
     */
    waitForSharedDeck(timeoutMs = 15000) {
        return new Promise((resolve) => {
            const deckRef = ref(database, `sessions/${this.session.sessionId}/sharedDeck`);
            let resolved = false;

            const listener = onValue(deckRef, (snapshot) => {
                const deck = snapshot.val();
                if (!resolved && deck && Array.isArray(deck) && deck.length > 0) {
                    resolved = true;
                    off(deckRef, 'value', listener);
                    resolve(deck);
                }
            });

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    off(deckRef, 'value', listener);
                    console.warn('Timed out waiting for shared deck');
                    resolve([]);
                }
            }, timeoutMs);
        });
    }

    /**
     * Fetch game state once
     */
    async getGameState() {
        return new Promise((resolve) => {
            onValue(this.gameStateRef, (snapshot) => {
                resolve(snapshot.val() || null);
            }, { onlyOnce: true });
        });
    }

    /**
     * Setup a persistent listener on the player's hand
     * so if it arrives after initial fetch, we still get it
     */
    setupHandListener() {
        const myRole = this.playerRole;
        const handRef = ref(database, `sessions/${this.session.sessionId}/privateHands/${myRole}`);
        const handListener = onValue(handRef, (snapshot) => {
            const hand = snapshot.val();
            if (hand && hand.length > 0) {
                this.callbacks.onHandUpdate?.(hand);
            }
        });
        this.listeners.push({ ref: handRef, listener: handListener });
    }

    /**
     * Get player's hand with retries (waits for host to write data)
     */
    async getPlayerHandWithRetry(maxRetries = 5, delayMs = 800) {
        for (let i = 0; i < maxRetries; i++) {
            const hand = await this.getPlayerHand();
            if (hand && hand.length > 0) {
                return hand;
            }
            // Wait before retrying
            await new Promise(r => setTimeout(r, delayMs));
        }
        return [];
    }

    /**
     * Setup Firebase listeners
     */
    setupListeners() {
        // Listen for game state changes
        const stateListener = onValue(this.gameStateRef, (snapshot) => {
            const state = snapshot.val();
            if (state) {
                this.handleStateUpdate(state);
            }
        });

        this.listeners.push({ ref: this.gameStateRef, listener: stateListener });

        // Listen for shared deck changes (so both players stay in sync)
        const deckRef = ref(database, `sessions/${this.session.sessionId}/sharedDeck`);
        const deckListener = onValue(deckRef, (snapshot) => {
            const deck = snapshot.val();
            if (deck) {
                this.callbacks.onDeckUpdate?.(deck);
            }
        });
        this.listeners.push({ ref: deckRef, listener: deckListener });

        // Listen for opponent card plays
        const opponentRole = this.playerRole === 'player1' ? 'player2' : 'player1';
        const opponentPlayRef = ref(database, `sessions/${this.session.sessionId}/gameState/players/${opponentRole}`);
        const opponentListener = onValue(opponentPlayRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.handleOpponentUpdate(data);
            }
        });

        this.listeners.push({ ref: opponentPlayRef, listener: opponentListener });
    }

    /**
     * Handle state update from Firebase
     */
    handleStateUpdate(state) {
        const myRole = this.playerRole;
        const opponentRole = this.playerRole === 'player1' ? 'player2' : 'player1';

        const gameState = {
            discardPile: state.discardPile || [],
            currentColor: state.currentColor,
            currentValue: state.currentValue,
            currentTurn: state.currentTurn,
            direction: state.direction,
            activeEffects: state.activeEffects || {
                firewall: { player: false, opponent: false },
                colorLock: null
            },
            playerCardCount: state.players?.[myRole]?.cardCount || 0,
            opponentCardCount: state.players?.[opponentRole]?.cardCount || 0,
            playerSaidCinco: state.players?.[myRole]?.saidCinco || false,
            opponentSaidCinco: state.players?.[opponentRole]?.saidCinco || false,
            lastPowerUp: state.lastPowerUp
        };

        this.callbacks.onStateUpdate?.(gameState);
    }

    /**
     * Handle opponent update
     */
    handleOpponentUpdate(data) {
        if (data.lastAction) {
            this.callbacks.onOpponentAction?.(data.lastAction);
        }
    }

    /**
     * Play a card (send to Firebase)
     */
    async playCard(card, newState) {
        const myRole = this.playerRole;
        const opponentRole = myRole === 'player1' ? 'player2' : 'player1';

        const updates = {
            [`sessions/${this.session.sessionId}/gameState/discardPile`]: newState.discardPile,
            [`sessions/${this.session.sessionId}/gameState/currentColor`]: newState.currentColor,
            [`sessions/${this.session.sessionId}/gameState/currentValue`]: newState.currentValue,
            [`sessions/${this.session.sessionId}/gameState/currentTurn`]: newState.currentTurn,
            [`sessions/${this.session.sessionId}/gameState/direction`]: newState.direction,
            [`sessions/${this.session.sessionId}/gameState/activeEffects`]: newState.activeEffects,
            [`sessions/${this.session.sessionId}/gameState/players/${myRole}/cardCount`]: newState.playerCardCount,
            [`sessions/${this.session.sessionId}/gameState/players/${myRole}/saidCinco`]: newState.playerSaidCinco,
            [`sessions/${this.session.sessionId}/gameState/players/${opponentRole}/cardCount`]: newState.opponentCardCount,
            [`sessions/${this.session.sessionId}/gameState/players/${myRole}/lastAction`]: {
                type: 'play_card',
                card: card,
                timestamp: Date.now()
            },
            [`sessions/${this.session.sessionId}/gameState/lastPowerUp`]: newState.lastPowerUp,
            [`sessions/${this.session.sessionId}/gameState/timestamp`]: Date.now()
        };

        await update(ref(database), updates);

        // Update player's hand separately
        await this.updatePlayerHand(newState.playerHand);
    }

    /**
     * Draw card (send to Firebase)
     */
    async drawCard(newState) {
        const myRole = this.playerRole;

        const updates = {
            [`sessions/${this.session.sessionId}/gameState/currentTurn`]: newState.currentTurn,
            [`sessions/${this.session.sessionId}/gameState/players/${myRole}/cardCount`]: newState.playerCardCount,
            [`sessions/${this.session.sessionId}/gameState/players/${myRole}/lastAction`]: {
                type: 'draw_card',
                timestamp: Date.now()
            },
            [`sessions/${this.session.sessionId}/gameState/timestamp`]: Date.now()
        };

        await update(ref(database), updates);
        await this.updatePlayerHand(newState.playerHand);
    }

    /**
     * Say Cinco (send to Firebase)
     */
    async sayCinco() {
        const myRole = this.playerRole;

        const updates = {
            [`sessions/${this.session.sessionId}/gameState/players/${myRole}/saidCinco`]: true,
            [`sessions/${this.session.sessionId}/gameState/players/${myRole}/lastAction`]: {
                type: 'say_cinco',
                timestamp: Date.now()
            },
            [`sessions/${this.session.sessionId}/gameState/timestamp`]: Date.now()
        };

        await update(ref(database), updates);
    }

    /**
     * Update player's hand (private storage)
     */
    async updatePlayerHand(hand) {
        const myRole = this.playerRole;
        const handRef = ref(database, `sessions/${this.session.sessionId}/privateHands/${myRole}`);
        await set(handRef, hand);
    }

    /**
     * Update opponent's hand (when card effects modify it)
     */
    async updateOpponentHand(hand) {
        const opponentRole = this.playerRole === 'player1' ? 'player2' : 'player1';
        const handRef = ref(database, `sessions/${this.session.sessionId}/privateHands/${opponentRole}`);
        await set(handRef, hand);
    }

    /**
     * Get player's hand from Firebase
     */
    async getPlayerHand() {
        const myRole = this.playerRole;
        const handRef = ref(database, `sessions/${this.session.sessionId}/privateHands/${myRole}`);

        return new Promise((resolve) => {
            onValue(handRef, (snapshot) => {
                resolve(snapshot.val() || []);
            }, { onlyOnce: true });
        });
    }

    /**
     * Get shared deck from Firebase
     */
    async getSharedDeck() {
        const deckRef = ref(database, `sessions/${this.session.sessionId}/sharedDeck`);
        return new Promise((resolve) => {
            onValue(deckRef, (snapshot) => {
                resolve(snapshot.val() || []);
            }, { onlyOnce: true });
        });
    }

    /**
     * Update shared deck in Firebase (after drawing)
     */
    async updateSharedDeck(deck) {
        const deckRef = ref(database, `sessions/${this.session.sessionId}/sharedDeck`);
        await set(deckRef, deck);
    }

    /**
     * Handle game over
     */
    async gameOver(winner, result) {
        const updates = {
            [`sessions/${this.session.sessionId}/gameState/gameOver`]: true,
            [`sessions/${this.session.sessionId}/gameState/winner`]: winner,
            [`sessions/${this.session.sessionId}/gameState/result`]: result,
            [`sessions/${this.session.sessionId}/gameState/timestamp`]: Date.now()
        };

        await update(ref(database), updates);
        this.callbacks.onGameOver?.(winner, result);
    }

    /**
     * Encrypt deck (basic obfuscation for cheating prevention)
     */
    encryptDeck(deck) {
        // Simple hash - in production, use better encryption
        return {
            hash: this.hashString(JSON.stringify(deck)),
            count: deck.length,
            timestamp: Date.now()
        };
    }

    /**
     * Simple string hash
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    /**
     * Clean up listeners
     */
    cleanup() {
        this.listeners.forEach(({ ref, listener }) => {
            off(ref, 'value', listener);
        });
        this.listeners = [];
    }

    /**
     * Handle reconnection
     */
    async reconnect() {
        // Re-setup listeners
        this.cleanup();
        this.setupListeners();

        // Fetch current game state
        const snapshot = await new Promise((resolve) => {
            onValue(this.gameStateRef, resolve, { onlyOnce: true });
        });

        const state = snapshot.val();
        if (state) {
            this.handleStateUpdate(state);
        }

        // Fetch player's hand
        const hand = await this.getPlayerHand();
        this.callbacks.onHandUpdate?.(hand);
    }
}

export default CincoOnline;
