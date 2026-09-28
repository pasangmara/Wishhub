const {chromium}=require('playwright-core'); const {spawn}=require('child_process'); const path=require('path');
(async()=>{
  const [html,dur,out]=process.argv.slice(2); const fps=24, n=Math.round(parseFloat(dur)*fps);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--allow-file-access-from-files','--disable-gpu']});
  const pg=await b.newPage({viewport:{width:1920,height:1080}});
  await pg.goto('file://'+path.resolve(html)); await pg.evaluate(()=>document.fonts.ready);
  await pg.waitForTimeout(300);
  const ff=spawn(process.env.FFMPEG,['-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-i','-','-c:v','libx264','-crf','17','-preset','medium','-pix_fmt','yuv420p',out]);
  for(let i=0;i<n;i++){ await pg.evaluate(t=>window.render(t), i/fps); const buf=await pg.screenshot({type:'jpeg',quality:92}); if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r)); }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close(); console.log('rendered',out,n,'frames');
})().catch(e=>{console.error(e);process.exit(1)});
