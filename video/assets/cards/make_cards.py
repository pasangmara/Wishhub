import sys, os, random
S=sys.argv[1]; FD=S+'/fonts'; OUT=S+'/cards'
CSS=f"""
@font-face{{font-family:Poppins;font-weight:400;src:url(file://{FD}/Poppins-Regular.ttf)}}
@font-face{{font-family:Poppins;font-weight:500;src:url(file://{FD}/Poppins-Medium.ttf)}}
@font-face{{font-family:Poppins;font-weight:600;src:url(file://{FD}/Poppins-SemiBold.ttf)}}
@font-face{{font-family:Poppins;font-weight:700;src:url(file://{FD}/Poppins-Bold.ttf)}}
@font-face{{font-family:Script;src:url(file://{FD}/GreatVibes-Regular.ttf)}}
@font-face{{font-family:Playfair;font-weight:400 900;src:url(file://{FD}/PlayfairDisplay.ttf)}}
@font-face{{font-family:Cinzel;src:url(file://{FD}/CinzelDecorative-Bold.ttf)}}
*{{box-sizing:border-box}} html,body{{margin:0;padding:0}}
.card{{width:1080px;height:1350px;position:relative;overflow:hidden;font-family:Poppins;text-align:center}}
.layer{{position:absolute;inset:0}}
.brand{{position:absolute;top:64px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:14px;font-weight:600;font-size:30px;letter-spacing:1px}}
.brand svg{{width:46px;height:46px}}
.content{{position:absolute;left:90px;right:90px;display:flex;flex-direction:column;align-items:center}}
.kicker{{font-weight:600;font-size:28px;letter-spacing:8px;text-transform:uppercase}}
.script{{font-family:Script;line-height:1}}
.serif{{font-family:Playfair;font-weight:800;line-height:1.02}}
.msg{{font-size:34px;line-height:1.5;font-weight:400;max-width:820px}}
.sign{{font-size:28px;font-weight:600;margin-top:26px}}
.footer{{position:absolute;bottom:44px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:10px;font-weight:500;font-size:21px;letter-spacing:.5px}}
.footer img{{height:40px}}
"""
def brand(color, mark=None):
    mark = mark or color
    return f'''<div class="brand" style="color:{color}"><svg viewBox="0 0 48 48"><path d="M4 40 L18 16 L26 28 L31 20 L44 40 Z" fill="{mark}"/><circle cx="36" cy="11" r="5" fill="{mark}" opacity=".7"/></svg>SUMMIT &amp; CO.</div>'''
def footer(color):
    return f'<div class="footer" style="color:{color}"><img src="file://{S}/wishhub-logo.png">Sent with Wish Hub</div>'
def dots(n, colors, seed, rmin=4, rmax=12, area=(0,0,1080,1350), shapes='circle'):
    random.seed(seed); out=[]
    for _ in range(n):
        x=random.uniform(area[0],area[2]); y=random.uniform(area[1],area[3]); r=random.uniform(rmin,rmax); c=random.choice(colors); o=random.uniform(.5,1)
        if shapes=='rect':
            a=random.uniform(0,180); out.append(f'<rect x="{x}" y="{y}" width="{r*1.2}" height="{r*2.4}" rx="2" fill="{c}" opacity="{o:.2f}" transform="rotate({a:.0f} {x} {y})"/>')
        elif shapes=='star':
            out.append(f'<path d="M{x} {y-r} L{x+r*.3} {y-r*.3} L{x+r} {y} L{x+r*.3} {y+r*.3} L{x} {y+r} L{x-r*.3} {y+r*.3} L{x-r} {y} L{x-r*.3} {y-r*.3} Z" fill="{c}" opacity="{o:.2f}"/>')
        else: out.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="{o:.2f}"/>')
    return '<svg class="layer" viewBox="0 0 1080 1350">'+''.join(out)+'</svg>'
def snowflake(x,y,s,c,o=.8):
    arms=''.join(f'<g transform="rotate({a} {x} {y})"><line x1="{x}" y1="{y}" x2="{x}" y2="{y-s}" stroke="{c}" stroke-width="{s/10}" stroke-linecap="round"/><line x1="{x}" y1="{y-s*.6}" x2="{x-s*.25}" y2="{y-s*.8}" stroke="{c}" stroke-width="{s/12}" stroke-linecap="round"/><line x1="{x}" y1="{y-s*.6}" x2="{x+s*.25}" y2="{y-s*.8}" stroke="{c}" stroke-width="{s/12}" stroke-linecap="round"/></g>' for a in range(0,360,60))
    return f'<g opacity="{o}">{arms}</g>'
def leaf(x,y,s,rot,c):
    return f'<path transform="translate({x} {y}) rotate({rot}) scale({s})" d="M0 -60 C20 -40 40 -40 55 -45 C45 -25 50 -10 60 0 C40 5 30 15 25 35 C10 25 0 25 -5 40 C-10 25 -20 20 -35 25 C-30 10 -40 0 -55 -5 C-40 -15 -35 -30 -40 -45 C-25 -40 -15 -45 0 -60 Z M0 -50 L0 60" fill="{c}" stroke="rgba(0,0,0,.15)" stroke-width="2"/>'
def lantern(x,y,s):
    return f'''<g transform="translate({x} {y}) scale({s})"><line x1="0" y1="-160" x2="0" y2="-70" stroke="#f5c542" stroke-width="3"/><rect x="-22" y="-78" width="44" height="12" rx="3" fill="#f5c542"/><ellipse cx="0" cy="0" rx="70" ry="68" fill="#e53935"/><ellipse cx="0" cy="0" rx="40" ry="68" fill="none" stroke="#b71c1c" stroke-width="4"/><line x1="0" y1="-68" x2="0" y2="68" stroke="#b71c1c" stroke-width="4"/><rect x="-22" y="62" width="44" height="12" rx="3" fill="#f5c542"/><g stroke="#f5c542" stroke-width="3">{''.join(f'<line x1="{i}" y1="74" x2="{i}" y2="120"/>' for i in range(-15,16,6))}</g></g>'''
def diya(x,y,s):
    return f'''<g transform="translate({x} {y}) scale({s})"><path d="M-80 0 Q0 70 80 0 Z" fill="#f5a623"/><path d="M-80 0 Q0 40 80 0" fill="none" stroke="#c77d00" stroke-width="4"/><ellipse cx="0" cy="-40" rx="16" ry="34" fill="#ffd54f"/><ellipse cx="0" cy="-34" rx="8" ry="20" fill="#fff8e1"/><circle cx="0" cy="-40" r="60" fill="#ffd54f" opacity=".18"/></g>'''

cards = {}
# 1 Work anniversary (hero)
cards['01-work-anniversary-mike'] = f'''<div class="card" style="background:radial-gradient(circle at 50% 38%,#2b4bd1 0%,#16237e 55%,#0c1350 100%);color:#fff">
{dots(45,['#f5c542','#ff5ca0','#4fc3f7','#ffffff'],1,5,14,shapes='rect',area=(0,0,1080,700))}{dots(12,['#f5c542','#ff5ca0','#4fc3f7'],21,5,12,shapes='rect',area=(0,1150,1080,1300))}
{brand('#ffffff')}
<div class="content" style="top:190px">
<div class="kicker" style="color:#f5c542">Happy Work Anniversary</div>
<div class="serif" style="font-size:400px;background:linear-gradient(180deg,#ffe082,#f5b700);-webkit-background-clip:text;color:transparent;margin-top:10px">5</div>
<div class="kicker" style="font-size:34px;margin-top:-10px">Years</div>
<div class="script" style="font-size:150px;margin-top:40px">Mike Johnson</div>
<div class="msg" style="margin-top:30px;color:#e3e8ff">Five years of brilliant ideas, big wins and great coffee runs. Thank you for everything you bring to the team.</div>
<div class="sign" style="color:#f5c542">Rachel &amp; the whole Summit team</div></div>
{footer('#c5cdf5')}</div>'''
# 2 Birthday
balloons=''.join(f'<g><path d="M{x} {y+95} q-8 60 6 120 q12 50 -4 110" stroke="#ffffffaa" stroke-width="3" fill="none"/><ellipse cx="{x}" cy="{y}" rx="70" ry="88" fill="{c}"/><ellipse cx="{x-22}" cy="{y-30}" rx="14" ry="24" fill="#ffffff55"/><path d="M{x-10} {y+86} l10 12 l10 -12 z" fill="{c}"/></g>' for x,y,c in [(170,330,'#ff4f9a'),(300,250,'#ffc93c'),(890,300,'#3fa9f5'),(1000,420,'#ff4f9a'),(90,520,'#7c4dff')])
cards['02-birthday'] = f'''<div class="card" style="background:linear-gradient(160deg,#ffe3ef 0%,#ffd1e4 45%,#e8e0ff 100%);color:#3a1449">
<svg class="layer" viewBox="0 0 1080 1350">{balloons}</svg>
{dots(60,['#ff4f9a','#ffc93c','#3fa9f5','#7c4dff'],2,4,10,shapes='rect')}
{brand('#3a1449','#e91e63')}
<div class="content" style="top:560px">
<div class="script" style="font-size:190px;color:#e91e63">Happy Birthday</div>
<div class="serif" style="font-size:92px;margin-top:10px">Jessica!</div>
<div class="msg" style="margin-top:40px">Wishing you a year full of laughter, adventure and everything that makes you smile.</div>
<div class="sign" style="color:#e91e63">From all of us at Summit &amp; Co.</div></div>
{footer('#5b2d6e')}</div>'''
# 3 Welcome
cards['03-welcome-to-the-team'] = f'''<div class="card" style="background:linear-gradient(180deg,#e6fbf6 0%,#ffffff 60%);color:#0d3b4c">
<svg class="layer" viewBox="0 0 1080 1350"><circle cx="1000" cy="120" r="260" fill="#19c3a6" opacity=".18"/><circle cx="80" cy="1250" r="300" fill="#1976d2" opacity=".12"/><circle cx="960" cy="1180" r="120" fill="#ffc93c" opacity=".35"/></svg>
{dots(40,['#19c3a6','#1976d2','#ffc93c','#ff5ca0'],3,5,11)}
{brand('#0d3b4c','#19c3a6')}
<div class="content" style="top:300px">
<div class="kicker" style="color:#12a38b">Welcome aboard</div>
<div class="serif" style="font-size:150px;margin-top:40px">Welcome<br>to the Team,</div>
<div class="script" style="font-size:170px;color:#1976d2;margin-top:10px">Daniel!</div>
<div class="msg" style="margin-top:40px">We're so glad you're here. Your first coffee is on us, and your desk plant is already watered.</div>
<div class="sign" style="color:#12a38b">The Summit &amp; Co. family</div></div>
{footer('#3d6272')}</div>'''
# 4 Employee spotlight
cards['04-employee-spotlight'] = f'''<div class="card" style="background:#fff;color:#1b1b3a">
<svg class="layer" viewBox="0 0 1080 1350"><rect x="36" y="36" width="1008" height="1278" rx="40" fill="none" stroke="#e91e63" stroke-width="10"/><path d="M0 0 H1080 V430 Q540 560 0 430 Z" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e91e63"/><stop offset="1" stop-color="#1976d2"/></linearGradient></defs></svg>
{brand('#ffffff')}
<div class="content" style="top:170px">
<div class="kicker" style="color:#fff">Employee Spotlight</div>
<div style="margin-top:50px;width:300px;height:300px;border-radius:50%;background:linear-gradient(135deg,#ffc93c,#ff5ca0);display:flex;align-items:center;justify-content:center;border:12px solid #fff;box-shadow:0 20px 50px rgba(0,0,0,.18);font:700 110px Poppins;color:#fff">PS</div>
<div class="serif" style="font-size:96px;margin-top:40px">Priya Shah</div>
<div style="font-size:32px;font-weight:600;color:#e91e63;letter-spacing:2px;margin-top:10px">CUSTOMER SUCCESS LEAD</div>
<div class="msg" style="margin-top:36px;color:#44445e">This quarter Priya helped 40+ clients launch on time and raised our satisfaction score to 98%. Thank you, Priya!</div></div>
{footer('#6b6b85')}</div>'''
# 5 Client thank you
cards['05-client-thank-you-10-years'] = f'''<div class="card" style="background:linear-gradient(180deg,#fbf6ec,#f3e9d6);color:#3b2f1e">
<svg class="layer" viewBox="0 0 1080 1350"><rect x="60" y="60" width="960" height="1230" fill="none" stroke="#c9a24b" stroke-width="3"/><rect x="80" y="80" width="920" height="1190" fill="none" stroke="#c9a24b" stroke-width="1.5"/>
<g fill="#c9a24b">{''.join(f'<circle cx="{540+i*40}" cy="690" r="4"/>' for i in range(-3,4))}</g></svg>
{brand('#3b2f1e','#c9a24b')}
<div class="content" style="top:230px">
<div class="kicker" style="color:#a8822e">With gratitude</div>
<div class="serif" style="font-size:250px;color:#c9a24b;margin-top:20px">10</div>
<div class="serif" style="font-size:78px;margin-top:-10px;font-weight:600">Years Together</div>
<div class="script" style="font-size:110px;color:#a8822e;margin-top:70px">Thank you, Laura</div>
<div class="msg" style="margin-top:30px">To you and the entire Brightline team: a decade of partnership, trust and shared wins. We're honored to grow with you.</div>
<div class="sign" style="color:#a8822e">Rachel Moore, Summit &amp; Co.</div></div>
{footer('#7a6a4f')}</div>'''
# 6 Thanksgiving
leaves=''.join(leaf(x,y,s,r,c) for x,y,s,r,c in [(120,160,1.6,-20,'#e0701f'),(960,140,1.4,30,'#c0392b'),(1000,380,1.1,-40,'#f2a93b'),(90,420,1.0,50,'#b5651d'),(160,1180,1.5,10,'#c0392b'),(950,1200,1.7,-25,'#e0701f'),(850,1010,0.9,60,'#f2a93b'),(260,1010,0.8,-60,'#f2a93b')])
cards['06-thanksgiving'] = f'''<div class="card" style="background:radial-gradient(circle at 50% 45%,#fff4e3 0%,#fbe0bd 60%,#f2c996 100%);color:#5a2e0e">
<svg class="layer" viewBox="0 0 1080 1350">{leaves}</svg>
{brand('#5a2e0e','#e0701f')}
<div class="content" style="top:420px">
<div class="kicker" style="color:#c0392b">Happy</div>
<div class="script" style="font-size:210px;color:#c0501f;margin-top:10px">Thanksgiving</div>
<div class="msg" style="margin-top:50px">This year we're especially grateful for you: our clients, partners and team. Wishing you a warm table and full hearts.</div>
<div class="sign" style="color:#c0392b">With thanks, Summit &amp; Co.</div></div>
{footer('#7a4a26')}</div>'''
# 7 Happy Holidays
flakes=''.join(snowflake(x,y,s,'#ffffff',o) for x,y,s,o in [(150,200,50,.9),(930,170,70,.8),(1000,520,35,.6),(80,640,40,.6),(200,1150,60,.8),(900,1120,55,.9),(540,1260,30,.5),(700,180,28,.6)])
cards['07-happy-holidays'] = f'''<div class="card" style="background:radial-gradient(circle at 50% 40%,#1e7a4f 0%,#0f4d31 60%,#082f1e 100%);color:#fff">
<svg class="layer" viewBox="0 0 1080 1350">{flakes}</svg>
{dots(80,['#ffffff'],7,2,6)}
{brand('#ffffff','#e53935')}
<div class="content" style="top:400px">
<div class="kicker" style="color:#f5c542">Season's Greetings</div>
<div class="script" style="font-size:230px;margin-top:20px;color:#fff">Happy</div>
<div class="serif" style="font-size:130px;color:#f5c542;margin-top:-30px">Holidays</div>
<div class="msg" style="margin-top:50px;color:#dff3e8">Wishing you peace, joy and time with the people you love. Thank you for an amazing year.</div>
<div class="sign" style="color:#ff8a80">Summit &amp; Co.</div></div>
{footer('#bfe3cf')}</div>'''
# 8 New Year
cards['08-happy-new-year'] = f'''<div class="card" style="background:radial-gradient(circle at 50% 35%,#2a2440 0%,#141022 60%,#07060d 100%);color:#fff">
{dots(90,['#f5c542','#ffe082','#ffffff','#ff5ca0'],8,3,14,shapes='star')}
{brand('#ffffff','#f5c542')}
<div class="content" style="top:300px">
<div class="kicker" style="color:#f5c542">Cheers to</div>
<div class="serif" style="font-size:300px;background:linear-gradient(180deg,#fff3c4,#f5b700);-webkit-background-clip:text;color:transparent;margin-top:10px">2027</div>
<div class="script" style="font-size:130px;margin-top:10px;white-space:nowrap">Happy New Year</div>
<div class="msg" style="margin-top:40px;color:#d6d2e6">New goals, new wins, same great partnership. Here's to your best year yet.</div>
<div class="sign" style="color:#f5c542">Summit &amp; Co.</div></div>
{footer('#bdb6d6')}</div>'''
# 9 4th of July
stars=''.join(f'<path transform="translate({x} {y}) scale({s})" d="M0 -30 L9 -9 L30 -9 L13 5 L19 27 L0 14 L-19 27 L-13 5 L-30 -9 L-9 -9 Z" fill="#fff" opacity="{o}"/>' for x,y,s,o in [(150,180,1.4,.9),(930,210,1.8,.9),(1000,480,1,.6),(90,560,1.1,.6),(820,120,.8,.7),(260,110,.7,.7)])
stripes=''.join(f'<rect x="0" y="{1080+i*54}" width="1080" height="27" fill="#d32f2f"/>' for i in range(3))
cards['09-fourth-of-july'] = f'''<div class="card" style="background:linear-gradient(180deg,#0d2a6b 0%,#123a8f 70%,#ffffff 70%);color:#fff">
<svg class="layer" viewBox="0 0 1080 1350">{stars}{stripes}</svg>
{dots(50,['#ffffff','#ff5252','#90caf9'],9,2,6,area=(0,0,1080,900))}
{brand('#ffffff','#ff5252')}
<div class="content" style="top:280px">
<div class="kicker" style="color:#ffcdd2">Happy</div>
<div class="serif" style="font-size:230px;margin-top:10px">4<sup style="font-size:110px">th</sup></div>
<div class="script" style="font-size:150px;color:#ff8a80;margin-top:-10px">of July</div>
<div class="msg" style="margin-top:20px;color:#e3ecff">Wishing you a safe, happy and spectacular Independence Day.</div></div>
<div class="content" style="top:1190px"><div class="sign" style="color:#0d2a6b;background:#fff;padding:8px 28px;border-radius:40px">Summit &amp; Co.</div></div>
{footer('#0d2a6b')}</div>'''
# 10 Diwali
diyas=''.join(diya(x,1100,s) for x,s in [(230,1.1),(540,1.4),(850,1.1)])
cards['10-diwali'] = f'''<div class="card" style="background:radial-gradient(circle at 50% 40%,#5b1f7a 0%,#34104a 60%,#1c0829 100%);color:#fff">
<svg class="layer" viewBox="0 0 1080 1350">{diyas}</svg>
{dots(70,['#ffd54f','#ffb300','#ff80ab'],10,2,7,area=(0,0,1080,950))}
{brand('#ffffff','#ffb300')}
<div class="content" style="top:300px">
<div class="kicker" style="color:#ffd54f">Festival of Lights</div>
<div class="script" style="font-size:190px;margin-top:20px">Happy</div>
<div class="serif" style="font-size:160px;color:#ffc107;margin-top:-30px">Diwali</div>
<div class="msg" style="margin-top:40px;color:#f1dcff">May the light of Diwali bring you joy, prosperity and success.</div></div>
{footer('#e1c6f0')}</div>'''
# 11 Eid
cards['11-eid-mubarak'] = f'''<div class="card" style="background:radial-gradient(circle at 50% 35%,#0f6b5a 0%,#0a4a3e 60%,#062e27 100%);color:#fff">
<svg class="layer" viewBox="0 0 1080 1350"><circle cx="540" cy="330" r="150" fill="#f5c542"/><circle cx="600" cy="300" r="140" fill="#0e6152"/>
<path transform="translate(700 250) scale(1.3)" d="M0 -30 L9 -9 L30 -9 L13 5 L19 27 L0 14 L-19 27 L-13 5 L-30 -9 L-9 -9 Z" fill="#f5c542"/>
<path d="M0 1350 V1150 Q60 1060 120 1150 V1350 Z M880 1350 V1120 Q960 1000 1040 1120 V1350 Z M300 1350 V1180 Q350 1110 400 1180 V1350 Z" fill="#0b3f35"/></svg>
{dots(60,['#f5c542','#ffffff'],11,2,6,shapes='star')}
{brand('#ffffff','#f5c542')}
<div class="content" style="top:560px">
<div class="serif" style="font-size:170px;color:#f5c542">Eid</div>
<div class="script" style="font-size:170px;margin-top:-10px">Mubarak</div>
<div class="msg" style="margin-top:40px;color:#d8f0e9">Wishing you and your loved ones a blessed Eid filled with peace and happiness.</div>
<div class="sign" style="color:#f5c542">Summit &amp; Co.</div></div>
{footer('#bfe0d7')}</div>'''
# 12 Lunar New Year
cards['12-lunar-new-year'] = f'''<div class="card" style="background:radial-gradient(circle at 50% 45%,#d32f2f 0%,#a31515 60%,#6d0b0b 100%);color:#fff">
<svg class="layer" viewBox="0 0 1080 1350">{lantern(180,330,1.2)}{lantern(900,300,1.4)}{lantern(1000,620,.8)}{lantern(90,700,.8)}
<g fill="none" stroke="#f5c542" stroke-width="3" opacity=".5"><circle cx="540" cy="1250" r="220"/><circle cx="540" cy="1250" r="170"/></g></svg>
{dots(50,['#f5c542','#ffe082'],12,2,6)}
{brand('#ffffff','#f5c542')}
<div class="content" style="top:470px">
<div class="kicker" style="color:#ffe082">Happy</div>
<div class="serif" style="font-size:150px;color:#f5c542;margin-top:20px">Lunar<br>New Year</div>
<div class="msg" style="margin-top:40px;color:#ffe3e3">Wishing you good fortune, health and happiness in the year ahead.</div>
<div class="sign" style="color:#ffe082">Summit &amp; Co.</div></div>
{footer('#ffd2d2')}</div>'''

for name,body in cards.items():
    open(f'{OUT}/{name}.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>')
print(len(cards))
