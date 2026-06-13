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
      
      // Remove any React import from components/hooks imports
      content = content.replace(/import React, { (.*?) } from "(@\/.*?)";/g, 'import { $1 } from "$2";');
      
      // Find `import React from 'react';` that has another React import right after it
      content = content.replace(/import React from 'react';\s*import React,/gm, 'import React,');
      
      fs.writeFileSync(p, content);
    }
  }
}

replace('./src');
