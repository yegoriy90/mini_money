// Компаньйони: дитина обирає друга, і від нього залежить оформлення (колір фону, кнопок, навігації).
// Флопі й Мусі — за улюбленими іграшками Мії; решта — власні оригінальні плюшеві герої (Magnific).
// Картинки: assets/heroes/<img>.webp (повний зріст) і <img>-avatar.webp (квадратний аватар з усією головою — tools/make_avatars.py), прозорий фон.

const emoji = e => `<span class="emoji-mascot" aria-hidden="true">${e}</span>`;
const img = (src, cls = '') => `<img class="hero-img ${cls}" src="${src}" alt="" draggable="false">`;

// Друзі ростуть разом з дитиною: age — вікова група (AGE_GROUPS у library.js).
// 4–5 — плюшеві іграшки, 6–7 — мультяшні мандрівники зі своєю справою, 8–10 — стильні вінілові фігурки.
// color — основний колір теми, light — світліший, deep — для кнопок і акцентів
export const COMPANIONS = [
  { id: 'flopi', name: 'Флопі', who: 'зайчик', img: 'flopi', color: '#a98bf0', light: '#d2c2ff', deep: '#8263e0' },
  { id: 'musi', name: 'Мусі', who: 'мавпочка', img: 'monkey', color: '#ff6fae', light: '#ffa9d1', deep: '#e5408a' },
  { id: 'leo', name: 'Лео', who: 'левеня', img: 'leo', color: '#ffad1f', light: '#ffd877', deep: '#e98c00' },
  { id: 'dino', name: 'Дінчик', who: 'динозаврик', img: 'dino', color: '#3fbf6f', light: '#93e3ad', deep: '#209e53' },
  { id: 'pingo', name: 'Пінго', who: 'пінгвіня', img: 'pingo', color: '#3fb0f2', light: '#95d6ff', deep: '#1a8dd4' },
  { id: 'bublik', name: 'Бублик', who: 'ведмедик', img: 'bublik', color: '#e98d57', light: '#ffc49b', deep: '#c96a32' },
  { id: 'rusia', name: 'Руся', who: 'лисичка', img: 'rusia', color: '#ff6b57', light: '#ffa595', deep: '#e0463a' },
  { id: 'zirka', name: 'Зірка', who: 'єдиноріжка', img: 'zirka', color: '#e47ad8', light: '#ffb8f3', deep: '#c455b8' },
  { id: 'mur', name: 'Мур', who: 'котик', img: 'mur', color: '#7d8bf7', light: '#b9c1ff', deep: '#5a68e3' },
  { id: 'bambu', name: 'Бамбу', who: 'панда', img: 'bambu', color: '#2fc4ad', light: '#8ae8d8', deep: '#13a18c' },
  { id: 'khvylia', name: 'Хвиля', who: 'акуленя', img: 'khvylia', color: '#3b7cec', light: '#93b9ff', deep: '#1f5ccd' },
  { id: 'iskra', name: 'Іскра', who: 'дракончик', img: 'iskra', color: '#7a52e6', light: '#b49dff', deep: '#5b36c8' },
  // 6–7: команда мандрівників
  { id: 'mapka', age: '6-7', name: 'Мапка', who: 'лисичка-мандрівниця', img: 'mapka', color: '#f08a3c', light: '#ffc08f', deep: '#d0661b' },
  { id: 'zoryk', age: '6-7', name: 'Зорик', who: 'котик-космонавт', img: 'zoryk', color: '#5b8def', light: '#a9c4ff', deep: '#3a6ad6' },
  { id: 'kmitka', age: '6-7', name: 'Кмітка', who: 'совеня-винахідниця', img: 'kmitka', color: '#2aa69a', light: '#86ddd3', deep: '#13857a' },
  // 8–10: круті друзі
  { id: 'bit', age: '8-10', name: 'Біт', who: 'робот-напарник', img: 'bit', color: '#1fb5d6', light: '#8de2f2', deep: '#0b92b3' },
  { id: 'tin', age: '8-10', name: 'Тінь', who: 'кіт-ніндзя', img: 'tin', color: '#e5484d', light: '#ff9a9d', deep: '#c2272d' },
  { id: 'miksi', age: '8-10', name: 'Міксі', who: 'панда-діджейка', img: 'miksi', color: '#9f7aea', light: '#cbb5ff', deep: '#7c55d6' },
].map(c => ({ age: '4-5', ...c }));
export const COMPANION_AGES = ['4-5', '6-7', '8-10'];
export const ageIndex = a => Math.max(0, COMPANION_AGES.indexOf(a));
const BY_ID = Object.fromEntries(COMPANIONS.map(c => [c.id, c]));

// Для сумісності: колись було поле theme = 'toys' | 'kitty' | 'space' | 'forest'
const LEGACY = { toys: 'flopi', kitty: 'flopi', space: 'iskra', forest: 'rusia' };
export function themeId(id) { return BY_ID[id] ? id : (LEGACY[id] || 'flopi'); }
export function companion(id) { return BY_ID[themeId(id)]; }

// ім'я, яке дала дитина (settings.friendNames), інакше — стандартне
export const friendName = (c, s) => (s?.friendNames?.[c.id] || '').trim() || c.name;

export const heroFull = c => img(`assets/heroes/${c.img}.webp`, c.id);
export const heroHead = c => img(`assets/heroes/${c.img}-avatar.webp`, `${c.id} head`);

// Усе, що потрібно екранам, з обраного компаньйона
export function theme(id) {
  const c = companion(id);
  return {
    ...c,
    title: c.name, preview: heroHead(c),
    mascots: [heroHead(c)], full: [heroFull(c)],
    jarArt: { spend: emoji('🛍️'), save: heroHead(c), give: emoji('💝') },
    // відео святкування є лише з Флопі й Мусі
    celeVideo: c.id === 'flopi' || c.id === 'musi' ? 'assets/cele-heroes.mp4' : null,
  };
}

// кольори теми — CSS-змінні на <html>
export function applyColors(id) {
  const c = companion(id), r = document.documentElement.style;
  r.setProperty('--tab', c.color); r.setProperty('--tab-2', c.light); r.setProperty('--tab-deep', c.deep);
}
