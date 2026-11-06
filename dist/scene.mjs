// All visual marks are schematic. This renderer is not an individual-fish model.
export class OceanScene {
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.record=null;this.showLice=false;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
    this.start=performance.now();this.lastDraw=0;this.draw=this.draw.bind(this);requestAnimationFrame(this.draw);
  }
  resize(){const r=this.canvas.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);this.dpr=d;this.width=r.width;this.height=r.height;this.dirty=true;}
  update(record,showLice){this.record=record;this.showLice=showLice;this.dirty=true;}
  fish(c,x,y,size,dir,phase,depth,lice){
    c.save();c.translate(x,y);c.scale(dir*size*(this.height/560)/(this.width/1000),size);c.globalAlpha=.48+depth*.42;
    const shimmer=c.createLinearGradient(0,-5,0,7);shimmer.addColorStop(0,'#75989c');shimmer.addColorStop(.42,'#c9d6c5');shimmer.addColorStop(.55,'#aec5bc');shimmer.addColorStop(1,'#658f91');
    c.fillStyle=shimmer;c.beginPath();c.moveTo(-17,0);c.bezierCurveTo(-5,-9,13,-8,20,-1);c.bezierCurveTo(21,1,11,5,1,6);c.bezierCurveTo(-7,5,-12,3,-17,0);c.fill();
    c.fillStyle='#8caaa6';const tail=Math.sin(phase)*2;c.beginPath();c.moveTo(-15,0);c.lineTo(-26,-7+tail);c.lineTo(-23,0);c.lineTo(-26,7+tail);c.closePath();c.fill();
    c.beginPath();c.moveTo(-5,-5);c.lineTo(1,-11);c.lineTo(7,-5);c.closePath();c.fill();
    c.fillStyle='#567f80';c.beginPath();c.moveTo(5,2);c.lineTo(0,9);c.lineTo(-1,3);c.fill();
    c.strokeStyle='#547b7b';c.lineWidth=.5;c.beginPath();c.moveTo(10,-4);c.quadraticCurveTo(6,0,10,4);c.stroke();
    c.fillStyle='#203f44';c.beginPath();c.arc(15,-1.7,1.1,0,Math.PI*2);c.fill();
    c.globalAlpha*=.65;for(let k=0;k<5;k++){c.beginPath();c.arc(-7+k*3,-2+(k%2),.5,0,Math.PI*2);c.fill();}
    if(lice){c.globalAlpha=.95;c.fillStyle='#e8b976';for(let k=0;k<Math.min(4,Math.ceil(lice));k++){c.beginPath();c.ellipse(-6+k*4,-1+(k%2)*3,1.5,1,0,0,Math.PI*2);c.fill();}}
    c.restore();
  }
  draw(now){
    requestAnimationFrame(this.draw);if(document.hidden)return;
    if(now-this.lastDraw<40 || (this.reduced&&!this.dirty))return;
    this.lastDraw=now;this.dirty=false;const c=this.ctx;if(!this.width)return;
    const w=this.width,h=this.height, sx=w/1000,sy=h/560;
    c.setTransform(this.dpr*sx,0,0,this.dpr*sy,0,0);
    const t=this.reduced?4:(now-this.start)/1000,r=this.record,day=r?.day||0;
    const sky=c.createLinearGradient(0,0,0,200);sky.addColorStop(0,'#264b50');sky.addColorStop(1,'#6f9690');c.fillStyle=sky;c.fillRect(0,0,1000,560);
    c.fillStyle='#406967';c.beginPath();c.moveTo(0,145);c.lineTo(0,79);c.lineTo(55,98);c.lineTo(127,83);c.lineTo(215,116);c.lineTo(291,107);c.lineTo(357,143);c.lineTo(1000,143);c.lineTo(1000,80);c.lineTo(944,92);c.lineTo(874,74);c.lineTo(809,111);c.lineTo(727,117);c.lineTo(650,149);c.closePath();c.fill();
    c.fillStyle='#335955';c.beginPath();c.moveTo(0,121);c.lineTo(99,140);c.lineTo(159,137);c.lineTo(252,166);c.lineTo(0,170);c.fill();c.beginPath();c.moveTo(1000,121);c.lineTo(935,141);c.lineTo(846,138);c.lineTo(737,163);c.lineTo(1000,170);c.fill();
    const water=c.createLinearGradient(0,150,0,560);water.addColorStop(0,'#3b797b');water.addColorStop(.18,'#27646d');water.addColorStop(.7,'#184750');water.addColorStop(1,'#123b43');c.fillStyle=water;c.fillRect(0,160,1000,400);
    // Sunlight is illustrative; simulated temperature remains in the numerical label.
    c.save();c.globalAlpha=.045;c.fillStyle='#e4efd0';for(let i=0;i<5;i++){const x=300+i*122+Math.sin(t*.12)*25;c.beginPath();c.moveTo(x,160);c.lineTo(x+25,160);c.lineTo(x-100,560);c.lineTo(x-220,560);c.fill();}c.restore();
    c.strokeStyle='#8eb9ad';c.lineWidth=1;c.globalAlpha=.16;
    for(let i=0;i<20;i++){const x=(i*83+Math.sin(t*.17+i)*8)%1000,y=163+(i%5)*10;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+18,y-3,x+39,y);c.stroke();}c.globalAlpha=1;
    // An elliptical sea cage. Front mesh stays translucent to keep the system visible.
    const cx=555,top=210,bottom=415,rx=254,ry=49;
    c.strokeStyle='#a2bab031';c.lineWidth=1.1;
    for(let k=0;k<10;k++){const a=Math.PI+k*Math.PI/9,x=cx+rx*Math.cos(a),y=top+ry*Math.sin(a);c.beginPath();c.moveTo(x,y);c.lineTo(cx+rx*.82*Math.cos(a),bottom+ry*.7*Math.sin(a));c.stroke();}
    for(let k=1;k<6;k++){const q=k/6;c.beginPath();c.ellipse(cx,top+(bottom-top)*q,rx*(1-.18*q),ry*(1-.3*q),0,Math.PI,2*Math.PI);c.stroke();}
    const shadow=c.createRadialGradient(cx,410,20,cx,410,230);shadow.addColorStop(0,'#062a3244');shadow.addColorStop(1,'#062a3200');c.fillStyle=shadow;c.fillRect(cx-260,280,520,210);
    // Fish are representative marks. Their number follows a fraction of survival.
    const growth=r?Math.cbrt(r.W/150):1, count=Math.max(3,Math.round(37*(r?.N||100000)/(this.initialFish||100000)));
    const fish=[];for(let i=0;i<count;i++){
      const a=i*2.399+t*(.13+(i%4)*.018),depth=(Math.sin(a)+1)/2;
      fish.push({i,a,depth,x:cx+Math.cos(a)*(126+(i%5)*17),y:top+64+(i%7)*17+Math.sin(a)*28});
    }
    fish.sort((a,b)=>a.depth-b.depth);
    for(const f of fish){const size=(.40+growth*.14)*(.72+f.depth*.30);this.fish(c,f.x,f.y,size,Math.sin(f.a)>0?-1:1,t*5+f.i,f.depth,this.showLice&&r?.mobile>.08?r.mobile:0);}
    c.strokeStyle='#a8cbb330';c.lineWidth=.9;
    for(let k=0;k<16;k++){const a=k*Math.PI/15,x=cx+rx*Math.cos(a),y=top+ry*Math.sin(a);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(cx+rx*.94*Math.cos(a),320,cx+rx*.82*Math.cos(a),bottom+ry*.7*Math.sin(a));c.stroke();}
    for(let k=1;k<=7;k++){const q=k/7;c.beginPath();c.ellipse(cx,top+(bottom-top)*q,rx*(1-.18*q),ry*(1-.3*q),0,0,Math.PI);c.stroke();}
    // Mooring lines.
    c.strokeStyle='#b4c8b447';c.lineWidth=1.5;for(const [x,y,ex,ey] of [[cx-rx,top,66,310],[cx+rx,top,1008,298],[cx-190,top+32,114,501],[cx+190,top+32,963,500]]){c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.stroke();}
    c.beginPath();c.ellipse(cx,top,rx,ry,0,0,Math.PI*2);c.strokeStyle='#1b3d42';c.lineWidth=13;c.stroke();c.strokeStyle='#78958d';c.lineWidth=6;c.stroke();
    c.beginPath();c.ellipse(cx,top-9,rx,ry,0,0,Math.PI*2);c.strokeStyle='#a3b7a17a';c.lineWidth=1.3;c.stroke();
    for(let k=0;k<12;k++){const a=k*Math.PI/6;const x=cx+rx*Math.cos(a),y=top+ry*Math.sin(a);c.strokeStyle='#97af9b';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-11);c.stroke();if(k%3===0){c.fillStyle='#c3ad69';c.beginPath();c.ellipse(x,y,6,4,0,0,Math.PI*2);c.fill();}}
    // Feed and free-swimming particles are explicitly magnified schematic marks.
    if(this.showLice&&r?.R>0){const n=Math.min(55,Math.ceil(r.R/3000));c.fillStyle='#e4bb76';for(let i=0;i<n;i++){const x=230+(i*79.7+t*10)%650,y=220+(i*31.7+Math.sin(t+i)*6)%195;c.globalAlpha=.3+(i%3)*.18;c.beginPath();c.arc(x,y,1.2+(i%3)*.3,0,Math.PI*2);c.fill();}c.globalAlpha=1;c.font='10px -apple-system, sans-serif';c.fillStyle='#e5c187';c.fillText('Parasite marks are magnified for visibility',32,188);}
    if(r?.recovery>0){c.strokeStyle='#d9e5b3';c.lineWidth=1.2;c.globalAlpha=.4;for(let i=0;i<3;i++){c.beginPath();c.ellipse(cx,top+60+i*30,rx*.8,35,0,0,Math.PI*2);c.stroke();}c.globalAlpha=1;}
    for(let i=0;i<18;i++){c.fillStyle='#b1d1bc';c.globalAlpha=.12;const x=(i*137)%1000,y=230+(i*67-t*3)%300;c.beginPath();c.arc(x,y,1,0,Math.PI*2);c.fill();}c.globalAlpha=1;
    const bottomFade=c.createLinearGradient(0,420,0,560);bottomFade.addColorStop(0,'#123b4300');bottomFade.addColorStop(1,'#12343ee0');c.fillStyle=bottomFade;c.fillRect(0,410,1000,150);
  }
}
