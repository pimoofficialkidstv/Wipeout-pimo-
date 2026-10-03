import fs from 'fs';
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

const target = `interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}`;

const replace = `interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  groundingChunks?: { uri: string; title: string }[];
}`;

if (code.includes(target)) {
  fs.writeFileSync('components/AIAssistant.tsx', code.replace(target, replace));
  console.log("Success");
} else {
  console.log("Target not found");
}
