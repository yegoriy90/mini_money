// Теми оформлення. Головні герої — Флопі й Мавпочка (за улюбленими іграшками Мії, згенеровані 3D-фото).

const emoji = e => `<span class="emoji-mascot" aria-hidden="true">${e}</span>`;
const img = (src, cls = '') => `<img class="hero-img ${cls}" src="${src}" alt="" draggable="false">`;

// Імена героїв — в одному місці, щоб легко перейменувати
export const HEROES = { bunny: 'Флопі', monkey: 'Мавпочка' };
const FLOPI = img('assets/heroes/flopi.webp', 'bunny'), MONKEY = img('assets/heroes/monkey.webp', 'monkey');
const FLOPI_HEAD = img('assets/heroes/flopi-head.webp', 'bunny head'), MONKEY_HEAD = img('assets/heroes/monkey-head.webp', 'monkey head');

export const THEMES = {
  toys: {
    title: `${HEROES.bunny} й ${HEROES.monkey}`, preview: '🐰🐵',
    mascots: [FLOPI_HEAD, MONKEY_HEAD], full: [FLOPI, MONKEY],
    jarArt: { spend: FLOPI_HEAD, save: MONKEY_HEAD, give: emoji('💝') },
    color: '#ff5fa2',
    celeVideo: 'assets/cele-heroes.mp4', // анімація святкування (Magnific, MiniMax H3), постер — .jpg
  },
  space: {
    title: 'Космос', preview: '🚀🪐',
    mascots: [emoji('🚀'), emoji('👽')],
    jarArt: { spend: emoji('🚀'), save: emoji('🪐'), give: emoji('🌟') },
    color: '#1b2456',
  },
  forest: {
    title: 'Лісові друзі', preview: '🦊🐻',
    mascots: [emoji('🦊'), emoji('🐻')],
    jarArt: { spend: emoji('🦊'), save: emoji('🐿️'), give: emoji('🌻') },
    color: '#3f8f5b',
  },
};

// стара тема 'kitty' (до App Store) → нова з героями
export function themeId(id) { return THEMES[id] ? id : 'toys'; }
export function theme(id) { return THEMES[themeId(id)]; }
