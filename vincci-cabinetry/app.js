(() => {
  const C = window.VINCCI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Idioma preservando a seção
  $$('.lang').forEach((a) => a.addEventListener('click', (e) => {
    if (!location.hash) return;
    e.preventDefault(); location.href = a.getAttribute('href') + location.hash;
  }));

  // ---------- Revelação ao rolar ----------
  const rvs = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) rvs.forEach((el) => el.classList.add('in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rvs.forEach((el) => io.observe(el));
  }

  // ---------- Filtro da galeria ----------
  const items = $$('#wkGrid .wk');
  const count = $('#wkCount');
  function filter(f) {
    let n = 0;
    items.forEach((it) => { const on = f === 'all' || it.dataset.c === f; it.classList.toggle('out', !on); if (on) { n++; it.classList.add('in'); } });
    count.textContent = `${n} ${C.count[n === 1 ? 0 : 1]}`;
  }
  $$('.filters button').forEach((b) => b.addEventListener('click', () => {
    $$('.filters button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    filter(b.dataset.f);
  }));
  filter('all');

  // ---------- Lightbox: navega só pelas fotos visíveis no filtro ----------
  const lb = $('#lb');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  const lbN = $('#lbN');
  let cur = 0;
  let opener = null;
  const visible = () => items.filter((it) => !it.classList.contains('out')).map((it) => +$('.wk-b', it).dataset.i);
  function show(i) {
    cur = i;
    const w = C.work[i];
    lbImg.src = `${C.img}${w.f}.webp`; lbImg.width = w.w; lbImg.height = w.h; lbImg.alt = w.c;
    lbCap.textContent = w.c; lbN.textContent = String(i + 1).padStart(2, '0');
    [w, C.work[(i + 1) % C.work.length]].forEach((x) => { const p = new Image(); p.src = `${C.img}${x.f}.webp`; });
  }
  function step(d) {
    const v = visible();
    const list = v.includes(cur) ? v : C.work.map((_, k) => k);
    const k = list.indexOf(cur);
    show(list[(k + d + list.length) % list.length]);
  }
  $$('.wk-b').forEach((b) => b.addEventListener('click', () => {
    opener = b; show(+b.dataset.i);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
  }));
  const close = () => { lb.close ? lb.close() : lb.removeAttribute('open'); };
  $('#lbX').addEventListener('click', close);
  $('#lbP').addEventListener('click', () => step(-1));
  $('#lbNx').addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  lb.addEventListener('close', () => opener && opener.focus());
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  let tx = null;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null; });

  // ---------- Montador de orçamento (4 etapas) ----------
  const form = $('#qb');
  const steps = $$('.qs', form);
  const prog = $$('.qb-prog li', form);
  const ofB = $('#qbOf b');
  const back = $('#qBack');
  const next = $('#qNext');
  const msg = $('#qMsg');
  const sms = $('#qSms');
  const mail = $('#qMail');
  const nameI = $('#qName');
  const whereI = $('#qWhere');
  const photos = $('#qPhotos');
  let at = 0;
  let last = {};

  const val = (n) => { const el = form.querySelector(`input[name="${n}"]:checked`); return el ? el.value : null; };
  function syncScope() {
    const k = C.kinds[val('room')] || 'kitchen';
    const chips = $$('.ch[data-for]', form);
    chips.forEach((c) => { c.hidden = c.dataset.for !== k; });
    const cur = form.querySelector('input[name="scope"]:checked');
    if (!cur || cur.closest('.ch').hidden) {
      $$('input[name="scope"]', form).forEach((i) => { i.checked = false; });
      const first = chips.find((c) => !c.hidden);
      if (first) first.querySelector('input').checked = true;
    }
  }
  function fields() {
    return [
      [C.msg.room, val('room')], [C.msg.scope, val('scope')], [C.msg.when, val('when')],
      [C.msg.where, whereI.value.trim()], [C.msg.name, nameI.value.trim()],
    ].filter(([, v]) => v);
  }
  const escH = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  function render() {
    const f = fields();
    const tail = [photos.checked ? C.msg.photos : null, C.msg.from].filter(Boolean);
    const text = [C.msg.hi, '', ...f.map(([k, v]) => `• ${k}: ${v}`), '', ...tail].join('\n');
    msg.innerHTML = [escH(C.msg.hi), '', ...f.map(([k, v]) => `• ${escH(k)}: <mark>${escH(v)}</mark>`), '', ...tail.map(escH)].join('\n');
    last = Object.fromEntries(f);
    const body = encodeURIComponent(text);
    sms.href = `sms:${C.tel}?&body=${body}`;
    mail.href = `mailto:${C.email}?subject=${encodeURIComponent(C.msg.subj)}&body=${body}`;
  }
  function go(i, focus = true) {
    at = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, k) => s.classList.toggle('on', k === at));
    prog.forEach((p, k) => p.classList.toggle('on', k <= at));
    ofB.textContent = at + 1;
    back.disabled = at === 0;
    form.classList.toggle('last', at === steps.length - 1);
    if (focus) {
      const t = steps[at].querySelector('input:checked, input');
      if (t) t.focus({ preventScroll: true });
      const top = form.getBoundingClientRect().top;
      if (top < 60) form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }
  next.addEventListener('click', () => go(at + 1));
  back.addEventListener('click', () => go(at - 1));
  form.addEventListener('change', (e) => {
    if (e.target.name === 'room') syncScope();
    render();
  });
  form.addEventListener('input', render);
  // Escolher um cômodo já avança (no celular economiza um toque)
  $$('.rm', form).forEach((r) => r.addEventListener('pointerup', () => { if (at === 0) setTimeout(() => go(1), reduce ? 0 : 260); }));
  form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') { e.preventDefault(); if (at < steps.length - 1) go(at + 1); else sms.focus(); } });
  syncScope(); render(); go(0, false);

  // ---------- Barra fixa do celular some perto do orçamento e do fecho ----------
  const dock = $('.dock');
  if (dock && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      dock.classList.toggle('away', seen.size > 0);
    }, { threshold: 0.05 });
    [form, $('.end'), $('.ft')].forEach((el) => el && io.observe(el));
  }
})();
