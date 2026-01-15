import random
import json

# --- 1. The 2026 Cultural Database (Word List & Clues) ---
WORD_DATABASE = {
    2: {
        "AF": "Emphatic slang acronym",
    },
    3: {
        "ICE": "Agency sparking Jan '26 protests",
        "IDA": "Actress Brooke of 'Dune 3'",
        "YAM": "'Survivor' winner ___ Yam Arocho",
        "DAP": "Handshake gesture (slang)",
        "DUB": "A win, short for 'W'",
        "BAE": "Significant other",
        "ISS": "Crew-11 left this station early"
    },
    4: {
        "DUNE": "Villeneuve's 2026 sci-fi epic",
        "LISA": "Blackpink star in 'White Lotus'",
        "ROSE": "The Black Label K-pop artist",
        "TACO": "Controversial 2026 political acronym",
        "FAFO": "Diplomatic warning acronym ('Find Out')",
        "DOGE": "Musk-led Dept. of Gov Efficiency",
        "EPIC": "Fortnite developer",
        "PUBG": "Krafton's battle royale game",
        "ADDY": "Address, in Gen Z slang",
        "WALZ": "Minnesota Governor Tim",
        "LETO": "Paul Atreides' son",
        "ELLA": "Singer Langley ('Choosin' Texas')"
    },
    5: {
        "VOGUE": "Madonna hit or trend status",
        "FRESH": "Cool or new",
        "CHANI": "Zendaya's 'Dune' role",
        "SWIFT": "Singer of 'The Fate of Ophelia'",
        "DRAMA": "Genre of 'The White Lotus'",
        "TRAIN": "Hydrogen-powered vehicle in India",
        "GHOLA": "Resurrected Duncan Idaho",
        "CROCS": "Shoe brand collabing with Simpsons"
    },
    6: {
        "WALLEN": "Country star Morgan",
        "VBUCKS": "Fortnite currency",
        "MOJANG": "Minecraft developer",
        "WARREN": "Singer Alex of 'Ordinary'",
        "ISLAND": "Fortnite Creative location",
        "OASIS": "Band rumored for Knebworth '26"
    },
    7: {
        "OPHELIA": "Swift's 13-week #1 hit",
        "KRAFTON": "Gaming giant investing in K-pop",
        "BRITPOP": "Robbie Williams' 2026 album",
        "SCYTALE": "'Dune' Face Dancer villain",
        "GHANIMA": "Daughter of Paul Atreides",
        "BELINDA": "Spa manager in 'White Lotus' S3"
    },
    8: {
        "THAILAND": "Setting for 'White Lotus' Season 3",
        "HYDROGEN": "Fuel for new Indian trains",
        "SHOWGIRL": "Swift album 'Life of a ___'",
        "MANINEED": "Olivia Dean hit song"
    },
    13: {
        "CHOPPLEGANGER": "TikTok term for an 'ugly' lookalike"
    }
}

class CrosswordGenerator:
    def __init__(self, size=15, word_db=WORD_DATABASE):
        self.size = size
        self.grid = [[' ' for _ in range(size)] for _ in range(size)]
        self.word_db = word_db
        self.placed_words = []

    def print_grid(self):
        print("-" * (self.size * 2 + 3))
        for row in self.grid:
            print("| " + " ".join(row) + " |")
        print("-" * (self.size * 2 + 3))

    def print_clues(self):
        # Sort words by Position (Row then Column)
        sorted_words = sorted(self.placed_words, key=lambda x: (x[1], x[2]))

        print("\n--- ACROSS ---")
        for w_data in sorted_words:
            word, r, c, direction, clue = w_data
            if direction == 'across':
                print(f"{r+1},{c+1}: {clue} ({len(word)}) [{word}]")

        print("\n--- DOWN ---")
        for w_data in sorted_words:
            word, r, c, direction, clue = w_data
            if direction == 'down':
                print(f"{r+1},{c+1}: {clue} ({len(word)}) [{word}]")

    def can_place(self, word, row, col, direction):
        word_len = len(word)

        # --- 1. Boundary & End-to-End Checks ---
        if direction == 'across':
            if col + word_len > self.size: return False
            if col > 0 and self.grid[row][col-1] != ' ': return False
            if col + word_len < self.size and self.grid[row][col+word_len] != ' ': return False
        else: # down
            if row + word_len > self.size: return False
            if row > 0 and self.grid[row-1][col] != ' ': return False
            if row + word_len < self.size and self.grid[row+word_len][col] != ' ': return False

        # --- 2. Cell Validation ---
        for i in range(word_len):
            r, c = (row, col + i) if direction == 'across' else (row + i, col)
            curr_char = self.grid[r][c]

            # A. Collision: Must be empty OR match the letter (intersection)
            if curr_char != ' ' and curr_char != word[i]:
                return False

            # B. Adjacency: If placing in an EMPTY cell, check perpendicular neighbors.
            # We don't want to place a letter next to an existing word unless we are crossing it.
            if curr_char == ' ':
                if direction == 'across':
                    # Check Top and Bottom
                    if (r > 0 and self.grid[r-1][c] != ' ') or \
                       (r < self.size - 1 and self.grid[r+1][c] != ' '):
                        return False
                else: # down
                    # Check Left and Right
                    if (c > 0 and self.grid[r][c-1] != ' ') or \
                       (c < self.size - 1 and self.grid[r][c+1] != ' '):
                        return False
        return True

    def place_word(self, word, row, col, direction):
        if direction == 'across':
            for i in range(len(word)):
                self.grid[row][col + i] = word[i]
        else:
            for i in range(len(word)):
                self.grid[row + i][col] = word[i]

        self.placed_words.append((word, row, col, direction, self.word_db[len(word)][word]))

    def generate(self, num_words=15):
        # 1. Place a "Seed" word
        seed = "CHOPPLEGANGER"
        if len(seed) <= self.size:
            r = self.size // 2
            c = (self.size - len(seed)) // 2
            self.place_word(seed, r, c, 'across')

        # 2. Try to intersect words
        attempts = 0
        while len(self.placed_words) < num_words and attempts < 2000:
            attempts += 1

            length = random.choice(list(self.word_db.keys()))
            word_list = list(self.word_db[length].keys())
            word = random.choice(word_list)

            # Check if already placed
            if any(word == pw[0] for pw in self.placed_words):
                continue

            # Randomize grid traversal to avoid clustering top-left
            rows = list(range(self.size))
            cols = list(range(self.size))
            random.shuffle(rows)
            random.shuffle(cols)

            placed = False
            for r in rows:
                for c in cols:
                    # Try Across
                    if self.can_place(word, r, c, 'across'):
                        # Heuristic: Require at least one intersection for connectedness
                        intersects = False
                        for i in range(len(word)):
                            if self.grid[r][c+i] == word[i]:
                                intersects = True
                                break
                        if intersects:
                            self.place_word(word, r, c, 'across')
                            placed = True
                            break

                    # Try Down
                    if not placed and self.can_place(word, r, c, 'down'):
                        intersects = False
                        for i in range(len(word)):
                            if self.grid[r+i][c] == word[i]:
                                intersects = True
                                break
                        if intersects:
                            self.place_word(word, r, c, 'down')
                            placed = True
                            break
                if placed: break

        print(f"Generated Grid with {len(self.placed_words)} words.")
        self.print_grid()
        self.print_clues()

        # Export to JSON for easy integration
        self.export_to_json()

    def export_to_json(self):
        """Export crossword data to JSON format"""
        # Convert grid: ' ' = 0 (black), letter = 1 (white)
        grid = [[0 if cell == ' ' else 1 for cell in row] for row in self.grid]

        # Assign numbers to word starts
        numbers = {}
        clue_number = 1
        word_numbering = {}

        # Sort by position to assign numbers in order
        sorted_words = sorted(self.placed_words, key=lambda x: (x[1], x[2]))

        for word, row, col, direction, clue in sorted_words:
            key = f"{row},{col}"
            if key not in numbers:
                numbers[key] = clue_number
                word_numbering[(word, row, col, direction)] = clue_number
                clue_number += 1
            else:
                word_numbering[(word, row, col, direction)] = numbers[key]

        # Build words dict
        words_across = {}
        words_down = {}

        for word, row, col, direction, clue in self.placed_words:
            num = word_numbering[(word, row, col, direction)]
            word_data = {
                "clue": clue,
                "answer": word,
                "row": row,
                "col": col
            }
            if direction == 'across':
                words_across[num] = word_data
            else:
                words_down[num] = word_data

        output = {
            "width": self.size,
            "height": self.size,
            "grid": grid,
            "gridLetters": [list(row) for row in self.grid],
            "numbers": numbers,
            "words": {
                "across": words_across,
                "down": words_down
            }
        }

        with open('crossword-data.json', 'w') as f:
            json.dump(output, f, indent=2)

        print("\n✓ Exported to crossword-data.json")

# --- Execution ---
if __name__ == "__main__":
    cw = CrosswordGenerator(size=15)
    cw.generate(num_words=15)
