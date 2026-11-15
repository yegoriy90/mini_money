// Компаньйони: дитина обирає друга, і від нього залежить оформлення (колір фону, кнопок, навігації).
// Флопі й Мусі — за улюбленими іграшками Мії; решта — власні оригінальні плюшеві герої (Magnific).
// Картинки: assets/heroes/<img>.webp (повний зріст) і <img>-avatar.webp (квадратний аватар з усією головою — tools/make_avatars.py), прозорий фон.

const img = (src, cls = '') => `<img class="hero-img ${cls}" src="${src}" alt="" draggable="false">`;

// Друзі ростуть разом з дитиною: age — вікова група (AGE_GROUPS у library.js).
// 4–5 — плюшеві іграшки, 6–7 — мультяшні мандрівники зі своєю справою, 8–10 — герої-підлітки (стилізований 3D як в іграх).
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
  { id: 'slidyk', age: '6-7', name: 'Слідик', who: 'динозаврик-дослідник', img: 'slidyk', color: '#4fb35e', light: '#9ed5a6', deep: '#42964f' },
  { id: 'farbka', age: '6-7', name: 'Фарбка', who: 'зайчиха-художниця', img: 'farbka', color: '#f07aa8', light: '#f7b6cf', deep: '#ca668d' },
  { id: 'yunha', age: '6-7', name: 'Юнга', who: 'єнот-пірат', img: 'yunha', color: '#a8743e', light: '#cfb395', deep: '#8d6134' },
  { id: 'bulka', age: '6-7', name: 'Булька', who: 'видра-дайверка', img: 'bulka', color: '#1fb3ad', light: '#84d5d2', deep: '#1a9691' },
  { id: 'ryatko', age: '6-7', name: 'Рятко', who: 'ведмедик-рятувальник', img: 'ryatko', color: '#e8463c', light: '#f29994', deep: '#c33b32' },
  { id: 'rosynka', age: '6-7', name: 'Росинка', who: 'оленятко-фея', img: 'rosynka', color: '#b48be8', light: '#d6c3f2', deep: '#9775c3' },
  { id: 'syrnyk', age: '6-7', name: 'Сирник', who: 'мишеня-лицар', img: 'syrnyk', color: '#4f6fd8', light: '#9eb0ea', deep: '#425db5' },
  { id: 'pyrizhok', age: '6-7', name: 'Пиріжок', who: 'пінгвін-кухар', img: 'pyrizhok', color: '#f59a2b', light: '#fac78a', deep: '#ce8124' },
  { id: 'boltyk', age: '6-7', name: 'Болтик', who: 'песик-робот', img: 'boltyk', color: '#3fa5e6', light: '#95cef1', deep: '#358bc1' },
  // 8–10: круті друзі — герої-підлітки в стилі ігрових персонажів
  { id: 'bit', age: '8-10', name: 'Біт', who: 'робот-напарник', img: 'bit', color: '#1fb5d6', light: '#8de2f2', deep: '#0b92b3' },
  { id: 'tin', age: '8-10', name: 'Тінь', who: 'кіт-ніндзя', img: 'tin', color: '#e5484d', light: '#ff9a9d', deep: '#c2272d' },
  { id: 'miksi', age: '8-10', name: 'Міксі', who: 'панда-діджейка', img: 'miksi', color: '#9f7aea', light: '#cbb5ff', deep: '#7c55d6' },
  { id: 'yaryi', age: '8-10', name: 'Ярий', who: 'дракон', img: 'yaryi', color: '#2fa86b', light: '#8dcfae', deep: '#278d5a' },
  { id: 'lupa', age: '8-10', name: 'Лупа', who: 'лисиця-детективка', img: 'lupa', color: '#c9773a', light: '#e1b493', deep: '#a96431' },
  { id: 'flip', age: '8-10', name: 'Фліп', who: 'єнот-скейтер', img: 'flip', color: '#1f9e9a', light: '#84cac7', deep: '#1a8581' },
  { id: 'bryz', age: '8-10', name: 'Бриз', who: 'акула-серферка', img: 'bryz', color: '#ff6f61', light: '#ffb0a8', deep: '#d65d51' },
  { id: 'sirko', age: '8-10', name: 'Сірко', who: 'вовк-футболіст', img: 'sirko', color: '#6fb52a', light: '#b0d68a', deep: '#5d9823' },
  { id: 'piksel', age: '8-10', name: 'Піксель', who: 'кішка-дизайнерка', img: 'piksel', color: '#e85fb0', light: '#f2a7d4', deep: '#c35094' },
  { id: 'zhar', age: '8-10', name: 'Жар', who: 'фенікс', img: 'zhar', color: '#f2542d', light: '#f8a18c', deep: '#cb4726' },
  { id: 'kosmo', age: '8-10', name: 'Космо', who: 'прибулець-дослідник', img: 'kosmo', color: '#8f6ee8', light: '#c1aff2', deep: '#785cc3' },
  { id: 'atom', age: '8-10', name: 'Атом', who: 'сова-вчена', img: 'atom', color: '#4f9e3a', light: '#9eca93', deep: '#428531' },
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
    // скарбнички — у стилі вікової групи друга: assets/jars/<вік>-<скарбничка>.webp
    jarArt: Object.fromEntries(['spend', 'save', 'give'].map(j => [j, `<img class="jar-img" src="assets/jars/${c.age}-${j}.webp" alt="" draggable="false">`])),
    // відео святкування є лише з Флопі й Мусі
    celeVideo: c.id === 'flopi' || c.id === 'musi' ? 'assets/cele-heroes.mp4' : null,
  };
}

// кольори теми — CSS-змінні на <html>
export function applyColors(id) {
  const c = companion(id), r = document.documentElement.style;
  r.setProperty('--tab', c.color); r.setProperty('--tab-2', c.light); r.setProperty('--tab-deep', c.deep);
}
