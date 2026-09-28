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
