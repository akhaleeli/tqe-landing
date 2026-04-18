// Hero book-cover subtle 3D tilt on pointer move
(function heroTilt() {
  const cover = document.getElementById('heroCover');
  if (!cover) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const hero = cover.closest('.hero');
  const maxTilt = 6; // degrees

  function onMove(e) {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * maxTilt * 2;
    const rotX = (0.5 - y) * maxTilt * 2;
    cover.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.01)`;
  }
  function onLeave() {
    cover.style.transform = 'rotateX(0) rotateY(0) scale(1)';
  }

  hero.addEventListener('pointermove', onMove);
  hero.addEventListener('pointerleave', onLeave);
})();

// Click-to-copy for bank details
(function copyDetails() {
  document.querySelectorAll('button.copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy || btn.textContent.trim();
      try {
        await navigator.clipboard.writeText(value);
        btn.classList.add('copied');
        const original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = original;
        }, 1400);
      } catch (err) {
        console.warn('Copy failed', err);
      }
    });
  });
})();

// Fade-and-rise reveals
(function scrollReveal() {
  const targets = document.querySelectorAll('.section, .hero__text, .hero__visual');
  targets.forEach(t => t.classList.add('reveal'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    targets.forEach(t => t.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(t => io.observe(t));
})();

// Lightbox — enlarges the sample spread on click
(function lightbox() {
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;

  let lastFocus = null;

  function open(box) {
    lastFocus = document.activeElement;
    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeBtn = box.querySelector('.lightbox__close');
    if (closeBtn) closeBtn.focus();
  }

  function close(box) {
    box.classList.remove('is-open');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  triggers.forEach(trigger => {
    const boxId = trigger.dataset.lightbox;
    const box = document.getElementById(boxId);
    if (!box) return;

    trigger.addEventListener('click', () => open(box));

    const closeBtn = box.querySelector('.lightbox__close');
    if (closeBtn) closeBtn.addEventListener('click', () => close(box));

    box.addEventListener('click', (e) => {
      if (e.target === box) close(box);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && box.classList.contains('is-open')) close(box);
    });
  });
})();
