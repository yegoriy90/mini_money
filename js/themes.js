// Теми оформлення. Персонажі — спрощені власні малюнки «за мотивами», без офіційної графіки.

const KITTY = `<svg viewBox="0 0 120 112" aria-hidden="true"><g stroke="#2b2233" stroke-width="3.5" stroke-linejoin="round">
<path d="M22 44 L17 9 L50 28 Z" fill="#fff"/><path d="M98 44 L103 9 L70 28 Z" fill="#fff"/>
<ellipse cx="60" cy="66" rx="51" ry="41" fill="#fff"/></g>
<g transform="translate(88 22)" stroke="#2b2233" stroke-width="3" stroke-linejoin="round">
<path d="M0 0 L-24 -15 Q-31 0 -24 15 Z" fill="#ff4d7d"/><path d="M0 0 L24 -15 Q31 0 24 15 Z" fill="#ff4d7d"/>
<circle r="7.5" fill="#ff4d7d"/></g>
<ellipse cx="40" cy="67" rx="4.6" ry="6.6" fill="#2b2233"/><ellipse cx="80" cy="67" rx="4.6" ry="6.6" fill="#2b2233"/>
<ellipse cx="60" cy="78" rx="6.5" ry="4.6" fill="#ffd23f" stroke="#2b2233" stroke-width="2.5"/>
<g stroke="#2b2233" stroke-width="3" stroke-linecap="round"><path d="M3 60 L24 65"/><path d="M1 73 L23 73"/><path d="M4 86 L24 80"/>
<path d="M117 60 L96 65"/><path d="M119 73 L97 73"/><path d="M116 86 L96 80"/></g></svg>`;

const KUROMI = `<svg viewBox="0 0 120 116" aria-hidden="true">
<path d="M24 80 C12 54 6 24 12 4 C28 16 40 26 48 30 C56 27 64 27 72 30 C80 26 92 16 108 4 C114 24 108 54 96 80 C92 108 28 108 24 80 Z" fill="#2b2233"/>
<circle cx="104" cy="12" r="7" fill="#ff8fc7"/><circle cx="104" cy="12" r="2.6" fill="#ffd23f"/>
<ellipse cx="60" cy="80" rx="31" ry="25" fill="#fff"/>
<g transform="translate(60 46)"><circle r="10" fill="#ff8fc7"/><rect x="-6" y="6" width="12" height="6" rx="2" fill="#ff8fc7"/>
<circle cx="-3.6" cy="-1" r="2.6" fill="#2b2233"/><circle cx="3.6" cy="-1" r="2.6" fill="#2b2233"/>
<path d="M-3 8 V12 M0 8 V12 M3 8 V12" stroke="#2b2233" stroke-width="1.2"/></g>
<ellipse cx="47" cy="80" rx="4.4" ry="6.4" fill="#2b2233"/><ellipse cx="73" cy="80" rx="4.4" ry="6.4" fill="#2b2233"/>
<path d="M41 73 L37 69 M79 73 L83 69" stroke="#2b2233" stroke-width="2.4" stroke-linecap="round"/>
<ellipse cx="60" cy="88" rx="3.4" ry="2.6" fill="#ff8fc7"/>
<path d="M54 94 Q60 99 66 94" fill="none" stroke="#2b2233" stroke-width="2.4" stroke-linecap="round"/></svg>`;

const emoji = e => `<span class="emoji-mascot" aria-hidden="true">${e}</span>`;

export const THEMES = {
  kitty: {
    title: 'Кітті й Куромі', preview: '🎀💜',
    mascots: [KITTY, KUROMI],
    jarArt: { spend: KITTY, save: KUROMI, give: emoji('💝') },
    color: '#ff5fa2',
    celeVideo: '', // assets/cele-kitty.mp4 — анімація святкування (Magnific), коли файл додано
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

export function theme(id) { return THEMES[id] || THEMES.kitty; }
