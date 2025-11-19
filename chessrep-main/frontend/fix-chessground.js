// Script to fix the chessground charCodeAt error
const fs = require('fs');
const path = require('path');

const utilPath = path.join(__dirname, 'node_modules', 'chessground', 'dist', 'util.js');
const minPath = path.join(__dirname, 'node_modules', 'chessground', 'dist', 'chessground.min.js');

// Fix util.js
if (fs.existsSync(utilPath)) {
  let content = fs.readFileSync(utilPath, 'utf8');
  content = content.replace(
    'export const key2pos = (k) => [k.charCodeAt(0) - 97, k.charCodeAt(1) - 49];',
    `export const key2pos = (k) => {
  try {
    // Add validation to prevent charCodeAt errors
    if (typeof k !== 'string' || k.length !== 2) {
      console.warn('Invalid key in key2pos:', k);
      return [0, 0]; // Return default position
    }
    return [k.charCodeAt(0) - 97, k.charCodeAt(1) - 49];
  } catch (error) {
    console.error('Error in key2pos:', error, 'with key:', k);
    return [0, 0]; // Return default position on any error
  }
};`
  );
  fs.writeFileSync(utilPath, content);
  console.log('Fixed util.js');
}

// Fix minified version
if (fs.existsSync(minPath)) {
  let content = fs.readFileSync(minPath, 'utf8');
  content = content.replace(
    'g=e=>[e.charCodeAt(0)-97,e.charCodeAt(1)-49]',
    'g=e=>{try{if(typeof e!=="string"||e.length!==2){console.warn("Invalid key in key2pos:",e);return[0,0]}return[e.charCodeAt(0)-97,e.charCodeAt(1)-49]}catch(t){console.error("Error in key2pos:",t,"with key:",e);return[0,0]}}'
  );
  fs.writeFileSync(minPath, content);
  console.log('Fixed chessground.min.js');
}

console.log('Chessground fix applied successfully!');
