/**
 * Cinco Card Game - Core Game Logic (Updated Rules)
 * Supports AI, Pass & Play, and Online Multiplayer modes
 */

export class CincoGame {
    constructor(mode, callbacks = {}) {
        this.mode = mode; // 'ai', 'local', 'online'
        this.callbacks = callbacks;

        // Game state
        this.deck = [];
        this.discardPile = [];
        this.playerHand = [];
        this.opponentHand = [];
        this.currentColor = null;
        this.currentValue = null;
        this.currentTurn = 'player'; // 'player' or 'opponent'
        this.direction = 1; // 1 = forward, -1 = reverse

        // Special states
        this.playerSaidCinco = false;
        this.opponentSaidCinco = false;
        this.selectedCardIndex = null;
        this.lastPowerUp = null;

        // Active effects
        this.activeEffects = {
            colorLock: null // { color: 'blue', roundsLeft: 3 } — ONLY this color can be played
        };

        // AI state
        this.aiThinking = false;

        // Card definitions
        this.COLORS = ['red', 'blue', 'green', 'yellow'];
        this.NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        this.POWER_UPS = {
            'quantumskip': { color: true, stackable: false },
            'reversepolarity': { color: true, stackable: false },
            'neuraldrain': { color: true, stackable: true },
            'overdrive': { color: true, stackable: true },
            'empblast': { color: true, stackable: false },
            'firewall': { color: true, stackable: false },
            'systemlockdown': { color: true, stackable: false },
            'adaptiveprotocol': { color: false, stackable: false },
            'systemoverload': { color: false, stackable: true },
            'turnsteal': { color: false, stackable: false },
            'mirrorcode': { color: false, stackable: false }
        };
    }

    /**
     * Initialize the deck with 144 cards
     */
    initializeDeck() {
        this.deck = [];

        // Standard number cards: 0-9, 4 colors, 2 each = 80 cards
        this.COLORS.forEach(color => {
            this.NUMBERS.forEach(num => {
                this.deck.push({ color, value: num, type: 'number' });
                this.deck.push({ color, value: num, type: 'number' });
            });
        });

        // Quantum Skip cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'quantumskip', type: 'action' });
            this.deck.push({ color, value: 'quantumskip', type: 'action' });
        });

        // Reverse Polarity cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'reversepolarity', type: 'action' });
            this.deck.push({ color, value: 'reversepolarity', type: 'action' });
        });

        // Neural Drain +2 cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'neuraldrain', type: 'power' });
            this.deck.push({ color, value: 'neuraldrain', type: 'power' });
        });

        // Overdrive +3 cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'overdrive', type: 'power' });
            this.deck.push({ color, value: 'overdrive', type: 'power' });
        });

        // EMP Blast cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'empblast', type: 'power' });
            this.deck.push({ color, value: 'empblast', type: 'power' });
        });

        // Firewall cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'firewall', type: 'power' });
            this.deck.push({ color, value: 'firewall', type: 'power' });
        });

        // System Lockdown cards: 3 per color = 12 cards (INCREASED)
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'systemlockdown', type: 'power' });
            this.deck.push({ color, value: 'systemlockdown', type: 'power' });
            this.deck.push({ color, value: 'systemlockdown', type: 'power' });
        });

        // Adaptive Protocol (Wild) cards: 4 cards
        for (let i = 0; i < 4; i++) {
            this.deck.push({ color: 'wild', value: 'adaptiveprotocol', type: 'wild' });
        }

        // System Overload +4 cards: 4 cards
        for (let i = 0; i < 4; i++) {
            this.deck.push({ color: 'wild', value: 'systemoverload', type: 'wild' });
        }

        // Turn Steal cards: 4 cards
        for (let i = 0; i < 4; i++) {
            this.deck.push({ color: 'wild', value: 'turnsteal', type: 'wild' });
        }

        // Mirror Code cards: 2 cards
        this.deck.push({ color: 'wild', value: 'mirrorcode', type: 'wild' });
        this.deck.push({ color: 'wild', value: 'mirrorcode', type: 'wild' });
    }

    /**
     * Shuffle the deck using Fisher-Yates algorithm
     */
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    /**
     * Start a new game
     */
    startGame() {
        this.initializeDeck();
        this.shuffleDeck();
        this.dealInitialCards();
        this.startFirstCard();
        this.emitStateChange();
    }

    /**
     * Deal initial 7 cards to each player
     */
    dealInitialCards() {
        this.playerHand = [];
        this.opponentHand = [];

        for (let i = 0; i < 7; i++) {
            this.playerHand.push(this.deck.pop());
            this.opponentHand.push(this.deck.pop());
        }
    }

    /**
     * Start the game with a card from the deck
     */
    startFirstCard() {
        let firstCard;
        do {
            if (this.deck.length === 0) {
                this.reshuffleDeck();
            }
            firstCard = this.deck.pop();
        } while (firstCard.color === 'wild'); // Don't start with wild cards

        this.discardPile.push(firstCard);
        this.currentColor = firstCard.color;
        this.currentValue = firstCard.value;

        // Handle first card effects
        if (firstCard.value === 'quantumskip') {
            this.currentTurn = 'opponent';
            if (this.mode === 'ai') {
                setTimeout(() => this.executeAITurn(), 1000);
            }
        } else if (firstCard.value === 'reversepolarity') {
            this.direction *= -1;
        } else if (firstCard.value === 'neuraldrain') {
            this.drawMultipleCards(this.playerHand, 2);
            this.currentTurn = 'opponent';
            if (this.mode === 'ai') {
                setTimeout(() => this.executeAITurn(), 1000);
            }
        }
    }

    /**
     * Check if a card can be played
     */
    isCardPlayable(card) {
        const lock = this.activeEffects?.colorLock;

        // Wild cards can always be played (they let you change color, breaking the lock)
        if (card.color === 'wild') {
            return true;
        }

        // If a color lock is active, ONLY the locked color can be played
        if (lock && lock.roundsLeft > 0) {
            return card.color === lock.color;
        }

        // Normal rules: match color or value
        return card.color === this.currentColor || card.value === this.currentValue;
    }

    /**
     * Get list of playable colors (used by AI for wild card color selection)
     */
    getUnlockedColors() {
        const lock = this.activeEffects?.colorLock;
        if (lock && lock.roundsLeft > 0) {
            return [lock.color];
        }
        return [...this.COLORS];
    }

    /**
     * Player selects a card
     */
    selectCard(index) {
        if (this.currentTurn !== 'player') return false;

        const card = this.playerHand[index];
        if (!card) return false;

        if (this.selectedCardIndex === index) {
            // Already selected, try to play it
            return this.playCard(index);
        } else if (this.isCardPlayable(card)) {
            this.selectedCardIndex = index;
            this.emitStateChange();
            return true;
        }

        return false;
    }

    /**
     * Play a card from player's hand
     */
    playCard(index) {
        if (this.currentTurn !== 'player') return false;

        const card = this.playerHand[index];
        if (!card || !this.isCardPlayable(card)) return false;

        // Remove from hand
        this.playerHand.splice(index, 1);
        this.discardPile.push(card);
        this.selectedCardIndex = null;
        this.playerSaidCinco = false; // Reset cinco flag

        // Handle wild cards (need color selection)
        if (card.color === 'wild') {
            this.callbacks.requestColorSelection?.((color) => {
                this.currentColor = color;
                this.currentValue = card.value;
                // Wild card breaks color lock — player chose a new color
                this.activeEffects.colorLock = null;
                this.handleCardEffect(card, 'player');
            });
            return true;
        }

        this.currentColor = card.color;
        this.currentValue = card.value;
        this.handleCardEffect(card, 'player');

        return true;
    }

    /**
     * Handle card effects
     */
    handleCardEffect(card, playedBy) {
        const opponent = playedBy === 'player' ? 'opponent' : 'player';
        const opponentHand = playedBy === 'player' ? this.opponentHand : this.playerHand;
        const playerHand = playedBy === 'player' ? this.playerHand : this.opponentHand;

        switch (card.value) {
            case 'quantumskip':
                this.callbacks.playAnimation?.('quantumskip', playedBy);
                // Skip opponent's turn (take another turn)
                this.emitStateChange();
                if (this.checkWin(playedBy)) return;
                if (playedBy === 'player' && this.mode === 'ai') {
                    // Player plays skip, still player's turn
                } else if (playedBy === 'opponent' && this.mode === 'ai') {
                    // AI plays skip, still AI's turn
                    setTimeout(() => this.executeAITurn(), 1000);
                }
                return;

            case 'reversepolarity':
                this.callbacks.playAnimation?.('reversepolarity', playedBy);
                this.direction *= -1;
                // In 2-player, reverse acts like skip
                this.emitStateChange();
                if (this.checkWin(playedBy)) return;
                if (playedBy === 'player' && this.mode === 'ai') {
                    // Player's turn continues
                } else if (playedBy === 'opponent' && this.mode === 'ai') {
                    setTimeout(() => this.executeAITurn(), 1000);
                }
                return;

            case 'neuraldrain':
                this._handleBlockableAttack(card, playedBy, opponent, opponentHand, playerHand, () => {
                    this.callbacks.playAnimation?.('neuraldrain', playedBy);
                    this.drawMultipleCards(opponentHand, 2);
                    this.callbacks.onPenaltyDraw?.(opponent, 2);
                });
                return; // _handleBlockableAttack manages turn flow

            case 'overdrive':
                this._handleBlockableAttack(card, playedBy, opponent, opponentHand, playerHand, () => {
                    this.callbacks.playAnimation?.('overdrive', playedBy);
                    this.drawMultipleCards(opponentHand, 3);
                    this.callbacks.onPenaltyDraw?.(opponent, 3);
                });
                return;

            case 'systemoverload':
                // Firewall CANNOT block System Overload +4
                this.callbacks.playAnimation?.('systemoverload', playedBy);
                this.drawMultipleCards(opponentHand, 4);
                this.callbacks.onPenaltyDraw?.(opponent, 4);
                break;

            case 'empblast':
                this._handleBlockableAttack(card, playedBy, opponent, opponentHand, playerHand, () => {
                    this.callbacks.playAnimation?.('empblast', playedBy);
                    opponentHand.length = 0; // Discard all cards
                    this.drawMultipleCards(opponentHand, 5); // Draw 5 new cards
                    this.callbacks.onPenaltyDraw?.(opponent, 5);
                });
                return;

            case 'firewall':
                // Firewall played from hand — no special effect (it's better to hold for reactive blocking)
                this.callbacks.playAnimation?.('firewall', playedBy);
                break;

            case 'turnsteal':
                this.callbacks.playAnimation?.('turnsteal', playedBy);
                this.lastPowerUp = card;
                // Take another turn
                this.emitStateChange();
                if (playedBy === 'opponent' && this.mode === 'ai') {
                    setTimeout(() => this.executeAITurn(), 1000);
                }
                return;

            case 'systemlockdown':
                // Color Lock: ONLY this color can be played for 3 rounds (cannot be blocked)
                this.callbacks.playAnimation?.('systemlockdown', playedBy);
                this.activeEffects.colorLock = {
                    color: this.currentColor,
                    roundsLeft: 3
                };
                this.callbacks.showNotification?.('warning', `Color locked to ${this.currentColor.toUpperCase()} for 3 rounds!`);
                break;

            case 'mirrorcode':
                if (this.lastPowerUp) {
                    // Cannot copy Turn Steal, EMP Blast, or another Mirror Code
                    if (this.lastPowerUp.value !== 'turnsteal' &&
                        this.lastPowerUp.value !== 'empblast' &&
                        this.lastPowerUp.value !== 'mirrorcode') {
                        this.callbacks.playAnimation?.('mirrorcode', playedBy);
                        this.handleCardEffect(this.lastPowerUp, playedBy);
                        return;
                    }
                }
                this.callbacks.showNotification?.('warning', 'No valid power-up to copy!');
                break;

            case 'adaptiveprotocol':
                this.callbacks.playAnimation?.('adaptiveprotocol', playedBy);
                break;
        }

        // Save last power-up for mirror code
        if (card.type === 'power' || card.type === 'wild') {
            this.lastPowerUp = card;
        }

        // Check win condition
        if (this.checkWin(playedBy)) {
            return;
        }

        // Switch turns
        this.currentTurn = opponent;
        this.decrementLockedColors();
        this.emitStateChange();

        // Trigger AI turn
        if (this.currentTurn === 'opponent' && this.mode === 'ai') {
            setTimeout(() => this.executeAITurn(), 1000);
        }
    }

    /**
     * Decrement locked color rounds
     */
    decrementLockedColors() {
        const lock = this.activeEffects?.colorLock;
        if (lock && lock.roundsLeft > 0) {
            lock.roundsLeft--;
            if (lock.roundsLeft <= 0) {
                this.activeEffects.colorLock = null;
                this.callbacks.showNotification?.('info', 'Color lock expired!');
            }
        }
    }

    /**
     * Draw a single card from the deck - UPDATED: Always ends turn
     */
    drawCard() {
        if (this.currentTurn !== 'player') return false;

        if (this.deck.length === 0) {
            this.reshuffleDeck();
            if (this.deck.length === 0) {
                // No cards available - pass turn
                this.currentTurn = 'opponent';
                this.decrementLockedColors();
                this.emitStateChange();
                if (this.mode === 'ai') {
                    setTimeout(() => this.executeAITurn(), 500);
                }
                return false;
            }
        }

        const card = this.deck.pop();
        this.playerHand.push(card);

        // CRITICAL: Turn ALWAYS passes after drawing (no option to play)
        this.currentTurn = 'opponent';
        this.decrementLockedColors();
        this.emitStateChange();

        if (this.mode === 'ai') {
            setTimeout(() => this.executeAITurn(), 500);
        }

        return true;
    }

    /**
     * Draw multiple cards
     */
    drawMultipleCards(hand, count) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                this.reshuffleDeck();
                if (this.deck.length === 0) break;
            }
            hand.push(this.deck.pop());
        }
    }

    /**
     * Handle a blockable attack — checks if opponent has a firewall card in hand
     * and prompts/auto-blocks accordingly
     */
    _handleBlockableAttack(card, playedBy, opponent, opponentHand, playerHand, applyEffect) {
        // Check if the targeted player (opponent of the attacker) has a firewall in hand
        const firewallIndex = opponentHand.findIndex(c => c.value === 'firewall');

        const finishTurn = () => {
            if (card.type === 'power' || card.type === 'wild') {
                this.lastPowerUp = card;
            }
            if (this.checkWin(playedBy)) return;
            this.currentTurn = opponent;
            this.decrementLockedColors();
            this.emitStateChange();
            if (this.currentTurn === 'opponent' && this.mode === 'ai') {
                setTimeout(() => this.executeAITurn(), 1000);
            }
        };

        if (firewallIndex === -1) {
            // No firewall — apply the attack
            applyEffect();
            finishTurn();
            return;
        }

        // AI opponent always auto-blocks
        if (opponent === 'opponent' && this.mode === 'ai') {
            opponentHand.splice(firewallIndex, 1);
            this.discardPile.push({ color: 'wild', value: 'firewall', type: 'power' });
            this.callbacks.playAnimation?.('firewall_block', playedBy);
            this.callbacks.showNotification?.('info', '🤖 AI blocked with Firewall!');
            finishTurn();
            return;
        }

        // Human player — prompt them to block
        if (this.callbacks.requestFirewallBlock) {
            this.callbacks.requestFirewallBlock(card.value, (accepted) => {
                if (accepted) {
                    // Remove firewall from hand
                    const idx = opponentHand.findIndex(c => c.value === 'firewall');
                    if (idx !== -1) {
                        opponentHand.splice(idx, 1);
                        this.discardPile.push({ color: 'wild', value: 'firewall', type: 'power' });
                    }
                    this.callbacks.playAnimation?.('firewall_block', playedBy);
                    this.callbacks.showNotification?.('success', 'Attack blocked with Firewall! 🛡️');
                } else {
                    applyEffect();
                }
                finishTurn();
            });
        } else {
            // No callback — just apply effect
            applyEffect();
            finishTurn();
        }
    }

    /**
     * Reshuffle discard pile into deck
     */
    reshuffleDeck() {
        if (this.discardPile.length <= 1) return;

        const topCard = this.discardPile.pop();
        this.deck = [...this.discardPile];
        this.discardPile = [topCard];
        this.shuffleDeck();
    }

    /**
     * Say "Cinco!"
     */
    sayCinco(player = 'player') {
        if (player === 'player') {
            if (this.playerHand.length === 1) {
                this.playerSaidCinco = true;
                this.callbacks.showNotification?.('success', 'CINCO! 🎉');
                this.callbacks.playAnimation?.('cinco');
                this.emitStateChange();
                return true;
            } else {
                this.callbacks.showNotification?.('error', 'You can only say CINCO when you have 1 card!');
                return false;
            }
        } else {
            this.opponentSaidCinco = true;
            return true;
        }
    }

    /**
     * Check win condition
     */
    checkWin(player) {
        const hand = player === 'player' ? this.playerHand : this.opponentHand;
        const saidCinco = player === 'player' ? this.playerSaidCinco : this.opponentSaidCinco;

        if (hand.length === 0) {
            // Player wins!
            this.callbacks.gameOver?.(player, 'win');
            return true;
        } else if (hand.length === 1 && !saidCinco) {
            // CINCO penalty only applies in online mode (where button is visible)
            // In AI and local modes, skip the penalty since there's no CINCO button
            if (this.mode === 'online') {
                this.callbacks.showNotification?.('warning', `${player === 'player' ? 'You' : 'Opponent'} forgot to say CINCO! Draw 2 cards!`);
                this.drawMultipleCards(hand, 2);
                this.emitStateChange();
            }
        }

        return false;
    }

    /**
     * AI Turn Logic - UPDATED: Draw always ends turn
     */
    executeAITurn() {
        if (this.currentTurn !== 'opponent' || this.aiThinking) return;

        this.aiThinking = true;
        this.emitStateChange();

        setTimeout(() => {
            // Find playable cards
            const playableCards = this.opponentHand
                .map((card, index) => ({ card, index }))
                .filter(({ card }) => this.isCardPlayable(card));

            if (playableCards.length > 0) {
                // AI strategy: prioritize power-ups, then high numbers
                playableCards.sort((a, b) => {
                    const scoreA = this.getCardPriority(a.card);
                    const scoreB = this.getCardPriority(b.card);
                    return scoreB - scoreA;
                });

                const { card, index } = playableCards[0];
                this.opponentHand.splice(index, 1);
                this.discardPile.push(card);

                // Handle wild cards
                if (card.color === 'wild') {
                    this.currentColor = this.chooseAIColor();
                    this.currentValue = card.value;
                } else {
                    this.currentColor = card.color;
                    this.currentValue = card.value;
                }

                // AI says Cinco
                if (this.opponentHand.length === 1 && !this.opponentSaidCinco) {
                    this.opponentSaidCinco = true;
                    this.callbacks.showNotification?.('warning', '🤖 AI said CINCO!');
                }

                this.aiThinking = false;
                this.handleCardEffect(card, 'opponent');
            } else {
                // Draw card - ALWAYS ends AI turn
                if (this.deck.length === 0) {
                    this.reshuffleDeck();
                }

                if (this.deck.length > 0) {
                    this.opponentHand.push(this.deck.pop());
                    this.callbacks.onDraw?.('opponent');
                }

                // End turn
                this.currentTurn = 'player';
                this.aiThinking = false;
                this.decrementLockedColors();
                this.emitStateChange();
            }
        }, 1000);
    }

    /**
     * Get card priority for AI strategy
     */
    getCardPriority(card) {
        const priorities = {
            'empblast': 200,
            'systemoverload': 180,
            'mirrorcode': 160,
            'overdrive': 150,
            'systemlockdown': 140,
            'turnsteal': 130,
            'neuraldrain': 120,
            'firewall': 110,
            'adaptiveprotocol': 100,
            'quantumskip': 90,
            'reversepolarity': 80
        };

        if (priorities[card.value]) {
            return priorities[card.value];
        }

        // Number cards
        return parseInt(card.value) || 0;
    }

    /**
     * Choose best color for AI wild card - avoid locked colors
     */
    chooseAIColor() {
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };

        // Count cards in AI hand
        this.opponentHand.forEach(card => {
            if (this.COLORS.includes(card.color)) {
                colorCounts[card.color]++;
            }
        });

        // Filter out locked colors
        const unlockedColors = this.getUnlockedColors();

        if (unlockedColors.length === 0) {
            // All locked (shouldn't happen, but fallback)
            return this.COLORS[0];
        }

        // Choose color with most cards that's not locked
        const sortedColors = unlockedColors.sort((a, b) => colorCounts[b] - colorCounts[a]);
        return sortedColors[0];
    }

    /**
     * Get current game state
     */
    getState() {
        return {
            deck: this.deck,
            discardPile: this.discardPile,
            playerHand: this.playerHand,
            opponentHand: this.opponentHand,
            currentColor: this.currentColor,
            currentValue: this.currentValue,
            currentTurn: this.currentTurn,
            direction: this.direction,
            activeEffects: this.activeEffects,
            playerSaidCinco: this.playerSaidCinco,
            opponentSaidCinco: this.opponentSaidCinco,
            selectedCardIndex: this.selectedCardIndex,
            aiThinking: this.aiThinking,
            deckCount: this.deck.length,
            playerCardCount: this.playerHand.length,
            opponentCardCount: this.opponentHand.length
        };
    }

    /**
     * Emit state change to UI
     */
    emitStateChange() {
        this.callbacks.onStateChange?.(this.getState());
    }

    /**
     * Get card display text - SIMPLE CLEAR NAMES
     */
    static getCardDisplay(value) {
        const displays = {
            'quantumskip': '🚫',
            'reversepolarity': '🔄',
            'neuraldrain': '+2',
            'overdrive': '+3',
            'systemoverload': '⭐+4',
            'empblast': '💥',
            'firewall': '🛡️',
            'adaptiveprotocol': '⭐',
            'turnsteal': '⚡',
            'systemlockdown': '🔒',
            'mirrorcode': '👥'
        };
        return displays[value] || value;
    }

    /**
     * Get card description for tooltip - SIMPLE CLEAR DESCRIPTIONS
     */
    static getCardDescription(value) {
        const descriptions = {
            'quantumskip': 'Skip: Opponent loses their turn',
            'reversepolarity': 'Reverse: Change direction of play',
            'neuraldrain': 'Draw 2: Opponent draws 2 cards and loses turn',
            'overdrive': 'Draw 3: Opponent draws 3 cards and loses turn',
            'systemoverload': 'Wild Draw 4: Choose color, opponent draws 4',
            'empblast': 'Hand Wipe: Opponent discards all cards, draws 5',
            'firewall': 'Shield: Keep in hand to block +2, +3, or EMP attacks when targeted',
            'adaptiveprotocol': 'Wild: Choose any color',
            'turnsteal': 'Extra Turn: Play again immediately',
            'systemlockdown': 'Color Lock: Only this color can be played for 3 rounds',
            'mirrorcode': 'Copy: Copies the last power-up played'
        };
        return descriptions[value] || '';
    }
}

export default CincoGame;
