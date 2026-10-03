const fs = require('fs');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace fa-crown with fa-square-plus
  content = content.replace(/fa-crown/g, 'fa-square-plus');
  
  // Replace Moro Premium with Moro Plus
  content = content.replace(/Moro Premium/g, 'Moro Plus');
  content = content.replace(/MORO PREMIUM/g, 'MORO PLUS');
  content = content.replace(/Moro premium/g, 'Moro Plus');
  content = content.replace(/moro premium/g, 'moro plus');
  content = content.replace(/Premium/g, 'Plus');
  content = content.replace(/PREMIUM/g, 'PLUS');
  content = content.replace(/premium/g, 'plus');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

replaceInFile('App.tsx');
replaceInFile('src/translations.ts');
console.log('Done replacing');
