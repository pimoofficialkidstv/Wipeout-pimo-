import re

with open('components/Moro3D.tsx', 'r') as f:
    moro3d = f.read()
    
with open('components/Game.tsx', 'r') as f:
    game = f.read()

def extract_block(text, start_marker, end_marker):
    start = text.find(start_marker)
    if start == -1: return None
    end = text.find(end_marker, start)
    if end == -1: return None
    return text[start:end]

# 1. Backpacks
moro_bp = extract_block(moro3d, '      // 1. Sac à dos', '      // --- HAIR BACK ---')
game_bp = extract_block(game, '      // Backpack 3D-ish', '      // --- HAIR BACK ---')

if moro_bp and game_bp:
    moro_bp = moro_bp.replace('frameRef.current', 'stateRef.current.frameCount')
    moro_bp = moro_bp.replace('previewBackpack?.backpackColor ||\n        character.backpackColor ||\n        character.accessoryColor', 'activeChar.backpackColor || activeChar.accessoryColor')
    moro_bp = moro_bp.replace('character.', 'activeChar.')
    moro_bp = moro_bp.replace('previewBackpack\n        ? previewBackpack.id.replace("backpack-", "")\n        : activeChar.backpackId\n          ? activeChar.backpackId.replace("backpack-", "")\n          : null;', 'activeChar.backpackId ? activeChar.backpackId.replace("backpack-", "") : null;')
    game = game.replace(game_bp, moro_bp)


# 2. Shirts
moro_shirt_ifs = extract_block(moro3d, 'if (shirt.pattern === "stripes") {', '        ctx.restore();\n      }')
game_shirt_ifs = extract_block(game, 'if (pattern === "stripes") {', '        ctx.restore();\n      }')
if moro_shirt_ifs and game_shirt_ifs:
    moro_shirt_ifs = moro_shirt_ifs.replace('shirt.pattern', 'pattern')
    game = game.replace(game_shirt_ifs, moro_shirt_ifs)


# 3. Faces
moro_face = extract_block(moro3d, '      const eyesType = previewFace', '      // --- HAIR FRONT ---')
game_face = extract_block(game, '      const eyesType = activeChar.faceId', '      // --- HAIR FRONT ---')

if moro_face and game_face:
    moro_face = moro_face.replace('frameRef.current', 'stateRef.current.frameCount')
    moro_face = moro_face.replace('character.', 'activeChar.')
    moro_face = moro_face.replace('previewFace\n        ? previewFace.eyes\n        : activeChar.faceId', 'activeChar.faceId')
    moro_face = moro_face.replace('previewFace\n        ? previewFace.mouth\n        : activeChar.faceId', 'activeChar.faceId')
    
    # We also need to fix replacing `previewFace` in general if there are any left.
    moro_face = re.sub(r'previewFace\s*\?\s*previewFace\.[a-zA-Z]+\s*\:\s*', '', moro_face)
    game = game.replace(game_face, moro_face)
    
# 4. Hair Front
moro_hair_f = extract_block(moro3d, '      // --- HAIR FRONT ---', '      ctx.restore();\n    };\n')
game_hair_f = extract_block(game, '      // --- HAIR FRONT ---', '      ctx.restore();\n    };\n')

if moro_hair_f and game_hair_f:
    moro_hair_f = moro_hair_f.replace('frameRef.current', 'stateRef.current.frameCount')
    moro_hair_f = moro_hair_f.replace('character.', 'activeChar.')
    moro_hair_f = re.sub(r'const hairMode = previewHair[^;]+;', 'const hairMode = activeChar.hairId ? activeChar.hairId.replace("hair-", "") : "none";', moro_hair_f)
    moro_hair_f = re.sub(r'const hColor = previewHair[^;]+;', 'const hColor = activeChar.hairColor || "#1e293b";', moro_hair_f)
    game = game.replace(game_hair_f, moro_hair_f)

# 5. Body
moro_body = extract_block(moro3d, 'const activeBodyId = previewBody?.id || character.bodyId || "body-circle";', '      // Shadow dynamics')
game_body = extract_block(game, 'const isHuman = activeChar.bodyId === "body-human";', '      // Shadow dynamics')

if moro_body and game_body:
    moro_body = moro_body.replace('previewBody?.id || character.bodyId', 'activeChar.bodyId')
    moro_body = moro_body.replace('character.', 'activeChar.')
    moro_body = moro_body.replace('frameRef.current', 'stateRef.current.frameCount')
    game = game.replace(game_body, moro_body)

with open('components/Game.tsx', 'w') as f:
    f.write(game)

