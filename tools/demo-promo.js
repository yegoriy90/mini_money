// Демодані й сценарій для РЕКЛАМНОГО ролика та App Preview (запис екрана з симулятора) (лише тестова збірка, не в репозиторії). Вигадане ім'я, PIN 1234.
import { DEFAULT_SETTINGS } from './js/model.js'; // запускається з www/ (див. docs/appstore.md)
import { LIBRARY } from './js/library.js';

const COMP = new URLSearchParams(location.search).get('c') || window.DEMO_COMPANION || 'musi';
if (!localStorage.getItem('mm.data.local')) {
  const now = Date.now(), day = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
  const settings = { ...DEFAULT_SETTINGS, childName: 'Соня', childVoc: 'Соню', gender: 'f', ageGroup: '4-5', theme: COMP,
    pinHash: '913b99eedabf84a4637690157249411166af75dfdbcf4f8f4f7bf37d2f585575', createdAt: now - 30 * 864e5, matchSince: now - 30 * 864e5, heartsSince: now - 30 * 864e5, mainWishId: 'w1' };
  const tasks = {};
  LIBRARY['4-5'].slice(0, 6).forEach((it, i) => { tasks['h' + i] = { icon: it.icon, title: it.title, repeat: it.repeat, time: it.time || '', price: it.price * 1000, active: true, createdAt: now - 30 * 864e5 + i }; });
  [['🌱', 'Полити квіти', 1], ['🛒', 'Допомогти розкласти покупки', 2], ['🧦', 'Розкласти шкарпетки по парах', 2], ['🧹', 'Допомогти прибрати кімнату', 3], ['📚', 'Поставити книжки на поличку', 1]]
    .forEach(([icon, title, c], i) => { tasks['ct' + i] = { icon, title, repeat: 'any', time: '', price: c * 1000, active: true, createdAt: now + 100 + i }; });
  const ids = Object.keys(tasks), completions = {};
  for (let dd = 20; dd >= 1; dd--) ids.slice(0, 2 + (dd % 3)).forEach(id => {
    const t = tasks[id], ts = now - dd * 864e5;
    completions[id + '_' + day(dd)] = { taskId: id, title: t.title, icon: t.icon, price: t.repeat === 'daily' ? 0 : t.price, daily: t.repeat === 'daily', date: day(dd), status: 'approved', createdAt: ts, decidedAt: ts + 36e5 };
  });
  const habit = ids.find(id => tasks[id].repeat === 'daily');
  completions[habit + '_' + day(0)] = { taskId: habit, title: tasks[habit].title, icon: tasks[habit].icon, price: 0, daily: true, date: day(0), status: 'approved', createdAt: now - 72e5, decidedAt: now - 36e5 };
  completions['ct0_' + day(0)] = { taskId: 'ct0', title: 'Полити квіти', icon: '🌱', price: 1000, daily: false, date: day(0), status: 'pending', createdAt: now - 6e5 };
  const ledger = {
    e1: { ts: now - 5 * 864e5, type: 'earn', amounts: { spend: 3000, save: 12000, give: 1500 }, note: 'Справи за тиждень', icon: '⭐' },
    e2: { ts: now - 2 * 864e5, type: 'earn', amounts: { spend: 1000, save: 2000, give: 500 }, note: 'Допомогти прибрати кімнату', icon: '🧹' },
  };
  const wishes = {
    w1: { title: "М'який левчик", photo: 'assets/heroes/leo.webp', emoji: '🦁', price: 20000, jar: 'save', createdAt: now - 9 * 864e5 },
    w2: { title: 'Пінгвіня з шарфиком', photo: 'assets/heroes/pingo.webp', emoji: '🐧', price: 6000, jar: 'spend', createdAt: now - 3 * 864e5 },
    w3: { title: 'Єдиноріжка', photo: 'assets/heroes/zirka.webp', emoji: '🦄', price: 12000, jar: 'save', createdAt: now - 864e5 },
  };
  localStorage.setItem('mm.data.local', JSON.stringify({ meta: { settings }, tasks, wishes, completions, ledger }));
  localStorage.setItem('mm.device', JSON.stringify({ fid: 'local', role: 'child' }));
  localStorage.setItem('mm.celebrated', String(now + 1e10));
  localStorage.setItem('mm.stickers', '99');
}

// Сценарій запису (довгий, ~50 с): справи → PIN → підтвердження → святкування → мрія-пазл → друзі за віком → наліпки → подарунок.
// Час — від завантаження сторінки. Дотики показуються колами.
if (!sessionStorage.getItem('tour')) {
  sessionStorage.setItem('tour', '1');
  localStorage.setItem('mm.celebrated', String(Date.now()));
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const style = document.createElement('style');
  style.textContent = '.tap-dot{position:fixed;z-index:99999;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:rgba(255,255,255,.55);box-shadow:0 0 0 3px rgba(0,0,0,.18);pointer-events:none;animation:tapdot .55s ease-out forwards}@keyframes tapdot{from{transform:scale(.4);opacity:1}to{transform:scale(1.25);opacity:0}}';
  document.head.appendChild(style);
  const dot = el => {
    const r = el.getBoundingClientRect(), d = document.createElement('div');
    d.className = 'tap-dot'; d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 700);
  };
  const tap = el => { if (!el) return; dot(el); setTimeout(() => el.click(), 120); };
  const task = text => $$('.task').find(t => t.textContent.includes(text));
  const k = 'mm.data.local', read = () => JSON.parse(localStorage.getItem(k));
  const write = d => { localStorage.setItem(k, JSON.stringify(d)); window.dispatchEvent(new StorageEvent('storage', { key: k })); };
  const key = n => tap($(`.pinpad [data-k="${n}"]`));
  const steps = [
    [0.9, () => tap($('[data-a="kid-view"][data-v="dreams"]'))],
    [2.9, () => tap($('[data-a="kid-view"][data-v="tasks"]'))],
    [3.9, () => tap(task('тарілку'))],
    [5.5, () => tap($('.done-btn'))],
    [7.4, () => tap(task('покупки'))],
    [9.1, () => tap($('.done-btn'))],
    [11.0, () => { const l = $('[data-hold="unlock"]'); dot(l); l.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }],
    [13.0, () => key(1)], [13.5, () => key(2)], [14.0, () => key(3)], [14.5, () => key(4)],
    [16.5, () => tap($('[data-a="approve-all"]'))],
    [19.0, () => tap($('[data-a="ptab"][data-v="jars"]'))],
    [21.4, () => tap($('[data-a="ptab"][data-v="report"]'))],
    [23.8, () => tap($('[data-a="ptab"][data-v="settings"]'))],
    [25.0, () => { const g = $('.comp-ages'); if (g) g.scrollIntoView({ behavior: 'smooth', block: 'center' }); }],
    [26.8, () => tap($('input[name="gridAge"][value="6-7"]')?.closest('label'))],
    [28.6, () => tap($('input[name="gridAge"][value="8-10"]')?.closest('label'))],
    [31.0, () => { window.scrollTo({ top: 0, behavior: 'instant' }); tap($('[data-a="lock"]')); }],
    [37.0, () => { $$('.confetti').forEach(c => c.remove()); tap($('.cele')); }],
    [38.2, () => tap($('[data-a="kid-view"][data-v="dreams"]'))],
    [43.6, () => tap($('[data-a="kid-view"][data-v="progress"]'))],
    [47.0, () => { const d = read(); d.ledger.promoGift = { ts: Date.now(), type: 'adjust', amounts: { spend: 3000, save: 0, give: 0 }, note: 'Допомогла бабусі', icon: '🎁' }; write(d); }],
  ];
  steps.forEach(([t, f]) => setTimeout(f, t * 1000));
}
