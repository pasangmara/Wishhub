from playwright.sync_api import sync_playwright
from webfetch import open_browser
A="assets/"
with sync_playwright() as p:
    b,ctx=open_browser(p,viewport={"width":1920,"height":1080},device_scale_factor=4)
    pg=ctx.new_page()
    pg.goto("https://vingobd.com/",wait_until="load",timeout=90000)
    pg.wait_for_timeout(4000)
    pg.add_style_tag(content="*{animation-play-state:paused!important;transition:none!important}")
    # logo icon + wordmark
    logo=pg.query_selector("header a, nav a"); logo.screenshot(path=A+"logo_full.png")
    icon=logo.query_selector("svg, img, div, span"); 
    if icon: icon.screenshot(path=A+"logo_icon.png")
    # hero cards: images inside hero area with rotated card look
    info=pg.evaluate("""()=>{const out=[];document.querySelectorAll('img').forEach((im,i)=>{const r=im.getBoundingClientRect();out.push([i,Math.round(r.x),Math.round(r.y+window.scrollY),Math.round(r.width),Math.round(r.height),im.alt||'',(im.currentSrc||im.src).slice(0,90)])});return out}""")
    for r in info: print(r)
    b.close()
