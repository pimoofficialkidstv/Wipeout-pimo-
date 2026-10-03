import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const target = `          temperature: 0.7,
        }
      });

      res.json({ text: response.text });`;

const replace = `          temperature: 0.7,
          tools: [{ googleSearch: {} }],
        }
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const webChunks = chunks.map(c => c.web).filter(Boolean);

      res.json({ 
        text: response.text,
        groundingChunks: webChunks 
      });`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replace));
  console.log("Success");
} else {
  console.log("Target not found");
}
