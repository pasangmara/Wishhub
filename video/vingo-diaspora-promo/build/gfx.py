"""Render all graphics for the Vingo promo with Chromium (proper Bangla shaping, brand fonts).

Outputs (1920x1080):
  gfx/overlays/*.png        transparent stills: hook, captions, feature chips
  gfx/<segment>/f%04d.png   opaque animation frames at 24 fps: site_alpona, smart_resize, templates, endcard
"""
import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "gfx"
FPS = 24

BRAND = {
    "pink": "#F0409B", "red": "#E01E3C", "plum": "#7A1854",
    "ink": "#150C13", "cream": "#FBF3E4", "gold": "#F5B83D",
}

LOGO_SVG = """
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#F2488F"/><stop offset="1" stop-color="#F7A94A"/></linearGradient></defs>
  <rect width="100" height="100" rx="26" fill="url(#lg)"/>
  <g fill="none" stroke="#fff" stroke-width="6.5">
    <ellipse cx="50" cy="31" rx="9" ry="12.5"/><ellipse cx="50" cy="69" rx="9" ry="12.5"/>
    <ellipse cx="31" cy="50" rx="12.5" ry="9"/><ellipse cx="69" cy="50" rx="12.5" ry="9"/>
  </g>
  <circle cx="50" cy="50" r="4.5" fill="#fff"/>
</svg>"""

BASE_CSS = f"""
@import url('../../fonts/fonts.css');
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: transparent; }}
body {{ font-family: Manrope, 'Hind Siliguri', sans-serif; -webkit-font-smoothing: antialiased; }}
.bn {{ font-family: 'Hind Siliguri', sans-serif; }}
.display {{ font-family: 'Baloo Da 2', 'Hind Siliguri', sans-serif; }}
"""


def page_html(body, css="", js="function render(t){}"):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}{css}</style></head>
<body>{body}<script>{js}</script></body></html>"""


# ---------------------------------------------------------------- overlays (static, transparent)

CAPTIONS = {
    "cap_riya": "“Ammu, let’s make the Eid card this year.”",
    "cap01": "Eid in New York… still feels a world away from home.",
    "cap02": "What if home… was just one click away?",
    "cap03": "Meet Vingo. Magic Alpona wraps any photo in real Bangladeshi art.",
    "cap04a": "Nakshi Kantha, alpona, Jamdani, rickshaw colors.",
    "cap04b": "Heritage art you won’t find in any other design app.",
    "cap05": "Can’t write Bangla like you used to? Vingo’s AI writes it for you.",
    "cap06": "One design. Every size. WhatsApp, Instagram, print.",
    "cap07": "Over 10,000 templates — Eid, Boishakh, weddings, Puja and more.",
    "cap08": "Run a shop? Posters, menus and brand kits, right from your phone.",
    "cap09": "Remove any background, in one tap.",
    "cap10": "Plan the mela together, in real time…",
    "cap11": "…from Queens, to Detroit, to Dallas.",
    "cap_nanu": "“Mashallah — how beautiful!”",
}

CHIPS = {
    "chip_alpona": ("Magic Alpona", "ম্যাজিক আলপনা"),
    "chip_writer": ("Bangla AI Writer", "বাংলা AI লেখক"),
    "chip_resize": ("Smart Resize", "এক ডিজাইন, সব সাইজ"),
    "chip_templates": ("10,000+ Templates", "যেকোনো উপলক্ষের জন্য টেমপ্লেট"),
    "chip_business": ("Vingo for Business", "ব্যবসার জন্য Vingo"),
    "chip_bgremove": ("Background Remover", "ব্যাকগ্রাউন্ড রিমুভার"),
    "chip_team": ("Design Together", "টিমের সাথে একসাথে কাজ করুন"),
}


def caption_html(text):
    css = """
    .cap { position:absolute; left:50%; bottom:86px; transform:translateX(-50%); max-width:1560px;
           padding:18px 38px 20px; border-radius:22px; background:rgba(21,12,19,.62);
           color:#fff; font-weight:700; font-size:44px; line-height:1.25; text-align:center;
           letter-spacing:.2px; box-shadow:0 10px 40px rgba(0,0,0,.25); white-space:nowrap; }"""
    return page_html(f'<div class="cap">{text}</div>', css)


def chip_html(en, bn):
    css = f"""
    .chip {{ position:absolute; left:84px; top:78px; display:flex; align-items:center; gap:22px;
            padding:18px 34px 18px 18px; border-radius:28px;
            background:linear-gradient(160deg,{BRAND['pink']} 0%,{BRAND['red']} 55%,{BRAND['plum']} 100%);
            box-shadow:0 14px 44px rgba(122,24,84,.45); }}
    .chip svg {{ width:78px; height:78px; filter:drop-shadow(0 2px 6px rgba(0,0,0,.2)); }}
    .en {{ color:#fff; font-weight:800; font-size:46px; line-height:1.05; }}
    .bn {{ color:rgba(251,243,228,.92); font-weight:600; font-size:28px; line-height:1.2; margin-top:4px; }}"""
    return page_html(f'<div class="chip">{LOGO_SVG}<div><div class="en">{en}</div><div class="bn">{bn}</div></div></div>', css)


def hook_html():
    css = """
    .hook { position:absolute; left:0; right:0; top:120px; text-align:center; color:#fff;
            text-shadow:0 6px 30px rgba(0,0,0,.55); }
    .l1 { font-family:'Baloo Da 2',sans-serif; font-weight:800; font-size:104px; line-height:1; }
    .l2 { font-weight:700; font-size:40px; margin-top:18px; opacity:.95; }"""
    return page_html('<div class="hook"><div class="l1">Missing home this Eid?</div>'
                     '<div class="l2">For every Bangladeshi family in America</div></div>', css)


# ---------------------------------------------------------------- animated segments (opaque)

COMMON_JS = """
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
const pop=(t,t0,d=.45)=>{const x=clamp((t-t0)/d);if(x<=0)return 0;const c=1.70158+1;return 1+c*Math.pow(x-1,3)+1.70158*Math.pow(x-1,2);};
const fade=(t,t0,d=.4)=>clamp((t-t0)/d);
"""


def seg_site_alpona():
    # Browser window showing the real vingobd.com tools section, camera pushes onto the Magic Alpona card.
    css = f"""
    body {{ background: radial-gradient(1200px 700px at 30% 20%, #ff7cc0 0%, transparent 60%),
            linear-gradient(160deg,{BRAND['pink']} 0%,{BRAND['red']} 55%,{BRAND['plum']} 100%); }}
    .win {{ position:absolute; left:210px; top:96px; width:1500px; height:888px; border-radius:26px; overflow:hidden;
            background:#fff; box-shadow:0 40px 120px rgba(40,0,20,.55); }}
    .bar {{ height:64px; background:#F4EEE6; display:flex; align-items:center; padding:0 24px; gap:12px; }}
    .dot {{ width:16px; height:16px; border-radius:50%; }}
    .url {{ margin-left:30px; flex:1; height:40px; border-radius:20px; background:#fff; display:flex; align-items:center;
            padding:0 20px; font-weight:700; font-size:22px; color:#3b2a33; gap:10px; }}
    .view {{ position:absolute; top:64px; left:0; right:0; bottom:0; overflow:hidden; background:{BRAND['cream']}; }}
    .shot {{ position:absolute; left:0; top:0; width:1160px; transform-origin:0 0; }}
    .cursor {{ position:absolute; width:46px; height:46px; }}
    .ring {{ position:absolute; border:5px solid {BRAND['gold']}; border-radius:34px; box-shadow:0 0 0 9999px rgba(21,12,19,0); }}
    .ripple {{ position:absolute; width:30px; height:30px; border-radius:50%; border:4px solid #fff; }}"""
    body = f"""<div class="win"><div class="bar"><div class="dot" style="background:#FF5F57"></div>
      <div class="dot" style="background:#FEBC2E"></div><div class="dot" style="background:#28C840"></div>
      <div class="url">🔒 vingobd.com</div></div>
      <div class="view" id="view"><img class="shot" id="shot" src="../../assets/site_tools.png">
      <div class="ring" id="ring"></div><div class="ripple" id="rip"></div>
      <svg class="cursor" id="cur" viewBox="0 0 24 24"><path d="M3 2l7 19 2.6-7.6L20 11z" fill="#150C13" stroke="#fff" stroke-width="1.6"/></svg>
      </div></div>"""
    js = COMMON_JS + """
    const VW=1500, VH=824;
    // rects in screenshot CSS coords (1160 x 1000)
    const A={x:0,y:40,w:1160,h:1160*VH/VW}, B={x:0,y:300,w:700,h:700*VH/VW};
    const card={x:22,y:328,w:618,h:300}, btn={x:134,y:574};
    function cam(t){const k=ease((t-0.2)/2.0);const r={x:A.x+(B.x-A.x)*k,y:A.y+(B.y-A.y)*k,w:A.w+(B.w-A.w)*k,h:A.h+(B.h-A.h)*k};
      const s=VW/r.w; return {s, tx:-r.x*s, ty:-r.y*s};}
    function P(c,p){return {x:p.x*c.s+c.tx, y:p.y*c.s+c.ty};}
    function render(t){
      const c=cam(t); const sh=document.getElementById('shot');
      sh.style.transform=`translate(${c.tx}px,${c.ty}px) scale(${c.s})`;
      const r=document.getElementById('ring'); const p0=P(c,{x:card.x-8,y:card.y-8});
      r.style.left=p0.x+'px'; r.style.top=p0.y+'px'; r.style.width=(card.w+16)*c.s+'px'; r.style.height=(card.h+16)*c.s+'px';
      r.style.opacity=fade(t,1.6,.5);
      const target=P(c,btn); const start={x:VW*0.85,y:VH*0.95}; const k=ease((t-1.2)/1.3);
      const cu=document.getElementById('cur'); cu.style.left=(start.x+(target.x-start.x)*k)+'px'; cu.style.top=(start.y+(target.y-start.y)*k)+'px';
      const tc=2.7; const rp=document.getElementById('rip'); const q=clamp((t-tc)/.6);
      rp.style.opacity=(t>tc)?(1-q):0; const sz=30+q*90; rp.style.width=sz+'px'; rp.style.height=sz+'px';
      rp.style.left=(target.x-sz/2+6)+'px'; rp.style.top=(target.y-sz/2+6)+'px';
    }"""
    return page_html(body, css, js), 4.0


def seg_smart_resize():
    css = f"""
    body {{ background: linear-gradient(160deg,{BRAND['pink']} 0%,{BRAND['red']} 55%,{BRAND['plum']} 100%); }}
    .title {{ position:absolute; top:70px; width:100%; text-align:center; color:#fff; }}
    .title .bn {{ font-family:'Baloo Da 2',sans-serif; font-weight:800; font-size:76px; line-height:1; }}
    .title .en {{ font-weight:700; font-size:32px; opacity:.9; margin-top:10px; }}
    .f {{ position:absolute; bottom:150px; background:#fff; border-radius:26px; padding:14px; box-shadow:0 30px 80px rgba(40,0,20,.5); transform-origin:50% 100%; }}
    .f img {{ width:100%; height:100%; object-fit:cover; border-radius:16px; display:block; }}
    .lab {{ position:absolute; left:0; right:0; bottom:-66px; text-align:center; color:#fff; font-weight:800; font-size:32px; }}
    .ratio {{ font-weight:600; opacity:.8; font-size:24px; margin-left:8px; }}"""
    body = """<div class="title"><div class="bn">এক ডিজাইন, সব সাইজ</div><div class="en">One design → every format</div></div>
      <div class="f" id="f1" style="left:330px;width:330px;height:586px"><img src="../../assets/eid_clean.jpg" style="object-position:50% 40%"><div class="lab">WhatsApp<span class="ratio">9:16</span></div></div>
      <div class="f" id="f2" style="left:745px;width:430px;height:430px"><img src="../../assets/eid_clean.jpg"><div class="lab">Instagram<span class="ratio">1:1</span></div></div>
      <div class="f" id="f3" style="left:1260px;width:414px;height:586px"><img src="../../assets/eid_clean.jpg" style="object-position:50% 30%"><div class="lab">Print<span class="ratio">A5</span></div></div>"""
    js = COMMON_JS + """
    function render(t){
      [['f1',0.35],['f2',1.05],['f3',1.75]].forEach(([id,t0])=>{const e=document.getElementById(id);const s=pop(t,t0);
        e.style.transform=`scale(${Math.max(0,s)})`; e.style.opacity=clamp((t-t0)/.15);});
      document.querySelector('.title').style.opacity=fade(t,0,.35);
    }"""
    return page_html(body, css, js), 4.0


def seg_templates():
    css = f"""
    body {{ background: radial-gradient(900px 500px at 80% 10%, rgba(240,64,155,.18), transparent 70%), {BRAND['cream']}; }}
    .num {{ position:absolute; top:70px; width:100%; text-align:center; font-family:'Baloo Da 2',sans-serif; font-weight:800;
            font-size:190px; line-height:.95; background:linear-gradient(160deg,{BRAND['pink']},{BRAND['red']} 55%,{BRAND['plum']});
            -webkit-background-clip:text; color:transparent; }}
    .sub {{ position:absolute; top:268px; width:100%; text-align:center; color:{BRAND['ink']}; font-weight:800; font-size:40px; }}
    .tags {{ position:absolute; top:334px; width:100%; text-align:center; color:#6b5560; font-weight:700; font-size:26px; letter-spacing:.3px; }}
    .row {{ position:absolute; top:420px; left:0; height:560px; }}
    .row img {{ height:560px; display:block; }}"""
    body = """<div class="num" id="num">0</div><div class="sub">ready-made templates for every occasion</div>
      <div class="tags">Eid · Pohela Boishakh · Weddings · Durga Puja · Victory Day · Ekushe · Birthdays</div>
      <div class="row" id="row"><img src="../../assets/templates_row.jpg"></div>"""
    js = COMMON_JS + """
    function render(t){
      const k=ease(t/2.2); const n=Math.round(10000*k);
      document.getElementById('num').textContent=(n>=10000?'10,000+':n.toLocaleString('en-US'));
      const w=560*3840/660; const x=-(w-1920)*(t/6);
      document.getElementById('row').style.transform=`translateX(${x}px)`;
    }"""
    return page_html(body, css, js), 6.0


def seg_endcard():
    css = f"""
    body {{ background: radial-gradient(900px 600px at 18% 18%, rgba(255,140,200,.55), transparent 65%),
            radial-gradient(800px 600px at 90% 90%, rgba(245,184,61,.25), transparent 70%),
            linear-gradient(160deg,{BRAND['pink']} 0%,{BRAND['red']} 55%,{BRAND['plum']} 100%); }}
    .col {{ position:absolute; left:140px; top:0; bottom:0; width:980px; display:flex; flex-direction:column; justify-content:center; color:#fff; }}
    .brand {{ display:flex; align-items:center; gap:22px; }}
    .brand svg {{ width:110px; height:110px; filter:drop-shadow(0 8px 20px rgba(0,0,0,.25)); }}
    .word {{ font-weight:800; font-size:92px; letter-spacing:-1px; }}
    .h1 {{ font-family:'Baloo Da 2',sans-serif; font-weight:800; font-size:100px; line-height:1.05; margin-top:34px; }}
    .h2 {{ font-weight:700; font-size:44px; opacity:.95; margin-top:8px; }}
    .chips {{ display:flex; gap:16px; margin-top:40px; flex-wrap:wrap; }}
    .c {{ background:rgba(251,243,228,.16); border:2px solid rgba(251,243,228,.45); border-radius:40px; padding:12px 26px;
          font-weight:800; font-size:30px; }}
    .cta {{ margin-top:46px; align-self:flex-start; background:{BRAND['gold']}; color:{BRAND['ink']}; border-radius:50px;
            padding:26px 54px; font-weight:800; font-size:44px; box-shadow:0 18px 50px rgba(245,184,61,.55); }}
    .card {{ position:absolute; border-radius:26px; overflow:hidden; background:#fff; padding:10px; box-shadow:0 40px 90px rgba(40,0,20,.5); }}
    .card img {{ width:100%; height:100%; object-fit:cover; border-radius:18px; display:block; }}
    .anim {{ opacity:0; }}"""
    body = f"""<div class="col">
      <div class="brand anim" id="brand">{LOGO_SVG}<div class="word">vingo</div></div>
      <div class="h1 anim" id="h1">আজ কী ডিজাইন করবেন?</div>
      <div class="h2 anim" id="h2">Your culture, designed in minutes.</div>
      <div class="chips"><div class="c anim" id="c1">✓ Start free</div><div class="c anim" id="c2">✓ No credit card</div>
        <div class="c anim" id="c3">✓ 10,000+ templates</div></div>
      <div class="cta anim" id="cta">Start free at vingobd.com</div></div>
      <div class="card" id="k1" style="left:1150px;top:250px;width:330px;height:410px"><img src="../../assets/pohela_boishak.png"></div>
      <div class="card" id="k3" style="left:1520px;top:300px;width:330px;height:430px"><img src="../../assets/wedding.jpg"></div>
      <div class="card" id="k2" style="left:1300px;top:470px;width:380px;height:420px"><img src="../../assets/eid_clean.jpg"></div>"""
    js = COMMON_JS + """
    const cards=[['k1',-9,0.15],['k3',8,0.3],['k2',-2,0.45]];
    function up(id,t0,dy=40){const e=document.getElementById(id);const k=ease((t_-t0)/.6);e.style.opacity=k;e.style.transform=`translateY(${(1-k)*dy}px)`;}
    let t_=0;
    function render(t){ t_=t;
      cards.forEach(([id,rot,t0])=>{const e=document.getElementById(id);const k=ease((t-t0)/.9);
        const fl=Math.sin((t+t0*7)*1.3)*6; e.style.opacity=k;
        e.style.transform=`translateY(${(1-k)*380+fl}px) rotate(${rot*(0.6+0.4*k)}deg)`;});
      up('brand',0.3); up('h1',0.9); up('h2',1.5); up('c1',2.6,20); up('c2',2.9,20); up('c3',3.2,20); up('cta',4.0,30);
      if(t>4.6){const p=1+0.035*Math.sin((t-4.6)*4.2);document.getElementById('cta').style.transform=`scale(${p})`;}
    }"""
    return page_html(body, css, js), 10.5


SEGMENTS = {"site_alpona": seg_site_alpona, "smart_resize": seg_smart_resize,
            "templates": seg_templates, "endcard": seg_endcard}


def main(only=None):
    tmp = OUT / "_html"
    tmp.mkdir(parents=True, exist_ok=True)
    (OUT / "overlays").mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1920, "height": 1080})

        def load(name, html):
            f = tmp / f"{name}.html"
            f.write_text(html, encoding="utf-8")
            pg.goto(f.as_uri())
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(250)

        if not only or only == "overlays":
            items = {"hook": hook_html()}
            items.update({k: caption_html(v) for k, v in CAPTIONS.items()})
            items.update({k: chip_html(*v) for k, v in CHIPS.items()})
            for name, html in items.items():
                load(name, html)
                pg.screenshot(path=str(OUT / "overlays" / f"{name}.png"), omit_background=True)
            print("overlays:", len(items))

        for name, fn in SEGMENTS.items():
            if only and only not in (name, "segments"):
                continue
            html, dur = fn()
            load(name, html)
            d = OUT / name
            d.mkdir(exist_ok=True)
            n = int(round(dur * FPS))
            for i in range(n):
                pg.evaluate(f"render({i / FPS})")
                pg.screenshot(path=str(d / f"f{i:04d}.png"))
            print(name, n, "frames")
        b.close()


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
