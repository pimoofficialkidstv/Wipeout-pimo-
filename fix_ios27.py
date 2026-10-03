import os

files_to_fix = [
    'components/ControllerModal.tsx',
    'components/AnimatedButton.tsx',
    'components/Game.tsx',
    'src/AnimationContext.tsx',
    'App.tsx'
]

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        content = content.replace('ios26Animations', 'ios27Animations')
        content = content.replace('setIos26Animations', 'setIos27Animations')
        content = content.replace('moro_ios26_animations', 'moro_ios27_animations')
        content = content.replace('iOS 26.4', 'iOS 27.0')
        content = content.replace('iOS 26', 'iOS 27')
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
    else:
        print(f"File not found: {filepath}")

