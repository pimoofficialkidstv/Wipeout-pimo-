with open('components/Moro3D.tsx', 'r') as f:
    moro3d = f.read()

moro3d = moro3d.replace(
    '''      const getEyesType = (id) => {\n        const p = id.replace("face-", "");\n        if (p === "cyber") return "visor";\n        return p;\n      };\n      let eyesType = face?.eyes || ((face as any)?.id ? getEyesType((face as any).id) : null) || "default";''',
    '''      let eyesType = face?.eyes || ((face as any)?.id ? getEyesType((face as any).id) : null) || "default";'''
)

with open('components/Moro3D.tsx', 'w') as f:
    f.write(moro3d)
