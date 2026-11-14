/* MüggelSeepension · site script (no frameworks, no build step) */
(() => {
  'use strict';

  const doc = document.documentElement;
  doc.classList.add('js');
  const LANG = (doc.lang || 'de').toLowerCase().startsWith('en') ? 'en' : 'de';
  const MAIL_TO = 'kontakt@mueggelseepension.de';

  const TEXT = {
    de: {
      reqBoth: 'Bitte wählen Sie Anreise und Abreise.',
      reqPast: 'Die Anreise darf nicht in der Vergangenheit liegen.',
      reqOrder: 'Die Abreise muss nach der Anreise liegen.',
      reqMin: 'Wir nehmen Buchungen ab 2 Nächten an. Bitte wählen Sie eine spätere Abreise.',
      holdDone: 'Angekommen',
      holdLive: 'Angekommen am Müggelsee. Willkommen!',
      menuOpen: 'Menü öffnen', menuClose: 'Menü schließen',
      sending: 'Wird gesendet …',
      formInvalid: 'Bitte prüfen Sie die markierten Felder.',
      formOk: 'Vielen Dank! Ihre Anfrage ist bei uns angekommen. Wir melden uns so schnell wie möglich bei Ihnen.',
      formErr: 'Das hat leider nicht geklappt. Bitte rufen Sie uns an (030 640 903 26) oder schreiben Sie an kontakt@mueggelseepension.de.',
      formMail: 'Ihr E-Mail-Programm öffnet sich mit Ihrer fertigen Anfrage. Bitte dort nur noch auf Senden klicken.',
      mailSubject: 'Zimmeranfrage über die Website',
      labels: { name: 'Name', email: 'E-Mail', telefon: 'Telefon', gaeste: 'Gäste', anreise: 'Anreise', abreise: 'Abreise', zimmerwunsch: 'Zimmerwunsch', nachricht: 'Nachricht' }
    },
    en: {
      reqBoth: 'Please choose your arrival and departure dates.',
      reqPast: 'Arrival cannot be in the past.',
      reqOrder: 'Departure must be after arrival.',
      reqMin: 'We take bookings from 2 nights. Please choose a later departure.',
      holdDone: 'Arrived',
      holdLive: 'Arrived at Lake Müggelsee. Welcome!',
      menuOpen: 'Open menu', menuClose: 'Close menu',
      sending: 'Sending …',
      formInvalid: 'Please check the highlighted fields.',
      formOk: 'Thank you! Your request has reached us. We will get back to you as soon as possible.',
      formErr: 'Sorry, that did not work. Please call us (+49 30 640 903 26) or write to kontakt@mueggelseepension.de.',
      formMail: 'Your email app is opening with your request ready to go. Just press send there.',
      mailSubject: 'Room request from the website',
      labels: { name: 'Name', email: 'Email', telefon: 'Phone', gaeste: 'Guests', anreise: 'Arrival', abreise: 'Departure', zimmerwunsch: 'Room preference', nachricht: 'Message' }
    }
  }[LANG];

  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = fromIso(s); d.setDate(d.getDate() + n); return iso(d); };
  const nights = (a, b) => Math.round((fromIso(b) - fromIso(a)) / 86400000);
  const todayIso = () => iso(new Date());

  /* =========================================================
     1. Quick request card in the hero → inquiry form (main job of the page)
     ========================================================= */
  const rq = $('#req-form');
  const rqIn = $('#rq-in'), rqOut = $('#rq-out'), rqGuests = $('#rq-guests'), rqRoom = $('#rq-room');
  const rqMsg = $('#req-msg');
  const inqForm = $('#anfrage-form');
  const fIn = $('#f-in'), fOut = $('#f-out'), fGuests = $('#f-guests'), fRoom = $('#f-room'), fName = $('#f-name');

  const setRqMsg = t => { if (rqMsg && rqMsg.textContent !== t) rqMsg.textContent = t; };

  function carryOver() {
    if (rqIn && fIn && rqIn.value) fIn.value = rqIn.value;
    if (rqOut && fOut && rqOut.value) fOut.value = rqOut.value;
    if (rqGuests && fGuests) fGuests.value = rqGuests.value;
    if (rqRoom && fRoom && rqRoom.value) fRoom.value = rqRoom.value;
    const note = $('.prefill-note');
    if (note && rqIn && rqIn.value) note.classList.add('show');
  }
  function goToForm() {
    const target = $('#anfrage');
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth', block: 'start' });
    if (inqForm) {
      inqForm.classList.remove('flash');
      void inqForm.offsetWidth;
      inqForm.classList.add('flash');
    }
    setTimeout(() => { if (fName) fName.focus({ preventScroll: true }); }, reduceMQ.matches ? 0 : 700);
  }

  if (rq && rqIn && rqOut) {
    const t = todayIso();
    rqIn.min = t;
    rqOut.min = addDays(t, 2);
    rqIn.addEventListener('change', () => {
      if (rqIn.value) {
        rqOut.min = addDays(rqIn.value, 2);
        if (!rqOut.value || nights(rqIn.value, rqOut.value) < 2) rqOut.value = addDays(rqIn.value, 2);
      }
      setRqMsg('');
    });
    rqOut.addEventListener('change', () => setRqMsg(''));
    rq.addEventListener('submit', e => {
      e.preventDefault();
      const a = rqIn.value, b = rqOut.value;
      if (!a || !b) { setRqMsg(TEXT.reqBoth); (a ? rqOut : rqIn).focus(); return; }
      if (a < todayIso()) { setRqMsg(TEXT.reqPast); rqIn.focus(); return; }
      if (b <= a) { setRqMsg(TEXT.reqOrder); rqOut.focus(); return; }
      if (nights(a, b) < 2) { setRqMsg(TEXT.reqMin); rqOut.focus(); return; }
      setRqMsg('');
      carryOver();
      goToForm();
    });
  }
  /* every "request" button carries what was already chosen */
  $$('a.js-request').forEach(a => a.addEventListener('click', e => {
    if (!$('#anfrage')) return;
    e.preventDefault();
    carryOver();
    if (a.dataset.room && fRoom) fRoom.value = a.dataset.room;
    goToForm();
  }));

  /* =========================================================
     2. Header and mobile navigation
     ========================================================= */
  const header = $('.site-header');
  const navToggle = $('.nav-toggle');
  const nav = $('#site-nav');
  const alwaysSolid = header && header.classList.contains('solid');
  let headerSolid = null;
  function updateHeader() {
    if (!header || alwaysSolid) return;
    const solid = window.scrollY > 40;
    if (solid !== headerSolid) { headerSolid = solid; header.classList.toggle('solid', solid); }
  }
  function setNav(open) {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? TEXT.menuClose : TEXT.menuOpen);
    document.body.classList.toggle('nav-open', open);
    if (open) { const first = nav && nav.querySelector('a'); if (first) first.focus(); }
  }
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', nav).forEach(a => a.addEventListener('click', () => setNav(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setNav(false); navToggle.focus(); } });
    matchMedia('(min-width: 981px)').addEventListener('change', e => { if (e.matches) setNav(false); });
  }

  /* =========================================================
     3. Scroll-linked timeline (rAF only while scrolling)
     ========================================================= */
  const timeline = $('.timeline');
  const tlItems = timeline ? $$('li', timeline) : [];
  let tlStops = [], tlLast = -1, tlPinned = false;
  function measureTimeline() {
    if (!timeline) return;
    const h = timeline.offsetHeight || 1;
    tlStops = tlItems.map(li => (li.offsetTop + 10) / h);
  }
  function updateTimeline() {
    if (!timeline || tlPinned) return;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -200 || r.top > vh + 200) return;
    const p = Math.min(1, Math.max(0, (vh * 0.72 - r.top) / r.height));
    const q = Math.round(p * 400) / 400;
    if (q === tlLast) return;
    tlLast = q;
    timeline.style.setProperty('--tl', q);
    tlItems.forEach((li, i) => { const on = q >= tlStops[i] - 0.001; if (li.classList.contains('on') !== on) li.classList.toggle('on', on); });
  }
  let ticking = false;
  function frame() { ticking = false; updateHeader(); updateTimeline(); }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', () => { measureTimeline(); tlLast = -1; frame(); }, { passive: true });
  measureTimeline();
  frame();

  /* =========================================================
     4. Entrances and living elements (paused when not visible)
     ========================================================= */
  const revealEls = $$('.reveal, .stagger, .ornament');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      if (e.target.classList.contains('stagger')) setTimeout(() => e.target.classList.add('done'), 1800);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
    const liveIO = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('offscreen', !e.isIntersecting)), { rootMargin: '120px 0px' });
    $$('[data-live]').forEach(s => liveIO.observe(s));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));

  /* =========================================================
     5. The one interactive moment: hold to row across the lake
     ========================================================= */
  const holdBox = $('[data-hold]');
  let holdApi = null;
  if (holdBox) {
    const btn = $('.hold-btn', holdBox);
    const label = $('.hold-label', holdBox);
    const status = $('.hold-status', holdBox);
    const startLabel = label ? label.textContent : '';
    const HOLD_MS = 1800, RELEASE_MS = 1000;
    let p = 0, shown = -1, holding = false, raf = null, last = 0, done = false, keyHold = false, userDone = false;
    const setP = v => { const q = Math.round(v * 100) / 100; if (q !== shown) { shown = q; holdBox.style.setProperty('--p', q); } };
    function loop(now) {
      const dt = Math.min(64, now - (last || now));
      last = now;
      p = holding ? Math.min(1, p + dt / HOLD_MS) : Math.max(0, p - dt / RELEASE_MS);
      setP(p);
      if (holding && p >= 1) complete(true);
      if (!done && ((holding && p < 1) || (!holding && p > 0))) raf = requestAnimationFrame(loop);
      else { raf = null; last = 0; }
    }
    function start() { if (done) return; holding = true; holdBox.classList.add('holding'); btn.classList.add('holding'); if (!raf) raf = requestAnimationFrame(loop); }
    function stop() { holding = false; holdBox.classList.remove('holding'); btn.classList.remove('holding'); if (!raf && !done && p > 0) raf = requestAnimationFrame(loop); }
    function complete(byUser) {
      done = true; if (byUser) userDone = true; holding = false; p = 1; setP(1);
      holdBox.classList.remove('holding'); btn.classList.remove('holding');
      holdBox.classList.add('done');
      btn.setAttribute('aria-pressed', 'true');
      if (label) label.textContent = TEXT.holdDone;
      if (status) status.textContent = TEXT.holdLive;
    }
    function reset() {
      if (userDone) return;
      done = false; p = 0; setP(0);
      holdBox.classList.remove('done');
      btn.removeAttribute('aria-pressed');
      if (label) label.textContent = startLabel;
      if (status) status.textContent = '';
    }
    btn.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } start(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, stop));
    btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); keyHold = true; start(); } });
    btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); keyHold = false; stop(); } });
    btn.addEventListener('contextmenu', e => e.preventDefault());
    btn.addEventListener('click', e => { if (e.detail === 0 && !keyHold && !done) complete(true); });
    holdApi = { pin: () => { if (!done) complete(false); }, unpin: reset };
  }

  /* =========================================================
     6. Reduced motion, live in both directions
     ========================================================= */
  function pinToFinalStates() {
    revealEls.forEach(el => el.classList.add('in'));
    tlPinned = true;
    doc.classList.add('pinned');
    if (timeline) { timeline.style.setProperty('--tl', 1); tlItems.forEach(li => li.classList.add('on')); }
    if (holdApi) holdApi.pin();
  }
  function unpinFinalStates() {
    tlPinned = false; doc.classList.remove('pinned'); tlLast = -1;
    measureTimeline(); updateTimeline();
    if (holdApi) holdApi.unpin();
  }
  if (reduceMQ.matches) pinToFinalStates();
  reduceMQ.addEventListener('change', e => { if (e.matches) pinToFinalStates(); else unpinFinalStates(); });

  /* =========================================================
     7. Price tabs (seasons)
     ========================================================= */
  const tabList = $('[role="tablist"]');
  if (tabList) {
    const tabs = $$('[role="tab"]', tabList);
    const select = tab => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        select(n); n.focus();
      });
    });
    /* open the current season automatically */
    const m = new Date().getMonth() + 1;
    const season = (m >= 11 || m <= 2) ? 'low' : (m === 3 || m === 4 || m === 10) ? 'mid' : 'high';
    const current = tabs.find(t => t.dataset.season === season);
    if (current) select(current);
  }

  /* =========================================================
     8. Gallery lightbox
     ========================================================= */
  const dlg = $('#lightbox');
  const links = $$('.gallery a');
  if (dlg && links.length && typeof dlg.showModal === 'function') {
    const img = $('#lb-img'), cap = $('#lb-cap'), count = $('#lb-count');
    let idx = 0, opener = null;
    const show = i => {
      idx = (i + links.length) % links.length;
      const a = links[idx], th = a.querySelector('img');
      img.src = a.getAttribute('href');
      img.alt = th ? th.alt : '';
      cap.textContent = th ? th.alt : '';
      count.textContent = `${idx + 1} / ${links.length}`;
    };
    links.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); opener = a; show(i); dlg.showModal(); }));
    $('.lb-prev', dlg).addEventListener('click', () => show(idx - 1));
    $('.lb-next', dlg).addEventListener('click', () => show(idx + 1));
    $('.lb-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
    dlg.addEventListener('close', () => { if (opener) opener.focus(); });
    let tx = null;
    dlg.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); tx = null; });
  }

  /* =========================================================
     9. Map loads only after a click (privacy)
     ========================================================= */
  $$('[data-map]').forEach(box => {
    const b = $('button', box);
    if (!b) return;
    b.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = box.dataset.map;
      f.title = box.dataset.title || 'Map';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.replaceChildren(f);
    });
  });

  /* =========================================================
     10. Inquiry form (Formspree, PHP script, or mailto fallback)
     ========================================================= */
  if (inqForm) {
    const status = $('#form-status');
    const submit = $('button[type="submit"]', inqForm);
    const submitLabel = submit ? $('.btn-label', submit) : null;
    const labelText = submitLabel ? submitLabel.textContent : '';
    if (fIn && fOut) {
      fIn.min = todayIso();
      fIn.addEventListener('change', () => {
        if (fIn.value) {
          fOut.min = addDays(fIn.value, 2);
          if (!fOut.value || nights(fIn.value, fOut.value) < 2) fOut.value = addDays(fIn.value, 2);
        }
      });
    }
    const setStatus = (cls, text) => { status.className = `form-status ${cls}`; status.textContent = text; };
    const markField = (el, ok) => { const w = el.closest('.ff'); if (w) w.classList.toggle('invalid', !ok); el.setAttribute('aria-invalid', String(!ok)); };
    const back = new URLSearchParams(location.search).get('anfrage');
    if (back === 'danke') setStatus('ok', TEXT.formOk);
    if (back === 'fehler') setStatus('err', TEXT.formErr);

    function validate() {
      let first = null;
      $$('[required]', inqForm).forEach(el => {
        const ok = el.type === 'checkbox' ? el.checked : (el.value.trim() !== '' && el.checkValidity());
        markField(el, ok);
        if (!ok && !first) first = el;
      });
      if (fIn && fOut) {
        const bad = fIn.value && fOut.value && fOut.value <= fIn.value;
        markField(fOut, !bad);
        if (bad && !first) first = fOut;
      }
      return first;
    }
    function mailtoFallback() {
      const fd = new FormData(inqForm);
      const lines = Object.keys(TEXT.labels).filter(k => (fd.get(k) || '').toString().trim() !== '').map(k => `${TEXT.labels[k]}: ${fd.get(k)}`);
      setStatus('info', TEXT.formMail);
      window.location.href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(TEXT.mailSubject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    }
    inqForm.addEventListener('submit', async e => {
      e.preventDefault();
      setStatus('', '');
      const bad = validate();
      if (bad) { setStatus('err', TEXT.formInvalid); bad.focus(); return; }
      if (inqForm.elements._gotcha && inqForm.elements._gotcha.value) { setStatus('ok', TEXT.formOk); inqForm.reset(); return; }
      const action = inqForm.getAttribute('action') || '';
      if (!action || action.includes('DEIN-FORMULAR-ID')) { mailtoFallback(); return; }
      submit.disabled = true;
      if (submitLabel) submitLabel.textContent = TEXT.sending;
      try {
        const res = await fetch(action, { method: 'POST', body: new FormData(inqForm), headers: { Accept: 'application/json' } });
        let data = null;
        try { data = await res.json(); } catch (_) { /* non-JSON */ }
        if (!res.ok || (data && data.ok === false)) throw new Error(`HTTP ${res.status}`);
        setStatus('ok', TEXT.formOk);
        inqForm.reset();
        $$('.ff.invalid', inqForm).forEach(w => w.classList.remove('invalid'));
      } catch (err) {
        setStatus('err', TEXT.formErr);
      } finally {
        submit.disabled = false;
        if (submitLabel) submitLabel.textContent = labelText;
        status.focus();
      }
    });
  }

  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
})();
