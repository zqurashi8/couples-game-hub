/**
 * Profile Manager - Couples Game Hub
 * Handles user profile operations, stats tracking, and game history
 */

import { database, ref, set, get, update, serverTimestamp, push } from '../firebase-config.js';

class ProfileManager {
    /**
     * Get user profile from Firebase
     */
    async getUserProfile(userId) {
        try {
            const userRef = ref(database, `users/${userId}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                return snapshot.val();
            }

            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updates) {
        try {
            const profileRef = ref(database, `users/${userId}/profile`);
            await update(profileRef, {
                ...updates,
                lastActive: serverTimestamp()
            });

            console.log('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Update display name
     */
    async updateDisplayName(userId, displayName) {
        try {
            await this.updateProfile(userId, { displayName });
        } catch (error) {
            console.error('Error updating display name:', error);
            throw error;
        }
    }

    /**
     * Update bio
     */
    async updateBio(userId, bio) {
        try {
            await this.updateProfile(userId, { bio });
        } catch (error) {
            console.error('Error updating bio:', error);
            throw error;
        }
    }

    /**
     * Update avatar/photo URL
     */
    async updateAvatar(userId, photoURL) {
        try {
            await this.updateProfile(userId, { photoURL });
        } catch (error) {
            console.error('Error updating avatar:', error);
            throw error;
        }
    }

    /**
     * Get user stats
     */
    async getUserStats(userId) {
        try {
            const statsRef = ref(database, `users/${userId}/stats`);
            const snapshot = await get(statsRef);

            if (snapshot.exists()) {
                return snapshot.val();
            }

            return {
                totalGames: 0,
                totalWins: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastPlayedDate: null,
                firstPlayDate: null
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    /**
     * Update game stats after a game ends
     */
    async updateGameStats(userId, gameName, result) {
        try {
            const statsRef = ref(database, `users/${userId}/stats`);
            const gameStatsRef = ref(database, `users/${userId}/gameStats/${gameName}`);

            // Get current stats
            const [stats, gameStats] = await Promise.all([
                get(statsRef),
                get(gameStatsRef)
            ]);

            const currentStats = stats.exists() ? stats.val() : {
                totalGames: 0,
                totalWins: 0,
                currentStreak: 0,
                longestStreak: 0
            };

            const currentGameStats = gameStats.exists() ? gameStats.val() : {
                played: 0,
                won: 0
            };

            // Update stats
            const isWin = result === 'win' || result.result === 'win';
            const newTotalGames = currentStats.totalGames + 1;
            const newTotalWins = currentStats.totalWins + (isWin ? 1 : 0);

            // Update overall stats
            await update(statsRef, {
                totalGames: newTotalGames,
                totalWins: newTotalWins,
                lastPlayedDate: serverTimestamp()
            });

            // Update game-specific stats
            await update(gameStatsRef, {
                played: currentGameStats.played + 1,
                won: currentGameStats.won + (isWin ? 1 : 0)
            });

            // Check and update streak
            await this.checkAndUpdateStreak(userId);

            console.log('Game stats updated successfully');
        } catch (error) {
            console.error('Error updating game stats:', error);
            throw error;
        }
    }

    /**
     * Check and update user's daily streak
     */
    async checkAndUpdateStreak(userId) {
        try {
            const statsRef = ref(database, `users/${userId}/stats`);
            const snapshot = await get(statsRef);

            if (!snapshot.exists()) return;

            const stats = snapshot.val();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (!stats.lastPlayedDate) {
                // First time playing
                await update(statsRef, {
                    currentStreak: 1,
                    longestStreak: 1,
                    lastPlayedDate: serverTimestamp()
                });
                return;
            }

            const lastPlayed = new Date(stats.lastPlayedDate);
            const lastPlayedDay = new Date(lastPlayed.getFullYear(), lastPlayed.getMonth(), lastPlayed.getDate());
            const daysDiff = Math.floor((today - lastPlayedDay) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                // Already played today, no streak change
                return;
            } else if (daysDiff === 1) {
                // Played yesterday, increment streak
                const newStreak = (stats.currentStreak || 0) + 1;
                const longestStreak = Math.max(newStreak, stats.longestStreak || 0);

                await update(statsRef, {
                    currentStreak: newStreak,
                    longestStreak: longestStreak,
                    lastPlayedDate: serverTimestamp()
                });
            } else {
                // Streak broken, reset to 1
                await update(statsRef, {
                    currentStreak: 1,
                    lastPlayedDate: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error updating streak:', error);
            // Don't throw - streak is not critical
        }
    }

    /**
     * Increment streak manually (called after game completion)
     */
    async incrementStreak(userId) {
        return this.checkAndUpdateStreak(userId);
    }

    /**
     * Add game to history
     */
    async addGameToHistory(userId, gameData) {
        try {
            const historyRef = ref(database, `users/${userId}/gameHistory`);
            const newGameRef = push(historyRef);

            await set(newGameRef, {
                ...gameData,
                playedAt: serverTimestamp()
            });

            console.log('Game added to history');
        } catch (error) {
            console.error('Error adding game to history:', error);
            throw error;
        }
    }

    /**
     * Get game history
     */
    async getGameHistory(userId, limit = 20) {
        try {
            const historyRef = ref(database, `users/${userId}/gameHistory`);
            const snapshot = await get(historyRef);

            if (!snapshot.exists()) {
                return [];
            }

            const history = snapshot.val();
            const historyArray = Object.keys(history).map(key => ({
                id: key,
                ...history[key]
            }));

            // Sort by playedAt descending
            historyArray.sort((a, b) => {
                const timeA = a.playedAt || 0;
                const timeB = b.playedAt || 0;
                return timeB - timeA;
            });

            // Limit results
            return historyArray.slice(0, limit);
        } catch (error) {
            console.error('Error getting game history:', error);
            throw error;
        }
    }

    /**
     * Get stats for a specific game
     */
    async getGameStats(userId, gameName) {
        try {
            const gameStatsRef = ref(database, `users/${userId}/gameStats/${gameName}`);
            const snapshot = await get(gameStatsRef);

            if (snapshot.exists()) {
                return snapshot.val();
            }

            return {
                played: 0,
                won: 0,
                bestScore: 0
            };
        } catch (error) {
            console.error('Error getting game stats:', error);
            throw error;
        }
    }

    /**
     * Get all game stats for a user
     */
    async getAllGameStats(userId) {
        try {
            const gameStatsRef = ref(database, `users/${userId}/gameStats`);
            const snapshot = await get(gameStatsRef);

            if (snapshot.exists()) {
                return snapshot.val();
            }

            return {};
        } catch (error) {
            console.error('Error getting all game stats:', error);
            throw error;
        }
    }

    /**
     * Calculate win rate for a game
     */
    calculateWinRate(gameStats) {
        if (!gameStats || gameStats.played === 0) {
            return 0;
        }

        return Math.round((gameStats.won / gameStats.played) * 100);
    }

    /**
     * Get favorite game (most played)
     */
    async getFavoriteGame(userId) {
        try {
            const allStats = await this.getAllGameStats(userId);

            if (!allStats || Object.keys(allStats).length === 0) {
                return null;
            }

            let favoriteGame = null;
            let maxPlayed = 0;

            for (const [gameName, stats] of Object.entries(allStats)) {
                if (stats.played > maxPlayed) {
                    maxPlayed = stats.played;
                    favoriteGame = gameName;
                }
            }

            return {
                name: favoriteGame,
                played: maxPlayed,
                won: allStats[favoriteGame].won,
                winRate: this.calculateWinRate(allStats[favoriteGame])
            };
        } catch (error) {
            console.error('Error getting favorite game:', error);
            return null;
        }
    }

    /**
     * Format game name for display
     */
    formatGameName(gameKey) {
        const nameMap = {
            'word-rush': 'Word Rush',
            'memory-match': 'Memory Match',
            'trivia-duel': 'Trivia Duel',
            'quick-draw': 'Quick Draw',
            'math-dash': 'Math Dash',
            'memory-lane': 'Memory Lane',
            'date-designer': 'Date Designer',
            'inside-our-space': 'Inside Our Space',
            'crossword-clash': 'Crossword Clash'
        };

        return nameMap[gameKey] || gameKey;
    }

    /**
     * Get game icon emoji
     */
    getGameIcon(gameKey) {
        const iconMap = {
            'word-rush': '🧩',
            'memory-match': '💝',
            'trivia-duel': '🎯',
            'quick-draw': '🎨',
            'math-dash': '🎲',
            'memory-lane': '❓',
            'date-designer': '💕',
            'inside-our-space': '🏠',
            'crossword-clash': '📝'
        };

        return iconMap[gameKey] || '🎮';
    }

    /**
     * Format relative time (e.g., "2 hours ago", "3 days ago")
     */
    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }

    /**
     * Format duration (in seconds) to readable format
     */
    formatDuration(seconds) {
        if (!seconds) return '0s';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
}

// Export singleton instance
const profileManager = new ProfileManager();
export default profileManager;
