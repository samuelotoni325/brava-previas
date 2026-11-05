(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const EN = main.dataset.lang === 'en';
  const T = (a, b) => (EN ? a : b);
  const TEL = main.dataset.tel;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cabeçalho e barra fixa do celular
  const hd = $('#hd'), dock = $('.dock');
  addEventListener('scroll', () => hd.classList.toggle('solid', scrollY > 20), { passive: true });
  const hidden = new Set();
  const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? hidden.add(e.target) : hidden.delete(e.target)); dock.classList.toggle('away', hidden.size > 0); }, { threshold: .15 });
  ['#qt-hero', '#cta'].forEach(s => $(s) && io.observe($(s)));

  // Orçamento em 3 toques: monta o SMS real para a Andreia
  const f = $('#qt-hero');
  const sms = $('.qt-sms', f), hint = $('.qt-hint', f), msg = $('.qt-msg', f), otherBox = $('.city-other', f);
  const baseHint = hint.textContent;
  const picked = n => f.querySelector(`input[name="${n}"]:checked`);
  const val = n => (f.elements[n]?.value || '').trim();
  const text = () => {
    const s = picked('svc'), fr = picked('freq'), c = picked('city'), z = picked('size');
    const city = c ? (c.value === 'other' ? val('cityOther') || T('other town', 'outra cidade') : c.value) : '';
    const rows = [
      s && [T('Service', 'Serviço'), s.value],
      fr && [T('Frequency', 'Frequência'), fr.value],
      city && [T('City', 'Cidade'), city],
      z && [T('Home', 'Imóvel'), z.value],
      val('name') && [T('Name', 'Nome'), val('name')],
    ].filter(Boolean);
    return [T("Hi Andreia! I'd like a free estimate.", 'Oi, Andreia! Quero um orçamento grátis.'), '', ...rows.map(([k, v]) => `• ${k}: ${v}`), '', T('Sent from your website.', 'Enviado pelo site.')].join('\n');
  };
  const update = () => {
    const s = picked('svc'), c = picked('city');
    otherBox.hidden = !(c && c.value === 'other');
    const t = text();
    sms.href = `sms:${TEL}?&body=${encodeURIComponent(t)}`;
    msg.textContent = t;
    f.classList.toggle('ready', !!s);
    hint.classList.remove('err');
    if (!s) hint.textContent = baseHint;
    else if (!picked('freq')) hint.textContent = T('Now, how often?', 'Agora, com que frequência?');
    else if (!c) hint.textContent = T('Last one: where?', 'Por último: onde?');
    else hint.textContent = T('Ready. Tap “Text Andreia” and hit send.', 'Pronto. Toque em “Mandar SMS” e envie.');
    $$('.spot, .area-pick').forEach(b => b.classList.toggle('on', !!c && b.dataset.city === c.value));
  };
  f.addEventListener('change', e => {
    if (e.target.name === 'svc' && e.target.dataset.id === 'move' && !picked('freq')) f.querySelector('input[name="freq"][data-id="once"]').checked = true;
    update();
  });
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
  const goForm = () => { const el = $('#estimate'); if (lenis) lenis.scrollTo(el, { offset: -80 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  const choose = (name, id) => { const r = f.querySelector(`input[name="${name}"][data-id="${id}"]`); if (r) { r.checked = true; f.dispatchEvent(new Event('change')); } };
  $$('.sv-pick').forEach(b => b.addEventListener('click', () => { choose('svc', b.dataset.pick); goForm(); }));
  $$('.spot, .area-pick').forEach(b => b.addEventListener('click', () => { choose('city', b.dataset.city); goForm(); }));

  // Momento: o dia do outro lado do rio
  const day = $('#day');
  const sky = { d: $('.sky-d', day), e: $('.sky-e', day) }, sun = $('.sun', day), sunC = $('.sun circle', day);
  const hh = $('.clock .hh', day), mh = $('.clock .mh', day), timeEl = $('.day-time', day), items = $$('.day-list li', day), skyline = $('.skyline', day);
  const ramp = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  let lastIdx = -1;
  const STEP_MINS = [490, 630, 735, 880, 980, 1085];
  const setDay = p => {
    const mins = 490 + Math.min(1, p / .9) * (1085 - 490);
    const h = Math.floor(mins / 60), m = Math.floor(mins % 60);
    hh.style.transform = `rotate(${(h % 12) * 30 + m * .5}deg)`;
    mh.style.transform = `rotate(${m * 6}deg)`;
    timeEl.textContent = `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    sky.d.style.opacity = ramp(p, .12, .35);
    sky.e.style.opacity = ramp(p, .62, .95);
    sun.setAttribute('transform', `translate(${110 + p * 380} ${360 - Math.sin(Math.PI * Math.min(1, p * 1.05)) * 220})`);
    sunC.style.fill = p > .75 ? '#ffb27a' : '#ffe9a3';
    skyline.style.fill = p > .8 ? '#1d1029' : '#4a3a5e';
    const idx = STEP_MINS.reduce((k, v, i) => (mins >= v ? i : k), 0);
    if (idx !== lastIdx) { lastIdx = idx; items.forEach((li, i) => { li.classList.toggle('on', i === idx); li.classList.toggle('done', i < idx); }); }
  };
  setDay(reduce ? .55 : 0);
  if (reduce) items.forEach(li => li.classList.add('on'));

  // Momento: as listras do aspirador no tapete
  const box = $('.rug-box'), cv = $('.rug-canvas'), pctEl = $('.rug-pct'), done = $('.rug-done'), autoBtn = $('.rug-auto');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, laneW = 40, light, dark, grid, cols, rows, covered = 0, finished = false;
  const mkPattern = (tone, fiber) => {
    const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext('2d'); g.scale(dpr, dpr); g.fillStyle = tone; g.fillRect(0, 0, W, H);
    g.strokeStyle = fiber; g.lineWidth = 1;
    for (let x = 0; x < W; x += 3) { g.globalAlpha = .25 + Math.random() * .35; g.beginPath(); g.moveTo(x + Math.random(), 0); g.lineTo(x + Math.random() * 2, H); g.stroke(); }
    g.globalAlpha = 1; return c;
  };
  const initRug = () => {
    const r = box.getBoundingClientRect();
    if (Math.abs(r.width - W) < 2 && W) return;
    W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // tapete sem aspirar: fibras desencontradas
    ctx.fillStyle = '#c9b99c'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 40; i++) { ctx.fillStyle = Math.random() > .5 ? 'rgba(120,96,64,.18)' : 'rgba(255,248,230,.22)'; const a = Math.random() * Math.PI; const x = Math.random() * W, y = Math.random() * H; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(0, 0, 6, 1.4); ctx.restore(); }
    laneW = Math.max(34, W / 9);
    light = mkPattern('#ddd0b4', 'rgba(255,255,255,.7)');
    dark = mkPattern('#b9a681', 'rgba(110,86,52,.5)');
    cols = Math.ceil(W / laneW); rows = Math.ceil(H / 14);
    grid = new Uint8Array(cols * rows); covered = 0; finished = false;
    done.hidden = true; box.classList.remove('used'); pctEl.textContent = '0';
  };
  const paint = (x, y) => {
    const lane = Math.floor(x / laneW); if (lane < 0 || lane >= cols) return;
    const lx = lane * laneW, y0 = Math.max(0, y - 22), h = Math.min(H, y + 22) - y0;
    const src = lane % 2 ? dark : light;
    ctx.drawImage(src, lx * dpr, y0 * dpr, laneW * dpr, h * dpr, lx, y0, laneW, h);
    for (let ry = Math.floor(y0 / 14); ry <= Math.min(rows - 1, Math.floor((y0 + h) / 14)); ry++) { const k = ry * cols + lane; if (!grid[k]) { grid[k] = 1; covered++; } }
    const pct = Math.round(covered / grid.length * 100);
    pctEl.textContent = pct;
    if (pct >= 62 && !finished) { finished = true; done.hidden = false; }
  };
  let last = null, drawing = false;
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const stroke = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(1, Math.ceil(d / 4)); for (let i = 0; i <= n; i++) paint(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n); };
  cv.addEventListener('pointerdown', e => { drawing = true; box.classList.add('used'); cv.setPointerCapture(e.pointerId); last = pos(e); paint(...last); });
  cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); stroke(last, p); last = p; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => cv.addEventListener(t, () => { drawing = false; }));
  const autoRun = instant => {
    box.classList.add('used');
    const lanes = cols, perLane = instant ? 0 : 520 / Math.max(1, lanes / 9);
    if (instant) { for (let l = 0; l < lanes; l++) for (let y = 0; y <= H; y += 8) paint(l * laneW + laneW / 2, y); return; }
    let t0 = null;
    const step = ts => {
      if (!t0) t0 = ts;
      const t = (ts - t0) / perLane, l = Math.floor(t);
      if (l >= lanes) return;
      const frac = t - l, y = (l % 2 ? 1 - frac : frac) * H;
      for (let k = 0; k <= 3; k++) paint(l * laneW + laneW / 2, Math.max(0, Math.min(H, y + (l % 2 ? k : -k) * 6)));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  autoBtn.addEventListener('click', () => { if (finished) { W = 0; initRug(); } autoRun(reduce); });
  initRug();
  if (reduce) autoRun(true);
  else new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect(); if (covered) return; let y = 0; const l = 1; const tick = () => { if (covered > rows * 2.5) return; paint(l * laneW + laneW / 2, y); paint(l * laneW + laneW / 2, y + 6); y += 9; if (y < H) requestAnimationFrame(tick); }; setTimeout(() => requestAnimationFrame(tick), 500); }, { threshold: .6 }).observe(box);
  new ResizeObserver(() => initRug()).observe(box);

  // Momento: a cama
  const bedArt = $('.bed-art'), bedBtn = $('.bed-btn');
  const setBed = on => { bedArt.classList.toggle('is-made', on); bedBtn.setAttribute('aria-pressed', on); };
  bedBtn.addEventListener('click', () => setBed(bedBtn.getAttribute('aria-pressed') !== 'true'));
  if (reduce) setBed(true);
  else new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); setTimeout(() => { if (bedBtn.getAttribute('aria-pressed') !== 'true') setBed(true); }, 900); } }, { threshold: .6 }).observe(bedArt);

  // Marca-texto nas avaliações
  const hlIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); hlIO.unobserve(e.target); } }), { threshold: 1, rootMargin: '0px 0px -12% 0px' });
  $$('mark.hl').forEach(m => hlIO.observe(m));

  if (reduce || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ lerp: .11 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const el = $(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); lenis.scrollTo(el, { offset: -80 });
  }));

  // Entrada: o aviso balança na maçaneta
  gsap.from('.hero .h1 span', { yPercent: 40, opacity: 0, duration: 1.1, stagger: .12, ease: 'expo.out' });
  gsap.from('.eyebrow, .hero-sub, .proof', { y: 16, opacity: 0, duration: .9, stagger: .07, delay: .25, ease: 'power3.out' });
  if (innerWidth > 900) gsap.fromTo('.hanger', { rotate: -14, y: -30, opacity: 0 }, { rotate: -1.6, y: 0, opacity: 1, duration: 2, ease: 'elastic.out(1, .35)', delay: .2 });
  else gsap.from('.hanger', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', delay: .15 });
  gsap.from('.hero-bg', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut' });

  // O dia: fixado e controlado pela rolagem
  if (innerHeight >= 600) {
    day.classList.add('pinmode');
    ScrollTrigger.create({ trigger: day, start: 'top top', end: () => '+=' + innerHeight * 2.6, pin: true, scrub: true, onUpdate: s => setDay(s.progress) });
  } else {
    items.forEach(li => li.classList.add('on'));
    ScrollTrigger.create({ trigger: day, start: 'top 70%', end: 'bottom 30%', onUpdate: s => setDay(s.progress) });
  }

  // Entradas gerais
  $$('.sec-head, .sv, .wk, .rv, .area-pick, .fq, .rug-box, .bed-copy, .rv-head, .cta-in').forEach(el => gsap.from(el, { y: 34, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
  gsap.from('.spot', { y: -30, opacity: 0, duration: .8, stagger: .15, ease: 'bounce.out', scrollTrigger: { trigger: '.area-map', start: 'top 75%', once: true } });
  addEventListener('load', () => ScrollTrigger.refresh());
  let rh = 0, rt; new ResizeObserver(() => { const h = document.body.scrollHeight; if (Math.abs(h - rh) < 2) return; rh = h; clearTimeout(rt); rt = setTimeout(() => ScrollTrigger.refresh(), 250); }).observe(document.body);
})();
