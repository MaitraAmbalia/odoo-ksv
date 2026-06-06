const fs = require('fs');
const path = require('path');
const dir = './src/controllers';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.ts')) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    content = content.replace(/req\.params\.([a-zA-Z0-9_]+)/g, '(req.params.$1 as string)');
    fs.writeFileSync(path.join(dir, file), content);
  }
});
