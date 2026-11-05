(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const EN = main.dataset.lang === 'en';
  const T = (a, b) => (EN ? a : b);
  const PHONE = main.dataset.phone;
  const HOURS = JSON.parse(main.dataset.hours);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__nav = window.__nav || (u => { location.href = u; });
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  // Rolagem suave
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.11 });
    window.__lenis = lenis;
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); const el = id.length > 1 && $(id);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); }
    }));
  }

  // Cabeçalho e etiqueta
  const hd = $('#hd'), tag = $('.preview-tag');
  const onScroll = () => { hd.classList.toggle('solid', scrollY > 20); tag.classList.toggle('away', scrollY > innerHeight * 1.2); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Orçamento: três toques e o SMS pronto
  const f = $('[data-quote]');
  if (f) {
    const hint = $('[data-hint]', f), base = hint.textContent, townIn = $('.town-in', f), left = $('[data-left]', f);
    const picked = n => f.querySelector(`input[name="${n}"]:checked`);
    const update = () => {
      const a = picked('svc'), s = picked('size'), t = picked('town');
      townIn.hidden = !(t && t.dataset.id === 'other');
      $$('.step', f).forEach((st, i) => st.classList.toggle('done', !![a, s, t][i]));
      const n = [a, s, t].filter(x => !x).length;
      f.classList.toggle('ready', !n);
      left.textContent = n ? T(`${n} tap${n > 1 ? 's' : ''} to go`, `Falta${n > 1 ? 'm' : ''} ${n} toque${n > 1 ? 's' : ''}`) : T('Ready to send', 'Pronto para enviar');
      hint.classList.remove('err');
      hint.textContent = n ? base : T('Ready. Your messages app opens with the text written.', 'Pronto. O app de mensagens abre com o texto escrito.');
    };
    f.addEventListener('change', e => { if (e.target.name === 'town' && e.target.dataset.id === 'other') setTimeout(() => townIn.focus(), 0); update(); });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const a = picked('svc'), s = picked('size'), t = picked('town');
      const miss = !a ? 1 : !s ? 2 : !t ? 3 : 0;
      if (miss) { hint.textContent = T(`Pick step ${miss} first.`, `Escolha o passo ${miss} primeiro.`); hint.classList.add('err'); $$('.step', f)[miss - 1].querySelector('input').focus(); return; }
      const town = t.dataset.id === 'other' && townIn.value.trim() ? townIn.value.trim() : t.value;
      const lines = [
        T('Hi! I’d like a cleaning quote.', 'Oi! Gostaria de um orçamento de limpeza.'),
        '',
        `${T('Cleaning', 'Limpeza')}: ${a.value}`,
        `${T('Size', 'Tamanho')}: ${s.value}`,
        `${T('City', 'Cidade')}: ${town}`,
        '',
        T('Sent from the Brazilian cleaning website', 'Enviado pelo site da Brazilian cleaning'),
      ];
      window.__nav(`sms:+${PHONE}?&body=${encodeURIComponent(lines.join('\n'))}`);
    });
    update();
  }

  // Espelho embaçado: o dedo limpa, o vapor volta devagar. Na abertura, um coração é desenhado no vapor.
  const mirror = $('[data-mirror]');
  if (mirror) {
    const cv = $('canvas', mirror), ctx = cv.getContext('2d'), hintEl = $('[data-wipe-hint]', mirror);
    let W = 0, H = 0, dpr = 1, wiped = 0, last = null;
    const fogFill = a => {
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(236,244,241,${a})`); g.addColorStop(1, `rgba(214,232,226,${a})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    };
    const drops = () => {
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 70; i++) {
        const x = (i * 97.3) % W, y = (i * 53.7 + (i % 7) * 31) % H, r = 1 + (i % 4) * .7;
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
    };
    const size = () => {
      const b = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
      W = Math.round(b.width); H = Math.round(b.height); cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fogFill(.93); drops();
    };
    const wipe = (x, y, r) => {
      ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.6, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    };
    const stroke = (a, b, r) => { const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / (r * .3))); for (let i = 0; i <= n; i++) wipe(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n, r); };
    const pos = e => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    const brush = () => Math.max(16, W * .11);
    cv.addEventListener('pointerdown', e => { last = pos(e); cv.setPointerCapture(e.pointerId); wipe(last.x, last.y, brush()); });
    cv.addEventListener('pointermove', e => {
      if (!last && e.pointerType !== 'mouse') return;
      const p = pos(e); if (last) stroke(last, p, brush()); else wipe(p.x, p.y, brush() * .8);
      last = e.pointerType === 'mouse' && !e.buttons ? null : p;
      if (++wiped > 12) hintEl.classList.add('done');
    });
    const up = () => { last = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    size();
    let rw; addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(size, 200); });
    if (reduce) { ctx.clearRect(0, 0, W, H); fogFill(.35); hintEl.classList.add('done'); }
    else {
      // o coração no vapor
      const heart = t => { const a = Math.PI * 2 * t; return { x: W / 2 + W * .021 * 16 * Math.sin(a) ** 3, y: H * .45 - H * .016 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) }; };
      let t = 0, prev = heart(0);
      const draw = () => { t += .012; const p = heart(t); stroke(prev, p, Math.max(8, W * .045)); prev = p; if (t < 1) requestAnimationFrame(draw); };
      setTimeout(() => requestAnimationFrame(draw), 700);
      // o vapor volta aos poucos, sem esconder tudo
      setInterval(() => { if (document.hidden) return; fogFill(.012); }, 220);
    }
  }

  // O sol do expediente: posição real agora, no horário de Orlando
  const sunFig = $('.sun-fig');
  if (sunFig) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false }).formatToParts(new Date());
    const get = k => parts.find(p => p.type === k)?.value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    const h = (+get('hour') % 24) + (+get('minute')) / 60;
    const workday = HOURS.days.includes(day);
    const isOpen = workday && h >= HOURS.open && h < HOURS.close;
    const frac = Math.min(1, Math.max(0, (h - HOURS.open) / (HOURS.close - HOURS.open)));
    const target = isOpen ? frac : (h >= HOURS.close && workday ? 1 : 0);
    const li = $(`.week li[data-day="${day}"]`); if (li) li.classList.add('today');
    const now = $('[data-now]');
    const nextOpen = () => { for (let i = 1; i <= 7; i++) { const d = (day + i) % 7; if (HOURS.days.includes(d)) return d; } return 1; };
    const dn = EN ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] : ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    if (isOpen) { now.textContent = T('Open now · until 7 PM', 'Aberto agora · até as 19h'); now.classList.add('open'); }
    else if (workday && h < HOURS.open) now.textContent = T('Closed now · opens today at 7 AM', 'Fechado agora · abre hoje às 7h');
    else now.textContent = T(`Closed now · opens ${dn[nextOpen()]} at 7 AM`, `Fechado agora · abre ${nextOpen() === 6 ? 'no' : 'na'} ${dn[nextOpen()]} às 7h`);
    const arc = $('[data-arc]'), sun = $('[data-sun]'), L = arc.getTotalLength();
    arc.style.strokeDasharray = L;
    const place = k => { const p = arc.getPointAtLength(L * k); sun.setAttribute('transform', `translate(${p.x} ${p.y})`); arc.style.strokeDashoffset = L * (1 - k); };
    place(reduce || !hasGsap ? target : 0);
    if (!reduce && hasGsap) {
      const o = { k: 0 };
      gsap.to(o, { k: target, ease: 'power2.out', duration: 2.4, onUpdate: () => place(o.k), scrollTrigger: { trigger: sunFig, start: 'top 75%' } });
    }
  }

  // Avaliações: original em português ou tradução do Google
  $$('[data-rl]').forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.rl;
    $$('[data-rl]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.rv-t [data-l]').forEach(s => { s.hidden = s.dataset.l !== l; });
  }));

  if (!hasGsap || reduce) return;

  // Varal: as toalhas balançam com a velocidade da rolagem
  const towels = $$('.towel');
  if (towels.length) {
    let v = 0;
    ScrollTrigger.create({ trigger: '.clothesline', start: 'top bottom', end: 'bottom top', onUpdate: s => { v = s.getVelocity(); } });
    gsap.ticker.add(() => {
      v *= .9;
      const r = Math.max(-7, Math.min(7, v / 260));
      towels.forEach((t, i) => gsap.set(t, { rotation: r * (i % 2 ? 1 : -.8) }));
    });
    gsap.from(towels, { y: -60, opacity: 0, stagger: .12, duration: 1, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.clothesline', start: 'top 80%' } });
  }

  // Entradas
  $$('.sec-head, .how-list li, .rv, .faq-list details, .area-copy').forEach(el => gsap.from(el, { y: 36, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));

  gsap.from('.how-i', { scale: 0, rotation: -25, transformOrigin: '50% 50%', stagger: .15, duration: .9, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.how-list', start: 'top 80%' } });

  // Brilho que passa nas fotos reais
  $$('.ph-img').forEach(el => gsap.fromTo($('.glint', el), { xPercent: 0 }, { xPercent: 600, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.from('.ph-img img', { scale: 1.12, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.ph-grid', start: 'top 80%' } });
  gsap.from('.rv-big span', { scale: .6, opacity: 0, duration: 1, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.rv-big', start: 'top 85%' } });
  gsap.from('.pin-g', { y: -80, opacity: 0, duration: 1, ease: 'bounce.out', scrollTrigger: { trigger: '.area-map', start: 'top 75%' } });
  gsap.from('.ring', { scale: .3, opacity: 0, transformOrigin: '50% 50%', stagger: .15, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.area-map', start: 'top 75%' } });
})();
