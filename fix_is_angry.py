with open('components/Game.tsx', 'r') as f:
    game = f.read()

game = game.replace('const isAngry = false; const isUpset = false; if (isAngry) {', 'if (isAngry) {')
# Add it at the top of drawMoro
game = game.replace('const drawMoro = (', 'const drawMoro = (\n      isAngry: boolean = false,\n      isUpset: boolean = false,')

# Wait, drawMoro is called in many places. I cannot just add parameters without changing all calls!
# I should just define it at the beginning of the drawMoro function block.
game = game.replace('const activeChar = char || characterRef.current;', 'const activeChar = char || characterRef.current;\n      const isAngry = false;\n      const isUpset = false;')

with open('components/Game.tsx', 'w') as f:
    f.write(game)

