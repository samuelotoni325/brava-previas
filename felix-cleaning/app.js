(() => {
  const C = window.FELIX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!window.gsap && !reduce;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  // Idioma: mantém a seção atual ao trocar EN/PT
  $$('.lang').forEach((a) => a.addEventListener('click', (e) => {
    if (!location.hash) return;
    e.preventDefault();
    location.href = a.getAttribute('href') + location.hash;
  }));

  // Cabeçalho com linha ao rolar
  const top = $('.top');
  const onScroll = () => top.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Hero: o rodo limpa a névoa da foto
  const arch = $('.arch');
  if (arch) requestAnimationFrame(() => arch.classList.add('wiped'));

  // ---------- Orçamento em 3 toques ----------
  const form = $('#quote');
  const panes = $$('.pane', form);
  const tabs = $$('.wiz-tabs button', form);
  const bubble = $('#bubble');
  const send = $('#send');
  const other = $('#other');
  const offer = $('#offer');
  let step = 0;
  let last = {};

  function go(n) {
    step = Math.max(0, Math.min(2, n));
    panes.forEach((p, i) => p.classList.toggle('is-on', i === step));
    tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === step)); t.classList.toggle('done', i < step); });
  }
  tabs.forEach((t) => t.addEventListener('click', () => go(+t.dataset.go)));

  const val = (n) => { const el = form.querySelector(`input[name="${n}"]:checked`); return el ? el.value : null; };

  function syncKind() {
    const kind = form.querySelector('input[name="svc"]:checked').closest('.chip').dataset.kind;
    const chips = $$('.chip[data-for]', form);
    chips.forEach((c) => { c.hidden = c.dataset.for !== kind; });
    const cur = form.querySelector('input[name="size"]:checked');
    if (!cur || cur.closest('.chip').hidden) {
      const first = chips.find((c) => !c.hidden);
      const pick = kind === 'home' ? chips.filter((c) => !c.hidden)[2] || first : first;
      pick.querySelector('input').checked = true;
    }
  }

  function fields() {
    let city = val('city');
    if (city === '__other') city = other.value.trim() || null;
    const f = [[C.msg.svc, val('svc')], [C.msg.size, val('size')], [C.msg.freq, val('freq')], [C.msg.city, city]];
    if (offer.checked) f.push([C.msg.offer, C.msg.offerV]);
    return f.filter(([, v]) => v);
  }
  const text = (f) => [C.msg.hi, '', ...f.map(([k, v]) => `• ${k}: ${v}`), '', C.msg.from].join('\n');
  const escH = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  function render() {
    const f = fields();
    bubble.innerHTML = [escH(C.msg.hi), '', ...f.map(([k, v]) => `• ${escH(k)}: <mark${last[k] !== undefined && last[k] !== v ? ' class="flash"' : ''}>${escH(v)}</mark>`), '', escH(C.msg.from)].join('\n');
    last = Object.fromEntries(f);
    send.href = `https://wa.me/${C.wa}?text=${encodeURIComponent(text(f))}`;
  }

  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'svc') { syncKind(); go(1); }
    else if (t.name === 'size') { /* fica na etapa 2 para a frequência */ }
    else if (t.name === 'freq') go(2);
    else if (t.name === 'city') {
      other.hidden = t.value !== '__other';
      if (!other.hidden) other.focus();
    }
    if (t === offer) syncCoupon();
    render();
  });
  form.addEventListener('input', render);
  syncKind(); render();

  // Plaquinhas: "Orçar este" escolhe o serviço e sobe para o orçamento
  $$('.hg-btn').forEach((b) => b.addEventListener('click', () => {
    const input = $$('input[name="svc"]', form).find((i) => i.value === b.dataset.pick);
    if (input) { input.checked = true; syncKind(); render(); go(1); }
    form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }));

  // ---------- Cupom de 20%: destacar aplica na mensagem ----------
  const coupon = $('#coupon');
  const tear = $('#tear');
  const done = $('#cp-done');
  function syncCoupon() {
    coupon.classList.toggle('torn', offer.checked);
    done.hidden = !offer.checked;
  }
  function apply() {
    if (offer.checked) return;
    offer.checked = true; syncCoupon(); render();
    const lab = offer.closest('.wiz-offer'); lab.classList.remove('pop'); void lab.offsetWidth; lab.classList.add('pop');
  }
  tear.addEventListener('click', apply);
  // arrastar o canhoto também destaca
  let sx = null;
  tear.addEventListener('pointerdown', (e) => { sx = [e.clientX, e.clientY]; });
  tear.addEventListener('pointermove', (e) => {
    if (!sx) return;
    const d = Math.hypot(e.clientX - sx[0], e.clientY - sx[1]);
    if (d > 6) tear.style.transform = `rotate(${Math.min(d / 6, 12)}deg)`;
    if (d > 70) { sx = null; tear.style.transform = ''; apply(); }
  });
  addEventListener('pointerup', () => { sx = null; tear.style.transform = ''; });

  // ---------- Esfregar o fogão ----------
  const frame = $('#scrubFrame');
  const cv = $('#scrubCanvas');
  const sponge = $('#sponge');
  const fill = $('#meterFill');
  const mtxt = $('#meterTxt');
  const ctx = cv.getContext('2d');
  const before = new Image();
  let ready = false, cleaned = false, lastPt = null, brush = 50;
  before.src = (document.documentElement.lang === 'en' ? '' : '../') + 'img/stove-before.webp';

  function sizeCanvas() {
    const r = frame.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    brush = Math.max(34, r.width * 0.09) * dpr;
    if (cleaned) return;
    ctx.globalCompositeOperation = 'source-over';
    // cobre o quadro como object-fit: cover
    const s = Math.max(cv.width / before.naturalWidth, cv.height / before.naturalHeight);
    const w = before.naturalWidth * s, h = before.naturalHeight * s;
    ctx.drawImage(before, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
    ready = true; measure();
  }
  before.onload = () => { sizeCanvas(); };
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!cleaned) sizeCanvas(); }, 200); });

  function pt(e) { const r = cv.getBoundingClientRect(); const k = cv.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; }
  function rub(a, b) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = brush;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  let mt = 0;
  function measure() {
    if (!ready) return 0;
    const step = 12;
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let clear = 0, n = 0;
    for (let y = 0; y < cv.height; y += step) for (let x = 0; x < cv.width; x += step) { n++; if (d[(y * cv.width + x) * 4 + 3] < 40) clear++; }
    const p = Math.round((clear / n) * 100);
    fill.style.width = p + '%'; mtxt.textContent = p + '% ' + C.pct;
    return p;
  }
  function finish() {
    if (cleaned) return;
    cleaned = true; frame.classList.add('clean');
    fill.style.width = '100%'; mtxt.textContent = '100% ' + C.pct;
    if (!reduce) for (let i = 0; i < 9; i++) setTimeout(() => sparkle(), i * 110);
  }
  function sparkle() {
    const s = document.createElement('span');
    s.className = 'sparkle'; s.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1c.6 5.3 2.7 8.4 9 11-6.3 2.6-8.4 5.7-9 11-.6-5.3-2.7-8.4-9-11 6.3-2.6 8.4-5.7 9-11Z"/></svg>';
    s.style.left = 10 + Math.random() * 80 + '%'; s.style.top = 15 + Math.random() * 70 + '%';
    frame.appendChild(s); setTimeout(() => s.remove(), 1300);
  }
  cv.addEventListener('pointerdown', (e) => { if (!ready || cleaned) return; lastPt = pt(e); rub(lastPt, lastPt); });
  cv.addEventListener('pointermove', (e) => {
    const r = frame.getBoundingClientRect();
    sponge.style.transform = `translate(${e.clientX - r.left - 43}px, ${e.clientY - r.top - 30}px) rotate(-12deg)`;
    if (!ready || cleaned) return;
    // mouse: esfrega só passando por cima; toque/caneta: enquanto encosta
    if (e.pointerType === 'mouse' || lastPt) {
      const p = pt(e);
      if (lastPt) rub(lastPt, p);
      lastPt = p;
      const now = performance.now();
      if (now - mt > 160) { mt = now; if (measure() >= 62) finish(); }
    }
  });
  const stop = () => { if (lastPt && !cleaned && measure() >= 62) finish(); lastPt = null; };
  cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
  cv.addEventListener('pointerleave', () => { frame.classList.remove('hovering'); if (lastPt && !cleaned) stop(); });
  cv.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') frame.classList.add('hovering'); });

  $('#scrubAll').addEventListener('click', () => {
    if (cleaned || !ready) { finish(); return; }
    if (reduce) { finish(); return; }
    // passadas automáticas em zigue-zague
    const W = cv.width, H = cv.height, rows = 7;
    let i = 0;
    const pts = [];
    for (let r = 0; r <= rows; r++) { const y = (H * (r + 0.5)) / (rows + 1); pts.push(r % 2 ? [W * 1.05, y] : [-W * 0.05, y]); }
    let prev = [pts[0][0], pts[0][1] - H / (rows + 1)];
    const tick = () => {
      if (i >= pts.length) { finish(); return; }
      rub(prev, pts[i]); prev = pts[i]; i++; measure();
      setTimeout(tick, 90);
    };
    tick();
  });

  // ---------- Telefone: as mensagens entram com os passos ----------
  const steps = $$('.how-steps li');
  const msgs = $$('#chat .msg');
  const showUpTo = (n) => { steps.forEach((s, i) => s.classList.toggle('on', i <= n)); msgs.forEach((m) => m.classList.toggle('show', +m.dataset.step <= n)); };
  if (reduce || !('IntersectionObserver' in window)) showUpTo(3);
  else {
    // a conversa acontece sozinha quando a seção aparece, um passo a cada 0,9 s
    showUpTo(-1);
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      [0, 1, 2, 3].forEach((n) => setTimeout(() => showUpTo(n), 250 + n * 900));
    }), { threshold: 0.35 });
    io.observe($('.how'));
  }

  // ---------- Horário: aberto agora (fuso da Flórida) ----------
  const openNow = $('#openNow');
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    const h = (+parts.hour % 24) + +parts.minute / 60;
    const today = C.hours.find((x) => x.d.includes(day));
    const isOpen = today && h >= today.o && h < today.c;
    openNow.classList.toggle('is-open', !!isOpen);
    openNow.lastElementChild.textContent = isOpen ? C.open : C.closed;
    $$('.hours li[data-days]').forEach((li) => li.classList.toggle('today', li.dataset.days.split(',').map(Number).includes(day)));
  } catch { /* mantém o rótulo "Horário" */ }

  // ---------- Barra fixa do celular some quando o orçamento está na tela ----------
  const dock = $('.dock');
  if (dock && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      dock.classList.toggle('away', seen.size > 0);
    }, { threshold: 0.15 });
    [form, $('.final')].forEach((el) => el && io.observe(el));
  }

  // ---------- Movimento ----------
  if (hasGsap && window.ScrollTrigger) {
    gsap.from('.hero-copy > *', { y: 24, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out' });
    gsap.from('.wiz', { y: 30, opacity: 0, duration: 1, delay: .2, ease: 'power3.out' });
    gsap.from('.coupon', { scrollTrigger: { trigger: '.coupon-sec', start: 'top 80%' }, rotate: -3, y: 60, opacity: 0, duration: 1, ease: 'back.out(1.4)' });
    // plaquinhas caem no gancho e balançam
    $$('.hanger .hg').forEach((hg, i) => {
      gsap.fromTo(hg, { y: -60, rotate: i % 2 ? 9 : -9, opacity: 0 }, { scrollTrigger: { trigger: hg, start: 'top 88%' }, y: 0, rotate: 0, opacity: 1, duration: 1.6, delay: (i % 3) * .12, ease: 'elastic.out(1, .45)' });
    });
    gsap.utils.toArray('.gal-i').forEach((g) => {
      ScrollTrigger.create({ trigger: g, start: 'top 75%', once: true, onEnter: () => g.classList.add('shine') });
      gsap.from(g, { scrollTrigger: { trigger: g, start: 'top 92%' }, y: 40, opacity: 0, duration: .9, ease: 'power3.out' });
    });
    gsap.from('.rv', { scrollTrigger: { trigger: '.rv-list', start: 'top 85%' }, y: 30, opacity: 0, duration: .8, stagger: .07, ease: 'power3.out' });
    gsap.from('.rv-feature blockquote', { scrollTrigger: { trigger: '.rv-head', start: 'top 80%' }, y: 30, opacity: 0, duration: 1, ease: 'power3.out' });
    gsap.from('.score-n', { scrollTrigger: { trigger: '.rv-head', start: 'top 80%' }, scale: .6, opacity: 0, duration: 1, ease: 'back.out(1.6)' });
    gsap.from('.cities li', { scrollTrigger: { trigger: '.cities', start: 'top 88%' }, y: 16, opacity: 0, stagger: .08, duration: .6 });
    gsap.from('.final h2', { scrollTrigger: { trigger: '.final', start: 'top 80%' }, y: 40, opacity: 0, duration: 1, ease: 'power3.out' });
  }
})();
