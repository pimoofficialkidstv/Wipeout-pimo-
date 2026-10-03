const fs = require('fs');
const code = fs.readFileSync('components/Game.tsx', 'utf8');

let lines = code.split('\n');
let currentDepth = 0;
let inString = false;
let stringChar = '';
for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines[i].length; j++) {
        let char = lines[i][j];
        if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
        } else if (inString && char === stringChar && lines[i][j-1] !== '\\') {
            inString = false;
        } else if (!inString) {
            if (char === '{') currentDepth++;
            if (char === '}') currentDepth--;
        }
    }
    if (i > 300 && currentDepth < 2 && currentDepth > -5) {
        console.log(`Depth dropped to ${currentDepth} at line ${i + 1}: ${lines[i]}`);
    }
}
