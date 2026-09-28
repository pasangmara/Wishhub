from playwright.sync_api import sync_playwright
from webfetch import open_browser
with sync_playwright() as p:
    b,ctx=open_browser(p,viewport={"width":1920,"height":1080})
    pg=ctx.new_page(); pg.goto("https://vingobd.com/",wait_until="load",timeout=90000); pg.wait_for_timeout(3000)
    print(pg.evaluate("""()=>['h1','h2','p','a','body'].filter(s=>document.querySelector(s)).map(s=>{const e=document.querySelector(s);const c=getComputedStyle(e);return s+': '+c.fontFamily+' | '+c.fontWeight+' | '+c.color})"""))
    print(pg.evaluate("""()=>{const e=document.querySelector('h1').closest('section')||document.querySelector('h1').parentElement.parentElement;return getComputedStyle(e).backgroundImage.slice(0,300)}"""))
    print(pg.evaluate("""()=>[...document.querySelectorAll('link[href*=fonts]')].map(l=>l.href)"""))
    b.close()
