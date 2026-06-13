const fs = require('fs');
const path = require('path');

function replace(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      replace(p);
    } else if (p.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      content = content.replace(/: React\.JSX\.Element/g, '');
      content = content.replace(/: JSX\.Element/g, '');
      fs.writeFileSync(p, content);
    }
  }
}

replace('./src');
