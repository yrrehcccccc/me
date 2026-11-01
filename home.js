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

(() => {
  'use strict';
  const board=document.querySelector('.scrapbook');if(!board)return;
  const pieces=[...board.querySelectorAll('[data-layer="7"],[data-layer="8"],[data-layer="9"],[data-layer="13"]')];
  const states=new Map(pieces.map(el=>[el,{x:0,y:0,width:board.clientWidth,suppressUntil:0}]));
  let gesture=null;
  const clamp=(value,min,max)=>Math.min(Math.max(value,min),Math.max(min,max));
  const place=(el,x,y)=>{
    const state=states.get(el);
    state.x=clamp(x,-el.offsetLeft,board.clientWidth-el.offsetLeft-el.offsetWidth);
    state.y=clamp(y,-el.offsetTop,board.clientHeight-el.offsetTop-el.offsetHeight);
    el.style.setProperty('--drag-x',state.x+'px');el.style.setProperty('--drag-y',state.y+'px');
  };
  const activate=()=>{
    if(!gesture)return;
    gesture.active=true;clearTimeout(gesture.timer);
    gesture.el.classList.add('is-dragging');gesture.el.classList.remove('is-wiggling');
    if(gesture.kind==='pointer')try{gesture.el.setPointerCapture(gesture.id);}catch{}
  };
  const finish=()=>{
    if(!gesture)return;
    clearTimeout(gesture.timer);
    if(gesture.active)states.get(gesture.el).suppressUntil=performance.now()+800;
    gesture.el.classList.remove('is-dragging');
    if(gesture.kind==='pointer')try{gesture.el.releasePointerCapture(gesture.id);}catch{}
    gesture=null;
  };
  const begin=(el,kind,id,x,y)=>{
    finish();const state=states.get(el);state.suppressUntil=0;
    gesture={el,kind,id,startX:x,startY:y,x:state.x,y:state.y,active:false,timer:0};
    gesture.timer=setTimeout(activate,kind==='touch'?240:180);
  };
  const move=(x,y,event)=>{
    if(!gesture)return;
    const dx=x-gesture.startX,dy=y-gesture.startY;
    if(!gesture.active){
      if(gesture.kind==='touch' && Math.hypot(dx,dy)>9){finish();return;}
      if(gesture.kind==='pointer' && Math.hypot(dx,dy)>4)activate();
    }
    if(!gesture?.active)return;
    if(event.cancelable)event.preventDefault();
    place(gesture.el,gesture.x+dx,gesture.y+dy);
  };
  for(const el of pieces){
    el.classList.add('draggable');el.title='按住可拖动';
    if(!el.matches('a,button')){el.tabIndex=0;el.setAttribute('role','img');el.setAttribute('aria-label',el.dataset.layer==='7'?'可拖动的照片':'可拖动的小苏枋贴纸');}
    el.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'||event.button!==0)return;begin(el,'pointer',event.pointerId,event.clientX,event.clientY);});
    el.addEventListener('touchstart',event=>{if(event.touches.length!==1){finish();return;}const touch=event.touches[0];begin(el,'touch',touch.identifier,touch.clientX,touch.clientY);},{passive:true});
    el.addEventListener('touchmove',event=>{if(gesture?.kind!=='touch'||gesture.el!==el)return;const touch=[...event.touches].find(t=>t.identifier===gesture.id);if(touch)move(touch.clientX,touch.clientY,event);},{passive:false});
    el.addEventListener('touchend',event=>{if(gesture?.kind!=='touch'||gesture.el!==el)return;if(gesture.active&&event.cancelable)event.preventDefault();finish();},{passive:false});
    el.addEventListener('touchcancel',finish,{passive:true});
    el.addEventListener('dragstart',event=>event.preventDefault());
    el.addEventListener('contextmenu',event=>event.preventDefault());
    el.addEventListener('click',event=>{if(event.detail===0)return;if(performance.now()<states.get(el).suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    el.addEventListener('keydown',event=>{
      const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!direction)return;
      event.preventDefault();const state=states.get(el),step=event.shiftKey?30:10;place(el,state.x+direction[0]*step,state.y+direction[1]*step);
    });
  }
  addEventListener('pointermove',event=>{if(gesture?.kind==='pointer'&&gesture.id===event.pointerId)move(event.clientX,event.clientY,event);},{passive:false});
  addEventListener('pointerup',event=>{if(gesture?.kind==='pointer'&&gesture.id===event.pointerId)finish();});
  addEventListener('pointercancel',finish);addEventListener('blur',finish);addEventListener('pagehide',finish);
  addEventListener('resize',()=>{finish();for(const [el,state]of states){const ratio=board.clientWidth/state.width;state.width=board.clientWidth;place(el,state.x*ratio,state.y*ratio);}},{passive:true});
})();
