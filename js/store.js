// Сховище: однаковий інтерфейс для локального режиму (localStorage) і Firebase Firestore.
// Дані сім'ї: families/{fid}/{col}/{id}, col ∈ COLS. Налаштування — meta/settings.
import { firebaseConfig } from './firebase-config.js';

export const COLS = ['meta', 'tasks', 'wishes', 'completions', 'ledger'];
export const cloudAvailable = !!(firebaseConfig && firebaseConfig.apiKey);
// у нативному застосунку (capacitor://) Firebase SDK лежить локально в www/vendor — див. tools/build_www.js
export const FB = location.protocol === 'capacitor:' ? new URL('../vendor/firebase/', import.meta.url).href : 'https://www.gstatic.com/firebasejs/10.12.2/';

function clean(obj) { return JSON.parse(JSON.stringify(obj)); }

function snapshotState(cols, ready, extra = {}) {
  const list = c => Object.entries(cols[c] || {}).map(([id, d]) => ({ id, ...d }));
  return {
    ready, ...extra,
    settings: cols.meta?.settings || null,
    tasks: list('tasks').sort((a, b) => (a.order ?? a.createdAt ?? 0) - (b.order ?? b.createdAt ?? 0)),
    wishes: list('wishes').sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    completions: list('completions').sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    ledger: list('ledger').sort((a, b) => (a.ts || 0) - (b.ts || 0)),
  };
}

// ---------- локально ----------
class LocalStore {
  constructor(fid) {
    this.fid = fid;
    this.key = 'mm.data.' + fid;
    this.cols = this.load();
    this.listeners = new Set();
    this.mode = 'local';
    window.addEventListener('storage', e => { if (e.key === this.key) { this.cols = this.load(); this.emit(); } });
  }
  load() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch { return {}; }
  }
  save() { localStorage.setItem(this.key, JSON.stringify(this.cols)); }
  emit() { const st = snapshotState(this.cols, true); this.listeners.forEach(cb => cb(st)); }
  watch(cb) { this.listeners.add(cb); cb(snapshotState(this.cols, true)); return () => this.listeners.delete(cb); }
  async exists() { return !!this.cols.meta?.settings; }
  async batch(ops) {
    for (const { op, col, id, data } of ops) {
      const c = (this.cols[col] ||= {});
      if (op === 'set') c[id] = clean(data);
      else if (op === 'update') c[id] = { ...(c[id] || {}), ...clean(data) };
      else if (op === 'delete') delete c[id];
    }
    try { this.save(); } catch (e) { throw new Error('Не вистачає місця на пристрої — видаліть кілька фото мрій'); }
    this.emit();
  }
  dump() { return clean(this.cols); }
}

// ---------- Firebase ----------
let fbPromise = null;
function loadFirebase() {
  return fbPromise ||= (async () => {
    const [app, auth, fs] = await Promise.all([
      import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js'),
    ]);
    const a = app.initializeApp(firebaseConfig);
    // у нативі (capacitor://) getAuth() зависає: тягне popup/redirect-резолвер з iframe authDomain,
    // і onAuthStateChanged не спрацьовує. Без резолвера, лише з IndexedDB — працює.
    const au = location.protocol === 'capacitor:'
      ? auth.initializeAuth(a, { persistence: [auth.indexedDBLocalPersistence, auth.inMemoryPersistence] })
      : auth.getAuth(a);
    let db;
    try {
      db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
    } catch { db = fs.getFirestore(a); }
    // для локальної розробки: firebaseConfig.emulator = 'localhost'
    if (firebaseConfig.emulator) {
      auth.connectAuthEmulator(au, `http://${firebaseConfig.emulator}:9099`, { disableWarnings: true });
      fs.connectFirestoreEmulator(db, firebaseConfig.emulator, 8080);
    }
    if (!au.currentUser) {
      await new Promise(res => { const off = auth.onAuthStateChanged(au, u => { off(); res(u); }); });
    }
    if (!au.currentUser) await auth.signInAnonymously(au);
    return { fs, db, uid: au.currentUser.uid };
  })().catch(e => { fbPromise = null; throw e; });
}

// назва пристрою для списку «Пристрої сім'ї»
export function deviceLabel() {
  const ua = navigator.userAgent;
  if (/iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android-телефон' : 'Android-планшет';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Комп’ютер';
  return 'Пристрій';
}
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), x => ALPH[x % ALPH.length]).join('');

class CloudStore {
  constructor(fid) { this.fid = fid; this.mode = 'cloud'; this.cols = {}; this.family = null; this.members = null; }
  async open() { const { fs, db, uid } = await loadFirebase(); this.fs = fs; this.db = db; this.uid = uid; return this; }
  ref(col, id) { return this.fs.doc(this.db, 'families', this.fid, col, id); }
  rootRef() { return this.fs.doc(this.db, 'families', this.fid); }
  async exists() {
    const snap = await this.fs.getDoc(this.rootRef());
    return snap.exists();
  }
  async createRoot() {
    // спершу без legacy: якщо в хмарі ще старі правила і членство не запишеться, сім'я лишиться доступною за кодом
    await this.fs.setDoc(this.rootRef(), { createdAt: Date.now(), owner: this.uid });
  }
  // записати цей пристрій у сім'ю (якщо ще не записаний); invite — код запрошення
  async ensureMember(info = {}, invite) {
    const r = this.ref('members', this.uid);
    try { if ((await this.fs.getDoc(r)).exists()) return true; } catch { /* ще не член — читати не можна */ }
    await this.fs.setDoc(r, { role: info.role || 'child', label: info.label || deviceLabel(), joinedAt: Date.now(), ...(invite ? { invite } : {}) });
    return true;
  }
  watch(cb, onError) {
    const seen = new Set();
    const emit = () => cb(snapshotState(this.cols, seen.size === COLS.length, { family: this.family, members: this.members, uid: this.uid }));
    const offs = COLS.map(col => this.fs.onSnapshot(this.fs.collection(this.db, 'families', this.fid, col), snap => {
      const c = {};
      snap.forEach(d => { c[d.id] = d.data(); });
      this.cols[col] = c;
      seen.add(col);
      emit();
    }, err => onError?.(err)));
    // сім'я й пристрої — необов'язкові (за старих правил читати їх не можна)
    offs.push(this.fs.onSnapshot(this.rootRef(), d => { this.family = d.exists() ? d.data() : null; emit(); }, () => {}));
    offs.push(this.fs.onSnapshot(this.fs.collection(this.db, 'families', this.fid, 'members'), snap => {
      this.members = []; snap.forEach(d => this.members.push({ id: d.id, ...d.data() })); emit();
    }, err => { if (this.members) onError?.(err); /* доступ був і зник — пристрій відключили */ }));
    return () => offs.forEach(f => f());
  }
  async batch(ops) {
    // Firestore дозволяє до 500 операцій в одному батчі
    for (let i = 0; i < ops.length; i += 400) {
      const b = this.fs.writeBatch(this.db);
      for (const { op, col, id, data } of ops.slice(i, i + 400)) {
        const r = this.ref(col, id);
        if (op === 'set') b.set(r, clean(data));
        else if (op === 'update') b.set(r, clean(data), { merge: true });
        else if (op === 'delete') b.delete(r);
      }
      // не чекаємо сервер: офлайн запис іде в локальний кеш і синхронізується пізніше
      const p = b.commit();
      if (navigator.onLine) await Promise.race([p, new Promise(r => setTimeout(r, 4000))]);
      else p.catch(() => {});
    }
  }
  // одноразовий код для нового пристрою (8 символів, 30 хвилин)
  async createInvite(minutes = 30) {
    const c = code(8), exp = Date.now() + minutes * 60000;
    await this.fs.setDoc(this.fs.doc(this.db, 'invites', c), { fid: this.fid, exp, createdBy: this.uid });
    return { code: c, exp };
  }
  async updateMe(data) { await this.fs.setDoc(this.ref('members', this.uid), data, { merge: true }); }
  async removeMember(uid) { await this.fs.deleteDoc(this.ref('members', uid)); }
  async closeLegacy() { await this.fs.setDoc(this.rootRef(), { legacy: false }, { merge: true }); }
  // повне видалення сім'ї: усі колекції, інші пристрої, корінь, а цей пристрій — останнім
  async deleteFamily() {
    const del = async refs => { for (let i = 0; i < refs.length; i += 400) { const b = this.fs.writeBatch(this.db); refs.slice(i, i + 400).forEach(r => b.delete(r)); await b.commit(); } };
    for (const col of COLS) {
      const snap = await this.fs.getDocs(this.fs.collection(this.db, 'families', this.fid, col));
      await del(snap.docs.map(d => d.ref));
    }
    const mem = await this.fs.getDocs(this.fs.collection(this.db, 'families', this.fid, 'members'));
    await del(mem.docs.filter(d => d.id !== this.uid).map(d => d.ref));
    await this.fs.deleteDoc(this.rootRef());
    await this.fs.deleteDoc(this.ref('members', this.uid));
  }
}

export async function openStore(fid) {
  if (fid === 'local' || !cloudAvailable) return new LocalStore('local');
  return new CloudStore(fid).open();
}

export function localStore() { return new LocalStore('local'); }

// Перенос локальних даних у нову хмарну сім'ю
export async function migrateToCloud(fid, info) {
  const src = new LocalStore('local').dump();
  const dst = await createCloudFamily(fid, info);
  const ops = [];
  for (const col of COLS) for (const [id, data] of Object.entries(src[col] || {})) ops.push({ op: 'set', col, id, data });
  await dst.batch(ops);
  return dst;
}

export async function createCloudFamily(fid, info = {}) {
  const s = await new CloudStore(fid).open();
  await s.createRoot();
  try { await s.ensureMember({ ...info, role: info.role || 'parent' }); await s.closeLegacy(); } catch { /* старі правила без членства — не заважає */ }
  return s;
}

// Приєднатися: спершу як код запрошення, потім — як старий код сім'ї (перехідний режим)
export async function joinFamily(raw, info = {}) {
  const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const probe = await new CloudStore('_').open();
  if (c.length === 8) {
    const inv = await probe.fs.getDoc(probe.fs.doc(probe.db, 'invites', c));
    if (!inv.exists()) throw new Error('Такого коду немає — попросіть новий');
    const { fid, exp } = inv.data();
    if (exp < Date.now()) throw new Error('Код уже не діє — попросіть новий');
    const s = await new CloudStore(fid).open();
    await s.ensureMember(info, c);
    return fid;
  }
  if (c.length === 10) {
    const s = await new CloudStore(c).open();
    let ok;
    try { ok = await s.exists(); } catch (e) { if (e.code === 'permission-denied') throw new Error('Код не підходить або вже закритий — попросіть код запрошення'); throw e; }
    if (!ok) throw new Error('Такої сім\'ї не знайдено');
    try { await s.ensureMember(info); } catch {
      // старі правила (без членства): достатньо, що дані читаються
      try { await s.fs.getDoc(s.ref('meta', 'settings')); } catch { throw new Error('Код не підходить або вже закритий — попросіть код запрошення'); }
    }
    return c;
  }
  throw new Error('Код запрошення має 8 символів');
}

export async function cloudFamilyExists(fid) {
  const s = await new CloudStore(fid).open();
  return s.exists();
}
