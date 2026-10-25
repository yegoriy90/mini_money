// Сховище: однаковий інтерфейс для локального режиму (localStorage) і Firebase Firestore.
// Дані сім'ї: families/{fid}/{col}/{id}, col ∈ COLS. Налаштування — meta/settings.
import { firebaseConfig } from './firebase-config.js';

export const COLS = ['meta', 'tasks', 'wishes', 'completions', 'ledger'];
export const cloudAvailable = !!(firebaseConfig && firebaseConfig.apiKey);
export const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';

function clean(obj) { return JSON.parse(JSON.stringify(obj)); }

function snapshotState(cols, ready) {
  const list = c => Object.entries(cols[c] || {}).map(([id, d]) => ({ id, ...d }));
  return {
    ready,
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
    const au = auth.getAuth(a);
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
    return { fs, db };
  })().catch(e => { fbPromise = null; throw e; });
}

class CloudStore {
  constructor(fid) { this.fid = fid; this.mode = 'cloud'; this.cols = {}; }
  async open() { const { fs, db } = await loadFirebase(); this.fs = fs; this.db = db; return this; }
  ref(col, id) { return this.fs.doc(this.db, 'families', this.fid, col, id); }
  async exists() {
    const snap = await this.fs.getDoc(this.fs.doc(this.db, 'families', this.fid));
    return snap.exists();
  }
  async createRoot() {
    await this.fs.setDoc(this.fs.doc(this.db, 'families', this.fid), { createdAt: Date.now() });
  }
  watch(cb, onError) {
    const seen = new Set();
    const offs = COLS.map(col => this.fs.onSnapshot(this.fs.collection(this.db, 'families', this.fid, col), snap => {
      const c = {};
      snap.forEach(d => { c[d.id] = d.data(); });
      this.cols[col] = c;
      seen.add(col);
      cb(snapshotState(this.cols, seen.size === COLS.length));
    }, err => onError?.(err)));
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
}

export async function openStore(fid) {
  if (fid === 'local' || !cloudAvailable) return new LocalStore('local');
  return new CloudStore(fid).open();
}

export function localStore() { return new LocalStore('local'); }

// Перенос локальних даних у нову хмарну сім'ю
export async function migrateToCloud(fid) {
  const src = new LocalStore('local').dump();
  const dst = await new CloudStore(fid).open();
  await dst.createRoot();
  const ops = [];
  for (const col of COLS) for (const [id, data] of Object.entries(src[col] || {})) ops.push({ op: 'set', col, id, data });
  await dst.batch(ops);
  return dst;
}

export async function createCloudFamily(fid) {
  const s = await new CloudStore(fid).open();
  await s.createRoot();
  return s;
}

export async function cloudFamilyExists(fid) {
  const s = await new CloudStore(fid).open();
  return s.exists();
}
