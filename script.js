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
