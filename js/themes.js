// Компаньйони: дитина обирає друга, і від нього залежить оформлення (колір фону, кнопок, навігації).
// Флопі й Мусі — за улюбленими іграшками Мії; решта — власні оригінальні плюшеві герої (Magnific).
// Картинки: assets/heroes/<img>.webp (повний зріст) і <img>-avatar.webp (квадратний аватар з усією головою — tools/make_avatars.py), прозорий фон.

const emoji = e => `<span class="emoji-mascot" aria-hidden="true">${e}</span>`;
const img = (src, cls = '') => `<img class="hero-img ${cls}" src="${src}" alt="" draggable="false">`;

// color — основний колір теми, light — світліший (верх градієнта), deep — для кнопок і акцентів
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
];
const BY_ID = Object.fromEntries(COMPANIONS.map(c => [c.id, c]));

// Для сумісності: колись було поле theme = 'toys' | 'kitty' | 'space' | 'forest'
const LEGACY = { toys: 'flopi', kitty: 'flopi', space: 'iskra', forest: 'rusia' };
export function themeId(id) { return BY_ID[id] ? id : (LEGACY[id] || 'flopi'); }
export function companion(id) { return BY_ID[themeId(id)]; }

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
