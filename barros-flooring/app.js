// Prévia Barros Flooring: orçamento por SMS, lixadeira interativa, teste da gota,
// galeria em réguas, revelações e rolagem suave.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EN = window.BF.lang === 'en';
  const T = (a, b) => (EN ? a : b);
  const PHONE = window.BF.phone;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const goTo = sel => { const el = $(sel); if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -76 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2 || !$(id)) return;
    e.preventDefault(); goTo(id);
  }));

  const hd = $('#hd'), tag = $('.preview-tag');
  const onScroll = () => { hd.classList.toggle('solid', scrollY > 30); tag.classList.toggle('away', scrollY > innerHeight * 0.8 && scrollY < document.body.scrollHeight - innerHeight * 1.6); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Orçamento em 3 toques, enviado por SMS para o telefone real do negócio
  const form = $('#quote');
  let water = '';
  const picked = n => form.querySelector(`input[name="${n}"]:checked`);
  const otherBox = $('.town-other', form), otherIn = $('input[name="townOther"]', form);
  const text = () => {
    const s = picked('svc'), z = picked('size'), c = picked('town');
    const town = c ? (c.value === 'other' ? otherIn.value.trim() : c.value) : '';
    return [
      T('Hi Barros Flooring! I found your website and I’d like a free estimate.', 'Olá, Barros Flooring! Vim pelo site e quero um orçamento grátis.'),
      '',
      s && `• ${T('Service', 'Serviço')}: ${s.value}`,
      z && `• ${T('Size', 'Tamanho')}: ${z.value}`,
      town && `• ${T('Town', 'Cidade')}: ${town}`,
      water && `• ${T('Water-drop test', 'Teste da gota')}: ${water}`,
      '',
      T('Sent from your website. I’ll attach photos of the floor.', 'Enviado pelo site. Vou anexar fotos do piso.'),
    ].filter(x => typeof x === 'string').join('\n').replace(/\n{3,}/g, '\n\n');
  };
  const hint = $('.qt-hint', form), baseHint = hint.textContent;
  const update = () => {
    const msg = text();
    $('.qt-msg', form).textContent = msg;
    $('.qt-sms', form).href = `sms:+${PHONE}?&body=${encodeURIComponent(msg)}`;
    const done = ['svc', 'size', 'town'].filter(n => picked(n)).length;
    hint.textContent = done === 3 ? T('Ready. Tap “Send a text” and attach photos of the floor.', 'Pronto. Toque em “Mandar mensagem” e anexe fotos do piso.') : done ? T(`${done} of 3 done. `, `${done} de 3 feitos. `) + baseHint : baseHint;
    const d = $('.qt-drop', form); d.hidden = !water; $('span', d).textContent = `${T('Water-drop test', 'Teste da gota')}: ${water}`;
  };
  form.addEventListener('change', e => {
    if (e.target.name === 'town') { otherBox.hidden = e.target.value !== 'other'; if (!otherBox.hidden) otherIn.focus({ preventScroll: true }); }
    update();
  });
  otherIn.addEventListener('input', update);
  update();

  $('.ar-town').addEventListener('submit', e => {
    e.preventDefault();
    const v = e.target.elements.t.value.trim();
    if (v) { $('input[name="town"][value="other"]', form).checked = true; otherBox.hidden = false; otherIn.value = v; }
    else { $$('input[name="town"]', form)[0].checked = true; otherBox.hidden = true; }
    update(); goTo('#quote');
  });

  // Lixadeira: cada faixa revela a madeira crua por baixo
  const stage = $('.sd-stage'), svg = $('.sd-svg'), sander = $('.sander', svg);
  const clips = $$('.lane-clip', svg), LH = 65, W = 1000;
  const widths = clips.map(() => 0);
  const nEl = $('.sd-n'), done = $('.sd-done'), reset = $('.sd-reset'), run = $('.sd-run');
  const paint = () => {
    clips.forEach((c, i) => c.setAttribute('width', widths[i]));
    const n = widths.filter(w => w >= W).length;
    nEl.textContent = n;
    done.hidden = n < clips.length;
    reset.hidden = widths.every(w => w === 0);
  };
  const pt = e => { const m = svg.getScreenCTM().inverse(); const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return p; };
  const sandAt = (x, y) => {
    sander.setAttribute('transform', `translate(${x} ${y})`);
    const l = Math.max(0, Math.min(clips.length - 1, Math.floor(y / LH)));
    const nw = Math.min(W, Math.max(widths[l], x + 46));
    widths[l] = nw >= W - 50 ? W : nw;
    paint();
  };
  stage.addEventListener('pointermove', e => { stage.classList.add('active'); const p = pt(e); sandAt(p.x, p.y); });
  stage.addEventListener('pointerdown', e => { stage.classList.add('active'); const p = pt(e); sandAt(p.x, p.y); });
  stage.addEventListener('pointerleave', () => stage.classList.remove('active'));
  let anim = 0;
  run.addEventListener('click', () => {
    cancelAnimationFrame(anim);
    if (reduce) { widths.fill(W); paint(); return; }
    stage.classList.add('active');
    let l = widths.findIndex(w => w < W); if (l < 0) return;
    let x = widths[l];
    const step = () => {
      x += 26;
      sandAt(Math.min(x, W), l * LH + LH / 2);
      if (x >= W) { l = widths.findIndex(w => w < W); if (l < 0) { stage.classList.remove('active'); return; } x = widths[l]; }
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  });
  reset.addEventListener('click', () => { cancelAnimationFrame(anim); widths.fill(0); paint(); });
  paint();

  // Teste da gota
  const art = $('.dp-art'), out = $('.dp-out'), data = $$('.dp-data span'), dbs = $$('.dp-b');
  let dropPick = null;
  const pickDrop = b => {
    dropPick = b;
    dbs.forEach(x => x.setAttribute('aria-checked', x === b));
    art.classList.remove('go'); art.dataset.r = b.dataset.id; void art.offsetWidth; art.classList.add('go');
    const d = data[+b.dataset.i];
    $('.dp-v', out).textContent = d.dataset.v; $('.dp-d', out).textContent = d.dataset.d; out.hidden = false;
  };
  dbs.forEach((b, i) => {
    b.addEventListener('click', () => pickDrop(b));
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return; e.preventDefault(); const n = dbs[(i + d + dbs.length) % dbs.length]; n.focus(); pickDrop(n);
    });
  });
  $('.dp-add').addEventListener('click', () => { if (dropPick) { water = dropPick.dataset.name; update(); } });

  // Galeria em réguas
  const pks = $$('.pk');
  pks.forEach(p => p.addEventListener('click', () => pks.forEach(x => { const on = x === p; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); })));

  // Revelações
  const targets = [...$$('.rv'), $('.ar-big')];
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    targets.forEach(el => io.observe(el));
  } else targets.forEach(el => el.classList.add('in'));

  if (hasGsap && !reduce) {
    gsap.from('.lane', { scaleY: 0, duration: 1.4, ease: 'power3.inOut' });
    gsap.from('.eyebrow, .h1, .hero-sub, .hero-proof', { y: 34, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.2 });
    gsap.from('.qt', { x: 40, opacity: 0, duration: 1, delay: 0.35, ease: 'power3.out' });
    gsap.to('.hero-bg img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.from('.ba-col.before .ba-ph', { y: 60, opacity: 0, stagger: 0.15, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.ba-grid', start: 'top 75%' } });
    gsap.from('.ba-col.after .ba-ph', { y: 60, opacity: 0, stagger: 0.15, duration: 0.9, delay: 0.4, ease: 'power3.out', scrollTrigger: { trigger: '.ba-grid', start: 'top 75%' } });
  }
})();
