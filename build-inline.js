const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf-8');
const css = fs.readFileSync('src/styles/main.css', 'utf-8');
const js = fs.readFileSync('dist/main.js', 'utf-8');

let output = html
    .replace('<link rel="stylesheet" href="src/styles/main.css">', `<style>\n${css}\n</style>`)
    .replace('<script type="module" src="dist/main.js"></script>', `<script type="module">\n${js}\n</script>`);

fs.writeFileSync('dist/index.html', output);
console.log('Built inline HTML: dist/index.html (' + (output.length / 1024).toFixed(1) + ' KB)');
