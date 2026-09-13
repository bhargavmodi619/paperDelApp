/* Folds src/ back into a single, dependency-free paper-round.html.
 *
 * The modules exist so the code is navigable; this script exists so the
 * zero-dependency, no-server, double-click-it-open property survives the
 * split. It is plain Node with no packages: `npm run build`.
 *
 * It works because every module is nothing but top-level `var`/`function`
 * declarations plus import/export lines. Strip those lines, concatenate the
 * modules in dependency order inside one IIFE, and you get the original
 * program back.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const ENTRY = path.join(SRC, 'main.js');
const OUT = path.join(ROOT, 'paper-round.html');

const read = f => fs.readFileSync(f, 'utf8');

/* Depth-first walk of the import graph, deepest dependency emitted first. */
function order(entry){
  const seen = new Set(), out = [];
  (function visit(file){
    const key = path.resolve(file);
    if (seen.has(key)) return;
    seen.add(key);
    const src = read(key);
    for (const m of src.matchAll(/^import\s[^'"]*['"](\.[^'"]+)['"]/gm)) {
      visit(path.resolve(path.dirname(key), m[1]));
    }
    out.push(key);
  })(entry);
  return out;
}

/* Drop the module plumbing; keep every declaration exactly as written. */
function strip(src){
  return src
    .split('\n')
    .filter(l => !/^import\s/.test(l))
    .filter(l => !/^export\s*\{[^}]*\}\s*;?\s*$/.test(l))
    .filter(l => !/^\s*["']use strict["'];\s*$/.test(l))
    .join('\n')
    .replace(/^export\s+/gm, '')
    .trim();
}

const files = order(ENTRY);
const banner = files.map(f => ' *   ' + path.relative(ROOT, f).replace(/\\/g, '/')).join('\n');

const body = files
  .map(f => '/* ---- ' + path.relative(SRC, f).replace(/\\/g, '/') + ' ---- */\n' + strip(read(f)))
  .join('\n\n');

const css = read(path.join(SRC, 'styles.css')).trim();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Paper Round</title>
<style>
${css}
</style>
</head>
<body>
<div id="wrap"><canvas id="game"></canvas></div>
<script>
/* GENERATED FILE — do not edit. Built from:
${banner}
 * Edit those and re-run: npm run build
 */
(function(){
"use strict";

${body}

})();
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
const lines = html.split('\n').length;
console.log('built paper-round.html  (' + files.length + ' modules, ' + lines + ' lines)');
