// Доменна логіка: гроші зберігаються в копійках (цілі числа), баланс = сума записів журналу (ledger).

export const JARS = ['spend', 'save', 'give'];
export const JAR_META = {
  spend: { title: 'Витратити', short: 'Витрачаю', icon: '🎀' },
  save: { title: 'Накопичити', short: 'Коплю', icon: '💜' },
  give: { title: 'Подарувати', short: 'Дарую', icon: '💝' },
};

export const DEFAULT_SETTINGS = {
  childName: '',
  childVoc: '',
  gender: 'f',
  ageGroup: '4-5',
  theme: 'kitty',
  currency: 'coins', // coins | uah
  coinValue: 5, // грн за монетку
  jarsEnabled: true,
  jarPct: { spend: 60, save: 30, give: 10 },
  streak: { enabled: true, days: 5, bonus: 1 }, // bonus — у монетках/гривнях поточного режиму
  pinHash: '',
  mainWishId: '',
};

export function withDefaults(s) {
  return {
    ...DEFAULT_SETTINGS, ...(s || {}),
    jarPct: { ...DEFAULT_SETTINGS.jarPct, ...(s?.jarPct || {}) },
    streak: { ...DEFAULT_SETTINGS.streak, ...(s?.streak || {}) },
  };
}

// ---- дати ----
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

// ---- гроші ----
export function unitK(s) {
  return s.currency === 'uah' ? 100 : Math.max(1, Math.round(s.coinValue * 100));
}
export function toK(value, s) { return Math.round(Number(value) * unitK(s)); }
export function fromK(k, s) { return k / unitK(s); }

export function plural(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (!Number.isInteger(n)) return forms[1];
  if (a > 10 && a < 20) return forms[2];
  if (b === 1) return forms[0];
  if (b >= 2 && b <= 4) return forms[1];
  return forms[2];
}
const COIN_FORMS = ['монетка', 'монетки', 'монеток'];
const UAH_FORMS = ['гривня', 'гривні', 'гривень'];

export function num(n) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
}
// «3 монетки» / «35 грн»
export function money(k, s, { words = false } = {}) {
  const n = fromK(k, s);
  if (s.currency === 'uah') return words ? `${num(n)} ${plural(n, UAH_FORMS)}` : `${num(n)} грн`;
  return `${num(n)} ${plural(n, COIN_FORMS)}`;
}
// для батьків: «3 монетки (15 грн)»
export function moneyFull(k, s) {
  if (s.currency === 'uah') return money(k, s);
  return `${money(k, s)} · ${num(k / 100)} грн`;
}

// ---- баланси ----
export function balances(ledger) {
  const b = { spend: 0, save: 0, give: 0 };
  for (const e of ledger) for (const j of JARS) b[j] += e.amounts?.[j] || 0;
  return b;
}
export function total(b) { return b.spend + b.save + b.give; }

const EARN_TYPES = new Set(['earn', 'bonus']);

// Розподіл винагороди по скарбничках: кожну одиницю (монетку чи гривню) отримує скарбничка
// з найбільшим «недобором» від свого відсотка за всю історію — так частки точні в довгу,
// а жодна скарбничка ніколи не зменшується.
export function splitReward(s, ledger, amountK) {
  const out = { spend: 0, save: 0, give: 0 };
  if (!s.jarsEnabled) { out.spend = amountK; return out; }
  const unit = unitK(s);
  const cum = { spend: 0, save: 0, give: 0 };
  for (const e of ledger) {
    if (!EARN_TYPES.has(e.type)) continue;
    for (const j of JARS) cum[j] += Math.floor((e.amounts?.[j] || 0) / unit);
  }
  const pctSum = JARS.reduce((a, j) => a + (Number(s.jarPct[j]) || 0), 0) || 1;
  let n = cum.spend + cum.save + cum.give;
  const units = Math.floor(amountK / unit);
  for (let i = 0; i < units; i++) {
    n++;
    let best = 'spend', bestDef = -Infinity;
    for (const j of ['save', 'give', 'spend']) {
      const def = (Number(s.jarPct[j]) || 0) / pctSum * n - cum[j];
      if (def > bestDef + 1e-9) { best = j; bestDef = def; }
    }
    cum[best]++;
    out[best] += unit;
  }
  out.spend += amountK - units * unit;
  return out;
}

// ---- завдання на сьогодні ----
export function taskState(task, completions, today = dayKey()) {
  const mine = completions.filter(c => c.taskId === task.id);
  const todays = mine.filter(c => c.date === today);
  const pending = mine.filter(c => c.status === 'pending');
  const approvedToday = todays.filter(c => c.status === 'approved').length;
  if (task.repeat === 'daily') {
    const t = todays.find(c => c.status !== 'rejected');
    return { status: t ? t.status : 'open', approvedToday, pendingCount: pending.length };
  }
  if (task.repeat === 'once') {
    if (mine.some(c => c.status === 'approved')) return { status: 'approved', approvedToday, pendingCount: 0 };
    return { status: pending.length ? 'pending' : 'open', approvedToday, pendingCount: pending.length };
  }
  return { status: 'open', approvedToday, pendingCount: pending.length };
}

export function approvedDays(taskId, completions) {
  return new Set(completions.filter(c => c.taskId === taskId && c.status === 'approved').map(c => c.date));
}
// скільки днів поспіль виконано, рахуючи до endDate включно
export function streakUntil(days, endDate) {
  let n = 0, d = endDate;
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
export function currentStreak(taskId, completions, today = dayKey()) {
  const days = approvedDays(taskId, completions);
  return days.has(today) ? streakUntil(days, today) : streakUntil(days, addDays(today, -1));
}

// Записи для підтвердження виконаного завдання (батч операцій сховища).
export function approveOps(c, data, now = Date.now()) {
  const s = data.settings;
  const amounts = splitReward(s, data.ledger, c.price);
  const earn = { ts: now, type: 'earn', amounts, note: c.title, icon: c.icon, ref: c.id };
  const ops = [
    { op: 'update', col: 'completions', id: c.id, data: { status: 'approved', decidedAt: now } },
    { op: 'set', col: 'ledger', id: 'earn_' + c.id, data: earn },
  ];
  const task = data.tasks.find(t => t.id === c.taskId);
  if (task?.repeat === 'once') ops.push({ op: 'update', col: 'tasks', id: task.id, data: { active: false } });
  if (task?.repeat === 'daily' && s.streak.enabled && s.streak.days > 1 && s.streak.bonus > 0) {
    const days = approvedDays(c.taskId, data.completions);
    days.add(c.date);
    const streak = streakUntil(days, c.date);
    if (streak > 0 && streak % s.streak.days === 0) {
      const bonusK = toK(s.streak.bonus, s);
      ops.push({ op: 'set', col: 'ledger', id: 'bonus_' + c.id, data: {
        ts: now + 1, type: 'bonus', amounts: splitReward(s, [...data.ledger, earn], bonusK),
        note: `${streak} днів поспіль: ${c.title}`, icon: '🔥', ref: c.id,
      } });
    }
  }
  return ops;
}

export function buyOps(w, now = Date.now()) {
  return [
    { op: 'set', col: 'ledger', id: 'buy_' + w.id, data: { ts: now, type: 'spend', amounts: { [w.jar || 'save']: -w.price }, note: w.title || 'Мрія', icon: w.emoji || '🎁', ref: w.id } },
    { op: 'update', col: 'wishes', id: w.id, data: { status: 'bought', boughtAt: now } },
  ];
}

// ---- ідентифікатори ----
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function randomCode(n = 10) {
  const a = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(a, x => ALPH[x % ALPH.length]).join('');
}
export function uid() { return Date.now().toString(36) + randomCode(6).toLowerCase(); }

export async function hashPin(pin, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`mm:${salt}:${pin}`));
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

export function vocative(name) {
  const n = (name || '').trim();
  if (/ія$/i.test(n)) return n.slice(0, -1) + 'є';
  if (/[^і]я$/i.test(n)) return n.slice(0, -1) + 'ю';
  if (/а$/i.test(n)) return n.slice(0, -1) + 'о';
  return n;
}
