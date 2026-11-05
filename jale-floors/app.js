(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const EN = main.dataset.lang === 'en';
  const T = (a, b) => (EN ? a : b);
  const PHONE = main.dataset.phone;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const smsHref = text => `sms:+${PHONE}?&body=${encodeURIComponent(text)}`;

  // Rolagem suave
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  }
  const goTo = el => { if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -76 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = $(id); if (!el) return; e.preventDefault(); goTo(el);
  }));

  // Cabeçalho, menu, etiqueta e barra fixa
  const hd = $('#hd'), tag = $('.preview-tag'), dock = $('.dock'), f = $('#est');
  const onScroll = () => {
    hd.classList.toggle('solid', scrollY > 20);
    tag.classList.toggle('away', scrollY > innerHeight * .6);
    const r = f.getBoundingClientRect(); dock.classList.toggle('on', r.bottom < 0 || r.top > innerHeight);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), mnav = $('#mnav');
  const setMenu = open => { burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? T('Close menu', 'Fechar menu') : T('Open menu', 'Abrir menu')); mnav.hidden = !open; document.body.style.overflow = open ? 'hidden' : ''; hd.classList.toggle('solid', open || scrollY > 20); if (lenis) open ? lenis.stop() : lenis.start(); };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mnav.hidden) setMenu(false); });

  // Prancha de orçamento
  const r = n => f.querySelector(`input[name="${n}"]:checked`);
  const v = n => (f.elements[n]?.value || '').trim();
  const town = () => { const t = r('town'); return t ? (t.dataset.other !== undefined ? v('otherTown') : t.value) : ''; };
  const msg = () => [
    T('Hi Jale Floors! I found you on your website and I’d like an estimate for a tile job.', 'Olá, Jale Floors! Vim pelo site e gostaria de um orçamento de revestimento.'),
    r('svc') ? `${T('Project', 'Projeto')}: ${r('svc').value}` : null,
    r('size') ? `${T('Size', 'Tamanho')}: ${r('size').value}` : null,
    town() ? `${T('Town', 'Cidade')}: ${town()}` : null,
    r('tile') ? `${T('Tile', 'Revestimento')}: ${r('tile').value}` : null,
    v('notes') ? `${T('Details', 'Detalhes')}: ${v('notes')}` : null,
    v('name') ? `${T('Name', 'Nome')}: ${v('name')}` : null,
    T('I’ll attach photos of the space.', 'Vou anexar fotos do espaço.'),
  ].filter(Boolean).join('\n');
  const refresh = e => {
    const s = r('svc'), z = r('size'), t = r('town');
    const other = f.querySelector('[data-other]');
    $('[data-other-fld]', f).hidden = !(other && other.checked);
    if (e && e.target === other && other.checked) $('[data-other-fld] input', f).focus();
    const m = msg();
    $('[data-sms]', f).href = smsHref(m);
    $('[data-preview]', f).textContent = m;
    const hint = $('[data-hint]', f); hint.classList.remove('err');
    hint.textContent = !s ? T('Start with the project. When the text opens, attach photos of the space.', 'Comece pelo projeto. Quando a mensagem abrir, anexe fotos do espaço.')
      : !z ? T('Got it. About how many square feet?', 'Certo. Mais ou menos quantos pés quadrados?')
        : !t ? T('Last tap: where is it?', 'Último toque: onde fica?')
          : T('Ready. Tap “Text my estimate”, attach photos and send.', 'Pronto. Toque em “Enviar por mensagem”, anexe fotos e envie.');
  };
  f.addEventListener('change', refresh);
  f.addEventListener('input', e => { if (e.target.type !== 'radio') refresh(); });
  f.addEventListener('submit', e => e.preventDefault());
  $('[data-sms]', f).addEventListener('click', e => {
    if (!r('svc')) {
      e.preventDefault();
      const h = $('[data-hint]', f); h.textContent = T('Pick the project first (step 1).', 'Escolha primeiro o projeto (passo 1).'); h.classList.add('err');
      $('input[name="svc"]', f).focus();
    }
  });
  refresh();
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => {
    const inp = f.querySelector(`input[name="svc"][data-id="${b.dataset.pick}"]`); if (!inp) return;
    inp.checked = true; refresh(); goTo(f);
  }));

  // Revelações
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add(e.target.matches('.final') ? 'on' : 'in'); io.unobserve(e.target); } }), { threshold: .25 });
  io.observe($('.final'));
  if (!reduce) $$('.sec-head, .wt, .rq, .how-list li, .faq-list, .area-grid > *, .fix-copy').forEach(el => { el.classList.add('rv-up'); io.observe(el); });

  // Peças que viram: antes e depois
  const grid = $('[data-flipgrid]'), flipBtn = $('[data-flip]');
  const setFlip = on => {
    grid.classList.toggle('on', on); flipBtn.setAttribute('aria-pressed', on);
    $('[data-fliplabel]').textContent = on ? T('Show the before', 'Ver o antes') : T('Show the redo', 'Ver o refeito');
    $('[data-fixstate]').textContent = on ? T('After: Jale Floors', 'Depois: Jale Floors') : T('Before: previous contractor', 'Antes: outro profissional');
  };
  let touched = false;
  flipBtn.addEventListener('click', () => { touched = true; setFlip(!grid.classList.contains('on')); });
  if (!reduce) new IntersectionObserver(([e]) => { if (e.isIntersecting && !touched) setTimeout(() => { if (!touched) setFlip(true); }, 1400); }, { threshold: .6 }).observe(grid);

  // Nível de bolha: o ponteiro inclina a régua; na rolagem, a velocidade mexe a bolha
  const tool = $('[data-level]'), read = $('[data-lvread]');
  let tilt = 0, settle = null;
  const setTilt = deg => {
    tilt = Math.max(-4, Math.min(4, deg));
    tool.style.setProperty('--tilt', tilt.toFixed(2) + 'deg');
    tool.style.setProperty('--bx', (tilt * 26).toFixed(1) + 'px');
    const ok = Math.abs(tilt) < .35;
    tool.classList.toggle('true', ok);
    read.textContent = ok ? T('Level', 'No nível') : `${Math.abs(tilt).toFixed(1)}° ${T('off', 'fora')}`;
  };
  if (!reduce) {
    if (fine) tool.closest('.level').addEventListener('pointermove', e => {
      const rc = tool.getBoundingClientRect(); const dx = (e.clientX - (rc.left + rc.width / 2)) / (rc.width / 2);
      setTilt(Math.abs(dx) < .12 ? 0 : dx * 3.5);
    });
    let lastY = scrollY;
    addEventListener('scroll', () => {
      const rc = tool.getBoundingClientRect(); if (rc.bottom < 0 || rc.top > innerHeight) { lastY = scrollY; return; }
      const dv = scrollY - lastY; lastY = scrollY;
      setTilt(tilt * .6 + dv * .05);
      clearTimeout(settle); settle = setTimeout(() => setTilt(0), 260);
    }, { passive: true });
  }

  // Showroom: setas
  const row = $('[data-showrow]');
  $$('[data-show]').forEach(b => b.addEventListener('click', () => row.scrollBy({ left: +b.dataset.show * (row.querySelector('.sf').offsetWidth + 14), behavior: reduce ? 'auto' : 'smooth' })));

  // Camadas: separadas pela rolagem, com o item da lista aceso
  const svg = $('.ly-svg'), items = $$('.ly-list li');
  const drawLayers = p => {
    const sp = Math.min(1, p / .3) * 46;
    svg.style.setProperty('--sp', sp.toFixed(1));
    const k = Math.min(4, Math.floor(p * 5.2));
    items.forEach(li => li.classList.toggle('on', +li.dataset.ly === 4 - k || reduce));
    $$('.ly', svg).forEach((g, i) => g.classList.toggle('on', i === 4 - k && !reduce));
  };
  if (reduce || !window.gsap || !window.ScrollTrigger) { svg.style.setProperty('--sp', 34); items.forEach(li => li.classList.add('on')); }
  else {
    gsap.registerPlugin(ScrollTrigger);
    drawLayers(0);
    ScrollTrigger.create({ trigger: '.layers', start: 'top top', end: '+=160%', pin: '.ly-stage', scrub: .5, onUpdate: s => drawLayers(s.progress) });
  }
})();
