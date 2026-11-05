(() => {
  const C = window.MD;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  /* Orçamento: 3 toques e a mensagem pronta no SMS */
  const form = $('#quote');
  const send = $('#send');
  const bubble = $('#bubble');
  const townIn = $('#townIn');
  const pets = $('#pets');
  const val = n => { const el = form.querySelector(`input[name="${n}"]:checked`); return el ? el.value : null; };
  function fields() {
    return [[C.msg.kind, val('kind')], [C.msg.freq, val('freq')], [C.msg.town, townIn.value.trim() ? `${townIn.value.trim()}, CT` : null], [C.msg.pets, pets.checked ? C.msg.petsYes : null]].filter(([, v]) => v);
  }
  function render() {
    const f = fields();
    const text = [C.msg.hi, ...(f.length ? ['', ...f.map(([k, v]) => `• ${k}: ${v}`)] : []), '', C.msg.from].join('\n');
    bubble.innerHTML = [esc(C.msg.hi), '', ...(f.length ? f.map(([k, v]) => `• ${esc(k)}: <mark>${esc(v)}</mark>`) : [`<span style="opacity:.8">${esc(C.msg.pick)}</span>`]), '', esc(C.msg.from)].join('\n');
    send.href = `sms:${C.tel}?&body=${encodeURIComponent(text)}`;
  }
  form.addEventListener('change', render);
  townIn.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();

  /* A família de frascos: toque e borrifa */
  $$('[data-bt]').forEach(b => {
    const go = () => { b.classList.remove('spray'); void b.getBoundingClientRect(); b.classList.add('spray'); };
    b.addEventListener('click', go);
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    b.addEventListener('animationend', e => { if (e.animationName === 'mist') b.classList.remove('spray'); });
  });
  if (!reduce) { let k = 0; const bts = $$('[data-bt]'); setInterval(() => { if (document.hidden) return; const b = bts[k++ % bts.length]; b.classList.add('spray'); }, 2600); }

  /* O cachorro */
  const dogBtn = $('#dogBtn');
  let dt; dogBtn.addEventListener('click', () => { dogBtn.classList.add('happy'); clearTimeout(dt); dt = setTimeout(() => dogBtn.classList.remove('happy'), 2200); });

  /* Horário: o sol anda de 8h às 17h (hora de Connecticut) */
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  const m = (+p.hour % 24) * 60 + +p.minute;
  const fmt = mm => { const h = Math.floor(mm / 60); return C.lang === 'pt' ? `${h}h` : `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`; };
  const today = C.hours[d];
  const open = today && m >= today[0] && m < today[1];
  const st = $('#status');
  const card = $('.sky-card');
  if (open) { st.classList.add('open'); st.textContent = `${C.st.open} · ${C.st.closes} ${fmt(today[1])}`; }
  else {
    let nd = d, first = true;
    if (!(today && m < today[0])) { do { nd = (nd + 1) % 7; } while (!C.hours[nd]); first = false; }
    const when = first ? '' : nd === (d + 1) % 7 ? ` ${C.st.tomorrow}` : ` (${C.days[nd]})`;
    st.textContent = `${C.st.closed} · ${C.st.opens} ${fmt(C.hours[nd][0])}${when}`;
    card.classList.add('night');
  }
  $$('.week li').forEach(li => li.classList.toggle('today', +li.dataset.d === d));
  const orb = $('#orb');
  const placeOrb = t => { // t de 0 a 1 ao longo do arco
    const a = Math.PI - t * Math.PI;
    const x = 200 + Math.cos(a) * 180, y = 170 - Math.sin(a) * 150;
    orb.style.left = (x / 400 * 100) + '%'; orb.style.top = (y / 180 * 100) + '%';
  };
  const tNow = open ? (m - today[0]) / (today[1] - today[0]) : .5;
  placeOrb(0);
  const skyIO = new IntersectionObserver(en => { if (en[0].isIntersecting) { placeOrb(tNow); skyIO.disconnect(); } }, { threshold: .4 });
  skyIO.observe(card);

  /* Destaques da avaliação e receita escrita */
  const rq = $('.rv-q');
  new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { rq.classList.add('lit'); ob.disconnect(); } }, { threshold: .3 }).observe(rq);
  const rc = $('#card');
  $$('li', rc).forEach((li, i) => li.style.setProperty('--n', i));
  new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { rc.classList.add('write'); ob.disconnect(); } }, { threshold: .35 }).observe(rc);

  /* Cabeçalho e dock */
  const hd = $('#hd');
  const dock = $('.dock');
  const dockUpd = () => { const r = form.getBoundingClientRect(); dock.classList.toggle('hide', r.bottom > 0 && r.top < innerHeight * .9); };
  addEventListener('scroll', () => { hd.classList.toggle('scrolled', scrollY > 10); dockUpd(); }, { passive: true });
  dockUpd();

  /* A porta abre com a rolagem */
  const sec = $('.door-sec');
  const leaf = $('#doorLeaf');
  const setDoor = v => { leaf.style.setProperty('--open', `${-v * 108}deg`); sec.classList.toggle('open', v > .55); };

  if (!window.gsap || !window.ScrollTrigger || reduce) { setDoor(1); return; }
  gsap.registerPlugin(ScrollTrigger);
  const lenis = window.Lenis ? new Lenis({ lerp: .11 }) : null;
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70 }); } }));
  }
  ScrollTrigger.create({ trigger: sec, pin: '.door-stage', start: 'top top', end: '+=110%', scrub: .5, onUpdate: s => setDoor(Math.min(1, s.progress * 1.25)) });

  // O varal balança mais quando a rolagem acelera
  const cloths = $$('.cloth-in');
  let settle;
  ScrollTrigger.create({ trigger: '#line', start: 'top bottom', end: 'bottom top', onUpdate: s => {
    const v = gsap.utils.clamp(-4, 4, s.getVelocity() / 400);
    gsap.to(cloths, { rotate: -v, skewX: v * .3, duration: .6, ease: 'power2.out', overwrite: true, stagger: .03 });
    clearTimeout(settle); settle = setTimeout(() => gsap.to(cloths, { rotate: 0, skewX: 0, duration: 1.4, ease: 'elastic.out(1, .4)', overwrite: true }), 140);
  } });

  gsap.from('.hero-copy > *', { y: 30, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out' });
  gsap.from('.bt', { y: 80, opacity: 0, duration: 1, stagger: .15, ease: 'back.out(1.6)', delay: .2 });
  gsap.from('.cloth', { y: -60, opacity: 0, duration: .9, stagger: .12, ease: 'back.out(1.4)', scrollTrigger: { trigger: '#line', start: 'top 80%' } });
  gsap.from('.ct-out', { strokeDashoffset: 1400, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: '.area', start: 'top 80%' } });
  $$('.faq details, .rv-score, .sky-card, .area').forEach(el => gsap.from(el, { y: 40, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
})();
