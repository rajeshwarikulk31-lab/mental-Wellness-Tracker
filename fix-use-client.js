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
      if (content.includes('"use client";')) {
        content = content.replace("import React from 'react';\n", "");
        content = content.replace('"use client";', '"use client";\nimport React from \'react\';\n');
        fs.writeFileSync(p, content);
      }
    }
  }
}

replace('./src');
