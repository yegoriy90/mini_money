// Завантажує кліпи голосу: node tools/fetch_voice.js urls.json
// urls.json — { "<key>": "<свіжий url з Magnific creations_get>" }; пише audio/voice/<key>.mp3 і оновлює index.js
// (curl, бо вбудований fetch у Node не ходить через проксі середовища)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const urls = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const dir = path.join(__dirname, '../audio/voice');
let ok = 0;
for (const [key, url] of Object.entries(urls)) {
  try { execFileSync('curl', ['-sSf', '-o', path.join(dir, key + '.mp3'), url]); ok++; console.log('✓', key); }
  catch { console.error('✗', key); }
}
const all = fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
fs.writeFileSync(path.join(dir, 'index.js'), `// Генерує tools/fetch_voice.js: ключі фраз, для яких є mp3.\nexport const VOICE = new Set(${JSON.stringify(all)});\n`);
console.log(`готово: ${ok}, усього кліпів: ${all.length}`);
