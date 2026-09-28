from playwright.sync_api import sync_playwright
from webfetch import open_browser
S="/tmp/claude-0/-home-user-Wishhub/2a751022-9719-57f4-83d3-7cf3a3301303/scratchpad/"
with sync_playwright() as p:
    b,ctx=open_browser(p,viewport={"width":1920,"height":1080})
    pg=ctx.new_page()
    pg.goto("https://vingobd.com/",wait_until="load",timeout=90000)
    pg.wait_for_timeout(4000)
    print("height",pg.evaluate("document.documentElement.scrollHeight"))
    for sel in ["#tools","#templates","#ecosystem","#footer","h1","h2","h3"]:
        for e in pg.query_selector_all(sel)[:12]:
            bb=e.bounding_box(); t=(e.inner_text() or "")[:40].replace("\n"," ")
            print(sel, int(bb["y"]) if bb else None, t)
    pg.screenshot(path=S+"site_full.png",full_page=True)
    b.close()
