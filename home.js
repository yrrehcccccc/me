(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const layers = [...document.querySelectorAll('[data-reveal]')];
  const photo = document.querySelector('.layer-7');
  const stickers = [...document.querySelectorAll('.layer-15,.layer-16')];
  const ready = elements => Promise.allSettled(elements.map(el => {
    const image = el.querySelector('img');
    return image.complete ? Promise.resolve() : (image.decode?.() ?? Promise.resolve());
  }));
  const show = async element => {
    const group = element === photo ? [photo,...stickers] : [element];
    await ready(group);
    group.forEach(el => el.classList.add('is-visible'));
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      show(entry.target);
    }),{ threshold:.12 });
    layers.filter(el => !stickers.includes(el)).forEach(el => observer.observe(el));
  } else layers.forEach(el => el.classList.add('is-visible'));

  const toys = [...document.querySelectorAll('.toy')];
  const wiggle = element => {
    if (element.classList.contains('is-wiggling')) return;
    element.classList.add('is-wiggling');
    setTimeout(() => element.classList.remove('is-wiggling'),520);
  };
  toys.forEach(el => {
    el.addEventListener('pointerenter',() => wiggle(el));
    el.addEventListener('pointerdown',() => wiggle(el));
    el.addEventListener('click',() => wiggle(el));
  });

  const transition = document.querySelector('.site-transition');
  const frame = transition.querySelector('iframe');
  let leaving = false;
  let pending = [];
  const later = (callback,delay) => { const timer=setTimeout(callback,delay); pending.push(timer); return timer; };
  const reset = () => {
    pending.forEach(clearTimeout); pending=[];
    frame.onload=null;
    frame.removeAttribute('src');
    transition.classList.remove('is-visible','is-loading');
    document.querySelectorAll('.is-opening').forEach(el => el.classList.remove('is-opening'));
    document.body.removeAttribute('aria-busy');
    leaving=false;
  };
  document.querySelectorAll('[data-site-link]').forEach(link => link.addEventListener('click',event => {
    if (event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (reduced.matches) return;
    event.preventDefault();
    if (leaving) return;
    leaving=true;
    document.body.setAttribute('aria-busy','true');
    const url=link.href;
    const folder=link.dataset.folder ? document.querySelector('#folder-'+link.dataset.folder) : null;
    folder?.classList.add('is-opening');
    const minimum=folder?1540:220;
    let allowed=false,loaded=false,shown=false;
    const revealSite = () => {
      if (!allowed || !loaded || shown || !leaving) return;
      shown=true;
      transition.classList.remove('is-loading');
      transition.classList.add('is-visible');
      later(() => location.assign(url),550);
    };
    // Preview only the requested destination while its page fades in, then use its real URL.
    frame.onload=() => { loaded=true; revealSite(); };
    frame.src=url;
    later(() => { allowed=true; revealSite(); },minimum);
    // A blocked or slow embedded page must never strand an otherwise ordinary link.
    later(() => {
      if (shown || !leaving) return;
      transition.classList.add('is-loading','is-visible');
      later(() => location.assign(url),550);
    },4500);
  }));
  addEventListener('keydown',event => { if (event.key==='Escape' && leaving) reset(); });
  addEventListener('pageshow',reset);
  addEventListener('pagehide',() => { pending.forEach(clearTimeout); pending=[]; });
})();
