import re

with open('components/Moro3D.tsx', 'r') as f:
    moro3d = f.read()
with open('components/Game.tsx', 'r') as f:
    game = f.read()

def extract_block(text, start_marker, end_marker, skip_first=False):
    start = text.find(start_marker)
    if skip_first:
        start = text.find(start_marker, start + 1)
    if start == -1: return None
    end = text.find(end_marker, start)
    if end == -1: return None
    return text[start:end]

# In Moro3D.tsx, the correct block starts around `// 3. Face (Yeux & Bouche)`
# But wait! I replaced the block in Game.tsx starting with `if (isKicked) {`
# Which means the block I want to replace in Game.tsx starts with `      if (isKicked) {` (the bad one)
# And ends with `      // --- HAIR FRONT ---`.

game_bad_block = extract_block(game, '      if (isKicked) {', '      // --- HAIR FRONT ---')
if not game_bad_block:
    print("Bad block not found in Game.tsx")
    exit(1)

# The correct block we WANT is the EYES block from Moro3D.tsx
moro_eyes_block = extract_block(moro3d, '      if (isKicked) {', '      // --- HAIR FRONT ---', skip_first=True)

if not moro_eyes_block:
    print("Correct block not found in Moro3D.tsx")
    exit(1)

moro_eyes_block = moro_eyes_block.replace('frameRef.current', 'stateRef.current.frameCount')
moro_eyes_block = moro_eyes_block.replace('character.', 'activeChar.')

# Replace bad block in Game.tsx with correct block
game = game.replace(game_bad_block, moro_eyes_block)

with open('components/Game.tsx', 'w') as f:
    f.write(game)
print("Replaced bad block with correct block!")

