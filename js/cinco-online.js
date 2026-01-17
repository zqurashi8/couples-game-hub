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
                        saidCinco: false,
                        hand: this.isHost ? initialState.playerHand : []
                    },
                    player2: {
                        cardCount: initialState.opponentHand.length,
                        saidCinco: false,
                        hand: !this.isHost ? initialState.opponentHand : []
                    }
                },
                lastPowerUp: null,
                timestamp: Date.now()
            });

            // Store player hands separately (private)
            await this.updatePlayerHand(initialState.playerHand);
        }

        // Listen for game state changes
        this.setupListeners();
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
                shield: { player1: false, player2: false },
                colorLock: { color: null, roundsLeft: 0 }
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

        const updates = {
            [`sessions/${this.session.sessionId}/gameState/discardPile`]: newState.discardPile,
            [`sessions/${this.session.sessionId}/gameState/currentColor`]: newState.currentColor,
            [`sessions/${this.session.sessionId}/gameState/currentValue`]: newState.currentValue,
            [`sessions/${this.session.sessionId}/gameState/currentTurn`]: newState.currentTurn,
            [`sessions/${this.session.sessionId}/gameState/direction`]: newState.direction,
            [`sessions/${this.session.sessionId}/gameState/activeEffects`]: newState.activeEffects,
            [`sessions/${this.session.sessionId}/gameState/players/${myRole}/cardCount`]: newState.playerCardCount,
            [`sessions/${this.session.sessionId}/gameState/players/${myRole}/saidCinco`]: newState.playerSaidCinco,
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
