(() => {
  'use strict';
  if (window.self !== window.top || document.getElementById('yrreh-home-return')) return;
  const host = document.createElement('aside');
  host.id = 'yrreh-home-return';
  host.setAttribute('aria-label','返回总主页');
  Object.assign(host.style,{position:'fixed',left:'max(6px,env(safe-area-inset-left))',top:'var(--home-return-top,96px)',zIndex:'60',lineHeight:'1'});
  const shadow = host.attachShadow({mode:'open'});
  shadow.innerHTML = `<style>
    :host{display:block;width:76px;color:#47382f;font-family:system-ui,sans-serif}
    :host([hidden]){display:none!important}
    *{box-sizing:border-box}
    .widget{display:flex;align-items:center;flex-direction:column;width:100%}
    a{display:block;width:76px;height:86px;opacity:1;overflow:hidden;transition:height .24s ease,opacity .2s ease,transform .24s ease}
    img{display:block;width:100%;height:auto;border:0;filter:drop-shadow(0 2px 2px #0002)}
    button{display:grid;place-items:center;width:28px;height:22px;margin:0;padding:0;border:1px solid #9c716a45;border-radius:99px;background:#fff5e6dc;color:#5a443a;font:16px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 1px 3px #0001}
    a:focus-visible,button:focus-visible{outline:2px solid #7853ba;outline-offset:2px}
    .widget.collapsed a{height:0;opacity:0;transform:translateY(-8px);pointer-events:none}
    @media(max-width:640px){:host{width:60px}a{width:60px;height:68px}button{width:26px;height:21px}}
    @media(prefers-reduced-motion:reduce){a{transition:none}}
  </style><div class="widget"><a href="https://yrrehcccccc.github.io/me/" target="_top" aria-label="返回 homepage"><img src="https://yrrehcccccc.github.io/me/assets/home-return.png" alt="返回 homepage" width="317" height="359"></a><button type="button" aria-expanded="true" aria-label="收起返回主页贴纸" title="收起贴纸">▴</button></div>`;
  const widget=shadow.querySelector('.widget'),link=shadow.querySelector('a'),button=shadow.querySelector('button');
  let collapsed=false;
  try{collapsed=localStorage.getItem('yrreh-home-return-collapsed')==='1';}catch{}
  const render=()=>{
    widget.classList.toggle('collapsed',collapsed);
    link.tabIndex=collapsed?-1:0;
    link.setAttribute('aria-hidden',String(collapsed));
    button.setAttribute('aria-expanded',String(!collapsed));
    button.setAttribute('aria-label',collapsed?'展开返回主页贴纸':'收起返回主页贴纸');
    button.title=collapsed?'展开贴纸':'收起贴纸';
    button.textContent=collapsed?'▾':'▴';
  };
  button.addEventListener('click',()=>{collapsed=!collapsed;render();try{localStorage.setItem('yrreh-home-return-collapsed',collapsed?'1':'0');}catch{}});
  render();document.body.append(host);
  const headers=[...document.querySelectorAll('.site-header,.mobile-topbar,.browser-header')];
  const position=()=>{
    const header=headers.find(el=>el.getBoundingClientRect().height>0);
    const bottom=header?.getBoundingClientRect().bottom||0;
    host.style.setProperty('--home-return-top',Math.min(140,Math.max(8,bottom+6))+'px');
  };
  position();addEventListener('resize',position,{passive:true});addEventListener('load',position,{once:true});
  if('ResizeObserver' in window){const observer=new ResizeObserver(position);headers.forEach(header=>observer.observe(header));}
  const panel=document.querySelector('#settingsPanel');
  if(panel){const sync=()=>{host.hidden=panel.classList.contains('open');};new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['class']});sync();}
})();
