// Prévia Freitas Flooring: orçamento por WhatsApp, corte do piso, seletor de brilho,
// reparo de tábuas, revelações e rolagem suave.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EN = window.FF.lang === 'en';
  const T = (a, b) => (EN ? a : b);
  const PHONE = window.FF.phone;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  // Rolagem suave (desligada com movimento reduzido)
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const goTo = target => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -76 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !$(id)) return;
    e.preventDefault(); goTo(id);
  }));

  // Cabeçalho e etiqueta
  const hd = $('#hd'), tag = $('.preview-tag');
  const onScroll = () => { hd.classList.toggle('solid', scrollY > 30); tag.classList.toggle('away', scrollY > innerHeight * 0.8 && scrollY < document.body.scrollHeight - innerHeight * 1.6); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Orçamento em 3 toques, enviado pelo WhatsApp real do negócio
  const form = $('#quote');
  let sheen = '';
  const picked = n => form.querySelector(`input[name="${n}"]:checked`);
  const otherBox = $('.town-other', form), otherIn = $('input[name="townOther"]', form);
  const text = () => {
    const s = picked('svc'), z = picked('size'), c = picked('town');
    const town = c ? (c.value === 'other' ? otherIn.value.trim() : c.value) : '';
    const lines = [
      T('Hi Freitas Flooring! I found your website and I’d like a free estimate.', 'Oi, Freitas Flooring! Vim pelo site e quero um orçamento grátis.'),
      '',
      s && `• ${T('Service', 'Serviço')}: ${s.value}`,
      z && `• ${T('Size', 'Tamanho')}: ${z.value}`,
      town && `• ${T('Town', 'Cidade')}: ${town}`,
      sheen && `• ${T('Sheen I like', 'Brilho que gostei')}: ${sheen}`,
      '',
      T('Sent from your website. I can send photos of the floor.', 'Enviado pelo site. Posso mandar fotos do piso.'),
    ].filter(x => x !== null && x !== undefined && x !== false);
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
  };
  const hint = $('.wo-hint', form), baseHint = hint.textContent;
  const update = () => {
    const msg = text();
    $('.wo-msg', form).textContent = msg;
    $('.wo-wa', form).href = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
    const done = ['svc', 'size', 'town'].filter(n => picked(n)).length;
    hint.textContent = done === 3 ? T('Ready. Tap “Send on WhatsApp” and attach a photo or two.', 'Pronto. Toque em “Enviar no WhatsApp” e anexe uma ou duas fotos.') : done ? T(`${done} of 3 done.`, `${done} de 3 feitos.`) + ' ' + baseHint : baseHint;
    const sh = $('.wo-sheen', form); sh.hidden = !sheen; $('b', sh).textContent = sheen;
  };
  form.addEventListener('change', e => {
    if (e.target.name === 'town') { otherBox.hidden = e.target.value !== 'other'; if (!otherBox.hidden) otherIn.focus({ preventScroll: true }); }
    update();
  });
  otherIn.addEventListener('input', update);
  update();

  // Cidade digitada na seção de área entra no pedido
  $('.ar-town').addEventListener('submit', e => {
    e.preventDefault();
    const v = e.target.elements.t.value.trim();
    const r = $('input[name="town"][value="other"]', form);
    if (v) { r.checked = true; otherBox.hidden = false; otherIn.value = v; } else { $('input[name="town"][value="Westborough"]', form).checked = true; otherBox.hidden = true; }
    update(); goTo('#quote');
  });

  // Serviços: foto do lado acompanha a linha em foco
  const stage = $('.svc-stage');
  const showSvc = row => {
    $$('.svc-row').forEach(r => r.classList.toggle('on', r === row));
    $$('img', stage).forEach(i => i.classList.toggle('on', i.dataset.for === row.dataset.img));
    $('.svc-stage-c', stage).textContent = $('h3', row).textContent;
  };
  $$('.svc-row').forEach(r => { r.addEventListener('mouseenter', () => showSvc(r)); r.addEventListener('focusin', () => showSvc(r)); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && showSvc(e.target)), { rootMargin: '-45% 0px -45% 0px' });
    $$('.svc-row').forEach(r => io.observe(r));
  }

  // Corte do piso: cada etapa acende uma camada
  const cs = $('.cs-svg'), now = $('.cs-now'), steps = $$('.cs-steps li');
  const setLayer = i => {
    $$('.L', cs).forEach((g, k) => g.classList.toggle('on', k <= i));
    for (let k = 0; k < 7; k++) cs.classList.toggle('s' + k, k === i);
    steps.forEach((li, k) => li.classList.toggle('on', k === i));
    now.textContent = $('b', steps[i]).textContent;
  };
  setLayer(0);
  if (hasGsap && !reduce) {
    let cur = 0;
    ScrollTrigger.create({ trigger: '.cs-steps', start: 'top 75%', end: 'bottom 45%', onUpdate: st => {
      const i = Math.min(steps.length - 1, Math.floor(st.progress * steps.length));
      if (i !== cur) { cur = i; setLayer(i); }
    } });
    steps.forEach((li, i) => li.addEventListener('click', () => { cur = i; setLayer(i); }));
  } else {
    setLayer(steps.length - 1);
    steps.forEach(li => li.classList.add('on'));
  }

  // Seletor de brilho: reflexo das janelas no piso
  const blur = $('#sblurv'), refl = $('.refl'), glare = $('.glare'), knob = $('.dial-knob'), dots = $$('.dial-dot');
  const descs = $$('.sh-data span').map(s => s.textContent);
  const btns = $$('.sh-b');
  const setSheen = (b, user) => {
    const i = +b.dataset.i;
    btns.forEach(x => x.setAttribute('aria-checked', x === b));
    blur.setAttribute('stdDeviation', b.dataset.blur);
    refl.style.opacity = b.dataset.op;
    glare.style.opacity = (+b.dataset.op * 0.35).toFixed(2);
    knob.style.transform = `rotate(${-135 + i * 90}deg)`;
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    $('.sh-d').textContent = descs[i];
    if (user) { sheen = b.dataset.name; update(); }
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => setSheen(b, true));
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return; e.preventDefault(); const n = btns[(i + d + btns.length) % btns.length]; n.focus(); setSheen(n, true);
    });
  });
  setSheen(btns[1], false);
  $('.sh-go').addEventListener('click', () => { const b = $('.sh-b[aria-checked="true"]'); sheen = b.dataset.name; update(); });

  // Reparo: tirar as tábuas ruins, entremear novas, lixar e dar acabamento
  const plan = $('.lc-plan'), state = $('.lc-state'), b1 = $('.lc-b[data-step="1"]'), b2 = $('.lc-b[data-step="2"]'), reset = $('.lc-reset');
  const states = [
    T('Damaged boards and a water stain', 'Tábuas danificadas e mancha de água'),
    T('New boards laced in. You can still see them.', 'Tábuas novas entremeadas. Ainda dá para ver.'),
    T('Sanded and finished. Where was the patch?', 'Lixado e com acabamento. Cadê o remendo?'),
  ];
  const setLace = n => {
    plan.dataset.step = n; state.textContent = states[n];
    b1.disabled = n !== 0; b2.disabled = n !== 1; reset.hidden = n === 0;
  };
  b1.addEventListener('click', () => setLace(1));
  b2.addEventListener('click', () => setLace(2));
  reset.addEventListener('click', () => setLace(0));

  // Mapa: estradas desenham ao entrar
  const map = $('.map-svg');
  if ('IntersectionObserver' in window && !reduce) {
    const mo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { map.classList.add('on'); mo.disconnect(); } }), { threshold: 0.3 });
    mo.observe(map);
  } else map.classList.add('on');

  // Revelações
  if ('IntersectionObserver' in window && !reduce) {
    const ro = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(el => ro.observe(el));
  } else $$('.rv').forEach(el => el.classList.add('in'));

  // Entrada do hero, escada subindo e parallax da foto
  if (hasGsap && !reduce) {
    gsap.from('.h1, .hero-sub, .hero-proof, .eyebrow', { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out' });
    gsap.from('.wo', { y: 40, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out' });
    gsap.from('.arch', { clipPath: 'inset(100% 0 0 0 round 999px 999px 18px 18px)', duration: 1.4, delay: 0.1, ease: 'power3.inOut' });
    gsap.to('.arch img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.from('.st-step', { y: 120, opacity: 0, duration: 1, stagger: 0.16, ease: 'power3.out', scrollTrigger: { trigger: '.st-flight', start: 'top 75%' } });
    gsap.from('.st-line path', { strokeDashoffset: 2000, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: '.st-flight', start: 'top 75%' } });
  }
})();
