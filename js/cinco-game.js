/**
 * Cinco Card Game - Core Game Logic
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
            shield: { player: false, opponent: false },
            colorLock: { color: null, roundsLeft: 0 }
        };

        // AI state
        this.aiThinking = false;
        this.aiTurnCount = 0;
        this.MAX_AI_TURNS = 2;

        // Card definitions
        this.COLORS = ['red', 'blue', 'green', 'yellow'];
        this.NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        this.POWER_UPS = {
            'skip': { color: true, stackable: false },
            'reverse': { color: true, stackable: false },
            'draw2': { color: true, stackable: true },
            'cascade': { color: true, stackable: true }, // +3
            'handbomb': { color: true, stackable: false },
            'shield': { color: true, stackable: false },
            'wild': { color: false, stackable: false },
            'wilddraw4': { color: false, stackable: true },
            'wildchaos': { color: false, stackable: false },
            'timewarp': { color: false, stackable: false },
            'colorlock': { color: false, stackable: false },
            'doppelganger': { color: false, stackable: false }
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

        // Skip cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'skip', type: 'action' });
            this.deck.push({ color, value: 'skip', type: 'action' });
        });

        // Reverse cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'reverse', type: 'action' });
            this.deck.push({ color, value: 'reverse', type: 'action' });
        });

        // +2 Draw cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'draw2', type: 'power' });
            this.deck.push({ color, value: 'draw2', type: 'power' });
        });

        // +3 Cascade cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'cascade', type: 'power' });
            this.deck.push({ color, value: 'cascade', type: 'power' });
        });

        // Hand Bomb cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'handbomb', type: 'power' });
            this.deck.push({ color, value: 'handbomb', type: 'power' });
        });

        // Shield cards: 2 per color = 8 cards
        this.COLORS.forEach(color => {
            this.deck.push({ color, value: 'shield', type: 'power' });
            this.deck.push({ color, value: 'shield', type: 'power' });
        });

        // Wild cards: 4 cards
        for (let i = 0; i < 4; i++) {
            this.deck.push({ color: 'wild', value: 'wild', type: 'wild' });
        }

        // +4 Wild Draw cards: 4 cards
        for (let i = 0; i < 4; i++) {
            this.deck.push({ color: 'wild', value: 'wilddraw4', type: 'wild' });
        }

        // Time Warp cards: 4 cards
        for (let i = 0; i < 4; i++) {
            this.deck.push({ color: 'wild', value: 'timewarp', type: 'wild' });
        }

        // Wild Chaos cards: 4 cards
        for (let i = 0; i < 4; i++) {
            this.deck.push({ color: 'wild', value: 'wildchaos', type: 'wild' });
        }

        // Color Lock cards: 2 cards
        this.deck.push({ color: 'wild', value: 'colorlock', type: 'wild' });
        this.deck.push({ color: 'wild', value: 'colorlock', type: 'wild' });

        // Doppelganger cards: 2 cards
        this.deck.push({ color: 'wild', value: 'doppelganger', type: 'wild' });
        this.deck.push({ color: 'wild', value: 'doppelganger', type: 'wild' });
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
        if (firstCard.value === 'skip') {
            this.currentTurn = 'opponent';
            if (this.mode === 'ai') {
                setTimeout(() => this.executeAITurn(), 1000);
            }
        } else if (firstCard.value === 'reverse') {
            this.direction *= -1;
        } else if (firstCard.value === 'draw2') {
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
        // Wild cards can always be played
        if (card.color === 'wild') return true;

        // Check color lock
        if (this.activeEffects.colorLock.roundsLeft > 0) {
            const lockedColor = this.activeEffects.colorLock.color;
            if (lockedColor && card.color !== lockedColor && card.color !== 'wild') {
                return false;
            }
        }

        // Match color or value
        return card.color === this.currentColor || card.value === this.currentValue;
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
            this.callbacks.requestColorSelection?.(color => {
                this.currentColor = color;
                this.currentValue = card.value;
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
            case 'skip':
                this.callbacks.playAnimation?.('skip');
                // Skip opponent's turn (take another turn)
                this.emitStateChange();
                if (playedBy === 'player' && this.mode === 'ai') {
                    // Player plays skip, still player's turn
                } else if (playedBy === 'opponent' && this.mode === 'ai') {
                    // AI plays skip, still AI's turn
                    setTimeout(() => this.executeAITurn(), 1000);
                }
                return;

            case 'reverse':
                this.callbacks.playAnimation?.('reverse');
                this.direction *= -1;
                // In 2-player, reverse acts like skip
                this.emitStateChange();
                if (playedBy === 'player' && this.mode === 'ai') {
                    // Player's turn continues
                } else if (playedBy === 'opponent' && this.mode === 'ai') {
                    setTimeout(() => this.executeAITurn(), 1000);
                }
                return;

            case 'draw2':
                if (this.activeEffects.shield[opponent]) {
                    this.callbacks.playAnimation?.('shield_block');
                    this.activeEffects.shield[opponent] = false;
                } else {
                    this.callbacks.playAnimation?.('draw2');
                    this.drawMultipleCards(opponentHand, 2);
                }
                break;

            case 'cascade':
                if (this.activeEffects.shield[opponent]) {
                    this.callbacks.playAnimation?.('shield_block');
                    this.activeEffects.shield[opponent] = false;
                } else {
                    this.callbacks.playAnimation?.('cascade');
                    this.drawMultipleCards(opponentHand, 3);
                }
                break;

            case 'wilddraw4':
                // Shield cannot block +4
                this.callbacks.playAnimation?.('wilddraw4');
                this.drawMultipleCards(opponentHand, 4);
                break;

            case 'handbomb':
                if (this.activeEffects.shield[opponent]) {
                    this.callbacks.playAnimation?.('shield_block');
                    this.activeEffects.shield[opponent] = false;
                } else {
                    this.callbacks.playAnimation?.('handbomb');
                    opponentHand.length = 0; // Discard all cards
                    this.drawMultipleCards(opponentHand, 5); // Draw 5 new cards
                }
                break;

            case 'shield':
                this.callbacks.playAnimation?.('shield');
                this.activeEffects.shield[playedBy] = true;
                break;

            case 'timewarp':
                this.callbacks.playAnimation?.('timewarp');
                this.lastPowerUp = card;
                // Take another turn
                this.emitStateChange();
                if (playedBy === 'opponent' && this.mode === 'ai') {
                    setTimeout(() => this.executeAITurn(), 1000);
                }
                return;

            case 'wildchaos':
                this.callbacks.playAnimation?.('wildchaos');
                this.executeWildChaos();
                break;

            case 'colorlock':
                if (this.activeEffects.shield[opponent]) {
                    this.callbacks.playAnimation?.('shield_block');
                    this.activeEffects.shield[opponent] = false;
                } else {
                    this.callbacks.playAnimation?.('colorlock');
                    this.activeEffects.colorLock = {
                        color: this.currentColor,
                        roundsLeft: 4 // 2 rounds per player
                    };
                }
                break;

            case 'doppelganger':
                if (this.lastPowerUp) {
                    this.callbacks.playAnimation?.('doppelganger');
                    this.handleCardEffect(this.lastPowerUp, playedBy);
                    return;
                }
                break;

            case 'wild':
                this.callbacks.playAnimation?.('wild');
                break;
        }

        // Save last power-up for doppelganger
        if (card.type === 'power' || card.type === 'wild') {
            this.lastPowerUp = card;
        }

        // Check win condition
        if (this.checkWin(playedBy)) {
            return;
        }

        // Switch turns
        this.currentTurn = opponent;
        this.decrementColorLock();
        this.emitStateChange();

        // Trigger AI turn
        if (this.currentTurn === 'opponent' && this.mode === 'ai') {
            setTimeout(() => this.executeAITurn(), 1000);
        }
    }

    /**
     * Execute Wild Chaos effect - swap 2 cards
     */
    executeWildChaos() {
        // Swap 2 random cards between players
        if (this.playerHand.length >= 2 && this.opponentHand.length >= 2) {
            for (let i = 0; i < 2; i++) {
                const playerIndex = Math.floor(Math.random() * this.playerHand.length);
                const opponentIndex = Math.floor(Math.random() * this.opponentHand.length);

                const temp = this.playerHand[playerIndex];
                this.playerHand[playerIndex] = this.opponentHand[opponentIndex];
                this.opponentHand[opponentIndex] = temp;
            }
        }
    }

    /**
     * Decrement color lock rounds
     */
    decrementColorLock() {
        if (this.activeEffects.colorLock.roundsLeft > 0) {
            this.activeEffects.colorLock.roundsLeft--;
            if (this.activeEffects.colorLock.roundsLeft === 0) {
                this.activeEffects.colorLock.color = null;
            }
        }
    }

    /**
     * Draw a single card from the deck
     */
    drawCard() {
        if (this.currentTurn !== 'player') return false;

        if (this.deck.length === 0) {
            this.reshuffleDeck();
            if (this.deck.length === 0) {
                // No cards available
                this.currentTurn = 'opponent';
                this.emitStateChange();
                if (this.mode === 'ai') {
                    setTimeout(() => this.executeAITurn(), 500);
                }
                return false;
            }
        }

        const card = this.deck.pop();
        this.playerHand.push(card);

        // Check if drawn card is playable
        if (!this.isCardPlayable(card)) {
            // Can't play, end turn
            this.currentTurn = 'opponent';
            this.decrementColorLock();
            this.emitStateChange();
            if (this.mode === 'ai') {
                setTimeout(() => this.executeAITurn(), 500);
            }
        } else {
            this.emitStateChange();
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
            // Penalty: draw 2 cards for forgetting to say Cinco
            this.callbacks.showNotification?.('warning', `${player === 'player' ? 'You' : 'Opponent'} forgot to say CINCO! Draw 2 cards!`);
            this.drawMultipleCards(hand, 2);
            this.emitStateChange();
        }

        return false;
    }

    /**
     * AI Turn Logic
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
                this.aiTurnCount = 0;

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
                // Draw card
                this.aiTurnCount++;

                if (this.aiTurnCount >= this.MAX_AI_TURNS || this.deck.length === 0) {
                    // Pass turn to player
                    this.aiTurnCount = 0;
                    this.currentTurn = 'player';
                    this.aiThinking = false;
                    this.decrementColorLock();
                    this.emitStateChange();
                    return;
                }

                if (this.deck.length === 0) {
                    this.reshuffleDeck();
                }

                if (this.deck.length > 0) {
                    this.opponentHand.push(this.deck.pop());
                }

                // End turn
                this.aiTurnCount = 0;
                this.currentTurn = 'player';
                this.aiThinking = false;
                this.decrementColorLock();
                this.emitStateChange();
            }
        }, 1000);
    }

    /**
     * Get card priority for AI strategy
     */
    getCardPriority(card) {
        const priorities = {
            'handbomb': 200,
            'wilddraw4': 180,
            'wildchaos': 170,
            'doppelganger': 160,
            'cascade': 150,
            'colorlock': 140,
            'timewarp': 130,
            'draw2': 120,
            'shield': 110,
            'wild': 100,
            'skip': 90,
            'reverse': 80
        };

        if (priorities[card.value]) {
            return priorities[card.value];
        }

        // Number cards
        return parseInt(card.value) || 0;
    }

    /**
     * Choose best color for AI wild card
     */
    chooseAIColor() {
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        this.opponentHand.forEach(card => {
            if (this.COLORS.includes(card.color)) {
                colorCounts[card.color]++;
            }
        });

        return Object.keys(colorCounts).reduce((a, b) =>
            colorCounts[a] > colorCounts[b] ? a : b
        );
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
     * Get card display text
     */
    static getCardDisplay(value) {
        const displays = {
            'skip': '🚫',
            'reverse': '🔄',
            'draw2': '+2',
            'cascade': '+3',
            'wilddraw4': '🌈+4',
            'handbomb': '💣',
            'shield': '🛡️',
            'wild': '🌈',
            'wildchaos': '🌀',
            'timewarp': '⏰',
            'colorlock': '🔒',
            'doppelganger': '👥'
        };
        return displays[value] || value;
    }

    /**
     * Get card description for tooltip
     */
    static getCardDescription(value) {
        const descriptions = {
            'skip': 'Skip opponent\'s turn',
            'reverse': 'Reverse play direction',
            'draw2': 'Opponent draws 2 cards',
            'cascade': '+3: Opponent draws 3 cards (stackable)',
            'wilddraw4': '+4: Opponent draws 4 cards (stackable)',
            'handbomb': 'Opponent discards hand, draws 5 new cards',
            'shield': 'Block next attack card',
            'wild': 'Change color',
            'wildchaos': 'Change color + swap 2 cards with opponent',
            'timewarp': 'Take another turn',
            'colorlock': 'Lock one color for 2 rounds',
            'doppelganger': 'Copy last power-up effect'
        };
        return descriptions[value] || '';
    }
}

export default CincoGame;
