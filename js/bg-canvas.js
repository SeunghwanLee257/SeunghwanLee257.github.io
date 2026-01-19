/* /js/bg-canvas.js  — waLLLnut v1 background + optional dissolve */
(() => {
  const ORANGE = '#FF7300';
  const PALETTE = [ ORANGE, '#12C2A5', '#94E044', '#11111110' ]; // 마지막은 옅은 섀도우
  const CONFIG = {
    DENSITY: 0.9,           // 0.6~1.2 권장 (모바일에서 자동 하향)
    SPEED: 0.8,             // 0.5~1.2
    ROUNDNESS: 10,          // 라운드 정도(px)
    ORANGE_WEIGHT: 0.35,    // 브랜드 오렌지 비중
    ENABLE_DISSOLVE: true,  // 카운트 숫자 클릭 디졸브
    FPS_CAP: 60
  };

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W=0,H=0, items=[];

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) CONFIG.SPEED = 0.4;

  function resize(){
    const root = canvas.parentElement || document.body;
    const r = root.getBoundingClientRect();
    W = canvas.width  = Math.floor(r.width  * DPR);
    H = canvas.height = Math.floor(r.height * DPR);
    canvas.style.width  = r.width + 'px';
    canvas.style.height = r.height + 'px';
    spawn();
  }

  function pick(arr, weights){
    if (!weights) return arr[(Math.random()*arr.length)|0];
    let s=0, r=Math.random();
    for(let i=0;i<weights.length;i++){ s+=weights[i]; if(r<=s) return arr[i]; }
    return arr[arr.length-1];
  }

  function spawn(){
    const base = Math.floor((W*H)/25000 * CONFIG.DENSITY); // 면적 기반 수량
    const mobile = /Mobi|Android/i.test(navigator.userAgent);
    const count = mobile ? Math.max(20, base*0.65) : base;

    items = [];
    for(let i=0;i<count;i++){
      const w = (Math.random()*120+40)*DPR;
      const h = (Math.random()*22+10)*DPR;
      const y = Math.random()*H;
      const x = Math.random()*W;
      const v = (Math.random()*0.6+0.4)*CONFIG.SPEED*DPR;

      // 색상 가중치: 오렌지 비중 살짝 높임
      const cols = [PALETTE[0], PALETTE[1], PALETTE[2]];
      const weights = [CONFIG.ORANGE_WEIGHT, 0.35, 0.30];
      const c = pick(cols, weights);

      items.push({x,y,w,h,v,c,alpha: Math.random()*0.3+0.55});
    }
  }

  function roundRect(ctx,x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }

  let last=0;
  function tick(t){
    requestAnimationFrame(tick);
    if (CONFIG.FPS_CAP){
      if (t-last < 1000/CONFIG.FPS_CAP) return;
      last = t;
    }
    ctx.clearRect(0,0,W,H);

    // 아주 얇은 그리드(연결감)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#000';
    for (let x=0; x<W; x+=80*DPR) ctx.fillRect(x,0,1,H);
    for (let y=0; y<H; y+=80*DPR) ctx.fillRect(0,y,W,1);
    ctx.restore();

    for (const it of items){
      it.x += it.v;
      if (it.x - it.w > W) it.x = -it.w;

      ctx.globalAlpha = it.alpha;
      ctx.fillStyle = it.c;
      roundRect(ctx, it.x, it.y, it.w, it.h, CONFIG.ROUNDNESS*DPR);
      ctx.fill();

      // 가끔 작은 점
      if (Math.random()<0.02){
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = it.c;
        ctx.beginPath();
        ctx.arc(it.x+it.w*Math.random(), it.y+it.h*Math.random(), 2.5*DPR, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  // 숫자 디졸브(옵션)
  function bindDissolve(){
    if (!CONFIG.ENABLE_DISSOLVE) return;
    const wrap = document.querySelector('.count-wrap');
    if (!wrap) return;

    wrap.addEventListener('click', e => {
      const target = e.target.closest('.time-box'); // 각 숫자 박스
      if (!target) return;

      // 캔버스 위로 입자 뿌리기
      const rect = target.getBoundingClientRect();
      const ox = (rect.left + rect.width/2) * DPR;
      const oy = (rect.top  + rect.height/2 - (canvas.getBoundingClientRect().top||0)) * DPR;

      let burst = 180;
      const particles = [];
      for(let i=0;i<burst;i++){
        const a = Math.random()*Math.PI*2;
        const sp = Math.random()*3+1;
        particles.push({
          x: ox, y: oy, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
          life: Math.random()*18+14, c: pick(PALETTE,[0.6,0.25,0.15])
        });
      }

      const old = tick;
      function fx(){
        if (!particles.length){ requestAnimationFrame(tick); return; }
        requestAnimationFrame(fx);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        particles.forEach((p,idx)=>{
          p.x+=p.vx*DPR; p.y+=p.vy*DPR; p.vy+=0.05*DPR; p.life--;
          ctx.globalAlpha = Math.max(0, p.life/24)*0.9;
          ctx.fillStyle = p.c;
          ctx.fillRect(p.x, p.y, 3*DPR, 3*DPR);
          if (p.life<=0) particles.splice(idx,1);
        });
        ctx.restore();
      }
      requestAnimationFrame(fx);

      // 문구 교체(예시)
      const caption = document.querySelector('.strip p + p, .s-t-02');
      if (caption){
        caption.dataset.old = caption.innerHTML;
        caption.innerHTML = 'Start your own data clock, privately and verifiably.';
        setTimeout(()=>{ caption.innerHTML = caption.dataset.old; }, 4000);
      }
    });
  }


})();

