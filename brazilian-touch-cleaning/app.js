(() => {
  const C = window.BT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  /* Orçamento: 3 toques e a mensagem pronta no SMS */
  const form = $('#quote');
  const send = $('#send');
  const bubble = $('#bubble');
  const townIn = $('#townIn');
  let last = {};
  const val = n => { const el = form.querySelector(`input[name="${n}"]:checked`); return el ? el.value : null; };
  function fields() {
    let town = val('town');
    if (town === '__other') town = townIn.value.trim() || null;
    return [[C.msg.kind, val('kind')], [C.msg.size, val('size')], [C.msg.town, town]].filter(([, v]) => v);
  }
  function render() {
    const f = fields();
    const text = [C.msg.hi, ...(f.length ? ['', ...f.map(([k, v]) => `• ${k}: ${v}`)] : []), '', C.msg.from].join('\n');
    bubble.innerHTML = [esc(C.msg.hi), ...(f.length ? ['', ...f.map(([k, v]) => `• ${esc(k)}: <mark${last[k] !== v ? ' class="flash"' : ''}>${esc(v)}</mark>`)] : ['', `<span style="opacity:.75">${esc(C.msg.pick)}</span>`]), '', esc(C.msg.from)].join('\n');
    last = Object.fromEntries(f);
    send.href = `sms:${C.tel}?&body=${encodeURIComponent(text)}`;
    send.dataset.ready = f.length === 3 ? '1' : '0';
  }
  form.addEventListener('change', e => {
    if (e.target.name === 'town') { townIn.hidden = e.target.value !== '__other'; if (!townIn.hidden) townIn.focus(); }
    render();
  });
  townIn.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();

  /* Teste da luva branca: o pó sai com o dedo ou o mouse */
  const wipe = $('#wipe');
  const cv = $('#dust');
  const ctx = cv.getContext('2d');
  const glove = $('#glove');
  const hint = $('#wipeHint');
  const done = $('#wipeDone');
  const meter = $('#meter');
  const GX = 24, GY = 24;
  let grid, cleared, finished, touched, W, H, dpr;
  function dust() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(168,156,136,.84)'); g.addColorStop(1, 'rgba(140,128,110,.88)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // grãos e fiapos
    let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < W * H / 60; i++) { ctx.fillStyle = `rgba(${rnd() > .5 ? '255,248,235' : '90,78,60'},${(.08 + rnd() * .22).toFixed(2)})`; ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2.4, 1 + rnd() * 2.4); }
    ctx.strokeStyle = 'rgba(80,70,55,.25)'; ctx.lineWidth = 1;
    for (let i = 0; i < 26; i++) { const x = rnd() * W, y = rnd() * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + rnd() * 30 - 15, y + rnd() * 30 - 15, x + rnd() * 40 - 20, y + rnd() * 40 - 20); ctx.stroke(); }
    grid = new Uint8Array(GX * GY); cleared = 0; finished = false;
    cv.classList.remove('gone'); done.hidden = true; meter.style.width = '0%';
  }
  let lastPt = null;
  function rub(x, y) {
    const rad = Math.max(34, W * 0.075);
    ctx.globalCompositeOperation = 'destination-out';
    const pts = [];
    if (lastPt) { const dx = x - lastPt[0], dy = y - lastPt[1]; const n = Math.ceil(Math.hypot(dx, dy) / 8); for (let i = 1; i <= n; i++) pts.push([lastPt[0] + dx * i / n, lastPt[1] + dy * i / n]); } else pts.push([x, y]);
    for (const [px, py] of pts) {
      const g = ctx.createRadialGradient(px, py, rad * .2, px, py, rad);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
      const cx0 = Math.floor((px - rad * .7) / W * GX), cx1 = Math.floor((px + rad * .7) / W * GX), cy0 = Math.floor((py - rad * .7) / H * GY), cy1 = Math.floor((py + rad * .7) / H * GY);
      for (let gx = Math.max(0, cx0); gx <= Math.min(GX - 1, cx1); gx++) for (let gy = Math.max(0, cy0); gy <= Math.min(GY - 1, cy1); gy++) { const k = gy * GX + gx; if (!grid[k]) { grid[k] = 1; cleared++; } }
    }
    lastPt = [x, y];
    const pct = cleared / (GX * GY);
    meter.style.width = Math.min(100, pct / .62 * 100) + '%';
    if (!finished && pct > .62) finish();
  }
  function finish() {
    finished = true; cv.classList.add('gone'); glove.classList.remove('on'); done.hidden = false; hint.classList.add('off');
    if (window.gsap && !reduce) gsap.from(done, { y: 20, opacity: 0, duration: .5, ease: 'back.out(2)' });
  }
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function move(e) {
    if (finished) return;
    const [x, y] = pos(e);
    glove.style.transform = `translate(${x}px, ${y}px)`;
    if (e.pointerType === 'mouse' || e.buttons || e.pointerType === 'touch') {
      if (!touched) { touched = true; hint.classList.add('off'); glove.classList.add('on'); }
      rub(x, y);
    }
  }
  cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerdown', e => { lastPt = null; move(e); });
  cv.addEventListener('pointerleave', () => { lastPt = null; glove.classList.remove('on'); touched = false; });
  $('#redust').addEventListener('click', () => { dust(); hint.classList.remove('off'); lastPt = null; touched = false; autoWipe(); });
  // Uma passada automática mostra o gesto quando a foto aparece.
  let autoDone = false;
  function autoWipe() {
    if (reduce || !window.gsap) return;
    const o = { t: 0 };
    lastPt = null;
    glove.classList.add('on');
    gsap.to(o, { t: 1, duration: 1.6, ease: 'power1.inOut', delay: .3, onUpdate() {
      if (touched && o.t > 0) return;
      const x = W * (.12 + .76 * o.t), y = H * (.32 + Math.sin(o.t * Math.PI * 2) * .1);
      glove.style.transform = `translate(${x}px, ${y}px)`; rub(x, y);
    }, onComplete() { if (!touched) glove.classList.remove('on'); lastPt = null; } });
  }
  dust();
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (Math.abs(cv.getBoundingClientRect().width - W) > 40) dust(); }, 200); });
  new IntersectionObserver((en, ob) => { if (en[0].isIntersecting && !autoDone) { autoDone = true; autoWipe(); ob.disconnect(); } }, { threshold: .55 }).observe(wipe);

  /* Relógio do horário (hora de Everett) */
  const fmtT = m => {
    const h = Math.floor(m / 60), mm = m % 60;
    if (C.lang === 'pt') return `${h}h${mm ? String(mm).padStart(2, '0') : ''}`;
    const hh = h % 12 || 12; return `${hh}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`;
  };
  function nowET() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + +p.minute };
  }
  const arcPath = (a, b) => {
    const pt = m => { const ang = (m / 1440) * Math.PI * 2 - Math.PI / 2; return [(160 + Math.cos(ang) * 150).toFixed(1), (160 + Math.sin(ang) * 150).toFixed(1)]; };
    const [x0, y0] = pt(a), [x1, y1] = pt(b);
    return `M${x0} ${y0}A150 150 0 ${b - a > 720 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const now = nowET();
  const st = $('#status');
  const [o, c] = C.hours[now.d];
  if (now.m >= o && now.m < c) { st.classList.add('open'); st.textContent = `${C.st.open} · ${C.st.closes} ${fmtT(c)}`; }
  else { const nd = now.m < o ? now.d : (now.d + 1) % 7; st.textContent = `${C.st.closed} · ${C.st.opens} ${fmtT(C.hours[nd][0])}${nd !== now.d ? ' ' + C.st.tomorrow : ''}`; }
  st.title = C.st.et;
  const hand = $('#dHand');
  hand.style.transform = `rotate(${(now.m / 1440) * 360}deg)`;
  const btns = $$('.days button');
  function day(d) {
    btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === d)));
    const [a, b] = C.hours[d];
    $('#dArc').setAttribute('d', arcPath(a, b));
    $('#dDay').textContent = C.days[d];
    $('#dRange').textContent = `${fmtT(a)} – ${fmtT(b)}`;
  }
  btns.forEach((b, i) => b.addEventListener('click', () => day(i)));
  day(now.d);

  /* Rolagem, cabeçalho e dock */
  const hd = $('#hd');
  const dock = $('.dock');
  const q = $('#quote');
  addEventListener('scroll', () => {
    hd.classList.toggle('scrolled', scrollY > 10);
    if (dock) { const r = q.getBoundingClientRect(); dock.classList.toggle('hide', r.bottom > 0 && r.top < innerHeight * .9); }
  }, { passive: true });
  if (dock) { const r = q.getBoundingClientRect(); dock.classList.toggle('hide', r.bottom > 0 && r.top < innerHeight * .9); }

  /* Passeio: marca cada cômodo como pronto */
  const cards = $$('.tour-card');
  const tourN = $('#tourN');
  const mark = i => { cards.forEach((c, k) => { if (k <= i) c.classList.add('done'); }); tourN.textContent = String(i + 1).padStart(2, '0'); };

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  let lenis;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .11 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70 }); } }));
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('#tourTrack');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: {
      trigger: '#tour', pin: '.tour-pin', start: 'top top', end: () => '+=' + dist(), scrub: reduce ? true : .6, invalidateOnRefresh: true,
      onUpdate(s) { const mid = innerWidth * .62; let best = 0; cards.forEach((c, i) => { if (c.getBoundingClientRect().left < mid) best = i; }); mark(best); },
    } });
    return () => tw.kill();
  });
  mm.add('(max-width: 900px)', () => {
    const track = $('#tourTrack');
    const io = new IntersectionObserver(en => en.forEach(e => { if (e.isIntersecting) mark(+e.target.dataset.i); }), { root: track, threshold: .6 });
    cards.forEach(c => io.observe(c));
    return () => io.disconnect();
  });

  if (reduce) return;
  gsap.from('.hero .h1, .hero .proof, .hero .kick', { y: 30, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out' });
  $$('.svc-card, .steps li, .rq, .faq details, .rv-score').forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  gsap.from('.dial svg', { rotate: -90, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.dial', start: 'top 80%' } });
  gsap.fromTo('.end-ph img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.end', start: 'top bottom', end: 'bottom bottom', scrub: true } });
})();
