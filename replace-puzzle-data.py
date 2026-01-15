#!/usr/bin/env python3
import json

# Read the generated crossword data
with open('crossword-data.json', 'r') as f:
    puzzle_data = json.load(f)

# Read the HTML file
with open('games/crossword-clash.html', 'r') as f:
    lines = f.readlines()

# Find the start and end lines to replace
start_line = None
end_line = None

for i, line in enumerate(lines):
    if '// --- PRE-GENERATED CROSSWORD DATA ---' in line:
        start_line = i
    if start_line and '// --- STATE ---' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print(f"Could not find replacement boundaries. start={start_line}, end={end_line}")
    exit(1)

print(f"Replacing lines {start_line+1} to {end_line} (Python 0-indexed: {start_line} to {end_line-1})")

# Create the replacement content
replacement = f'''        // --- PRE-GENERATED CROSSWORD DATA ---
        // Generated using Python script (generate-crossword.py)
        // Run daily: python3 generate-crossword.py
        // Copy contents of crossword-data.json here for today's puzzle

        const puzzleData = {json.dumps(puzzle_data, indent=12)[:-1]}        }};

        // --- STATE ---
'''

# Build the new file content
new_content = ''.join(lines[:start_line]) + replacement + ''.join(lines[end_line:])

# Write the new file
with open('games/crossword-clash.html', 'w') as f:
    f.write(new_content)

print(f"Successfully replaced puzzle data! Old file had {len(lines)} lines, new file has {len(new_content.splitlines())} lines.")
print(f"Removed {end_line - start_line} lines, added {len(replacement.splitlines())} lines.")
