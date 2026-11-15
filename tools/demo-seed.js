// Демодані для скриншотів App Store (лише тестова збірка, не в репозиторії). Вигадане ім'я, PIN 1234.
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

// Екскурсія для скриншотів: кожні 6 с — новий екран (знімається ззовні через simctl)
if (!sessionStorage.getItem('tour')) {
  sessionStorage.setItem('tour', '1');
  localStorage.setItem('mm.celebrated', String(Date.now()));
  const $ = s => document.querySelector(s), close = () => { $('.x')?.click(); $('.modal-back')?.click(); };
  const steps = [
    () => $('[data-a="pick-companion"]')?.click(),
    () => { close(); $('[data-a="kid-view"][data-v="dreams"]')?.click(); },
    () => $('[data-a="kid-view"][data-v="progress"]')?.click(),
    () => { $('[data-a="kid-view"][data-v="tasks"]')?.click();
      const k = 'mm.data.local', d = JSON.parse(localStorage.getItem(k));
      d.ledger.e3 = { ts: Date.now(), type: 'earn', amounts: { spend: 1000, save: 800, give: 200 }, note: 'Полити квіти', icon: '🌱' };
      localStorage.setItem(k, JSON.stringify(d)); window.dispatchEvent(new StorageEvent('storage', { key: k })); },
    () => { document.querySelectorAll('.confetti').forEach(c => c.remove()); close();
      localStorage.setItem('mm.device', JSON.stringify({ fid: 'local', role: 'parent' })); location.reload(); },
  ];
  steps.forEach((f, i) => setTimeout(f, 8000 + i * 6000));
}
