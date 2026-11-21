/* =========================================================
   SCENES – bovenaanzicht van wegen, voertuigen en animatie
   ========================================================= */
const BL='#2563eb',RD='#dc2b2b',GR='#16a34a',GY='#8b95a3',WH='#f1f3f6';
const RMQ=matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
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
 A.forEach(a=>{const r=RA[a];g+=`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="${o.dirt===a?'url(#sand)':'url(#asph)'}"/>`});
 g+=`<rect x="120" y="120" width="80" height="80" fill="url(#asph)"/>`;
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
 if(o.bay)g+=`<rect x="200" y="40" width="28" height="140" rx="6" fill="url(#asph)"/><text x="214" y="112" ${FONT} font-size="9" font-weight="800" fill="#ffe38a" text-anchor="middle" transform="rotate(90 214 112)">BUS</text>`;
 g+=`<rect x="120" width="80" height="320" fill="url(#asph)"/>`+curb('M120 0V320M200 0V320')+dash('M160 0V320');
 if(o.drive)g+=`<rect x="100" y="132" width="20" height="66" fill="url(#walk)"/><path d="M100 132H120M100 198H120" stroke="#b5b9bf"/>`;
 if(o.zebra!==undefined){for(let x=124;x<198;x+=12)g+=`<rect x="${x}" y="${o.zebra}" width="7" height="30" fill="#f4f4f4"/>`}
 return g}
function roundabout(){let g=cross({n:1,s:1,e:1,w:1});g+=`<circle cx="160" cy="160" r="114" fill="url(#walk)"/><circle cx="160" cy="160" r="102" fill="url(#asph)"/><circle cx="160" cy="160" r="102" fill="none" stroke="#e4e6ea" stroke-width="2"/>`;
 [[120,0,80,60],[120,260,80,60],[0,120,60,80],[260,120,60,80]].forEach(r=>g+=`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="url(#asph)"/>`);
 g+=dash('M160 0V50')+dash('M160 270V320')+dash('M0 160H50')+dash('M270 160H320');
 g+=`<circle cx="160" cy="160" r="48" fill="#d9dce1"/><circle cx="160" cy="160" r="42" fill="url(#grass)"/><circle cx="148" cy="152" r="13" fill="#4f8a3a"/><circle cx="172" cy="170" r="10" fill="#5c9a45"/>`;
 for(const r of [0,90,180,270])g+=`<g transform="rotate(${r} 160 160)">${[0,1,2].map(i=>`<path d="M${163+i*12.5} 262 h10 l-5 10 z" fill="#fff"/>`).join('')}</g>`;
 return g}
const highway=()=>`<rect width="320" height="300" fill="url(#grass)"/><rect y="52" width="320" height="8" fill="#b8bdc4"/><rect y="56" width="320" height="2" fill="#7d858f"/><rect y="62" width="320" height="140" fill="url(#asph)"/>
<path d="M0 226 L250 214 L310 200 H0 Z" fill="url(#asph)"/><path d="M0 228 L250 216 L310 202" stroke="#e4e6ea" stroke-width="2.4" fill="none"/>
<path d="M0 64H320" stroke="#f4f4f4" stroke-width="2.4"/>${dash('M0 104H320')}${dash('M0 144H320')}
<path d="M0 182H120" stroke="#f4f4f4" stroke-width="2.4"/><path d="M120 182H262" stroke="#f4f4f4" stroke-width="4" stroke-dasharray="6 6"/><path d="M262 182H320" stroke="#f4f4f4" stroke-width="2.4"/>
<rect x="12" y="252" width="190" height="30" rx="15" fill="#0b111acc"/><text x="107" y="272" font-size="13.5" font-weight="800" text-anchor="middle" fill="#fff" ${FONT}>invoegstrook: snelheid maken</text>`;
const zipper=()=>`<rect width="320" height="260" fill="url(#grass)"/><rect y="70" width="320" height="10" fill="#b8bdc4"/><path d="M0 84 H320 V124 H0 Z" fill="url(#asph)"/><path d="M0 124 H210 L262 124 L262 124 L210 164 H0 Z" fill="url(#asph)"/><path d="M0 124 H200" stroke="#f4f4f4" stroke-width="2.2" stroke-dasharray="11 9"/><path d="M0 164 H206 L262 126" stroke="#e4e6ea" stroke-width="2.4" fill="none"/><path d="M0 84H320" stroke="#f4f4f4" stroke-width="2.4"/><path d="M262 124 H320" stroke="#e4e6ea" stroke-width="2"/>
<g transform="translate(150 186)"><rect x="-3" y="0" width="6" height="40" fill="#9aa3ad"/><g transform="translate(-22 -36)"><rect width="44" height="40" rx="4" fill="#0d0f12"/><path d="M12 10 L30 28 M30 14 V28 H16" stroke="#f4f4f4" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 5" fill="none"/></g></g>
<rect x="12" y="222" width="196" height="28" rx="14" fill="#0b111acc"/><text x="110" y="241" font-size="13" font-weight="800" text-anchor="middle" fill="#fff" ${FONT}>ritsen: tot vlak voor het einde</text>`;
const roadH=()=>`<rect width="320" height="210" fill="url(#grass)"/><rect y="62" width="320" height="10" fill="url(#walk)"/><rect y="72" width="320" height="88" fill="url(#asph)"/>${dash('M0 116H320')}<path d="M0 73H320M0 159H320" stroke="#e4e6ea" stroke-width="2"/>`;
const distance=()=>roadH()+`<g transform="translate(200 22)"><ellipse cx="2" cy="40" rx="5" ry="2" fill="#000" opacity=".3"/><rect x="-3" y="0" width="6" height="40" rx="1.5" fill="#f7f7f7" stroke="#9aa3ad"/><rect x="-3" y="4" width="6" height="7" fill="#dc2b2b"/></g>
<text x="214" y="38" font-size="12" font-weight="800" fill="#111" ${FONT}>paal</text>
<g class="timerG"><rect x="98" y="172" width="124" height="28" rx="14" fill="#0b111acc"/><text class="timer" x="160" y="191" text-anchor="middle" fill="#fff">2 seconden</text></g>`;
const stripes=()=>{const pan=(x,y,line,lab)=>`<g transform="translate(${x} ${y})"><rect width="146" height="118" rx="10" fill="url(#asph)"/>${line}<rect x="8" y="124" width="130" height="24" rx="12" fill="#0b111acc"/><text x="73" y="141" font-size="12" font-weight="800" text-anchor="middle" fill="#fff" ${FONT}>${lab}</text></g>`;
 const cb=(c,da)=>`<rect y="96" width="146" height="22" fill="url(#walk)"/><path d="M0 96H146" stroke="#e4e6ea" stroke-width="2"/><path d="M0 91H146" stroke="${c}" stroke-width="5" ${da?'stroke-dasharray="13 9"':''}/>`;
 return `<rect width="320" height="330" fill="url(#grass)"/>`+pan(10,8,'<path d="M73 0V118" stroke="#f4f4f4" stroke-width="5"/>','doorgetrokken')+pan(164,8,'<path d="M73 0V118" stroke="#f4f4f4" stroke-width="5" stroke-dasharray="18 12"/>','onderbroken')+pan(10,170,cb('#ffc21a'),'geel: stilstaan verboden')+pan(164,170,cb('#ffc21a',1),'geel: parkeren verboden')};
const post=(x,y,k,sc=.42)=>`<g transform="translate(${x} ${y})"><ellipse cx="2" cy="44" rx="7" ry="3" fill="#000" opacity=".25"/><rect x="-1.6" y="2" width="3.2" height="42" rx="1.5" fill="#9aa3ad"/><g transform="translate(${-50*sc} ${-100*sc+6}) scale(${sc})">${SG[k][1]}</g></g>`;
const tlight=(x,y,id,rot=0)=>`<g class="tlight" data-l="${id}" transform="translate(${x} ${y}) rotate(${rot})"><rect x="-6" y="-16" width="12" height="32" rx="3" fill="#15181c" stroke="#3b4048"/><circle class="lr" cx="0" cy="-9" r="3.6" fill="#4a1010"/><circle class="ly" cx="0" cy="0" r="3.6" fill="#4a3810"/><circle class="lg" cx="0" cy="9" r="3.6" fill="#0f3a1f"/></g>`;

/* ---------- vehicles (top view, facing up) ---------- */
function car(c,me,amb){return `<g><ellipse cx="2" cy="4" rx="15" ry="25" fill="#000" opacity=".35" filter="url(#shadow)"/>
<rect x="-12.5" y="-22" width="25" height="44" rx="8.5" fill="${c}"/><rect x="-12.5" y="-22" width="25" height="44" rx="8.5" fill="url(#body)"/>
<rect x="-15.5" y="-9" width="4" height="5" rx="1.5" fill="${c}"/><rect x="11.5" y="-9" width="4" height="5" rx="1.5" fill="${c}"/>
<path d="M-10 -11 Q0 -16 10 -11 L9 -4 Q0 -6 -9 -4 Z" fill="url(#glass)"/><rect x="-9" y="-3.5" width="18" height="12" rx="3" fill="${c}"/><rect x="-9" y="-3.5" width="18" height="12" rx="3" fill="#fff" opacity=".14"/>
<path d="M-9 10 Q0 12 9 10 L8 15 Q0 17 -8 15 Z" fill="url(#glass)"/>
<rect x="-10.5" y="-22" width="6" height="2.6" rx="1.2" fill="#fff6c8"/><rect x="4.5" y="-22" width="6" height="2.6" rx="1.2" fill="#fff6c8"/>
<rect class="tl" x="-10.5" y="19.6" width="5" height="2.2" rx="1" fill="#a32020"/><rect class="tl" x="5.5" y="19.6" width="5" height="2.2" rx="1" fill="#a32020"/>
${amb?'<rect x="-9" y="-1" width="18" height="5" rx="1.5" fill="#1d4ed8" class="blue"/><path d="M-4 6h8M0 2v8" stroke="#dc2b2b" stroke-width="2.4"/><rect x="-12.5" y="-2" width="25" height="2" fill="#dc2b2b" opacity=".8"/>':''}
${me?'<rect x="-9" y="-1.5" width="18" height="8" rx="2" fill="#ffc21a"/><text x="0" y="5.2" font-size="6.6" font-weight="800" text-anchor="middle" fill="#111" '+FONT+'>JIJ</text>':''}</g>`}
const bike=()=>`<g><ellipse cx="2" cy="3" rx="6" ry="15" fill="#000" opacity=".3" filter="url(#shadow)"/><rect x="-1.6" y="-17" width="3.2" height="34" rx="1.6" fill="#1b1f24"/><path d="M-7 -9 H7" stroke="#1b1f24" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="0" cy="1" rx="8" ry="6" fill="#16a34a"/><circle cx="0" cy="-1" r="4.6" fill="#f4c84a" stroke="#c48f00" stroke-width="1"/></g>`;
const walker=()=>`<g><ellipse cx="1.5" cy="2" rx="8" ry="6" fill="#000" opacity=".25" filter="url(#shadow)"/><ellipse cx="0" cy="0" rx="8.5" ry="5" fill="#7c3aed"/><circle cx="0" cy="-.5" r="4" fill="#3a2a20"/><g class="feet"><ellipse cx="-3.4" cy="-7" rx="2" ry="3" fill="#222"/><ellipse cx="3.4" cy="6" rx="2" ry="3" fill="#222"/></g></g>`;
const longVeh=(c,band)=>`<g><rect x="-13" y="-58" width="30" height="120" rx="8" fill="#000" opacity=".3" filter="url(#shadow)"/><rect x="-14" y="-60" width="28" height="120" rx="9" fill="${c}"/><rect x="-14" y="-60" width="28" height="120" rx="9" fill="url(#body)"/><rect x="-14" y="-2" width="28" height="4" fill="${band}"/><rect x="-14" y="-31" width="28" height="3" fill="${band}"/><rect x="-14" y="27" width="28" height="3" fill="${band}"/><path d="M-11 -54 Q0 -60 11 -54 L10 -47 H-10 Z" fill="url(#glass)"/><rect class="tl" x="-11" y="57" width="6" height="2.4" rx="1" fill="#a32020"/><rect class="tl" x="5" y="57" width="6" height="2.4" rx="1" fill="#a32020"/></g>`;
const tram=()=>longVeh('#f4f1e8','#c8102e').replace('</g>','<rect x="-5" y="-22" width="10" height="16" rx="2" fill="#7b8794"/><path d="M-5 -22 L5 -6 M5 -22 L-5 -6" stroke="#4a525c" stroke-width="1.4"/></g>');
const bus=()=>`<g><rect x="-13" y="-46" width="30" height="96" rx="7" fill="#000" opacity=".3" filter="url(#shadow)"/><rect x="-14" y="-48" width="28" height="96" rx="8" fill="#e8ecf1"/><rect x="-14" y="-48" width="28" height="96" rx="8" fill="url(#body)"/><rect x="-14" y="-12" width="28" height="4" fill="#1f4fa8"/><path d="M-11 -43 Q0 -48 11 -43 L10 -36 H-10 Z" fill="url(#glass)"/><rect x="-9" y="-28" width="18" height="44" rx="3" fill="#cfd6de" opacity=".7"/><rect class="tl" x="-11" y="45" width="6" height="2.4" rx="1" fill="#a32020"/><rect class="tl" x="5" y="45" width="6" height="2.4" rx="1" fill="#a32020"/><rect class="ind" x="10" y="-47.5" width="4.5" height="3.2" rx="1" fill="#ffb020"/></g>`;
const actorSvg=a=>a.k==='bike'?bike():a.k==='tram'?tram():a.k==='bus'?bus():a.k==='walk'?walker():car(a.c,a.me,a.k==='amb');
const routeCol=a=>a.k==='bike'?GR:a.k==='tram'?'#d9a400':a.k==='walk'?'#7c3aed':a.k==='bus'?'#1f4fa8':a.k==='amb'?'#1d4ed8':a.c;

/* ---------- scene definitions (lessen) ---------- */
const DG={
 hero:{h:320,scene:()=>cross({w:1,e:1,s:1,teeth:['s']})+`<rect x="0" y="94" width="320" height="14" fill="url(#bikep)"/>`+post(236,214,'B6')+post(70,62,'B1',.36),
  a:[{k:'car',c:RD,p:'M-30 180 H360',v:'M60 180 H300',o:1,b:[0,-36]},{k:'bike',p:'M340 101 H-30',v:'M290 101 H40',o:1,b:[0,-26]},{k:'car',c:BL,me:1,p:'M180 290 V176 Q180 140 150 140 H-40',v:'M180 252 V218',o:2,b:[36,0]}]},
 gelijk:{scene:()=>cross({n:1,s:1,e:1,w:1}),quiz:1,hint:['Op een gelijkwaardig kruispunt gaat verkeer van rechts voor.','بالتقاطع المتساوي اللي من اليمين أول.'],
  a:[{k:'car',c:RD,p:'M282 140 H-40',v:'M256 140 H50',o:1,b:[0,-34]},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6]}]},
 tram:{scene:()=>cross({n:1,s:1,e:1,w:1,rails:1}),quiz:1,hint:['De tram heeft altijd voorrang, ook van links.','الترام دايماً أول، حتى لو من الشمال.'],
  a:[{k:'tram',p:'M-20 181 H420',v:'M70 181 H300',o:1,b:[0,-34]},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6]}]},
 haaien:{scene:()=>cross({w:1,e:1,s:1,teeth:['s']})+post(236,214,'B6'),quiz:1,hint:['Haaientanden: al het verkeer op de kruisende weg gaat voor, ook van links.','أسنان القرش: كل اللي عالطريق التاني أول، حتى من الشمال.'],
  a:[{k:'car',c:RD,p:'M30 180 H360',v:'M60 180 H300',o:1,b:[0,-36]},{k:'car',c:BL,me:1,p:'M180 290 V176 Q180 140 150 140 H-40',v:'M180 256 V218',o:2,b:[36,0]}]},
 afslaan:{scene:()=>cross({n:1,s:1,e:1,bike:1}),quiz:1,hint:['Wie afslaat, laat verkeer dat rechtdoor gaat op dezelfde weg voor. Ook de fietser.','اللي بيلف بيخلّي اللي ماشي دغري يمرق، حتى الدراجة.'],
  a:[{k:'bike',p:'M225 300 V-40',v:'M225 280 V40',o:1,b:[26,0]},{k:'car',c:BL,me:1,p:'M180 290 V205 Q180 180 205 180 H360',v:'M180 256 C180 196 196 180 300 180',o:2,b:[-36,0]}]},
 linksaf:{scene:()=>cross({n:1,s:1,e:1,w:1}),quiz:1,hint:['Linksaf: laat de tegenligger die rechtdoor gaat eerst gaan.','إذا بتلف شمال، خلي اللي جاي بوجهك يمرق أول.'],
  a:[{k:'car',c:RD,p:'M140 26 V360',v:'M140 60 V290',o:1,b:[-36,0]},{k:'car',c:BL,me:1,p:'M180 290 V176 Q180 140 148 140 H-40',v:'M180 256 C180 160 170 140 50 140',o:2,b:[36,6]}]},
 rotonde:{scene:roundabout,quiz:1,hint:['Haaientanden voor de rotonde: het verkeer óp de rotonde gaat voor.','قبل الدوّار في أسنان قرش: اللي جوّا الدوّار أول.'],
  a:[{k:'car',c:RD,p:'M84 172 A78 78 0 0 0 236 176 Q256 180 360 180',v:'M90 196 A78 78 0 0 0 226 200',o:1,b:[-34,0]},{k:'car',c:BL,me:1,p:'M180 316 V244 A78 78 0 0 0 220 104 Q182 84 180 60 V-40',v:'M180 300 V270',o:2,b:[36,0]}]},
 invoegen:{h:300,scene:highway,speed:120,
  a:[{k:'car',c:GY,p:'M150 164 H460',o:1},{k:'car',c:GY,p:'M-110 164 H400',o:1},{k:'car',c:GY,p:'M40 124 H480',o:1},{k:'car',c:BL,me:1,p:'M24 236 C110 228 170 210 250 166 H400',v:'M50 234 C120 226 170 210 240 172',o:1,b:[0,-34]}]},
 afstand:{h:210,scene:distance,speed:70,a:[{k:'car',c:GY,p:'M110 138 H460',o:1},{k:'car',c:BL,me:1,p:'M-30 138 H320',o:1}]},
 strepen:{h:330,scene:stripes,a:[]},
 zebra:{scene:()=>street({zebra:120})+post(232,104,'L2',.36),quiz:1,hint:['Voetgangers op of bij het zebrapad gaan voor.','المشاة عالزيبرا أو جنبها أول.'],
  a:[{k:'walk',p:'M96 135 H300',v:'M110 135 H220',o:1,b:[0,-26],sp:45},{k:'car',c:BL,me:1,p:'M180 300 V-40',v:'M180 270 V170',o:2,b:[36,0]}]},
 ritsen:{h:260,scene:zipper,tl:{dur:6200,tracks:[
  {i:0,keys:[[0,0],[6200,.55]]},{i:1,keys:[[0,0],[6200,.55]]},{i:2,keys:[[0,0],[6200,.55]]},
  {i:3,keys:[[0,0],[2600,.655],[6200,1]]}]},
  a:[{k:'car',c:GY,p:'M240 104 H690'},{k:'car',c:GY,p:'M110 104 H560'},{k:'car',c:GY,p:'M-20 104 H430'},{k:'car',c:BL,me:1,p:'M20 144 H200 C228 144 236 104 266 104 H420',v:'M60 144 H196'}]}
};

/* ---------- simulator scenarios ---------- */
const SCEN=[
 {id:'s1',t:'Gelijkwaardig kruispunt',ta:'تقاطع متساوي',d:{scene:()=>cross({n:1,s:1,e:1,w:1}),a:[{k:'car',c:RD,p:'M282 140 H-40',v:'M256 140 H50',o:1,b:[0,-34],l:'Rode auto (van rechts)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6],l:'Jij'}]},
  e:'Er zijn geen borden, geen haaientanden en geen lichten. Dan gaat verkeer van rechts voor: de rode auto.',ea:'ما في شارات ولا أسنان قرش ولا إشارات، فاللي من اليمين أول: السيارة الحمرا.'},
 {id:'s2',t:'Fietser van rechts',ta:'دراجة من اليمين',d:{scene:()=>cross({n:1,s:1,e:1,w:1}),a:[{k:'bike',p:'M300 146 H-40',v:'M270 146 H60',o:1,b:[0,-28],l:'Fietser (van rechts)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6],l:'Jij'}]},
  e:'Fietsers zijn bestuurders. Op een gelijkwaardig kruispunt gaat een fietser van rechts dus voor.',ea:'الدراجة «سائق»، فبالتقاطع المتساوي إذا جاية من اليمين هي أول.'},
 {id:'s3',t:'Tram van links',ta:'ترام من الشمال',d:{scene:()=>cross({n:1,s:1,e:1,w:1,rails:1}),a:[{k:'tram',p:'M-20 181 H420',v:'M70 181 H300',o:1,b:[0,-34],l:'Tram (van links)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6],l:'Jij'}]},
  e:'De tram is een uitzondering: op een gelijkwaardig kruispunt gaat de tram altijd voor, ook van links.',ea:'الترام استثناء: دايماً أول بالتقاطع المتساوي حتى لو من الشمال.'},
 {id:'s4',t:'Haaientanden en verkeer van links',ta:'أسنان القرش وسيارة من الشمال',d:{scene:()=>cross({w:1,e:1,s:1,teeth:['s']})+post(236,214,'B6'),a:[{k:'car',c:RD,p:'M30 180 H360',v:'M60 180 H300',o:1,b:[0,-36],l:'Rode auto (van links)'},{k:'car',c:BL,me:1,p:'M180 290 V176 Q180 140 150 140 H-40',v:'M180 256 V218',o:2,b:[36,0],l:'Jij'}]},
  e:'Voor jou liggen haaientanden en staat bord B6. Je geeft voorrang aan al het verkeer op de kruisende weg, ook van links.',ea:'قدامك أسنان قرش وشارة B6، فبتعطي الأفضلية لكل الطريق التاني حتى من الشمال.'},
 {id:'s5',t:'Jij op de voorrangsweg',ta:'انت عطريق الأفضلية',d:{scene:()=>cross({n:1,s:1,e:1,w:1,teeth:['e','w']})+post(232,250,'B1',.36)+post(250,90,'B6',.36),a:[{k:'car',c:RD,p:'M282 140 H-40',v:'M256 140 H50',o:2,b:[0,-34],l:'Rode auto (van rechts)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:1,b:[36,6],l:'Jij'}]},
  e:'Jij rijdt op een voorrangsweg (bord B1). De rode auto heeft haaientanden en moet jou voor laten gaan, ook al komt hij van rechts.',ea:'انت على طريق أفضلية (B1)، والسيارة الحمرا قدامها أسنان قرش، فلازم تخلّيك تمرق حتى لو جاية من اليمين.'},
 {id:'s6',t:'Van een zandweg',ta:'من طريق ترابي',d:{scene:()=>cross({n:1,s:1,e:1,w:1,dirt:'w'}),a:[{k:'car',c:RD,p:'M140 20 V360',v:'M140 50 V280',o:1,b:[-36,0],l:'Rode auto (verharde weg)'},{k:'car',c:BL,me:1,p:'M10 180 H360',v:'M40 180 H110',o:2,b:[0,32],l:'Jij (zandweg)'}]},
  e:'Jij komt van een onverharde weg. Dan geef je voorrang aan verkeer op de verharde weg, ook als dat van links komt.',ea:'انت جاي من طريق ترابي، فبتعطي الأفضلية للي عالمزفّت حتى لو من الشمال.'},
 {id:'s7',t:'Uit een uitrit',ta:'طالع من مخرج',d:{scene:()=>street({drive:1}),a:[{k:'walk',p:'M110 300 V-20',v:'M110 260 V200',o:1,b:[-20,0],sp:40,l:'Voetganger'},{k:'car',c:RD,p:'M140 -20 V360',v:'M140 20 V110',o:1,b:[-30,0],l:'Rode auto'},{k:'car',c:BL,me:1,p:'M30 165 H150 Q180 165 180 135 V-40',v:'M50 165 H96',o:2,b:[0,32],l:'Jij (uit de uitrit)'}]},
  e:'Wie een uitrit of parkeerplaats verlaat, laat iedereen voorgaan: de voetganger op de stoep én de auto op de weg.',ea:'اللي طالع من مخرج أو موقف بيخلّي الكل يمرق: الماشي عالرصيف والسيارة عالطريق.'},
 {id:'s8',t:'Ambulance met zwaailicht en sirene',ta:'إسعاف بضو وصفارة',d:{scene:()=>cross({n:1,s:1,e:1,w:1}),a:[{k:'amb',c:'#f7f7f7',p:'M-30 180 H360',v:'M40 180 H300',o:1,b:[0,-36],l:'Ambulance (van links)'},{k:'car',c:BL,me:1,p:'M180 290 V-40',v:'M180 256 V60',o:2,b:[36,6],l:'Jij'}]},
  e:'Een voorrangsvoertuig met zwaailicht én sirene krijgt altijd vrije doorgang, van welke kant hij ook komt.',ea:'مركبة الأفضلية بالضو والصفارة دايماً بتمرق أول، من وين ما إجت.'},
 {id:'s9',t:'Groen licht, linksaf',ta:'ضو أخضر، لف شمال',lights:{me:'g',other:'g'},d:{scene:()=>cross({n:1,s:1,e:1,w:1,stops:['s','n']})+tlight(212,222,'me')+tlight(108,98,'other',180),a:[{k:'car',c:RD,p:'M140 26 V360',v:'M140 60 V290',o:1,b:[-36,0],l:'Tegenligger (rechtdoor)'},{k:'car',c:BL,me:1,p:'M180 290 V176 Q180 140 148 140 H-40',v:'M180 256 C180 160 170 140 50 140',o:2,b:[36,6],l:'Jij (linksaf)'}]},
  e:'Jullie hebben allebei groen. Sla je linksaf, dan laat je de tegenligger die rechtdoor gaat eerst gaan.',ea:'التنين عندهم أخضر. إذا بتلف شمال بتخلّي اللي جاي بوجهك ماشي دغري يمرق أول.'},
 {id:'s10',t:'Rotonde',ta:'دوّار',d:{scene:roundabout,a:[{k:'car',c:RD,p:'M84 172 A78 78 0 0 0 236 176 Q256 180 360 180',v:'M90 196 A78 78 0 0 0 226 200',o:1,b:[-34,0],l:'Auto op de rotonde'},{k:'car',c:BL,me:1,p:'M180 316 V244 A78 78 0 0 0 220 104 Q182 84 180 60 V-40',v:'M180 300 V270',o:2,b:[36,0],l:'Jij'}]},
  e:'Voor de rotonde liggen haaientanden. Het verkeer dat al op de rotonde rijdt, gaat voor.',ea:'قبل الدوّار في أسنان قرش، فاللي جوّا أول.'},
 {id:'s11',t:'Zebrapad',ta:'ممر مشاة',d:{scene:()=>street({zebra:120})+post(232,104,'L2',.36),a:[{k:'walk',p:'M96 135 H300',v:'M110 135 H220',o:1,b:[0,-26],sp:45,l:'Voetganger'},{k:'car',c:BL,me:1,p:'M180 300 V-40',v:'M180 270 V170',o:2,b:[36,0],l:'Jij'}]},
  e:'De voetganger staat op het punt over te steken bij het zebrapad. Je laat hem voorgaan.',ea:'الماشي بدو يقطع عالزيبرا، فبتخلّيه يمرق.'},
 {id:'s12',t:'Bus vertrekt van de halte',ta:'باص طالع من المحطة',d:{scene:()=>street({bay:1})+post(244,180,'L3',.34),a:[{k:'bus',p:'M214 150 Q214 104 182 80 V-80',v:'M214 140 Q214 104 186 84',o:1,b:[30,-30],l:'Bus (richting aan)'},{k:'car',c:BL,me:1,p:'M180 300 V-40',v:'M180 270 V200',o:2,b:[-36,0],l:'Jij'}]},
  e:'Binnen de bebouwde kom laat je een bus die van de halte wil wegrijden (richting aan) voorgaan.',ea:'داخل البلد إذا الباص بدو يطلع من المحطة (مغمّز)، بتخلّيه يطلع.'}
];

/* ---------- common mistakes (timelines: fout / goed) ---------- */
const MIST=[
 {id:'m1',t:'Afslaan zonder in de dode hoek te kijken',ta:'اللف بدون ما تطلّع بالنقطة العمياء',
  nl:'De auto slaat rechtsaf zonder over de schouder te kijken. De fietser naast hem gaat rechtdoor en heeft voorrang.',ar:'السيارة لافّة يمين بدون ما تطلّع ورا كتفها، والدراجة جنبها ماشية دغري وإلها الأفضلية.',
  good:'Goed: kijk in je spiegel en over je schouder, laat de fietser eerst gaan, sla daarna af.',gooda:'الصح: طلّع بالمرآة وورا كتفك، خلّي الدراجة تمرق، وبعدين لف.',
  d:{scene:()=>cross({n:1,s:1,e:1,bike:1}),a:[{k:'car',c:BL,me:1,p:'M180 300 V205 Q180 180 205 180 H360'},{k:'bike',p:'M225 330 V-40'}]},
  fout:{dur:2600,tracks:[{i:0,keys:[[0,0],[2100,.5]]},{i:1,keys:[[0,0],[2100,.42]]}],ev:[{t:2100,type:'crash',x:220,y:182}]},
  goed:{dur:5400,tracks:[{i:0,keys:[[0,0],[1300,.31],[2700,.31],[5400,1]]},{i:1,keys:[[0,0],[1800,.42],[3800,1]]}],ev:[{t:1300,type:'brake',i:0},{t:2700,type:'go',i:0}]}},
 {id:'m2',t:'Bumperkleven',ta:'الالتصاق بالسيارة اللي قدامك',
  nl:'De blauwe auto rijdt veel te dicht achter de grijze auto. Als de grijze auto plotseling remt, kan de blauwe auto niet meer op tijd stoppen.',ar:'السيارة الزرقا قريبة كتير من الرمادية. لما الرمادية تفرمل فجأة، الزرقا ما بتلحق توقف.',
  good:'Goed: houd minstens 2 seconden afstand. Dan heb je tijd om te reageren en te remmen.',gooda:'الصح: خلّي ثانيتين على الأقل، لحتى يكون عندك وقت تتفاعل وتفرمل.',
  d:{h:210,scene:roadH,a:[{k:'car',c:GY,p:'M150 138 H460'},{k:'car',c:BL,me:1,p:'M60 138 H460',p2:'M-60 138 H460'}]},
  fout:{dur:2700,tracks:[{i:0,keys:[[0,0],[1500,.27],[2100,.32]]},{i:1,keys:[[0,0],[1500,.27],[2300,.40]]}],ev:[{t:1550,type:'brake',i:0},{t:2300,type:'crash',x:208,y:138}]},
  goed:{dur:3200,alt:{1:1},tracks:[{i:0,keys:[[0,0],[1500,.27],[2100,.32]]},{i:1,keys:[[0,0],[1500,.31],[2800,.49]]}],ev:[{t:1550,type:'brake',i:0},{t:1900,type:'brake',i:1}]}},
 {id:'m3',t:'Door oranje of rood rijden',ta:'المرق بالبرتقالي أو الأحمر',
  nl:'Het licht springt op oranje en dan rood, maar de blauwe auto rijdt door. Het verkeer van rechts krijgt groen en rijdt het kruispunt op.',ar:'الإشارة صارت برتقالي وبعدين أحمر، بس السيارة الزرقا كمّلت. اللي من اليمين صار عنده أخضر ودخل التقاطع.',
  good:'Goed: bij oranje stop je als dat veilig kan. Bij rood altijd stoppen voor de streep.',gooda:'الصح: بالبرتقالي بتوقف إذا آمن، وبالأحمر دايماً قبل الخط.',
  d:{scene:()=>cross({n:1,s:1,e:1,w:1,stops:['s','e']})+tlight(212,222,'me')+tlight(222,104,'x',-90),a:[{k:'car',c:BL,me:1,p:'M180 300 V-40'},{k:'car',c:RD,p:'M300 140 H-40'}]},
  fout:{dur:3000,tracks:[{i:0,keys:[[0,0],[1700,.26],[2500,.44]]},{i:1,keys:[[0,0],[1900,0],[2500,.35]]}],ev:[{t:0,type:'light',l:'me',s:'g'},{t:0,type:'light',l:'x',s:'r'},{t:600,type:'light',l:'me',s:'y'},{t:1500,type:'light',l:'me',s:'r'},{t:1800,type:'light',l:'x',s:'g'},{t:2500,type:'crash',x:178,y:148}]},
  goed:{dur:7000,tracks:[{i:0,keys:[[0,0],[1500,.21],[4600,.21],[7000,1]]},{i:1,keys:[[0,0],[1900,0],[4200,1]]}],ev:[{t:0,type:'light',l:'me',s:'g'},{t:0,type:'light',l:'x',s:'r'},{t:600,type:'light',l:'me',s:'y'},{t:900,type:'brake',i:0},{t:1500,type:'light',l:'me',s:'r'},{t:1800,type:'light',l:'x',s:'g'},{t:4300,type:'light',l:'x',s:'r'},{t:4500,type:'light',l:'me',s:'g'},{t:4600,type:'go',i:0}]}},
 {id:'m4',t:'Afgeleid door je telefoon',ta:'التشتت بالتلفون',
  nl:'De bestuurder kijkt op zijn telefoon en raakt langzaam over de middenstreep. Er komt een tegenligger aan.',ar:'السائق عم يطلّع بالتلفون وصار يميل شوي شوي فوق الخط النص، وفي سيارة جاية.',
  good:'Goed: telefoon weg of in een houder, ogen op de weg. Dan blijf je netjes in je eigen rijstrook.',gooda:'الصح: التلفون بعيد أو بحامل، وعيونك عالطريق، فبتضل بمسارك.',
  d:{scene:()=>street({}),a:[{k:'car',c:BL,me:1,p:'M180 330 V230 C180 190 150 170 146 120 V-40',p2:'M180 330 V-40'},{k:'car',c:RD,p:'M140 -40 V360'}]},
  fout:{dur:2700,tracks:[{i:0,keys:[[0,0],[2200,.5]]},{i:1,keys:[[0,0],[2200,.42]]}],ev:[{t:2200,type:'crash',x:146,y:128}]},
  goed:{dur:3600,alt:{0:1},tracks:[{i:0,keys:[[0,0],[3600,1]]},{i:1,keys:[[0,0],[3600,1]]}],ev:[]}}
];

/* =========================================================
   ENGINE
   ========================================================= */
let nid=0;
function buildScene(el,d,key,opt={}){
 const id='g'+(nid++),H=d.h||320;
 const paths=d.a.map((a,i)=>`<path id="${id}p${i}" d="${a.p}" fill="none" stroke="none"/>`+(a.p2?`<path id="${id}q${i}" d="${a.p2}" fill="none" stroke="none"/>`:'')+(a.v?`<path class="route" d="${a.v}" stroke="${routeCol(a)}" marker-end="url(#ar)"/>`:'')).join('');
 const acts=d.a.map((a,i)=>`<g class="act${a.k==='amb'?' amb':''}" data-i="${i}" tabindex="-1"><circle class="halo" r="${a.k==='tram'||a.k==='bus'?40:26}" fill="none" stroke="#ffc21a" stroke-width="5"/>${actorSvg(a)}</g>`).join('');
 const badges=d.a.map((a,i)=>a.b?`<g class="badge" data-i="${i}"><circle r="14" fill="#f07a00" stroke="#fff" stroke-width="3"/><text y="5.5" font-size="16" font-weight="800" text-anchor="middle" fill="#fff" ${FONT}>${a.o}</text></g>`:'').join('');
 el.classList.add('scene');
 el.innerHTML=`<div class="stage"><div class="tilt3d"><svg viewBox="0 0 320 ${H}" role="img" aria-label="Verkeerssituatie">${d.scene()}${paths}${acts}${badges}<g class="fxl"></g></svg></div><div class="flashbad"></div><button class="b3d" type="button" title="3D-weergave aan/uit" aria-pressed="false">${ico('cube')}<span>3D</span></button></div>`+(opt.controls||'');
 const svg=el.querySelector('svg'),stage=el.querySelector('.stage');
 const S={el,d,key,svg,stage,busy:false,pos:[]};
 S.paths=d.a.map((_,i)=>svg.querySelector('#'+id+'p'+i));S.alt=d.a.map((_,i)=>svg.querySelector('#'+id+'q'+i));S.use=d.a.map(()=>0);
 S.acts=[...svg.querySelectorAll('.act')];S.badges=[...svg.querySelectorAll('.badge')];
 S.P=i=>S.use[i]&&S.alt[i]?S.alt[i]:S.paths[i];
 S.L=i=>S.P(i).getTotalLength();
 S.place=(i,l)=>{const p=S.P(i),L=S.L(i);l=Math.max(0,Math.min(L,l));const a=p.getPointAtLength(l),b=p.getPointAtLength(Math.min(L,l+1.5)),c=l>=L?p.getPointAtLength(L-1.5):a;
  const ang=(l>=L?Math.atan2(a.y-c.y,a.x-c.x):Math.atan2(b.y-a.y,b.x-a.x))*180/Math.PI+90;S.acts[i].setAttribute('transform',`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);S.pos[i]=a};
 S.setLight=(l,s)=>{const t=svg.querySelector(`.tlight[data-l="${l}"]`);if(!t)return;t.querySelector('.lr').setAttribute('fill',s==='r'?'#ff3040':'#4a1010');t.querySelector('.ly').setAttribute('fill',s==='y'?'#ffb020':'#4a3810');t.querySelector('.lg').setAttribute('fill',s==='g'?'#2ee07a':'#0f3a1f')};
 S.reset=()=>{S.use=d.a.map(()=>0);d.a.forEach((a,i)=>S.place(i,0));S.acts.forEach(g=>g.classList.remove('braking'));svg.querySelector('.fxl').innerHTML='';
  S.badges.forEach(bg=>{const i=+bg.dataset.i,a=d.a[i],p=S.pos[i];bg.setAttribute('transform',`translate(${p.x+a.b[0]} ${p.y+a.b[1]})`)});
  if(d.lights)Object.entries(d.lights).forEach(([l,s])=>S.setLight(l,s));if(opt.lights)Object.entries(opt.lights).forEach(([l,s])=>S.setLight(l,s));
  const tx=svg.querySelector('.timer');if(tx)tx.textContent='2 seconden';stage.classList.remove('good','bad')};
 S.reset();
 /* sequential play by order */
 S.run=idx=>new Promise(res=>{const sp=d.speed||130;const t0=performance.now();const durs=idx.map(i=>S.L(i)/((d.a[i].sp||sp))*1000*(RMQ?.35:1));const D=Math.max(...durs);let tPole=null,done2=0;
  const f=t=>{const e=t-t0;idx.forEach((i,j)=>{const k=Math.min(1,e/durs[j]);const ee=d.speed||d.a[i].sp?k:(k<.5?2*k*k:1-(-2*k+2)**2/2);S.place(i,ee*S.L(i))});
   if(key==='afstand'){const tx=svg.querySelector('.timer');if(tPole===null&&S.pos[0].x>=200)tPole=t;if(tPole!==null){if(S.pos[1].x<200)tx.textContent=((t-tPole)/1000).toFixed(1).replace('.',',')+' s …';else if(!done2){done2=1;tx.textContent='2 seconden ✓'}}}
   if(e<D)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});
 S.play=async()=>{if(S.busy)return;S.busy=true;svg.classList.add('playing');S.reset();
  if(d.tl){await S.timeline(d.tl)}else{const groups=[...new Set(d.a.map(a=>a.o))].sort();for(const o of groups){await S.run(d.a.map((a,i)=>a.o===o?i:-1).filter(i=>i>=0));await wait(250)}}
  await wait(800);S.reset();svg.classList.remove('playing');S.busy=false};
 /* timeline player (used by mistakes + ritsen) */
 S.timeline=(tl)=>new Promise(res=>{const t0=performance.now();const fired=new Set();const st=tl.start||{};if(tl.alt)Object.keys(tl.alt).forEach(i=>S.use[i]=1);
  const val=(keys,t)=>{if(t<=keys[0][0])return keys[0][1];for(let k=1;k<keys.length;k++){if(t<=keys[k][0]){const [t1,v1]=keys[k-1],[t2,v2]=keys[k];const u=(t-t1)/(t2-t1||1);const e=u<.5?2*u*u:1-(-2*u+2)**2/2;return v1+(v2-v1)*e}}return keys[keys.length-1][1]};
  const f=now=>{const t=(now-t0)*(RMQ?3:1);tl.tracks.forEach(tr=>{const L=S.L(tr.i);S.place(tr.i,val(tr.keys,t)*L)});
   (tl.ev||[]).forEach((ev,k)=>{if(!fired.has(k)&&t>=ev.t){fired.add(k);S.event(ev)}});
   if(t<tl.dur)requestAnimationFrame(f);else res()};requestAnimationFrame(f)});
 S.event=ev=>{if(ev.type==='light')S.setLight(ev.l,ev.s);if(ev.type==='brake')S.acts[ev.i].classList.add('braking');if(ev.type==='go')S.acts[ev.i].classList.remove('braking');
  if(ev.type==='crash'){svg.querySelector('.fxl').innerHTML=`<g transform="translate(${ev.x} ${ev.y})" class="boom"><path d="M0 -26 L7 -9 L25 -12 L12 2 L22 18 L4 11 L-4 26 L-8 9 L-25 13 L-12 0 L-22 -16 L-5 -10 Z" fill="#ffcf33" stroke="#e0201b" stroke-width="3"/><text y="5" font-size="10" font-weight="800" text-anchor="middle" fill="#b00000" ${FONT}>BOTS!</text></g>`;stage.classList.remove('bad');void stage.offsetWidth;stage.classList.add('bad')}};
 /* quiz: tap the one who goes first */
 S.quiz=()=>{if(S.busy)return;S.reset();S.left=d.a.map((_,i)=>i);svg.classList.add('quiz');if(opt.onQuizStart)opt.onQuizStart()};
 svg.addEventListener('click',async e=>{if(!svg.classList.contains('quiz')||S.busy)return;const g=e.target.closest('.act');if(!g)return;const i=+g.dataset.i;const min=Math.min(...S.left.map(j=>d.a[j].o));
  if(d.a[i].o===min){S.busy=true;S.left=S.left.filter(j=>j!==i);await S.run([i]);S.busy=false;if(!S.left.length){svg.classList.remove('quiz');stage.classList.add('good');opt.onSolved&&opt.onSolved();await wait(1600);S.reset()}}
  else{stage.classList.remove('bad');void stage.offsetWidth;stage.classList.add('bad');opt.onWrong&&opt.onWrong()}});
 stage.querySelector('.b3d').addEventListener('click',e=>{const on=stage.classList.toggle('d3');e.currentTarget.setAttribute('aria-pressed',on)});
 return S}
