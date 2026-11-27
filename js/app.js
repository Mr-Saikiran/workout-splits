// UI: tabs, planner form, results and the browsable libraries.
(function (WS) {
  const E = WS.engine;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const GOALS = { muscle: 'Build muscle', strength: 'Strength', fatloss: 'Fat loss', recomp: 'Recomposition', tone: 'Get toned', general: 'Health & longevity', athletic: 'Athletic' };
  const goalLabel = (p) => (p.tone ? GOALS.tone : GOALS[p.goal]);
  const BODY = { lean: 'Lean build', average: 'Average build', higher: 'Higher body fat' };
  const EQUIP = { gym: 'Full gym', home: 'Home gym', bodyweight: 'Bodyweight' };
  const EQ_LABEL = { barbell: 'Barbell', dumbbell: 'Dumbbell', machine: 'Machine', cable: 'Cable', bodyweight: 'Bodyweight', band: 'Band', kettlebell: 'Kettlebell' };

  // ---------- shared bits ----------

  function cite(keys) {
    if (!keys || !keys.length) return '';
    return '<span class="cite">' + keys.map((k) => {
      const r = WS.REFS[k];
      return r ? `<a href="${r.url}" target="_blank" rel="noopener" title="${esc(r.citation)}">${esc(r.short)}</a>` : '';
    }).join(', ') + '</span>';
  }

  const vid = (channel, query) =>
    `<a class="vid" href="${WS.yt(channel, query)}" target="_blank" rel="noopener">${esc(WS.CHANNELS[channel].name)}</a>`;

  // Google Images / Videos searches, for exercises and workouts alike.
  const searchLinks = (name) => `<div class="vids">
    <a class="vid search" href="${WS.googleImages(name)}" target="_blank" rel="noopener">Images</a>
    <a class="vid" href="${WS.googleVideos(name)}" target="_blank" rel="noopener">Videos</a></div>`;

  const skillDots = (n) => '●'.repeat(n) + '○'.repeat(3 - n);

  // Two-frame demo: start and end position, alternating.
  function demoHtml(ex, size) {
    const d = WS.demoFor(ex.id);
    if (!d) return size === 'thumb' ? '' : '<p class="small muted">No demo image yet. Use the image and video searches below.</p>';
    // Lazy images inside a <dialog> may never load, so the full demo loads eagerly.
    const lazy = size === 'thumb' ? ' loading="lazy"' : '';
    return `<div class="demo demo--${size}" role="img" aria-label="${esc(ex.name)}: start and end position">
      <img src="${d[0]}" alt=""${lazy} decoding="async"><img src="${d[1]}" alt=""${lazy} decoding="async"></div>`;
  }

  function exerciseCard(ex) {
    const pat = WS.PATTERNS[ex.pattern];
    return `<article class="card ex-card" data-ex="${ex.id}" tabindex="0" role="button" aria-label="Show how to do ${esc(ex.name)}">
      ${demoHtml(ex, 'thumb')}
      <div class="ex-head"><span class="tier ${ex.tier}" title="Evidence tier">${ex.tier}</span>
        <div class="ex-name">${esc(ex.name)}<small>${esc(pat.label)} · ${EQ_LABEL[ex.eq]} · skill ${skillDots(ex.skill)}</small></div></div>
      <p class="small">${esc(ex.why)}</p>
      <span class="small link-like">${WS.demoFor(ex.id) ? '▶ See how it\'s done' : 'How to do it'}</span>
    </article>`;
  }

  function openExercise(id) {
    const ex = WS.EX_BY_ID[id];
    const pat = WS.PATTERNS[ex.pattern];
    const dlg = $('#ex-modal');
    $('#ex-modal-body').innerHTML = `
      <div class="ex-head"><span class="tier ${ex.tier}">${ex.tier}</span>
        <div class="ex-name"><h2>${esc(ex.name)}</h2><small>${esc(pat.label)} · ${EQ_LABEL[ex.eq]} · skill ${skillDots(ex.skill)}</small></div></div>
      ${demoHtml(ex, 'full')}
      <p>${esc(ex.why)} ${cite(ex.refs)}</p>
      <p class="muted"><b>Cues:</b> ${esc(ex.cues)}</p>
      ${searchLinks(ex.name)}
      ${WS.demoFor(ex.id) ? '<p class="cite">Demo images: free-exercise-db (public domain).</p>' : ''}`;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  // ---------- tabs ----------

  // Every module: top tabs, the phone bottom bar (`bar`) and the module menu.
  const MODULES = [
    { id: 'planner', icon: '🗓️', label: 'Planner', group: 'Train', desc: 'Your split and full program', bar: true },
    { id: 'splits', icon: '🧩', label: 'Splits', group: 'Train', desc: 'Every split, with the research' },
    { id: 'exercises', icon: '🏋️', label: 'Exercises', group: 'Train', desc: '237 exercises with demos', bar: true },
    { id: 'hiit', icon: '⚡', label: 'HIIT & Calisthenics', short: 'HIIT', group: 'Train', desc: 'Intervals and bodyweight skills' },
    { id: 'cultfit', icon: '🏟️', label: 'Cult.fit', group: 'Train', desc: 'Fit cult.fit classes into your plan' },
    { id: 'diet', icon: '🥗', label: 'Diet', group: 'Eat', desc: 'Foods by nutrient, diet and country', bar: true },
    { id: 'recipes', icon: '🍳', label: 'Recipes', group: 'Eat', desc: 'High-protein bulking and lean meals' },
    { id: 'yoga', icon: '🧘', label: 'Yoga', group: 'Recover', desc: 'Routines and poses' },
    { id: 'pilates', icon: '🤸', label: 'Pilates', group: 'Recover', desc: 'Core and back care' },
    { id: 'meditation', icon: '🕉️', label: 'Meditation', group: 'Recover', desc: 'Sounds, Om chant, breathing' },
    { id: 'sleep', icon: '😴', label: 'Sleep', group: 'Recover', desc: 'Sleep cycles, naps and alarm' },
    { id: 'progress', icon: '📈', label: 'Progress', group: 'Track', desc: 'Weight log, graph and reminder', bar: true },
    { id: 'saved', icon: '🎬', label: 'Saved videos', short: 'Saved', group: 'Track', desc: 'Your YouTube shorts and links' },
    { id: 'longevity', icon: '🌱', label: 'Longevity', group: 'Learn', desc: 'Train for a long, healthy life' },
    { id: 'science', icon: '🔬', label: 'Science', group: 'Learn', desc: 'Principles and every source' },
  ];
  const TABS = MODULES.map((m) => m.id);
  const rendered = {};
  const RENDER = { splits: renderSplits, exercises: renderExercises, diet: renderDiet, recipes: WS.renderRecipes,
    meditation: WS.renderMeditation, sleep: WS.renderSleep, hiit: renderHiit, yoga: renderYoga, pilates: renderPilates,
    longevity: renderLongevity, science: renderScience, progress: WS.renderProgress, saved: WS.renderSaved, cultfit: WS.renderCultfit };

  function buildNav() {
    const main = $('main');
    MODULES.forEach((m) => {
      if (!$('#tab-' + m.id)) main.insertAdjacentHTML('beforeend', `<section id="tab-${m.id}" class="tab-panel" hidden></section>`);
    });
    $('#tabs').innerHTML = MODULES.map((m) => `<a href="#${m.id}" data-tab="${m.id}">${esc(m.label)}</a>`).join('');
    $('#bottom-nav').innerHTML = MODULES.filter((m) => m.bar).map((m) =>
      `<a href="#${m.id}" data-tab="${m.id}"><span>${m.icon}</span>${esc(m.short || m.label)}</a>`).join('')
      + '<button id="bottom-more" data-menu><span>☰</span>More</button>';
    const groups = [...new Set(MODULES.map((m) => m.group))];
    $('#menu-body').innerHTML = groups.map((g) => `<h3>${g}</h3><div class="module-grid">${MODULES.filter((m) => m.group === g).map((m) =>
      `<a class="module-tile" href="#${m.id}" data-tab="${m.id}"><span class="module-icon">${m.icon}</span><b>${esc(m.label)}</b><small>${esc(m.desc)}</small></a>`).join('')}</div>`).join('');
    const menu = $('#menu');
    const open = () => (menu.showModal ? menu.showModal() : menu.setAttribute('open', ''));
    $('#menu-btn').addEventListener('click', open);
    $('#bottom-more').addEventListener('click', open);
    $('#menu-close').addEventListener('click', () => menu.close());
    menu.addEventListener('click', (e) => { if (e.target === menu || e.target.closest('.module-tile')) menu.close(); });
  }

  function showTab() {
    const id = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'planner';
    TABS.forEach((t) => { $('#tab-' + t).hidden = t !== id; });
    document.querySelectorAll('#tabs a, #bottom-nav a, .module-tile').forEach((a) => a.classList.toggle('active', a.dataset.tab === id));
    const inBar = MODULES.some((m) => m.id === id && m.bar);
    $('#bottom-more').classList.toggle('active', !inBar);
    const tab = document.querySelector(`#tabs a[data-tab="${id}"]`);
    if (tab) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (RENDER[id] && !rendered[id]) { RENDER[id](); rendered[id] = true; }
    else if (RENDER[id] && RENDER[id].refresh) RENDER[id].refresh();
    window.scrollTo(0, 0);
  }

  // ---------- planner ----------

  const state = { profile: null, rec: null, splitId: null, plan: null, week: 1, cycle: 1, seed: newSeed() };

  function readProfile() {
    const f = new FormData($('#profile-form'));
    const num = (k, d) => (f.get(k) ? Number(f.get(k)) : d);
    return {
      age: Math.min(95, Math.max(13, num('age', 28))),
      gender: f.get('gender'), bodyType: f.get('bodyType'), goal: f.get('goal'), level: f.get('level'),
      days: num('days', 4), minutes: num('minutes', 60), equipment: f.get('equipment'),
      focus: f.get('focus') || '', weight: num('weight', 0),
      variety: f.get('variety') || 'medium', weeks: num('weeks', 12),
    };
  }

  function newSeed() {
    return Math.floor(Math.random() * 1e9) + 1;
  }

  // Restores the saved profile and where the user was in their program.
  function loadSaved() {
    const saved = WS.store.get('profile');
    if (saved) {
      const form = $('#profile-form');
      Object.entries(saved).forEach(([k, v]) => { if (form.elements[k] && v !== '' && v != null) form.elements[k].value = v; });
    }
    const plan = WS.store.get('plan');
    if (plan) Object.assign(state, { splitId: plan.splitId || null, week: plan.week || 1, cycle: plan.cycle || 1, seed: plan.seed || state.seed });
    else if (saved && saved.seed) state.seed = saved.seed;
  }

  function run(splitId) {
    const raw = readProfile();
    WS.store.set('profile', Object.assign({}, raw));
    const p = E.normalize(raw);
    state.week = Math.min(state.week, p.weeks);
    p.week = state.week;
    p.cycle = state.cycle;
    p.seed = state.seed;
    state.profile = p;
    state.rec = E.recommend(p);
    const ids = state.rec.ranked.map((r) => r.split.id);
    state.splitId = splitId && ids.includes(splitId) ? splitId : ids[0];
    state.plan = E.buildPlan(WS.SPLIT_BY_ID[state.splitId], p);
    WS.store.set('plan', { splitId: state.splitId, week: state.week, cycle: state.cycle, seed: state.seed });
    renderResults();
    showSaved();
  }

  function showSaved() {
    const el = $('#saved-note');
    if (el) el.textContent = '✓ Saved on this device';
  }

  function varietyHtml(p, plan) {
    const v = E.VARIETY[p.variety];
    const blocks = v.every === Infinity ? 1 : Math.ceil(p.weeks / v.every);
    const desc = v.every === Infinity ? 'Same exercises for the whole program.'
      : v.every === 1 ? 'A fresh mix of exercises every week.'
      : `Exercises rotate every ${v.every} weeks: block ${plan.block + 1} of ${blocks}.`;
    const last = p.week >= p.weeks;
    return `<div class="variety no-print">
      <button class="btn small" data-nav="-1" ${p.week <= 1 && p.cycle <= 1 ? 'disabled' : ''} aria-label="Previous week">‹</button>
      ${p.cycle > 1 ? `<span class="chip accent">Cycle ${p.cycle}</span>` : ''}
      <select id="week-select" aria-label="Program week">${Array.from({ length: p.weeks }, (_, i) =>
        `<option value="${i + 1}"${i + 1 === p.week ? ' selected' : ''}>Week ${i + 1} of ${p.weeks}</option>`).join('')}</select>
      <button class="btn small" data-nav="1" aria-label="${last ? 'Repeat the program' : 'Next week'}" title="${last ? 'Start the program again with a fresh mix' : 'Next week'}">${last ? '↻ Repeat' : '›'}</button>
      <span class="chip accent">Variety: ${v.label}</span>
      ${p.variety !== 'nil' ? '<button class="btn small" id="reshuffle" title="New random exercise mix">🎲 Reshuffle</button>' : ''}
      <span class="small muted">${desc}</span>
    </div>`;
  }

  function renderResults() {
    const { profile: p, rec, plan } = state;
    const top = rec.ranked.slice(0, 3);
    if (!top.some((r) => r.split.id === state.splitId)) top.push(rec.ranked.find((r) => r.split.id === state.splitId));
    const rest = rec.ranked.filter((r) => !top.includes(r));
    const otherDays = rec.otherDays.map((o) => `${esc(o.split.name)} (${o.days.join('/')} days)`).join(', ');

    $('#results').innerHTML = `
      <div class="chips">
        <span class="chip accent">${p.age} yrs</span><span class="chip">${p.gender === 'other' ? 'Any gender' : p.gender[0].toUpperCase() + p.gender.slice(1)}</span>
        <span class="chip">${BODY[p.bodyType]}</span><span class="chip">${goalLabel(p)}</span><span class="chip">${p.level}</span>
        <span class="chip">${p.days} days × ${p.minutes} min</span><span class="chip">${EQUIP[p.equipment]}</span>
        ${p.focus ? `<span class="chip accent">Focus: ${WS.FOCUS[p.focus].label}</span>` : ''}
      </div>

      <div>
        <div class="section-title"><h2>Best splits for you</h2><span class="muted small">Click one to see its program</span></div>
        <div class="recs">${top.map((r, i) => recCard(r, rec.ranked.indexOf(r) + 1, i)).join('')}</div>
        ${rest.length ? `<p class="more-splits">Also possible on ${p.days} days: ${rest.map((r) => `<button data-split="${r.split.id}">${esc(r.split.name)}</button>`).join(' · ')}</p>` : ''}
        ${otherDays ? `<p class="more-splits">Needs a different number of days: ${otherDays}.</p>` : ''}
      </div>

      ${planHtml(plan, p)}
    `;
  }

  function recCard(r, rank) {
    const sel = r.split.id === state.splitId ? ' selected' : '';
    const items = r.reasons.slice(0, 3).map((t) => `<li>${esc(t)}</li>`).concat(r.cautions.slice(0, 2).map((t) => `<li class="caution">${esc(t)}</li>`));
    return `<button class="card rec${sel}" data-split="${r.split.id}">
      <span class="rank">#${rank}</span>
      <div class="match">${r.match}%</div>
      <h3>${esc(r.split.name)}</h3>
      <div class="muted small">${esc(r.split.category)} · ~${r.freq.toFixed(1)}× / muscle / week</div>
      <ul>${items.join('')}</ul>
    </button>`;
  }

  function planHtml(plan, p) {
    const s = plan.split;
    const restDays = 7 - p.days;
    return `
      <div class="card">
        <div class="section-title"><h2>${esc(s.name)}</h2>
          <div class="no-print plan-actions"><button class="btn small primary" id="pdf-plan">⬇ PDF: full program</button> <button class="btn small" id="copy-plan">Copy as text</button></div></div>
        <p class="muted">${esc(s.summary)}</p>
        <p class="small"><b>Why it works:</b> ${esc(s.evidence)} ${cite(s.refs)}</p>
        ${varietyHtml(p, plan)}
        <div class="week">${plan.schedule.map((d) => d.train >= 0
          ? `<div class="on"><b>${d.name}</b>${esc(plan.days[d.train].name.split(' + ')[0])}</div>`
          : `<div><b>${d.name}</b>Rest / recovery</div>`).join('')}</div>
        ${plan.warnings.map((w) => `<p class="warn">${esc(w)}</p>`).join('')}
      </div>

      <div class="days">${plan.days.map((d, di) => dayHtml(d, di)).join('')}</div>

      <div class="card">
        <div class="section-title"><h2>Weekly sets per muscle</h2><span class="muted small">Bar = your plan · line = your target · synergists count half</span></div>
        <div class="bars">${Object.keys(WS.MUSCLES).map((m) => {
          const v = plan.volume[m], t = plan.targets[m], max = 26;
          return `<div class="bar-row"><span>${WS.MUSCLES[m]}</span><div class="bar"><span style="width:${Math.min(100, (v / max) * 100)}%"></span><i style="left:${Math.min(100, (t / max) * 100)}%"></i></div><span class="num">${v} / ${t}</span></div>`;
        }).join('')}</div>
        <p class="small muted" style="margin-top:10px">More weekly sets build more muscle with diminishing returns; about 10–20 hard sets per muscle per week is the well-supported range for most people. ${cite(['volume2017', 'pelland2024'])}</p>
      </div>

      ${recoveryHtml(p, restDays)}

      <div>
        <h2>Personalised for you</h2>
        <div class="notes">${personalNotes(p).map((n) => `<div class="card note"><h4>${esc(n.title)}</h4>${n.html} ${cite(n.refs)}</div>`).join('')}</div>
      </div>
    `;
  }

  function dayHtml(d, di) {
    return `<div class="card day">
      <h3>${esc(d.name)} <small>~${d.minutes} min</small></h3>
      ${d.items.map((it, ii) => `
        <div class="ex-row">
          <div class="ex-head">
            <span class="tier ${it.ex.tier}">${it.ex.tier}</span>
            <button class="ex-name" data-ex="${it.ex.id}" title="See how it's done">${esc(it.ex.name)}${it.focus ? '<span class="focus-tag">focus</span>' : ''}${WS.demoFor(it.ex.id) ? ' <span class="demo-tag">▶</span>' : ''}
              <small>${esc(WS.PATTERNS[it.slot].label)}</small></button>
            ${it.alts.length > 1 ? `<button class="swap no-print" data-swap="${di}-${ii}" title="Swap for another evidence-ranked option">↻ swap</button>` : ''}
          </div>
          <div class="ex-presc"><b>${it.sets} × ${esc(it.reps)}</b> · effort: ${esc(it.rir)}${/^\d/.test(it.rir) ? ' reps in reserve' : ''} · rest ${esc(it.rest)}</div>
        </div>`).join('')}
    </div>`;
  }

  function recoveryHtml(p, restDays) {
    const ag = E.ageGroup(p.age);
    const yoga = E.suggest(WS.YOGA_ROUTINES, p);
    const pilates = E.suggest(WS.PILATES_ROUTINES, p);
    let hiit = E.suggest(WS.HIIT, p);
    if (ag === 'senior' || p.level === 'beginner') hiit = WS.HIIT.filter((h) => h.id === 'beginner-30-30');
    if (ag === 'youth') hiit = [];
    const z2 = { fatloss: '150–300', general: '150', recomp: '120–150', muscle: '60–90', strength: '60–90', athletic: '90–120' }[p.goal];
    const card = (title, r, channel, extra) => `<div class="card note"><h4>${title}: ${esc(r.name)}</h4>
      <p class="small">${r.minutes} min · ${esc(r.when || r.level)}</p><p>${esc(r.purpose || r.protocol)}</p>
      ${channel ? `<div class="vids">${vid(channel, r.query)}</div>` : searchLinks(r.name)}${extra || ''}</div>`;
    return `<div>
      <div class="section-title"><h2>Cardio, mobility &amp; recovery</h2><span class="muted small">${restDays} non-lifting day${restDays === 1 ? '' : 's'} a week</span></div>
      <div class="notes">
        <div class="card note"><h4>Zone 2 cardio: ${z2} min / week</h4>
          <p>Easy, conversational pace: walking, cycling, rowing. A 10-minute walk after meals counts. Keep hard cardio away from leg days if you are chasing leg growth.</p>
          ${cite(['who2020', 'wilson2012', 'buffey2022'])}</div>
        ${hiit.map((h) => card('Intervals', h, null, cite(h.refs))).join('')}
        ${yoga.map((y) => card('Yoga', y, 'adriene', cite(y.refs))).join('')}
        ${pilates.slice(0, 1).map((r) => card('Pilates', r, 'blogilates', cite(r.refs))).join('')}
      </div>
      <p class="small muted" style="margin-top:8px">Framework (strength + Zone 2 + intervals + balance/mobility) credit: Bryan Johnson. See the <a href="#longevity">Longevity</a> tab.</p>
    </div>`;
  }

  function personalNotes(p) {
    const ag = E.ageGroup(p.age);
    const notes = [];

    if (ag === 'youth') notes.push({ title: 'Training as a teen', refs: ['faigenbaum2009'],
      html: '<p>Strength training is safe and beneficial for young people when supervised; it does not stunt growth. Master technique with moderate loads first, and only test maximal lifts once form is solid.</p>' });
    if (ag === 'master') notes.push({ title: 'Training in your 40s–50s', refs: ['fragala2019', 'liftmor2018'],
      html: '<p>Keep lifting heavy; strength and muscle loss speed up from here, and resistance training is the best counter. Use a longer warm-up (8–10 min plus ramp-up sets), sleep 7–9 h, and take an extra rest day when joints are achy.</p>' });
    if (ag === 'senior') notes.push({ title: 'Training after 60', refs: ['fragala2019', 'peterson2010', 'who2020'],
      html: '<ul><li>Balance work is added at the start of sessions; WHO recommends it 3×/week for 65+.</li><li><b>Power matters:</b> lift fast (safely), lower slowly. Power declines faster than strength.</li><li>Stop 2–3 reps short of failure. Machines are great: stable and joint-friendly.</li></ul>' });

    if (p.gender === 'female') notes.push({ title: 'For women', refs: ['roberts2020', 'hunter2014', 'mcnulty2020', 'liftmor2018'],
      html: '<ul><li>Women gain muscle and strength at the same <i>relative</i> rate as men, so train with the same intensity. Light weights don\'t "tone" better.</li><li>Women tend to be more fatigue-resistant, so slightly shorter rests on isolation work are fine.</li><li>Cycle phase has only a trivial average effect on performance; adjust by how you feel rather than a fixed rule.</li>' + (p.age >= 40 ? '<li>Heavy lifting plus impact work improved bone density in post-menopausal women (LIFTMOR).</li>' : '') + '</ul>' });
    else if (p.gender === 'male') notes.push({ title: 'For men', refs: ['roberts2020'],
      html: '<p>Men and women respond to training similarly in relative terms. The same principles apply: progressive overload, enough weekly sets, and effort close to failure.</p>' });

    if (p.bodyType === 'lean') notes.push({ title: 'Lean / hard-gainer build', refs: ['morton2018'],
      html: '<p>The bottleneck is usually food, not the program. Eat in a small surplus (+250–500 kcal/day), aim for 0.25–0.5% bodyweight gain per week, and keep cardio moderate. Body type labels describe where you start, not your potential.</p>' });
    if (p.bodyType === 'higher') notes.push({ title: 'Higher body fat', refs: ['helms2014', 'who2020'],
      html: '<p>Lift to keep (and even build) muscle while you lose fat. A moderate deficit (about 0.5–1% bodyweight per week) works best. Low-impact cardio (bike, incline walk, rower) is kind to joints; daily steps add up. Beginners can often build muscle while losing fat.</p>' });
    if (p.bodyType === 'average') notes.push({ title: 'Average / athletic build', refs: [],
      html: '<p>You respond well to most programs, so consistency and progressive overload will drive results more than the split you pick.</p>' });

    const w = p.weight;
    const protein = w ? `<b>${Math.round(w * 1.6)}–${Math.round(w * 2.2)} g protein/day</b>` : '<b>1.6–2.2 g protein per kg/day</b>';
    const kcal = { muscle: 'a small surplus (+250–500 kcal)', strength: 'maintenance or a small surplus', fatloss: 'a moderate deficit (−300 to −500 kcal)', recomp: 'around maintenance', general: 'around maintenance', athletic: 'enough to fuel training' }[p.goal];
    notes.push({ title: 'Nutrition basics', refs: ['morton2018', 'helms2014'],
      html: `<p>Eat ${protein}, spread over 3–5 meals, with ${kcal}. Protein benefits level off around 1.6 g/kg for most people.</p>` });

    if (p.tone) notes.push({ title: 'Getting toned', refs: ['helms2014', 'failure2023'],
      html: '<p>"Toned" means a bit more muscle and a bit less fat over it, so the muscle shows. Your plan uses moderate weights for 8–15 reps with short rests and adds a conditioning finisher. Eat at maintenance or a small deficit with plenty of protein. Light weights don’t tone better: effort close to failure does.</p>' });

    notes.push({ title: 'How to progress', refs: ['failure2023', 'load2017'],
      html: '<ul><li><b>Double progression:</b> when you hit the top of the rep range on all sets, add load (2.5–5%).</li><li>"Reps in reserve" = how many more reps you could have done. Go closer to failure on isolation exercises than on heavy compounds.</li><li>Take an easier deload week every 6–8 weeks or when progress stalls.</li><li>Log every workout; what gets measured improves.</li></ul>' });

    if (p.focus) notes.push({ title: `Prioritising ${WS.FOCUS[p.focus].label.toLowerCase()}`, refs: ['nunes2021', 'bickel2011'],
      html: '<p>The focus muscle is trained first in the session, when you are freshest, and gets about 40% more weekly volume. Other muscles drop to maintenance volume. Run it for 8–12 weeks, then rotate to a balanced block.</p>' });

    return notes;
  }

  // ---------- full-program PDF ----------

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(el);
    });
  }

  // jsPDF's built-in fonts cover Latin-1 only.
  const pdfText = (t) => String(t).replace(/→/g, '->').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x00-\xFF–—•…]/g, '').trim();

  // Weeks with the same exercises are grouped into one block (5/3/1 changes every week).
  function programBlocks(split, p) {
    const v = E.VARIETY[p.variety];
    const every = split.weekly ? 1 : v.every === Infinity ? p.weeks : v.every;
    const blocks = [];
    for (let start = 1; start <= p.weeks; start += every) {
      const end = Math.min(start + every - 1, p.weeks);
      const plan = p.week >= start && p.week <= end ? state.plan : E.buildPlan(split, Object.assign({}, p, { week: start }));
      blocks.push({ start, end, plan });
    }
    return blocks;
  }

  async function downloadPdf(btn) {
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Making PDF…';
    try {
      await loadScript('js/vendor/jspdf.umd.min.js');
      await loadScript('js/vendor/jspdf.plugin.autotable.min.js');
      const { plan, profile: p } = state;
      const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth(), M = 40;
      const orange = [232, 80, 15];
      let y = 50;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('Workout Splits: your program', M, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90);
      y += 18; doc.text(pdfText(`${plan.split.name} · ${p.days} days/week · ${p.minutes} min · ${p.weeks} weeks${p.cycle > 1 ? ' · cycle ' + p.cycle : ''} · variety: ${E.VARIETY[p.variety].label}`), M, y);
      y += 14; doc.text(pdfText(`${p.age} yrs · ${goalLabel(p)} · ${p.level} · ${EQUIP[p.equipment]}${p.weight ? ' · ' + p.weight + ' kg' : ''} · made ${new Date().toLocaleDateString()}`), M, y);
      doc.setTextColor(0);
      y += 16;
      window.autoTable(doc, {
        startY: y, margin: { left: M, right: M }, theme: 'grid', styles: { fontSize: 9, halign: 'center' }, headStyles: { fillColor: orange },
        head: [plan.schedule.map((d) => d.name)],
        body: [plan.schedule.map((d) => (d.train >= 0 ? pdfText(plan.days[d.train].name) : 'Rest'))],
      });
      y = doc.lastAutoTable.finalY + 16;
      doc.setFontSize(9); doc.setTextColor(90);
      const why = doc.splitTextToSize(pdfText(`Why it works: ${plan.split.evidence}`), W - 2 * M);
      doc.text(why, M, y);
      doc.setTextColor(0);
      y += why.length * 11 + 22;
      for (const b of programBlocks(plan.split, p)) {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...orange);
        doc.text(b.start === b.end ? `Week ${b.start}` : `Weeks ${b.start}–${b.end}`, M, y);
        doc.setTextColor(0);
        y += 8;
        for (const d of b.plan.days) {
          window.autoTable(doc, {
            startY: y + 6, margin: { left: M, right: M }, theme: 'striped', styles: { fontSize: 9, cellPadding: 4 }, headStyles: { fillColor: [40, 44, 52] },
            head: [[pdfText(`${d.name} (~${d.minutes} min)`), 'Sets x reps', 'Effort', 'Rest']],
            body: d.items.map((it) => [pdfText(it.ex.name), pdfText(`${it.sets} x ${it.reps}`), pdfText(/^\d/.test(it.rir) ? it.rir + ' RIR' : it.rir), pdfText(it.rest)]),
            columnStyles: { 0: { cellWidth: 190 } },
          });
          y = doc.lastAutoTable.finalY + 4;
        }
        y += 18;
      }
      doc.addPage();
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('How to progress', M, 50);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const notes = [
        'Double progression: when you reach the top of the rep range on every set, add 2.5-5% load next time.',
        'RIR = reps in reserve, how many more reps you could have done. Go closer to failure on isolation work than on heavy compounds.',
        'Take an easier deload week every 6-8 weeks, or when progress stalls.',
        p.weight ? `Protein: ${Math.round(p.weight * 1.6)}-${Math.round(p.weight * 2.2)} g per day (1.6-2.2 g/kg).` : 'Protein: 1.6-2.2 g per kg of body weight per day.',
        'Cardio: add Zone 2 cardio and, if your goal allows, one or two interval sessions on non-lifting days.',
        'Not medical advice. Check with a doctor before starting if you have a medical condition.',
      ];
      let ny = 72;
      notes.forEach((n) => { const lines = doc.splitTextToSize('• ' + n, W - 2 * M); doc.text(lines, M, ny); ny += lines.length * 13 + 6; });
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(140);
        doc.text(`Workout Splits by TechSwitch · techswitch.in/splits · page ${i} of ${pages}`, M, doc.internal.pageSize.getHeight() - 20);
      }
      const name = `workout-splits-${plan.split.id}-${p.weeks}wk.pdf`;
      const how = await WS.native.saveFile(name, 'application/pdf', doc.output('datauristring').split(',')[1], true);
      btn.textContent = how === 'shared' ? 'PDF ready ✓' : 'Downloaded ✓';
    } catch (err) {
      btn.textContent = 'PDF failed';
      console.error(err);
    }
    setTimeout(() => { btn.textContent = label; btn.disabled = false; }, 2500);
  }

  function planText() {
    const { plan, profile: p } = state;
    const lines = [`${plan.split.name}: ${p.days} days/week (${goalLabel(p)}, ${p.level}), week ${p.week} of ${p.weeks}${p.cycle > 1 ? `, cycle ${p.cycle}` : ''}`, ''];
    plan.days.forEach((d) => {
      lines.push(`== ${d.name} (~${d.minutes} min) ==`);
      d.items.forEach((it) => lines.push(`- ${it.ex.name}: ${it.sets} x ${it.reps}, RIR ${it.rir}, rest ${it.rest}`));
      lines.push('');
    });
    lines.push('Generated with Workout Splits: https://github.com/Mr-Saikiran/workout-splits');
    return lines.join('\n');
  }

  function onResultsClick(e) {
    const t = e.target.closest('[data-split],[data-swap],[data-ex],[data-nav],#copy-plan,#pdf-plan,#reshuffle');
    if (!t) return;
    if (t.dataset.ex) { openExercise(t.dataset.ex); return; }
    if (t.dataset.split) { run(t.dataset.split); return; }
    if (t.dataset.nav) {
      // Past the last week the program repeats as a new cycle.
      const weeks = state.profile.weeks;
      state.week += Number(t.dataset.nav);
      if (state.week > weeks) { state.week = 1; state.cycle++; }
      if (state.week < 1) { state.week = state.cycle > 1 ? weeks : 1; state.cycle = Math.max(1, state.cycle - 1); }
      run(state.splitId);
      return;
    }
    if (t.id === 'reshuffle') { state.seed = newSeed(); run(state.splitId); return; }
    if (t.id === 'pdf-plan') { downloadPdf(t); return; }
    if (t.id === 'copy-plan') {
      const done = () => { t.textContent = 'Copied ✓'; setTimeout(() => (t.textContent = 'Copy as text'), 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(planText()).then(done, () => {});
      return;
    }
    if (t.dataset.swap) {
      const [di, ii] = t.dataset.swap.split('-').map(Number);
      const it = state.plan.days[di].items[ii];
      it.ex = it.alts[(it.alts.indexOf(it.ex) + 1) % it.alts.length];
      t.closest('.day').outerHTML = dayHtml(state.plan.days[di], di);
    }
  }

  // ---------- splits library ----------

  function renderSplits() {
    const sample = { age: 28, gender: 'other', bodyType: 'average', goal: 'muscle', level: 'intermediate', minutes: 75, equipment: 'gym', focus: '' };
    const cats = ['All'].concat([...new Set(WS.SPLITS.map((s) => s.category))]);
    const panel = $('#tab-splits');
    panel.innerHTML = `
      <div class="hero"><h1>Every split, explained.</h1>
        <p>From the classic Bro Split to Push/Pull/Legs, Arnold, PHUL, specialization and Active Aging, with the research for and against each one.</p></div>
      <div class="pill-group">${cats.map((c, i) => `<button class="pill${i ? '' : ' active'}" data-cat="${c}">${c}</button>`).join('')}</div>
      <div class="grid" id="split-grid"></div>`;
    const draw = (cat) => {
      $('#split-grid').innerHTML = WS.SPLITS.filter((s) => cat === 'All' || s.category === cat).map((s) => {
        const days = s.days[s.days.length > 1 && s.days.includes(4) ? s.days.indexOf(4) : 0];
        const week = s.build(days, Object.assign({ days, focus: 'glutes' }, sample));
        const freq = E.frequency(week);
        return `<article class="card split-card">
          <h3>${esc(s.name)} <span class="chip">${esc(s.category)}</span></h3>
          <div class="chips"><span class="chip accent">${s.days.join(' / ')} days</span><span class="chip">~${freq.toFixed(1)}× per muscle at ${days} days</span></div>
          <p>${esc(s.summary)}</p>
          <p class="small"><b>Best for:</b> ${esc(s.bestFor)}</p>
          <div class="pros-cons"><div><h4>Pros</h4><ul>${s.pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
            <div><h4>Cons</h4><ul>${s.cons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
          <div class="week-plan">${week.map((d) => `<div><b>${esc(d.name)}:</b> ${d.slots.map((x) => WS.PATTERNS[x].label).join(', ')}</div>`).join('')}</div>
          <p class="small"><b>Evidence:</b> ${esc(s.evidence)} ${cite(s.refs)}</p>
          <button class="btn small" data-use="${s.id}" data-days="${days}">Build this in the planner →</button>
        </article>`;
      }).join('');
    };
    draw('All');
    panel.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-cat]');
      if (pill) {
        panel.querySelectorAll('.pill').forEach((b) => b.classList.toggle('active', b === pill));
        draw(pill.dataset.cat);
      }
      const use = e.target.closest('[data-use]');
      if (use) {
        const form = $('#profile-form');
        if (!WS.SPLIT_BY_ID[use.dataset.use].days.includes(Number(form.elements.days.value))) form.elements.days.value = use.dataset.days;
        if (use.dataset.use === 'specialization' && !form.elements.focus.value) form.elements.focus.value = 'glutes';
        location.hash = 'planner';
        run(use.dataset.use);
      }
    });
  }

  // ---------- exercise library ----------

  function renderExercises() {
    const panel = $('#tab-exercises');
    panel.innerHTML = `
      <div class="hero"><h1>Top exercises by body area.</h1>
        <p>Ranked by evidence: <span class="tier S">S</span> top pick · <span class="tier A">A</span> excellent · <span class="tier B">B</span> good alternative. Favours exercises that load muscles in a stretched position, are stable enough to push hard, and are easy to progress.</p></div>
      <div class="pill-group" id="area-pills">${['all'].concat(Object.keys(WS.AREAS)).map((a, i) => `<button class="pill${i ? '' : ' active'}" data-area="${a}">${a === 'all' ? 'All' : WS.AREAS[a]}</button>`).join('')}</div>
      <div class="filters">
        <input type="search" id="ex-search" placeholder="Search exercises…">
        <select id="ex-tier"><option value="">All tiers</option><option value="S">S: top picks</option><option value="A">A: excellent</option><option value="B">B: alternatives</option></select>
        <select id="ex-eq"><option value="">Any equipment</option>${Object.entries(EQ_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="grid" id="ex-grid"></div>`;
    let area = 'all';
    const draw = () => {
      const q = $('#ex-search').value.trim().toLowerCase();
      const eq = $('#ex-eq').value;
      const tier = $('#ex-tier').value;
      const list = WS.EXERCISES.filter((ex) => {
        const m = WS.PATTERNS[ex.pattern].muscle || 'functional';
        const exArea = ex.pattern === 'carry' ? 'functional' : m;
        return (area === 'all' || exArea === area) && (!eq || ex.eq === eq) && (!tier || ex.tier === tier) && (!q || ex.name.toLowerCase().includes(q));
      });
      $('#ex-grid').innerHTML = list.map(exerciseCard).join('') || '<p class="muted">No exercises match.</p>';
    };
    draw();
    const grid = $('#ex-grid');
    grid.addEventListener('click', (e) => { const c = e.target.closest('[data-ex]'); if (c) openExercise(c.dataset.ex); });
    grid.addEventListener('keydown', (e) => {
      const c = e.target.closest('[data-ex]');
      if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openExercise(c.dataset.ex); }
    });
    $('#area-pills').addEventListener('click', (e) => {
      const b = e.target.closest('[data-area]');
      if (!b) return;
      area = b.dataset.area;
      panel.querySelectorAll('#area-pills .pill').forEach((x) => x.classList.toggle('active', x === b));
      draw();
    });
    $('#ex-search').addEventListener('input', draw);
    $('#ex-eq').addEventListener('change', draw);
    $('#ex-tier').addEventListener('change', draw);
  }

  // ---------- diet ----------

  const fmt = (n) => (n == null ? '—' : String(Math.round(n * 10) / 10));

  function foodCard(f, rank, sort, advice) {
    const cal = { p: f.p * 4, c: f.c * 4, f: f.f * 9 };
    const tot = cal.p + cal.c + cal.f || 1;
    const metric = { protein: 'p', leanProtein: 'p', lowCarb: 'c', carbs: 'c', lowFat: 'f', fat: 'f', fiber: 'fib', lowCal: 'kcal' }[sort];
    return `<article class="card food">
      <div class="food-head"><span class="rank-no">#${rank}</span><h4>${esc(f.name)}</h4><span class="diet-badge diet-${f.diet}">${WS.DIETS[f.diet].short}</span></div>
      <div class="macro-bar" title="Share of calories: protein / carbs / fat">
        <span class="mb-p" style="width:${(cal.p / tot) * 100}%"></span><span class="mb-c" style="width:${(cal.c / tot) * 100}%"></span><span class="mb-f" style="width:${(cal.f / tot) * 100}%"></span></div>
      <p class="macros"><span${metric === 'kcal' ? ' class="hl"' : ''}><b>${fmt(f.kcal)}</b> kcal</span>
        <span${metric === 'p' ? ' class="hl"' : ''}><i class="dot mb-p"></i>${fmt(f.p)} g protein</span>
        <span${metric === 'c' ? ' class="hl"' : ''}><i class="dot mb-c"></i>${fmt(f.c)} g carbs</span>
        <span${metric === 'f' ? ' class="hl"' : ''}><i class="dot mb-f"></i>${fmt(f.f)} g fat</span>
        <span${metric === 'fib' ? ' class="hl"' : ''}>${fmt(f.fib)} g fibre</span></p>
      ${sort === 'leanProtein' ? `<p class="small"><b>${fmt(WS.proteinPer100kcal(f))} g</b> protein per 100 kcal</p>` : ''}
      ${f.rich.length ? `<div class="chips">${f.rich.map((n) => `<span class="chip">${WS.NUTRIENTS[n]}</span>`).join('')}</div>` : ''}
      ${WS.adviceBadge(advice, esc)}
      ${f.note ? `<p class="small muted">${esc(f.note)}</p>` : ''}
      <p class="countries">${f.countries.map((c) => `<span title="${WS.COUNTRIES[c]}">${c}</span>`).join('')}</p>
    </article>`;
  }

  function renderDiet() {
    const panel = $('#tab-diet');
    const opt = (obj, label) => Object.entries(obj).map(([k, v]) => `<option value="${k}">${label ? label(v) : v}</option>`).join('');
    panel.innerHTML = `
      <div class="hero"><h1>Eat for your training.</h1>
        <p>Top foods for protein, carbs, fats, fibre and every key vitamin and mineral, filtered by what you eat and what's sold where you live. Values are per 100 g and approximate.</p></div>
      <div class="filters diet-filters">
        <label>I eat<select id="diet-type">${opt(WS.DIETS, (d) => d.label)}</select></label>
        <label>Country<select id="diet-country"><option value="">All countries</option>${opt(WS.COUNTRIES)}</select></label>
        <label>Rank by<select id="diet-sort">${opt(WS.FOOD_SORTS, (s) => s.label)}</select></label>
        <label>Rich in<select id="diet-nutrient"><option value="">Any nutrient</option>${opt(WS.NUTRIENTS)}</select></label>
        <label>Health condition<select id="diet-cond"><option value="">None</option>${opt(WS.CONDITIONS, (c) => c.label)}</select></label>
        <label class="check"><input type="checkbox" id="diet-hide"> Hide foods to limit</label>
      </div>
      <div id="diet-cond-card"></div>
      <div class="pill-group" id="diet-quick">
        ${[['protein', ''], ['leanProtein', ''], ['lowCarb', ''], ['fiber', ''], ['protein', 'b12'], ['protein', 'iron'], ['protein', 'calcium'], ['protein', 'omega3'], ['protein', 'd'], ['protein', 'c']]
          .map(([s, n]) => `<button class="pill" data-sort="${s}" data-nutrient="${n}">${n ? WS.NUTRIENTS[n] : WS.FOOD_SORTS[s].label}</button>`).join('')}
      </div>
      <div id="diet-target"></div>
      <div class="grid" id="food-grid"></div>
      <p class="more-splits" id="food-more"></p>
      <h2 style="margin-top:28px">Good to know</h2>
      <div class="notes">
        <div class="card note"><h4>Vegans and vegetarians</h4><ul>
          <li><b>B12</b> is only reliable from fortified foods or a supplement.</li>
          <li><b>Vitamin D</b>: sunlight, fortified milks, UV mushrooms, or a supplement in winter.</li>
          <li><b>Iron</b> from plants absorbs better with vitamin C (lemon, amla, peppers) in the same meal.</li>
          <li><b>Omega-3</b>: chia, flax and walnuts give ALA; an algae-oil supplement gives EPA and DHA.</li>
          <li><b>Iodine</b>: iodised salt or a little seaweed.</li></ul> ${cite(['melina2016'])}</div>
        <div class="card note"><h4>Plant protein</h4><p>Different plant proteins over the day (dal + rice, tofu + vegetables, beans + grains) give all the essential amino acids; they don't have to be in the same meal. Soy, seitan and pulses are the most protein-dense.</p> ${cite(['melina2016', 'morton2018'])}</div>
        <div class="card note"><h4>About these numbers</h4><p>Per 100 g as eaten (cooked or raw as named), rounded. "Rich in" means a good source, roughly 20% of a day's needs per 100 g or a normal serving. Country tags show where a food is commonly sold, not the only places you can find it.</p> ${cite(['usdaFdc', 'ifct2017', 'mext2020'])}</div>
      </div>`;

    let showAll = false;
    const draw = () => {
      const diet = $('#diet-type').value, country = $('#diet-country').value;
      const sort = $('#diet-sort').value, nutrient = $('#diet-nutrient').value;
      const allowed = WS.DIETS[diet].includes;
      const key = WS.FOOD_SORTS[sort].key;
      const cond = $('#diet-cond').value, hide = $('#diet-hide').checked;
      const advice = (food) => WS.foodAdvice(food, cond);
      const list = WS.FOODS
        .filter((f) => allowed.includes(f.diet) && (!country || f.countries.includes(country)) && (!nutrient || f.rich.includes(nutrient)))
        .filter((f) => !(hide && (advice(f) || {}).level === 'limit'))
        .sort((a, b) => key(a) - key(b));
      const shown = showAll ? list : list.slice(0, 24);
      $('#diet-cond-card').innerHTML = WS.conditionCard(cond, cite, esc);
      $('#food-grid').innerHTML = shown.map((f, i) => foodCard(f, i + 1, sort, advice(f))).join('') || '<p class="muted">No foods match these filters.</p>';
      $('#food-more').innerHTML = list.length > shown.length ? `<button id="food-all">Show all ${list.length} foods</button>` : (list.length ? `${list.length} food${list.length === 1 ? '' : 's'}` : '');
      panel.querySelectorAll('#diet-quick .pill').forEach((b) => b.classList.toggle('active', b.dataset.sort === sort && b.dataset.nutrient === nutrient));

      // Protein target from the planner profile (Morton 2018).
      const p = state.profile;
      $('#diet-target').innerHTML = p && p.weight
        ? `<p class="target"><b>Your protein target: ${Math.round(p.weight * 1.6)}–${Math.round(p.weight * 2.2)} g/day</b> (1.6–2.2 g per kg at ${p.weight} kg). ${cite(['morton2018'])}</p>`
        : `<p class="target small muted">Add your body weight in the <a href="#planner">Planner</a> to see your daily protein target.</p>`;
    };
    panel.addEventListener('change', (e) => { if (e.target.matches('select, #diet-hide')) { showAll = false; draw(); } });
    panel.addEventListener('click', (e) => {
      const q = e.target.closest('#diet-quick .pill');
      if (q) { $('#diet-sort').value = q.dataset.sort; $('#diet-nutrient').value = q.dataset.nutrient; showAll = false; draw(); }
      if (e.target.id === 'food-all') { showAll = true; draw(); }
    });
    $('#diet-type').value = 'nonveg';
    draw();
    renderDiet.refresh = draw;
  }

  // ---------- HIIT, yoga, pilates, longevity ----------

  const channelCard = (c) => `<div class="card"><h4>${esc(WS.CHANNELS[c].name)}</h4><p class="small muted">${esc(WS.CHANNELS[c].blurb)}</p>
    <a class="vid" href="https://www.youtube.com/${WS.CHANNELS[c].handle}" target="_blank" rel="noopener">Open channel</a></div>`;

  function renderHiit() {
    $('#tab-hiit').innerHTML = `
      <div class="hero"><h1>HIIT &amp; Calisthenics</h1>
        <p>Interval protocols that raise VO2max, and bodyweight skill progressions you can train anywhere. Each one links to image and video searches.</p></div>
      <h2>Interval protocols</h2>
      <div class="grid">${WS.HIIT.map((h) => `<article class="card">
        <h3>${esc(h.name)}</h3><div class="chips"><span class="chip accent">${h.minutes} min</span><span class="chip">${h.level}</span></div>
        <p><b>Protocol:</b> ${esc(h.protocol)}</p><p class="small"><b>Modes:</b> ${esc(h.modes)}</p>
        <p class="small">${esc(h.why)} ${cite(h.refs)}</p>${searchLinks(h.name + ' workout')}</article>`).join('')}</div>
      <h2 style="margin-top:28px">Calisthenics skill progressions</h2>
      <p class="muted">Move to the next step when you hit the target for 3 sets with clean form. Tap a step to see videos of it.</p>
      <div class="grid">${WS.CALISTHENICS.map((c) => `<article class="card">
        <h3>${esc(c.skill)}</h3><div class="steps">${c.steps.map((s) => `<a href="${WS.googleVideos(s)}" target="_blank" rel="noopener">${esc(s)}</a>`).join('')}</div>
        <p class="small muted">Target: ${esc(c.target)}</p>${searchLinks(c.steps[c.steps.length - 1])}</article>`).join('')}</div>`;
  }

  function routineCard(r, channel) {
    return `<article class="card">
      <h3>${esc(r.name)}</h3><div class="chips"><span class="chip accent">${r.minutes} min</span><span class="chip">${esc(r.when)}</span></div>
      <p>${esc(r.purpose)}</p>
      <div class="pose-list">${(r.poses || r.moves).map((x) => `<a class="chip chip-link" href="${WS.yt(channel, x)}" target="_blank" rel="noopener" title="Search on ${esc(WS.CHANNELS[channel].name)}">${esc(x)} ▶</a>`).join('')}</div>
      <p class="small">${esc(r.why)} ${cite(r.refs)}</p>
      <div class="vids">${vid(channel, r.query)}</div></article>`;
  }

  function renderYoga() {
    $('#tab-yoga').innerHTML = `
      <div class="hero"><h1>Yoga</h1>
        <p>Mobility, balance, back health and recovery to go with your lifting. Videos from Yoga With Adriene.</p></div>
      <div class="channel-row">${channelCard('adriene')}</div>
      <p class="small muted">What the evidence says: yoga modestly helps chronic low back pain and improves balance in older adults. Stretching does <i>not</i> meaningfully reduce soreness or prevent most injuries; do it because it feels good and improves mobility. ${cite(['wieland2017', 'youkhana2016'])}</p>
      <h2>Routines</h2>
      <div class="grid">${WS.YOGA_ROUTINES.map((r) => routineCard(r, 'adriene')).join('')}</div>
      <h2 style="margin-top:28px">Pose library</h2>
      <div class="grid">${WS.YOGA_POSES.map((y) => `<article class="card"><h4>${esc(y.name)} <span class="muted small">${esc(y.sanskrit)}</span></h4>
        <p class="small"><b>Targets:</b> ${esc(y.targets)}</p><p class="small muted">${esc(y.cue)}</p><a class="btn small yt-btn" href="${WS.yt('adriene', y.query)}" target="_blank" rel="noopener">▶ Search “${esc(y.name)}” on Yoga With Adriene</a></article>`).join('')}</div>`;
  }

  function renderPilates() {
    $('#tab-pilates').innerHTML = `
      <div class="hero"><h1>Pilates</h1>
        <p>Core control, posture and back care, a great complement to heavy lifting. Free mat workouts from Blogilates.</p></div>
      <div class="channel-row">${channelCard('blogilates')}</div>
      <p class="small muted">What the evidence says: Pilates reduces pain and disability in chronic low back pain, and ranked among the most effective exercise options in a 2022 network meta-analysis. It won't replace heavy lifting for muscle and bone, so use it alongside. ${cite(['yamato2015', 'fernandez2022'])}</p>
      <div class="grid">${WS.PILATES_ROUTINES.map((r) => routineCard(r, 'blogilates')).join('')}</div>`;
  }

  function renderLongevity() {
    const L = WS.LONGEVITY;
    $('#tab-longevity').innerHTML = `
      <div class="hero"><h1>Training for longevity</h1>
        <p>Four pillars of exercise for a longer, healthier life, each backed by peer-reviewed research.</p></div>
      <div class="credit"><b>Credit: Bryan Johnson.</b> ${esc(L.credit)}. <a href="${L.video}" target="_blank" rel="noopener">Watch the video ▶</a><br>
        <span class="small">We added peer-reviewed sources for each claim below.</span></div>
      <div class="principles">${L.pillars.map((x, i) => `<article class="card"><h3>${i + 1}. ${esc(x.name)}</h3>
        <div class="chips"><span class="chip accent">${esc(x.target)}</span></div>
        <p>${esc(x.how)}</p><div class="stat">${esc(x.stat)} ${cite(x.refs)}</div></article>`).join('')}</div>
      <h2>Self-tests to track</h2>
      <div class="grid">${L.tests.map((t) => `<article class="card"><h4>${esc(t.name)}</h4><p class="small">${esc(t.how)}</p>
        <p class="small"><b>Goal:</b> ${esc(t.goal)} ${cite(t.refs)}</p></article>`).join('')}</div>
      <h2 style="margin-top:28px">How this app covers each pillar</h2>
      <div class="grid">
        <div class="card"><h4>Strength</h4><p class="small">The <a href="#planner">Planner</a> builds your lifting program.</p></div>
        <div class="card"><h4>Zone 2 &amp; intervals</h4><p class="small">Targets in your plan's recovery section; protocols in <a href="#hiit">HIIT</a>.</p></div>
        <div class="card"><h4>Balance &amp; mobility</h4><p class="small">Auto-added for 60+; daily options in <a href="#yoga">Yoga</a> and <a href="#pilates">Pilates</a>.</p></div>
      </div>
      <p class="warn" style="margin-top:20px">${esc(L.caveat)}</p>`;
  }

  function renderScience() {
    const principles = [
      ['Train each muscle 2× per week or more', 'Higher frequency produced more hypertrophy than once a week when volume was similar, and helps strength.', ['freq2016', 'strengthFreq2018']],
      ['About 10–20 hard sets per muscle per week', 'Growth rises with weekly sets, with diminishing returns at the high end. Beginners need less.', ['volume2017', 'pelland2024']],
      ['Take sets close to failure', 'Stopping 0–3 reps short of failure is where most growth happens; going further adds fatigue more than results.', ['failure2023']],
      ['A wide rep range works for muscle; heavy is best for strength', 'From about 6 to 30 reps builds similar muscle when effort is high. Heavy loads (1–5 reps) win for maximal strength.', ['load2017', 'lopez2021']],
      ['Rest long enough', 'Two to three minutes between heavy compound sets beat 1 minute for both strength and size.', ['rest2016']],
      ['Train muscles at long lengths', 'Exercises that load the stretched position (seated leg curls, overhead triceps, deep calf raises) produced more growth.', ['maeoHam2021', 'maeoTri2023', 'pedrosa2022', 'kassiano2023']],
      ['Exercise order matters for priorities', 'Exercises done first in a session gain more strength, so the planner puts focus muscles first.', ['nunes2021']],
      ['Some exercise variety helps; too much can blunt strength', 'Rotating exercises built muscle at least as well as fixed exercises and improved motivation, and varied exercises improved strength more than varied loads. Strength is skill-specific, so the planner keeps main barbell lifts fixed below Extreme variety.', ['bazValle2019', 'fonseca2014']],
      ['Maintenance takes far less', 'About one third of normal volume maintains muscle, which is how specialization blocks work.', ['bickel2011']],
      ['Sex and age change the details, not the principles', 'Men and women gain at similar relative rates. Older adults still respond strongly and benefit most from adding power and balance work.', ['roberts2020', 'peterson2010', 'fragala2019']],
      ['Protein and energy', 'About 1.6 g/kg/day of protein maximises training gains for most people.', ['morton2018']],
    ];
    const all = Object.values(WS.REFS).sort((a, b) => a.citation.localeCompare(b.citation));
    $('#tab-science').innerHTML = `
      <div class="hero"><h1>The science</h1><p>The principles the planner is built on, and every source we cite.</p></div>
      <div class="principles">${principles.map(([t, d, r]) => `<div class="card"><h4>${esc(t)}</h4><p class="small">${esc(d)}</p>${cite(r)}</div>`).join('')}</div>
      <div class="card" style="margin-bottom:24px"><h3>A note on body types</h3>
        <p class="small">"Ectomorph / mesomorph / endomorph" comes from 1940s somatotyping and does not predict how you respond to training. We ask about body type only as a shorthand for your current body composition, which changes calorie, cardio and exercise advice, not to put you in a box.</p></div>
      <div class="channel-row">${Object.keys(WS.CHANNELS).map(channelCard).join('')}</div>
      <h2>References</h2>
      <ol class="refs-list">${all.map((r) => `<li>${esc(r.citation)} <a href="${r.url}" target="_blank" rel="noopener">link</a></li>`).join('')}</ol>`;
  }

  // ---------- boot ----------

  // Shared helpers for the tabs in wellness-ui.js and tracker-ui.js.
  WS.ui = { $, esc, cite, state, searchLinks, rerun: () => run(state.splitId) };
  buildNav();

  $('#year').textContent = new Date().getFullYear();
  $('#footer-channels').textContent = Object.values(WS.CHANNELS).map((c) => c.name).join(', ');
  // Inside the Android / iOS app (Capacitor injects window.Capacitor): hide web-only bits.
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    document.documentElement.classList.add('native');
  }
  $('#profile-form').addEventListener('submit', (e) => { e.preventDefault(); run(); $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#results').addEventListener('click', onResultsClick);
  const modal = $('#ex-modal');
  $('#ex-modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  $('#results').addEventListener('change', (e) => {
    if (e.target.id === 'week-select') { state.week = Number(e.target.value); run(state.splitId); }
  });
  window.addEventListener('hashchange', showTab);

  // Saved data loads asynchronously (native storage in the apps), then the page renders.
  WS.store.init().then(() => {
    loadSaved();
    showTab();
    run(state.splitId);
    WS.checkReminder();
  });
})(window.WS = window.WS || {});
