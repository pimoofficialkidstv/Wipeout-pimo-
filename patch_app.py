with open('App.tsx', 'r') as f:
    app = f.read()

if 'import IntroScreen from' not in app:
    app = app.replace("import MoroStudioLogo from './components/MoroStudioLogo';", "import MoroStudioLogo from './components/MoroStudioLogo';\nimport IntroScreen from './components/IntroScreen';")

app = app.replace(
    '{gameState === GameState.INITIAL && (',
    '''{gameState === GameState.INTRO && (
          <IntroScreen onComplete={() => setGameState(GameState.INITIAL)} />
        )}

        {gameState === GameState.INITIAL && ('''
)

with open('App.tsx', 'w') as f:
    f.write(app)
