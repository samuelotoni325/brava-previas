(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const EN = main.dataset.lang === 'en';
  const T = (a, b) => (EN ? a : b);
  const PHONE = main.dataset.phone;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__nav = window.__nav || (u => { location.href = u; });
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.11 });
    window.__lenis = lenis;
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const goTo = el => { if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const el = id.length > 1 && $(id);
    if (el) { e.preventDefault(); goTo(el); }
  }));

  const hd = $('#hd'), tag = $('.preview-tag');
  const onScroll = () => { hd.classList.toggle('solid', scrollY > 20); tag.classList.toggle('away', scrollY > innerHeight * 1.2); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Orçamento: a mensagem se escreve no balão enquanto o cliente toca
  const f = $('[data-quote]');
  const picked = n => f.querySelector(`input[name="${n}"]:checked`);
  const townIn = $('.town-in', f), hint = $('[data-hint]', f), base = hint.textContent, bubble = $('[data-bubble]', f);
  const town = () => { const t = picked('town'); return t ? (t.dataset.id === 'other' && townIn.value.trim() ? townIn.value.trim() : t.value) : ''; };
  const lines = () => {
    const a = picked('svc'), q = picked('freq');
    return [
      T('Hi Felicio’s! I’d like a free estimate.', 'Oi, Felicio’s! Quero um orçamento grátis.'),
      '',
      `${T('Service', 'Serviço')}: ${a ? a.value : '…'}`,
      `${T('How often', 'Frequência')}: ${q ? q.value : '…'}`,
      `${T('City', 'Cidade')}: ${town() || '…'}`,
    ];
  };
  let typer = null;
  const render = (animate) => {
    const txt = lines().join('\n');
    clearInterval(typer);
    if (!animate || reduce) { bubble.innerHTML = ''; bubble.textContent = txt; bubble.insertAdjacentHTML('beforeend', '<span class="caret"></span>'); return; }
    const prev = bubble.textContent; let i = 0;
    while (i < prev.length && prev[i] === txt[i]) i++;
    typer = setInterval(() => {
      i = Math.min(txt.length, i + 2);
      bubble.textContent = txt.slice(0, i); bubble.insertAdjacentHTML('beforeend', '<span class="caret"></span>');
      if (i >= txt.length) clearInterval(typer);
    }, 18);
  };
  const update = (animate) => {
    const vals = [picked('svc'), picked('freq'), picked('town')];
    townIn.hidden = !(vals[2] && vals[2].dataset.id === 'other');
    $$('.step', f).forEach((st, i) => st.classList.toggle('done', !!vals[i]));
    const n = vals.filter(x => !x).length;
    hint.classList.remove('err');
    hint.textContent = n ? base : T('Ready. Tap send and your messages app opens with this text.', 'Pronto. Toque em enviar e o app de mensagens abre com este texto.');
    render(animate);
  };
  f.addEventListener('change', e => { if (e.target.name === 'town' && e.target.dataset.id === 'other') setTimeout(() => townIn.focus(), 0); update(true); });
  townIn.addEventListener('input', () => update(false));
  f.addEventListener('submit', e => {
    e.preventDefault();
    const miss = !picked('svc') ? 1 : !picked('freq') ? 2 : !picked('town') ? 3 : 0;
    if (miss) { hint.textContent = T(`Pick step ${miss} first.`, `Escolha o passo ${miss} primeiro.`); hint.classList.add('err'); $$('.step', f)[miss - 1].querySelector('input').focus(); return; }
    const body = [...lines(), '', T('Sent from the Felicio’s website', 'Enviado pelo site da Felicio’s')].join('\n');
    window.__nav(`sms:+${PHONE}?&body=${encodeURIComponent(body)}`);
  });
  update(false);

  // Paradas do mapa preenchem a cidade do orçamento
  $$('[data-city]').forEach(b => b.addEventListener('click', () => {
    const r = $$('input[name="town"]', f).find(i => i.value === b.dataset.city);
    if (r) { r.checked = true; update(false); }
    $$('[data-city]').forEach(x => x.classList.toggle('on', x === b));
    $$('.st-g').forEach(g => g.classList.toggle('on', $('text', g).textContent === b.dataset.city));
    setTimeout(() => goTo($('#quote')), 350);
  }));

  // Abas de serviço
  const tabs = $$('[role="tab"]');
  const sel = t => {
    tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
    if (hasGsap && !reduce) gsap.from($$('.svc', $('#' + t.getAttribute('aria-controls'))), { y: 24, opacity: 0, stagger: .05, duration: .5, ease: 'power3.out' });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => sel(t));
    t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); sel(n); } });
  });

  // Concreto sujo: o dedo (ou a rolagem) passa o limpador de superfície
  const slab = $('[data-slab]');
  if (slab) {
    const cv = $('canvas', slab), ctx = cv.getContext('2d', { willReadFrequently: true }), noz = $('[data-nozzle]'), pctEl = $('[data-wash-pct]');
    let W = 0, H = 0, last = null, total = 0;
    let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const paint = () => {
      const b = slab.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      W = Math.round(b.width); H = Math.round(b.height); cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s = 11; ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgb(92,86,74)'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 260; i++) {
        const x = rnd() * W, y = rnd() * H, r = 8 + rnd() * W * .08, a = .08 + rnd() * .22;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const c = rnd() > .5 ? '40,36,30' : '120,112,96';
        g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(40,36,30,.6)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      ctx.fillStyle = 'rgba(60,90,50,.35)';
      for (let i = 0; i < 40; i++) { ctx.fillRect(W / 2 - 4 + rnd() * 8, rnd() * H, 3, 6 + rnd() * 10); }
      total = 0;
    };
    const R = () => Math.max(26, W * .085);
    const wipe = (x, y) => {
      ctx.globalCompositeOperation = 'destination-out';
      const r = R(), g = ctx.createRadialGradient(x, y, r * .3, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    };
    const line = (a, b) => { const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / (R() * .25))); for (let i = 0; i <= n; i++) wipe(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n); };
    const moveNoz = p => { noz.style.transform = `translate(${p.x}px, ${p.y}px)`; };
    const measure = () => {
      if (!W) return;
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let clear = 0, n = 0;
      for (let i = 3; i < d.length; i += 4 * 97) { n++; if (d[i] < 60) clear++; }
      pctEl.textContent = Math.round(clear / n * 100);
    };
    const pos = e => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    cv.addEventListener('pointerdown', e => { last = pos(e); wipe(last.x, last.y); moveNoz(last); noz.classList.add('on'); if (e.pointerType === 'mouse') cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      const p = pos(e); moveNoz(p); noz.classList.add('on');
      if (e.pointerType === 'mouse' && !e.buttons) { wipe(p.x, p.y); last = p; return; }
      if (last) line(last, p); last = p;
    });
    const up = () => { last = null; measure(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { last = null; noz.classList.remove('on'); measure(); });
    setInterval(() => { if (!document.hidden) measure(); }, 600);
    paint();
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { paint(); measure(); }, 250); });
    // passes da rolagem: faixas em zigue-zague
    const lanes = 5;
    const at = k => { const L = Math.min(lanes - .0001, k * lanes), i = Math.floor(L), t = L - i, y = (i + .5) * H / lanes; return { x: i % 2 ? W * (1 - t) : W * t, y }; };
    if (hasGsap && !reduce) {
      let prevK = 0;
      ScrollTrigger.create({
        trigger: slab, start: 'top 70%', end: 'bottom 25%', scrub: true,
        onUpdate: st => {
          const k = st.progress * .62; if (k <= prevK) return;
          for (let q = prevK; q < k; q += .004) line(at(q), at(Math.min(k, q + .004)));
          prevK = k; const p = at(k); moveNoz(p); noz.classList.toggle('on', st.progress < .99);
        },
      });
    } else if (reduce) { for (let q = 0; q < .6; q += .004) line(at(q), at(q + .004)); measure(); }
  }

  if (!hasGsap || reduce) {
    const ring = $('[data-ring]'); if (ring) ring.style.strokeDashoffset = 0;
    return;
  }

  // Odômetro: cada dígito rola até o número real
  $$('[data-odo]').forEach(el => {
    const v = el.dataset.odo; el.setAttribute('aria-label', v); el.innerHTML = '';
    const cols = [...v].map(d => { const c = document.createElement('span'); c.className = 'dg'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = Array.from({ length: 10 }, (_, i) => `<span>${i}</span>`).join(''); el.appendChild(c); return [c, +d]; });
    cols.forEach(([c, d], i) => gsap.fromTo(c, { yPercent: 0 }, { yPercent: -d * 10, duration: 1.6 + i * .3, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  });

  // Kit: as peças entram na maleta
  const kitStart = { spray: [-160, -220, -40], bottle: [0, -300, 25], leaf: [200, -240, 50], brush: [-240, -60, -70], cloth: [240, -40, 40], glove: [220, -180, -50] };
  $$('[data-ci]').forEach(g => { const [x, y, r] = kitStart[g.dataset.ci]; gsap.from(g, { x, y, rotation: r, opacity: 0, transformOrigin: '50% 50%', ease: 'none', scrollTrigger: { trigger: '.kit', start: 'top 85%', end: 'center 55%', scrub: .6 } }); });
  gsap.fromTo('[data-ring]', { strokeDashoffset: 327 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.guar', start: 'top 90%', end: 'top 40%', scrub: true } });
  gsap.from('.prom li', { x: 40, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.prom', start: 'top 80%' } });

  // Galeria: no desktop a seção fica presa e a rolagem passa a fita de fotos
  const strip = $('[data-strip]'), bar = $('[data-strip-bar]');
  if (strip) {
    ScrollTrigger.matchMedia({
      '(min-width: 901px)': () => {
        strip.classList.add('pinned'); $('.work').classList.add('pin-on');
        const dist = () => Math.max(0, strip.scrollWidth - innerWidth);
        const tw = gsap.to(strip, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.work', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true, onUpdate: s => gsap.set(bar, { scaleX: s.progress }) } });
        return () => { tw.kill(); strip.classList.remove('pinned'); $('.work').classList.remove('pin-on'); gsap.set(strip, { clearProps: 'x' }); };
      },
      '(max-width: 900px)': () => {
        const on = () => gsap.set(bar, { scaleX: strip.scrollLeft / Math.max(1, strip.scrollWidth - strip.clientWidth) });
        strip.addEventListener('scroll', on, { passive: true });
        return () => strip.removeEventListener('scroll', on);
      },
    });
  }

  // A linha: o trilho se desenha e a van percorre as paradas
  const track = $('[data-track]'), van = $('[data-van]');
  if (track && van) {
    const L = track.getTotalLength(); track.style.strokeDasharray = L; track.style.strokeDashoffset = L;
    const place = k => { const p = track.getPointAtLength(L * k), p2 = track.getPointAtLength(Math.min(L, L * k + 2)); const flip = p2.x < p.x ? -1 : 1; van.setAttribute('transform', `translate(${p.x} ${p.y - 26}) scale(${flip} 1)`); track.style.strokeDashoffset = L * (1 - k); };
    place(0);
    ScrollTrigger.create({ trigger: '.line', start: 'top 70%', end: 'bottom 60%', scrub: .8, onUpdate: s => place(s.progress) });
  }

  // Entradas
  $$('.sec-head, .steps li, .rv, .faq-list details, .wash-real figure').forEach(el => gsap.from(el, { y: 40, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  gsap.from('.hero-copy > *', { y: 30, opacity: 0, stagger: .08, duration: .9, ease: 'power3.out' });
  gsap.from('.quote', { y: 50, opacity: 0, duration: 1, delay: .2, ease: 'power3.out' });
})();
