/* =========================================================
   SCENES – bovenaanzicht van wegen, voertuigen en animatie
   ========================================================= */
const BL='#2563eb',RD='#dc2b2b',GR='#16a34a',GY='#8b95a3',WH='#f1f3f6';
const RMQ=matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let GLOK=null;const RMQ_LOW=()=>{if(GLOK===null){try{const c=document.createElement('canvas');const g=c.getContext('webgl2')||c.getContext('webgl');GLOK=!!g;g&&g.getExtension('WEBGL_lose_context')?.loseContext()}catch(e){GLOK=false}}return !GLOK};
const FONT='font-family="Overpass,Arial,sans-serif"';

/* ---------- road builders ---------- */
const dash=d=>`<path d="${d}" stroke="#f4f4f4" stroke-width="2.2" stroke-dasharray="11 9" fill="none"/>`;
const curb=d=>`<path d="${d}" stroke="#e4e6ea" stroke-width="2"/>`;
const TROT={s:0,e:-90,n:180,w:90};
const teethArm=a=>`<g transform="rotate(${TROT[a]} 160 160)">${[0,1,2].map(i=>`<path d="M${163+i*12.5} 205 h10 l-5 10 z" fill="#fff"/>`).join('')}</g>`;
const stopLine=a=>`<g transform="rotate(${TROT[a]} 160 160)"><path d="M162 204 H198" stroke="#fff" stroke-width="4"/></g>`;
function cross(o){
 let g=`<rect width="320" height="320" fill="url(#grass)"/>`;const A=[];
 ['n','s','w','e'].forEach(k=>{if(o[k])A.push(k)});
 const SW={n:[106,0,108,120],s:[106,200,108,120],w:[0,106,120,108],e:[200,106,120,108]};
 const RA={n:[120,0,80,124],s:[120,196,80,124],w:[0,120,124,80],e:[196,120,124,80]};
 A.forEach(a=>{const r=SW[a];g+=`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="url(#walk)"/>`});
 g+=`<rect x="106" y="106" width="108" height="108" rx="10" fill="url(#walk)"/>`;
 if(o.bike)g+=`<rect x="214" y="0" width="22" height="320" fill="url(#bikep)"/><rect x="236" y="0" width="14" height="320" fill="url(#walk)"/>`;
 A.forEach(a=>{const r=RA[a];g+=`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="${o.dirt===a?'url(#sand)':'url(#asph2)'}"/>`});
 g+=`<rect x="120" y="120" width="80" height="80" fill="url(#asph2)"/>`;
 A.forEach(a=>{if(o.dirt===a)return;g+=a==='n'?curb('M120 0V120M200 0V120'):a==='s'?curb('M120 200V320M200 200V320'):a==='w'?curb('M0 120H120M0 200H120'):curb('M200 120H320M200 200H320')});
 if(!o.n)g+=curb('M120 120H200');if(!o.s)g+=curb('M120 200H200');if(!o.w)g+=curb('M120 120V200');if(!o.e&&!o.bike)g+=curb('M200 120V200');
 if(o.n)g+=dash('M160 0V112');if(o.s)g+=dash('M160 208V320');if(o.w&&o.dirt!=='w')g+=dash('M0 160H112');if(o.e)g+=dash('M208 160H320');
 if(o.bike)g+=`<rect x="214" y="120" width="22" height="80" fill="url(#bikep)"/><path d="M214 120V200M236 120V200" stroke="#fff" stroke-width="2.4" stroke-dasharray="5 5"/>`;
 if(o.rails)g+=`<path d="M0 175H320M0 187H320" stroke="#9aa3ad" stroke-width="2.2"/><path d="M0 176H320M0 188H320" stroke="#5d646d" stroke-width="1"/>`;
 (o.teeth||[]).forEach(a=>g+=teethArm(a));(o.stops||[]).forEach(a=>g+=stopLine(a));
 return g}
function street(o){ // vertical two-lane street with optional zebra, bus bay, driveway
 let g=`<rect width="320" height="320" fill="url(#grass)"/><rect x="100" width="120" height="320" fill="url(#walk)"/>`;
 if(o.drive)g+=`<rect x="0" y="132" width="106" height="66" fill="url(#lot)"/><path d="M20 132V198M50 132V198M80 132V198" stroke="#fff" stroke-width="1.5" opacity=".8"/>`;
 if(o.bay)g+=`<rect x="200" y="40" width="28" height="164" rx="6" fill="url(#asph2)"/><path d="M228 46V198" stroke="#e4e6ea" stroke-width="2"/>${o.park?'':`<text x="214" y="112" ${FONT} font-size="9" font-weight="800" fill="#ffe38a" text-anchor="middle" transform="rotate(90 214 112)">BUS</text>`}`;
 g+=`<rect x="120" width="80" height="320" fill="url(#asph2)"/>`+curb(o.bay?'M120 0V320M200 0V40M200 204V320':'M120 0V320M200 0V320')+dash('M160 0V320');
 if(o.drive)g+=`<rect x="100" y="132" width="20" height="66" fill="url(#walk)"/><path d="M100 132H120M100 198H120" stroke="#b5b9bf"/>`;
 if(o.zebra!==undefined){for(let x=124;x<198;x+=12)g+=`<rect x="${x}" y="${o.zebra}" width="7" height="30" fill="#f4f4f4"/>`}
 return g}
function roundabout(){let g=cross({n:1,s:1,e:1,w:1});g+=`<circle cx="160" cy="160" r="114" fill="url(#walk)"/><circle cx="160" cy="160" r="102" fill="url(#asph2)"/><circle cx="160" cy="160" r="102" fill="none" stroke="#e4e6ea" stroke-width="2"/>`;
 [[120,0,80,60],[120,260,80,60],[0,120,60,80],[260,120,60,80]].forEach(r=>g+=`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="url(#asph2)"/>`);
 g+=dash('M160 0V50')+dash('M160 270V320')+dash('M0 160H50')+dash('M270 160H320');
 g+=`<circle cx="160" cy="160" r="48" fill="#d9dce1"/><circle cx="160" cy="160" r="42" fill="url(#grass)"/><circle cx="148" cy="152" r="13" fill="#4f8a3a"/><circle cx="172" cy="170" r="10" fill="#5c9a45"/>`;
 for(const r of [0,90,180,270])g+=`<g transform="rotate(${r} 160 160)">${[0,1,2].map(i=>`<path d="M${163+i*12.5} 262 h10 l-5 10 z" fill="#fff"/>`).join('')}</g>`;
 return g}
const highway=()=>`<rect width="320" height="300" fill="url(#grass)"/><rect y="52" width="320" height="8" fill="#b8bdc4"/><rect y="56" width="320" height="2" fill="#7d858f"/><rect y="62" width="320" height="140" fill="url(#asph2)"/>
<path d="M0 226 L250 214 L310 200 H0 Z" fill="url(#asph2)"/><path d="M0 228 L250 216 L310 202" stroke="#e4e6ea" stroke-width="2.4" fill="none"/>
<path d="M0 64H320" stroke="#f4f4f4" stroke-width="2.4"/>${dash('M0 104H320')}${dash('M0 144H320')}
<path d="M0 182H120" stroke="#f4f4f4" stroke-width="2.4"/><path d="M120 182H262" stroke="#f4f4f4" stroke-width="4" stroke-dasharray="6 6"/><path d="M262 182H320" stroke="#f4f4f4" stroke-width="2.4"/>
<rect x="12" y="252" width="190" height="30" rx="15" fill="#0b111acc"/><text x="107" y="272" font-size="13.5" font-weight="800" text-anchor="middle" fill="#fff" ${FONT}>invoegstrook: snelheid maken</text>`;
const zipper=()=>`<rect width="320" height="260" fill="url(#grass)"/><rect y="70" width="320" height="10" fill="#b8bdc4"/><path d="M0 84 H320 V124 H0 Z" fill="url(#asph2)"/><path d="M0 124 H210 L262 124 L262 124 L210 164 H0 Z" fill="url(#asph2)"/><path d="M0 124 H200" stroke="#f4f4f4" stroke-width="2.2" stroke-dasharray="11 9"/><path d="M0 164 H206 L262 126" stroke="#e4e6ea" stroke-width="2.4" fill="none"/><path d="M0 84H320" stroke="#f4f4f4" stroke-width="2.4"/><path d="M262 124 H320" stroke="#e4e6ea" stroke-width="2"/>
<g transform="translate(150 186)"><rect x="-3" y="0" width="6" height="40" fill="#9aa3ad"/><g transform="translate(-22 -36)"><rect width="44" height="40" rx="4" fill="#0d0f12"/><path d="M12 10 L30 28 M30 14 V28 H16" stroke="#f4f4f4" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 5" fill="none"/></g></g>
<rect x="12" y="222" width="196" height="28" rx="14" fill="#0b111acc"/><text x="110" y="241" font-size="13" font-weight="800" text-anchor="middle" fill="#fff" ${FONT}>ritsen: tot vlak voor het einde</text>`;
const roadH=()=>`<rect width="320" height="210" fill="url(#grass)"/><rect y="62" width="320" height="10" fill="url(#walk)"/><rect y="72" width="320" height="88" fill="url(#asph2)"/>${dash('M0 116H320')}<path d="M0 73H320M0 159H320" stroke="#e4e6ea" stroke-width="2"/>`;
const distance=()=>roadH()+`<g transform="translate(200 22)"><ellipse cx="2" cy="40" rx="5" ry="2" fill="#000" opacity=".3"/><rect x="-3" y="0" width="6" height="40" rx="1.5" fill="#f7f7f7" stroke="#9aa3ad"/><rect x="-3" y="4" width="6" height="7" fill="#dc2b2b"/></g>
<text x="214" y="38" font-size="12" font-weight="800" fill="#111" ${FONT}>paal</text>
<g class="timerG"><rect x="98" y="172" width="124" height="28" rx="14" fill="#0b111acc"/><text class="timer" x="160" y="191" text-anchor="middle" fill="#fff">2 seconden</text></g>`;
const stripes=()=>{const pan=(x,y,line,lab)=>`<g transform="translate(${x} ${y})"><rect width="146" height="118" rx="10" fill="url(#asph2)"/>${line}<rect x="8" y="124" width="130" height="24" rx="12" fill="#0b111acc"/><text x="73" y="141" font-size="12" font-weight="800" text-anchor="middle" fill="#fff" ${FONT}>${lab}</text></g>`;
 const cb=(c,da)=>`<rect y="96" width="146" height="22" fill="url(#walk)"/><path d="M0 96H146" stroke="#e4e6ea" stroke-width="2"/><path d="M0 91H146" stroke="${c}" stroke-width="5" ${da?'stroke-dasharray="13 9"':''}/>`;
 return `<rect width="320" height="330" fill="url(#grass)"/>`+pan(10,8,'<path d="M73 0V118" stroke="#f4f4f4" stroke-width="5"/>','doorgetrokken')+pan(164,8,'<path d="M73 0V118" stroke="#f4f4f4" stroke-width="5" stroke-dasharray="18 12"/>','onderbroken')+pan(10,170,cb('#ffc21a'),'geel: stilstaan verboden')+pan(164,170,cb('#ffc21a',1),'geel: parkeren verboden')};
const post=(x,y,k,sc=.42)=>`<g class="post" data-x="${x}" data-y="${y}" data-k="${k}" transform="translate(${x} ${y})"><ellipse cx="2" cy="44" rx="7" ry="3" fill="#000" opacity=".25"/><rect x="-1.6" y="2" width="3.2" height="42" rx="1.5" fill="#9aa3ad"/><g transform="translate(${-50*sc} ${-100*sc+6}) scale(${sc})">${SG[k][1]}</g></g>`;
const tlight=(x,y,id,rot=0)=>`<g class="tlight" data-l="${id}" data-x="${x}" data-y="${y}" data-r="${rot}" transform="translate(${x} ${y}) rotate(${rot})"><rect x="-6" y="-16" width="12" height="32" rx="3" fill="#15181c" stroke="#3b4048"/><circle class="lr" cx="0" cy="-9" r="3.6" fill="#4a1010"/><circle class="ly" cx="0" cy="0" r="3.6" fill="#4a3810"/><circle class="lg" cx="0" cy="9" r="3.6" fill="#0f3a1f"/></g>`;

/* ---------- vehicles (top view, facing up; realistic proportions ~1m = 10px) ---------- */
const BODY='M-9 -23 Q0 -24.6 9 -23 Q10.6 -22 10.7 -17.5 L10.9 17.5 Q10.7 22.4 8.6 23.2 Q0 24.5 -8.6 23.2 Q-10.7 22.4 -10.9 17.5 L-10.7 -17.5 Q-10.6 -22 -9 -23 Z';
function car(c,me,amb){return `${me?'<ellipse class="mehalo" rx="19" ry="31" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-dasharray="5 4"/>':''}<g class="veh">
<path d="${BODY}" transform="translate(2.2 3)" fill="#000" opacity=".42" filter="url(#shadow)"/>
<rect x="-12" y="-17.5" width="2.6" height="7.5" rx="1.2" fill="#121417"/><rect x="9.4" y="-17.5" width="2.6" height="7.5" rx="1.2" fill="#121417"/><rect x="-12" y="10" width="2.6" height="7.5" rx="1.2" fill="#121417"/><rect x="9.4" y="10" width="2.6" height="7.5" rx="1.2" fill="#121417"/>
<path d="${BODY}" fill="${c}"/><path d="${BODY}" fill="url(#body)"/><path d="${BODY}" fill="url(#bodyV)"/>
<path d="M-5.5 -22.6 Q-6.5 -16 -7.6 -11.5 M5.5 -22.6 Q6.5 -16 7.6 -11.5" stroke="#000" stroke-opacity=".16" stroke-width=".6" fill="none"/>
<path d="M-8.2 -10.8 Q0 -13.4 8.2 -10.8 L7.3 -4.2 Q0 -5.4 -7.3 -4.2 Z" fill="url(#glassR)"/>
<path d="M-8.6 -3.8 L-8.9 8.6 M8.6 -3.8 L8.9 8.6" stroke="#16222f" stroke-width="1.5" stroke-linecap="round"/>
<rect x="-7.3" y="-4.2" width="14.6" height="13.4" rx="2.6" fill="${c}"/><rect x="-7.3" y="-4.2" width="14.6" height="13.4" rx="2.6" fill="url(#roof)"/>
<path d="M-7.1 9.6 Q0 10.7 7.1 9.6 L7.7 14.4 Q0 16 -7.7 14.4 Z" fill="url(#glassR)"/>
<path d="M-10.8 -7.2 l-2.6 -.6 l-.3 2.4 l2.9 .4 Z M10.8 -7.2 l2.6 -.6 l.3 2.4 l-2.9 .4 Z" fill="${c}" stroke="#0006" stroke-width=".4"/>
<path d="M-8.7 -22.5 L-4.4 -23.3 L-4.7 -21.7 L-8.5 -21 Z M8.7 -22.5 L4.4 -23.3 L4.7 -21.7 L8.5 -21 Z" fill="#eef6ff"/>
<path class="tl" d="M-9.3 21.4 L-4.4 22.6 L-4.5 23.5 L-9 22.7 Z M9.3 21.4 L4.4 22.6 L4.5 23.5 L9 22.7 Z" fill="#8f1515"/>
<g class="indic ir" opacity="0"><circle cx="9.6" cy="-21" r="1.5" fill="#ffae00"/><circle cx="9.6" cy="21.6" r="1.5" fill="#ffae00"/></g><g class="indic il" opacity="0"><circle cx="-9.6" cy="-21" r="1.5" fill="#ffae00"/><circle cx="-9.6" cy="21.6" r="1.5" fill="#ffae00"/></g>
${amb?'<rect x="-6.5" y="-6.4" width="13" height="3" rx="1.2" fill="#1d4ed8" class="blue"/><rect x="-6.5" y="8" width="13" height="2.4" rx="1" fill="#1d4ed8" class="blue"/><path d="M-10.9 -1 V13 M10.9 -1 V13" stroke="#1f3fae" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M-3 -16 h6 M0 -19 v6" stroke="#1f3fae" stroke-width="1.6"/>':''}
</g>`}
const bike=()=>`<g class="veh cyc"><ellipse cx="2" cy="3" rx="5.5" ry="15" fill="#000" opacity=".32" filter="url(#shadow)"/>
<rect x="-.9" y="-18" width="1.8" height="8.5" rx=".9" fill="#1a1d21"/><rect x="-.9" y="9.5" width="1.8" height="8.5" rx=".9" fill="#1a1d21"/><path d="M0 -12 V11" stroke="#5b6570" stroke-width="1.3"/>
<path d="M-6.5 -11 Q0 -12.5 6.5 -11" stroke="#2b2f35" stroke-width="1.3" fill="none" stroke-linecap="round"/>
<g class="legs"><rect class="lg1" x="-3.6" y="-1" width="2.2" height="6" rx="1" fill="#2c3440"/><rect class="lg2" x="1.4" y="-1" width="2.2" height="6" rx="1" fill="#2c3440"/></g>
<path d="M-5 -2.5 L-6 -10.4 M5 -2.5 L6 -10.4" stroke="#2f6b3e" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="0" cy="-1.5" rx="6.4" ry="3.8" fill="url(#jacket)"/><circle cx="0" cy="-3.2" r="3.1" fill="#3a2a1e"/><path d="M-2.6 -4.6 Q0 -7 2.6 -4.6" stroke="#0005" stroke-width=".6" fill="none"/></g>`;
const walker=()=>`<g class="veh walker"><ellipse cx="1.6" cy="2.2" rx="7" ry="5" fill="#000" opacity=".28" filter="url(#shadow)"/>
<g class="feet"><ellipse class="f1" cx="-2.4" cy="-4.5" rx="1.6" ry="2.6" fill="#1d1d1f"/><ellipse class="f2" cx="2.4" cy="4.5" rx="1.6" ry="2.6" fill="#1d1d1f"/></g>
<g class="arms"><ellipse class="a1" cx="-6.2" cy="2.4" rx="1.4" ry="2.8" fill="#4b2f7a"/><ellipse class="a2" cx="6.2" cy="-2.4" rx="1.4" ry="2.8" fill="#4b2f7a"/></g>
<ellipse cx="0" cy="0" rx="6.4" ry="3.6" fill="url(#coat)"/><circle cx="0" cy="-.2" r="3" fill="#2a1d15"/><circle cx="-.8" cy="-1" r="1.2" fill="#fff" opacity=".12"/></g>`;
function longVeh(o){const L=o.len,h=L/2;let g=`<g class="veh"><rect x="-12" y="${-h+3}" width="28" height="${L}" rx="6" fill="#000" opacity=".38" filter="url(#shadow)"/>`;
 (o.segs||[[-h,h]]).forEach(([y1,y2])=>{g+=`<rect x="-13" y="${y1}" width="26" height="${y2-y1}" rx="${o.r||5}" fill="${o.c}"/><rect x="-13" y="${y1}" width="26" height="${y2-y1}" rx="${o.r||5}" fill="url(#body)"/><path d="M-12.4 ${y1+6} V${y2-6} M12.4 ${y1+6} V${y2-6}" stroke="#1b2733" stroke-width="2.2" stroke-dasharray="7 2"/>`});
 (o.joints||[]).forEach(y=>{g+=`<rect x="-10.5" y="${y-3}" width="21" height="6" fill="#2b2f35"/><path d="M-10.5 ${y-1.5} H10.5 M-10.5 ${y} H10.5 M-10.5 ${y+1.5} H10.5" stroke="#55595f" stroke-width=".6"/>`});
 g+=`<path d="M-11 ${-h+7} Q0 ${-h+1} 11 ${-h+7} L10.5 ${-h+12} Q0 ${-h+9.5} -10.5 ${-h+12} Z" fill="url(#glassR)"/>`;
 if(o.band)g+=`<rect x="-13" y="${-h+16}" width="26" height="2.6" fill="${o.band}"/><rect x="-13" y="${h-12}" width="26" height="2.6" fill="${o.band}"/>`;
 (o.roof||[]).forEach(([y,hh])=>{g+=`<rect x="-7" y="${y}" width="14" height="${hh}" rx="1.6" fill="#c9cfd6" stroke="#9aa3ad" stroke-width=".6"/>`});
 if(o.panto)g+=`<path d="M-6 ${o.panto} L0 ${o.panto-7} L6 ${o.panto} L0 ${o.panto+7} Z" fill="none" stroke="#3a3f45" stroke-width="1.2"/>`;
 g+=`<rect class="tl" x="-11" y="${h-1.6}" width="5" height="1.6" rx=".6" fill="#8f1515"/><rect class="tl" x="6" y="${h-1.6}" width="5" height="1.6" rx=".6" fill="#8f1515"/><rect x="-10.5" y="${-h+.4}" width="4" height="1.4" rx=".6" fill="#eef6ff"/><rect x="6.5" y="${-h+.4}" width="4" height="1.4" rx=".6" fill="#eef6ff"/>`;
 if(o.ind)g+=`<rect class="ind" x="-14.5" y="${-h-.6}" width="3.6" height="2.4" rx="1" fill="#ffb020"/>`;
 return g+'</g>'}
const tram=()=>longVeh({len:120,c:'#efeae0',band:'#c8102e',segs:[[-60,-21],[-17,17],[21,60]],joints:[-19,19],panto:0,r:6});
const bus=()=>longVeh({len:120,c:'#f2f4f7',band:'#1f4fa8',roof:[[-34,12],[8,14]],ind:1,r:4});
const ball=()=>`<g class="veh"><ellipse cx="1.5" cy="1.5" rx="4" ry="3" fill="#000" opacity=".3"/><circle r="4" fill="#f97316"/><path d="M-4 0 A4 4 0 0 0 4 0" fill="#fff" opacity=".35"/><circle cx="-1.3" cy="-1.4" r="1.1" fill="#fff" opacity=".55"/></g>`;
const actorSvg=a=>a.k==='ball'?ball():a.k==='bike'?`<g transform="scale(1.15)">${bike()}</g>`:a.k==='tram'?tram():a.k==='bus'?bus():a.k==='walk'?`<g transform="scale(1.45)">${walker()}</g>`:car(a.c,a.me,a.k==='amb');
const routeCol=a=>a.k==='bike'?GR:a.k==='tram'?'#d9a400':a.k==='walk'?'#7c3aed':a.k==='bus'?'#1f4fa8':a.k==='amb'?'#1d4ed8':a.c;

/* ---------- scene definitions (lessen) ---------- */
const DG={
 hero:{h:320,scene:()=>cross({w:1,e:1,s:1,teeth:['s']})+`<rect x="0" y="94" width="320" height="14" fill="url(#bikep)"/>`+post(232,238,'B6')+post(60,232,'B1',.36),
  a:[{k:'car',c:RD,p:'M-30 180 H360',v:'M60 180 H300',o:1,b:[0,-36]},{k:'bike',p:'M340 101 H-30',v:'M290 101 H40',o:1,b:[0,-26]},{k:'car',c:BL,me:1,turn:'L',p:'M180 290 V176 Q180 140 150 140 H-40',v:'M180 252 V218',o:2,b:[36,0]}]},
 gelijk:{scene:()=>cross({n:1,s:1,e:1,w:1}),quiz:1,hint:['Op een gelijkwaardig kruispunt gaat verkeer van rechts voor.','بالتقاطع المتساوي اللي من اليمين أول.'],
  a:[{k:'car',c:RD,p:'M282 140 H-40',v:'M256 140 H50',o:1,b:[0,-34]},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6]}]},
 tram:{scene:()=>cross({n:1,s:1,e:1,w:1,rails:1}),quiz:1,hint:['De tram heeft altijd voorrang, ook van links.','الترام دايماً أول، حتى لو من الشمال.'],
  a:[{k:'tram',p:'M-20 181 H420',v:'M70 181 H300',o:1,b:[0,-34]},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6]}]},
 haaien:{scene:()=>cross({w:1,e:1,s:1,teeth:['s']})+post(232,238,'B6'),quiz:1,hint:['Haaientanden: al het verkeer op de kruisende weg gaat voor, ook van links.','أسنان القرش: كل اللي عالطريق التاني أول، حتى من الشمال.'],
  a:[{k:'car',c:RD,p:'M30 180 H360',v:'M60 180 H300',o:1,b:[0,-36]},{k:'car',c:BL,me:1,turn:'L',p:'M180 290 V176 Q180 140 150 140 H-40',v:'M180 256 V218',o:2,b:[36,0]}]},
 afslaan:{scene:()=>cross({n:1,s:1,e:1,bike:1}),quiz:1,hint:['Wie afslaat, laat verkeer dat rechtdoor gaat op dezelfde weg voor. Ook de fietser.','اللي بيلف بيخلّي اللي ماشي دغري يمرق، حتى الدراجة.'],
  a:[{k:'bike',p:'M225 300 V-40',v:'M225 280 V40',o:1,b:[26,0]},{k:'car',c:BL,me:1,turn:'R',p:'M180 290 V205 Q180 180 205 180 H360',v:'M180 256 C180 196 196 180 300 180',o:2,b:[-36,0]}]},
 linksaf:{scene:()=>cross({n:1,s:1,e:1,w:1}),quiz:1,hint:['Linksaf: laat de tegenligger die rechtdoor gaat eerst gaan.','إذا بتلف شمال، خلي اللي جاي بوجهك يمرق أول.'],
  a:[{k:'car',c:RD,p:'M140 26 V360',v:'M140 60 V290',o:1,b:[-36,0]},{k:'car',c:BL,me:1,turn:'L',p:'M180 290 V176 Q180 140 148 140 H-40',v:'M180 256 C180 160 170 140 50 140',o:2,b:[36,6]}]},
 rotonde:{scene:roundabout,quiz:1,hint:['Haaientanden voor de rotonde: het verkeer óp de rotonde gaat voor.','قبل الدوّار في أسنان قرش: اللي جوّا الدوّار أول.'],
  a:[{k:'car',c:RD,p:'M84 172 A78 78 0 0 0 236 176 Q256 180 360 180',v:'M90 196 A78 78 0 0 0 226 200',o:1,b:[-34,0]},{k:'car',c:BL,me:1,p:'M180 316 V244 A78 78 0 0 0 220 104 Q182 84 180 60 V-40',v:'M180 300 V270',o:2,b:[36,0]}]},
 invoegen:{h:300,scene:highway,speed:120,
  a:[{k:'car',c:GY,p:'M150 164 H460',o:1},{k:'car',c:GY,p:'M-220 164 H380',o:1},{k:'car',c:GY,p:'M-60 124 H480',o:1},{k:'car',c:BL,me:1,p:'M24 212 C110 208 170 196 250 166 H400',v:'M50 211 C120 206 170 196 240 172',o:1,b:[0,-34]}]},
 afstand:{h:210,scene:distance,speed:70,a:[{k:'car',c:GY,p:'M142 138 H460',o:1},{k:'car',c:BL,me:1,p:'M-30 138 H320',o:1}]},
 strepen:{h:330,scene:stripes,a:[]},
 zebra:{scene:()=>street({zebra:120})+post(232,104,'L2',.36),quiz:1,hint:['Voetgangers op of bij het zebrapad gaan voor.','المشاة عالزيبرا أو جنبها أول.'],
  a:[{k:'walk',p:'M104 135 H216',v:'M110 135 H210',o:1,b:[0,-26],sp:45},{k:'car',c:BL,me:1,p:'M180 300 V-40',v:'M180 270 V170',o:2,b:[36,0]}]},
 ritsen:{h:260,scene:zipper,tl:{dur:6200,tracks:[
  {i:0,rest:false,keys:[[0,0],[6200,.62]]},{i:1,rest:false,keys:[[0,0],[2600,.12],[6200,.40]]},{i:2,rest:false,keys:[[0,0],[2600,.12],[6200,.42]]},
  {i:3,rest:false,keys:[[0,0],[2600,.62],[6200,1]]}]},
  a:[{k:'car',c:GY,p:'M240 104 H690'},{k:'car',c:GY,p:'M110 104 H560'},{k:'car',c:GY,p:'M-20 104 H430'},{k:'car',c:BL,me:1,p:'M20 144 H200 C228 144 236 104 266 104 H420',v:'M60 144 H196'}]}
};

/* ---------- simulator scenarios ---------- */
const SCEN=[
 {id:'s1',t:'Gelijkwaardig kruispunt',ta:'تقاطع متساوي',d:{scene:()=>cross({n:1,s:1,e:1,w:1}),a:[{k:'car',c:RD,p:'M282 140 H-40',v:'M256 140 H50',o:1,b:[0,-34],l:'Rode auto (van rechts)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6],l:'Jij'}]},
  e:'Er zijn geen borden, geen haaientanden en geen lichten. Dan gaat verkeer van rechts voor: de rode auto.',ea:'ما في شارات ولا أسنان قرش ولا إشارات، فاللي من اليمين أول: السيارة الحمرا.'},
 {id:'s2',t:'Fietser van rechts',ta:'دراجة من اليمين',d:{scene:()=>cross({n:1,s:1,e:1,w:1}),a:[{k:'bike',p:'M300 129 H-40',v:'M270 129 H60',o:1,b:[0,-26],l:'Fietser (van rechts)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6],l:'Jij'}]},
  e:'Fietsers zijn bestuurders. Op een gelijkwaardig kruispunt gaat een fietser van rechts dus voor.',ea:'الدراجة «سائق»، فبالتقاطع المتساوي إذا جاية من اليمين هي أول.'},
 {id:'s3',t:'Tram van links',ta:'ترام من الشمال',d:{scene:()=>cross({n:1,s:1,e:1,w:1,rails:1}),a:[{k:'tram',p:'M-20 181 H420',v:'M70 181 H300',o:1,b:[0,-34],l:'Tram (van links)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6],l:'Jij'}]},
  e:'De tram is een uitzondering: op een gelijkwaardig kruispunt gaat de tram altijd voor, ook van links.',ea:'الترام استثناء: دايماً أول بالتقاطع المتساوي حتى لو من الشمال.'},
 {id:'s4',t:'Haaientanden en verkeer van links',ta:'أسنان القرش وسيارة من الشمال',d:{scene:()=>cross({w:1,e:1,s:1,teeth:['s']})+post(232,238,'B6'),a:[{k:'car',c:RD,p:'M30 180 H360',v:'M60 180 H300',o:1,b:[0,-36],l:'Rode auto (van links)'},{k:'car',c:BL,me:1,turn:'L',p:'M180 290 V176 Q180 140 150 140 H-40',v:'M180 256 V218',o:2,b:[36,0],l:'Jij'}]},
  e:'Voor jou liggen haaientanden en staat bord B6. Je geeft voorrang aan al het verkeer op de kruisende weg, ook van links.',ea:'قدامك أسنان قرش وشارة B6، فبتعطي الأفضلية لكل الطريق التاني حتى من الشمال.'},
 {id:'s5',t:'Jij op de voorrangsweg',ta:'انت عطريق الأفضلية',d:{scene:()=>cross({n:1,s:1,e:1,w:1,teeth:['e','w']})+post(232,250,'B1',.36)+post(244,62,'B6',.36),a:[{k:'car',c:RD,p:'M282 140 H-40',v:'M256 140 H50',o:2,b:[0,-34],l:'Rode auto (van rechts)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:1,b:[36,6],l:'Jij'}]},
  e:'Jij rijdt op een voorrangsweg (bord B1). De rode auto heeft haaientanden en moet jou voor laten gaan, ook al komt hij van rechts.',ea:'انت على طريق أفضلية (B1)، والسيارة الحمرا قدامها أسنان قرش، فلازم تخلّيك تمرق حتى لو جاية من اليمين.'},
 {id:'s6',t:'Van een zandweg',ta:'من طريق ترابي',d:{scene:()=>cross({n:1,s:1,e:1,w:1,dirt:'w'}),a:[{k:'car',c:RD,p:'M140 20 V360',v:'M140 50 V280',o:1,b:[-36,0],l:'Rode auto (verharde weg)'},{k:'car',c:BL,me:1,p:'M10 180 H360',v:'M40 180 H110',o:2,b:[0,32],l:'Jij (zandweg)'}]},
  e:'Jij komt van een onverharde weg. Dan geef je voorrang aan verkeer op de verharde weg, ook als dat van links komt.',ea:'انت جاي من طريق ترابي، فبتعطي الأفضلية للي عالمزفّت حتى لو من الشمال.'},
 {id:'s7',t:'Uit een uitrit',ta:'طالع من مخرج',d:{scene:()=>street({drive:1}),a:[{k:'walk',p:'M110 300 V-20',v:'M110 260 V200',o:1,b:[-20,0],sp:40,l:'Voetganger'},{k:'car',c:RD,p:'M140 40 V360',v:'M140 60 V130',o:1,b:[-30,0],l:'Rode auto'},{k:'car',c:BL,me:1,turn:'L',p:'M30 165 H150 Q180 165 180 135 V-40',v:'M50 165 H96',o:2,b:[0,32],l:'Jij (uit de uitrit)'}]},
  e:'Wie een uitrit of parkeerplaats verlaat, laat iedereen voorgaan: de voetganger op de stoep én de auto op de weg.',ea:'اللي طالع من مخرج أو موقف بيخلّي الكل يمرق: الماشي عالرصيف والسيارة عالطريق.'},
 {id:'s8',t:'Ambulance met zwaailicht en sirene',ta:'إسعاف بضو وصفارة',d:{scene:()=>cross({n:1,s:1,e:1,w:1}),a:[{k:'amb',c:'#eee34a',p:'M-30 180 H360',v:'M40 180 H300',o:1,b:[0,-36],l:'Ambulance (van links)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6],l:'Jij'}]},
  e:'Een voorrangsvoertuig met zwaailicht én sirene krijgt altijd vrije doorgang, van welke kant hij ook komt.',ea:'مركبة الأفضلية بالضو والصفارة دايماً بتمرق أول، من وين ما إجت.'},
 {id:'s9',t:'Groen licht, linksaf',ta:'ضو أخضر، لف شمال',lights:{me:'g',other:'g'},d:{scene:()=>cross({n:1,s:1,e:1,w:1,stops:['s','n']})+tlight(212,222,'me')+tlight(108,98,'other',180),a:[{k:'car',c:RD,p:'M140 26 V360',v:'M140 60 V290',o:1,b:[-36,0],l:'Tegenligger (rechtdoor)'},{k:'car',c:BL,me:1,turn:'L',p:'M180 290 V176 Q180 140 148 140 H-40',v:'M180 256 C180 160 170 140 50 140',o:2,b:[36,6],l:'Jij (linksaf)'}]},
  e:'Jullie hebben allebei groen. Sla je linksaf, dan laat je de tegenligger die rechtdoor gaat eerst gaan.',ea:'التنين عندهم أخضر. إذا بتلف شمال بتخلّي اللي جاي بوجهك ماشي دغري يمرق أول.'},
 {id:'s10',t:'Rotonde',ta:'دوّار',d:{scene:roundabout,a:[{k:'car',c:RD,p:'M105 212 A78 78 0 0 0 236 176 Q256 180 360 180',v:'M110 222 A78 78 0 0 0 226 200',o:1,b:[-34,0],l:'Auto op de rotonde'},{k:'car',c:BL,me:1,p:'M180 316 V244 A78 78 0 0 0 220 104 Q182 84 180 60 V-40',v:'M180 300 V270',o:2,b:[36,-26],l:'Jij'}]},
  e:'Voor de rotonde liggen haaientanden. Het verkeer dat al op de rotonde rijdt, gaat voor.',ea:'قبل الدوّار في أسنان قرش، فاللي جوّا أول.'},
 {id:'s11',t:'Zebrapad',ta:'ممر مشاة',d:{scene:()=>street({zebra:120})+post(232,104,'L2',.36),a:[{k:'walk',p:'M104 135 H216',v:'M110 135 H210',o:1,b:[0,-26],sp:45,l:'Voetganger'},{k:'car',c:BL,me:1,p:'M180 300 V-40',v:'M180 270 V170',o:2,b:[36,0],l:'Jij'}]},
  e:'De voetganger staat op het punt over te steken bij het zebrapad. Je laat hem voorgaan.',ea:'الماشي بدو يقطع عالزيبرا، فبتخلّيه يمرق.'},
 {id:'s12',t:'Bus vertrekt van de halte',ta:'باص طالع من المحطة',d:{scene:()=>street({bay:1})+post(244,180,'L3',.34),a:[{k:'bus',p:'M214 140 Q214 104 182 74 V-80',v:'M214 130 Q214 104 186 80',o:1,b:[30,-30],l:'Bus (richting aan)'},{k:'car',c:BL,me:1,p:'M180 300 V-40',v:'M180 270 V200',o:2,b:[-36,0],l:'Jij'}]},
  e:'Binnen de bebouwde kom laat je een bus die van de halte wil wegrijden (richting aan) voorgaan.',ea:'داخل البلد إذا الباص بدو يطلع من المحطة (مغمّز)، بتخلّيه يطلع.'},
 {id:'s13',t:'Fietser bij haaientanden',ta:'دراجة عند أسنان القرش',d:{scene:()=>cross({n:1,s:1,e:1,w:1,teeth:['e','w']})+post(232,250,'B1',.36)+post(244,62,'B6',.36),a:[{k:'bike',p:'M300 129 H-40',v:'M270 129 H226',o:2,b:[0,-26],l:'Fietser (van rechts)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:1,b:[36,6],l:'Jij'}]},
  e:'Jij rijdt op de voorrangsweg (bord B1). De fietser heeft haaientanden en bord B6: hij moet jou voor laten gaan, ook al komt hij van rechts.',ea:'انت عطريق الأفضلية (B1). الدراجة قدامها أسنان قرش وB6، فلازم تخلّيك تمرق حتى لو جاية من اليمين.'},
 {id:'s14',t:'Drie auto’s op een gelijkwaardig kruispunt',ta:'تلات سيارات بتقاطع متساوي',d:{scene:()=>cross({n:1,s:1,e:1,w:1}),a:[{k:'car',c:RD,p:'M282 140 H-40',v:'M256 140 H50',o:1,b:[0,-34],l:'Rode auto (van rechts)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6],l:'Jij'},{k:'car',c:'#6b7280',p:'M38 180 H360',v:'M60 180 H110',o:3,b:[0,34],l:'Grijze auto (van links)'}]},
  e:'Iedereen gaat rechtdoor en er zijn geen borden. De rode auto heeft niemand van rechts en gaat eerst. Dan jij, want de grijze auto komt van links: jij bent voor hem verkeer van rechts. De grijze auto gaat als laatste.',ea:'الكل ماشي دغري وما في شارات. الحمرا ما حدا عن يمينها فبتمرق أول. بعدين انت، لأن الرمادية انت عن يمينها. الرمادية آخر وحدة.'},
 {id:'s15',t:'Tegenligger slaat linksaf',ta:'السيارة الجاية بتلف شمال',d:{scene:()=>cross({n:1,s:1,e:1,w:1}),a:[{k:'car',c:RD,turn:'L',p:'M140 26 V150 Q140 180 170 180 H360',v:'M140 60 V120',o:2,b:[-36,0],l:'Tegenligger (slaat linksaf)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:1,b:[36,6],l:'Jij (rechtdoor)'}]},
  e:'Jij gaat rechtdoor. De tegenligger slaat linksaf en moet tegemoetkomend verkeer dat rechtdoor gaat voor laten gaan. Jij gaat dus eerst.',ea:'انت ماشي دغري. السيارة الجاية بتلف شمال ولازم تخلّي اللي ماشي دغري من قدامها يمرق. يعني انت أول.'},
 {id:'s16',t:'Fietser van links',ta:'دراجة من الشمال',d:{scene:()=>cross({n:1,s:1,e:1,w:1}),a:[{k:'bike',p:'M24 190 H360',v:'M40 190 H110',o:2,b:[0,28],l:'Fietser (van links)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:1,b:[36,6],l:'Jij'}]},
  e:'Een gelijkwaardig kruispunt zonder borden: verkeer van rechts gaat voor. De fietser komt van links, dus jij gaat eerst. Let wel goed op dat hij je ziet.',ea:'تقاطع متساوي بدون شارات: اللي من اليمين أول. الدراجة جاية من الشمال، فانت أول. بس تأكد إنها شافتك.'}
];

/* ---------- common mistakes (timelines: fout / goed) ---------- */
const MIST=[
 {id:'m1',t:'Afslaan zonder in de dode hoek te kijken',ta:'اللف بدون ما تطلّع بالنقطة العمياء',
  nl:'De auto slaat rechtsaf zonder over de schouder te kijken. De fietser naast hem gaat rechtdoor en heeft voorrang.',ar:'السيارة لافّة يمين بدون ما تطلّع ورا كتفها، والدراجة جنبها ماشية دغري وإلها الأفضلية.',
  good:'Goed: kijk in je spiegel en over je schouder, laat de fietser eerst gaan, sla daarna af.',gooda:'الصح: طلّع بالمرآة وورا كتفك، خلّي الدراجة تمرق، وبعدين لف.',
  d:{scene:()=>cross({n:1,s:1,e:1,bike:1}),a:[{k:'car',c:BL,me:1,turn:'R',p:'M180 300 V205 Q180 180 205 180 H360'},{k:'bike',p:'M225 330 V-40'}]},
  fout:{dur:3000,tracks:[{i:0,rest:false,keys:[[0,0],[2400,.62]]},{i:1,rest:false,keys:[[0,0],[2400,.55]]}],ev:[{t:1800,type:'crash',x:220,y:182}]},
  goed:{dur:5600,tracks:[{i:0,rest:false,keys:[[0,0],[1400,.29],[2900,.31],[5600,1]]},{i:1,rest:false,keys:[[0,0],[3900,1]]}],ev:[]}},
 {id:'m2',t:'Bumperkleven',ta:'الالتصاق بالسيارة اللي قدامك',
  nl:'De blauwe auto rijdt veel te dicht achter de grijze auto. Als de grijze auto plotseling remt, kan de blauwe auto niet meer op tijd stoppen.',ar:'السيارة الزرقا قريبة كتير من الرمادية. لما الرمادية تفرمل فجأة، الزرقا ما بتلحق توقف.',
  good:'Goed: houd minstens 2 seconden afstand. Dan heb je tijd om te reageren en te remmen.',gooda:'الصح: خلّي ثانيتين على الأقل، لحتى يكون عندك وقت تتفاعل وتفرمل.',
  d:{h:210,scene:roadH,a:[{k:'car',c:GY,p:'M150 138 H460'},{k:'car',c:BL,me:1,p:'M60 138 H460',p2:'M-10 138 H460'}]},
  fout:{dur:3000,tracks:[{i:0,rest:false,keys:[[0,0],[1500,.27],[2100,.33],[3000,.33]]},{i:1,rest:false,keys:[[0,0],[1500,.21],[2900,.44]]}],ev:[{t:2300,type:'crash',x:228,y:138}]},
  goed:{dur:5800,alt:{1:1},tracks:[{i:0,rest:false,keys:[[0,0],[1500,.27],[2100,.33],[5800,.33]]},{i:1,rest:false,keys:[[0,0],[1500,.179],[1900,.226],[5250,.425],[5800,.425]]}],ev:[]}},
 {id:'m3',t:'Door geel of rood rijden',ta:'المرق بالبرتقالي أو الأحمر',
  nl:'Het licht springt op geel en dan rood, maar de blauwe auto rijdt door. Het verkeer van rechts krijgt groen en rijdt het kruispunt op.',ar:'الإشارة صارت صفرا (برتقالي) وبعدين حمرا، بس السيارة الزرقا كمّلت. اللي من اليمين صار عنده أخضر ودخل التقاطع.',
  good:'Goed: bij geel stop je als dat veilig kan. Bij rood altijd stoppen voor de streep.',gooda:'الصح: بالأصفر بتوقف إذا آمن، وبالأحمر دايماً قبل الخط.',
  d:{scene:()=>cross({n:1,s:1,e:1,w:1,stops:['s','e']})+tlight(212,222,'me')+tlight(222,104,'x',-90),a:[{k:'car',c:BL,me:1,p:'M180 300 V-40'},{k:'car',c:RD,p:'M300 140 H-40'}]},
  fout:{dur:3300,tracks:[{i:0,rest:false,keys:[[0,0],[3200,.56]]},{i:1,keys:[[0,0],[1900,0],[3200,.5]]}],ev:[{t:0,type:'light',l:'me',s:'g'},{t:0,type:'light',l:'x',s:'r'},{t:600,type:'light',l:'me',s:'y'},{t:1500,type:'light',l:'me',s:'r'},{t:1800,type:'light',l:'x',s:'g'},{t:2900,type:'crash',x:178,y:148}]},
  goed:{dur:7200,tracks:[{i:0,rest:false,keys:[[0,0],[1200,.17],[2300,.203],[4700,.203],[7200,1]]},{i:1,keys:[[0,0],[1900,0],[4300,1]]}],ev:[{t:0,type:'light',l:'me',s:'g'},{t:0,type:'light',l:'x',s:'r'},{t:600,type:'light',l:'me',s:'y'},{t:900,type:'brake',i:0},{t:1500,type:'light',l:'me',s:'r'},{t:1800,type:'light',l:'x',s:'g'},{t:4300,type:'light',l:'x',s:'r'},{t:4500,type:'light',l:'me',s:'g'},{t:4600,type:'go',i:0}]}},
 {id:'m4',t:'Afgeleid door je telefoon',ta:'التشتت بالتلفون',
  nl:'De bestuurder kijkt op zijn telefoon en rijdt langzaam over de middenstreep. Er komt een tegenligger aan.',ar:'السائق عم يطلّع بالتلفون وصار يميل شوي شوي فوق الخط النص، وفي سيارة جاية.',
  good:'Goed: telefoon weg of in een houder, ogen op de weg. Dan blijf je netjes in je eigen rijstrook.',gooda:'الصح: التلفون بعيد أو بحامل، وعيونك عالطريق، فبتضل بمسارك.',
  d:{scene:()=>street({}),a:[{k:'car',c:BL,me:1,p:'M180 330 V230 C180 190 150 170 146 120 V-40',p2:'M180 330 V-40'},{k:'car',c:RD,p:'M140 -40 V360'}]},
  fout:{dur:3000,tracks:[{i:0,rest:false,keys:[[0,0],[2600,.6]]},{i:1,rest:false,keys:[[0,0],[2600,.5]]}],ev:[{t:2200,type:'crash',x:146,y:128}]},
  goed:{dur:3600,alt:{0:1},tracks:[{i:0,rest:false,keys:[[0,0],[3600,1]]},{i:1,rest:false,keys:[[0,0],[3600,1]]}],ev:[]}}
];

/* ---------- gevaarherkenning: clips that stop at the decision moment (0 = remmen, 1 = gas loslaten, 2 = niets) ---------- */
const PARK=(y)=>({k:'car',c:'#9aa3ad',p:`M214 ${y} V${y+1}`});
const HAZ=[
 {id:'h1',d:{scene:()=>street({bay:1,park:1}),label:'Straat met geparkeerde auto’s rechts. Een bal rolt tussen de auto’s door de straat op.',a:[PARK(62),PARK(140),{k:'ball',p:'M214 101 H138'},{k:'car',c:BL,me:1,p:'M180 340 V-40'}]},
  tl:{dur:2500,tracks:[{i:2,keys:[[0,0],[1500,0],[2500,.75]]},{i:3,rest:false,keys:[[0,0],[2500,.37]]}]},a:0,
  e:'Een bal rolt de straat op. Er komt vaak een kind achteraan, en het is dichtbij. Je remt meteen.',ea:'طابة طلعت عالشارع، وغالباً في ولد وراها، وقريبة. بتفرمل فوراً.'},
 {id:'h2',d:{scene:()=>street({bay:1}),label:'Een bus staat bij de halte rechts. Aan de overkant staan voetgangers.',a:[{k:'bus',p:'M214 112 V113'},{k:'walk',p:'M108 96 V104'},{k:'walk',p:'M108 124 V120'},{k:'car',c:BL,me:1,p:'M180 340 V-40'}]},
  tl:{dur:2200,tracks:[{i:1,keys:[[0,0],[2200,1]]},{i:2,keys:[[0,0],[2200,1]]},{i:3,rest:false,keys:[[0,0],[2200,.28]]}]},a:1,
  e:'Bij de bus staan mensen aan de overkant. Iemand kan ineens oversteken om de bus te halen. Er is nog geen direct gevaar: gas loslaten.',ea:'في ناس بالجهة التانية والباص واقف. ممكن حدا يقطع فجأة ليلحق الباص. لسا ما في خطر مباشر: شيل رجلك.'},
 {id:'h3',d:{h:210,scene:roadH,label:'Rechte weg. Ver voor je rijdt een auto in dezelfde richting.',a:[{k:'car',c:GY,p:'M250 138 H620'},{k:'car',c:BL,me:1,p:'M-40 138 H460'}]},
  tl:{dur:2200,tracks:[{i:0,rest:false,keys:[[0,0],[2200,.3]]},{i:1,rest:false,keys:[[0,0],[2200,.22]]}]},a:2,
  e:'De weg is vrij en de auto voor je rijdt op ruime afstand even hard. Er is geen gevaar: je doet niets.',ea:'الطريق فاضي والسيارة اللي قدامك بعيدة وماشية بنفس السرعة. ما في خطر: ولا شي.'},
 {id:'h4',d:{scene:()=>cross({n:1,s:1,e:1,w:1,teeth:['e','w']})+post(232,250,'B1',.36)+post(244,62,'B6',.36),label:'Jij rijdt op een voorrangsweg. Van rechts nadert een auto vrij hard de haaientanden.',a:[{k:'car',c:RD,p:'M330 140 H-40'},{k:'car',c:BL,me:1,p:'M180 330 V-40'}]},
  tl:{dur:1900,tracks:[{i:0,rest:false,keys:[[0,0],[1900,.27]]},{i:1,rest:false,keys:[[0,0],[1900,.17]]}]},a:1,
  e:'Jij hebt voorrang, maar de rode auto rijdt vrij hard naar de haaientanden. Je weet niet zeker of hij stopt. Gas loslaten, zodat je op tijd kunt remmen.',ea:'انت عندك الأفضلية، بس السيارة الحمرا جاية بسرعة عأسنان القرش. مو أكيد رح توقف. شيل رجلك لتقدر تفرمل بالوقت.'},
 {id:'h5',d:{h:210,scene:roadH,label:'De auto vlak voor je remt plotseling hard.',a:[{k:'car',c:GY,p:'M170 138 H560'},{k:'car',c:BL,me:1,p:'M40 138 H460'}]},
  tl:{dur:2100,tracks:[{i:0,rest:false,keys:[[0,0],[1300,.2],[2100,.24]]},{i:1,rest:false,keys:[[0,0],[1300,.2],[2100,.31]]}]},a:0,
  e:'De auto vlak voor je remt hard: zijn remlichten gaan aan en de afstand wordt snel kleiner. Je moet nu remmen.',ea:'السيارة اللي قدامك فرملت قوي، ضو الفرامل اشتغل والمسافة عم تصغر بسرعة. لازم تفرمل هلق.'}
,
 {id:'h6',d:{scene:()=>street({bay:1,park:1}),label:'Woonstraat met geparkeerde auto’s. Tussen de auto’s staat een kind dat de straat op wil.',a:[PARK(70),PARK(146),{k:'walk',p:'M214 110 H150'},{k:'car',c:BL,me:1,p:'M180 340 V-40'}]},
  tl:{dur:2400,tracks:[{i:2,keys:[[0,0],[1500,0],[2400,.45]]},{i:3,rest:false,keys:[[0,0],[2400,.36]]}]},a:0,
  e:'Een kind stapt tussen geparkeerde auto’s de straat op, vlak voor je. Je remt meteen.',ea:'ولد طالع من بين السيارات المصفوفة عالشارع، وقريب منك. بتفرمل فوراً.'},
 {id:'h7',d:{scene:()=>street({}),label:'Een fietser rijdt voor je. Verderop staat een geparkeerde auto op zijn weg.',a:[{k:'car',c:'#9aa3ad',p:'M190 92 V93'},{k:'bike',p:'M194 300 V150 Q194 125 168 105 V-40'},{k:'car',c:BL,me:1,p:'M180 400 V-40'}]},
  tl:{dur:2300,tracks:[{i:1,rest:false,keys:[[0,0],[2300,.36]]},{i:2,rest:false,keys:[[0,0],[2300,.3]]}]},a:1,
  e:'De fietser moet zo uitwijken voor de geparkeerde auto en komt dan voor je rijden. Er is nog ruimte: gas loslaten en afstand houden.',ea:'الدراجة رح تطلع لنص الطريق لتمرق جنب السيارة المصفوفة. لسا في مسافة: شيل رجلك وخلّي مسافة.'},
 {id:'h8',d:{h:210,scene:roadH,label:'Je rijdt op een rechte weg. Achter je nadert een ambulance met zwaailicht en sirene.',a:[{k:'amb',c:'#eee34a',p:'M-200 138 H460'},{k:'car',c:BL,me:1,p:'M60 138 H460'}]},
  tl:{dur:2200,tracks:[{i:0,rest:false,keys:[[0,0],[2200,.42]]},{i:1,rest:false,keys:[[0,0],[2200,.16]]}]},a:1,
  e:'Een ambulance met zwaailicht en sirene wil erlangs. Gas loslaten, rustig opzij en ruimte maken. Niet plotseling remmen.',ea:'إسعاف مشغّل الضو والصفارة بدو يمرق. شيل رجلك، تنحّى بهدوء وافسحله الطريق، وما تفرمل فجأة.'},
 {id:'h9',d:{scene:()=>street({park:1}),label:'Rustige woonstraat. Er staan auto’s geparkeerd, maar er beweegt niemand.',a:[PARK(70),PARK(170),{k:'car',c:BL,me:1,p:'M180 340 V-40'}]},
  tl:{dur:2200,tracks:[{i:2,rest:false,keys:[[0,0],[2200,.3]]}]},a:2,
  e:'Er gebeurt niets bijzonders en je rijdt rustig. Er is geen gevaar: je doet niets.',ea:'ما في شي غريب وانت ماشي بهدوء. ما في خطر: ولا شي.'},
 {id:'h10',d:{scene:()=>street({zebra:100}),label:'Er komt een zebrapad. Een voetganger loopt naar de rand en gaat oversteken.',a:[{k:'walk',p:'M104 115 H218'},{k:'car',c:BL,me:1,p:'M180 340 V-40'}]},
  tl:{dur:2400,tracks:[{i:0,keys:[[0,0],[1000,0],[2400,.45]]},{i:1,rest:false,keys:[[0,0],[2400,.3]]}]},a:0,
  e:'De voetganger gaat het zebrapad op. Je moet hem voor laten gaan, dus je remt en stopt.',ea:'الشخص عم يقطع على ممر المشاة. لازم تخلّيه يمرق، فبتفرمل وبتوقف.'},
 {id:'h11',d:{h:210,scene:roadH,label:'Voor je rijdt een auto veel langzamer dan jij. Je komt er snel bij.',a:[{k:'car',c:GY,p:'M240 138 H620'},{k:'car',c:BL,me:1,p:'M-40 138 H460'}]},
  tl:{dur:2200,tracks:[{i:0,rest:false,keys:[[0,0],[2200,.08]]},{i:1,rest:false,keys:[[0,0],[2200,.3]]}]},a:1,
  e:'De auto voor je rijdt langzaam en de afstand wordt kleiner. Laat het gas los en houd afstand. Remmen is nog niet nodig.',ea:'السيارة قدامك بطيئة والمسافة عم تصغر. شيل رجلك وخلّي مسافة. لسا ما لازم تفرمل.'},
 {id:'h12',d:{h:210,scene:roadH,label:'Een tegenligger rijdt op zijn eigen weghelft voorbij.',a:[{k:'car',c:RD,p:'M380 95 H-80'},{k:'car',c:BL,me:1,p:'M-40 138 H460'}]},
  tl:{dur:2200,tracks:[{i:0,rest:false,keys:[[0,0],[2200,.55]]},{i:1,rest:false,keys:[[0,0],[2200,.3]]}]},a:2,
  e:'De tegenligger blijft netjes op zijn eigen kant. Er is geen gevaar: je doet niets.',ea:'السيارة الجاية بوجهك ماشية بجهتها. ما في خطر: ولا شي.'}];

/* =========================================================
   ENGINE
   ========================================================= */
let nid=0;
function buildScene(el,d,key,opt={}){
 const id='g'+(nid++),H=d.h||320;
 const paths=d.a.map((a,i)=>`<path id="${id}p${i}" d="${a.p}" fill="none" stroke="none"/>`+(a.p2?`<path id="${id}q${i}" d="${a.p2}" fill="none" stroke="none"/>`:'')+(a.v?`<path class="route" d="${a.v}" stroke="${routeCol(a)}" marker-end="url(#ar)"/>`:'')).join('');
 const acts=d.a.map((a,i)=>`<g class="act${a.k==='amb'?' amb':''}${a.turn?' turn'+a.turn:''}" data-i="${i}" tabindex="-1"><circle class="halo" r="${a.k==='tram'||a.k==='bus'?40:26}" fill="none" stroke="#ffc21a" stroke-width="5"/>${actorSvg(a)}</g>`).join('');
 const badges=d.a.map((a,i)=>a.b?`<g class="badge" data-i="${i}"><circle r="14" fill="#f07a00" stroke="#fff" stroke-width="3"/><text y="5.5" font-size="16" font-weight="800" text-anchor="middle" fill="#fff" ${FONT}>${a.o}</text></g>`:'').join('');
 el.classList.add('scene');
 el.innerHTML=`<div class="stage"><div class="tilt3d"><svg viewBox="0 0 320 ${H}" role="group" aria-label="${(opt.label||d.label||"Verkeerssituatie, van bovenaf gezien").replace(/"/g,"")}">${d.scene()}${paths}${acts}${badges}<g class="fxl"></g></svg></div><div class="flashbad"></div><button class="b3d" type="button" title="3D-weergave aan/uit" aria-pressed="false">${ico('cube')}<span>3D</span></button></div>`+(opt.controls||'');
 const svg=el.querySelector('svg'),stage=el.querySelector('.stage');
 const S={el,d,key,svg,stage,busy:false,pos:[]};
 S.paths=d.a.map((_,i)=>svg.querySelector('#'+id+'p'+i));S.alt=d.a.map((_,i)=>svg.querySelector('#'+id+'q'+i));S.use=d.a.map(()=>0);
 S.acts=[...svg.querySelectorAll('.act')];S.badges=[...svg.querySelectorAll('.badge')];
 S.P=i=>S.use[i]&&S.alt[i]?S.alt[i]:S.paths[i];
 S.L=i=>S.P(i).getTotalLength();
 /* heading follows the path like a real car: chord over the wheelbase instead of the point tangent */
 S.ptAt=(p,L,l)=>{if(l<0){const a=p.getPointAtLength(0),b=p.getPointAtLength(Math.min(L,2));const k=-l/2;return{x:a.x-(b.x-a.x)*k,y:a.y-(b.y-a.y)*k}}if(l>L){const a=p.getPointAtLength(L),b=p.getPointAtLength(Math.max(0,L-2));const k=(l-L)/2;return{x:a.x+(a.x-b.x)*k,y:a.y+(a.y-b.y)*k}}return p.getPointAtLength(l)};
 S.place=(i,l)=>{const p=S.P(i),L=S.L(i);l=Math.max(0,Math.min(L,l));const wb=(d.a[i].k==='tram'||d.a[i].k==='bus')?22:d.a[i].k==='walk'?2:7;
  const a=p.getPointAtLength(l),f=S.ptAt(p,L,l+wb),r=S.ptAt(p,L,l-wb);
  const ang=Math.atan2(f.y-r.y,f.x-r.x)*180/Math.PI+90;S.acts[i].setAttribute('transform',`translate(${a.x.toFixed(2)} ${a.y.toFixed(2)}) rotate(${ang.toFixed(2)})`);S.pos[i]=a;S.ang[i]=ang;S.l[i]=l};
 S.ang=[];S.l=[];S.gen=0;
 S.setLight=(l,s)=>{const t=svg.querySelector(`.tlight[data-l="${l}"]`);if(!t)return;t.dataset.s=s;t.querySelector('.lr').setAttribute('fill',s==='r'?'#ff3040':'#3a1214');t.querySelector('.ly').setAttribute('fill',s==='y'?'#ffb020':'#3a2e12');t.querySelector('.lg').setAttribute('fill',s==='g'?'#2ee07a':'#0f2e1c')};
 S.reset=()=>{S.gen++;S.use=d.a.map(()=>0);d.a.forEach((a,i)=>S.place(i,0));S.a0=S.ang.slice();S.acts.forEach((g,i)=>{g.classList.remove('braking','crashed');g.classList.toggle('turnR',d.a[i].turn==='R');g.classList.toggle('turnL',d.a[i].turn==='L')});svg.querySelector('.fxl').innerHTML='';svg.classList.remove('moving');
  S.badges.forEach(bg=>{const i=+bg.dataset.i,a=d.a[i],p=S.pos[i];const bx=Math.max(14,Math.min(306,p.x+a.b[0])),by=Math.max(14,Math.min(H-14,p.y+a.b[1]));bg.setAttribute('transform',`translate(${bx} ${by})`)});
  if(d.lights)Object.entries(d.lights).forEach(([l,s])=>S.setLight(l,s));if(opt.lights)Object.entries(opt.lights).forEach(([l,s])=>S.setLight(l,s));
  const tx=svg.querySelector('.timer');if(tx)tx.textContent='2 seconden';stage.classList.remove('good','bad')};
 /* per-frame vehicle state: brake lights from real deceleration, indicators off once the turn is made */
 S.vel=[];S.track=(i,dt)=>{const l=S.l[i];const pv=S.vel[i]||{l,v:0};const v=dt>0?(l-pv.l)/dt*1000:pv.v;const vs=pv.v*.7+v*.3;const acc=dt>0?(vs-pv.v)/dt*1000:0;
  const g=S.acts[i];const a=d.a[i];if(a.k!=='walk'&&a.k!=='bike'){const brk=acc<-14||(vs<2&&pv.moved&&l<S.L(i)-1);g.classList.toggle('braking',brk&&!g.classList.contains('crashed'))}
  if(a.turn){let da=Math.abs(((S.ang[i]-S.a0[i])%360+540)%360-180);if(da>70)g.classList.remove('turnR','turnL')}
  S.vel[i]={l,v:vs,moved:pv.moved||vs>8}};
 S.vreset=()=>{S.vel=[]};
 const inView=pt=>pt.x>-4&&pt.x<324&&pt.y>-4&&pt.y<H+4;
 /* sequential play by order: cruise in from off-screen, pull away from a stop when visible */
 S.run=idx=>new Promise(res=>{const g0=S.gen;svg.classList.add('moving');const sp=d.speed||130;const t0=performance.now();let last=t0;S.vreset();
  const prof=idx.map(i=>{const p=S.P(i),L=S.L(i);const st=inView(p.getPointAtLength(0)),en=inView(p.getPointAtLength(L));return{i,L,v:(d.a[i].sp||sp),st,en}});
  /* distance travelled as a function of time: accelerate 0.9 s from rest if starting in view, constant otherwise */
  const T=prof.map(o=>{const ta=o.st?900:0,da=o.v*ta/2000;const tb=o.en?900:0,db=o.v*tb/2000;return{...o,ta,da,tb,db,tc:Math.max(0,(o.L-da-db)/o.v*1000)}});
  const D=Math.max(...T.map(o=>o.ta+o.tc+o.tb));let tPole=null,done2=0;
  const dist=(o,e)=>{if(e<o.ta){const u=e/1000;return o.v*u*u/(2*o.ta/1000)}e-=o.ta;if(e<o.tc)return o.da+o.v*e/1000;e-=o.tc;if(e<o.tb){const u=e/1000,tb=o.tb/1000;return o.da+o.v*o.tc/1000+o.v*u-o.v*u*u/(2*tb)}return o.L};
  const f=t=>{if(S.gen!==g0)return res();const e=t-t0,dt=t-last;last=t;T.forEach(o=>{S.place(o.i,dist(o,e));S.track(o.i,dt)});
   if(key==='afstand'){const tx=svg.querySelector('.timer');if(tPole===null&&S.pos[0].x>=200)tPole=t;if(tPole!==null){if(S.pos[1].x<200)tx.textContent=((t-tPole)/1000).toFixed(1).replace('.',',')+' s …';else if(!done2){done2=1;tx.textContent='2 seconden ✓'}}}
   if(e<D)requestAnimationFrame(f);else{svg.classList.remove('moving');res()}};requestAnimationFrame(f)});
 S.play=async()=>{if(S.busy)return;S.busy=true;svg.classList.remove('quiz');svg.classList.add('playing');S.reset();const g0=S.gen;
  if(d.tl){await S.timeline(d.tl)}else{const groups=[...new Set(d.a.map(a=>a.o))].sort((x,y)=>x-y);for(const o of groups){if(S.gen!==g0)break;await S.run(d.a.map((a,i)=>a.o===o?i:-1).filter(i=>i>=0));await wait(250)}}
  if(S.gen===g0){await wait(800);S.reset()}svg.classList.remove('playing');S.busy=false};
 /* timeline player (mistakes + ritsen): monotone cubic interpolation, so vehicles never stop at a keyframe unless the curve is flat */
 const mono=keys=>{const n=keys.length,x=keys.map(k=>k[0]),y=keys.map(k=>k[1]),dl=[],m=[];for(let k=0;k<n-1;k++)dl[k]=(y[k+1]-y[k])/((x[k+1]-x[k])||1);
  m[0]=keys.rest0?0:dl[0]||0;m[n-1]=dl[n-2]||0;for(let k=1;k<n-1;k++)m[k]=dl[k-1]*dl[k]<=0?0:3*(dl[k-1]+dl[k])/((2*dl[k]+dl[k-1])/dl[k-1]+(dl[k]+2*dl[k-1])/dl[k]);
  return t=>{if(t<=x[0])return y[0];if(t>=x[n-1])return y[n-1];let k=0;while(t>x[k+1])k++;const h=x[k+1]-x[k],u=(t-x[k])/h,u2=u*u,u3=u2*u;return(2*u3-3*u2+1)*y[k]+(u3-2*u2+u)*h*m[k]+(-2*u3+3*u2)*y[k+1]+(u3-u2)*h*m[k+1]}};
 const box=i=>{const a=d.a[i];const hw=a.k==='bike'?5:a.k==='walk'?5:a.k==='tram'||a.k==='bus'?13:11,hl=a.k==='bike'?17:a.k==='walk'?5:a.k==='tram'||a.k==='bus'?60:24;const p=S.pos[i],r=(S.ang[i]-90)*Math.PI/180;return{x:p.x,y:p.y,ux:Math.cos(r),uy:Math.sin(r),hl,hw}};
 const hit=(A,B)=>{const ax=[[A.ux,A.uy],[-A.uy,A.ux],[B.ux,B.uy],[-B.uy,B.ux]];for(const[nx,ny]of ax){const pr=O=>{const c=O.x*nx+O.y*ny,e=Math.abs(O.hl*(O.ux*nx+O.uy*ny))+Math.abs(O.hw*(-O.uy*nx+O.ux*ny));return[c-e,c+e]};const a=pr(A),b=pr(B);if(a[1]<b[0]||b[1]<a[0])return false}return true};
 S.timeline=(tl)=>new Promise(res=>{const g0=S.gen;svg.classList.add('moving');const t0=performance.now();let last=t0;const fired=new Set();if(tl.alt)Object.keys(tl.alt).forEach(i=>S.use[i]=1);S.vreset();tl.tracks.forEach(tr=>S.place(tr.i,tr.keys[0][1]*S.L(tr.i)));
  const fns=tl.tracks.map(tr=>{const k=tr.keys.slice();k.rest0=tr.rest!==false&&inView(S.P(tr.i).getPointAtLength(tr.keys[0][1]*S.L(tr.i)));return mono(k)});
  let crash=null;const want=(tl.ev||[]).find(e=>e.type==='crash');
  const f=now=>{if(S.gen!==g0)return res();const t=now-t0,dt=now-last;last=now;
   tl.tracks.forEach((tr,j)=>{const L=S.L(tr.i);let l=fns[j](t)*L;if(crash&&crash.ids.includes(tr.i)){const e=(t-crash.t)/1000;l=crash.l[tr.i]+crash.v[tr.i]*.045*(1-Math.exp(-e*9))}S.place(tr.i,l);S.track(tr.i,dt)});
   if(want&&!crash){const ids=tl.tracks.map(x=>x.i);outer:for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){const A=box(ids[a]),B=box(ids[b]);if(hit(A,B)){crash={t,ids:[ids[a],ids[b]],l:{},v:{}};crash.ids.forEach(i=>{crash.l[i]=S.l[i];crash.v[i]=(S.vel[i]||{v:0}).v});S.event({type:'crash',x:(A.x+B.x)/2,y:(A.y+B.y)/2,ids:crash.ids});break outer}}}
   (tl.ev||[]).forEach((ev,k)=>{if(fired.has(k))return;if(ev.type==='crash'){if(crash)fired.add(k);else if(t>=ev.t+500){fired.add(k);const ids=tl.tracks.map(x=>x.i).slice(0,2);crash={t,ids,l:{},v:{}};ids.forEach(i=>{crash.l[i]=S.l[i];crash.v[i]=(S.vel[i]||{v:0}).v});S.event(ev)}return}if(t>=ev.t){fired.add(k);if(ev.type==='brake'||ev.type==='go')return;S.event(ev)}});
   if(t<tl.dur+(crash?700:0))requestAnimationFrame(f);else{svg.classList.remove('moving');res()}};requestAnimationFrame(f)});
 S.event=ev=>{if(ev.type==='light')S.setLight(ev.l,ev.s);
  if(ev.type==='crash'){(ev.ids||[]).forEach(i=>{S.acts[i].classList.add('crashed');S.acts[i].classList.remove('braking','turnR','turnL')});
   const sh=[...Array(14)].map((_,k)=>{const an=k/14*Math.PI*2+Math.random()*.4,dd=10+Math.random()*16,sz=1+Math.random()*1.8;return `<path class="shard" style="--dx:${(Math.cos(an)*dd).toFixed(1)}px;--dy:${(Math.sin(an)*dd).toFixed(1)}px;--r:${(Math.random()*360)|0}deg" d="M0 ${-sz} L${sz*.9} ${sz*.6} L${-sz*.8} ${sz*.7}Z" fill="${k%3?'#d8ecf7':'#9aa4ae'}" opacity=".9"/>`}).join('');
   svg.querySelector('.fxl').innerHTML=`<g transform="translate(${ev.x.toFixed(1)} ${ev.y.toFixed(1)})" class="impact"><circle class="flash" r="14" fill="#fff"/><circle class="ring1" r="10" fill="none" stroke="#fff" stroke-width="2"/>${sh}<circle r="9" fill="#2b2b2b" opacity=".18" class="dust"/></g><g class="crashlbl" transform="translate(${Math.max(46,Math.min(274,ev.x)).toFixed(0)} ${Math.max(22,ev.y-34).toFixed(0)})"><rect x="-40" y="-12" width="80" height="22" rx="11" fill="#b91c1c"/><text y="4" font-size="11" font-weight="800" text-anchor="middle" fill="#fff" ${FONT}>Botsing</text></g>`;
   stage.classList.remove('bad');void stage.offsetWidth;stage.classList.add('bad')}};
 /* quiz: tap (or press Enter on) the road user who goes first */
 S.quiz=()=>{if(S.busy)return;S.reset();S.left=d.a.map((_,i)=>i);svg.classList.add('quiz');S.acts.forEach((g,i)=>{g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',d.a[i].l||(d.a[i].me?'Jij':({car:'Auto',bike:'Fietser',walk:'Voetganger',tram:'Tram',bus:'Bus',amb:'Ambulance'})[d.a[i].k]||'Weggebruiker'))});if(opt.onQuizStart)opt.onQuizStart()};
 S.endQuiz=()=>{svg.classList.remove('quiz');S.acts.forEach(g=>{g.setAttribute('tabindex','-1');g.removeAttribute('role')})};
 const pickAct=async g=>{if(!svg.classList.contains('quiz')||S.busy||!S.left)return;const i=+g.dataset.i;if(!S.left.includes(i))return;const min=Math.min(...S.left.map(j=>d.a[j].o));
  if(d.a[i].o===min){S.busy=true;const g0=S.gen;S.left=S.left.filter(j=>j!==i);await S.run([i]);if(S.gen!==g0){S.busy=false;return}S.busy=false;if(!S.left.length){S.endQuiz();stage.classList.add('good');opt.onSolved&&opt.onSolved();await wait(1600);if(S.gen===g0)S.reset()}else{const n=S.acts.find((_,j)=>S.left.includes(j));n&&n.focus({preventScroll:true})}}
  else{stage.classList.remove('bad');void stage.offsetWidth;stage.classList.add('bad');opt.onWrong&&opt.onWrong(i)}};
 svg.addEventListener('click',e=>{const g=e.target.closest('.act');if(g)pickAct(g)});
 svg.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const g=e.target.closest('.act');if(g){e.preventDefault();pickAct(g)}});
 S.reset();
 S.H=H;S.opt=opt;
 /* real 3D view (three.js), loaded only when the scene is on screen */
 const b3=stage.querySelector('.b3d');
 const want3d=()=>{try{return localStorage.getItem('tb-3d')!=='0'}catch(e){return true}};
 const go3d=()=>import('./scene3d.js').then(m=>m.attach(S)).catch(e=>{console.warn('3D niet beschikbaar',e);stage.classList.remove('r3d');b3.hidden=true});
 b3.setAttribute('aria-pressed',want3d());b3.title='3D aan/uit';
 b3.addEventListener('click',e=>{const on=!stage.classList.contains('r3d');try{localStorage.setItem('tb-3d',on?'1':'0')}catch(_){}
  b3.setAttribute('aria-pressed',on);if(on){stage.classList.add('r3d');go3d()}else{stage.classList.remove('r3d');S.view3d&&S.view3d.destroy()}});
 if(want3d()&&!RMQ_LOW()){stage.classList.add('r3d');go3d()}
 return S}
