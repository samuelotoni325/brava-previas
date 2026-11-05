(() => {
  const C = window.SARTES;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 760px)').matches;
  const G = window.gsap && window.ScrollTrigger && !reduce;
  if (G) gsap.registerPlugin(ScrollTrigger);

  // Idioma preservando a seção
  $$('.lang').forEach((a) => a.addEventListener('click', (e) => {
    if (!location.hash) return;
    e.preventDefault(); location.href = a.getAttribute('href') + location.hash;
  }));

  // Vídeo do hero: carrega só depois da página, versão vertical no celular
  const vid = $('#heroVid');
  if (vid && !reduce) {
    const go = () => { vid.src = small ? vid.dataset.srcM : vid.dataset.src; vid.load(); vid.play().catch(() => {}); };
    if (document.readyState === 'complete') setTimeout(go, 300); else addEventListener('load', () => setTimeout(go, 300));
    document.addEventListener('visibilitychange', () => (document.hidden ? vid.pause() : vid.play().catch(() => {})));
  }

  // ---------- Orçamento por SMS ----------
  const form = $('#quote');
  const bubble = $('#bubble');
  const send = $('#send');
  const mail = $('#mail');
  const stepper = $('#stepper');
  const sizes = $('#sizes');
  const sizeL = $('#sizeL');
  const out = $('#stepsOut');
  const unsure = $('#stepsUnsure');
  const more = $('#moreCity');
  const other = $('#other');
  const path = $('#ms-path');
  let steps = 14;
  let last = {};
  const LABEL = C.lang === 'en'
    ? { steps: 'How many steps?', area: 'About how big?', rooms: 'How many rooms?', tile: 'Where is the tile going?' }
    : { steps: 'Quantos degraus?', area: 'Mais ou menos de que tamanho?', rooms: 'Quantos ambientes?', tile: 'Onde vai o porcelanato?' };

  const val = (n) => { const el = form.querySelector(`input[name="${n}"]:checked`); return el ? el.value : null; };
  const kind = () => C.jobs[val('job')] || 'area';

  function drawStair() {
    const n = Math.max(1, Math.min(30, steps));
    const w = 150 / n, h = 110 / n;
    let d = 'M5 115';
    for (let i = 0; i < n; i++) d += ` v-${h.toFixed(2)} h${w.toFixed(2)}`;
    d += ' V115 Z';
    path.setAttribute('d', d);
  }

  function syncKind() {
    const k = kind();
    sizeL.textContent = LABEL[k];
    stepper.hidden = k !== 'steps';
    sizes.hidden = k === 'steps';
    if (k !== 'steps') {
      const chips = $$('.chip[data-for]', sizes);
      chips.forEach((c) => { c.hidden = c.dataset.for !== k; });
      const cur = form.querySelector('input[name="size"]:checked');
      if (!cur || cur.closest('.chip').hidden) {
        $$('input[name="size"]', sizes).forEach((i) => { i.checked = false; });
        const vis = chips.filter((c) => !c.hidden);
        (vis[k === 'area' ? 1 : 0] || vis[0]).querySelector('input').checked = true;
      }
    }
  }

  function city() {
    if (more.value === '__other') return other.value.trim() || null;
    if (more.value) return more.value;
    return val('city');
  }
  function fields() {
    const k = kind();
    const size = k === 'steps' ? (unsure.checked ? C.unsure : `${steps} ${C.msg.steps}`) : val('size');
    return [[C.msg.job, val('job')], [C.msg.size, size], [C.msg.city, city()]].filter(([, v]) => v);
  }
  const text = (f) => [C.msg.hi, '', ...f.map(([k, v]) => `• ${k}: ${v}`), '', C.msg.from].join('\n');
  const escH = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  function render() {
    const f = fields();
    bubble.innerHTML = [escH(C.msg.hi), '', ...f.map(([k, v]) => `• ${escH(k)}: <mark${last[k] !== undefined && last[k] !== v ? ' class="flash"' : ''}>${escH(v)}</mark>`), '', escH(C.msg.from)].join('\n');
    last = Object.fromEntries(f);
    const body = encodeURIComponent(text(f));
    send.href = `sms:${C.tel}?&body=${body}`;
    mail.href = `mailto:${C.email}?subject=${encodeURIComponent(C.msg.subj)}&body=${body}`;
  }

  $$('.st-b', stepper).forEach((b) => b.addEventListener('click', () => {
    steps = Math.max(1, Math.min(30, steps + +b.dataset.d));
    out.textContent = steps; unsure.checked = false; stepper.classList.remove('off');
    drawStair(); render();
  }));
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'job') syncKind();
    if (t === unsure) stepper.classList.toggle('off', unsure.checked);
    if (t.name === 'city') { more.value = ''; more.classList.remove('on'); other.hidden = true; }
    if (t === more) {
      more.classList.toggle('on', !!more.value);
      other.hidden = more.value !== '__other';
      if (more.value) $$('input[name="city"]', form).forEach((i) => { i.checked = false; });
      if (!other.hidden) other.focus();
      if (!more.value && !val('city')) form.querySelector('input[name="city"]').checked = true;
    }
    render();
  });
  form.addEventListener('input', render);
  syncKind(); drawStair(); render();

  // ---------- A escada de serviços ----------
  const img = $('#svcImg');
  const cap = $('#svcCap');
  const base = img.getAttribute('src').replace(/[^/]+$/, '');
  $$('.tread button').forEach((b, i) => b.addEventListener('click', () => {
    $$('.tread button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    img.classList.add('swap');
    const pre = new Image();
    pre.onload = () => { img.src = pre.src; img.width = +b.dataset.w; img.height = +b.dataset.h; img.classList.remove('swap'); };
    pre.src = base + b.dataset.img + '.webp';
    cap.textContent = `${String(i + 1).padStart(2, '0')} · ${b.querySelector('.tr-t').textContent}`;
    if (small) $('.svc-ph').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }));

  // ---------- Espinha de peixe, régua por régua ----------
  const stage = $('.hb-stage');
  const planks = $$('.hb-svg .pl');
  const hbN = $('#hbN');
  $('#hbT').textContent = planks.length;
  let shown = 0;
  function lay(n) {
    n = Math.max(0, Math.min(planks.length, Math.round(n)));
    if (n === shown) return;
    if (n > shown) for (let i = shown; i < n; i++) planks[i].classList.add('on');
    else for (let i = n; i < shown; i++) planks[i].classList.remove('on');
    shown = n; hbN.textContent = n;
  }
  if (reduce) { lay(planks.length); stage.classList.add('done'); }
  else if (G && !small) {
    ScrollTrigger.create({
      trigger: stage, start: 'top 85%', end: 'bottom 30%', scrub: true,
      // só avança: depois de assentado, o piso fica pronto
      onUpdate: (st) => { lay(Math.max(shown, st.progress * 1.3 * planks.length)); if (st.progress > 0.9) stage.classList.add('done'); },
    });
  } else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io.disconnect();
      let n = 0;
      const t = setInterval(() => { n += 6; lay(n); if (n >= planks.length) { clearInterval(t); setTimeout(() => stage.classList.add('done'), 600); } }, 40);
    }), { threshold: 0.4 });
    io.observe(stage);
  }

  // ---------- Camadas do processo se abrem ----------
  const stack = $('#stack');
  if (reduce || !('IntersectionObserver' in window)) stack.classList.add('open');
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { stack.classList.add('open'); io.disconnect(); } }), { threshold: 0.45 });
    io.observe(stack);
  }

  // ---------- Escada antes e depois: vira o cartão ----------
  const flipper = $('#flipper');
  const flipBtn = $('#flipBtn');
  const lab = flipBtn.querySelector('span');
  const flip = () => {
    const on = flipper.classList.toggle('on');
    flipBtn.setAttribute('aria-pressed', String(on));
    lab.textContent = on ? lab.dataset.b : lab.dataset.a;
  };
  flipBtn.addEventListener('click', flip);
  flipper.addEventListener('click', flip);

  // ---------- Filtro das obras ----------
  const grid = $('#wkGrid');
  const count = $('#wkCount');
  const items = $$('.wk', grid);
  const COUNT = C.lang === 'en' ? (n) => `${n} projects` : (n) => `${n} obras`;
  function filter(f) {
    let n = 0;
    items.forEach((it) => { const on = f === 'all' || it.dataset.c === f; it.classList.toggle('out', !on); if (on) n++; });
    count.textContent = COUNT(n);
  }
  $$('.filters button').forEach((b) => b.addEventListener('click', () => {
    $$('.filters button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    filter(b.dataset.f);
    if (G) gsap.fromTo(items.filter((i) => !i.classList.contains('out')), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .04 });
  }));
  filter('all');

  // ---------- Barra fixa do celular ----------
  const dock = $('.dock');
  if (dock && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      dock.classList.toggle('away', seen.size > 0);
    }, { threshold: 0.12 });
    [form, $('.end')].forEach((el) => io.observe(el));
  }

  // ---------- Movimento ----------
  if (G) {
    gsap.from('.hero-copy > *', { y: 30, opacity: 0, duration: 1, stagger: .09, ease: 'power3.out' });
    gsap.from('.ticket', { y: 40, opacity: 0, duration: 1, delay: .15, ease: 'power3.out' });
    gsap.from('.steps-edge i', { scaleY: 0, transformOrigin: '50% 100%', duration: .8, stagger: .05, delay: .3, ease: 'power2.out' });
    gsap.from('.tread', { scrollTrigger: { trigger: '.flight', start: 'top 80%' }, x: -40, opacity: 0, duration: .6, stagger: .06, ease: 'power2.out' });
    gsap.from('.rv-c', { scrollTrigger: { trigger: '.rv-list', start: 'top 85%' }, y: 40, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out' });
    gsap.from('.story li', { scrollTrigger: { trigger: '.story', start: 'top 85%' }, x: -30, opacity: 0, duration: .6, stagger: .1 });
    gsap.from('.corridor li', { scrollTrigger: { trigger: '.corridor', start: 'top 85%' }, x: -16, opacity: 0, duration: .45, stagger: .04 });
    gsap.from('.wk', { scrollTrigger: { trigger: '.wk-grid', start: 'top 85%' }, y: 30, opacity: 0, duration: .7, stagger: .04 });
  }
})();
