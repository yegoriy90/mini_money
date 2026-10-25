// Рендерить стартовий кадр для відео-анімацій персонажів: node tools/mascot_frame.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const { THEMES } = await import(path.join(__dirname, '../js/themes.js'));
  const [kitty, kuromi] = THEMES.kitty.mascots;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  await p.setContent(`<style>html,body{margin:0}body{width:1024px;height:1024px;display:flex;align-items:center;justify-content:center;gap:40px;
    background:radial-gradient(circle at 50% 45%,#fff6fb 0,#ffd9ea 70%,#ffc3dd 100%)}div{width:400px;height:380px}svg{width:100%;height:100%}</style>
    <div>${kitty}</div><div>${kuromi}</div>`);
  await p.screenshot({ path: path.join(__dirname, '../assets/mascots-frame.png') });
  await b.close();
})();
