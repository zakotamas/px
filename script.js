const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const W=1e6, ORG=W/2, MAXS=64, BIO_MAX=400, BG='#f3f4f7', ACC='#4338ca';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n.toLocaleString('hu-HU');
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const NAME_RE=/^[\p{L}\p{N}_.-]{3,20}$/u;
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const SEED=(Math.random()*4294967296)>>>0;   // minden oldalbetöltéskor új alakzat

/* ---------- Adat (prototípus: localStorage) ---------- */
let S={users:[],items:[]}, me=localStorage.getItem('mv_me')||null;
try{
 const j=JSON.parse(localStorage.getItem('mv2')||'null');
 if(j&&j.users&&j.items)S=j;
 else{const o=JSON.parse(localStorage.getItem('mv_state')||'null'); // régi verzió átvétele
  if(o){S.users=(o.users||[]).map(u=>({name:u.name,h:u.h,bio:''}));S.items=(o.items||[]).filter(i=>i.src)}}
}catch{}
S.items=S.items.filter(i=>!i.demo);
if(me&&!S.users.some(u=>u.name===me))me=null;
function save(){
 try{localStorage.setItem('mv2',JSON.stringify({users:S.users,items:S.items.filter(i=>!i.demo).map(({x,y,...r})=>r)}))}
 catch{toast('Betelt a böngésző tárhelye – törölj régi képeket.')}
}
const BIOS=['Pixelvadász, aki szereti a rendet a káoszban.','Hétvégi fotós, hétköznapi álmodozó.','Színek, formák és egy csésze kávé.','Ez az én kis sarkom a vásznon.','Minden nagy mozaik egy apró folttal kezdődik.','Szeretem a tengert, a hegyeket és a jó zenét.','Grafikus vagyok, de itt csak játszom.','Itt vagyok, hogy színt vigyek a vászonra.','','Kíváncsi vagyok, meddig terjed ez a mozaik.'];
(function demo(){
 const r=rng(SEED^0x9e3779b9),names=['Anna','Bence','Csilla','Dávid','Eszter','Ferenc','Gréta','Huba','Ilona','János','Kata','László','Mónika','Nándor','Orsi','Péter'];
 const all=[...S.items];
 for(let i=0;i<450;i++){
  const size=Math.max(1,Math.round(100*Math.pow(r(),3.3)));
  all.push({id:'d'+i,demo:1,owner:names[i%16]+(10+i%89),size,paused:false,t:Date.now()-r()*3e10,h:Math.round(r()*360),k:Math.floor(r()*4),bio:BIOS[Math.floor(r()*BIOS.length)]});
 }
 const q=rng(SEED+7);for(let i=all.length-1;i>0;i--){const j=Math.floor(q()*(i+1));[all[i],all[j]]=[all[j],all[i]]}
 S.items=all;
})();
const userOf=n=>S.users.find(u=>u.name===n);
const bioOf=n=>{const u=userOf(n);if(u)return u.bio||'';const d=S.items.find(i=>i.owner===n&&i.demo);return d?d.bio||'':''};
const allNames=()=>{const m=new Map();for(const i of S.items)m.set(i.owner.toLowerCase(),i.owner);for(const u of S.users)m.set(u.name.toLowerCase(),u.name);return[...m.values()]};
const taken=n=>allNames().some(x=>x.toLowerCase()===n.toLowerCase());

/* ---------- Elrendezés: összefüggő, szabálytalan alakzat ----------
   Minden kép egész egységekre igazodik és legalább egy oldalával érintkezik
   egy már lerakott képpel, így nincs köztük üres hely. A forma a session-seedből
   származik (oldalfrissítésenként más); a seed állandó, így törlés/átméretezés
   után sem keletkezik lyuk, az alakzat jellege pedig megmarad. */
let B={x0:ORG-100,y0:ORG-100,x1:ORG+100,y1:ORG+100};
function layout(){
 const r=rng(SEED+1),G=new Map(),placed=[],CS=128;
 const ax=.7+r()*.7,p1=r()*6.283,p2=r()*6.283,p3=r()*6.283,a1=.22+r()*.22,a2=.12+r()*.18;
 const rad=t=>1+a1*Math.sin(2*t+p1)+a2*Math.sin(3*t+p2)+.1*Math.sin(5*t+p3);
 const cells=(x,y,s)=>{const o=[];for(let i=Math.floor(x/CS);i<=Math.floor((x+s-1)/CS);i++)for(let j=Math.floor(y/CS);j<=Math.floor((y+s-1)/CS);j++)o.push(i*100003+j);return o};
 const free=(x,y,s)=>{for(const k of cells(x,y,s)){const a=G.get(k);if(a)for(const o of a)if(x<o.x+o.size&&x+s>o.x&&y<o.y+o.size&&y+s>o.y)return false}return true};
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
 for(const it of S.items){
  const s=it.size;
  if(!placed.length){it.x=ORG-Math.floor(s/2);it.y=ORG-Math.floor(s/2)}
  else{
   let bx=null,by=0,bs=1e18;
   for(let round=0;round<30&&bx===null;round++)for(let t=0;t<48;t++){
    const o=placed[(r()*placed.length)|0],side=(r()*4)|0,off=Math.floor(r()*(o.size+s-1))-(s-1);
    let x,y;
    if(side===0){x=o.x+o.size;y=o.y+off}else if(side===1){x=o.x-s;y=o.y+off}
    else if(side===2){x=o.x+off;y=o.y+o.size}else{x=o.x+off;y=o.y-s}
    if(!free(x,y,s))continue;
    const dx=(x+s/2-ORG)/ax,dy=y+s/2-ORG,sc=Math.hypot(dx,dy)/rad(Math.atan2(dy,dx))+r()*40;
    if(sc<bs){bs=sc;bx=x;by=y}
   }
   if(bx===null){bx=x1;by=y0}
   it.x=bx;it.y=by;
  }
  placed.push(it);for(const k of cells(it.x,it.y,s)){let a=G.get(k);if(!a)G.set(k,a=[]);a.push(it)}
  x0=Math.min(x0,it.x);y0=Math.min(y0,it.y);x1=Math.max(x1,it.x+s);y1=Math.max(y1,it.y+s);
 }
 if(placed.length)B={x0,y0,x1,y1};
 dirty=1;
}

/* ---------- Bitmapek és részletességi szintek (LOD) ---------- */
const BM=new Map();
function bitmap(it){
 let b=BM.get(it.id);if(b)return b.ok?b:null;
 b={ok:false};BM.set(it.id,b);
 if(it.src){const im=new Image();im.onload=()=>{finish(b,im);dirty=1};im.src=it.src}
 else{
  const c=mk(96),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,96,96);
  gr.addColorStop(0,`hsl(${it.h},80%,62%)`);gr.addColorStop(1,`hsl(${(it.h+70)%360},75%,36%)`);
  g.fillStyle=gr;g.fillRect(0,0,96,96);g.fillStyle=`hsla(${(it.h+180)%360},90%,75%,.8)`;
  if(it.k==0){g.beginPath();g.arc(48,48,28,0,7);g.fill()}
  else if(it.k==1)for(let i=0;i<6;i++)g.fillRect(0,i*16+4,96,7);
  else if(it.k==2){g.beginPath();g.moveTo(48,12);g.lineTo(86,84);g.lineTo(10,84);g.fill()}
  else for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2)g.fillRect(i*24,j*24,24,24);
  finish(b,c);
 }
 return b.ok?b:null;
}
function mk(n){const c=document.createElement('canvas');c.width=c.height=n;return c}
function finish(b,src){
 b.full=src;b.m8=mk(8);b.m32=mk(32);
 b.m8.getContext('2d').drawImage(src,0,0,8,8);b.m32.getContext('2d').drawImage(src,0,0,32,32);
 const c=mk(1).getContext('2d');c.drawImage(src,0,0,1,1);const d=c.getImageData(0,0,1,1).data;
 b.col=`rgb(${d[0]},${d[1]},${d[2]})`;b.ok=true;
}

/* ---------- Vászon motor ---------- */
const cv=$('#cv'),ctx=cv.getContext('2d');
let vw=0,vh=0,dpr=1,dirty=1,sel=null,hover=null;
const cam={x:ORG,y:ORG,s:1};
const fit=()=>Math.min(vw/((B.x1-B.x0)*1.12),vh/((B.y1-B.y0)*1.2))||1;
const minS=()=>fit()*.5;
function resize(){dpr=window.devicePixelRatio||1;const r=cv.getBoundingClientRect();vw=r.width;vh=r.height;cv.width=vw*dpr;cv.height=vh*dpr;clamp();dirty=1}
function home(anim=true){goTo((B.x0+B.x1)/2,(B.y0+B.y1)/2,fit(),anim)}
function clamp(){
 cam.s=Math.min(MAXS,Math.max(minS(),cam.s));
 const mx=(B.x1-B.x0)*.3,my=(B.y1-B.y0)*.3;
 cam.x=Math.min(B.x1+mx,Math.max(B.x0-mx,cam.x));cam.y=Math.min(B.y1+my,Math.max(B.y0-my,cam.y));
}
let tw=0;
function goTo(x,y,s,anim=true){
 const a={...cam},t=anim?600:1,t0=performance.now();cancelAnimationFrame(tw);
 const step=n=>{let k=Math.min(1,(n-t0)/t);k=1-Math.pow(1-k,3);
  cam.s=Math.exp(Math.log(a.s)+(Math.log(s)-Math.log(a.s))*k);cam.x=a.x+(x-a.x)*k;cam.y=a.y+(y-a.y)*k;clamp();dirty=1;
  if(k<1)tw=requestAnimationFrame(step)};
 tw=requestAnimationFrame(step);
}
const w2s=(x,y)=>[(x-cam.x)*cam.s+vw/2,(y-cam.y)*cam.s+vh/2];
const s2w=(x,y)=>[(x-vw/2)/cam.s+cam.x,(y-vh/2)/cam.s+cam.y];
function zoomAt(f,px=vw/2,py=vh/2){
 const [wx,wy]=s2w(px,py);cam.s*=f;clamp();cam.x=wx-(px-vw/2)/cam.s;cam.y=wy-(py-vh/2)/cam.s;clamp();dirty=1;
}
function draw(){
 const s=cam.s,z=s/fit();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=BG;ctx.fillRect(0,0,vw,vh);
 if(s>10){ // finom egységrács
  ctx.strokeStyle='rgba(20,22,35,.05)';ctx.lineWidth=1;ctx.beginPath();
  const [x0,y0]=s2w(0,0),[x1,y1]=s2w(vw,vh);
  for(let x=Math.floor(x0);x<=x1;x++){const p=Math.round((x-cam.x)*s+vw/2)+.5;ctx.moveTo(p,0);ctx.lineTo(p,vh)}
  for(let y=Math.floor(y0);y<=y1;y++){const p=Math.round((y-cam.y)*s+vh/2)+.5;ctx.moveTo(0,p);ctx.lineTo(vw,p)}
  ctx.stroke();
 }
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const sep=[],mine=[];
 for(const it of S.items){
  const sx=(it.x-cam.x)*s+vw/2,sy=(it.y-cam.y)*s+vh/2,d=it.size*s;
  if(sx>vw||sy>vh||sx+d<0||sy+d<0)continue;
  const dd=Math.max(d,2);
  if(it.paused){ctx.fillStyle='#cdd1dd';ctx.fillRect(sx,sy,dd,dd);
   if(d>40){ctx.fillStyle='#6b7182';ctx.font='700 '+Math.min(d/6,22)+'px Manrope,sans-serif';ctx.textAlign='center';ctx.fillText('szünetel',sx+d/2,sy+d/2+4)}}
  else{
   const b=bitmap(it);
   if(!b){ctx.fillStyle='#d5d9e4';ctx.fillRect(sx,sy,dd,dd)}
   else if(d<3){ctx.fillStyle=b.col;ctx.fillRect(sx,sy,dd,dd)}                          // 1. szint: színfolt
   else ctx.drawImage(d<14?b.m8:d<60?b.m32:b.full,sx,sy,d,d);                           // 2–3. szint
  }
  if(d>=3)sep.push(sx,sy,d);
  if(it.owner===me&&d>=3)mine.push(sx,sy,d);
 }
 if(sep.length){ // vékony, esztétikus elválasztó vonal a szomszédos képek között
  ctx.beginPath();for(let i=0;i<sep.length;i+=3)ctx.rect(sep[i],sep[i+1],sep[i+2],sep[i+2]);
  ctx.strokeStyle=BG;ctx.lineWidth=Math.min(2,Math.max(.8,Math.sqrt(s)*.35));ctx.stroke();
 }
 if(mine.length){ctx.beginPath();for(let i=0;i<mine.length;i+=3)ctx.rect(mine[i]+1,mine[i+1]+1,mine[i+2]-2,mine[i+2]-2);ctx.strokeStyle=ACC;ctx.lineWidth=1.5;ctx.stroke()}
 for(const [it,c,w] of [[hover,'rgba(20,22,35,.85)',1.5],[sel,ACC,3]]){
  if(!it)continue;const [sx,sy]=w2s(it.x,it.y),d=Math.max(it.size*s,6);
  ctx.strokeStyle=c;ctx.lineWidth=w;ctx.strokeRect(sx,sy,d,d);
 }
 const lv=z<1.8?['1. szint','Távoli nézet']:z<10?['2. szint','Közepes nagyítás']:['3. szint','Maximális nagyítás'];
 $('#lvl').textContent=lv[0]+' · '+lv[1];
 $('#crd').textContent=`${z<10?z.toFixed(1):Math.round(z)}× nagyítás`;
}
(function loop(){if(dirty){dirty=0;draw()}requestAnimationFrame(loop)})();
const hit=(px,py)=>{const [x,y]=s2w(px,py);for(let i=S.items.length-1;i>=0;i--){const o=S.items[i];if(x>=o.x&&x<o.x+o.size&&y>=o.y&&y<o.y+o.size)return o}return null};

/* érintés / egér: húzás, kétujjas nagyítás, görgő */
const ptr=new Map();let moved=0,pd=0;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,[e.offsetX,e.offsetY]);moved=0;cancelAnimationFrame(tw);cv.classList.add('drag');
 if(ptr.size===2){const [a,b]=[...ptr.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1])}});
cv.addEventListener('pointermove',e=>{
 const p=ptr.get(e.pointerId);
 if(!p){const h=hit(e.offsetX,e.offsetY);if(h!==hover){hover=h;cv.classList.toggle('hov',!!h);dirty=1}return}
 if(ptr.size===1){const dx=e.offsetX-p[0],dy=e.offsetY-p[1];moved+=Math.abs(dx)+Math.abs(dy);cam.x-=dx/cam.s;cam.y-=dy/cam.s;clamp();dirty=1}
 else if(ptr.size===2){
  ptr.set(e.pointerId,[e.offsetX,e.offsetY]);const [a,b]=[...ptr.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);
  if(pd)zoomAt(d/pd,(a[0]+b[0])/2,(a[1]+b[1])/2);pd=d;moved=99;return}
 ptr.set(e.pointerId,[e.offsetX,e.offsetY]);
});
const up=e=>{if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);if(!ptr.size){cv.classList.remove('drag');
 if(e.type==='pointerup'&&moved<6)pick(hit(e.offsetX,e.offsetY))}pd=0};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(Math.exp(-e.deltaY*(e.ctrlKey?.01:.0016)),e.offsetX,e.offsetY)},{passive:false});
$('#zi').onclick=()=>zoomAt(1.6);$('#zo').onclick=()=>zoomAt(1/1.6);$('#zf').onclick=()=>home();
addEventListener('resize',resize);

/* ---------- Keresés névre ---------- */
const sIn=$('#goIn'),sr=$('#sr');
function results(){
 const q=norm(sIn.value.trim());if(!q)return null;
 return allNames().filter(n=>norm(n).includes(q))
  .sort((a,b)=>(norm(a).startsWith(q)?0:1)-(norm(b).startsWith(q)?0:1)||a.localeCompare(b,'hu')).slice(0,6);
}
function renderSearch(){
 const res=results();
 if(!res){sr.classList.remove('on');return}
 sr.innerHTML=res.length?res.map(n=>`<button type="button" data-n="${esc(n)}"><span class="av">${esc(n[0].toUpperCase())}</span>${esc(n)}</button>`).join(''):'<div class="none">Nincs ilyen nevű felhasználó.</div>';
 sr.classList.add('on');
}
function gotoUser(n){
 sr.classList.remove('on');sIn.value=n;sIn.blur();
 const it=S.items.find(i=>i.owner===n);
 if(it){pick(it);focusItem(it)}else profile(n);
}
sIn.oninput=renderSearch;sIn.onfocus=renderSearch;
sIn.onkeydown=e=>{
 if(e.key==='Enter'){const r=results();if(r&&r.length)gotoUser(r[0]);else if(r)toast('Nincs ilyen nevű felhasználó.')}
 else if(e.key==='Escape')sr.classList.remove('on');
};
sr.onclick=e=>{const b=e.target.closest('[data-n]');if(b)gotoUser(b.dataset.n)};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#go'))sr.classList.remove('on')});

/* ---------- Kiválasztott kép infókártyája ---------- */
function pick(it){
 sel=it;dirty=1;const el=$('#info');
 if(!it){el.classList.remove('on');return}
 el.innerHTML=`<div class="row"><div class="av">${esc(it.owner[0].toUpperCase())}</div><div><h3>${esc(it.owner)}</h3></div></div>
 <p>${it.size}×${it.size} egység · feltöltve: ${new Date(it.t).toLocaleDateString('hu-HU')}${it.paused?' · szünetel':''}</p>
 <div class="row"><button class="btn sm pri" id="iP">Profil</button><button class="btn sm" id="iZ">Ráközelítés</button><button class="btn sm" id="iC">Bezár</button></div>`;
 el.classList.add('on');
 $('#iP').onclick=()=>profile(it.owner);$('#iZ').onclick=()=>focusItem(it);$('#iC').onclick=()=>pick(null);
}
const focusItem=it=>goTo(it.x+it.size/2,it.y+it.size/2,Math.min(MAXS,Math.max(8,Math.min(vw,vh)*.55/it.size)));

/* ---------- Képek módosítása (átméretezés, csere, törlés) ---------- */
function resizeItem(it,ns){it.size=ns;layout();save();stats()}
let repl=null;
$('#rFile').onchange=async e=>{
 const f=e.target.files[0];e.target.value='';if(!f||!repl)return;
 try{const {c}=await toSquare(f);repl.src=c.toDataURL('image/jpeg',.88);BM.delete(repl.id);save();dirty=1;toast('Kép lecserélve.');profile(me)}
 catch(err){toast(String(err))}
};

/* ---------- Profil ---------- */
function profile(name,edit=false){
 const items=S.items.filter(i=>i.owner===name),px=items.reduce((a,i)=>a+i.size*i.size,0),mine=name===me,u=userOf(name),bio=bioOf(name);
 $('#pN').textContent=mine?'Saját profilom':'Profil';
 const B2=$('#pB'),canEdit=mine&&u;
 B2.innerHTML=`<div class="who"><div class="av lg">${esc(name[0].toUpperCase())}</div><div><h3>${esc(name)}</h3><span class="hint">${items.length} kép a vásznon</span></div></div>`
 +(edit&&canEdit?`<div class="edit">
   <div><label for="eName">Felhasználónév</label><input id="eName" class="in" maxlength="20" value="${esc(name)}" autocomplete="username"></div>
   <div><label for="eBio">Leírás</label><textarea id="eBio" class="in" maxlength="${BIO_MAX}" rows="5">${esc(u.bio||'')}</textarea><div class="cnt"><span id="eCnt">0</span> / ${BIO_MAX}</div></div>
   <div><label for="ePass">Új jelszó <span class="opt">(csak ha módosítanád)</span></label><input id="ePass" type="password" class="in" autocomplete="new-password"></div>
   <div class="err" id="eErr"></div>
   <div class="row"><button class="btn sm pri" id="eS">Mentés</button><button class="btn sm" id="eC">Mégse</button></div></div>`
  :`<div class="bio${bio?'':' empty'}">${bio?esc(bio):'Nincs megadott leírás.'}</div>${canEdit?'<div><button class="btn sm" id="pE">Profil szerkesztése</button></div>':''}`)
 +`<div class="kpi"><div><b>${items.length}</b><span>kép</span></div><div><b>${fmt(px)}</b><span>foglalt pixel</span></div></div>
 <div class="list" id="pl">${items.length?'':'<p class="hint">Még nincs feltöltött kép.'+(mine?' Kattints a „Kép feltöltése” gombra.':'')+'</p>'}</div>`;
 if(canEdit){
  if(edit){
   const t=$('#eBio'),c=$('#eCnt');c.textContent=t.value.length;t.oninput=()=>c.textContent=t.value.length;
   $('#eC').onclick=()=>profile(name);$('#eS').onclick=()=>saveProfile(u,name);
  }else $('#pE').onclick=()=>profile(name,true);
 }
 const L=$('#pl');
 for(const it of items){
  const li=document.createElement('div');li.className='li';
  let th;if(it.src){th=new Image();th.src=it.src;th.alt=''}else{th=mk(56);th.getContext('2d').drawImage(bitmap(it)?.full||th,0,0,56,56)}
  const m=document.createElement('div');m.className='m';
  const lab=document.createElement('b');lab.textContent=it.size+'×'+it.size+' egység';
  const sub=document.createElement('div');sub.textContent='Feltöltve: '+new Date(it.t).toLocaleDateString('hu-HU')+(it.paused?' · szünetel':'');
  m.append(lab,sub);
  const go=document.createElement('button');go.className='btn sm';go.textContent='Megnézem';go.onclick=()=>{$('#dProf').close();pick(it);focusItem(it)};
  li.append(th,m);
  if(mine){
   const r=document.createElement('input');r.type='range';r.min=1;r.max=100;r.value=it.size;r.setAttribute('aria-label','Méret módosítása');
   r.oninput=()=>lab.textContent=r.value+'×'+r.value+' egység';
   r.onchange=()=>{resizeItem(it,+r.value);profile(name);toast('Méret módosítva.')};
   m.append(r);
   const bs=document.createElement('div');bs.className='row';
   const rp=document.createElement('button');rp.className='btn sm';rp.textContent='Kép cseréje';rp.onclick=()=>{repl=it;$('#rFile').click()};
   const p=document.createElement('button');p.className='btn sm';p.textContent=it.paused?'Folytatás':'Szüneteltetés';
   p.onclick=()=>{it.paused=!it.paused;save();dirty=1;profile(name)};
   const d=document.createElement('button');d.className='btn sm dng';d.textContent='Törlés';
   d.onclick=()=>{if(confirm('Biztosan törlöd ezt a képet?')){S.items=S.items.filter(o=>o!==it);BM.delete(it.id);if(sel===it)pick(null);layout();save();profile(name);stats()}};
   bs.append(go,rp,p,d);m.append(bs);
  }else li.append(go);
  L.append(li);
 }
 if(!$('#dProf').open)$('#dProf').showModal();
}
async function saveProfile(u,name){
 const nn=$('#eName').value.trim(),bio=$('#eBio').value.slice(0,BIO_MAX),pw=$('#ePass').value,E=$('#eErr');
 if(!NAME_RE.test(nn))return E.textContent='A név 3–20 karakter lehet (betű, szám, _ . -).';
 if(nn.toLowerCase()!==name.toLowerCase()&&taken(nn))return E.textContent='Ez a név már foglalt.';
 if(pw&&pw.length<6)return E.textContent='A jelszó legalább 6 karakter legyen.';
 if(pw)u.h=await hash(pw);
 u.name=nn;u.bio=bio;S.items.forEach(i=>{if(i.owner===name)i.owner=nn});
 setMe(nn);save();stats();dirty=1;if(sel)pick(sel);toast('Profil mentve.');profile(nn);
}

/* ---------- Belépés / regisztráció (prototípus) ---------- */
let mode='login',after=null;
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('mv'+s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
$$('[data-tab]').forEach(b=>b.onclick=()=>{mode=b.dataset.tab;$$('[data-tab]').forEach(x=>x.classList.toggle('on',x===b));
 $('#aGo').textContent=mode==='login'?'Belépés':'Fiók létrehozása';$('#aBioW').hidden=mode!=='reg';
 $('#aPass').autocomplete=mode==='login'?'current-password':'new-password';$('#aErr').textContent=''});
$('#aBio').oninput=e=>$('#aCnt').textContent=e.target.value.length;
$('#aGo').onclick=async()=>{
 const u=$('#aUser').value.trim(),p=$('#aPass').value,E=$('#aErr');
 if(!NAME_RE.test(u))return E.textContent='A név 3–20 karakter lehet (betű, szám, _ . -).';
 if(p.length<6)return E.textContent='A jelszó legalább 6 karakter legyen.';
 const h=await hash(p),ex=S.users.find(x=>x.name.toLowerCase()===u.toLowerCase());
 if(mode==='reg'){
  if(taken(u))return E.textContent='Ez a név már foglalt.';
  S.users.push({name:u,h,bio:$('#aBio').value.trim().slice(0,BIO_MAX)});save();setMe(u);toast('Üdv a vásznon, '+u+'!');
 }else{if(!ex||ex.h!==h)return E.textContent='Hibás név vagy jelszó.';setMe(ex.name);toast('Üdv újra, '+ex.name+'!')}
 $('#dAuth').close();$('#aPass').value='';$('#aBio').value='';$('#aCnt').textContent=0;E.textContent='';
 if(after){const f=after;after=null;f()}
};
function setMe(u){me=u;u?localStorage.setItem('mv_me',u):localStorage.removeItem('mv_me');
 $('#authBtn').innerHTML=u?'Kilépés<span class="hm"> ('+esc(u)+')</span>':'Belépés';dirty=1}
function needLogin(f){if(me)return f();after=f;$('#dAuth').showModal();$('#aUser').focus()}

/* ---------- Feltöltés ---------- */
let upC=null;
const drop=$('#drop'),file=$('#file');
drop.onclick=()=>file.click();drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();file.click()}};
file.onchange=()=>file.files[0]&&loadFile(file.files[0]);
['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(t=>drop.addEventListener(t,()=>drop.classList.remove('over')));
drop.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();const f=e.dataTransfer.files[0];f&&loadFile(f)});
function toSquare(f){return new Promise((ok,no)=>{
 if(!f.type.startsWith('image/'))return no('Ez nem képfájl. Válassz JPG, PNG, WebP vagy GIF képet.');
 if(f.size>15*1048576)return no('A kép túl nagy (legfeljebb 15 MB).');
 const im=new Image(),u=URL.createObjectURL(f);
 im.onload=()=>{URL.revokeObjectURL(u);
  const n=256,c=mk(n),g=c.getContext('2d'),m=Math.min(im.width,im.height),sx=(im.width-m)/2,sy=(im.height-m)/2;
  g.imageSmoothingQuality='high';g.drawImage(im,sx,sy,m,m,0,0,n,n);ok({c,w:im.width,h:im.height})};
 im.onerror=()=>no('A kép nem olvasható be.');im.src=u})}
async function loadFile(f){
 const E=$('#uErr');E.textContent='';
 try{const {c,w,h}=await toSquare(f);upC=c;
  $('#pvc').getContext('2d').drawImage(c,0,0,128,128);$('#pv').classList.add('on');
  $('#pvt').textContent=f.name+' – középre vágva négyzetre ('+w+'×'+h+' px).'}
 catch(err){E.textContent=String(err)}
}
const syncSz=v=>{v=Math.min(100,Math.max(1,Math.round(+v)||1));$('#szR').value=v;$('#szN').value=v;$('#szH').textContent=`Foglalt terület: ${v}×${v} = ${fmt(v*v)} pixel`;return v};
$('#szR').oninput=e=>syncSz(e.target.value);$('#szN').oninput=e=>{if(e.target.value!=='')syncSz(e.target.value)};$('#szN').onchange=e=>syncSz(e.target.value);
syncSz(10);
function openUpload(f){needLogin(()=>{upC=null;$('#pv').classList.remove('on');$('#uErr').textContent='';$('#dUp').showModal();if(f)loadFile(f)})}
$('#uGo').onclick=()=>{
 if(!upC)return $('#uErr').textContent='Előbb válassz ki egy képet.';
 const size=syncSz($('#szN').value),id='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 const it={id,owner:me,size,paused:false,t:Date.now(),src:upC.toDataURL('image/jpeg',.88)};
 S.items.push(it);layout();save();stats();$('#dUp').close();upC=null;file.value='';
 toast('A kép felkerült a vászonra.');setTimeout(()=>{pick(it);focusItem(it)},150);
};
/* teljes oldalra ejtés is működik */
let dc=0;
addEventListener('dragenter',e=>{if(e.dataTransfer?.types?.includes('Files')){dc++;$('#dz').classList.add('on')}});
addEventListener('dragleave',()=>{if(--dc<=0){dc=0;$('#dz').classList.remove('on')}});
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',e=>{e.preventDefault();dc=0;$('#dz').classList.remove('on');const f=e.dataTransfer.files[0];if(f&&!$('#dUp').open)openUpload(f)});

/* ---------- Menü, felugró ablakok ---------- */
$$('[data-act]').forEach(b=>b.onclick=()=>{
 const a=b.dataset.act;
 if(a==='home')home();
 else if(a==='upload')openUpload();
 else if(a==='mine')needLogin(()=>profile(me));
 else if(a==='how')$('#dHow').showModal();
 else if(a==='auth'){if(me){setMe(null);toast('Kijelentkeztél.')}else $('#dAuth').showModal()}
});
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-close]'))d.close()})});
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),2800)}
function stats(){const px=S.items.reduce((a,i)=>a+i.size*i.size,0);$('#stat').textContent=`${fmt(S.items.length)} kép · ${fmt(px)} foglalt pixel`}

layout();setMe(me);stats();resize();home(false);