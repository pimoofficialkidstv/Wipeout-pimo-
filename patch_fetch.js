import fs from 'fs';
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

const target = `      const data = await response.json();
      const reply = data.text?.trim() || getLocalSmartResponse(text);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: Date.now() }]);
      playMoroVoice(reply);`;

const replace = `      const data = await response.json();
      const reply = data.text?.trim() || getLocalSmartResponse(text);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: reply, 
        timestamp: Date.now(),
        groundingChunks: data.groundingChunks 
      }]);
      playMoroVoice(reply);`;

if (code.includes(target)) {
  fs.writeFileSync('components/AIAssistant.tsx', code.replace(target, replace));
  console.log("Success");
} else {
  console.log("Target not found");
}
