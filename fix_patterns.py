import re

def fix_code(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Fix backpack
    if 'previewBackpack' in content:
        content = content.replace(
            'const backpackPattern = previewBackpack\n        ? previewBackpack.id.replace("backpack-", "")\n        : character.backpackId\n          ? character.backpackId.replace("backpack-", "")\n          : null;',
            '''const getBackpackPattern = (id) => {
        const p = id.replace("backpack-", "");
        if (p === "mecha") return "mecha_wings";
        if (p === "katana") return "katanas";
        if (p === "secret") return "void";
        return p;
      };
      const backpackPattern = previewBackpack
        ? getBackpackPattern(previewBackpack.id)
        : character.backpackId
          ? getBackpackPattern(character.backpackId)
          : null;'''
        )
    else:
        content = content.replace(
            'const backpackPattern = activeChar.backpackId ? activeChar.backpackId.replace("backpack-", "") : null;',
            '''const getBackpackPattern = (id) => {
        const p = id.replace("backpack-", "");
        if (p === "mecha") return "mecha_wings";
        if (p === "katana") return "katanas";
        if (p === "secret") return "void";
        return p;
      };
      const backpackPattern = activeChar.backpackId ? getBackpackPattern(activeChar.backpackId) : null;'''
        )

    # Fix shirt
    if 'character.shirtId' in content and 'previewShirt' in content:
        content = re.sub(
            r'const shirt = \{\s*pattern: character\.shirtId\.replace\("shirt-", ""\),\s*shirtColor: character\.shirtColor\s*\};',
            '''const getShirtPattern = (id) => {
          const p = id.replace("shirt-", "");
          if (p === "miket") return "money";
          return p;
        };
        const shirt = { pattern: getShirtPattern(character.shirtId), shirtColor: character.shirtColor };''',
            content
        )
        content = re.sub(
            r'const shirt = \{\s*pattern: previewShirt\.id\.replace\("shirt-", ""\),\s*shirtColor: previewShirt\.shirtColor\s*\};',
            '''const shirt = { pattern: getShirtPattern(previewShirt.id), shirtColor: previewShirt.shirtColor };''',
            content
        )
    elif 'activeChar.shirtId' in content:
        content = content.replace(
            'const pattern = activeChar.shirtId.replace("shirt-", "");',
            '''const getShirtPattern = (id) => {
          const p = id.replace("shirt-", "");
          if (p === "miket") return "money";
          return p;
        };
        const pattern = getShirtPattern(activeChar.shirtId);'''
        )

    # Fix face (none to fix actually, 'cyber' -> 'cyber' but code checks 'visor'. Wait, does face check 'visor'?)
    with open(file_path, 'w') as f:
        f.write(content)

fix_code('components/Moro3D.tsx')
fix_code('components/Game.tsx')

def fix_face(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # In Game.tsx
    content = content.replace(
        'const eyesType = activeChar.faceId\n        ? activeChar.faceId.replace("face-", "")\n        : "default";',
        '''const getEyesType = (id) => {
        const p = id.replace("face-", "");
        if (p === "cyber") return "visor";
        return p;
      };
      const eyesType = activeChar.faceId ? getEyesType(activeChar.faceId) : "default";'''
    )
    
    # In Moro3D.tsx
    content = content.replace(
        'let eyesType =\n        face?.eyes || (face as any)?.id?.replace("face-", "") || "default";',
        '''const getEyesType = (id) => {
        const p = id.replace("face-", "");
        if (p === "cyber") return "visor";
        return p;
      };
      let eyesType = face?.eyes || ((face as any)?.id ? getEyesType((face as any).id) : null) || "default";'''
    )
    # Wait, Moro3D does:
    # const face = previewFace || (character.faceId ? { eyes: character.faceId.replace("face-", ""), mouth: "smile" } : null);
    content = content.replace(
        'const face =\n        previewFace ||\n        (character.faceId\n          ? { eyes: character.faceId.replace("face-", ""), mouth: "smile" }\n          : null);',
        '''const getEyesType = (id) => {
        if (!id) return "default";
        const p = id.replace("face-", "");
        if (p === "cyber") return "visor";
        return p;
      };
      const face = previewFace || (character.faceId ? { eyes: getEyesType(character.faceId), mouth: "smile" } : null);'''
    )

    with open(file_path, 'w') as f:
        f.write(content)

fix_face('components/Moro3D.tsx')
fix_face('components/Game.tsx')
