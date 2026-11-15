// Нативні можливості (Capacitor): вібровідгук, нагадування, камера.
// У браузері/PWA все це тихо нічого не робить — застосунок працює як раніше.
const Cap = window.Capacitor;
export const isNative = !!Cap?.isNativePlatform?.();
const plugin = name => (isNative ? (Cap.registerPlugin?.(name) || Cap.Plugins?.[name]) : null);
const Haptics = plugin('Haptics'), Notes = plugin('LocalNotifications'), Camera = plugin('Camera');

// ---------- вібровідгук ----------
export const haptic = {
  tap() { Haptics?.impact({ style: 'LIGHT' }).catch(() => {}); },
  coin() { Haptics?.impact({ style: 'MEDIUM' }).catch(() => {}); },
  success() { Haptics?.notification({ type: 'SUCCESS' }).catch(() => {}); },
  big() { Haptics?.notification({ type: 'SUCCESS' }).catch(() => {}); setTimeout(() => Haptics?.impact({ style: 'HEAVY' }).catch(() => {}), 350); },
};

// ---------- нагадування (налаштування — лише цього пристрою, у localStorage) ----------
export const REMINDERS = [
  { key: 'morning', id: 101, label: '🌅 Ранкові звички', def: '08:00' },
  { key: 'evening', id: 102, label: '🌙 Вечірні звички', def: '19:30' },
];
const RKEY = 'mm.remind';
export function getReminders() {
  try { return JSON.parse(localStorage.getItem(RKEY)) || {}; } catch { return {}; }
}

function texts(key, role, name) {
  if (role === 'parent') {
    return key === 'morning'
      ? { title: 'Mini Money', body: `Доброго ранку! Нагадайте${name ? ` ${name}` : ''} про ранкові звички 🌅` }
      : { title: 'Mini Money', body: 'Час перевірити справи за сьогодні ✅' };
  }
  return key === 'morning'
    ? { title: 'Доброго ранку! 🌅', body: 'Ранкові звички чекають — зароби сердечка ❤️' }
    : { title: 'Добрий вечір! 🌙', body: 'Вечірні звички — і можна казку 💫' };
}

// записати розклад у систему; повертає false, якщо дозволу на сповіщення немає
export async function applyReminders(r, { role = 'child', name = '' } = {}) {
  if (!Notes) return true;
  const on = REMINDERS.filter(x => r[x.key]);
  if (on.length) {
    let p = await Notes.checkPermissions();
    if (p.display !== 'granted') p = await Notes.requestPermissions();
    if (p.display !== 'granted') return false;
  }
  await Notes.cancel({ notifications: REMINDERS.map(x => ({ id: x.id })) }).catch(() => {});
  if (on.length) {
    await Notes.schedule({
      notifications: on.map(x => {
        const [hour, minute] = r[x.key].split(':').map(Number);
        return { id: x.id, ...texts(x.key, role, name), schedule: { on: { hour, minute }, allowWhileIdle: true } };
      }),
    });
  }
  return true;
}

export async function setReminders(r, ctx) {
  localStorage.setItem(RKEY, JSON.stringify(r));
  return applyReminders(r, ctx);
}

// ---------- камера ----------
// повертає Blob з фото або null, якщо скасували
export async function pickPhoto() {
  try {
    const p = await Camera.getPhoto({
      source: 'PROMPT', resultType: 'dataUrl', quality: 85, width: 1280, correctOrientation: true,
      promptLabelHeader: 'Фото мрії', promptLabelPhoto: 'Вибрати з фото', promptLabelPicture: 'Сфотографувати', promptLabelCancel: 'Скасувати',
    });
    return await (await fetch(p.dataUrl)).blob();
  } catch (e) {
    if (/cancel/i.test(e?.message || '')) return null;
    throw e;
  }
}
