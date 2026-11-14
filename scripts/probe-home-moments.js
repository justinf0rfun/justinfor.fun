// Browser-only acceptance probe for the design skill --probe option.
(async()=>{
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(condition,message)=>{if(!condition)throw Error(message)};
 const visible=selector=>[...document.querySelectorAll(selector)].find(el=>el.getBoundingClientRect().width>0);
 const click=el=>{assert(el,'missing control');el.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));};
 await delay(2500);
 const trigger=document.querySelector('[data-home-moments-trigger]'),panel=document.querySelector('#home-moments'),canvas=document.querySelector('[data-home-moments-slot] canvas'),main=document.querySelector('.home-content');
 assert(trigger&&!trigger.disabled&&canvas,'Dock not ready');
 click(trigger);await delay(60);const opening=panel.getAttribute('data-phase');await delay(800);
 assert(panel.getAttribute('data-phase')==='open','did not finish opening');
 assert(panel.contains(canvas),'canvas did not land in scene');
 const mode=panel.getAttribute('data-mode');
 if(mode==='sheet')assert(main.inert&&document.documentElement.style.overflow==='hidden','mobile background not locked');
 const roles=[];
 await delay(1000);
 for(const name of ['Felipe','Iggy','Todd','O','Alfred']){
  click(visible('#home-moments .moments-character'));await delay(1050);
  const actual=canvas.getAttribute('data-rendered-character');
  assert(actual===name,`expected ${name}, rendered ${actual}, error ${canvas.getAttribute('data-renderer-error')}`);
  assert(canvas.closest('.dots-character').getAttribute('data-renderer')==='webgl','poster fallback used');
  roles.push(actual);
 }
 click(visible('#home-moments [aria-label="上一条动态"]'));await delay(350);
 const selected=visible('#home-moments input[type=range]').value;
 assert(selected==='3','date navigation failed');
 click(trigger);await delay(80);const closing=panel.getAttribute('data-phase');await delay(520);
 assert(panel.hidden,'panel not hidden after return');
 panel.querySelector('.moments-mobile-scroll').dispatchEvent(new Event('scroll'));await delay(50);
 assert(document.querySelector('[data-home-moments-slot]').contains(canvas),'canvas did not return to Dock');
 assert(!main.inert,'background remained inert');
 click(trigger);await delay(800);
 assert(visible('#home-moments input[type=range]').value===selected,'reopen reset the date');
 click(trigger);await delay(120);click(trigger);await delay(850);
 assert(panel.getAttribute('data-phase')==='open','interrupted reverse failed');
 assert(panel.contains(canvas),'reversal remounted/lost the canvas');
 assert(!canvas.getAttribute('data-renderer-error'),'renderer error');
 if(mode==='sheet'){
  const close=panel.querySelector('[aria-label="收起碎碎念"]');close.focus();
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,cancelable:true}));
  assert(document.activeElement===trigger,'reverse focus loop escaped');
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',cancelable:true}));
  assert(document.activeElement===close,'forward focus loop escaped');
 }
 visible('#home-moments .moments-character').click();await delay(120);
 assert(canvas.getAttribute('data-rendered-character')==='Felipe','keyboard selection did not update immediately');
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',cancelable:true}));await delay(100);
 assert(panel.hidden&&!main.inert,'Escape did not restore the page');
 click(trigger);await delay(800);
 assert(panel.getAttribute('data-phase')==='open','reopen after Escape failed');
 return{success:true,viewport:innerWidth,mode,opening,closing,roles,sameCanvas:true,rememberedDate:selected,phase:panel.getAttribute('data-phase'),panel:panel.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};
})()
