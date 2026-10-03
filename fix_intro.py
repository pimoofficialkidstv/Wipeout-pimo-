with open('types.ts', 'r') as f:
    content = f.read()
if "INTRO = 'INTRO'" not in content:
    content = content.replace("INITIAL = 'INITIAL',", "INTRO = 'INTRO',\n  INITIAL = 'INITIAL',")
with open('types.ts', 'w') as f:
    f.write(content)

with open('App.tsx', 'r') as f:
    app = f.read()

app = app.replace('useState<GameState>(GameState.INITIAL)', 'useState<GameState>(GameState.INTRO)')

with open('App.tsx', 'w') as f:
    f.write(app)
