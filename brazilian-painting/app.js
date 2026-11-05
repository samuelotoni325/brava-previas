(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const EN = main.dataset.lang === 'en';
  const T = (a, b) => (EN ? a : b);
  const PHONE = main.dataset.phone;
  const SIZES = window.BP_SIZES || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smsHref = text => `sms:+${PHONE}?&body=${encodeURIComponent(text)}`;

  // Rolagem suave
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.11 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  }
  const goTo = sel => { const el = typeof sel === 'string' ? $(sel) : sel; if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -80 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = $(id); if (!el) return; e.preventDefault(); goTo(el);
  }));

  // Cabeçalho, menu, etiqueta de prévia e barra fixa
  const hd = $('#hd'), tag = $('.preview-tag'), dock = $('.dock'), est = $('#est');
  const onScroll = () => {
    hd.classList.toggle('solid', scrollY > 20);
    tag.classList.toggle('away', scrollY > innerHeight * .6);
    if (dock) { const r = est.getBoundingClientRect(); dock.classList.toggle('on', r.bottom < 0 || r.top > innerHeight); }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), mnav = $('#mnav');
  const setMenu = open => { burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? T('Close menu', 'Fechar menu') : T('Open menu', 'Abrir menu')); mnav.hidden = !open; document.body.style.overflow = open ? 'hidden' : ''; if (lenis) open ? lenis.stop() : lenis.start(); };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mnav.hidden) setMenu(false); });

  // Ficha de orçamento
  const f = est;
  const no = 'BP-' + String(Date.now()).slice(-4);
  $('[data-no]', f).textContent = no;
  const r = n => f.querySelector(`input[name="${n}"]:checked`);
  const v = n => (f.elements[n]?.value || '').trim();
  const town = () => { const t = r('town'); return t ? (t.dataset.other !== undefined ? v('otherTown') : t.value) : ''; };
  const renderSizes = () => {
    const s = r('svc'); const box = $('[data-sizes]', f); if (!s) return;
    const prev = r('size')?.value;
    const cfg = SIZES[s.dataset.id] || { unit: '', sizes: [] };
    $('[data-unit]', f).textContent = cfg.unit;
    box.innerHTML = cfg.sizes.map(z => `<label class="chip"><input type="radio" name="size" value="${z.replace(/"/g, '&quot;')}"><span>${z}</span></label>`).join('');
    if (prev) { const p = [...box.querySelectorAll('input')].find(i => i.value === prev); if (p) p.checked = true; }
  };
  const msg = () => [
    T('Hi Brazilian Painting! I found you on your website and I’d like an estimate.', 'Olá, Brazilian Painting! Vim pelo site e gostaria de um orçamento.'),
    r('svc') ? `${T('Service', 'Serviço')}: ${r('svc').value}` : null,
    r('size') ? `${SIZES[r('svc')?.dataset.id]?.unit || T('Size', 'Tamanho')}: ${r('size').value}` : null,
    town() ? `${T('Town', 'Cidade')}: ${town()}` : null,
    v('color') ? `${T('Color idea', 'Ideia de cor')}: ${v('color')}` : null,
    v('notes') ? `${T('Details', 'Detalhes')}: ${v('notes')}` : null,
    v('name') ? `${T('Name', 'Nome')}: ${v('name')}` : null,
    `${T('Estimate ticket', 'Ficha')} ${no}. ${T('I’ll attach photos.', 'Vou anexar fotos.')}`,
  ].filter(Boolean).join('\n');
  const refresh = e => {
    if (e && e.target.name === 'svc') renderSizes();
    const s = r('svc'), z = r('size'), t = r('town');
    const other = f.querySelector('[data-other]');
    $('[data-other-fld]', f).hidden = !(other && other.checked);
    if (e && e.target === other && other.checked) $('[data-other-fld] input', f).focus();
    if (s) f.style.setProperty('--band', s.dataset.c);
    $('[data-f="svc"]', f).textContent = s ? `${s.dataset.code} · ${s.value}` : '—';
    $('[data-f="size"]', f).textContent = z ? z.value : '—';
    $('[data-f="town"]', f).textContent = town() || '—';
    const m = msg();
    $('[data-sms]', f).href = smsHref(m);
    $('[data-preview]', f).textContent = m;
    const hint = $('[data-hint]', f); hint.classList.remove('err');
    hint.textContent = !s ? T('Pick a job to start. Once the text opens, attach photos of the walls.', 'Escolha o serviço para começar. Quando a mensagem abrir, anexe fotos das paredes.')
      : !z ? T('Good. Roughly how much?', 'Boa. Mais ou menos quanto?')
        : !t ? T('Last tap: which town?', 'Último toque: qual cidade?')
          : T('Ready. Tap “Text my estimate”, attach photos and send.', 'Pronto. Toque em “Enviar por mensagem”, anexe fotos e envie.');
  };
  f.addEventListener('change', refresh);
  f.addEventListener('input', e => { if (e.target.type !== 'radio') refresh(); });
  f.addEventListener('submit', e => e.preventDefault());
  $('[data-sms]', f).addEventListener('click', e => {
    if (!r('svc')) {
      e.preventDefault();
      const h = $('[data-hint]', f); h.textContent = T('Pick the job first (step 1).', 'Escolha primeiro o serviço (passo 1).'); h.classList.add('err');
      $('input[name="svc"]', f).focus();
    }
  });
  refresh();
  const pick = id => {
    const inp = f.querySelector(`input[name="svc"][data-id="${id}"]`); if (!inp) return;
    inp.checked = true; renderSizes(); refresh(); goTo(f);
  };
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => pick(b.dataset.pick)));

  // Sala: tampa de tinta muda a parede
  const room = $('[data-room]');
  if (room) {
    let mode = 'accent', name = $('.lid.on')?.dataset.name || '';
    const sync = () => {
      $('[data-pickname]').textContent = name;
      $('[data-pickmode]').textContent = mode === 'accent' ? T('accent wall', 'parede de destaque') : T('whole room', 'sala inteira');
    };
    const roll = () => { if (reduce) return; room.classList.remove('rolling'); void room.offsetWidth; room.classList.add('rolling'); };
    $$('.lid').forEach(l => l.addEventListener('click', () => {
      $$('.lid').forEach(x => { x.classList.toggle('on', x === l); x.setAttribute('aria-checked', x === l); });
      room.style.setProperty('--wall', l.dataset.color);
      if (room.dataset.trim === 'match') room.style.setProperty('--trim', l.dataset.color);
      name = l.dataset.name; sync(); roll();
    }));
    $$('[data-mode]').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode; room.classList.toggle('all', mode === 'room');
      $$('[data-mode]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); sync(); roll();
    }));
    $$('[data-trim]').forEach(b => b.addEventListener('click', () => {
      room.dataset.trim = b.dataset.trim;
      room.style.setProperty('--trim', b.dataset.trim === 'match' ? getComputedStyle(room).getPropertyValue('--wall') : '#fbf8f2');
      $$('[data-trim]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    }));
    $('[data-usecolor]').addEventListener('click', () => {
      const where = mode === 'accent' ? T('accent wall', 'parede de destaque') : T('whole room', 'sala inteira');
      f.elements.color.value = `${name} (${where})`;
      $('.tk-more', f).open = true;
      if (!r('svc')) { const i = f.querySelector('input[data-id="interior"]'); i.checked = true; renderSizes(); }
      refresh(); goTo(f);
    });
    sync();
  }

  // Drywall: cinco etapas, com troca automática enquanto visível
  const psvg = $('[data-patch]');
  if (psvg) {
    const tabs = $$('.patch-tabs [data-step]'); const desc = JSON.parse($('[data-stepsd]').textContent);
    let cur = 0, timer = null, manual = false;
    const set = i => {
      cur = i; psvg.setAttribute('class', `patch-svg s${i}`);
      tabs.forEach((t, k) => t.setAttribute('aria-selected', k === i));
      $('[data-stepd]').textContent = desc[i]; $('[data-stepn]').textContent = i + 1;
    };
    tabs.forEach(t => t.addEventListener('click', () => { manual = true; clearInterval(timer); set(+t.dataset.step); }));
    if (!reduce) new IntersectionObserver(([en]) => {
      clearInterval(timer);
      if (en.isIntersecting && !manual) timer = setInterval(() => set((cur + 1) % 5), 2300);
    }, { threshold: .5 }).observe(psvg);
  }

  // Revelações e lista da vistoria
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add(e.target.matches('.pad, .final, .svc-row') ? (e.target.matches('.svc-row') ? 'seen' : 'on') : 'in'); io.unobserve(e.target); } }), { threshold: .3 });
  $$('.pad, .final, .svc-row').forEach(el => io.observe(el));
  if (!reduce) {
    $$('.sec-head, .wk, .how-list li, .rv, .faq-list, .area-grid > *').forEach(el => { el.classList.add('rv-up'); io.observe(el); });
  }

  // O recorte: pincel corre a borda do teto, depois o rolo cobre a parede
  const brush = $('.cut-brush'), loupe = $('.cut-loupe'), reveal = $('.cut-reveal'), rollR = $('.roll-reveal'), rollerC = $('.roller-c');
  const csteps = $$('.cut-steps li');
  const drawCut = p => {
    const a = Math.min(p / .66, 1); const x = a * 820; const b = Math.max(0, Math.min(1, (p - .7) / .28));
    reveal.setAttribute('width', x);
    rollR.setAttribute('height', b * 322);
    brush.setAttribute('transform', `translate(${Math.min(x, 806)} 0)`);
    brush.style.opacity = p > .68 ? 0 : 1;
    loupe.setAttribute('transform', `translate(${Math.min(Math.max(x + 200, 200), 880)} 116)`);
    loupe.style.opacity = p > .66 || p < .02 ? 0 : 1;
    rollerC.setAttribute('opacity', p > .7 && p < .99 ? 1 : 0);
    const rows = b * 4; const rx = 120 + (Math.floor(rows) % 2 ? 1 - rows % 1 : rows % 1) * 580;
    rollerC.setAttribute('transform', `translate(${rx} ${300 + b * 250})`);
    const st = p < .04 ? 0 : p < .68 ? 1 : 2; csteps.forEach((l, k) => l.classList.toggle('on', k === st));
  };
  if (brush) {
    if (reduce || !window.gsap || !window.ScrollTrigger) drawCut(1);
    else {
      gsap.registerPlugin(ScrollTrigger);
      drawCut(0);
      ScrollTrigger.create({ trigger: '.cut', start: 'top top', end: '+=140%', pin: '.cut-stage', scrub: .6, onUpdate: s => drawCut(s.progress) });
    }
  }
})();
