(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const TEL = main.dataset.tel;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  // Rolagem suave
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const goTo = (el, off = -80) => { if (!el) return; if (lenis) lenis.scrollTo(el, { offset: off }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); const el = id.length > 1 && $(id);
    if (!el) return; e.preventDefault(); goTo(el, -86);
  }));

  // Cabeçalho, etiqueta e barra fixa
  const hd = $('#hd'), tag = $('.preview-tag'), dock = $('.dock');
  const onScroll = () => { hd.classList.toggle('solid', scrollY > 30); tag.classList.toggle('away', scrollY > innerHeight * 0.5); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Orçamento: três toques montam o SMS real
  const form = $('#qt'), pre = $('#qtMsg'), hint = $('#qtHint'), sms = $('#qtSms'), dockSms = $('#dockSms'), other = $('.where-other', form);
  const M = window.MSG;
  const extras = new Map();
  const picked = (n) => form.querySelector(`input[name="${n}"]:checked`);
  function fields() {
    const s = picked('svc'), b = picked('beds'), w = picked('where'), f = picked('freq');
    let where = w ? w.dataset.msg : '';
    if (w && w.value === 'other') where = other.value.trim() ? other.value.trim() : '';
    const out = [];
    if (s) out.push([M.svc, s.dataset.msg]);
    if (b) out.push([M.beds, b.dataset.msg]);
    if (where) out.push([M.where, where]);
    if (f) out.push([M.freq, f.dataset.msg]);
    if (extras.size) out.push([M.extras, [...extras.values()].join(', ')]);
    return out;
  }
  function render() {
    const f = fields();
    const text = [M.hi, '', ...f.map(([k, v]) => `• ${k}: ${v}`), ...(f.length ? [''] : []), `(${M.from})`].join('\n');
    pre.textContent = text;
    const href = `sms:${TEL}?&body=${encodeURIComponent(text)}`;
    sms.href = href; dockSms.href = href;
    const step = !picked('svc') ? 0 : !picked('beds') ? 1 : !picked('where') ? 2 : 3;
    hint.textContent = window.HINTS[step];
    form.classList.toggle('ready', step === 3);
  }
  form.addEventListener('change', (e) => {
    if (e.target.name === 'where') { other.hidden = e.target.value !== 'other'; if (!other.hidden) other.focus(); }
    render();
  });
  form.addEventListener('input', (e) => { if (e.target === other) render(); });
  form.addEventListener('submit', (e) => e.preventDefault());
  render();
  const setRadio = (name, v) => { const r = form.querySelector(`input[name="${name}"][value="${v}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } };
  $$('[data-pick]').forEach((b) => b.addEventListener('click', () => { setRadio('svc', b.dataset.pick); goTo($('#quote'), -86); }));
  new IntersectionObserver(([e]) => dock.classList.toggle('hide', e.isIntersecting), { threshold: 0.2 }).observe(form);

  // Momento 1: a parede de azulejos que se limpa
  const wall = $('#wall'), tiles = $$('.wt', wall).filter((t) => getComputedStyle(t).display !== 'none'), countEl = $('#wallCount');
  let clean = 0;
  const wallText = (n) => window.WALLT.replace('{n}', n).replace('{t}', tiles.length);
  const cleanTile = (t) => { if (!t || t.classList.contains('clean')) return; t.classList.add('clean'); clean++; countEl.textContent = wallText(clean); };
  const tileAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest && el.closest('.wt'); };
  wall.addEventListener('pointermove', (e) => cleanTile(tileAt(e.clientX, e.clientY)));
  wall.addEventListener('pointerdown', (e) => cleanTile(tileAt(e.clientX, e.clientY)));
  countEl.textContent = wallText(0);
  // abertura: uma faixa limpa em diagonal, para mostrar o gesto
  const diag = tiles.filter((t, i) => { const c = i % 6, r = Math.floor(i / 6); return c + r <= 3; });
  diag.forEach((t, i) => setTimeout(() => cleanTile(t), reduce ? 0 : 700 + i * 140));

  // Momento 2: a cozinha
  const xList = $('#xList'), kit = $('.kit');
  function setExtra(id, label, on) {
    if (on) extras.set(id, label); else extras.delete(id);
    $$(`.kx[data-x="${id}"]`).forEach((g) => g.classList.toggle('on', on));
    $$(`.x-btn[data-x="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', on));
    kit.classList.toggle(`kx-on-${id}`, on);
    xList.innerHTML = extras.size ? [...extras.values()].map((v) => `<li>${v}</li>`).join('') : `<li class="none">${xList.dataset.none}</li>`;
    render();
  }
  const labelOf = (id) => $(`.x-btn[data-x="${id}"]`).dataset.msg;
  $$('.kx').forEach((g) => {
    const toggle = () => setExtra(g.dataset.x, labelOf(g.dataset.x), !extras.has(g.dataset.x));
    g.addEventListener('click', toggle);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
  $$('.x-btn').forEach((b) => b.addEventListener('click', () => setExtra(b.dataset.x, b.dataset.msg, !extras.has(b.dataset.x))));

  // Momento 3: o esfregão apaga as pegadas conforme a rolagem
  const pawsBox = $('#paws'), mop = $('#mop'), paws = $$('.paw');
  function mopAt(k) {
    const x = -30 + k * 1260;
    mop.setAttribute('transform', `translate(${x} 0)`);
    paws.forEach((p) => p.classList.toggle('gone', +p.dataset.x < x - 6));
  }
  if (reduce) mopAt(0.5);
  else {
    const upd = () => { const r = pawsBox.getBoundingClientRect(); const k = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * 0.2) * 1.15 - 0.1)); mopAt(k); };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // Momento 4: azulejos que viram na contagem dos temas
  const tally = $('#tally');
  if (!reduce) {
    tally.classList.add('pre');
    $$('.az', tally).forEach((t, i) => t.style.setProperty('--d', String(i * 28)));
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { tally.classList.remove('pre'); o.disconnect(); } }, { threshold: 0.3 }).observe(tally);
  }

  // Momento 5: a placa balança com a velocidade da rolagem
  const sign = $('#sign');
  if (!reduce && sign) {
    let lastY = scrollY, ang = 0, vel = 0;
    const tick = () => {
      const dy = scrollY - lastY; lastY = scrollY;
      vel += -dy * 0.012 - ang * 0.06; vel *= 0.92; ang += vel;
      ang = Math.max(-14, Math.min(14, ang));
      sign.style.transform = `rotate(${ang.toFixed(2)}deg)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Entradas
  if (hasGsap && !reduce) {
    gsap.from('.hero h1 > *', { y: 50, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity' });
    gsap.from('.qt', { y: 40, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out', clearProps: 'transform,opacity' });
    $$('.head').forEach((el) => gsap.from(el.children, { y: 26, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 85%' } }));
    $$('.wk figure img').forEach((img) => gsap.fromTo(img, { scale: 1.14, yPercent: -4 }, { scale: 1.14, yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.from('.rv', { y: 40, opacity: 0, duration: 0.7, stagger: 0.08, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.rvs', start: 'top 85%' } });
    gsap.from('.steps li', { y: 30, opacity: 0, duration: 0.7, stagger: 0.12, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.steps', start: 'top 85%' } });
    gsap.from('.g, .gal-small figure', { clipPath: 'inset(100% 0 0 0)', duration: 1, stagger: 0.08, ease: 'power3.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: '.gal', start: 'top 80%' } });
  }
})();
