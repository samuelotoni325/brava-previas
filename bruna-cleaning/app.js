(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const EN = main.dataset.lang === 'en';
  const TEL = main.dataset.tel;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  // Rolagem suave (desligada com movimento reduzido)
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.11 });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const goTo = (el, off = -80) => { if (!el) return; if (lenis) lenis.scrollTo(el, { offset: off }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); const el = id.length > 1 && $(id);
    if (!el) return; e.preventDefault(); goTo(el, id === '#top' ? 0 : -80);
    if (a.hasAttribute('data-focus-quote')) pulsePhone();
  }));

  // Cabeçalho, etiqueta de prévia e barra fixa
  const hd = $('#hd'), tag = $('.preview-tag'), dock = $('.dock');
  const onScroll = () => { hd.classList.toggle('solid', scrollY > 30); tag.classList.toggle('away', scrollY > innerHeight * (innerWidth < 900 ? 0.4 : 0.8)); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Orçamento em três toques: monta a mensagem e o link real de SMS
  const form = $('#qt'), msgEl = $('#qtMsg'), bub = $('.bub.out'), priceEl = $('#qtPrice'), hintEl = $('#qtHint');
  const sms = $('#qtSms'), dockSms = $('#dockSms'), other = $('.city-other', form);
  const M = window.MSG, P = window.PRICES, PU = window.PRICE_UI;
  const addons = new Map();
  const picked = (n) => form.querySelector(`input[name="${n}"]:checked`);
  let last = {};
  const escH = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  function fields() {
    const s = picked('svc'), z = picked('size'), c = picked('city');
    let city = c ? c.value : '';
    if (city === 'other') city = other.value.trim();
    const f = [];
    if (s) f.push([M.svc, s.dataset.msg]);
    if (z) f.push([M.size, z.dataset.msg]);
    if (city) f.push([M.city, city]);
    if (addons.size) f.push([M.add, [...addons.values()].join(', ')]);
    return f;
  }
  const text = (f) => [M.hi, '', ...f.map(([k, v]) => `• ${k}: ${v}`), '', `(${M.from})`].join('\n');

  let typingT;
  function render(animate) {
    const f = fields();
    msgEl.innerHTML = [escH(M.hi), '', ...f.map(([k, v]) => `• ${escH(k)}: <mark${last[k] !== undefined && last[k] !== v ? ' class="flash"' : ''}>${escH(v)}</mark>`), ...(f.length ? [''] : []), `(${escH(M.from)})`].join('\n');
    last = Object.fromEntries(f);
    const href = `sms:${TEL}?&body=${encodeURIComponent(text(f))}`;
    sms.href = href; dockSms.href = href;
    // preço da lista publicada
    const s = picked('svc'), z = picked('size');
    const pr = s && z && P[s.value] && P[s.value][z.value];
    priceEl.hidden = !pr;
    if (pr) priceEl.innerHTML = `${escH(PU.from)}<b>${escH(pr)}</b><span>· ${escH(PU.varies)}</span>`;
    const c = picked('city');
    const step = !s ? 0 : !z ? 1 : !c ? 2 : 3;
    hintEl.textContent = window.HINTS[step];
    form.classList.toggle('ready', step === 3);
    if (animate && !reduce) { bub.classList.add('busy'); clearTimeout(typingT); typingT = setTimeout(() => bub.classList.remove('busy'), 650); }
  }
  form.addEventListener('change', (e) => {
    if (e.target.name === 'city') { other.hidden = e.target.value !== 'other'; if (!other.hidden) other.focus(); syncCity(); }
    if (e.target.name === 'size') syncBeds(+e.target.value);
    render(true);
  });
  form.addEventListener('input', (e) => { if (e.target === other) render(false); });
  form.addEventListener('submit', (e) => e.preventDefault());
  render(false);

  function setRadio(name, value) {
    const r = form.querySelector(`input[name="${name}"][value="${value}"]`);
    if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); r.closest('.chip').scrollIntoView({ block: 'nearest', inline: 'center' }); }
  }
  const phoneBox = $('#phone');
  function pulsePhone() {
    if (reduce || !hasGsap) return;
    gsap.fromTo(phoneBox, { scale: 0.97 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, .45)', delay: 0.5 });
  }
  function backToQuote() { goTo($('#top'), 0); pulsePhone(); }

  // Quando o formulário aparece na tela, a barra fixa sai do caminho
  new IntersectionObserver(([e]) => dock.classList.toggle('hide', e.isIntersecting), { threshold: 0.25 }).observe(form);

  // Momento 2: etiquetas de preço
  const beds = $$('.bed'), tagsEl = $$('.ptag');
  let curBeds = 2;
  function showBeds(n, swing) {
    curBeds = n;
    beds.forEach((b) => { const on = +b.dataset.beds === n; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    tagsEl.forEach((t, i) => {
      const p = $('.ptag-p', t); p.textContent = JSON.parse(p.dataset.prices)[n];
      if (swing && !reduce) { t.classList.remove('swing'); void t.offsetWidth; setTimeout(() => t.classList.add('swing'), i * 90); }
    });
  }
  function syncBeds(n) { if (n >= 1 && n <= 4 && n !== curBeds) showBeds(n, false); }
  beds.forEach((b) => b.addEventListener('click', () => showBeds(+b.dataset.beds, true)));
  $$('[data-put]').forEach((b) => b.addEventListener('click', () => { setRadio('svc', b.dataset.put); setRadio('size', String(curBeds)); backToQuote(); }));

  // Momento 3: adesivos dos adicionais
  const xCount = $('#xCount');
  $$('.stk').forEach((b) => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on);
    if (on) addons.set(b.dataset.add, b.dataset.msg); else addons.delete(b.dataset.add);
    xCount.textContent = addons.size ? window.XUI.some[addons.size - 1] : xCount.dataset.none;
    render(false);
  }));

  // Serviços: tocar escolhe o serviço no orçamento
  $$('[data-pick]').forEach((b) => b.addEventListener('click', () => { setRadio('svc', b.dataset.pick); backToQuote(); }));

  // Momento 6: mapa e cidades
  const pins = $$('.pin'), towns = $$('.town-list button');
  const near = $('.near'), nearBase = near.textContent;
  function syncCity() {
    const c = picked('city'); const v = c ? c.value : '';
    pins.forEach((p) => p.classList.toggle('on', p.dataset.city === v));
    towns.forEach((t) => t.classList.toggle('on', t.dataset.city === v));
  }
  function pickCity(v) {
    setRadio('city', v);
    near.textContent = EN ? `${v} is in your text. Scroll up to send it.` : `${v} entrou na mensagem. Volte ao topo para enviar.`;
    clearTimeout(pickCity.t); pickCity.t = setTimeout(() => { near.textContent = nearBase; }, 4000);
  }
  pins.forEach((p) => {
    p.addEventListener('click', () => pickCity(p.dataset.city));
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickCity(p.dataset.city); } });
  });
  towns.forEach((t) => t.addEventListener('click', () => pickCity(t.dataset.city)));

  const routes = $$('.route'), car = $('.car');
  if (!reduce && routes.length) {
    routes.forEach((r) => { const L = r.getTotalLength(); r.dataset.len = L; r.style.strokeDasharray = `${L}`; r.style.strokeDashoffset = `${L}`; });
    let ran = false;
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting || ran) return; ran = true; o.disconnect();
      let i = 0;
      const drive = () => {
        const r = routes[i]; if (!r) { car.style.opacity = 0; return; }
        const L = +r.dataset.len, t0 = performance.now(), dur = 900;
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
          r.style.strokeDashoffset = `${L * (1 - ease)}`;
          const pt = r.getPointAtLength(L * ease); car.setAttribute('cx', pt.x); car.setAttribute('cy', pt.y);
          if (k < 1) requestAnimationFrame(step);
          else { r.style.strokeDasharray = '2 10'; r.style.strokeDashoffset = '0'; i++; setTimeout(drive, 120); }
        };
        requestAnimationFrame(step);
      };
      drive();
    }, { threshold: 0.4 }).observe($('.map'));
  } else if (car) car.style.opacity = 0;

  // Momento 4: o vidro embaçado
  const pane = $('#pane'), cv = $('#fog'), sq = $('#sq');
  if (pane && cv.getContext) {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, done = false, lastPt = null, strokes = 0;
    const bar = $('#gBar'), pct = $('#gPct'), doneEl = $('#gDone');
    function fog() {
      const r = pane.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1); W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
      if (!W || !H) return;
      cv.width = W; cv.height = H;
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(250,240,242,.93)'); g.addColorStop(1, 'rgba(236,226,232,.9)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // gotas e manchas de sabão
      let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 260; i++) {
        const x = rnd() * W, y = rnd() * H, rr = (1 + rnd() * 5) * dpr;
        ctx.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.4})`; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(160,130,145,.18)'; ctx.beginPath(); ctx.arc(x + rr * 0.4, y + rr * 0.5, rr * 0.7, 0, 7); ctx.fill();
      }
      ctx.font = `400 ${Math.round(W / 9)}px Shrikhand, serif`; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(232,71,111,.55)';
      ctx.fillText(EN ? 'wipe me' : 'me limpa', W / 2, H / 2);
      ctx.font = `600 ${Math.round(W / 26)}px "DM Sans", sans-serif`; ctx.fillStyle = 'rgba(59,21,48,.55)';
      ctx.fillText('← →', W / 2, H / 2 + W / 12);
    }
    function wipe(a, b) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = Math.max(70, W / 6.5); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (++strokes % 6 === 0) measure();
    }
    function measure() {
      if (done || !W) return;
      const d = ctx.getImageData(0, 0, W, H).data; let clear = 0, n = 0;
      for (let i = 3; i < d.length; i += 4 * 97) { n++; if (d[i] < 40) clear++; }
      const k = Math.round((clear / n) * 100);
      bar.style.width = k + '%'; pct.textContent = k + '%';
      if (k >= 72) finish();
    }
    function finish() {
      done = true; pane.classList.add('done'); bar.style.width = '100%'; pct.textContent = '100%'; doneEl.hidden = false;
      if (hasGsap && !reduce) gsap.from(doneEl, { y: 12, opacity: 0, duration: 0.6 });
    }
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr, cx: e.clientX - r.left, cy: e.clientY - r.top }; };
    const moveSq = (p) => { sq.style.transform = `translate(${p.cx}px, ${p.cy}px)`; };
    cv.addEventListener('pointerdown', (e) => { if (done) return; lastPt = pos(e); pane.classList.add('drag'); moveSq(lastPt); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (!lastPt || done) return; const p = pos(e); wipe(lastPt, p); moveSq(p); lastPt = p; });
    const up = () => { if (lastPt) measure(); lastPt = null; pane.classList.remove('drag'); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    // no celular, arrastar na horizontal limpa; na vertical rola a página (touch-action: pan-y)
    fog();
    if (document.fonts) document.fonts.ready.then(() => { if (!done && !strokes) fog(); });
    let fogW = pane.clientWidth;
    addEventListener('resize', () => { if (!done && Math.abs(pane.clientWidth - fogW) > 40) { fogW = pane.clientWidth; fog(); } });
    // Limpeza automática: o rodo passa em faixas
    function auto() {
      if (done) return;
      pane.classList.add('auto');
      const rows = 5, pts = [];
      for (let r = 0; r < rows; r++) { const y = (H / rows) * (r + 0.5); pts.push([r % 2 ? W : 0, y], [r % 2 ? 0 : W, y]); }
      let i = 0, t0 = performance.now(); const seg = reduce ? 1 : 380;
      let prev = { x: pts[0][0], y: pts[0][1] };
      const step = (t) => {
        if (i >= pts.length - 1) { pane.classList.remove('auto'); finish(); return; }
        const k = Math.min(1, (t - t0) / seg);
        const a = pts[i], b = pts[i + 1];
        const p = { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k };
        wipe(prev, p); prev = p; moveSq({ cx: p.x / dpr, cy: p.y / dpr });
        if (k >= 1) { i++; t0 = t; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    $('#gAuto').addEventListener('click', auto);
    if (reduce) { /* sem animação: o botão continua disponível */ }
  }

  // Conversa: as mensagens chegam uma a uma
  const thread = $$('.thread li');
  if (!reduce) {
    thread.forEach((li) => li.classList.add('pre'));
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      thread.forEach((li, i) => setTimeout(() => li.classList.remove('pre'), 200 + i * 520));
    }, { threshold: 0.3 }).observe($('.thread'));
  }

  // Momento 5: stories com as fotos reais
  const S = window.STORIES, story = $('#story'), sImg = $('#storyImg'), sBars = $('#storyBars'), sCap = $('#storyCap');
  let g = 0, k = 0, timer = null, opener = null;
  const DUR = 4200;
  function show() {
    const grp = S[g]; const it = grp.items[k];
    sImg.src = it.src; sImg.alt = it.alt; sCap.textContent = grp.label + (grp.items.length > 1 && it.cap !== grp.label ? ` · ${it.cap}` : '');
    sBars.innerHTML = grp.items.map((_, i) => `<span class="${i < k ? 'done' : ''}"><i></i></span>`).join('');
    const bar = sBars.children[k].firstChild;
    clearTimeout(timer);
    if (!reduce) { bar.animate([{ width: '0%' }, { width: '100%' }], { duration: DUR, fill: 'forwards' }); timer = setTimeout(next, DUR); }
    else bar.style.width = '100%';
  }
  function next() { if (k < S[g].items.length - 1) k++; else if (g < S.length - 1) { g++; k = 0; } else return close(); show(); }
  function prev() { if (k > 0) k--; else if (g > 0) { g--; k = S[g].items.length - 1; } show(); }
  function open(i, btn) { opener = btn; g = i; k = 0; story.hidden = false; document.body.style.overflow = 'hidden'; if (lenis) lenis.stop(); show(); $('.story-x').focus(); }
  function close() { clearTimeout(timer); story.hidden = true; document.body.style.overflow = ''; if (lenis) lenis.start(); if (opener) opener.focus(); }
  $$('[data-story]').forEach((b) => b.addEventListener('click', () => open(+b.dataset.story, b)));
  $('.story-nav.next').addEventListener('click', next);
  $('.story-nav.prev').addEventListener('click', prev);
  $('.story-x').addEventListener('click', close);
  addEventListener('keydown', (e) => {
    if (story.hidden) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') next(); else if (e.key === 'ArrowLeft') prev();
  });

  // Entradas e detalhes de movimento
  if (hasGsap && !reduce) {
    gsap.from('.hero h1 > *', { yPercent: 60, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' });
    gsap.from('.phone', { y: 60, opacity: 0, rotate: 6, duration: 1.1, delay: 0.25, ease: 'power3.out' });
    $$('.sec-head, .care-copy, .rv-score').forEach((el) => gsap.from(el.children, { y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 82%' } }));
    gsap.from('.ptag', { y: -60, opacity: 0, duration: 1, stagger: 0.12, ease: 'bounce.out', scrollTrigger: { trigger: '.ptags', start: 'top 80%' } });
    gsap.from('.stickers li', { scale: 0.4, opacity: 0, duration: 0.6, clearProps: 'transform,opacity', stagger: { each: 0.04, from: 'random' }, ease: 'back.out(2)', scrollTrigger: { trigger: '.sheet', start: 'top 80%' } });
    gsap.from('.sv-list li', { x: -30, opacity: 0, duration: 0.6, stagger: 0.07, scrollTrigger: { trigger: '.sv-list', start: 'top 85%' } });
    gsap.from('.q', { y: 50, opacity: 0, rotate: (i) => (i ? 3 : -3), duration: 0.9, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.rv-quotes', start: 'top 80%' } });
    gsap.from('.ring', { scale: 0.6, opacity: 0, duration: 0.6, clearProps: 'transform,opacity', stagger: 0.07, ease: 'back.out(2)', scrollTrigger: { trigger: '.rings', start: 'top 90%' } });
    $$('.mo img').forEach((img) => gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.fromTo('.care-img img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.care', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
})();
