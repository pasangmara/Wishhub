from playwright.sync_api import sync_playwright
from webfetch import open_browser
A="assets/"
with sync_playwright() as p:
    b,ctx=open_browser(p,viewport={"width":1920,"height":1080},device_scale_factor=2)
    pg=ctx.new_page()
    pg.goto("https://vingobd.com/",wait_until="load",timeout=90000)
    pg.wait_for_timeout(4000)
    # pause marquee/animations for crisp stills
    pg.add_style_tag(content="*{animation-play-state:paused!important;transition:none!important}")
    pg.screenshot(path=A+"site_hero.png",clip={"x":0,"y":0,"width":1920,"height":1080})
    pg.screenshot(path=A+"site_tools.png",full_page=True,clip={"x":380,"y":1000,"width":1160,"height":1000})
    pg.screenshot(path=A+"site_templates.png",full_page=True,clip={"x":0,"y":2790,"width":1920,"height":680})
    pg.screenshot(path=A+"site_cta.png",full_page=True,clip={"x":0,"y":4630,"width":1920,"height":360})
    logo=pg.query_selector("header a, nav a")
    if logo: logo.screenshot(path=A+"site_logo.png")
    b.close()
