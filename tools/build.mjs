// Builds the app from src/template.html + data/*.geojson.
//   dist/artifact.html  – page fragment (published as a Claude artifact; the host adds <html>/<head>/<body>)
//   index.html          – standalone page for GitHub Pages or any static host
// Usage: node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');

const land = JSON.stringify(JSON.parse(read('data/land.geojson')));
const london = JSON.stringify(JSON.parse(read('data/london-boroughs.geojson')));
const fragment = read('src/template.html')
  .replace('/*@LAND@*/null', () => land)
  .replace('/*@LONDON@*/null', () => london);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/artifact.html'), fragment);

const PAGES_URL = 'https://mdklab.github.io/UK-happiest-places-2026/';
const [head, body] = fragment.split('<!--/head-->');
const page = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#eef2f3">
<meta property="og:type" content="website">
<meta property="og:title" content="Карта счастья Британии 2026">
<meta property="og:description" content="25 самых счастливых и 25 самых несчастливых мест Великобритании по индексу Rightmove Happy at Home 2026 на интерактивной карте.">
<meta property="og:image" content="${PAGES_URL}telegram.png">
<meta property="og:url" content="${PAGES_URL}">
<meta name="twitter:card" content="summary_large_image">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
${head.trim()}
</head>
<body>
${body.trim()}
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), page);
console.log(`dist/artifact.html ${(fragment.length / 1024).toFixed(1)} KB, index.html ${(page.length / 1024).toFixed(1)} KB`);
