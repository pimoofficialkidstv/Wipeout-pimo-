with open('src/translations.ts', 'r') as f:
    t = f.read()

# Replace the fallback logic
t = t.replace(
    "let text = translations[lang]?.[key] || translations['English'][key] || key;\n  \n  // Clean up underscores if we fell back to the key\n  if (text === key && key.includes('_')) {\n    text = key.replace(/_/g, ' ');\n  }",
    "let text = translations[lang]?.[key] || translations['English'][key];\n  if (!text) return undefined;"
)

with open('src/translations.ts', 'w') as f:
    f.write(t)
