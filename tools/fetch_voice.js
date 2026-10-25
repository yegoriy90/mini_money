// Завантажує кліпи голосу: node tools/fetch_voice.js urls.json
// urls.json — { "<key>": "<свіжий url з Magnific creations_get>" }; пише audio/voice/<key>.mp3 і оновлює index.js
const fs = require('fs'), path = require('path');
(async () => {
  const urls = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const dir = path.join(__dirname, '../audio/voice');
  const ok = [];
  for (const [key, url] of Object.entries(urls)) {
    const r = await fetch(url);
    if (!r.ok) { console.error('✗', key, r.status); continue; }
    fs.writeFileSync(path.join(dir, key + '.mp3'), Buffer.from(await r.arrayBuffer()));
    ok.push(key); console.log('✓', key);
  }
  const all = fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
  fs.writeFileSync(path.join(dir, 'index.js'), `// Генерує tools/fetch_voice.js: ключі фраз, для яких є mp3.\nexport const VOICE = new Set(${JSON.stringify(all)});\n`);
  console.log(`готово: ${ok.length}, усього кліпів: ${all.length}`);
})();
