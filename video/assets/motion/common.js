const C=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const P=(t,a,b)=>C((t-a)/(b-a));               // progress 0..1 between a and b
const EO=x=>1-Math.pow(1-x,3);                  // ease out cubic
const EIO=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const BACK=x=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const L=(a,b,x)=>a+(b-a)*x;
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
function fadeUp(el,t,a,d=.5,dist=30){const p=EO(P(t,a,a+d));el.style.opacity=p;el.style.transform=`translateY(${(1-p)*dist}px)`;}
function typeOn(el,full,t,a,b){const n=Math.round(full.length*P(t,a,b));el.textContent=full.slice(0,n);}
const CURSOR='<svg viewBox="0 0 24 24"><path d="M3 2 L3 20 L8 15 L11.5 22 L14.5 20.6 L11 13.8 L18 13.8 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
// slow continuous camera push so no frame ever sits still
function cam(t,dur,amt=0.035,dx=0,dy=0){const s=$('.stage');const p=t/dur;s.style.transformOrigin='50% 50%';s.style.transform=`translate(${dx*p}px,${dy*p}px) scale(${1+amt*p})`;}
// soft drifting light blobs for pastel backgrounds
function blobs(n=5,seed=3){let s=seed;const r=()=>(s=(s*16807)%2147483647)/2147483647;const out=[];for(let i=0;i<n;i++){const e=document.createElement('div');const size=260+r()*380;e.style.cssText=`position:absolute;width:${size}px;height:${size}px;border-radius:50%;filter:blur(40px);opacity:.45;background:${['#ffd0e4','#d6e6ff','#ffe7c7','#e5dcff'][i%4]};z-index:0`;$('.stage').prepend(e);out.push({e,x:r()*1920,y:r()*1080,ph:r()*6,sp:.25+r()*.3});}return t=>out.forEach(b=>{b.e.style.left=(b.x+Math.sin(t*b.sp+b.ph)*90-200)+'px';b.e.style.top=(b.y+Math.cos(t*b.sp*.8+b.ph)*70-200)+'px';});}
