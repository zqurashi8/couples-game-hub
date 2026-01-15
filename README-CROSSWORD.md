# Crossword Generator

## Overview
The crossword game uses pre-generated puzzles from a Python script to avoid real-time generation issues.

## Daily Crossword Generation

### Step 1: Generate New Crossword
```bash
python3 generate-crossword.py
```

This creates:
- A visual grid in the terminal
- `crossword-data.json` with the full puzzle data

### Step 2: Update the Game
The generated `crossword-data.json` contains:
- `width`/`height`: Grid dimensions
- `grid`: 0 = black box, 1 = white box
- `gridLetters`: The actual letters
- `numbers`: Clue number positions
- `words`: Across and down clues with answers

### Step 3: Integration
Copy the contents of `crossword-data.json` into `games/crossword-clash.html` at the `puzzleData` variable (around line 341).

## Word Database
Edit the `WORD_DATABASE` in `generate-crossword.py` to add new 2026 cultural references, gaming terms, and entertainment clues.

## Features
- ✅ Black boxes supported where words don't fit
- ✅ All words intersect properly
- ✅ Mobile-friendly UI
- ✅ Click to type, double-click to switch direction
- ✅ Green highlighting for correct answers
- ✅ Hints system

## File Structure
- `generate-crossword.py` - Python crossword generator
- `crossword-data.json` - Generated puzzle data
- `games/crossword-clash.html` - The game UI

## Example Words in Database
- CHOPPLEGANGER: TikTok term for an 'ugly' lookalike
- DUNE: Villeneuve's 2026 sci-fi epic
- VBUCKS: Fortnite currency
- OPHELIA: Swift's 13-week #1 hit
- And many more 2026 cultural references!

## Regenerating Daily
Run the Python script each day to get a new randomized crossword with the same word database.
