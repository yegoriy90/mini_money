// Збирає www/ для нативної обгортки (Capacitor): копіює застосунок і кладе Firebase SDK локально,
// щоб у застосунку з App Store нічого не вантажилось з CDN. Запуск: npm run build:www
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
const copy = rel => fs.cpSync(path.join(root, rel), path.join(out, rel), { recursive: true });
['index.html', 'manifest.webmanifest', 'css', 'js', 'audio', 'assets', 'icons'].forEach(copy);
// Firebase: CDN-збірки з npm, абсолютні імпорти gstatic → локальні
const FB_VER = '10.12.2';
const vend = path.join(out, 'vendor', 'firebase');
fs.mkdirSync(vend, { recursive: true });
for (const f of ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js']) {
  const src = fs.readFileSync(path.join(root, 'node_modules', 'firebase', f), 'utf8');
  fs.writeFileSync(path.join(vend, f), src.split(`https://www.gstatic.com/firebasejs/${FB_VER}/`).join('./'));
}
// без service worker у нативі (там він не потрібен і не працює на capacitor://)

console.log('www готово:', fs.readdirSync(out).join(', '));
