// Saved videos, Progress (weight log, reminder, backup) and Cult.fit tabs.
// Everything is kept with WS.store, so it survives reloads and app restarts.
(function (WS) {
  const ui = () => WS.ui;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const fmtDate = (iso) => new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

  // ---------- Saved videos ----------

  const CATEGORIES = ['Workout', 'Exercise form', 'Recipe', 'Diet', 'Yoga', 'Pilates', 'Meditation', 'Sleep', 'Motivation', 'Other'];

  // YouTube video id from watch, youtu.be, shorts, embed and live links.
  function youtubeId(url) {
    const m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function normaliseUrl(raw) {
    const s = raw.trim();
    if (!s) return '';
    return /^https?:\/\//i.test(s) ? s : 'https://' + s;
  }

  async function fetchTitle(url) {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url), { signal: ctrl.signal });
      return r.ok ? (await r.json()).title || '' : '';
    } catch (e) { return ''; }
  }

  function videoCard(v) {
    const { esc } = ui();
    const thumb = v.ytId ? `https://i.ytimg.com/vi/${v.ytId}/hqdefault.jpg` : '';
    return `<article class="card saved-card">
      <a class="saved-thumb${v.isShort ? ' short' : ''}" href="${esc(v.url)}" target="_blank" rel="noopener">
        ${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : '<span class="saved-link-icon">🔗</span>'}
        ${v.isShort ? '<span class="short-badge">Short</span>' : ''}</a>
      <div class="saved-body">
        <h4>${esc(v.title || (v.isShort ? 'YouTube Short' : v.ytId ? 'YouTube video' : v.url))}</h4>
        <div class="chips"><span class="chip accent">${esc(v.category)}</span><span class="chip">${fmtDate(v.added)}</span></div>
        ${v.notes ? `<p class="small">${esc(v.notes)}</p>` : ''}
        <div class="saved-actions">
          <a class="btn small" href="${esc(v.url)}" target="_blank" rel="noopener">▶ Open</a>
          <button class="btn small" data-edit="${v.id}">Edit</button>
          <button class="btn small" data-del="${v.id}">Delete</button>
        </div>
      </div></article>`;
  }

  WS.renderSaved = function renderSaved() {
    const { $ } = ui();
    const panel = $('#tab-saved');
    const opts = CATEGORIES.map((c) => `<option>${c}</option>`).join('');
    panel.innerHTML = `
      <div class="hero"><h1>Saved videos.</h1>
        <p>Keep YouTube Shorts, videos and any other links you want to come back to, with your own notes. They're saved on this device.</p></div>
      <form class="card saved-form" id="sv-form" autocomplete="off">
        <input type="hidden" id="sv-id">
        <div class="filters diet-filters">
          <label class="grow">Link<input type="url" id="sv-url" placeholder="https://youtube.com/shorts/…" required></label>
          <label>Category<select id="sv-cat">${opts}</select></label>
        </div>
        <div class="filters diet-filters">
          <label class="grow">Title <span class="opt">(optional, filled in for YouTube when possible)</span><input type="text" id="sv-title" maxlength="140"></label>
        </div>
        <label class="notes-field">Notes<textarea id="sv-notes" rows="2" maxlength="600" placeholder="e.g. good cue for elbow position, try on push day"></textarea></label>
        <div class="saved-form-actions"><button class="btn primary" type="submit" id="sv-submit">Save link</button>
          <button class="btn" type="button" id="sv-paste">📋 Paste link</button>
          <button class="btn" type="button" id="sv-cancel" hidden>Cancel edit</button>
          <span class="small muted" id="sv-msg"></span></div>
      </form>
      <div class="filters diet-filters">
        <label>Show<select id="sv-type"><option value="">Everything</option><option value="short">YouTube Shorts</option><option value="video">YouTube videos</option><option value="link">Other links</option></select></label>
        <label>Category<select id="sv-fcat"><option value="">All categories</option>${opts}</select></label>
        <label>Sort<select id="sv-sort"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="title">Title A–Z</option></select></label>
        <label class="grow">Search<input type="search" id="sv-search" placeholder="Search titles and notes"></label>
      </div>
      <p class="more-splits" id="sv-count"></p>
      <div class="saved-grid" id="sv-grid"></div>`;

    const videos = () => WS.store.get('videos', []);
    const draw = () => {
      const type = $('#sv-type').value, cat = $('#sv-fcat').value, sort = $('#sv-sort').value;
      const q = $('#sv-search').value.trim().toLowerCase();
      const list = videos().filter((v) => (!cat || v.category === cat)
        && (!type || (type === 'short' ? v.isShort : type === 'video' ? v.ytId && !v.isShort : !v.ytId))
        && (!q || `${v.title} ${v.notes} ${v.url}`.toLowerCase().includes(q)))
        .sort((a, b) => sort === 'title' ? (a.title || '').localeCompare(b.title || '') : sort === 'old' ? a.added.localeCompare(b.added) : b.added.localeCompare(a.added));
      const all = videos().length;
      $('#sv-count').textContent = all ? `${list.length} of ${all} saved` : '';
      $('#sv-grid').innerHTML = list.map(videoCard).join('') || `<p class="muted">${all ? 'Nothing matches these filters.' : 'No saved links yet. Paste a YouTube Short or any link above.'}</p>`;
    };
    const resetForm = () => {
      $('#sv-form').reset();
      $('#sv-id').value = '';
      $('#sv-submit').textContent = 'Save link';
      $('#sv-cancel').hidden = true;
    };
    const msg = (t) => { $('#sv-msg').textContent = t; setTimeout(() => { if ($('#sv-msg').textContent === t) $('#sv-msg').textContent = ''; }, 3000); };

    $('#sv-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = normaliseUrl($('#sv-url').value);
      if (!url) return;
      const ytId = youtubeId(url);
      const id = $('#sv-id').value;
      let title = $('#sv-title').value.trim();
      if (!title && ytId) { msg('Getting the title…'); title = await fetchTitle(url); }
      const entry = { url, ytId, isShort: /\/shorts\//.test(url), title, category: $('#sv-cat').value, notes: $('#sv-notes').value.trim() };
      const list = videos().slice();
      if (id) Object.assign(list.find((v) => v.id === id) || {}, entry);
      else list.unshift(Object.assign({ id: uid(), added: new Date().toISOString() }, entry));
      WS.store.set('videos', list);
      resetForm();
      msg(id ? 'Updated ✓' : 'Saved ✓');
      draw();
    });
    $('#sv-paste').addEventListener('click', async () => {
      try { $('#sv-url').value = (await navigator.clipboard.readText()).trim(); } catch (e) { msg('Paste with long-press or Ctrl+V instead.'); }
    });
    $('#sv-cancel').addEventListener('click', resetForm);
    panel.addEventListener('change', (e) => { if (['sv-type', 'sv-fcat', 'sv-sort'].includes(e.target.id)) draw(); });
    $('#sv-search').addEventListener('input', draw);
    $('#sv-grid').addEventListener('click', (e) => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      if (edit) {
        const v = videos().find((x) => x.id === edit.dataset.edit);
        $('#sv-id').value = v.id; $('#sv-url').value = v.url; $('#sv-title').value = v.title || '';
        $('#sv-cat').value = v.category; $('#sv-notes').value = v.notes || '';
        $('#sv-submit').textContent = 'Update link'; $('#sv-cancel').hidden = false;
        $('#sv-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (del && confirm('Delete this saved link?')) {
        WS.store.set('videos', videos().filter((x) => x.id !== del.dataset.del));
        draw();
      }
    });
    draw();
    renderSaved.refresh = draw;
  };

  // ---------- Progress: weight ----------

  const LB = 2.20462;
  const unit = () => WS.store.get('unit', 'kg');
  const toUnit = (kg) => (unit() === 'lb' ? kg * LB : kg);
  const show = (kg, digits = 1) => `${(Math.round(toUnit(kg) * 10 ** digits) / 10 ** digits).toFixed(digits)} ${unit()}`;
  const weights = () => WS.store.get('weights', []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const DAY = 86400000;
  const days = (a, b) => (new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / DAY;

  // Weekly rate (kg/week) from a least-squares line through the last 8 weeks.
  function weeklyRate(list) {
    if (list.length < 2) return null;
    const last = list[list.length - 1].date;
    const recent = list.filter((w) => days(w.date, last) <= 56);
    if (recent.length < 2 || days(recent[0].date, last) < 6) return null;
    const xs = recent.map((w) => days(recent[0].date, w.date)), ys = recent.map((w) => w.kg);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const slope = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
    return slope * 7;
  }

  // Healthy weekly change for the planner goal, as % of body weight.
  const GOAL_RATES = {
    muscle: [0.25, 0.5, 'Bulking: gain about 0.25–0.5% of body weight a week'],
    strength: [0, 0.5, 'Strength: hold or gain slowly (0–0.5% a week)'],
    fatloss: [-1, -0.5, 'Fat loss: lose about 0.5–1% of body weight a week'],
    recomp: [-0.25, 0.25, 'Recomposition / toning: keep weight roughly stable (±0.25% a week)'],
    general: [-0.25, 0.25, 'Health: keep weight roughly stable'],
    athletic: [-0.25, 0.25, 'Performance: keep weight roughly stable'],
  };

  function chart(list) {
    if (list.length < 2) return '<p class="muted">Log at least two weigh-ins to see your graph.</p>';
    const W = 640, H = 240, pad = { l: 46, r: 14, t: 14, b: 30 };
    const vals = list.map((w) => toUnit(w.kg));
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const span = Math.max(hi - lo, 1);
    lo -= span * 0.15; hi += span * 0.15;
    const t0 = new Date(list[0].date).getTime(), t1 = new Date(list[list.length - 1].date).getTime();
    const x = (d) => pad.l + ((new Date(d).getTime() - t0) / Math.max(t1 - t0, DAY)) * (W - pad.l - pad.r);
    const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
    const pts = list.map((w, i) => [x(w.date), y(vals[i])]);
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const v = lo + (hi - lo) * (1 - f), yy = pad.t + f * (H - pad.t - pad.b);
      return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${yy}" y2="${yy}" class="grid"/><text x="${pad.l - 6}" y="${yy + 4}" text-anchor="end">${v.toFixed(1)}</text>`;
    }).join('');
    const label = (w, anchor) => `<text x="${x(w.date)}" y="${H - 8}" text-anchor="${anchor}">${new Date(w.date + 'T00:00:00').toLocaleDateString([], { day: 'numeric', month: 'short' })}</text>`;
    return `<svg class="weight-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight over time">
      ${grid}<path d="${path}" class="line"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5"><title>${fmtDate(list[i].date)}: ${show(list[i].kg)}</title></circle>`).join('')}
      ${label(list[0], 'start')}${label(list[list.length - 1], 'end')}</svg>`;
  }

  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const REMINDER_ID = 7001;

  // Weekly .ics event, for calendars on any device.
  function reminderIcs(r) {
    const [h, m] = r.time.split(':').map(Number);
    const start = new Date();
    start.setDate(start.getDate() + ((r.weekday - 1 - start.getDay() + 7) % 7));
    start.setHours(h, m, 0, 0);
    const p = (n) => String(n).padStart(2, '0');
    const stamp = (d) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
    const end = new Date(start.getTime() + 10 * 60000);
    const day = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][r.weekday - 1];
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Workout Splits//Weigh-in//EN', 'BEGIN:VEVENT',
      `UID:weigh-in-${Date.now()}@workout-splits`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${day}`, 'SUMMARY:Weekly weigh-in (Workout Splits)',
      'DESCRIPTION:Weigh yourself first thing in the morning and log it in Workout Splits → Progress.',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Weekly weigh-in', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }

  // Due when the reminder is on, this week's reminder time has passed and nothing was logged in 6 days.
  function reminderDue() {
    const r = WS.store.get('reminder');
    if (!r || !r.on) return false;
    const last = weights().pop();
    if (last && days(last.date, today()) < 6) return false;
    const now = new Date();
    const [h, m] = r.time.split(':').map(Number);
    const sinceDay = (now.getDay() - (r.weekday - 1) + 7) % 7;
    return sinceDay > 0 || now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
  }

  // Banner on any tab, plus a browser notification once a day, when a weigh-in is due.
  WS.checkReminder = function checkReminder() {
    const { $ } = ui();
    const old = $('#reminder-banner');
    if (old) old.remove();
    if (!reminderDue()) return;
    $('main').insertAdjacentHTML('afterbegin', `<div class="reminder-banner" id="reminder-banner">⚖️ Time for your weekly weigh-in.
      <a class="btn small primary" href="#progress">Log weight</a><button class="btn small" id="reminder-dismiss">Later</button></div>`);
    $('#reminder-dismiss').addEventListener('click', () => $('#reminder-banner').remove());
    const r = WS.store.get('reminder');
    if (!WS.native.isNative() && 'Notification' in window && Notification.permission === 'granted' && r.lastNotified !== today()) {
      try { new Notification('Weekly weigh-in', { body: 'Log your weight in Workout Splits → Progress.', icon: 'img/favicon-192.png' }); } catch (e) { /* not allowed here */ }
      WS.store.set('reminder', Object.assign({}, r, { lastNotified: today() }));
    }
  };

  WS.renderProgress = function renderProgress() {
    const { $, esc, cite } = ui();
    const panel = $('#tab-progress');
    const r = WS.store.get('reminder', { on: false, weekday: 2, time: '07:30' });
    panel.innerHTML = `
      <div class="hero"><h1>Track your progress.</h1>
        <p>Log your weight each week, see the trend against your goal, and get a weekly reminder to weigh in.</p></div>
      <div class="progress-grid">
        <form class="card" id="wt-form">
          <h3>Log weight</h3>
          <div class="filters diet-filters">
            <label>Date<input type="date" id="wt-date" value="${today()}" max="${today()}" required></label>
            <label>Weight<input type="number" id="wt-kg" step="0.1" min="20" max="660" required inputmode="decimal"></label>
            <label>Unit<select id="wt-unit"><option value="kg">kg</option><option value="lb">lb</option></select></label>
          </div>
          <label class="notes-field">Note <span class="opt">(optional)</span><input type="text" id="wt-note" maxlength="120" placeholder="e.g. after holiday, new program"></label>
          <button class="btn primary" type="submit">Save weigh-in</button> <span class="small muted" id="wt-msg"></span>
          <p class="small muted">Weigh yourself first thing in the morning, after the toilet and before eating, for comparable numbers. Your latest weight also updates the Planner.</p>
        </form>
        <div class="card" id="wt-stats"></div>
      </div>
      <div class="card" style="margin-top:16px"><h3>Weight over time</h3><div id="wt-chart"></div></div>
      <div class="progress-grid" style="margin-top:16px">
        <div class="card">
          <h3>Weekly weigh-in reminder</h3>
          <div class="filters diet-filters">
            <label>Day<select id="rm-day">${WEEKDAYS.map((d, i) => `<option value="${i + 1}"${i + 1 === r.weekday ? ' selected' : ''}>${d}</option>`).join('')}</select></label>
            <label>Time<input type="time" id="rm-time" value="${r.time}"></label>
          </div>
          <button class="btn primary" id="rm-toggle">${r.on ? 'Turn reminder off' : 'Turn reminder on'}</button>
          <button class="btn" id="rm-ics">📅 Add to calendar</button>
          <p class="small muted" id="rm-status"></p>
        </div>
        <div class="card">
          <h3>Backup &amp; restore</h3>
          <p class="small">Your profile, program position, saved videos and weight log are saved on this device (<span id="bk-where">checking…</span>). Export a backup to move them to another phone or browser.</p>
          <button class="btn" id="bk-export">⬇ Export backup</button>
          <label class="btn" for="bk-file">⬆ Import backup</label><input type="file" id="bk-file" accept="application/json,.json" hidden>
          <p class="small muted" id="bk-msg"></p>
        </div>
      </div>
      <div class="card" style="margin-top:16px"><h3>All weigh-ins</h3><div id="wt-table"></div></div>
      <p class="cite" style="margin-top:10px">Target rates: ${cite(['iraki2019', 'helms2014'])}</p>`;

    $('#wt-unit').value = unit();
    const draw = () => {
      const list = weights();
      const goal = GOAL_RATES[(ui().state.profile || {}).goal] || GOAL_RATES.general;
      const rate = weeklyRate(list);
      const latest = list[list.length - 1];
      let verdict = '';
      if (rate != null && latest) {
        const pct = (rate / latest.kg) * 100;
        const on = pct >= goal[0] - 0.05 && pct <= goal[1] + 0.05;
        verdict = `<p class="verdict ${on ? 'ok' : 'warn'}">${on ? '✓ On track' : pct > goal[1] ? '↑ Gaining faster than your goal' : '↓ Below your goal rate'}: ${rate >= 0 ? '+' : ''}${show(rate, 2)}/week (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)</p>`;
      }
      $('#wt-stats').innerHTML = latest ? `<h3>Summary</h3>
        <div class="stat-row"><div><small>Latest</small><b>${show(latest.kg)}</b><small>${fmtDate(latest.date)}</small></div>
          <div><small>Since start</small><b>${latest.kg - list[0].kg >= 0 ? '+' : ''}${show(latest.kg - list[0].kg)}</b><small>${list.length} weigh-ins</small></div></div>
        ${verdict || '<p class="small muted">Log weigh-ins over at least a week to see your weekly rate.</p>'}
        <p class="small muted">${esc(goal[2])} (your Planner goal).</p>`
        : '<h3>Summary</h3><p class="muted">No weigh-ins yet. Log your first one to start your graph.</p>';
      $('#wt-chart').innerHTML = chart(list);
      $('#wt-table').innerHTML = list.length ? `<table class="wt-table"><thead><tr><th>Date</th><th>Weight</th><th>Change</th><th>Note</th><th></th></tr></thead><tbody>
        ${list.slice().reverse().map((w, i, arr) => { const prev = arr[i + 1]; const d = prev ? w.kg - prev.kg : null;
          return `<tr><td>${fmtDate(w.date)}</td><td>${show(w.kg)}</td><td>${d == null ? '—' : (d >= 0 ? '+' : '') + show(d)}</td><td>${esc(w.note || '')}</td><td><button class="btn small" data-wdel="${w.date}" aria-label="Delete">✕</button></td></tr>`; }).join('')}
        </tbody></table>` : '<p class="muted">Nothing logged yet.</p>';
      const rem = WS.store.get('reminder', r);
      $('#rm-toggle').textContent = rem.on ? 'Turn reminder off' : 'Turn reminder on';
      $('#rm-status').textContent = rem.on
        ? `On: ${WEEKDAYS[rem.weekday - 1]}s at ${rem.time}. ${WS.native.canNotify() ? 'Your phone will notify you even when the app is closed.' : 'This website reminds you with a banner (and a notification if allowed) when you open it; add it to your calendar for a reminder when it is closed.'}`
        : 'Off.';
      WS.checkReminder();
    };

    $('#wt-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const value = Number($('#wt-kg').value);
      if (!value) return;
      const kg = Math.round((unit() === 'lb' ? value / LB : value) * 100) / 100;
      const date = $('#wt-date').value || today();
      const list = weights().filter((w) => w.date !== date);
      list.push({ date, kg, note: $('#wt-note').value.trim() });
      WS.store.set('weights', list);
      // Keep the Planner's body weight in step with the latest weigh-in.
      const latest = weights().pop();
      const form = document.querySelector('#profile-form');
      if (form && latest) { form.elements.weight.value = Math.round(latest.kg); ui().rerun(); }
      $('#wt-kg').value = ''; $('#wt-note').value = '';
      $('#wt-msg').textContent = 'Saved ✓';
      setTimeout(() => ($('#wt-msg').textContent = ''), 2500);
      draw();
    });
    $('#wt-unit').addEventListener('change', (e) => { WS.store.set('unit', e.target.value); draw(); });
    $('#wt-table').addEventListener('click', (e) => {
      const b = e.target.closest('[data-wdel]');
      if (b && confirm('Delete this weigh-in?')) { WS.store.set('weights', weights().filter((w) => w.date !== b.dataset.wdel)); draw(); }
    });

    const readReminder = () => Object.assign({}, WS.store.get('reminder', r), { weekday: Number($('#rm-day').value), time: $('#rm-time').value || '07:30' });
    const applyReminder = async (next) => {
      try {
        if (next.on && WS.native.canNotify()) {
          await WS.native.scheduleWeekly({ id: REMINDER_ID, title: 'Weekly weigh-in ⚖️', body: 'Weigh yourself and log it in Workout Splits.', weekday: next.weekday, hour: Number(next.time.split(':')[0]), minute: Number(next.time.split(':')[1]) });
        } else if (next.on && 'Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        if (!next.on) await WS.native.cancelReminder(REMINDER_ID);
        WS.store.set('reminder', next);
      } catch (err) {
        $('#rm-status').textContent = err.message;
        return;
      }
      draw();
    };
    $('#rm-toggle').addEventListener('click', () => { const cur = readReminder(); applyReminder(Object.assign(cur, { on: !cur.on })); });
    panel.addEventListener('change', (e) => { if ((e.target.id === 'rm-day' || e.target.id === 'rm-time') && WS.store.get('reminder', {}).on) applyReminder(Object.assign(readReminder(), { on: true })); });
    $('#rm-ics').addEventListener('click', () => WS.native.saveFile('weekly-weigh-in.ics', 'text/calendar', reminderIcs(readReminder())));

    $('#bk-export').addEventListener('click', async () => {
      const how = await WS.native.saveFile(`workout-splits-backup-${today()}.json`, 'application/json', WS.store.exportJSON());
      $('#bk-msg').textContent = how === 'shared' ? 'Backup ready: choose where to save it.' : 'Backup downloaded.';
    });
    $('#bk-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        WS.store.importJSON(await file.text());
        $('#bk-msg').textContent = 'Backup restored ✓ Reloading…';
        setTimeout(() => location.reload(), 800);
      } catch (err) { $('#bk-msg').textContent = err.message || 'That file could not be read.'; }
      e.target.value = '';
    });
    WS.store.persisted().then((ok) => { $('#bk-where').textContent = WS.native.isNative() ? 'app storage' : ok ? 'this browser, kept permanently' : 'this browser'; });
    draw();
    renderProgress.refresh = draw;
  };

  // ---------- Cult.fit ----------

  WS.renderCultfit = function renderCultfit() {
    const { $, esc } = ui();
    const formats = [
      ['Strength / gym sessions', 'Count as a strength day. Log the exercises you did; on the planner, take that day as done and keep the next session for the muscles it missed.'],
      ['HIIT-style classes (e.g. HRX)', 'Count as an interval session. Keep them away from heavy leg days, and count them toward the weekly HIIT minutes in your plan.'],
      ['Boxing / kickboxing', 'Mostly conditioning plus some shoulder and core work. Treat like a HIIT session.'],
      ['Dance fitness', 'Moderate cardio (Zone 2 to Zone 3). Counts toward your weekly cardio minutes.'],
      ['Yoga', 'A recovery and mobility session. Great on rest days; see the Yoga module for poses.'],
      ['Running / cycling', 'Easy runs and rides are Zone 2 cardio; hard intervals count as HIIT.'],
    ];
    $('#tab-cultfit').innerHTML = `
      <div class="hero"><h1>Cult.fit and your plan.</h1>
        <p>If you train at cult.fit, here's how its classes fit around the program from the Planner.</p></div>
      <p class="warn">cult.fit doesn't offer a public API, so this module can't connect to your cult.fit account, bookings or class history. It explains how the class types fit your plan and links to cult.fit.</p>
      <div class="grid" style="margin-top:14px">${formats.map(([t, d]) => `<article class="card"><h3>${esc(t)}</h3><p class="small">${esc(d)}</p></article>`).join('')}</div>
      <h2 style="margin-top:24px">Planning a week with classes</h2>
      <div class="notes">
        <div class="card note"><h4>Swap, don't stack</h4><p>Replace a planner day with a class of the same kind instead of adding it on top, so your weekly volume stays where the Planner set it.</p></div>
        <div class="card note"><h4>Protect leg days</h4><p>Hard HIIT, boxing or running the day before heavy squats or deadlifts eats into recovery. Put classes after leg day, not before.</p></div>
        <div class="card note"><h4>Recovery counts</h4><p>Use yoga classes on rest days. They count toward the balance and mobility pillar in the Longevity module.</p></div>
      </div>
      <h2 style="margin-top:24px">Links</h2>
      <div class="link-grid">
        <a class="card link-card" href="https://www.cult.fit/" target="_blank" rel="noopener"><span class="small muted">cult.fit</span><b>cult.fit website</b><span class="small">↗ Open</span></a>
        <a class="card link-card" href="${WS.ytSearch('cult fit workout')}" target="_blank" rel="noopener"><span class="small muted">YouTube</span><b>cult.fit workouts</b><span class="small">▶ YouTube</span></a>
        <a class="card link-card" href="#hiit"><span class="small muted">This app</span><b>HIIT &amp; Calisthenics</b><span class="small">Open module</span></a>
        <a class="card link-card" href="#yoga"><span class="small muted">This app</span><b>Yoga</b><span class="small">Open module</span></a>
      </div>`;
  };
})(window.WS = window.WS || {});
