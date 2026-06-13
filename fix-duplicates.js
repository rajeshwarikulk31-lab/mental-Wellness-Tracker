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
      
      const lines = content.split('\n');
      let reactImportCount = 0;
      const newLines = [];
      
      for (const line of lines) {
        if (line.includes("from 'react';") || line.includes('from "react";')) {
           if (line.includes("import React from 'react';") || line.includes('import React from "react";')) {
               reactImportCount++;
               if (reactImportCount > 1) continue; // Skip duplicate pure React import
           } else if (line.includes("import React,")) {
               reactImportCount++;
           }
        }
        newLines.push(line);
      }
      
      // If we skipped lines, we might still have duplicates if `import React,` came after `import React from 'react';`
      // So let's just do a simpler replacement: remove `import React from 'react';` if `import React,` exists.
      content = fs.readFileSync(p, 'utf8');
      if (content.includes("import React,") && content.includes("import React from 'react';")) {
          content = content.replace(/import React from 'react';\r?\n?/g, '');
      } else if (content.match(/import React from 'react';/g)?.length > 1) {
          content = content.replace("import React from 'react';\n", ""); // Remove one
      }
      
      fs.writeFileSync(p, content);
    }
  }
}

replace('./src');
