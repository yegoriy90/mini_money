import { LIBRARY, AGE_GROUPS, TASK_ICONS, WISH_ICONS } from './library.js';
import {
  JARS, JAR_META, DEFAULT_SETTINGS, withDefaults, dayKey, addDays, unitK, toK, fromK, num, money, moneyFull,
  balances, total, taskState, currentStreak, approveOps, buyOps, randomCode, uid, hashPin, vocative, plural, hearts, isDaily,
} from './model.js';
import { openStore, cloudAvailable, createCloudFamily, cloudFamilyExists, migrateToCloud } from './store.js';
import { THEMES, theme } from './themes.js';
import { speak, sound, confetti } from './fx.js';

const $app = document.getElementById('app');
const $modal = document.getElementById('modal');
const PIN_SALT = 'mini-money';

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const S = {
  device: LS.get('mm.device', null), // { fid, role: 'child' | 'parent' }
  store: null, unwatch: null, data: null, error: null,
  view: 'tasks', // дитячі екрани: tasks | dreams | progress
  parent: false, // батьківський режим, відкритий PIN-кодом на дитячому пристрої
  preview: false, // батьківський пристрій дивиться дитячий екран
  ptab: 'approve',
  ob: { step: 'welcome' },
  celebrated: LS.get('mm.celebrated', null),
};
let M = {}; // стан відкритого вікна

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const st = () => S.data.settings;
const isF = () => st().gender !== 'm';
const isParentView = () => !!S.device && (S.parent || (S.device.role === 'parent' && !S.preview));
const wishJar = w => (st().jarsEnabled ? (w.jar || 'save') : 'spend');

// ---------- запуск ----------
async function connect() {
  if (S.unwatch) S.unwatch();
  S.data = null;
  render();
  try {
    S.store = await openStore(S.device.fid);
    S.unwatch = S.store.watch(onData, err => { S.error = 'Немає доступу до даних: ' + err.message; render(); });
  } catch (e) {
    S.error = 'Не вдалося підключитися: ' + e.message;
    render();
  }
}

function onData(state) {
  S.data = { ...state, settings: state.settings ? withDefaults(state.settings) : null, rawSettings: state.settings };
  S.error = null;
  if (state.settings && state.settings.heartsSince == null && !S.migratingHearts) {
    S.migratingHearts = true;
    db([{ op: 'update', col: 'meta', id: 'settings', data: { heartsSince: Date.now() } }]);
  }
  render();
  checkCelebrate();
}

function render() {
  if (!S.device) return renderOnboarding();
  if (S.error && !S.data) { $app.innerHTML = `<div class="center-screen"><div class="card pad"><p>${esc(S.error)}</p><button class="btn" data-a="retry">Спробувати ще</button> <button class="btn ghost" data-a="forget-device">Від'єднати пристрій</button></div></div>`; return; }
  if (!S.data?.ready) { $app.innerHTML = `<div class="center-screen"><div class="loader">🪙</div></div>`; return; }
  if (!S.data.rawSettings) { S.device = null; LS.del('mm.device'); return renderOnboarding(); }
  document.documentElement.dataset.theme = st().theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme(st().theme).color);
  $app.innerHTML = (S.error ? `<div class="banner">${esc(S.error)}</div>` : '') + (isParentView() ? renderParent() : renderKid());
}

// ---------- монетки ----------
function coinIcon() { return `<i class="coin${st().currency === 'uah' ? ' uah' : ''}"></i>`; }
function coins(k, max = 5) {
  if (!k) return `<span class="coins free">⭐</span>`; // звичка без монеток
  const n = fromK(k, st());
  if (st().currency === 'coins' && Number.isInteger(n) && n > 0 && n <= max) return `<span class="coins">${coinIcon().repeat(n)}</span>`;
  return `<span class="coins">${coinIcon()}<b>${num(n)}</b></span>`;
}
function capacity(bal) {
  const n = bal / unitK(st());
  let cap = st().currency === 'uah' ? 50 : 10;
  while (cap < n) cap *= 2;
  return cap * unitK(st());
}

// ---------- ДИТЯЧИЙ ЕКРАН ----------
function renderKid() {
  const s = st(), th = theme(s.theme);
  const bal = balances(S.data.ledger);
  const pending = S.data.completions.filter(c => c.status === 'pending').length;
  const views = { tasks: kidTasks, dreams: kidDreams, progress: kidProgress };
  return `<div class="kid">
    <header class="kid-top">
      <div class="mascot m1">${th.mascots[0]}</div>
      <div class="hello"><h1>Привіт, ${esc(s.childVoc || s.childName)}!</h1>
        <div class="sub">${new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
      <button class="total-pill" data-a="say-total">${coinIcon()}<b>${num(fromK(total(bal), s))}</b></button>
      <div class="mascot m2">${th.mascots[1]}</div>
    </header>
    <main class="kid-main">${views[S.view]()}</main>
    <nav class="kid-nav">
      ${navBtn('tasks', '🧹', 'Справи', pending)}
      ${navBtn('dreams', '⭐', 'Мрії')}
      ${navBtn('progress', '🏆', 'Успіхи')}
      ${S.device.role === 'parent'
        ? `<button class="nav-btn lock" data-a="exit-preview"><span>👨‍👩‍👧</span><small>Батьки</small></button>`
        : `<button class="nav-btn lock" data-hold="unlock" aria-label="Батьківський режим (утримуйте)"><span>🔒</span><small>Батьки</small><i class="hold-ring"></i></button>`}
    </nav>
  </div>`;
}
function navBtn(v, icon, label, badge) {
  return `<button class="nav-btn${S.view === v ? ' on' : ''}" data-a="kid-view" data-v="${v}"><span>${icon}</span><small>${label}</small>${badge ? `<em class="badge">⏳${badge}</em>` : ''}</button>`;
}

function jarsBlock(bal) {
  const s = st(), th = theme(s.theme);
  const jars = s.jarsEnabled ? JARS : ['spend'];
  return `<div class="jars n${jars.length}">${jars.map(j => {
    const pct = Math.min(100, bal[j] / capacity(bal[j]) * 100);
    return `<button class="jar jar-${j}" data-a="say-jar" data-j="${j}">
      <div class="jar-glass"><div class="jar-fill" style="height:${pct}%"></div><div class="jar-art">${th.jarArt[j]}</div></div>
      <div class="jar-amt">${coinIcon()}<b>${num(fromK(bal[j], s))}</b></div>
      <div class="jar-label">${s.jarsEnabled ? JAR_META[j].title : 'Скарбничка'}</div>
    </button>`;
  }).join('')}</div>`;
}

function mainWish() {
  const act = S.data.wishes.filter(w => w.status !== 'bought');
  return act.find(w => w.id === st().mainWishId) || act[0] || null;
}
function wishPic(w, cls = '') {
  return w.photo ? `<img class="wish-pic ${cls}" src="${w.photo}" alt="">` : `<div class="wish-pic emoji ${cls}">${w.emoji || '🎁'}</div>`;
}
function wishProgress(w, bal) {
  const have = Math.max(0, bal[wishJar(w)]);
  const pct = Math.min(100, have / w.price * 100);
  const left = w.price - have;
  return { pct, left, have, enough: left <= 0 };
}
// «💜 3 з 90 у Накопичити» — щоб було видно, з якої скарбнички збирається мрія
function wishHave(w, p) {
  const s = st(), j = wishJar(w);
  return `<div class="wish-have jar-${j}"><span class="dot"></span>${coinIcon()}<b>${num(fromK(p.have, s))}</b> з ${num(fromK(w.price, s))}${s.jarsEnabled ? `<small>у «${JAR_META[j].title}»</small>` : ''}</div>`;
}

function dreamCard(bal) {
  const w = mainWish();
  if (!w) return `<button class="dream-card empty" data-a="wish-new"><div class="big">⭐</div><b>Додай свою мрію!</b><small>Сфотографуй іграшку, на яку збираєш</small></button>`;
  const p = wishProgress(w, bal);
  return `<button class="dream-card" data-a="kid-view" data-v="dreams">
    ${wishPic(w)}
    <div class="dream-info"><small>Моя мрія</small><b>${esc(w.title || 'Мрія')}</b>
      <div class="bar"><i style="width:${p.pct}%"></i></div>
      ${wishHave(w, p)}
      <div class="dream-left">${p.enough ? '🎉 Вже можна купувати!' : `Ще ${coins(p.left, 3)}`}</div></div>
  </button>`;
}

function kidTasks() {
  const today = dayKey();
  const bal = balances(S.data.ledger);
  const rank = { open: 0, pending: 1, approved: 2 };
  const all = S.data.tasks.filter(t => t.active !== false)
    .map(t => ({ t, ts: taskState(t, S.data.completions, today) }))
    .sort((a, b) => rank[a.ts.status] - rank[b.ts.status]);
  const daily = all.filter(x => x.t.repeat === 'daily'), other = all.filter(x => x.t.repeat !== 'daily');
  const dailyDone = daily.filter(x => x.ts.status === 'approved').length;
  const otherDone = other.filter(x => x.ts.status === 'approved' || x.ts.approvedToday).length;
  const grid = list => `<div class="task-grid">${list.map(({ t, ts }) => taskCard(t, ts)).join('')}</div>`;
  return `<section class="summary">${jarsBlock(bal)}${dreamCard(bal)}</section>
    ${daily.length ? `<div class="sec-row"><h2 class="sec">Щоденні звички <span class="pill">${dailyDone} / ${daily.length}</span></h2>${heartsBar()}</div>${grid(daily)}` : ''}
    ${other.length ? `<h2 class="sec">Справи за монетки <span class="pill">${otherDone} / ${other.length}</span></h2>${grid(other)}` : ''}
    ${all.length ? '' : `<div class="empty-note">Мама чи тато ще не додали справ 🙂</div>`}`;
}

function heartsBar() {
  const h = hearts(S.data);
  return `<button class="hearts-bar" data-a="say-hearts" aria-label="Сердечка до монетки">
    ${Array.from({ length: h.per }, (_, i) => `<span class="${i < h.now ? 'on' : ''}">${i < h.now ? '❤️' : '🤍'}</span>`).join('')}
    <em>→</em>${coinIcon()}</button>`;
}

function taskCard(t, ts) {
  const streak = t.repeat === 'daily' ? currentStreak(t.id, S.data.completions) : 0;
  const cls = ts.status === 'approved' ? 'done' : ts.status === 'pending' ? 'wait' : '';
  return `<button class="task ${cls}" data-a="task-open" data-id="${t.id}">
    <span class="t-icon">${esc(t.icon || '⭐')}</span>
    <span class="t-title">${esc(t.title)}</span>
    <span class="t-price">${t.repeat === 'daily' ? '<span class="coins">❤️</span>' : coins(t.price)}</span>
    ${streak > 1 ? `<span class="t-streak">🔥${streak}</span>` : ''}
    ${ts.status === 'pending' || (t.repeat === 'any' && ts.pendingCount) ? `<span class="t-badge wait">⏳</span>` : ''}
    ${ts.status === 'approved' ? `<span class="t-badge ok">✓</span>` : ''}
    ${t.repeat === 'any' && ts.approvedToday ? `<span class="t-count">✓×${ts.approvedToday}</span>` : ''}
  </button>`;
}

function kidDreams() {
  const bal = balances(S.data.ledger);
  const act = S.data.wishes.filter(w => w.status !== 'bought');
  const bought = S.data.wishes.filter(w => w.status === 'bought').sort((a, b) => (b.boughtAt || 0) - (a.boughtAt || 0));
  const main = mainWish();
  return `<h2 class="sec">Мої мрії</h2>
    <div class="wish-grid">
      <button class="wish add" data-a="wish-new"><span class="big">＋</span><b>Нова мрія</b></button>
      ${act.map(w => {
        const p = wishProgress(w, bal);
        return `<div class="wish${w.id === main?.id ? ' main' : ''}">
          <button class="star" data-a="wish-main" data-id="${w.id}" aria-label="Головна мрія">${w.id === main?.id ? '⭐' : '☆'}</button>
          <button class="wish-body" data-a="say-wish" data-id="${w.id}">${wishPic(w)}<b>${esc(w.title || 'Мрія')}</b>
          <span class="t-price">${coins(w.price, 5)}</span>
          <div class="bar"><i style="width:${p.pct}%"></i></div>${wishHave(w, p)}</button>
          ${w.status === 'requested' ? `<div class="wish-state">⏳ Чекаємо маму чи тата</div>`
            : p.enough ? `<button class="btn big" data-a="wish-request" data-id="${w.id}">🛍️ Хочу купити!</button>`
            : `<div class="wish-state">Ще ${coins(p.left, 3)}</div>`}
        </div>`;
      }).join('')}
    </div>
    ${bought.length ? `<h2 class="sec">Здійснені мрії 🎉</h2><div class="shelf">${bought.map(w => `<div class="shelf-item">${wishPic(w)}<small>${esc(w.title || '')}</small></div>`).join('')}</div>` : ''}`;
}

function kidProgress() {
  const s = st(), today = dayKey();
  const now = new Date();
  const monday = addDays(today, -((now.getDay() + 6) % 7));
  const appr = S.data.completions.filter(c => c.status === 'approved');
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    return { d, n: appr.filter(c => c.date === d).length };
  });
  const weekTotal = week.reduce((a, x) => a + x.n, 0);
  const earned = S.data.ledger.filter(e => e.type === 'earn' || e.type === 'bonus').reduce((a, e) => a + total(e.amounts), 0);
  const streaks = S.data.tasks.filter(t => t.active !== false && t.repeat === 'daily')
    .map(t => ({ t, n: currentStreak(t.id, S.data.completions) })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);
  const hist = [...S.data.ledger].reverse().slice(0, 12);
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  return `<h2 class="sec">Мій тиждень</h2>
    <div class="week">${week.map((x, i) => `<div class="day${x.d === today ? ' today' : ''}${x.d > today ? ' future' : ''}">
      <small>${days[i]}</small><div class="stars">${x.n ? (x.n <= 4 ? '⭐'.repeat(x.n) : `⭐<b>${x.n}</b>`) : (x.d < today ? '·' : '')}</div></div>`).join('')}</div>
    <div class="stat-row">
      <div class="stat"><b>${hearts(S.data).total} ❤️</b><small>сердечок за звички</small></div>
      <div class="stat"><b>${weekTotal}</b><small>${plural(weekTotal, ['справа', 'справи', 'справ'])} за тиждень</small></div>
      <div class="stat"><b>${coins(earned, 0)}</b><small>${isF() ? 'заробила' : 'заробив'} за весь час</small></div>
      <div class="stat"><b>${S.data.wishes.filter(w => w.status === 'bought').length}</b><small>мрій здійснено</small></div>
    </div>
    ${streaks.length ? `<h2 class="sec">Серії 🔥</h2><div class="streaks">${streaks.map(x => `<div class="streak"><span>${esc(x.t.icon)}</span><b>${x.n}</b><small>${plural(x.n, ['день', 'дні', 'днів'])} поспіль</small>
      ${s.streak.enabled ? `<div class="mini-bar"><i style="width:${(x.n % s.streak.days) / s.streak.days * 100}%"></i></div>` : ''}</div>`).join('')}</div>
      ${s.streak.enabled ? `<p class="hint">Кожні ${s.streak.days} ${plural(s.streak.days, ['день', 'дні', 'днів'])} поспіль — бонус ${money(toK(s.streak.bonus, s), s)}!</p>` : ''}` : ''}
    <h2 class="sec">Історія</h2>
    <div class="hist">${hist.length ? hist.map(histRow).join('') : '<div class="empty-note">Тут з\'являться твої монетки</div>'}</div>`;
}

function histRow(e) {
  const t = total(e.amounts);
  return `<div class="h-row"><span class="h-icon">${esc(e.icon || '🪙')}</span><span class="h-note">${esc(e.note || '')}<small>${when(e.ts)}</small></span>
    <b class="${t >= 0 ? 'plus' : 'minus'}">${t >= 0 ? '+' : '−'}${num(Math.abs(fromK(t, st())))}${coinIcon()}</b></div>`;
}
function when(ts) {
  const d = new Date(ts), k = dayKey(d), today = dayKey();
  const hm = d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  if (k === today) return `сьогодні о ${hm}`;
  if (k === addDays(today, -1)) return `учора о ${hm}`;
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

// ---------- БАТЬКІВСЬКИЙ РЕЖИМ ----------
function renderParent() {
  const s = st();
  const pend = S.data.completions.filter(c => c.status === 'pending').length + S.data.wishes.filter(w => w.status === 'requested').length;
  const tabs = [['approve', '✅', 'Перевірити', pend], ['tasks', '📋', 'Завдання'], ['wishes', '⭐', 'Мрії'], ['jars', '🐷', 'Гроші'], ['settings', '⚙️', 'Налаштування']];
  const body = { approve: pApprove, tasks: pTasks, wishes: pWishes, jars: pJars, settings: pSettings }[S.ptab]();
  return `<div class="parent">
    <header class="p-top">
      <div><small>Батьківський режим</small><h1>${esc(s.childName)} ${theme(s.theme).preview}</h1></div>
      ${S.device.role === 'parent'
        ? `<button class="btn ghost" data-a="preview">👀 Екран дитини</button>`
        : `<button class="btn" data-a="lock">🔒 Готово</button>`}
    </header>
    <nav class="p-tabs">${tabs.map(([id, ic, label, b]) => `<button class="p-tab${S.ptab === id ? ' on' : ''}" data-a="ptab" data-v="${id}"><span>${ic}</span><small>${label}</small>${b ? `<em class="badge">${b}</em>` : ''}</button>`).join('')}</nav>
    <main class="p-main">${body}</main>
  </div>`;
}

function pApprove() {
  const s = st();
  const pend = S.data.completions.filter(c => c.status === 'pending');
  const req = S.data.wishes.filter(w => w.status === 'requested');
  const bal = balances(S.data.ledger);
  const today = dayKey();
  const doneToday = S.data.completions.filter(c => c.status === 'approved' && c.date === today).reverse();
  if (!pend.length && !req.length) {
    return `<div class="empty-big">🎉<b>Усе перевірено</b><small>Коли ${esc(s.childName)} позначить справу, вона з'явиться тут</small></div>
      ${doneToday.length ? `<h3>Сьогодні вже зроблено</h3><div class="list">${doneToday.map(c => `<div class="row"><span class="r-icon">${esc(c.icon)}</span><span class="r-main">${esc(c.title)}</span><span class="r-meta">${rewardText(c)}</span></div>`).join('')}</div>` : ''}`;
  }
  return `${pend.length > 1 ? `<button class="btn big wide" data-a="approve-all">✅ Підтвердити все (${pend.length})</button>` : ''}
    ${pend.length ? `<h3>Виконані справи</h3><div class="list">${pend.map(c => `<div class="row">
      <span class="r-icon">${esc(c.icon)}</span>
      <span class="r-main">${esc(c.title)}<small>${when(c.createdAt)}</small></span>
      <span class="r-meta">${rewardText(c)}</span>
      <span class="r-act"><button class="btn ok" data-a="approve" data-id="${c.id}">✓</button><button class="btn no" data-a="reject" data-id="${c.id}">✕</button></span>
    </div>`).join('')}</div>` : ''}
    ${req.length ? `<h3>Хоче купити</h3><div class="list">${req.map(w => {
      const have = bal[wishJar(w)];
      return `<div class="row">${wishPic(w, 'thumb')}
        <span class="r-main">${esc(w.title || 'Мрія')}<small>у скарбничці «${JAR_META[wishJar(w)].title}»: ${moneyFull(have, s)}</small></span>
        <span class="r-meta">${moneyFull(w.price, s)}</span>
        <span class="r-act"><button class="btn ok" data-a="wish-buy" data-id="${w.id}" ${have < w.price ? 'disabled' : ''}>Купили 🛍️</button><button class="btn no" data-a="wish-unrequest" data-id="${w.id}">Пізніше</button></span>
      </div>`;
    }).join('')}</div>` : ''}`;
}

function rewardText(c) { return isDaily(c, S.data.tasks) ? '❤️ сердечко' : moneyFull(c.price, st()); }
const REPEAT = { daily: 'щодня', any: 'будь-коли', once: 'один раз' };
function pTasks() {
  const s = st();
  const act = S.data.tasks.filter(t => t.active !== false), off = S.data.tasks.filter(t => t.active === false);
  const row = t => `<div class="row${t.active === false ? ' muted' : ''}">
    <span class="r-icon">${esc(t.icon)}</span>
    <span class="r-main">${esc(t.title)}<small>${REPEAT[t.repeat] || ''}</small></span>
    <span class="r-meta">${t.repeat === 'daily' ? '❤️' : moneyFull(t.price, s)}</span>
    <span class="r-act"><button class="btn ghost sm" data-a="task-edit" data-id="${t.id}">✏️</button>
    <button class="btn ghost sm" data-a="task-toggle" data-id="${t.id}">${t.active === false ? '▶️' : '⏸'}</button></span>
  </div>`;
  return `<div class="btn-row"><button class="btn" data-a="task-new">＋ Нове завдання</button><button class="btn ghost" data-a="library">📚 Бібліотека за віком</button></div>
    <h3>Активні (${act.length})</h3><div class="list">${act.map(row).join('') || '<div class="empty-note">Додайте завдання з бібліотеки</div>'}</div>
    ${off.length ? `<h3>Вимкнені й виконані разові</h3><div class="list">${off.map(row).join('')}</div>` : ''}`;
}

function pWishes() {
  const s = st(), bal = balances(S.data.ledger);
  const label = { active: 'збирає', requested: '⏳ просить купити', bought: '✅ куплено' };
  return `<div class="btn-row"><button class="btn" data-a="wish-new">＋ Додати мрію</button></div>
    <div class="list">${S.data.wishes.map(w => `<div class="row${w.status === 'bought' ? ' muted' : ''}">${wishPic(w, 'thumb')}
      <span class="r-main">${esc(w.title || 'Мрія')}<small>${label[w.status] || ''} · ${JAR_META[wishJar(w)].title}</small></span>
      <span class="r-meta">${moneyFull(w.price, s)}</span>
      <span class="r-act"><button class="btn ghost sm" data-a="wish-edit" data-id="${w.id}">✏️</button>
      ${w.status !== 'bought' ? `<button class="btn ok sm" data-a="wish-buy" data-id="${w.id}" ${bal[wishJar(w)] < w.price ? 'disabled' : ''}>🛍️</button>` : ''}</span>
    </div>`).join('') || '<div class="empty-note">Мрій ще немає</div>'}</div>`;
}

function pJars() {
  const s = st(), bal = balances(S.data.ledger);
  const jars = s.jarsEnabled ? JARS : ['spend'];
  return `<div class="p-jars">${jars.map(j => `<div class="p-jar jar-${j}"><span>${JAR_META[j].icon}</span><small>${s.jarsEnabled ? JAR_META[j].title : 'Скарбничка'}</small><b>${money(bal[j], s)}</b>${s.currency === 'coins' ? `<small>${num(bal[j] / 100)} грн</small>` : ''}</div>`).join('')}</div>
    <div class="btn-row">
      <button class="btn" data-a="money" data-v="bonus">＋ Бонус</button>
      <button class="btn ghost" data-a="money" data-v="take">− Зняти</button>
      ${s.jarsEnabled ? `<button class="btn ghost" data-a="money" data-v="move">⇄ Перекласти</button><button class="btn ghost" data-a="money" data-v="give">💝 Подарували</button>` : ''}
    </div>
    <h3>Історія</h3>
    <div class="list">${[...S.data.ledger].reverse().map(e => `<div class="row">
      <span class="r-icon">${esc(e.icon || '🪙')}</span><span class="r-main">${esc(e.note || '')}<small>${when(e.ts)} · ${JARS.filter(j => e.amounts?.[j]).map(j => `${JAR_META[j].icon}${e.amounts[j] > 0 ? '+' : ''}${num(fromK(e.amounts[j], s))}`).join(' ')}</small></span>
      <span class="r-meta ${total(e.amounts) >= 0 ? 'plus' : 'minus'}">${total(e.amounts) >= 0 ? '+' : '−'}${money(Math.abs(total(e.amounts)), s)}</span>
      <span class="r-act"><button class="btn ghost sm" data-a="ledger-del" data-id="${e.id}" title="Скасувати запис">🗑</button></span>
    </div>`).join('') || '<div class="empty-note">Ще порожньо</div>'}</div>`;
}

function seg(name, value, opts) {
  return `<div class="seg">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}" ${String(value) === String(v) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
}

function pSettings() {
  const s = st();
  const cloud = S.store?.mode === 'cloud';
  return `<form class="settings" data-form="settings">
    <fieldset><legend>Дитина</legend>
      <label class="f">Ім'я<input name="childName" value="${esc(s.childName)}" required></label>
      <label class="f">Як звертатись (Привіт, …!)<input name="childVoc" value="${esc(s.childVoc)}"></label>
      ${seg('gender', s.gender, [['f', 'Дівчинка'], ['m', 'Хлопчик']])}
      <div class="f">Вік (набір завдань у бібліотеці)</div>${seg('ageGroup', s.ageGroup, AGE_GROUPS.map(a => [a.id, a.title]))}
    </fieldset>
    <fieldset><legend>Оформлення</legend>
      <div class="themes">${Object.entries(THEMES).map(([id, t]) => `<label class="theme-pick t-${id}"><input type="radio" name="theme" value="${id}" ${s.theme === id ? 'checked' : ''}><span><em>${t.preview}</em>${t.title}</span></label>`).join('')}</div>
    </fieldset>
    <fieldset><legend>Гроші</legend>
      ${seg('currency', s.currency, [['coins', '🪙 Монетки'], ['uah', '₴ Гривні']])}
      <label class="f">1 монетка = грн<input name="coinValue" type="number" inputmode="decimal" min="0.5" step="0.5" value="${s.coinValue}"></label>
      <p class="hint">Ціни зберігаються в гривнях, тож перемикання нічого не ламає: 3 монетки по ${num(s.coinValue)} грн = ${num(3 * s.coinValue)} грн.</p>
    </fieldset>
    <fieldset><legend>Три скарбнички</legend>
      <label class="switch"><input type="checkbox" name="jarsEnabled" ${s.jarsEnabled ? 'checked' : ''}><span>Ділити кожну винагороду на три скарбнички</span></label>
      <label class="f">💕 Доплата мами й тата до «Накопичити»<select name="matchPct">${[[0, 'Без доплати'], [25, '+25% (на 4 монетки — 1)'], [50, '+50% (на 2 монетки — 1)'], [100, '+100% (скільки поклала — стільки ж)']].map(([v, l]) => `<option value="${v}" ${Number(s.matchPct) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="pct-row">${JARS.map(j => `<label class="f">${JAR_META[j].icon} ${JAR_META[j].title}, %<input name="pct_${j}" type="number" inputmode="numeric" min="0" max="100" value="${s.jarPct[j]}"></label>`).join('')}</div>
    </fieldset>
    <fieldset><legend>Сердечка й перекладання</legend>
      <label class="f">❤️ Скільки сердечок за щоденні звички = 1 монетка<input name="heartsPerCoin" type="number" inputmode="numeric" min="1" max="20" value="${s.heartsPerCoin}"></label>
      <label class="switch"><input type="checkbox" name="kidMove" ${s.kidMove ? 'checked' : ''}><span>${esc(s.childName)} може сама перекладати монетки між скарбничками</span></label>
    </fieldset>
    <fieldset><legend>Серії 🔥</legend>
      <label class="switch"><input type="checkbox" name="streakOn" ${s.streak.enabled ? 'checked' : ''}><span>Бонус за щоденні справи поспіль</span></label>
      <div class="pct-row"><label class="f">Днів поспіль<input name="streakDays" type="number" inputmode="numeric" min="2" value="${s.streak.days}"></label>
      <label class="f">Бонус (${s.currency === 'uah' ? 'грн' : 'монеток'})<input name="streakBonus" type="number" inputmode="decimal" min="0" step="0.5" value="${s.streak.bonus}"></label></div>
    </fieldset>
    <fieldset><legend>PIN-код батьків</legend>
      <label class="f">Новий PIN (4 цифри, порожньо — не міняти)<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off"></label>
    </fieldset>
    <button class="btn big wide" type="submit">💾 Зберегти</button>
  </form>
  <fieldset><legend>Синхронізація</legend>
    ${cloud ? `<p>☁️ Увімкнена. Код сім'ї для іншого пристрою:</p><div class="family-code">${S.device.fid.slice(0, 5)}-${S.device.fid.slice(5)}</div>
      <p class="hint">На iPad або телефоні: відкрити застосунок → «У мене є код сім'ї» → ввести код. Код — як ключ від дому, не публікуйте його.</p>`
      : cloudAvailable ? `<p>Зараз дані лише на цьому пристрої.</p><button class="btn" data-a="migrate">☁️ Увімкнути синхронізацію</button>`
      : `<p class="hint">Дані зберігаються лише на цьому пристрої. Щоб підтверджувати справи з телефона, треба один раз налаштувати Firebase (див. README).</p>`}
  </fieldset>
  <fieldset><legend>Перенести на інший пристрій</legend>
    <p class="hint">Без синхронізації: збережіть файл-копію і відкрийте його на iPad (Telegram, пошта, iCloud чи Google Drive → «Зберегти у Файли»). Після перенесення користуйтеся одним пристроєм — копії між собою не синхронізуються.</p>
    <div class="btn-row"><button class="btn" data-a="export">📤 Зберегти копію</button>
    ${cloud ? '' : `<label class="btn ghost">📥 Відкрити з файлу<input type="file" accept=".json,application/json" data-change="import" hidden></label>`}</div>
  </fieldset>
  <fieldset><legend>Цей пристрій</legend>
    ${cloud ? seg('role', S.device.role, [['child', '🧒 Дитячий (iPad)'], ['parent', '👨‍👩‍👧 Батьківський']]).replace(/name="role"/g, 'name="role" data-a="set-role"') : ''}
    <div class="btn-row">${cloud ? `<button class="btn ghost" data-a="forget-device">Від'єднати пристрій</button>` : `<button class="btn no" data-a="wipe-local">Видалити всі дані</button>`}</div>
  </fieldset>
  <p class="hint center">Mini Money · v${window.MM_VERSION || ''}</p>`;
}

// ---------- ВІКНА ----------
function openModal(html, cls = '') {
  $modal.innerHTML = `<div class="modal-back" data-a="close"></div><div class="modal-card ${cls}">${html}</div>`;
  $modal.hidden = false;
  document.body.classList.add('modal-open');
}
function closeModal() {
  $modal.hidden = true; $modal.innerHTML = ''; M = {};
  document.body.classList.remove('modal-open');
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function sayPrice(t) {
  if (t.repeat === 'daily') return `${t.title}. За це — сердечко! ${hearts(S.data).per} сердечок — це монетка.`;
  return t.price ? `${t.title}. ${money(t.price, st(), { words: true })}.` : `${t.title}. Це твоя корисна звичка — збирай серію!`;
}

function taskModal(t) {
  const s = st(), ts = taskState(t, S.data.completions);
  const streak = t.repeat === 'daily' ? currentStreak(t.id, S.data.completions) : 0;
  const can = ts.status === 'open';
  M = { taskId: t.id };
  openModal(`<button class="x" data-a="close">✕</button>
    <div class="tm-icon">${esc(t.icon)}</div>
    <h2 class="tm-title">${esc(t.title)}</h2>
    <div class="tm-price">${t.repeat === 'daily' ? '❤️' : coins(t.price, 10)}</div>
    ${t.repeat === 'daily' ? `<div class="tm-streak">${hearts(S.data).per} сердечок = 1 монетка</div>` : t.price ? '' : `<div class="tm-streak">Корисна звичка: збирай серію 🔥</div>`}
    ${streak > 1 ? `<div class="tm-streak">🔥 ${streak} ${plural(streak, ['день', 'дні', 'днів'])} поспіль!</div>` : ''}
    <div class="btn-row center">
      <button class="btn ghost big" data-a="say-task">🔊</button>
      ${can ? `<button class="btn big done-btn" data-a="task-done">✅ ${isF() ? 'Я зробила!' : 'Я зробив!'}</button>`
        : ts.status === 'pending' ? `<div class="tm-state">⏳ Чекаємо, поки мама чи тато перевірять</div>`
        : `<div class="tm-state">✓ Вже зроблено сьогодні. Молодець!</div>`}
    </div>`, 'task-modal');
  speak(sayPrice(t));
}

let pinBuf = '';
function pinModal() {
  pinBuf = '';
  openModal(`<button class="x" data-a="close">✕</button><h2>PIN батьків</h2>
    <div class="pin-dots">${'<i></i>'.repeat(4)}</div>
    <div class="pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button data-a="pin" data-k="${k}">${k}</button>`).join('')}</div>`, 'pin-modal');
}
async function pinPress(k) {
  if (k === '⌫') pinBuf = pinBuf.slice(0, -1); else if (pinBuf.length < 4) pinBuf += k;
  $modal.querySelectorAll('.pin-dots i').forEach((d, i) => d.classList.toggle('on', i < pinBuf.length));
  if (pinBuf.length === 4) {
    const ok = (await hashPin(pinBuf, PIN_SALT)) === st().pinHash;
    if (ok) { closeModal(); S.parent = true; S.ptab = 'approve'; resetIdle(); render(); }
    else { $modal.querySelector('.pin-dots').classList.add('shake'); setTimeout(() => { pinBuf = ''; $modal.querySelector('.pin-dots')?.classList.remove('shake'); $modal.querySelectorAll('.pin-dots i').forEach(d => d.classList.remove('on')); }, 500); }
  }
}

function priceStep() { return st().currency === 'uah' ? 10 : 1; }

function wishModal(w) {
  const s = st(), parent = isParentView();
  M = { wishId: w?.id || null, photo: w?.photo || '', emoji: w?.emoji || '🧸', price: w ? fromK(w.price, s) : (s.currency === 'uah' ? 100 : 10), jar: w?.jar || 'save' };
  openModal(`<button class="x" data-a="close">✕</button>
    <h2>${w ? 'Мрія' : 'Нова мрія ⭐'}</h2>
    <label class="photo-pick" id="photoPick">
      <input type="file" accept="image/*" data-change="photo">
      <div class="photo-prev">${M.photo ? `<img src="${M.photo}" alt="">` : `<span>📷</span><small>Сфотографуй</small>`}</div>
    </label>
    <div class="emoji-row">${WISH_ICONS.map(e => `<button class="emo${e === M.emoji && !M.photo ? ' on' : ''}" data-a="wish-emoji" data-e="${e}">${e}</button>`).join('')}</div>
    <label class="f">Як називається?<input id="wishTitle" value="${esc(w?.title || '')}" placeholder="Можна сказати голосом 🎤" autocomplete="off"></label>
    <div class="f">Скільки коштує?</div>
    <div class="stepper"><button class="btn round sm10" data-a="wish-price" data-d="-10">−${10 * priceStep()}</button><button class="btn round" data-a="wish-price" data-d="-1">−</button>
      <div class="step-val" id="wishPrice">${coins(toK(M.price, s), 10)}</div>
      <button class="btn round" data-a="wish-price" data-d="1">＋</button><button class="btn round sm10" data-a="wish-price" data-d="10">+${10 * priceStep()}</button></div>
    ${parent && s.jarsEnabled ? `<div class="f">З якої скарбнички</div>${seg('wishJar', M.jar, [['save', '💜 Накопичити'], ['spend', '🎀 Витратити']])}` : ''}
    <div class="btn-row center">
      ${w && parent ? `<button class="btn no" data-a="wish-del">🗑 Видалити</button>` : ''}
      <button class="btn big" data-a="wish-save">⭐ Зберегти</button></div>`, 'wish-modal');
}

async function resizeImage(file, max = 640) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  } finally { URL.revokeObjectURL(url); }
}

function taskEditModal(t) {
  const s = st();
  M = { taskId: t?.id || null, icon: t?.icon || '⭐' };
  openModal(`<button class="x" data-a="close">✕</button><h2>${t ? 'Завдання' : 'Нове завдання'}</h2>
    <form data-form="task" class="task-form">
      <div class="emoji-row">${TASK_ICONS.map(e => `<button type="button" class="emo${e === M.icon ? ' on' : ''}" data-a="task-icon" data-e="${e}">${e}</button>`).join('')}</div>
      <label class="f">Назва<input name="title" value="${esc(t?.title || '')}" required placeholder="Наприклад: застелити ліжко"></label>
      <p class="hint daily-hint">Щоденні звички дають ❤️ — ${s.heartsPerCoin} сердечок = 1 монетка.</p>
      <label class="f price-field">Ціна, ${s.currency === 'uah' ? 'грн' : 'монеток'}<input name="price" type="number" inputmode="decimal" min="0" step="${s.currency === 'uah' ? 1 : 0.5}" value="${t ? fromK(t.price, s) : 1}" required></label>
      <div class="f">Як часто</div>${seg('repeat', t?.repeat || 'daily', [['daily', 'Щодня'], ['any', 'Будь-коли'], ['once', 'Один раз']])}
      <div class="btn-row center">${t ? `<button type="button" class="btn no" data-a="task-del">🗑 Видалити</button>` : ''}<button class="btn big" type="submit">Зберегти</button></div>
    </form>`);
}

function libraryModal(age) {
  const s = st();
  age ||= s.ageGroup;
  const have = new Set(S.data.tasks.map(t => t.title));
  openModal(`<button class="x" data-a="close">✕</button><h2>Бібліотека завдань</h2>
    <div class="seg">${AGE_GROUPS.map(a => `<label><input type="radio" name="libAge" ${a.id === age ? 'checked' : ''} data-a="lib-age" data-v="${a.id}"><span>${a.title}</span></label>`).join('')}</div>
    <div class="list">${LIBRARY[age].map((it, i) => `<div class="row">
      <span class="r-icon">${it.icon}</span><span class="r-main">${esc(it.title)}<small>${REPEAT[it.repeat]}</small></span>
      <span class="r-meta">${it.repeat === 'daily' ? '❤️' : moneyFull(it.price * s.coinValue * 100, s)}</span>
      <span class="r-act">${have.has(it.title) ? '<span class="added">✓ є</span>' : `<button class="btn sm" data-a="lib-add" data-age="${age}" data-i="${i}">＋</button>`}</span>
    </div>`).join('')}</div>`);
}

function moneyModal(kind) {
  const s = st();
  const titles = { bonus: '＋ Бонус', take: '− Зняти', move: '⇄ Перекласти', give: '💝 Подарували' };
  const jarOpts = (name, def) => s.jarsEnabled ? `<select name="${name}">${JARS.map(j => `<option value="${j}" ${j === def ? 'selected' : ''}>${JAR_META[j].icon} ${JAR_META[j].title}</option>`).join('')}</select>` : '';
  M = { kind };
  openModal(`<button class="x" data-a="close">✕</button><h2>${titles[kind]}</h2>
    <form data-form="money">
      ${kind === 'move' ? `<label class="f">Звідки${jarOpts('from', 'spend')}</label><label class="f">Куди${jarOpts('to', 'save')}</label>`
        : kind === 'give' ? '' : s.jarsEnabled ? `<label class="f">Скарбничка${jarOpts('jar', kind === 'bonus' ? 'spend' : 'spend')}</label>` : ''}
      <label class="f">Сума, ${s.currency === 'uah' ? 'грн' : 'монеток'}<input name="amount" type="number" inputmode="decimal" min="0.5" step="0.5" required></label>
      <label class="f">${kind === 'give' ? 'Кому / на що' : 'За що'}<input name="note" placeholder="${kind === 'bonus' ? 'Допомогла бабусі' : kind === 'give' ? 'Подарунок другові / притулок' : ''}"></label>
      <div class="btn-row center"><button class="btn big" type="submit">Готово</button></div>
    </form>`);
}

// ---------- СВЯТКУВАННЯ ----------
function checkCelebrate() {
  if (!S.data?.ready || !S.data.settings || isParentView() || S.device?.role !== 'child') return;
  const earns = S.data.ledger.filter(e => ['earn', 'bonus', 'match', 'hearts'].includes(e.type));
  const dailies = S.data.completions.filter(c => c.status === 'approved' && isDaily(c, S.data.tasks));
  const maxTs = Math.max(0, ...earns.map(e => e.ts || 0), ...dailies.map(c => c.decidedAt || 0));
  if (S.celebrated == null) { S.celebrated = maxTs; LS.set('mm.celebrated', maxTs); return; }
  const fresh = earns.filter(e => e.ts > S.celebrated);
  const freshH = dailies.filter(c => (c.decidedAt || 0) > S.celebrated);
  if (!fresh.length && !freshH.length) return;
  S.celebrated = maxTs; LS.set('mm.celebrated', maxTs);
  const sum = fresh.reduce((a, e) => a + total(e.amounts), 0);
  const s = st(), th = theme(s.theme), h = hearts(S.data), n = freshH.length;
  const wow = isF() ? 'Молодчинка' : 'Молодець';
  const heartsWord = plural(n, ['сердечко', 'сердечка', 'сердечок']);
  const items = [...freshH.map(c => `❤️ ${esc(c.title)}`), ...fresh.filter(e => e.type !== 'earn' || !freshH.some(c => c.id === e.ref)).map(e => `${esc(e.icon)} ${esc(e.note)}`)];
  setTimeout(() => {
    openModal(`<div class="cele" data-a="close">
      <div class="cele-mascots"><div class="mascot">${th.mascots[0]}</div><div class="mascot">${th.mascots[1]}</div></div>
      <div class="cele-amt">${sum ? `+${num(fromK(sum, s))} ${coinIcon()}` : `+${n} ❤️`}</div>
      <div class="cele-txt">${wow}!</div>
      ${n ? `<div class="cele-hearts">${heartsBar()}</div>` : ''}
      <div class="cele-list">${items.map(x => `<span>${x}</span>`).join('')}</div>
      <small>торкнись, щоб закрити</small></div>`, 'cele-modal');
    confetti(sum ? 70 : 35); sound.fanfare();
    const left = h.per - h.now;
    speak(sum ? `Ура! ${wow}! Плюс ${money(sum, s, { words: true })}!`
      : `${wow}! Плюс ${n} ${heartsWord}! Ще ${left} — і буде монетка!`);
  }, 300);
}

// ---------- ПЕРЕКЛАДАННЯ (дитина сама) ----------
function moveModal(from) {
  M = { kind: 'move', from, moved: { spend: 0, save: 0, give: 0 } };
  openModal('', 'move-modal');
  renderMove();
  const s = st();
  speak(`${JAR_META[from].title}: ${money(balances(S.data.ledger)[from], s, { words: true })}. Куди перекласти?`);
}
function moveLive() {
  const b = balances(S.data.ledger);
  return Object.fromEntries(JARS.map(j => [j, b[j] + M.moved[j]]));
}
function renderMove() {
  const s = st(), th = theme(s.theme), live = moveLive();
  $modal.querySelector('.modal-card').innerHTML = `<button class="x" data-a="close">✕</button>
    <h2>Перекласти монетки</h2>
    <div class="mv-jars">${JARS.map(j => `<button class="mv-jar jar-${j}${j === M.from ? ' on' : ''}" data-a="mv-from" data-j="${j}">
      <div class="mv-art">${th.jarArt[j]}</div><b>${coinIcon()} ${num(fromK(live[j], s))}</b><small>${JAR_META[j].title}</small></button>`).join('')}</div>
    <p class="hint center">Беремо з «${JAR_META[M.from].title}» — тисни, куди покласти:</p>
    <div class="mv-targets">${JARS.filter(j => j !== M.from).map(j => `<button class="btn big mv-to jar-${j}" data-a="mv-to" data-j="${j}" ${live[M.from] < unitK(s) ? 'disabled' : ''}>
      ${coinIcon()} → ${JAR_META[j].icon} ${JAR_META[j].title}</button>`).join('')}</div>
    <div class="btn-row center"><button class="btn big ghost" data-a="close">✓ Готово</button></div>`;
}
async function commitMove() {
  if (M.kind !== 'move') return;
  const moved = M.moved;
  M = {};
  const amounts = Object.fromEntries(JARS.filter(j => moved[j]).map(j => [j, moved[j]]));
  if (!Object.keys(amounts).length) return;
  const from = JARS.filter(j => moved[j] < 0).map(j => JAR_META[j].icon).join(''), to = JARS.filter(j => moved[j] > 0).map(j => JAR_META[j].icon).join('');
  await db([{ op: 'set', col: 'ledger', id: uid(), data: { ts: Date.now(), type: 'move', amounts, note: `${st().childName} ${isF() ? 'переклала' : 'переклав'} ${from} → ${to}`, icon: '⇄' } }]);
}

// ---------- ДІЇ ----------
const db = ops => S.store.batch(ops).catch(e => toast('Помилка: ' + e.message));
const findT = id => S.data.tasks.find(t => t.id === id);
const findW = id => S.data.wishes.find(w => w.id === id);
const findC = id => S.data.completions.find(c => c.id === id);

const A = {
  retry() { connect(); },
  async close() { const mv = M.kind === 'move'; if (mv) await commitMove(); closeModal(); if (mv) { sound.done(); speak('Готово!'); } checkCelebrate(); },
  'mv-from'(el) { M.from = el.dataset.j; sound.tap(); renderMove(); },
  'mv-to'(el) {
    const u = unitK(st()), live = moveLive();
    if (live[M.from] < u) return speak('Тут уже порожньо');
    M.moved[M.from] -= u; M.moved[el.dataset.j] += u;
    sound.coin(); renderMove();
  },
  'say-hearts'() { const h = hearts(S.data); speak(`У тебе ${h.now} з ${h.per} сердечок. Ще ${h.per - h.now} — і буде монетка!`); },
  'kid-view'(el) { sound.tap(); S.view = el.dataset.v; render(); window.scrollTo(0, 0); },
  'say-total'() { const s = st(); speak(`У тебе ${money(total(balances(S.data.ledger)), s, { words: true })}`); sound.coin(); },
  'say-jar'(el) {
    const s = st(), j = el.dataset.j, b = balances(S.data.ledger)[j];
    const what = { spend: 'Це на те, що хочеш купити скоро.', save: 'Це на велику мрію.', give: 'Це щоб зробити подарунок або допомогти комусь.' }[j];
    sound.coin();
    if (s.jarsEnabled && s.kidMove && !isParentView()) return moveModal(j);
    speak(s.jarsEnabled ? `${JAR_META[j].title}: ${money(b, s, { words: true })}. ${what}` : `У скарбничці ${money(b, s, { words: true })}`);
  },
  'say-wish'(el) {
    const w = findW(el.dataset.id), s = st(), p = wishProgress(w, balances(S.data.ledger));
    speak(`${w.title || 'Моя мрія'}. Коштує ${money(w.price, s, { words: true })}. ${s.jarsEnabled ? `У скарбничці ${JAR_META[wishJar(w)].title} вже ${money(p.have, s, { words: true })}.` : ''} ${p.enough ? 'Вже можна купувати!' : `Залишилось ${money(p.left, s, { words: true })}.`}`);
  },
  'task-open'(el) { sound.tap(); taskModal(findT(el.dataset.id)); },
  'say-task'() { speak(sayPrice(findT(M.taskId))); },
  async 'task-done'() {
    const t = findT(M.taskId), today = dayKey();
    const id = t.repeat === 'daily' ? `${t.id}_${today}` : uid();
    closeModal();
    sound.done(); confetti(18);
    speak(`Супер! Скажи мамі або татові, щоб вони перевірили.`);
    await db([{ op: 'set', col: 'completions', id, data: { taskId: t.id, title: t.title, icon: t.icon, price: t.repeat === 'daily' ? 0 : t.price, daily: t.repeat === 'daily', date: today, status: 'pending', createdAt: Date.now() } }]);
  },
  'wish-new'() { sound.tap(); wishModal(null); speak('Яка в тебе мрія? Сфотографуй її!'); },
  'wish-edit'(el) { wishModal(findW(el.dataset.id)); },
  'wish-emoji'(el) {
    M.emoji = el.dataset.e; M.photo = '';
    $modal.querySelectorAll('.emoji-row .emo').forEach(b => b.classList.toggle('on', b === el));
    $modal.querySelector('.photo-prev').innerHTML = `<span>${M.emoji}</span><small>або сфотографуй</small>`;
  },
  'wish-price'(el) {
    M.price = Math.max(priceStep(), M.price + Number(el.dataset.d) * priceStep());
    $modal.querySelector('#wishPrice').innerHTML = coins(toK(M.price, st()), 10);
    sound.coin();
  },
  async 'wish-save'() {
    const s = st(), title = $modal.querySelector('#wishTitle').value.trim();
    const jar = $modal.querySelector('input[name="wishJar"]:checked')?.value || M.jar;
    const data = { title, photo: M.photo || '', emoji: M.emoji, price: toK(M.price, s), jar };
    const id = M.wishId || uid();
    const ops = [M.wishId ? { op: 'update', col: 'wishes', id, data } : { op: 'set', col: 'wishes', id, data: { ...data, status: 'active', createdAt: Date.now() } }];
    if (!M.wishId && !mainWish()) ops.push({ op: 'update', col: 'meta', id: 'settings', data: { mainWishId: id } });
    closeModal();
    if (!isParentView()) { sound.done(); speak('Мрію збережено! Збираймо монетки!'); }
    await db(ops);
  },
  async 'wish-del'() {
    if (!confirm('Видалити мрію?')) return;
    const id = M.wishId; closeModal();
    await db([{ op: 'delete', col: 'wishes', id }]);
  },
  async 'wish-main'(el) { sound.tap(); await db([{ op: 'update', col: 'meta', id: 'settings', data: { mainWishId: el.dataset.id } }]); },
  async 'wish-request'(el) {
    sound.done(); confetti(30);
    speak('Ура! Попроси маму чи тата купити твою мрію!');
    await db([{ op: 'update', col: 'wishes', id: el.dataset.id, data: { status: 'requested', requestedAt: Date.now() } }]);
  },
  async 'wish-unrequest'(el) { await db([{ op: 'update', col: 'wishes', id: el.dataset.id, data: { status: 'active' } }]); },
  async 'wish-buy'(el) {
    const w = findW(el.dataset.id), bal = balances(S.data.ledger);
    if (bal[wishJar(w)] < w.price) return toast('Не вистачає монеток');
    if (!confirm(`Купили «${w.title || 'мрію'}»? Буде списано ${moneyFull(w.price, st())}.`)) return;
    await db(buyOps({ ...w, jar: wishJar(w) }));
    toast('🎉 Мрію здійснено!');
  },
  approve(el) { approveMany([findC(el.dataset.id)]); },
  'approve-all'() { approveMany(S.data.completions.filter(c => c.status === 'pending')); },
  async reject(el) { await db([{ op: 'update', col: 'completions', id: el.dataset.id, data: { status: 'rejected', decidedAt: Date.now() } }]); },
  ptab(el) { S.ptab = el.dataset.v; render(); window.scrollTo(0, 0); },
  lock() { S.parent = false; S.view = 'tasks'; render(); checkCelebrate(); },
  preview() { S.preview = true; S.view = 'tasks'; render(); },
  'exit-preview'() { S.preview = false; render(); },
  'task-new'() { taskEditModal(null); },
  'task-edit'(el) { taskEditModal(findT(el.dataset.id)); },
  'task-icon'(el) { M.icon = el.dataset.e; $modal.querySelectorAll('.emoji-row .emo').forEach(b => b.classList.toggle('on', b === el)); },
  async 'task-toggle'(el) { const t = findT(el.dataset.id); await db([{ op: 'update', col: 'tasks', id: t.id, data: { active: t.active === false } }]); },
  async 'task-del'() {
    if (!confirm('Видалити завдання? Історія монеток залишиться.')) return;
    const id = M.taskId; closeModal();
    await db([{ op: 'delete', col: 'tasks', id }]);
  },
  library() { libraryModal(); },
  'lib-age'(el) { libraryModal(el.dataset.v); },
  async 'lib-add'(el) {
    const it = LIBRARY[el.dataset.age][el.dataset.i];
    await db([{ op: 'set', col: 'tasks', id: uid(), data: { icon: it.icon, title: it.title, repeat: it.repeat, price: Math.round(it.price * st().coinValue * 100), active: true, createdAt: Date.now() } }]);
    el.outerHTML = '<span class="added">✓ є</span>';
  },
  money(el) { moneyModal(el.dataset.v); },
  async 'ledger-del'(el) {
    if (!confirm('Скасувати цей запис? Баланс зміниться.')) return;
    await db([{ op: 'delete', col: 'ledger', id: el.dataset.id }]);
  },
  async 'set-role'(el) { S.device = { ...S.device, role: el.value }; LS.set('mm.device', S.device); S.parent = false; S.preview = false; render(); },
  'forget-device'() {
    if (!confirm('Від\'єднати цей пристрій? Дані сім\'ї залишаться в хмарі, повернутись можна за кодом.')) return;
    forgetDevice();
  },
  'wipe-local'() {
    if (prompt('Усі завдання, мрії й монетки буде видалено. Напишіть ВИДАЛИТИ') !== 'ВИДАЛИТИ') return;
    LS.del('mm.data.local'); forgetDevice();
  },
  async migrate() {
    if (!confirm('Перенести дані в хмару? Після цього можна буде підключити інший пристрій за кодом.')) return;
    try {
      const fid = randomCode(10);
      await migrateToCloud(fid);
      S.device = { fid, role: S.device.role }; LS.set('mm.device', S.device);
      await connect();
      toast('☁️ Синхронізацію увімкнено');
    } catch (e) { toast('Не вдалося: ' + e.message); }
  },
  pin(el) { pinPress(el.dataset.k); },
  // онбординг
  'ob-step'(el) { S.ob.step = el.dataset.v; render(); },
  'ob-lib-toggle'(el) { const i = Number(el.dataset.i); S.ob.picked[i] = !S.ob.picked[i]; el.classList.toggle('on', S.ob.picked[i]); },
  'ob-create'() { obCreate(); },
  export() { exportData(); },
};

// ---------- КОПІЯ У ФАЙЛ ----------
function exportData() {
  const cols = { meta: { settings: S.data.rawSettings } };
  for (const c of ['tasks', 'wishes', 'completions', 'ledger']) cols[c] = Object.fromEntries(S.data[c].map(({ id, ...d }) => [id, d]));
  const blob = new Blob([JSON.stringify({ app: 'mini-money', v: 1, exportedAt: Date.now(), cols })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mini-money-${dayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  toast('📤 Копію збережено');
}

async function importData(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return toast('Це не файл Mini Money'); }
  const cols = data?.cols;
  if (data?.app !== 'mini-money' || !cols?.meta?.settings) return toast('Це не файл Mini Money');
  if (S.device && !confirm('Замінити всі дані на цьому пристрої даними з файлу?')) return;
  try { localStorage.setItem('mm.data.local', JSON.stringify(cols)); } catch { return toast('Не вистачає місця на пристрої'); }
  // не показувати святкування за старі монетки
  const maxTs = Object.values(cols.ledger || {}).reduce((m, e) => Math.max(m, e.ts || 0), 0);
  S.celebrated = maxTs; LS.set('mm.celebrated', maxTs);
  S.device = { fid: 'local', role: 'child' }; LS.set('mm.device', S.device);
  S.parent = false; S.preview = false; S.view = 'tasks'; S.ob = { step: 'welcome' };
  closeModal();
  await connect();
  const name = cols.meta.settings.childVoc || cols.meta.settings.childName;
  toast('📥 Дані відкрито');
  speak(`Привіт, ${name}!`);
}

function forgetDevice() {
  S.unwatch?.(); S.unwatch = null; S.device = null; S.data = null; S.parent = false; S.preview = false;
  LS.del('mm.device'); LS.del('mm.celebrated'); S.celebrated = null;
  S.ob = { step: 'welcome' }; render();
}

async function approveMany(list) {
  let d = { ...S.data, ledger: [...S.data.ledger], completions: [...S.data.completions] };
  const ops = [];
  const now = Date.now();
  list.filter(Boolean).forEach((c, i) => {
    const o = approveOps(c, d, now + i * 3);
    ops.push(...o);
    for (const op of o) {
      if (op.col === 'ledger') d.ledger.push({ id: op.id, ...op.data });
      if (op.col === 'completions') d.completions = d.completions.map(x => x.id === op.id ? { ...x, ...op.data } : x);
    }
  });
  await db(ops);
  sound.coin();
}

// ---------- ФОРМИ ----------
async function onSubmit(form) {
  const f = new FormData(form), kind = form.dataset.form, s = S.data?.settings;
  if (kind === 'settings') {
    const pct = Object.fromEntries(JARS.map(j => [j, Math.max(0, Math.round(Number(f.get('pct_' + j)) || 0))]));
    const jarsEnabled = f.get('jarsEnabled') === 'on';
    if (jarsEnabled && pct.spend + pct.save + pct.give !== 100) return toast('Відсотки скарбничок мають у сумі дати 100');
    const patch = {
      childName: f.get('childName').trim(), childVoc: f.get('childVoc').trim() || vocative(f.get('childName')),
      gender: f.get('gender'), ageGroup: f.get('ageGroup'), theme: f.get('theme'),
      currency: f.get('currency'), coinValue: Math.max(0.5, Number(f.get('coinValue')) || 5),
      jarsEnabled, jarPct: pct, matchPct: Number(f.get('matchPct')) || 0,
      heartsPerCoin: Math.min(20, Math.max(1, Math.round(Number(f.get('heartsPerCoin')) || 5))), kidMove: f.get('kidMove') === 'on',
      streak: { enabled: f.get('streakOn') === 'on', days: Math.max(2, Number(f.get('streakDays')) || 5), bonus: Math.max(0, Number(f.get('streakBonus')) || 0) },
    };
    const pin = (f.get('pin') || '').trim();
    if (pin) { if (!/^\d{4}$/.test(pin)) return toast('PIN — це 4 цифри'); patch.pinHash = await hashPin(pin, PIN_SALT); }
    if (patch.matchPct !== s.matchPct) patch.matchSince = Date.now(); // нова доплата — без перерахунку минулого
    if (patch.heartsPerCoin !== s.heartsPerCoin) patch.heartsSince = Date.now(); // новий курс сердечок — рахунок з нуля
    const ops = [{ op: 'update', col: 'meta', id: 'settings', data: patch }];
    // зміна курсу в режимі монеток: ціни справ і мрій зберігають кількість монеток
    if (s.currency === 'coins' && patch.currency === 'coins' && patch.coinValue !== s.coinValue) {
      const k = patch.coinValue / s.coinValue;
      if (!confirm(`Курс ${num(s.coinValue)} → ${num(patch.coinValue)} грн. Ціни справ і мрій залишаться в тих самих монетках (у гривнях зміняться). Монетки, що вже в скарбничках, перерахуються за новим курсом.`)) return;
      for (const t of S.data.tasks) ops.push({ op: 'update', col: 'tasks', id: t.id, data: { price: Math.round(t.price * k) } });
      for (const c of S.data.completions) if (c.status === 'pending') ops.push({ op: 'update', col: 'completions', id: c.id, data: { price: Math.round(c.price * k) } });
      for (const w of S.data.wishes) if (w.status !== 'bought') ops.push({ op: 'update', col: 'wishes', id: w.id, data: { price: Math.round(w.price * k) } });
    }
    await db(ops);
    toast('Збережено ✓');
  }
  if (kind === 'task') {
    const data = { icon: M.icon, title: f.get('title').trim(), price: toK(f.get('price'), s), repeat: f.get('repeat') };
    const id = M.taskId || uid();
    closeModal();
    await db([M.taskId ? { op: 'update', col: 'tasks', id, data } : { op: 'set', col: 'tasks', id, data: { ...data, active: true, createdAt: Date.now() } }]);
  }
  if (kind === 'money') {
    const amt = toK(f.get('amount'), s), note = f.get('note').trim();
    if (!(amt > 0)) return toast('Вкажіть суму');
    const bal = balances(S.data.ledger);
    const jar = f.get('jar') || 'spend';
    let e;
    if (M.kind === 'bonus') e = { type: 'adjust', amounts: { [jar]: amt }, note: note || 'Бонус від батьків', icon: '🎁' };
    if (M.kind === 'take') { if (bal[jar] < amt) return toast('У скарбничці менше'); e = { type: 'adjust', amounts: { [jar]: -amt }, note: note || 'Зняли', icon: '➖' }; }
    if (M.kind === 'give') { if (bal.give < amt) return toast('У скарбничці «Подарувати» менше'); e = { type: 'give', amounts: { give: -amt }, note: note || 'Подарунок', icon: '💝' }; }
    if (M.kind === 'move') {
      const from = f.get('from'), to = f.get('to');
      if (from === to) return toast('Оберіть різні скарбнички');
      if (bal[from] < amt) return toast('Не вистачає');
      e = { type: 'move', amounts: { [from]: -amt, [to]: amt }, note: note || `${JAR_META[from].title} → ${JAR_META[to].title}`, icon: '⇄' };
    }
    closeModal();
    await db([{ op: 'set', col: 'ledger', id: uid(), data: { ts: Date.now(), ...e } }]);
  }
  if (kind === 'ob-create') {
    S.ob.form = Object.fromEntries(f.entries());
    if (!/^\d{4}$/.test(S.ob.form.pin || '')) return toast('PIN — це 4 цифри');
    S.ob.picked = LIBRARY[S.ob.form.ageGroup].map((_, i) => i < 6);
    S.ob.step = 'library'; render();
  }
  if (kind === 'ob-join') {
    const code = (f.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 10) return toast('Код має 10 символів');
    try {
      if (!(await cloudFamilyExists(code))) return toast('Такої сім\'ї не знайдено');
    } catch (e) { return toast('Немає зв\'язку: ' + e.message); }
    S.device = { fid: code, role: f.get('role') }; LS.set('mm.device', S.device);
    connect();
  }
}

// ---------- ОНБОРДИНГ ----------
function renderOnboarding() {
  document.documentElement.dataset.theme = 'kitty';
  const th = THEMES.kitty, o = S.ob;
  if (o.step === 'welcome') {
    $app.innerHTML = `<div class="center-screen ob">
      <div class="ob-mascots"><div class="mascot">${th.mascots[0]}</div><div class="mascot">${th.mascots[1]}</div></div>
      <h1 class="ob-title">Mini Money</h1>
      <p class="ob-sub">Скарбничка для маленьких помічників: справи → монетки → мрії</p>
      <div class="btn-col">
        <button class="btn big" data-a="ob-step" data-v="create">✨ Почати</button>
        ${cloudAvailable ? `<button class="btn ghost big" data-a="ob-step" data-v="join">🔗 У мене є код сім'ї</button>` : ''}
        <label class="btn ghost big">📥 Відкрити з файлу<input type="file" accept=".json,application/json" data-change="import" hidden></label>
      </div></div>`;
    return;
  }
  if (o.step === 'create') {
    const v = o.form || {};
    $app.innerHTML = `<div class="center-screen ob"><form class="card pad ob-form" data-form="ob-create">
      <h2>Хто буде збирати монетки?</h2>
      <label class="f">Ім'я дитини<input name="childName" value="${esc(v.childName || '')}" required autocomplete="off" data-input="ob-name"></label>
      <label class="f">Як звертатись: «Привіт, …!»<input name="childVoc" value="${esc(v.childVoc || '')}" autocomplete="off"></label>
      ${seg('gender', v.gender || 'f', [['f', 'Дівчинка'], ['m', 'Хлопчик']])}
      <div class="f">Вік</div>${seg('ageGroup', v.ageGroup || '4-5', AGE_GROUPS.map(a => [a.id, a.title]))}
      <label class="f">PIN-код батьків (4 цифри)<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"></label>
      <p class="hint">PIN відкриває батьківський режим: підтвердження справ, ціни, налаштування. На дитячому екрані — утримати 🔒.</p>
      ${cloudAvailable ? `<div class="f">Цей пристрій</div>${seg('role', v.role || 'child', [['child', '🧒 iPad дитини'], ['parent', '👨‍👩‍👧 Телефон батьків']])}` : ''}
      <div class="btn-row"><button type="button" class="btn ghost" data-a="ob-step" data-v="welcome">Назад</button><button class="btn big" type="submit">Далі →</button></div>
    </form></div>`;
    return;
  }
  if (o.step === 'library') {
    const items = LIBRARY[o.form.ageGroup];
    $app.innerHTML = `<div class="center-screen ob"><div class="card pad ob-form wide">
      <h2>Перші справи</h2><p class="hint">Оберіть кілька — для початку краще 4–6. Ціни й усе інше можна змінити потім.</p>
      <div class="lib-grid">${items.map((it, i) => `<button class="lib-item${o.picked[i] ? ' on' : ''}" data-a="ob-lib-toggle" data-i="${i}"><span>${it.icon}</span><b>${esc(it.title)}</b><small>${it.repeat === 'daily' ? '❤️' : `${it.price} 🪙`} · ${REPEAT[it.repeat]}</small></button>`).join('')}</div>
      <div class="btn-row"><button class="btn ghost" data-a="ob-step" data-v="create">Назад</button><button class="btn big" data-a="ob-create">🎀 Готово!</button></div>
    </div></div>`;
    return;
  }
  if (o.step === 'join') {
    $app.innerHTML = `<div class="center-screen ob"><form class="card pad ob-form" data-form="ob-join">
      <h2>Приєднатися до сім'ї</h2>
      <p class="hint">Код є в батьківському режимі на іншому пристрої: Налаштування → Синхронізація.</p>
      <label class="f">Код сім'ї<input name="code" required autocomplete="off" autocapitalize="characters" placeholder="ABCDE-FGH23" class="code-input"></label>
      <div class="f">Цей пристрій</div>${seg('role', 'child', [['child', '🧒 iPad дитини'], ['parent', '👨‍👩‍👧 Телефон батьків']])}
      <div class="btn-row"><button type="button" class="btn ghost" data-a="ob-step" data-v="welcome">Назад</button><button class="btn big" type="submit">Приєднатися</button></div>
    </form></div>`;
  }
}

async function obCreate() {
  const v = S.ob.form, items = LIBRARY[v.ageGroup];
  const coinValue = DEFAULT_SETTINGS.coinValue;
  const settings = {
    ...DEFAULT_SETTINGS, childName: v.childName.trim(), childVoc: (v.childVoc || '').trim() || vocative(v.childName),
    gender: v.gender, ageGroup: v.ageGroup, theme: AGE_GROUPS.find(a => a.id === v.ageGroup)?.theme || 'kitty',
    pinHash: await hashPin(v.pin, PIN_SALT), createdAt: Date.now(), matchSince: Date.now(), heartsSince: Date.now(),
  };
  const now = Date.now();
  const ops = [{ op: 'set', col: 'meta', id: 'settings', data: settings }];
  items.forEach((it, i) => {
    if (!S.ob.picked[i]) return;
    ops.push({ op: 'set', col: 'tasks', id: uid(), data: { icon: it.icon, title: it.title, repeat: it.repeat, price: it.price * coinValue * 100, active: true, createdAt: now + i } });
  });
  try {
    let fid = 'local';
    if (cloudAvailable) { fid = randomCode(10); const st = await createCloudFamily(fid); await st.batch(ops); }
    else { const st = await openStore('local'); await st.batch(ops); }
    S.device = { fid, role: v.role || 'child' }; LS.set('mm.device', S.device);
    S.ob = { step: 'welcome' };
    S.celebrated = null; LS.del('mm.celebrated');
    await connect();
    if (S.device.role === 'child') speak(`Привіт, ${settings.childVoc}! Давай збирати монетки!`);
  } catch (e) { toast('Помилка: ' + e.message); }
}

// ---------- ПОДІЇ ----------
let swallowUntil = 0; // клік від відпускання пальця після утримання 🔒 не має закрити PIN
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el || el.tagName === 'INPUT') return;
  if (Date.now() < swallowUntil && el.classList.contains('modal-back')) return;
  const fn = A[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.matches('input[data-a]')) { const fn = A[el.dataset.a]; if (fn) fn(el, e); }
  if (el.dataset.change === 'import' && el.files?.[0]) { importData(el.files[0]); el.value = ''; }
  if (el.dataset.change === 'photo' && el.files?.[0]) {
    try {
      M.photo = await resizeImage(el.files[0]);
      $modal.querySelector('.photo-prev').innerHTML = `<img src="${M.photo}" alt="">`;
      $modal.querySelectorAll('.emoji-row .emo').forEach(b => b.classList.remove('on'));
      sound.done();
    } catch { toast('Не вдалося відкрити фото'); }
  }
});
document.addEventListener('input', e => {
  if (e.target.dataset.input === 'ob-name') {
    const voc = e.target.form.querySelector('[name="childVoc"]');
    if (!voc.dataset.touched) voc.value = vocative(e.target.value);
  }
  if (e.target.name === 'childVoc') e.target.dataset.touched = '1';
});
document.addEventListener('submit', e => { e.preventDefault(); onSubmit(e.target); });

// утримання 🔒 для входу батьків
let holdTimer = null;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-hold]');
  if (!el) return;
  const cancel = () => { clearTimeout(holdTimer); el.classList.remove('holding'); };
  el.classList.add('holding');
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, cancel, { once: true }));
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => { el.classList.remove('holding'); swallowUntil = Date.now() + 2500; pinModal(); }, 1200);
});
document.addEventListener('contextmenu', e => { if (e.target.closest('[data-hold]')) e.preventDefault(); });

// батьківський режим на iPad закривається сам
let idleTimer = null;
function resetIdle() {
  clearTimeout(idleTimer);
  if (S.parent) idleTimer = setTimeout(() => { if (S.parent) { closeModal(); A.lock(); } }, 3 * 60 * 1000);
}
document.addEventListener('pointerdown', resetIdle);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.parent) { S.parent = false; closeModal(); render(); }
  if (!document.hidden && S.data) render(); // нова доба → оновити «сьогодні»
});

if (S.device) connect(); else render();
