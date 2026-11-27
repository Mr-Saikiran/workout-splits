// Durable storage and native helpers.
//
// Everything the user saves (profile, planner position, saved videos, weight
// log, reminders) lives in one JSON object. In the Android / iOS app it is
// written to Capacitor Preferences, which the OS does not clear the way it can
// clear a web view's storage; it is mirrored to localStorage, which is all the
// website uses (and the browser is asked to keep it permanently).
//
// The apps load no bundler, so plugins are called through the bridge that
// Capacitor injects: Capacitor.nativePromise(plugin, method, options).
(function (WS) {
  const KEY = 'workout-splits:data';
  const LEGACY_PROFILE = 'workout-splits:profile';

  const cap = () => window.Capacitor;
  const isNative = () => !!(cap() && cap().isNativePlatform && cap().isNativePlatform() && cap().nativePromise);
  const hasPlugin = (name) => isNative() && (cap().PluginHeaders || []).some((h) => h.name === name);
  const call = (plugin, method, options) => cap().nativePromise(plugin, method, options || {});

  const local = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode or full */ } },
  };

  let data = { v: 1 };
  let pending = null;
  const listeners = [];

  async function init() {
    let raw = null;
    if (hasPlugin('Preferences')) {
      try { raw = (await call('Preferences', 'get', { key: KEY })).value; } catch (e) { /* fall back below */ }
    }
    if (!raw) raw = local.get(KEY);
    try { data = Object.assign({ v: 1 }, JSON.parse(raw || '{}')); } catch (e) { data = { v: 1 }; }
    if (!data.profile) {
      try { const old = JSON.parse(local.get(LEGACY_PROFILE) || 'null'); if (old) data.profile = old; } catch (e) { /* ignore */ }
    }
    if (!isNative() && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    return data;
  }

  function flush() {
    clearTimeout(pending);
    pending = null;
    const raw = JSON.stringify(data);
    local.set(KEY, raw);
    if (hasPlugin('Preferences')) call('Preferences', 'set', { key: KEY, value: raw }).catch(() => {});
  }

  function get(key, fallback) { return data[key] === undefined ? fallback : data[key]; }

  function set(key, value) {
    data[key] = value;
    data.savedAt = new Date().toISOString();
    clearTimeout(pending);
    pending = setTimeout(flush, 300);
    listeners.forEach((fn) => fn(key));
  }

  const onChange = (fn) => listeners.push(fn);

  function exportJSON() {
    return JSON.stringify({ app: 'workout-splits', version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.app !== 'workout-splits' || typeof parsed.data !== 'object') throw new Error('Not a Workout Splits backup file.');
    data = Object.assign({ v: 1 }, parsed.data);
    flush();
    listeners.forEach((fn) => fn('*'));
  }

  async function persisted() {
    if (hasPlugin('Preferences')) return true;
    try { return navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false; } catch (e) { return false; }
  }

  window.addEventListener('pagehide', () => { if (pending) flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && pending) flush(); });

  // ---------- files ----------

  const toBase64 = (text) => btoa(unescape(encodeURIComponent(text)));

  // Saves a file: a download on the web, the share sheet in the apps.
  // `content` is text, or base64 when `isBase64` is true.
  async function saveFile(name, mime, content, isBase64) {
    if (hasPlugin('Filesystem') && hasPlugin('Share')) {
      const written = await call('Filesystem', 'writeFile', { path: name, data: isBase64 ? content : toBase64(content), directory: 'CACHE', recursive: true });
      try { await call('Share', 'share', { title: name, files: [written.uri] }); } catch (e) { /* user closed the share sheet */ }
      return 'shared';
    }
    let blob;
    if (isBase64) {
      const bin = atob(content);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      blob = new Blob([bytes], { type: mime });
    } else {
      blob = new Blob([content], { type: mime });
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    return 'downloaded';
  }

  // ---------- reminders ----------

  // Weekly local notification in the apps. weekday: 1 = Sunday … 7 = Saturday.
  async function scheduleWeekly({ id, title, body, weekday, hour, minute }) {
    if (!hasPlugin('LocalNotifications')) return false;
    const perm = await call('LocalNotifications', 'requestPermissions');
    if (perm.display !== 'granted') throw new Error('Notifications are turned off for this app in your phone settings.');
    await call('LocalNotifications', 'cancel', { notifications: [{ id }] }).catch(() => {});
    await call('LocalNotifications', 'schedule', {
      notifications: [{ id, title, body, schedule: { on: { weekday, hour, minute }, allowWhileIdle: true } }],
    });
    return true;
  }

  async function cancelReminder(id) {
    if (hasPlugin('LocalNotifications')) await call('LocalNotifications', 'cancel', { notifications: [{ id }] }).catch(() => {});
  }

  WS.store = { init, get, set, flush, onChange, exportJSON, importJSON, persisted };
  WS.native = { isNative, hasPlugin, saveFile, scheduleWeekly, cancelReminder, canNotify: () => hasPlugin('LocalNotifications') };
})(window.WS = window.WS || {});
