import { useEffect } from 'react';

export default function useEyes() {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(any-pointer: fine)');
    let pointer = null;
    let frame = 0;
    let previous = 0;
    let eyes = [];
    const collect = () => {
      eyes = [...document.querySelectorAll('[data-eye]')].map(el => ({ el, pupil: el.querySelector('.pupil'), x: 0, y: 0 }));
    };
    collect();
    function render(time) {
      frame = 0;
      const step = Math.min(1, (time - (previous || time - 16)) / 55);
      previous = time;
      let moving = false;
      const updates = eyes.map(eye => {
        const box = eye.el.getBoundingClientRect();
        const dx = pointer ? pointer.x - (box.x + box.width / 2) : 0;
        const dy = pointer ? pointer.y - (box.y + box.height / 2) : 0;
        const angle = Math.atan2(dy, dx);
        const distance = Math.min(1, Math.hypot(dx, dy) / 130);
        const range = Math.min(Number(eye.el.dataset.range) || 4, box.width * .29);
        const x = Math.cos(angle) * distance * range;
        const y = Math.sin(angle) * distance * range;
        eye.x += (x - eye.x) * step;
        eye.y += (y - eye.y) * step;
        moving ||= Math.abs(x - eye.x) + Math.abs(y - eye.y) > .06;
        return { pupil: eye.pupil, transform: `translate(${eye.x.toFixed(2)}px, ${eye.y.toFixed(2)}px)` };
      });
      for (const update of updates) if (update.pupil) update.pupil.style.transform = update.transform;
      if (moving && !document.hidden) frame = requestAnimationFrame(render);
    }
    function request() {
      if (!frame) { previous = 0; frame = requestAnimationFrame(render); }
    }
    function move(event) {
      if (reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
      pointer = { x: event.clientX, y: event.clientY };
      request();
    }
    function reset() { pointer = null; request(); }
    function preferences() {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      for (const eye of eyes) {
        eye.x = 0;
        eye.y = 0;
        if (eye.pupil) eye.pupil.style.transform = 'translate(0px, 0px)';
      }
    }
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    reduced.addEventListener('change', preferences);
    finePointer.addEventListener('change', preferences);
    const observer = new MutationObserver(collect);
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      reduced.removeEventListener('change', preferences);
      finePointer.removeEventListener('change', preferences);
    };
  }, []);
}
