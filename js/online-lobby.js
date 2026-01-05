// Online Lobby UI Component
// This can be imported and used by any game

export function createLobbyHTML() {
    return `
        <!-- Online Lobby Screen -->
        <div class="online-lobby-screen" id="onlineLobbyScreen">
            <h2 style="color: #667eea; text-align: center; margin-bottom: 30px;">🌐 Play Online</h2>

            <div class="lobby-options">
                <div class="lobby-card" onclick="showCreateGame()">
                    <div class="lobby-icon">➕</div>
                    <h3>Create Game</h3>
                    <p>Start a new game and get a code to share with your partner</p>
                </div>

                <div class="lobby-card" onclick="showJoinGame()">
                    <div class="lobby-icon">🔗</div>
                    <h3>Join Game</h3>
                    <p>Enter a code to join your partner's game</p>
                </div>
            </div>

            <div class="recent-sessions" id="recentSessions" style="display: none;">
                <h3 style="color: #764ba2; margin: 30px 0 15px;">Recent Sessions</h3>
                <div id="sessionHistoryList"></div>
            </div>
        </div>

        <!-- Create Game Screen -->
        <div class="create-game-screen" id="createGameScreen" style="display: none;">
            <button class="back-btn" onclick="backToLobby()">← Back</button>
            <h2 style="color: #667eea; text-align: center; margin-bottom: 30px;">Create New Game</h2>

            <div class="name-input-container">
                <label for="player1Name">Your Name:</label>
                <input type="text" id="player1Name" placeholder="Enter your name" maxlength="20" />
            </div>

            <button class="create-btn" onclick="createGameSession()">Create Game & Get Code</button>
        </div>

        <!-- Waiting Room Screen -->
        <div class="waiting-room-screen" id="waitingRoomScreen" style="display: none;">
            <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">Waiting for Player 2...</h2>

            <div class="session-code-display">
                <div class="code-label">Share this code with your partner:</div>
                <div class="session-code" id="sessionCodeDisplay">------</div>
                <button class="copy-code-btn" onclick="copySessionCode()">📋 Copy Code</button>
            </div>

            <div class="waiting-animation">
                <div class="dot-pulse"></div>
                <p>Waiting for <span id="partnerNameWaiting">your partner</span> to join...</p>
            </div>

            <button class="cancel-btn" onclick="cancelSession()">Cancel</button>
        </div>

        <!-- Join Game Screen -->
        <div class="join-game-screen" id="joinGameScreen" style="display: none;">
            <button class="back-btn" onclick="backToLobby()">← Back</button>
            <h2 style="color: #667eea; text-align: center; margin-bottom: 30px;">Join Game</h2>

            <div class="name-input-container">
                <label for="player2Name">Your Name:</label>
                <input type="text" id="player2Name" placeholder="Enter your name" maxlength="20" />
            </div>

            <div class="name-input-container">
                <label for="sessionCodeInput">Game Code:</label>
                <input type="text" id="sessionCodeInput" placeholder="Enter 6-digit code" maxlength="6" style="text-transform: uppercase;" />
            </div>

            <div id="joinErrorMessage" class="error-message" style="display: none;"></div>

            <button class="join-btn" onclick="joinGameSession()">Join Game</button>
        </div>

        <!-- Connecting Screen -->
        <div class="connecting-screen" id="connectingScreen" style="display: none;">
            <h2 style="color: #667eea; text-align: center;">✨ Connected!</h2>
            <p style="text-align: center; font-size: 1.2em; margin: 20px 0;">
                You're playing with <strong id="connectedPartnerName">Partner</strong>
            </p>
            <div class="ready-animation">
                <div class="checkmark">✓</div>
                <p>Starting game...</p>
            </div>
        </div>
    `;
}

export function getLobbyStyles() {
    return `
        .online-lobby-screen, .create-game-screen, .join-game-screen,
        .waiting-room-screen, .connecting-screen {
            display: none;
        }

        .online-lobby-screen.active, .create-game-screen.active, .join-game-screen.active,
        .waiting-room-screen.active, .connecting-screen.active {
            display: block;
        }

        .lobby-options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .lobby-card {
            background: #f8f9ff;
            padding: 30px;
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s;
            border: 3px solid transparent;
            text-align: center;
        }

        .lobby-card:hover {
            transform: translateY(-5px);
            border-color: #667eea;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .lobby-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }

        .lobby-card h3 {
            color: #667eea;
            margin-bottom: 10px;
        }

        .lobby-card p {
            color: #666;
            font-size: 0.9em;
        }

        .name-input-container {
            margin-bottom: 25px;
        }

        .name-input-container label {
            display: block;
            color: #667eea;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 1.1em;
        }

        .name-input-container input {
            width: 100%;
            padding: 15px;
            font-size: 1.1em;
            border: 3px solid #ddd;
            border-radius: 10px;
            transition: border-color 0.3s;
        }

        .name-input-container input:focus {
            outline: none;
            border-color: #667eea;
        }

        .create-btn, .join-btn, .cancel-btn, .back-btn, .copy-code-btn {
            width: 100%;
            padding: 15px;
            font-size: 1.2em;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s;
            margin-top: 10px;
        }

        .create-btn, .join-btn {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
        }

        .create-btn:hover, .join-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
        }

        .cancel-btn {
            background: #f44336;
            color: white;
        }

        .cancel-btn:hover {
            background: #da190b;
        }

        .back-btn {
            background: white;
            color: #667eea;
            border: 3px solid #667eea;
            margin-bottom: 20px;
        }

        .back-btn:hover {
            background: #f8f9ff;
        }

        .session-code-display {
            background: #f8f9ff;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
            border: 3px solid #667eea;
        }

        .code-label {
            color: #764ba2;
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 1.1em;
        }

        .session-code {
            font-size: 3em;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }

        .copy-code-btn {
            background: #667eea;
            color: white;
            width: auto;
            padding: 12px 30px;
            font-size: 1em;
        }

        .copy-code-btn:hover {
            background: #764ba2;
        }

        .waiting-animation, .ready-animation {
            text-align: center;
            padding: 40px 20px;
        }

        .dot-pulse {
            width: 60px;
            height: 60px;
            border: 4px solid #667eea;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #4CAF50;
            color: white;
            font-size: 3em;
            line-height: 80px;
            margin: 0 auto 20px;
            animation: pop 0.3s ease-out;
        }

        @keyframes pop {
            0% { transform: scale(0); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #f44336;
        }

        .recent-sessions {
            margin-top: 40px;
        }

        .session-history-item {
            background: #f8f9ff;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
        }

        .session-history-item:hover {
            border-color: #667eea;
            transform: translateX(5px);
        }

        .session-history-item .session-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .session-history-item .session-code-small {
            font-weight: bold;
            color: #667eea;
            font-family: 'Courier New', monospace;
        }

        .session-history-item .session-time {
            color: #999;
            font-size: 0.9em;
        }

        @media (max-width: 768px) {
            .lobby-options {
                grid-template-columns: 1fr;
            }

            .session-code {
                font-size: 2em;
                letter-spacing: 4px;
            }
        }
    `;
}
