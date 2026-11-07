/* =====================================================================
   MultiSign Digital — script.js
   Sin dependencias: todo es JavaScript nativo (la página no depende de
   ninguna CDN). Cada módulo está aislado con safe() para que un fallo
   no rompa los demás.
   ===================================================================== */
(() => {
  'use strict';

  /* Avisa al <head> de que el script arrancó (si no, retira la clase "js"
     a los 4 s y el contenido queda visible igualmente). */
  window.__ms = true;

  /* ===== CONFIGURACIÓN ================================================
     ÚNICO lugar donde vive el número de WhatsApp (lada 52 + 10 dígitos).
     Si estuviera vacío, el botón flotante, los CTA y el envío del
     formulario se ocultan solos. */
  const WHATSAPP = '525527454909';

  /* ===== Utilidades ================================================== */
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = window.matchMedia('(min-width: 960px)');
  const safe = (fn) => { try { fn(); } catch (err) { console.warn('[MultiSign]', err); } };
  const waLink = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

  /* ===== 1. WhatsApp: enlaces de los CTA ============================== */
  function initWhatsApp() {
    if (!WHATSAPP) {
      root.classList.add('no-wa');
      const note = $('#formNote');
      if (note) note.textContent = 'Por ahora te esperamos en nuestra dirección. Pronto habilitaremos el contacto en línea.';
      return;
    }
    $$('[data-wa]').forEach((a) => {
      a.href = waLink(a.dataset.wa);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  /* ===== 2. Cargador (termina en ≈2.2 s; el CSS lo oculta a los 2.5 s) = */
  function initPreloader() {
    const pre = $('#preloader');
    const num = $('#plNum');
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      root.classList.add('ready');                 // arranca la entrada del hero
      if (!pre) return;
      pre.classList.add('is-done');
      pre.setAttribute('aria-hidden', 'true');
      setTimeout(() => { pre.style.display = 'none'; }, 820);
    };

    if (!pre || reduced) {
      finish();
      if (pre) pre.style.display = 'none';
      return;
    }
    const DURATION = 1450;
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / DURATION);
      const e = 1 - Math.pow(1 - t, 2.2);
      pre.style.setProperty('--pl', (e * 100).toFixed(1));
      if (num) num.textContent = Math.round(e * 100);
      if (t < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
    setTimeout(finish, 2000);                      // seguro por si rAF se pausa
  }

  /* ===== 3. Menú móvil ================================================ */
  function initMenu() {
    const burger = $('.burger');
    const nav = $('#nav');
    if (!burger || !nav) return;
    const set = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    window.matchMedia('(min-width: 1120px)').addEventListener('change', (e) => { if (e.matches) set(false); });
  }

  /* ===== 4. Scroll-spy del menú ======================================= */
  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const links = $$('.nav__list a');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.removeAttribute('aria-current'));
        const a = map.get(en.target.id);
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    const hero = document.getElementById('inicio');
    if (hero) io.observe(hero);
  }

  /* ===== 5. Revelados al hacer scroll ================================= */
  function initReveals() {
    // Titulares: cada palabra sube dentro de una máscara.
    $$('[data-split]').forEach((h) => {
      const words = h.textContent.trim().replace(/\s+/g, ' ').split(' ');
      h.textContent = '';
      words.forEach((word, i) => {
        const box = document.createElement('span');
        box.className = 'w';
        const inner = document.createElement('span');
        inner.className = 'w__i';
        inner.style.setProperty('--wi', i);
        inner.textContent = word;
        box.appendChild(inner);
        h.appendChild(box);
        if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
      });
      h.classList.add('sp');
    });
    // Hijos escalonados.
    $$('[data-stagger]').forEach((parent) => {
      Array.from(parent.children).forEach((child, i) => {
        child.classList.add('rv');
        child.style.setProperty('--d', (i * 0.09).toFixed(2));
      });
    });

    const targets = $$('.rv, .sp');
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('in');
        io.unobserve(el);
        if (el.classList.contains('rv')) {
          // Al terminar la transición se retira la clase para no estorbar
          // a las transiciones propias del elemento (tilt, hover…).
          const d = parseFloat(el.style.getPropertyValue('--d')) || 0;
          setTimeout(() => el.classList.remove('rv', 'in'), (d + 1.25) * 1000);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ===== 6. Contadores ================================================ */
  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length || reduced || !('IntersectionObserver' in window)) return;
    const run = (el) => {
      const end = parseInt(el.dataset.count, 10);
      if (Number.isNaN(end)) return;
      const t0 = performance.now();
      const D = 1600;
      const tick = (now) => {
        const t = clamp((now - t0) / D);
        el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ===== 7. Hero: halftone de puntos que nunca deja de moverse ======== */
  function initHeroDots() {
    const canvas = $('.hero__dots');
    const hero = $('.hero');
    if (!canvas || !hero || !canvas.getContext || !window.Path2D) return;
    const ctx = canvas.getContext('2d');
    const TAU = Math.PI * 2;
    let W = 1, H = 1, gap = 30, cols = 0, rows = 0;
    let visible = true, hasPointer = false;
    let tx = -9999, ty = -9999, mx = -9999, my = -9999;

    const resize = () => {
      const r = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = W < 700 ? 24 : 30;
      cols = Math.ceil(W / gap) + 2;
      rows = Math.ceil(H / gap) + 2;
    };

    const draw = (ms) => {
      const t = ms * 0.001;
      ctx.clearRect(0, 0, W, H);
      if (!hasPointer) {                       // sin puntero, un "escáner" recorre el hero solo
        tx = W * (0.58 + 0.36 * Math.sin(t * 0.45));
        ty = H * (0.46 + 0.3 * Math.cos(t * 0.62));
      }
      mx += (tx - mx) * 0.1;
      my += (ty - my) * 0.1;
      const ink = new Path2D();
      const yel = new Path2D();
      const red = new Path2D();
      for (let j = 0; j < rows; j++) {
        const y = j * gap;
        const off = (j & 1) ? gap / 2 : 0;
        for (let i = 0; i < cols; i++) {
          const x = i * gap + off - gap / 2;
          const w = Math.sin(x * 0.011 + t * 1.1) + Math.cos(y * 0.013 - t * 0.9) + Math.sin((x + y) * 0.006 + t * 0.6);
          const dx = x - mx;
          const dy = y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          let r = 1 + ((w + 3) / 6) * 2.4;
          if (d < 190) r += (1 - d / 190) * 5.5;
          const p = (d < 95 || w > 2.15) ? red : ((d < 150 || w > 1.7) ? yel : ink);
          p.moveTo(x + r, y);
          p.arc(x, y, r, 0, TAU);
        }
      }
      ctx.fillStyle = 'rgba(18,20,23,.16)'; ctx.fill(ink);
      ctx.fillStyle = 'rgba(255,196,0,.9)'; ctx.fill(yel);
      ctx.fillStyle = 'rgba(216,38,28,.88)'; ctx.fill(red);
    };

    resize();
    window.addEventListener('resize', resize);
    if (reduced) { draw(0); return; }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);
    }
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      hasPointer = true;
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { hasPointer = false; });
    const loop = (ms) => {
      if (visible && !document.hidden) draw(ms);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ===== 8. Efectos de puntero: órbita, imanes, tilt y foco =========== */
  function initPointerFx() {
    if (!finePointer || reduced) return;

    const hero = $('.hero');
    const orb = $('[data-orb]');
    if (hero && orb) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        orb.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        orb.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      hero.addEventListener('pointerleave', () => { orb.style.setProperty('--px', 0); orb.style.setProperty('--py', 0); });
    }

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--tx', ((e.clientX - (r.left + r.width / 2)) * 0.18).toFixed(1) + 'px');
        el.style.setProperty('--ty', ((e.clientY - (r.top + r.height / 2)) * 0.28).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', () => { el.style.removeProperty('--tx'); el.style.removeProperty('--ty'); });
    });

    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((px - 0.5) * 10).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
    });

    $$('[data-spot]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--sx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--sy', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ===== 9. Bucle de scroll: todo lo que reacciona a la posición ====== */
  function initScrollMotion() {
    const bar = $('.progress i');
    const header = $('.site-header');
    const expand = $('[data-expand]');
    const heroVisual = $('.hero__visual');
    const timeline = $('[data-timeline]');
    const steps = timeline ? $$('.step', timeline) : [];
    const cards = $$('.stack .card');
    const marquees = $$('.marquee').map((m) => ({ m, track: $('.marquee__track', m), group: $('.marquee__group', m) }));

    // Manifiesto: cada palabra se enciende con el scroll.
    const manifesto = $('[data-words]');
    let words = [];
    if (manifesto) {
      const list = manifesto.textContent.trim().replace(/\s+/g, ' ').split(' ');
      manifesto.textContent = '';
      words = list.map((w, i) => {
        const s = document.createElement('span');
        s.className = 'mw' + (reduced ? ' on' : '');
        s.textContent = w;
        manifesto.appendChild(s);
        if (i < list.length - 1) manifesto.appendChild(document.createTextNode(' '));
        return s;
      });
    }

    // Duración de cada cinta según su ancho y su data-speed (px/seg).
    const setMarquees = () => {
      marquees.forEach(({ m, track, group }) => {
        if (!track || !group) return;
        const w = group.getBoundingClientRect().width;
        const speed = parseFloat(m.dataset.speed) || 50;
        if (w) track.style.setProperty('--dur', (w / speed).toFixed(2) + 's');
      });
    };
    setMarquees();
    window.addEventListener('load', setMarquees);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setMarquees);

    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    let dirty = true;
    let timer = 0;
    window.addEventListener('resize', () => { dirty = true; clearTimeout(timer); timer = setTimeout(setMarquees, 150); });

    const update = (y) => {
      const vh = window.innerHeight;
      const max = root.scrollHeight - vh;

      if (bar) bar.style.setProperty('--sp', max > 0 ? clamp(y / max).toFixed(4) : '0');
      if (header) header.classList.toggle('is-stuck', y > 24);
      if (heroVisual && y < vh * 1.3) heroVisual.style.setProperty('--hy', (y * 0.1).toFixed(1) + 'px');

      // Imagen que se abre en grande, anclada (sticky) mientras dura el scroll.
      if (expand) {
        const r = expand.getBoundingClientRect();
        if (r.bottom > -120 && r.top < vh + 120) {
          const total = r.height - vh;
          const raw = clamp((-r.top + vh * 0.35) / (total + vh * 0.35));
          expand.style.setProperty('--p', reduced ? '1' : ease(clamp(raw / 0.72)).toFixed(4));
        }
      }

      // Manifiesto.
      if (manifesto && !reduced) {
        const r = manifesto.getBoundingClientRect();
        if (r.bottom > -100 && r.top < vh + 100) {
          const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.42));
          const n = Math.round(p * words.length * 1.06);
          words.forEach((w, i) => w.classList.toggle('on', i < n));
        }
      }

      // Línea de tiempo del proceso.
      if (timeline) {
        const r = timeline.getBoundingClientRect();
        if (r.bottom > -100 && r.top < vh + 100) {
          timeline.style.setProperty('--tl', reduced ? '1' : clamp((vh * 0.62 - r.top) / r.height).toFixed(3));
          steps.forEach((s) => {
            const sr = s.getBoundingClientRect();
            s.classList.toggle('on', reduced || sr.top + sr.height * 0.35 < vh * 0.62);
          });
        }
      }

      // Pila de pliegos (solo escritorio, donde las tarjetas son sticky):
      // la tarjeta anterior se encoge y se oscurece cuando la siguiente la tapa.
      if (wide.matches && !reduced) {
        cards.forEach((c, i) => {
          const next = cards[i + 1];
          if (!next) { c.style.removeProperty('--cp'); return; }
          const nextPin = 88 + (i + 1) * 16;          // mismo "top" sticky que el CSS
          const d = next.getBoundingClientRect().top - nextPin;
          c.style.setProperty('--cp', clamp(1 - d / c.offsetHeight).toFixed(3));
        });
      }
    };

    // Bucle único: aplica el scroll y suaviza la velocidad de las cintas.
    let lastY = -1;
    let prevY = window.scrollY;
    let vel = 0;
    let rate = 1;
    const frame = () => {
      const y = window.scrollY;
      if (y !== lastY || dirty) { update(y); lastY = y; dirty = false; }
      if (!reduced) {
        vel += (Math.abs(y - prevY) - vel) * 0.12;
        prevY = y;
        const target = 1 + Math.min(5, vel * 0.28);  // las cintas aceleran al hacer scroll
        rate += (target - rate) * 0.08;
        marquees.forEach((mq) => {
          if (!mq.track || !mq.track.getAnimations) return;
          const a = mq.track.getAnimations()[0];
          if (a && Math.abs(a.playbackRate - rate) > 0.02) a.playbackRate = rate;
        });
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ===== 10. Formulario → WhatsApp ==================================== */
  function initForm() {
    const form = $('#cotizador');
    if (!form) return;
    const note = $('#formNote');
    const nombre = $('#f-nombre');
    const servicio = $('#f-servicio');
    const detalle = $('#f-detalle');
    const errs = { nombre: $('#e-nombre'), servicio: $('#e-servicio') };
    const inputs = { nombre, servicio };
    nombre.setAttribute('aria-describedby', 'e-nombre');
    servicio.setAttribute('aria-describedby', 'e-servicio');

    const setErr = (key, msg) => {
      errs[key].textContent = msg;
      inputs[key].closest('.field').classList.toggle('has-err', Boolean(msg));
      inputs[key].setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    nombre.addEventListener('input', () => { if (nombre.value.trim().length >= 2) setErr('nombre', ''); });
    servicio.addEventListener('change', () => { if (servicio.value) setErr('servicio', ''); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = nombre.value.trim();
      const s = servicio.value;
      setErr('nombre', n.length < 2 ? 'Cuéntanos cómo te llamas para atenderte mejor.' : '');
      setErr('servicio', s ? '' : 'Elige qué te gustaría cotizar.');
      if (n.length < 2) { nombre.focus(); return; }
      if (!s) { servicio.focus(); return; }
      if (!WHATSAPP) return;

      const checked = form.querySelector('input[name="cuando"]:checked');
      const cuando = checked ? checked.value : '';
      const extra = detalle.value.trim();
      const msg = [
        `Hola MultiSign Digital, soy ${n}.`,
        `Quiero cotizar: ${s}.`,
        cuando ? `Lo necesito para: ${cuando}.` : '',
        extra ? `Detalles: ${extra}` : '',
        'Gracias.'
      ].filter(Boolean).join('\n');

      if (note) note.textContent = 'Abriendo WhatsApp con tu mensaje listo…';
      const a = document.createElement('a');
      a.href = waLink(msg);
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  /* ===== 11. Movimiento reducido: congela las animaciones SMIL ======== */
  function initReducedMotion() {
    if (!reduced) return;
    $$('svg').forEach((svg) => { if (svg.pauseAnimations) svg.pauseAnimations(); });
  }

  /* ===== Arranque ===================================================== */
  [
    initWhatsApp,
    initPreloader,
    initMenu,
    initReveals,
    initCounters,
    initScrollSpy,
    initHeroDots,
    initPointerFx,
    initScrollMotion,
    initForm,
    initReducedMotion
  ].forEach(safe);
})();
