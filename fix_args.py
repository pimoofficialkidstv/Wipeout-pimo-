with open('components/Game.tsx', 'r') as f:
    content = f.read()

content = content.replace('    const drawMoro = (\n      isAngry: boolean = false,\n      isUpset: boolean = false,\n      x: number,', '    const drawMoro = (\n      x: number,')

with open('components/Game.tsx', 'w') as f:
    f.write(content)
