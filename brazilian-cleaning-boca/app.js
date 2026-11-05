(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const EN = main.dataset.lang === 'en';
  const T = (a, b) => (EN ? a : b);
  const TEL = main.dataset.tel;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Barra fixa do celular some quando o orçamento está na tela
  const dock = $('.dock'), seen = new Set();
  const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); dock.classList.toggle('away', seen.size > 0); }, { threshold: .15 });
  ['#qt', '#cta'].forEach(s => io.observe($(s)));

  // Orçamento em 3 toques: SMS real para a Kelly
  const f = $('#qt');
  const sms = $('.qt-sms', f), hint = $('.qt-hint', f), msg = $('.qt-msg', f), otherBox = $('.city-other', f);
  const stepFreq = $('.step-freq', f), stepSpace = $('.step-space', f);
  const baseHint = hint.textContent;
  const picked = n => f.querySelector(`input[name="${n}"]:checked`);
  const val = n => (f.elements[n]?.value || '').trim();
  const isCom = () => picked('svc')?.dataset.id === 'commercial';
  const text = () => {
    const s = picked('svc'), fr = picked('freq'), sp = picked('space'), c = picked('city'), z = picked('size');
    const city = c ? (c.value === 'other' ? val('cityOther') || T('other city', 'outra cidade') : c.value) : '';
    const rows = [
      s && [T('Service', 'Serviço'), s.value],
      !isCom() && fr && [T('Frequency', 'Frequência'), fr.value],
      isCom() && sp && [T('Space', 'Espaço'), sp.value],
      city && [T('City', 'Cidade'), city],
      z && !isCom() && [T('Home', 'Imóvel'), z.value],
      val('name') && [T('Name', 'Nome'), val('name')],
    ].filter(Boolean);
    return [T("Hi Kelly! I'd like a free estimate.", 'Oi, Kelly! Quero um orçamento grátis.'), '', ...rows.map(([k, v]) => `• ${k}: ${v}`), '', T('Sent from your website.', 'Enviado pelo site.')].join('\n');
  };
  const update = () => {
    const s = picked('svc'), c = picked('city'), com = isCom();
    stepFreq.hidden = com; stepSpace.hidden = !com;
    otherBox.hidden = !(c && c.value === 'other');
    const t = text();
    sms.href = `sms:${TEL}?&body=${encodeURIComponent(t)}`;
    msg.textContent = t;
    f.classList.toggle('ready', !!s);
    hint.classList.remove('err');
    const second = com ? picked('space') : picked('freq');
    if (!s) hint.textContent = baseHint;
    else if (!second) hint.textContent = com ? T('Now, what kind of space?', 'Agora, que tipo de espaço?') : T('Now, how often?', 'Agora, com que frequência?');
    else if (!c) hint.textContent = T('Last one: where?', 'Por último: onde?');
    else hint.textContent = T('Ready. Tap “Send text” and hit send.', 'Pronto. Toque em “Mandar SMS” e envie.');
    $$('.pin, .area-pick').forEach(b => b.classList.toggle('on', !!c && b.dataset.city === c.value));
    $$('.space').forEach(b => b.classList.toggle('on', !!s && (com ? picked('space')?.dataset.id === b.dataset.space : b.dataset.space === 'house' && s.dataset.id !== 'commercial')));
  };
  f.addEventListener('change', update);
  f.addEventListener('input', update);
  f.addEventListener('submit', e => e.preventDefault());
  sms.addEventListener('click', e => {
    if (picked('svc')) return;
    e.preventDefault();
    hint.textContent = T('Pick a service first (step 1).', 'Escolha um serviço primeiro (passo 1).');
    hint.classList.add('err');
    f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
    $('input[name="svc"]', f).focus();
  });
  update();

  let lenis = null;
  const goForm = () => { const el = $('#quote'); if (lenis) lenis.scrollTo(el, { offset: -90 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  const choose = (name, id) => { const r = f.querySelector(`input[name="${name}"][data-id="${id}"]`); if (r) r.checked = true; };
  $$('.space').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.space === 'house') choose('svc', 'house'); else { choose('svc', 'commercial'); choose('space', b.dataset.space); }
    update(); goForm();
  }));
  $$('.pin, .area-pick').forEach(b => b.addEventListener('click', () => { choose('city', b.dataset.city); update(); goForm(); }));

  // Momento: a lista que troca entre limpeza regular e Airbnb
  const card = $('.list-card'), seg = $$('.seg button'), lis = $$('.checks li'), sub = $('.list-sub');
  let mode = 'r';
  const setMode = (m, anim) => {
    mode = m;
    card.classList.toggle('mode-a', m === 'a');
    seg.forEach(b => b.setAttribute('aria-checked', b.dataset.mode === m));
    sub.textContent = sub.dataset[m];
    lis.forEach((li, i) => {
      const st = li.dataset[m];
      const apply = () => { li.className = 's-' + st + (anim ? ' flip' : ''); };
      if (anim && !reduce) setTimeout(apply, i * 35); else apply();
    });
  };
  seg.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode, true)));
  setMode('r', false);
  $('.list-pick').addEventListener('click', () => { choose('svc', mode === 'a' ? 'airbnb' : 'house'); update(); goForm(); });

  // Momento: panos por cor
  const tabs = $$('.cl');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); $('#clp-' + x.dataset.k).hidden = !on; });
  }));
  tabs.forEach((t, i) => t.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.click(); n.focus();
  }));

  // Momento: esfregar o box (o mofo no silicone não sai)
  const box = $('.scrub-box'), cv = $('.scrub-cv'), pctEl = $('.scrub-pct'), verdict = $('.verdict');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, base, grime, gctx, done = false, strokes = 0, pctNow = 0;
  const initScrub = () => {
    const r = box.getBoundingClientRect();
    if (W && Math.abs(r.width - W) < 2) return;
    W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    base = document.createElement('canvas'); base.width = cv.width; base.height = cv.height;
    const b = base.getContext('2d'); b.scale(dpr, dpr);
    const cy = H * .66, ch = Math.max(10, H * .035);
    b.fillStyle = '#f3f6f8'; b.fillRect(0, 0, W, cy);
    const ts = W / 6; b.strokeStyle = '#d9e0e6'; b.lineWidth = 3;
    for (let x = ts; x < W; x += ts) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, cy); b.stroke(); }
    for (let y = cy - ts; y > 0; y -= ts) { b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke(); }
    b.fillStyle = '#ece8e1'; b.fillRect(0, cy, W, ch);
    const g = b.createLinearGradient(0, cy + ch, 0, H); g.addColorStop(0, '#ffffff'); g.addColorStop(.25, '#f4f4f4'); g.addColorStop(1, '#e3e6ea');
    b.fillStyle = g; b.fillRect(0, cy + ch, W, H - cy - ch);
    b.fillStyle = 'rgba(255,255,255,.9)'; b.fillRect(0, cy + ch + 6, W, 3);
    // o mofo preto entranhado no silicone: fica
    let s = 11; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < W / 2.2; i++) {
      const x = rnd() * W, cluster = Math.sin(x / W * 9) > -.2;
      if (!cluster && rnd() > .25) continue;
      b.fillStyle = `rgba(22,22,24,${.45 + rnd() * .5})`;
      b.beginPath(); b.ellipse(x, cy + ch * (.2 + rnd() * .6), 1 + rnd() * 3.2, .8 + rnd() * 2, 0, 0, Math.PI * 2); b.fill();
    }
    // a sujeira de superfície: sai
    grime = document.createElement('canvas'); grime.width = cv.width; grime.height = cv.height;
    gctx = grime.getContext('2d', { willReadFrequently: true }); gctx.scale(dpr, dpr);
    gctx.fillStyle = 'rgba(184,158,108,.5)'; gctx.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 900; i++) { const x = rnd() * W, y = rnd() * H, r0 = 3 + rnd() * 12; const g = gctx.createRadialGradient(x, y, 0, x, y, r0); g.addColorStop(0, rnd() > .4 ? 'rgba(128,100,56,.35)' : 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); gctx.fillStyle = g; gctx.fillRect(x - r0, y - r0, r0 * 2, r0 * 2); }
    for (let i = 0; i < W / 45; i++) { gctx.strokeStyle = `rgba(120,94,52,${.08 + rnd() * .12})`; gctx.lineWidth = 2 + rnd() * 4; const x = rnd() * W, y0 = rnd() * cy * .7; gctx.beginPath(); gctx.moveTo(x, y0); gctx.quadraticCurveTo(x + rnd() * 6 - 3, (y0 + cy) / 2, x + rnd() * 4 - 2, cy + ch); gctx.stroke(); }
    gctx.globalCompositeOperation = 'destination-out';
    done = false; verdict.hidden = true; box.classList.remove('used'); pctEl.textContent = '0';
    render();
  };
  const render = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0); ctx.drawImage(grime, 0, 0); };
  const measure = () => {
    const d = gctx.getImageData(0, 0, grime.width, grime.height).data; const step = Math.round(14 * dpr);
    let n = 0, c = 0;
    for (let y = step / 2 | 0; y < grime.height; y += step) for (let x = step / 2 | 0; x < grime.width; x += step) { n++; if (d[(y * grime.width + x) * 4 + 3] < 50) c++; }
    pctNow = Math.round(c / n * 100); pctEl.textContent = pctNow;
    if (pctNow >= 70 && !done) { done = true; verdict.hidden = false; }
  };
  const rub = (x, y) => {
    const rad = Math.max(26, W * .05);
    const g = gctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    gctx.fillStyle = g; gctx.beginPath(); gctx.arc(x, y, rad, 0, Math.PI * 2); gctx.fill();
    if (++strokes % 10 === 0) measure();
  };
  let down = false, last = null;
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const line = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / 8)); for (let i = 1; i <= n; i++) rub(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n); render(); };
  cv.addEventListener('pointerdown', e => { down = true; box.classList.add('used'); cv.setPointerCapture(e.pointerId); last = pos(e); rub(...last); render(); });
  cv.addEventListener('pointermove', e => { if (!down) return; const p = pos(e); line(last, p); last = p; });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { down = false; measure(); }));
  const autoScrub = instant => {
    box.classList.add('used');
    const rows = Math.ceil(H / (Math.max(26, W * .05) * 1.2)) + 1, pts = [];
    for (let r = 0; r < rows; r++) { const y = r * H / (rows - 1); pts.push(r % 2 ? [W, y] : [0, y], r % 2 ? [0, y] : [W, y]); }
    if (instant) { for (let i = 1; i < pts.length; i++) line(pts[i - 1], pts[i]); measure(); return; }
    let i = 1, t = 0;
    const step = () => {
      if (i >= pts.length) { measure(); return; }
      const a = pts[i - 1], b = pts[i]; const t2 = Math.min(1, t + .08);
      line([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], [a[0] + (b[0] - a[0]) * t2, a[1] + (b[1] - a[1]) * t2]);
      t = t2; if (t >= 1) { t = 0; i++; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  $('.scrub-auto').addEventListener('click', () => { if (done) { W = 0; initScrub(); } autoScrub(reduce); });
  initScrub();
  if (reduce) autoScrub(true);
  new ResizeObserver(() => initScrub()).observe(box);

  // Reels: embed oficial do Instagram, só ao tocar
  const dlg = $('.reel-dlg'), frame = $('.dlg-frame');
  $$('.reel').forEach(r => r.addEventListener('click', () => {
    frame.innerHTML = `<iframe src="https://www.instagram.com/reel/${r.dataset.id}/embed" title="Instagram" loading="lazy" allowfullscreen></iframe>`;
    dlg.showModal();
  }));
  const close = () => { dlg.close(); };
  $('.dlg-x').addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => { frame.innerHTML = ''; });

  if (reduce || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ lerp: .11 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const el = $(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); lenis.scrollTo(el, { offset: -90 });
  }));

  const reveal = (targets, vars, trig) => {
    const tw = gsap.from(targets, { ...vars, paused: true });
    const el = typeof trig === 'string' ? $(trig) : trig;
    const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { o.disconnect(); tw.play(); } }, { rootMargin: '0px 0px -12% 0px' });
    o.observe(el);
  };
  gsap.from('.h1-a', { y: 40, opacity: 0, duration: 1, ease: 'expo.out' });
  gsap.from('.hero .h1-b', { clipPath: 'inset(0 100% 0 0)', duration: 1.4, delay: .35, ease: 'power3.inOut' });
  gsap.from('.eyebrow, .hero-sub, .proof', { y: 16, opacity: 0, duration: .9, stagger: .07, delay: .2, ease: 'power3.out' });
  gsap.from('.hero-photo', { rotate: -16, x: -40, opacity: 0, duration: 1.4, delay: .3, ease: 'expo.out' });
  gsap.from('.qt', { y: 50, opacity: 0, duration: 1.1, delay: .1, ease: 'expo.out' });
  reveal('.space', { y: 30, opacity: 0, duration: .7, stagger: .08, ease: 'back.out(2)'}, '.spaces');
  reveal('.cl', { y: 60, rotate: () => gsap.utils.random(-12, 12), opacity: 0, duration: 1, stagger: .1, ease: 'back.out(1.6)'}, '.cl-stack');
  reveal('.reel', { x: 120, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out'}, '.reel-track');
  reveal('.rv', { y: 50, scale: .9, opacity: 0, duration: .8, stagger: .1, ease: 'back.out(1.6)'}, '.rv-grid');
  reveal('.pin', { scale: 0, duration: .7, stagger: .15, ease: 'back.out(3)'}, '.coast');
  reveal('.vs-card.ours', { x: -60, opacity: 0, duration: 1, ease: 'expo.out'}, '.vs-grid');
  reveal('.vs-card:not(.ours)', { x: 60, opacity: 0, duration: 1, ease: 'expo.out'}, '.vs-grid');
  reveal('.vs-badge', { scale: 0, rotate: -90, duration: .8, delay: .4, ease: 'back.out(3)'}, '.vs-grid');
  $$('.sec-head, .list-head, .list-card, .note-card, .scrub-box, .scrub-copy, .g, .area-copy, .fq, .cta-in').forEach(el => reveal(el, { y: 34, opacity: 0, duration: .9, ease: 'power3.out' }, el));
  // a lista troca sozinha uma vez, para mostrar que é interativa
  ScrollTrigger.create({ trigger: '.list-card', start: 'top 55%', once: true, onEnter: () => setTimeout(() => { if (mode === 'r') { setMode('a', true); setTimeout(() => setMode('r', true), 1800); } }, 600) });
  addEventListener('load', () => ScrollTrigger.refresh());
  let rh = 0, rt; new ResizeObserver(() => { const h = document.body.scrollHeight; if (Math.abs(h - rh) < 2) return; rh = h; clearTimeout(rt); rt = setTimeout(() => ScrollTrigger.refresh(), 250); }).observe(document.body);
})();
