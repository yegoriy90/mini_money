// Генерує PNG-іконки з icons/icon.svg: node tools/make_icons.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, '../icons/icon.svg'), 'utf8');
  const b = await chromium.launch();
  for (const [name, size, pad] of [['apple-touch-icon.png', 180, 0], ['icon-192.png', 192, 0], ['icon-512.png', 512, 0]]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<style>html,body{margin:0;background:#ff5fa2}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
    await p.screenshot({ path: path.join(__dirname, '../icons', name) });
  }
  await b.close();
})();
