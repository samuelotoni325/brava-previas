(() => {
  const C = window.CFG;
  const form = document.getElementById('quote');
  const bubble = document.getElementById('bubble');
  const send = document.getElementById('send');
  const other = document.getElementById('other');
  const tape = document.getElementById('tape');
  const tapeOut = document.getElementById('tapeOut');
  const unsure = document.getElementById('unsure');
  const val = (n) => { const el = form.querySelector(`input[name="${n}"]:checked`); return el ? el.value : null; };
  const fmt = (n) => Number(n).toLocaleString(C.lang === 'pt' ? 'pt-BR' : 'en-US');

  let last = {};
  function fields() {
    const f = [[C.msg.svc, val('svc')]];
    if (C.niche === 'clean') {
      f.push([C.msg.home, val('size')], [C.msg.freq, val('freq')]);
    } else {
      const v = unsure && unsure.checked ? C.unsure : (C.unit === 'rooms' ? `${tape.value} ${C.roomsU}` : `~${fmt(tape.value)} ${C.sqftU}`);
      f.push([C.unit === 'rooms' ? C.msg.rooms : C.msg.area, v], [C.msg.time, val('time')]);
    }
    let city = val('city');
    if (city === '__other') city = other.value.trim() || null;
    f.push([C.msg.city, city]);
    return f.filter(([, v]) => v !== null && v !== '');
  }

  function text(f) {
    return [C.msg.hi, '', ...f.map(([k, v]) => `• ${k}: ${v}`), '', C.msg.from].join('\n');
  }

  function render() {
    const f = fields();
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    bubble.innerHTML = [esc(C.msg.hi), '', ...f.map(([k, v]) => `• ${esc(k)}: <mark${last[k] !== undefined && last[k] !== v ? ' class="flash"' : ''}>${esc(v)}</mark>`), '', esc(C.msg.from)].join('\n');
    last = Object.fromEntries(f);
    const body = encodeURIComponent(text(f));
    const digits = C.tel.replace(/\D/g, '');
    send.href = C.wa ? `https://wa.me/${digits}?text=${body}` : `sms:${C.tel}?&body=${body}`;
    if (C.wa) { send.target = '_blank'; send.rel = 'noopener'; }
  }

  // calendário: quantas visitas nas próximas 4 semanas
  const days = [...document.querySelectorAll('.cal-grid i')];
  function cal() {
    if (!days.length) return;
    const i = [...form.querySelectorAll('input[name="freq"]')].findIndex((x) => x.checked);
    const pick = [[8], [1, 8, 15, 22], [1, 15], [8]][i] || [];
    days.forEach((d, n) => d.classList.toggle('on', pick.includes(n)));
  }

  function tapeRead() {
    if (!tape) return;
    tapeOut.textContent = unsure.checked ? '—' : (C.unit === 'rooms' ? tape.value : fmt(tape.value));
    tape.closest('.tape').classList.toggle('off', unsure.checked);
    tape.disabled = unsure.checked;
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'city') { other.hidden = e.target.value !== '__other'; if (!other.hidden) other.focus(); }
    cal(); tapeRead(); render();
  });
  form.addEventListener('input', () => { tapeRead(); render(); });
  tapeRead(); cal(); render();

  // revelação e momentos ao rolar
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    if (e.target.matches('.checklist ol, .steps ol')) {
      [...e.target.children].forEach((li, n) => setTimeout(() => li.classList.add('done'), 250 + n * 380));
    } else e.target.classList.add('in');
  }), { threshold: 0.35 });
  document.querySelectorAll('.checklist ol, .steps ol').forEach((el) => io.observe(el));
  document.querySelectorAll('.services .card, .proof-in > *, .area .wrap').forEach((el) => { el.classList.add('reveal'); io.observe(el); });
})();
