/* =========================================================
   APP – routing, voortgang, quizzen, simulator, zoeken, favorieten
   ========================================================= */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=RMQ;document.documentElement.classList.add('js');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- state ---------- */
const KEY='tb-v2';
let P={read:{},solved:{},known:{},ar:true,fav:{},quiz:{},sim:{},exams:[]};
try{const s=JSON.parse(localStorage.getItem(KEY));if(s)P=Object.assign(P,s)}catch(e){}
['fav','quiz','sim'].forEach(k=>{if(!P[k]||typeof P[k]!=='object')P[k]={}});if(!Array.isArray(P.exams))P.exams=[];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}renderProgress()};

/* ---------- toast + confetti ---------- */
let tT;function toast(ok,nl,ar){const t=$('#toast');t.className='toast show '+(ok===false?'no':'ok');
 t.innerHTML=`<span class="dot">${ok===false?ico('x'):ok===true?ico('check'):ico('info')}</span><div><p>${nl}</p>${P.ar&&ar?`<p class="tar" lang="ar" dir="rtl">${ar}</p>`:''}</div>`;clearTimeout(tT);tT=setTimeout(()=>t.classList.remove('show'),3600)}
const cv=$('#fx'),cx=cv.getContext('2d');let parts=[];
function confetti(src){if(RM||!src)return;const r=src.getBoundingClientRect();cv.width=innerWidth;cv.height=innerHeight;const cols=['#ffc21a','#2563eb','#16a34a','#dc2b2b','#ffffff'];const run=parts.length;
 for(let i=0;i<90;i++)parts.push({x:r.left+r.width/2,y:r.top+Math.min(r.height/3,120),vx:(Math.random()-.5)*12,vy:-Math.random()*10-4,s:Math.random()*7+4,c:cols[i%5],r:Math.random()*6,vr:(Math.random()-.5)*.4,l:0});
 if(!run)requestAnimationFrame(tick)}
function tick(){cx.clearRect(0,0,cv.width,cv.height);parts.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.r+=p.vr;p.l++;cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.globalAlpha=Math.max(0,1-p.l/85);cx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);cx.restore()});parts=parts.filter(p=>p.l<85&&p.y<cv.height+40);if(parts.length)requestAnimationFrame(tick);else cx.clearRect(0,0,cv.width,cv.height)}

/* ---------- folders ---------- */
const F=[
 ['borden','Verkeersborden','الشارات ومعناها','L'],['voorrang','Voorrang en kruispunten','الأفضلية والتقاطعات','L'],['simulator','Verkeerssimulator','محاكي المواقف','O'],
 ['snelheid','Snelheid en remweg','السرعة ومسافة الفرملة','L'],['snelweg','Autosnelweg','الأوتوستراد','L'],['inhalen','Inhalen en rijstroken','التجاوز والمسارات','L'],
 ['parkeren','Parkeren en strepen','الصف وخطوط الطريق','L'],['voetfiets','Voetgangers en fietsers','المشاة والدراجات','L'],['weer','Weer en gladheid','الطقس والانزلاق','L'],
 ['verlichting','Verlichting','أضواء السيارة','L'],['nacht','Rijden in het donker','السواقة بالعتمة','L'],['wetten','Wetten en veiligheid','القوانين والأمان','L'],
 ['ongeval','Verantwoordelijkheid','المسؤولية والحوادث','L'],['rijhulp','Rijhulpsystemen','أنظمة المساعدة','L'],['gevaar','Gevaarherkenning','التعرّف على الخطر','L'],
 ['fouten','Veelgemaakte fouten','أخطاء شائعة','O'],['examen','Proefexamen','امتحان تجريبي','O'],['woorden','Woordenlijst','قاموس الكلمات','X'],['favorieten','Favorieten','المفضلة','X'],['bronnen','Bronnen','المصادر','X']];
const LESSONS=F.filter(f=>f[3]==='L').map(f=>f[0]);
const views=['start',...F.map(f=>f[0])];
const fTitle=h=>(F.find(f=>f[0]===h)||[h,h])[1];

/* ---------- Arabic direction ---------- */
function fixAr(root=document){$$('.ar',root).forEach(e=>{e.lang='ar';e.dir='rtl'});$$('th',root).forEach(th=>{if(th.textContent.trim()==='بالعربي'){th.lang='ar';th.classList.add('arcol')}})}

/* ---------- lesson data renderers (unchanged content) ---------- */
const signCard=([k,n,u,a])=>`<div class="sign rv" data-sign="${k}" tabindex="0" role="button" aria-label="${esc(n)}">${sign(k,n)}<div><h4>${n}</h4><p>${u}</p></div><button class="favb" data-fav="s:${k}" aria-label="Favoriet">${ico('star')}</button><div class="ar">${a}</div></div>`;
$('#signgroups').innerHTML=GROUPS.map(([t,a,items])=>`<h3>${t} · <span lang="ar" class="arcol arinline">${a}</span></h3><div class="signs">${items.map(signCard).join('')}</div>`).join('');
$('#matrix').innerHTML=MATRIX.map(signCard).join('');
$('#adas').innerHTML=ADAS.map(([t,u,a])=>`<div class="card rv"><h3 style="margin-top:0">${t}</h3><p>${u}</p><div class="ar">${a}</div></div>`).join('');
const SRC2=[['ANWB: invoegen en ritsen','https://www.anwb.nl/verkeer/veiligheid/verkeersregels/invoegen'],['ANWB: verkeersregels in Nederland (ritsen)','https://www.anwb.nl/vakantie/nederland/reisvoorbereiding/verkeersregels'],['ANWB: snelheid (autoweg/autosnelweg)','https://www.anwb.nl/verkeer/veiligheid/verkeersregels/snelheid'],['ANWB: verkeersborden Nederland','https://www.anwb.nl/verkeer/nederland/verkeersinformatie/verkeersborden-nederland'],['ANWB: voetgangers en voorrang','https://www.anwb.nl/verkeer/veiligheid/verkeersregels/voorrang-voetgangers'],['ANWB: voorrang','https://www.anwb.nl/verkeer/veiligheid/voorrang'],['ANWB: remmen en remweg','https://www.anwb.nl/verzekeringen/autoverzekering/veilig-onderweg/tips-remmen'],['Rekenmachinepro: CBR-vuistregels stopafstand','https://rekenmachinepro.nl/natuurkunde/remweg-stopafstand-berekenen/'],['Rijksoverheid: rijbewijs en aanhanger','https://www.rijksoverheid.nl/themas/verkeer-en-vervoer/auto/vraag-en-antwoord/rijbewijs/met-welk-rijbewijs-mag-ik-een-motorvoertuig-met-aanhangwagen-besturen'],['ANWB: aanhanger met rijbewijs B','https://www.anwb.nl/auto/rijbewijs/juridische-informatie/rijbewijs-be'],['ANWB: aquaplaning','https://www.anwb.nl/verkeer/veiligheid/rijden-bij-wateroverlast'],['Weeronline: wat is aquaplaning','https://www.weeronline.nl/nieuws/wat-is-aquaplaning'],['ANWB: winterbanden (verplicht mee in de auto)','https://www.anwb.nl/vakantie/nederland/informatie/verplicht-mee-in-de-auto'],['Hart van Nederland: slippen bij gladheid','https://www.hartvannederland.nl/infrastructuur/verkeer/artikelen/slipcursus-code-oranje-vanwege-gladheid-wat-doen-bij-slip-door-gladheid-ijzel'],['ANWB: veilig rijden in het donker','https://www.anwb.nl/verkeer/veiligheid/veilig-rijden-in-het-donker'],['ANWB: verblinding','https://www.anwb.nl/verkeer/veiligheid/hoe-werkt-verblinding'],['ANWB: soorten autoverlichting','https://www.anwb.nl/auto/onderhoud-en-reparatie/auto-onderdelen/soorten-autoverlichting'],['Omroep Brabant: doorrijden na een ongeluk','https://www.omroepbrabant.nl/nieuws/4719275/doorrijden-na-ongeluk-strafbaar-maar-soms-automatische-reactie'],['Staatsblad 2012-347: erf 15 km/u, snelweg 130 km/u','https://zoek.officielebekendmakingen.nl/stb-2012-347.pdf'],['Univé: blokmarkering','https://www.unive.nl/autoverzekering/verkeersregels/blokmarkeringen'],['Univé: weefvak en invoegen','https://www.unive.nl/autoverzekering/regels-invoegen']];
$('#words tbody').innerHTML=WORDS.map(([n,a,u])=>`<tr><td><b>${n}</b></td><td lang="ar">${a}</td><td>${u}</td></tr>`).join('');
$('#srcs').innerHTML=[...SRC,...SRC2].map(([t,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('');
// word filter
$('#words').closest('.scroll').insertAdjacentHTML('beforebegin',`<div class="filterbar"><label class="sbox">${ico('search')}<input id="wq" type="search" placeholder="Zoek een woord… / دوّر على كلمة" aria-label="Zoek in woordenlijst"></label><span class="cnt" id="wc"></span></div>`);
const wf=()=>{const q=$('#wq').value.trim().toLowerCase();let n=0;$$('#words tbody tr').forEach(tr=>{const on=!q||tr.textContent.toLowerCase().includes(q);tr.hidden=!on;if(on)n++});$('#wc').textContent=n+' woorden'};$('#wq').addEventListener('input',wf);wf();

/* ---------- full sign catalogue ---------- */
const GCAT=['verbod','gebod','voorrang','waarschuwing','aanwijzing'];
const ALLS=[...GROUPS.flatMap((g,gi)=>g[2].map(([k,n,u,a])=>({k,n,u,a,code:CODES[k]||k,cat:['E1','E2'].includes(k)?'parkeren':GCAT[gi]}))),...MATRIX.map(([k,n,u,a])=>({k,n,u,a,code:CODES[k]||'',cat:'matrix'})),...EXTRA.map(([k,code,cat,n,u,a])=>({k,n,u,a,code,cat}))];
const SBYK=Object.fromEntries(ALLS.map(s=>[s.k,s]));
$('#signcat').innerHTML=`<div class="filterbar"><label class="sbox">${ico('search')}<input id="sq" type="search" placeholder="Zoek bord of code… / دوّر على شارة" aria-label="Zoek een bord"></label><div class="chips" id="schips"><button class="chip on" data-c="">Alle</button>${Object.keys(CAT).map(c=>`<button class="chip" data-c="${c}">${CAT[c]} <span lang="ar" class="arcol">${CATAR[c]}</span></button>`).join('')}<button class="chip" data-c="fav">${ico('star')} Favorieten</button></div><span class="cnt" id="sc"></span></div><div class="signgrid" id="sgrid"></div>`;
$('#sgrid').innerHTML=ALLS.map(s=>`<button class="stile rv" data-sign="${s.k}" data-cat="${s.cat}" data-q="${esc((s.n+' '+s.code+' '+s.u+' '+s.a).toLowerCase())}">${sign(s.k,s.n)}<b>${s.n}</b><small>${s.code}</small></button>`).join('');
let scat='';const sfilter=()=>{const q=$('#sq').value.trim().toLowerCase();let n=0;$$('#sgrid .stile').forEach(t=>{const on=(!scat||(scat==='fav'?P.fav['s:'+t.dataset.sign]:t.dataset.cat===scat))&&(!q||t.dataset.q.includes(q));t.hidden=!on;if(on)n++});$('#sc').textContent=n+' borden'};
$('#sq').addEventListener('input',sfilter);$('#schips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;scat=b.dataset.c;$$('#schips .chip').forEach(c=>c.classList.toggle('on',c===b));sfilter()});sfilter();
$('#parkSigns').innerHTML=['E6','E10'].map(k=>signCard([k,SBYK[k].n,SBYK[k].u,SBYK[k].a])).join('');

/* ---------- modal ---------- */
const modal=$('#modal');let lastFocus=null;
function openModal(html,cls=''){lastFocus=document.activeElement;$('#mbody').innerHTML=html;modal.className='modal open '+cls;fixAr($('#mbody'));setTimeout(()=>($('#mbody [autofocus]')||$('#mclose')).focus(),40)}
function closeModal(){modal.className='modal';if(lastFocus)lastFocus.focus()}
$('#mclose').onclick=closeModal;modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
addEventListener('keydown',e=>{if(e.key==='Escape'){if(modal.classList.contains('open'))closeModal();document.body.classList.remove('menu')}});
function signModal(k){const s=SBYK[k];if(!s)return;openModal(`<div class="smodal"><div class="sbig">${sign(k,s.n)}</div><div><span class="kode">${s.code}</span><span class="kode alt">${CAT[s.cat]||''}</span><h3>${s.n}</h3><p>${s.u}</p><div class="ar">${s.a}</div><button class="btn sm ${P.fav['s:'+k]?'isfav':''}" data-fav="s:${k}" autofocus>${ico('star')} ${P.fav['s:'+k]?'In favorieten':'Bewaar als favoriet'}</button></div></div>`,'wide')}
document.addEventListener('click',e=>{const f=e.target.closest('[data-fav]');if(f){e.stopPropagation();toggleFav(f.dataset.fav,f);return}
 const s=e.target.closest('[data-sign]');if(s&&!e.target.closest('.flash'))signModal(s.dataset.sign)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.sign[data-sign]')){e.preventDefault();signModal(e.target.dataset.sign)}});

/* ---------- favourites ---------- */
function toggleFav(id,btn){if(P.fav[id])delete P.fav[id];else{P.fav[id]=Date.now();toast(true,'Bewaard in je favorieten.','انحفظت بالمفضلة.')}save();syncFav();
 if(btn&&btn.closest('#mbody')){btn.classList.toggle('isfav',!!P.fav[id]);btn.innerHTML=ico('star')+(P.fav[id]?' In favorieten':' Bewaar als favoriet')}
 if(!RM&&btn){btn.classList.remove('pop');void btn.offsetWidth;btn.classList.add('pop')}renderFavs()}
function syncFav(){$$('[data-fav]').forEach(b=>{b.classList.toggle('isfav',!!P.fav[b.dataset.fav]);b.setAttribute('aria-pressed',!!P.fav[b.dataset.fav])})}
function renderFavs(){const ids=Object.keys(P.fav).sort((a,b)=>P.fav[b]-P.fav[a]);const L=ids.filter(i=>i[0]==='l'),S=ids.filter(i=>i[0]==='s'),Q=ids.filter(i=>i[0]==='q');
 if(!ids.length){$('#favs').innerHTML=`<div class="empty">${ico('star')}<p>Nog geen favorieten. Tik op een ster bij een les, bord of vraag.</p><p lang="ar" dir="rtl">لسا ما في مفضلة. اضغط على النجمة جنب أي درس أو شارة أو سؤال.</p></div>`;return}
 $('#favs').innerHTML=(L.length?`<h3>Lessen</h3><div class="folders">${L.map(i=>{const h=i.slice(2);return `<a class="folder" href="#${h}"><span class="ic">${ico(h)}</span><div><span>${fTitle(h)}</span></div><span class="go">${ico('arrow')}</span></a>`}).join('')}</div>`:'')+
 (S.length?`<h3>Borden</h3><div class="signgrid">${S.map(i=>{const s=SBYK[i.slice(2)];return s?`<button class="stile" data-sign="${s.k}">${sign(s.k,s.n)}<b>${s.n}</b><small>${s.code}</small></button>`:''}).join('')}</div>`:'')+
 (Q.length?`<h3>Vragen</h3><div class="qlist">${Q.map(i=>{const q=ALLQ.find(x=>x.id===i.slice(2));return q?qCard(q,'fav'):''}).join('')}</div>`:'');fixAr($('#favs'));syncFav()}

/* ---------- practice questions ---------- */
function qCard(q,ctx){const st=(P.quiz[q.t]||{})[q.id];return `<div class="qcard" data-qid="${q.id}" data-ctx="${ctx}"><div class="qhead"><span class="qtag">${QT[q.t]}</span><button class="favb" data-fav="q:${q.id}" aria-label="Favoriet">${ico('star')}</button></div><p class="qq">${q.q}</p><p class="qa" lang="ar" dir="rtl">${q.qa}</p><div class="opts">${q.o.map((o,i)=>`<button class="opt" data-i="${i}"><span class="ol">${'ABC'[i]}</span>${o}</button>`).join('')}</div><div class="qexp" hidden></div>${st!==undefined?`<span class="qprev ${st?'ok':'no'}">${st?'eerder goed':'eerder fout'}</span>`:''}</div>`}
function answer(card,i){if(card.classList.contains('done'))return;const q=ALLQ.find(x=>x.id===card.dataset.qid);const ok=i===q.a;card.classList.add('done',ok?'right':'wrong');
 $$('.opt',card).forEach((b,j)=>{b.disabled=true;if(j===q.a)b.classList.add('correct');if(j===i&&!ok)b.classList.add('incorrect')});
 const ex=$('.qexp',card);ex.hidden=false;ex.innerHTML=`<p><b>${ok?'Goed!':'Niet goed.'}</b> ${q.e}</p><div class="ar">${q.ea}</div>`;fixAr(ex);
 if(card.dataset.ctx!=='exam'){(P.quiz[q.t]=P.quiz[q.t]||{})[q.id]=ok;save();updQuizHead(q.t);if(ok)confetti($('.opt.correct',card))}
 return ok}
document.addEventListener('click',e=>{const o=e.target.closest('.opt');if(!o)return;const c=o.closest(".qcard");if(!c||c.dataset.ctx==="exam")return;answer(c,+o.dataset.i)});
function updQuizHead(t){$$(`.quiz[data-topic="${t}"] .qscore`).forEach(el=>{const r=P.quiz[t]||{},n=QUESTIONS[t].length,ok=Object.values(r).filter(Boolean).length,done=Object.keys(r).length;el.innerHTML=`<i><b style="width:${ok/n*100}%"></b></i><span>${ok}/${n} goed · ${done}/${n} gemaakt</span>`})}
$$('.quiz[data-topic]').forEach(box=>{const t=box.dataset.topic;if(!QUESTIONS[t])return;
 const draw=()=>{box.innerHTML=`<div class="qtop"><h3>${ico('examen')} Oefenvragen <span lang="ar" class="arcol arinline">· أسئلة تدريب</span></h3><div class="qscore"></div><button class="btn ghost sm qreset">${ico('refresh')} Opnieuw</button></div><div class="qlist">${QUESTIONS[t].map((q,i)=>qCard(Object.assign({id:t+'-'+i,t},q),'topic')).join('')}</div>`;updQuizHead(t);syncFav()};
 draw();box.addEventListener('click',e=>{if(e.target.closest('.qreset')){delete P.quiz[t];save();draw();fixAr(box)}})});

/* ---------- lesson scenes ---------- */
$$('[data-d]').forEach(el=>{const key=el.dataset.d,d=DG[key];if(!d)return;
 const ctl=d.a.length&&key!=='hero'?`<div class="ctl"><button class="btn sm" data-act="play">${ico('play')} Afspelen <span lang="ar" class="arcol arinline">· شغّل</span></button>${d.quiz?`<button class="btn ghost sm" data-act="quiz">${ico('target')} Jij beslist <span lang="ar" class="arcol arinline">· انت قرّر</span></button>`:''}${P.solved[key]?`<span class="known-tag">${ico('check')} opgelost</span>`:''}</div>`:'';
 const S=buildScene(el,d,key,{controls:ctl,onQuizStart:()=>toast(null,'Tik op wie als eerste mag rijden.','اضغط على اللي لازم يمرق أول.'),
  onSolved:()=>{P.solved[key]=1;save();confetti(S.stage);toast(true,'Goed zo! Je hebt de juiste volgorde gekozen.','برافو! اخترت الترتيب الصح.');const c=$('.ctl',el);if(c&&!$('.known-tag',c))c.insertAdjacentHTML('beforeend',`<span class="known-tag">${ico('check')} opgelost</span>`)},
  onWrong:()=>toast(false,'Niet goed. '+d.hint[0],'مو صح. '+d.hint[1])});
 el.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;b.dataset.act==='play'?S.play():S.quiz()});
 if(key==='hero'){(async()=>{if(RM)return;while(true){await wait(1400);if(document.hidden||!$('#v-start').classList.contains('on'))continue;await S.play()}})()}});

/* ---------- simulator ---------- */
(()=>{const box=$('#sim');let i=0,S=null,answered=false;
 box.innerHTML=`<div class="simtop"><div class="simprog" id="simprog"></div><span class="cnt" id="simcnt"></span></div><div class="simgrid"><div id="simstage"></div><div class="simside"><span class="kode" id="simnum"></span><h3 id="simtitle"></h3><p class="arinline" id="simta" lang="ar" dir="rtl"></p><p class="simq"><b>Wie mag als eerste rijden?</b> <span lang="ar" class="arcol arinline">مين بيمرق أول؟</span></p><div class="opts" id="simopts"></div><div class="qexp" id="simexp" hidden></div><div class="simnav"><button class="btn ghost sm" id="simprev">${ico('left')} Vorige</button><button class="btn ghost sm" id="simreplay">${ico('play')} Bekijk opnieuw</button><button class="btn sm" id="simnext">Volgende ${ico('right')}</button></div></div></div>`;
 const prog=()=>{$('#simprog').innerHTML=SCEN.map((s,j)=>`<button class="pdot ${P.sim[s.id]===true?'ok':P.sim[s.id]===false?'no':''} ${j===i?'cur':''}" data-j="${j}" aria-label="Situatie ${j+1}"></button>`).join('');const ok=SCEN.filter(s=>P.sim[s.id]===true).length;$('#simcnt').textContent=`${ok}/${SCEN.length} goed`};
 const load=j=>{i=(j+SCEN.length)%SCEN.length;const sc=SCEN[i];answered=false;
  S=buildScene($('#simstage'),sc.d,'sim',{lights:sc.lights});S.svg.classList.add('quiz');
  $('#simnum').textContent=`Situatie ${i+1} van ${SCEN.length}`;$('#simtitle').textContent=sc.t;$('#simta').textContent=sc.ta;
  $('#simopts').innerHTML=sc.d.a.map((a,k)=>`<button class="opt" data-k="${k}"><span class="ol">${'ABCD'[k]}</span>${a.l}</button>`).join('');
  $('#simexp').hidden=true;$('#simreplay').disabled=true;prog()};
 const choose=async k=>{if(answered)return;answered=true;const sc=SCEN[i],min=Math.min(...sc.d.a.map(a=>a.o)),ok=sc.d.a[k].o===min;
  $$('#simopts .opt').forEach((b,j)=>{b.disabled=true;if(sc.d.a[j].o===min)b.classList.add('correct');if(j===k&&!ok)b.classList.add('incorrect')});
  P.sim[sc.id]=ok;save();prog();S.svg.classList.remove('quiz');
  if(ok){S.stage.classList.add('good');confetti(S.stage)}else{S.stage.classList.remove('bad');void S.stage.offsetWidth;S.stage.classList.add('bad')}
  const ex=$('#simexp');ex.hidden=false;ex.innerHTML=`<p><b>${ok?'Goed!':'Niet goed.'}</b> ${sc.e}</p><div class="ar">${sc.ea}</div>`;fixAr(ex);
  await wait(500);await S.play();$('#simreplay').disabled=false;S.svg.classList.remove('quiz')};
 box.addEventListener('click',e=>{const o=e.target.closest('#simopts .opt');if(o)choose(+o.dataset.k);const d=e.target.closest('.pdot');if(d)load(+d.dataset.j);
  const g=e.target.closest('#simstage .act');if(g&&!answered)choose(+g.dataset.i)});
 $('#simprev').onclick=()=>load(i-1);$('#simnext').onclick=()=>load(i+1);$('#simreplay').onclick=()=>S.play();load(0)})();

/* ---------- mistakes ---------- */
$('#mistakes').innerHTML=MIST.map(m=>`<div class="diag mist" data-m="${m.id}"><div class="mscene"></div><div><h3>${m.t}</h3><p class="arinline" lang="ar" dir="rtl">${m.ta}</p><div class="tabs"><button class="btn sm bad" data-run="fout">${ico('x')} Bekijk de fout</button><button class="btn sm good" data-run="goed">${ico('check')} Zo moet het</button></div><p class="mtxt"><b>Wat gaat er mis?</b> ${m.nl}</p><div class="ar">${m.ar}</div><p class="mtxt goodtxt"><b>${m.good}</b></p><div class="ar">${m.gooda}</div></div></div>`).join('');
$$('.mist').forEach(el=>{const m=MIST.find(x=>x.id===el.dataset.m);const S=buildScene($('.mscene',el),m.d,m.id,{});
 el.addEventListener('click',async e=>{const b=e.target.closest('[data-run]');if(!b||S.busy)return;S.busy=true;$$('[data-run]',el).forEach(x=>x.disabled=true);S.reset();el.dataset.mode=b.dataset.run;await S.timeline(m[b.dataset.run]);await wait(1200);S.reset();S.busy=false;$$('[data-run]',el).forEach(x=>x.disabled=false)})});

/* ---------- stopping distance simulator (canvas) ---------- */
(()=>{const box=$('#stopsim');if(!box)return;
 box.innerHTML=`<div class="ssim"><div class="sctl"><label>Snelheid <b id="vV">50 km/u</b><input type="range" id="vIn" min="30" max="130" step="10" value="50"></label><label>Reactietijd <b id="rV">1,0 s</b><input type="range" id="rIn" min="0.5" max="2.5" step="0.5" value="1"></label><div class="seg" role="radiogroup" aria-label="Wegdek"><button class="on" data-w="1">Droog</button><button data-w="2">Nat</button></div><button class="btn sm" id="sGo">${ico('play')} Start</button></div><canvas id="sCan" height="190"></canvas><div class="sres" id="sRes"></div></div>`;
 const c=$('#sCan'),g=c.getContext('2d');let v=50,rt=1,wet=1,anim=null;const HAZ=45;
 const calc=()=>{const react=v/3.6*rt,brake=(v/10)**2*wet;return{react,brake,stop:react+brake}};
 const upd=()=>{const r=calc();$('#vV').textContent=v+' km/u';$('#rV').textContent=String(rt).replace('.',',')+' s';
  $('#sRes').innerHTML=`<div><span class="sw y"></span>Reactie <b>${r.react.toFixed(0)} m</b></div><div><span class="sw r"></span>Remweg <b>${r.brake.toFixed(0)} m</b></div><div><span class="sw k"></span>Stopafstand <b>${r.stop.toFixed(0)} m</b></div><div class="verdict ${r.stop<=HAZ?'ok':'no'}">${r.stop<=HAZ?'Op tijd gestopt ✓ · وقفت بالوقت':'Te laat: je raakt de bal ✗ · ما لحقت توقف'}</div>`;draw(0,null)};
 function draw(dist,phase){const W=c.clientWidth||600;if(c.width!==W*devicePixelRatio){c.width=W*devicePixelRatio;c.height=190*devicePixelRatio}g.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  const r=calc(),max=Math.max(r.stop,HAZ)+25,sc=(W-60)/max,x0=30;
  g.fillStyle='#8fc46b';g.fillRect(0,0,W,190);g.fillStyle='#33383e';g.fillRect(0,50,W,90);g.strokeStyle='#eee';g.setLineDash([14,10]);g.lineWidth=2;g.beginPath();g.moveTo(0,95);g.lineTo(W,95);g.stroke();g.setLineDash([]);
  // zones
  g.fillStyle='rgba(255,194,26,.45)';g.fillRect(x0,104,r.react*sc,30);g.fillStyle='rgba(220,43,43,.45)';g.fillRect(x0+r.react*sc,104,r.brake*sc,30);
  // ball
  const bx=x0+HAZ*sc;g.fillStyle='#fff';g.beginPath();g.arc(bx,118,9,0,7);g.fill();g.strokeStyle='#dc2b2b';g.lineWidth=3;g.beginPath();g.arc(bx,118,9,0,7);g.stroke();
  g.fillStyle='#111';g.font='700 12px Overpass,Arial';g.fillText('bal · 45 m',bx-26,166);
  // ticks
  g.fillStyle='#fff';g.font='600 11px Overpass,Arial';for(let m=0;m<=max;m+=20){const x=x0+m*sc;g.fillRect(x,136,1,6);g.fillText(m+' m',x-8,154)}
  // car
  const cx2=x0+dist*sc;g.save();g.translate(cx2,118);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(-46,-12,46,26);g.fillStyle='#2563eb';g.beginPath();g.roundRect?g.roundRect(-44,-14,44,26,7):g.rect(-44,-14,44,26);g.fill();g.fillStyle='#1b2a3a';g.fillRect(-18,-11,9,20);g.fillStyle='#fff6c8';g.fillRect(-3,-12,3,6);g.fillRect(-3,4,3,6);
  if(phase==='b'){g.fillStyle='#ff2b2b';g.fillRect(-46,-12,3,6);g.fillRect(-46,4,3,6)}g.restore();
  if(phase){g.fillStyle='#0b111acc';g.beginPath();g.roundRect?g.roundRect(W/2-90,8,180,30,15):g.rect(W/2-90,8,180,30);g.fill();g.fillStyle='#fff';g.font='800 14px Overpass,Arial';g.textAlign='center';g.fillText(phase==='r'?'Reageren… (gas los)':phase==='b'?'Remmen!':'Stil',W/2,28);g.textAlign='left'}}
 function go(){cancelAnimationFrame(anim);const r=calc(),vms=v/3.6,a=vms*vms/(2*r.brake);const t1=rt,t2=t1+vms/a;const k=RM?6:1.6;let t0=null;
  const f=t=>{if(t0===null)t0=t;const s=(t-t0)/1000*k;let d,ph;if(s<t1){d=vms*s;ph='r'}else if(s<t2){const u=s-t1;d=r.react+vms*u-.5*a*u*u;ph='b'}else{d=r.stop;ph='s'}draw(d,ph);if(s<t2+.6)anim=requestAnimationFrame(f);else{const ok=r.stop<=HAZ;if(ok)confetti(c);toast(ok,ok?`Op tijd gestopt na ${r.stop.toFixed(0)} meter.`:`Je stopafstand is ${r.stop.toFixed(0)} meter: te lang!`,ok?'وقفت بالوقت.':'مسافة التوقف أطول من اللازم!')}};anim=requestAnimationFrame(f)}
 $('#vIn').oninput=e=>{v=+e.target.value;upd()};$('#rIn').oninput=e=>{rt=+e.target.value;upd()};
 $$('.seg button',box).forEach(b=>b.onclick=()=>{wet=+b.dataset.w;$$('.seg button',box).forEach(x=>x.classList.toggle('on',x===b));upd()});
 $('#sGo').onclick=go;new ResizeObserver(()=>draw(0,null)).observe(c);upd();
 // chart
 const sp=[30,50,80,100,130];$('#stopchart').innerHTML=`<div class="chart">${sp.map(s=>{const re=s/10*3,br=(s/10)**2,t=re+br;return `<div class="crow"><span class="cl">${s} km/u</span><div class="cbar"><i class="y" style="--w:${re/220*100}%"></i><i class="r" style="--w:${br/220*100}%"></i></div><span class="cv">${t.toFixed(0)} m</span></div>`}).join('')}<div class="clegend"><span><span class="sw y"></span>reactieafstand</span><span><span class="sw r"></span>remweg (droog)</span></div></div>`})();

/* ---------- night beam demo ---------- */
(()=>{const box=$('#beam');if(!box)return;let mode='dim',onc=false;
 box.innerHTML=`<div class="beam"><svg viewBox="0 0 320 170" role="img" aria-label="Dimlicht en grootlicht"><defs><linearGradient id="bm" x1="0" x2="1"><stop offset="0" stop-color="#fff7c2" stop-opacity=".85"/><stop offset="1" stop-color="#fff7c2" stop-opacity="0"/></linearGradient><radialGradient id="glare"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="320" height="170" fill="#0b1220"/><g fill="#fff" opacity=".7"><circle cx="40" cy="18" r="1"/><circle cx="120" cy="30" r="1.2"/><circle cx="210" cy="14" r="1"/><circle cx="280" cy="34" r="1"/></g><rect y="70" width="320" height="80" fill="#1c2128"/><path d="M0 110H320" stroke="#555" stroke-width="2" stroke-dasharray="12 10"/><path class="beamp" d="M52 128 L200 114 L200 146 Z" fill="url(#bm)"/><g transform="translate(30 128)"><rect x="-26" y="-12" width="48" height="24" rx="6" fill="#2563eb"/><rect x="18" y="-11" width="5" height="6" fill="#fff6c8"/><rect x="18" y="5" width="5" height="6" fill="#fff6c8"/></g><g class="oncar" transform="translate(360 92)"><rect x="-22" y="-11" width="44" height="22" rx="6" fill="#d33"/><rect x="-24" y="-10" width="4" height="6" fill="#fff6c8"/><rect x="-24" y="4" width="4" height="6" fill="#fff6c8"/></g><circle class="glare" cx="250" cy="92" r="50" fill="url(#glare)" opacity="0"/><text class="warnt" x="160" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="#ffc21a" opacity="0" ${'font-family="Overpass,Arial"'}>Verblinding! Schakel naar dimlicht</text></svg>
 <div class="ctl"><div class="seg"><button class="on" data-b="dim">Dimlicht</button><button data-b="groot">Grootlicht</button></div><button class="btn ghost sm" id="onc">${ico('play')} Tegenligger</button></div></div>`;
 const svg=$('svg',box),bp=$('.beamp',svg);const set=()=>{bp.setAttribute('d',mode==='dim'?'M52 128 L200 114 L200 146 Z':'M52 128 L320 70 L320 160 Z');const glare=mode==='groot'&&onc;$('.glare',svg).setAttribute('opacity',glare?.9:0);$('.warnt',svg).setAttribute('opacity',glare?1:0)};
 $$('.seg button',box).forEach(b=>b.onclick=()=>{mode=b.dataset.b;$$('.seg button',box).forEach(x=>x.classList.toggle('on',x===b));set()});
 $('#onc').onclick=()=>{onc=!onc;$('.oncar',svg).setAttribute('transform',onc?'translate(250 92)':'translate(360 92)');$('#onc').classList.toggle('on',onc);set();if(onc&&mode==='groot')toast(false,'Je verblindt de tegenligger. Zet je dimlicht aan.','عم تعمي السيارة الجاية. حوّل عالضو العادي.')};set()})();

/* ---------- weather demo ---------- */
(()=>{const box=$('#weather');if(!box)return;let w='rain';
 const drops=Array.from({length:40},(_,i)=>`<line class="drop" x1="${(i*37)%320}" y1="${(i*53)%120}" x2="${(i*37)%320-4}" y2="${(i*53)%120+10}" style="animation-delay:${(i%10)*-.12}s"/>`).join('');
 box.innerHTML=`<div class="wx"><svg viewBox="0 0 320 170" role="img" aria-label="Aquaplaning"><rect width="320" height="170" fill="#5b6b7d"/><g class="rain" stroke="#cfe3ff" stroke-width="1.6" opacity=".8">${drops}</g><rect y="122" width="320" height="48" fill="#2f3439"/><rect class="water" y="116" width="320" height="8" fill="#7fb4e6" opacity=".55"/><g class="wcar"><path d="M90 104 L112 86 H186 L214 104 H232 Q240 104 240 112 V120 H70 V110 Q70 104 78 104 Z" fill="#2563eb"/><path d="M118 90 H150 V104 H104 Z M156 90 H182 L202 104 H156 Z" fill="#9fb8d6"/><circle class="wh" cx="108" cy="120" r="12" fill="#151515"/><circle class="wh" cx="206" cy="120" r="12" fill="#151515"/><path class="wedge" d="M188 132 Q206 118 226 132 Z" fill="#7fb4e6" opacity="0"/></g><text class="wlab" x="160" y="24" text-anchor="middle" font-size="11.5" font-weight="800" fill="#fff" ${'font-family="Overpass,Arial"'}>Nat wegdek: remweg ongeveer 2× zo lang</text></svg>
 <div class="ctl seg"><button class="on" data-w="rain">Regen</button><button data-w="aqua">Aquaplaning</button><button data-w="ice">IJzel</button></div></div>`;
 const svg=$('svg',box);const set=()=>{svg.dataset.w=w;$('.wedge',svg).setAttribute('opacity',w==='aqua'?.9:0);$('.wcar',svg).setAttribute('transform',w==='aqua'?'translate(0 -4)':'');$('.water',svg).setAttribute('fill',w==='ice'?'#e6f3ff':'#7fb4e6');$('.rain',svg).style.display=w==='ice'?'none':'';
  $('.wlab',svg).textContent=w==='rain'?'Nat wegdek: remweg ongeveer 2× zo lang':w==='aqua'?'Aquaplaning: gas los, stuur recht, niet hard remmen':'IJzel: remweg ongeveer 2× zo lang of meer'};
 $$('.seg button',box).forEach(b=>b.onclick=()=>{w=b.dataset.w;$$('.seg button',box).forEach(x=>x.classList.toggle('on',x===b));set()});set()})();

/* ---------- exam ---------- */
(()=>{const box=$('#exam');let E=null,tm=null;
 const intro=()=>{const best=P.exams.length?Math.max(...P.exams.map(x=>x.s)):null;clearInterval(tm);
  box.innerHTML=`<div class="examintro card"><div class="ebig">${ico('examen')}</div><div><h3 style="margin-top:0">Klaar voor een proefexamen?</h3><p>50 vragen · 30 minuten · slagen bij 44 goed. Je ziet pas aan het eind wat goed en fout was, net als bij het CBR.</p><p lang="ar" dir="rtl" class="arinline">50 سؤال · 30 دقيقة · النجاح بـ 44 صح. النتيجة بالآخر متل الـ CBR.</p>${best!==null?`<p><b>Beste score:</b> ${best}/50 · ${P.exams.length}× gemaakt</p>`:''}<button class="btn" id="exStart">${ico('play')} Start proefexamen</button></div></div>${P.exams.length?`<h3>Je resultaten</h3><div class="chart">${P.exams.slice(-8).map((x,k)=>`<div class="crow"><span class="cl">#${P.exams.length-Math.min(8,P.exams.length)+k+1}</span><div class="cbar"><i class="${x.s>=44?'g':'r'}" style="--w:${x.s/50*100}%"></i><b class="mark" style="left:88%"></b></div><span class="cv">${x.s}/50</span></div>`).join('')}</div>`:''}`;
  $('#exStart').onclick=start};
 const start=()=>{const pool=[...ALLQ].sort(()=>Math.random()-.5).slice(0,Math.min(50,ALLQ.length));E={q:pool,i:0,ans:{},end:Date.now()+30*60*1000};render();clearInterval(tm);tm=setInterval(tickT,1000)};
 const tickT=()=>{if(!E)return;const s=Math.max(0,Math.round((E.end-Date.now())/1000));const el=$('#exT');if(el)el.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;if(s<=0)finish()};
 const render=()=>{const q=E.q[E.i];box.innerHTML=`<div class="exbar"><span class="kode">Vraag ${E.i+1} / ${E.q.length}</span><div class="exprog"><b style="width:${(Object.keys(E.ans).length/E.q.length)*100}%"></b></div><span class="extime">${ico('clock')} <b id="exT"></b></span></div>${qCard(q,'exam')}<div class="simnav"><button class="btn ghost sm" id="exP">${ico('left')} Vorige</button><button class="btn ghost sm" id="exStop">Stoppen</button><button class="btn sm" id="exN">${E.i<E.q.length-1?'Volgende '+ico('right'):'Inleveren '+ico('check')}</button></div>`;
  const c=$('.qcard',box);if(E.ans[q.id]!==undefined)$$('.opt',c)[E.ans[q.id]].classList.add('picked');fixAr(box);syncFav();tickT();
  c.addEventListener('click',e=>{const o=e.target.closest('.opt');if(!o)return;E.ans[q.id]=+o.dataset.i;$$('.opt',c).forEach(b=>b.classList.toggle('picked',b===o));$('.exprog b',box).style.width=(Object.keys(E.ans).length/E.q.length*100)+'%'});
  $('#exP').onclick=()=>{if(E.i>0){E.i--;render()}};$('#exN').onclick=()=>{if(E.i<E.q.length-1){E.i++;render()}else finish()};$('#exStop').onclick=()=>{E=null;intro()}};
 const finish=()=>{clearInterval(tm);if(!E)return;const s=E.q.filter(q=>E.ans[q.id]===q.a).length;P.exams.push({s,d:Date.now()});save();const pass=s>=44;
  box.innerHTML=`<div class="exres ${pass?'ok':'no'}"><svg class="ring" viewBox="0 0 120 120"><circle class="bgc" cx="60" cy="60" r="50"/><circle class="fg" cx="60" cy="60" r="50" transform="rotate(-90 60 60)" stroke-dasharray="314.16" stroke-dashoffset="314.16" id="exRing"/><text x="60" y="68" text-anchor="middle">${s}/50</text></svg><div><h3 style="margin-top:0">${pass?'Geslaagd!':'Nog niet geslaagd'}</h3><p>${pass?'Je had 44 of meer vragen goed.':'Je hebt 44 goed nodig. Bekijk hieronder je fouten en probeer het opnieuw.'}</p><p lang="ar" dir="rtl" class="arinline">${pass?'نجحت! جاوبت 44 أو أكتر صح.':'لسا ما نجحت. بدك 44 صح. شوف أخطاءك تحت وجرّب كمان مرة.'}</p><button class="btn" id="exAgain">${ico('refresh')} Opnieuw</button></div></div><h3>Nakijken</h3><div class="qlist">${E.q.map(q=>qCard(q,'review')).join('')}</div>`;
  $$('.qcard',box).forEach(c=>{const q=E.q.find(x=>x.id===c.dataset.qid);const a=E.ans[q.id];c.dataset.ctx='exam';answer(c,a===undefined?-1:a)});
  requestAnimationFrame(()=>{const r=$('#exRing');if(r)r.style.strokeDashoffset=314.16*(1-s/50)});if(pass)confetti($('.exres',box));$('#exAgain').onclick=start;E=null;fixAr(box);syncFav()};
 intro();window.__examIntro=intro})();

/* ---------- flashcards (all signs) ---------- */
const DECK=ALLS.map(s=>[s.k,s.n,s.u,s.a]);
(()=>{const deckEl=document.createElement('div');deckEl.className='deck rv';
 deckEl.innerHTML=`<div class="deck-top"><h3>${ico('flip')} Flitskaarten <span lang="ar" class="arcol arinline">· بطاقات تعليمية</span></h3><button class="btn ghost sm" id="fShuf">${ico('shuffle')} Schudden</button></div>
<div class="flash" id="flash" tabindex="0" aria-label="Flitskaart, tik om te draaien"><div class="in"><div class="face front" id="fFront"></div><div class="face back" id="fBack"></div></div></div>
<div class="deck-ctl"><button class="btn ghost sm" id="fPrev" aria-label="Vorige">${ico('left')}</button><button class="btn ghost sm" id="fFlip">${ico('flip')} Draaien</button><button class="btn sm" id="fKnow">${ico('check')} Ik ken hem</button><button class="btn ghost sm" id="fNext" aria-label="Volgende">${ico('right')}</button></div>
<div class="deck-meta"><span id="fCount"></span><i><b id="fBar"></b></i><span id="fKnown"></span></div>`;
 $('#v-borden .scroll').after(deckEl);let fi=0,order=DECK.map((_,i)=>i);
 const renderCard=()=>{const [k,n,u,a]=DECK[order[fi]];$('#flash').classList.remove('flip');
  $('#fFront').innerHTML=`${sign(k,n)}<div class="hint">Wat betekent dit bord? Tik om te draaien</div><div class="hint" lang="ar" dir="rtl">شو معنى هالشارة؟ اضغط لتقلب البطاقة</div>`;
  $('#fBack').innerHTML=`<div class="fbhead"><h4>${n}</h4>${P.known[k]?'<span class="known-tag">'+ico('check')+' gekend</span>':''}</div><p>${u}</p><div class="ar">${a}</div>`;
  const kc=DECK.filter(d=>P.known[d[0]]).length;$('#fCount').textContent=`${fi+1} / ${DECK.length}`;$('#fKnown').textContent=`${kc} gekend`;$('#fBar').style.width=(kc/DECK.length*100)+'%';
  $('#fKnow').classList.toggle('isdone',!!P.known[k]);$('#fKnow').innerHTML=ico('check')+(P.known[k]?' Gekend':' Ik ken hem');fixAr(deckEl)};
 const flip=()=>$('#flash').classList.toggle('flip');const step=d=>{fi=(fi+d+DECK.length)%DECK.length;renderCard()};
 $('#flash').addEventListener('click',flip);$('#flash').addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();flip()}if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)});
 // swipe
 let sx=null;$('#flash').addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});$('#flash').addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50){step(dx<0?1:-1)}sx=null});
 $('#fFlip').onclick=flip;$('#fPrev').onclick=()=>step(-1);$('#fNext').onclick=()=>step(1);
 $('#fShuf').onclick=()=>{order.sort(()=>Math.random()-.5);fi=0;renderCard()};
 $('#fKnow').onclick=()=>{const k=DECK[order[fi]][0];if(P.known[k])delete P.known[k];else{P.known[k]=1;toast(true,'Goed zo! Bord gemarkeerd als gekend.','أحسنت! انحفظت الشارة.')}save();renderCard();if(P.known[k])setTimeout(()=>step(1),650)};
 renderCard()})();

/* ---------- search ---------- */
const IDX=[];
function buildIndex(){IDX.length=0;F.forEach(([h,t,a])=>IDX.push({type:'Les',t,sub:a,h}));
 $$('.view').forEach(v=>{const h=v.id.slice(2);if(!views.includes(h)||h==='start')return;$$('h3',v).forEach((h3,k)=>{if(!h3.id)h3.id=h+'-'+k;const txt=h3.textContent.trim();if(txt)IDX.push({type:'Onderwerp',t:txt,sub:fTitle(h),h,anchor:h3.id})})});
 ALLS.forEach(s=>IDX.push({type:'Bord',t:s.n,sub:s.code+' · '+s.u,sign:s.k}));
 WORDS.forEach(([n,a,u])=>IDX.push({type:'Woord',t:n,sub:a+' · '+u,h:'woorden'}));
 ALLQ.forEach(q=>IDX.push({type:'Vraag',t:q.q,sub:QT[q.t],h:q.t,qid:q.id}))}
let sType='';
function openSearch(){openModal(`<div class="search"><label class="sbox big">${ico('search')}<input id="gq" type="search" placeholder="Zoek in alles… / دوّر بكل شي" autocomplete="off" autofocus aria-label="Zoeken"></label><div class="chips" id="gchips">${['','Les','Onderwerp','Bord','Woord','Vraag'].map(t=>`<button class="chip ${t===sType?'on':''}" data-t="${t}">${t||'Alles'}</button>`).join('')}</div><div class="results" id="gres" role="listbox"></div></div>`,'top');
 const run=()=>{const q=$('#gq').value.trim().toLowerCase();if(!IDX.length)buildIndex();const res=IDX.filter(r=>(!sType||r.type===sType)&&(!q||(r.t+' '+r.sub).toLowerCase().includes(q))).slice(0,40);
  $('#gres').innerHTML=res.length?res.map((r,i)=>`<button class="res" data-i="${IDX.indexOf(r)}">${r.sign?`<span class="ri">${sign(r.sign)}</span>`:`<span class="ri t">${ico(r.type==='Bord'?'borden':r.type==='Woord'?'woorden':r.type==='Vraag'?'examen':r.h&&IC[r.h]?r.h:'info')}</span>`}<span><b>${esc(r.t)}</b><small>${r.type} · ${esc(r.sub).slice(0,90)}</small></span></button>`).join(''):`<p class="note">Niets gevonden. · ما في نتائج.</p>`};
 $('#gq').addEventListener('input',run);$('#gchips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;sType=b.dataset.t;$$('#gchips .chip').forEach(c=>c.classList.toggle('on',c===b));run()});
 $('#gres').addEventListener('click',e=>{const b=e.target.closest('.res');if(!b)return;const r=IDX[+b.dataset.i];closeModal();
  if(r.sign){signModal(r.sign);return}location.hash=r.h;setTimeout(()=>{const t=r.anchor?document.getElementById(r.anchor):r.qid?$(`.qcard[data-qid="${r.qid}"]`):null;if(t){t.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});t.classList.add('flashhl');setTimeout(()=>t.classList.remove('flashhl'),1800)}
   if(r.type==='Woord'){$('#wq').value=r.t;$('#wq').dispatchEvent(new Event('input'))}},120)});run()}
$('#searchBtn').onclick=openSearch;
addEventListener('keydown',e=>{if((e.key==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!e.target.matches('input,textarea'))){e.preventDefault();openSearch()}});

/* ---------- nav + folders + progress ---------- */
const grp={L:'Leren · تعلّم',O:'Oefenen · تدرّب',X:'Overig · غير'};
$('#nav').innerHTML=`<a href="#start" data-f="start"><span class="ic">${ico('start')}</span><div>Start<small lang="ar">الصفحة الرئيسية</small></div></a>`+['L','O','X'].map(g=>`<h5>${grp[g]}</h5>`+F.filter(f=>f[3]===g).map(([h,t,a])=>`<a href="#${h}" data-f="${h}"><span class="ic">${ico(h)}</span><div>${t}<small lang="ar">${a}</small></div>${g==='L'?`<span class="ck">${ico('check')}</span>`:''}</a>`).join('')).join('');
$('#folders').innerHTML=F.filter(f=>f[0]!=='bronnen').map(([h,t,a,g])=>`<a class="folder rv ${g!=='L'?'alt':''}" href="#${h}" data-f="${h}"><span class="ic">${ico(h)}</span><div><span>${t}</span><small lang="ar" dir="rtl">${a}</small><em class="fmeta" data-m="${h}"></em></div><span class="go">${ico('arrow')}</span></a>`).join('');
const hero=$('#v-start .hero > div');
hero.insertAdjacentHTML('beforeend',`<div class="cta"><a class="btn" id="ctaGo" href="#borden">${ico('play')} Verder leren</a><a class="btn ghost" href="#simulator">${ico('simulator')} Simulator</a><a class="btn ghost" href="#examen">${ico('examen')} Proefexamen</a></div>`);
$('#folders').insertAdjacentHTML('beforebegin',`<div class="stats rv"><svg class="ring" viewBox="0 0 120 120"><circle class="bgc" cx="60" cy="60" r="50"/><circle class="fg" id="bigRing" cx="60" cy="60" r="50" transform="rotate(-90 60 60)" stroke-dasharray="314.16" stroke-dashoffset="314.16"/><text x="60" y="68" text-anchor="middle" id="bigPct">0%</text></svg><div class="bars"><div class="bar"><span>Lessen gelezen</span><span id="bL"></span><i><b id="bLb"></b></i></div><div class="bar"><span>Oefenvragen goed</span><span id="bQ"></span><i><b id="bQb"></b></i></div><div class="bar"><span>Situaties opgelost</span><span id="bS"></span><i><b id="bSb"></b></i></div><div class="bar"><span>Borden gekend</span><span id="bK"></span><i><b id="bKb"></b></i></div></div></div><h3>Voortgang per onderwerp</h3><div class="chart" id="topicChart"></div><h3>Alle mappen</h3>`);
const QS=Object.keys(DG).filter(k=>DG[k].quiz);
function renderProgress(){const r=LESSONS.filter(h=>P.read[h]).length;const tq=ALLQ.length,qok=ALLQ.filter(q=>(P.quiz[q.t]||{})[q.id]).length;
 const s=QS.filter(k=>P.solved[k]).length+SCEN.filter(x=>P.sim[x.id]===true).length,sT=QS.length+SCEN.length;const k=DECK.filter(d=>P.known[d[0]]).length;
 const pct=Math.round(((r/LESSONS.length)+(qok/tq)+(s/sT)+(k/DECK.length))/4*100);
 const set=(id,a,b)=>{$('#'+id).textContent=`${a}/${b}`;$('#'+id+'b').style.width=(a/b*100)+'%'};set('bL',r,LESSONS.length);set('bQ',qok,tq);set('bS',s,sT);set('bK',k,DECK.length);
 $('#bigRing').style.strokeDashoffset=314.16*(1-pct/100);$('#bigPct').textContent=pct+'%';$('#miniRing').style.strokeDashoffset=88*(1-pct/100);$('#miniPct').textContent=pct+'%';
 $$('.nav a[data-f]').forEach(a=>a.classList.toggle('done',!!P.read[a.dataset.f]));$$('.folder').forEach(a=>a.classList.toggle('done',!!P.read[a.dataset.f]));
 $('#topicChart').innerHTML=LESSONS.map(h=>{const n=(QUESTIONS[h]||[]).length,ok=Object.values(P.quiz[h]||{}).filter(Boolean).length;const v=Math.round(((P.read[h]?1:0)+(n?ok/n:0))/(n?2:1)*100);return `<a class="crow" href="#${h}"><span class="cl">${fTitle(h)}</span><div class="cbar"><i class="b" style="--w:${v}%"></i></div><span class="cv">${v}%</span></a>`}).join('');
 $$('.fmeta').forEach(m=>{const h=m.dataset.m,n=(QUESTIONS[h]||[]).length,ok=Object.values(P.quiz[h]||{}).filter(Boolean).length;m.textContent=n?`${ok}/${n} vragen goed`:h==='simulator'?`${SCEN.filter(x=>P.sim[x.id]===true).length}/${SCEN.length} goed`:h==='examen'&&P.exams.length?`beste ${Math.max(...P.exams.map(x=>x.s))}/50`:''});
 const nx=LESSONS.find(h=>!P.read[h]);const cg=$('#ctaGo');cg.href='#'+(nx||'borden');cg.lastChild.textContent=nx?' Verder: '+fTitle(nx):' Alles herhalen'}

const nav=$('#nextnav');let autoT=null;
function endbar(h){const i=F.findIndex(f=>f[0]===h);if(i<0){nav.innerHTML='';return}const pv=i>0?F[i-1]:['start','Start'],nx=F[i+1];const les=LESSONS.includes(h);
 nav.innerHTML=`<a href="#${pv[0]}"><small>← Vorige</small><b>${pv[1]}</b></a>${les?`<button class="btn done ${P.read[h]?'isdone':''}" id="doneBtn">${ico('check')} ${P.read[h]?'Gelezen':'Markeer als gelezen'}</button>`:'<span></span>'}${nx?`<a class="nx" href="#${nx[0]}"><small>Volgende →</small><b>${nx[1]}</b></a>`:'<span></span>'}`;
 if(les)$('#doneBtn').onclick=e=>{if(P.read[h])delete P.read[h];else{P.read[h]=1;confetti(e.currentTarget);toast(true,'Les afgerond. Ga zo door!','خلصت الدرس. كمّل هيك!')}save();endbar(h)}}
// auto-progress: lesson read when the end of the page stays in view
const endIO=new IntersectionObserver(es=>es.forEach(e=>{clearTimeout(autoT);const h=location.hash.slice(1);if(e.isIntersecting&&LESSONS.includes(h)&&!P.read[h]){autoT=setTimeout(()=>{if(location.hash.slice(1)!==h)return;P.read[h]=1;save();endbar(h);toast(true,'Les automatisch als gelezen gemarkeerd.','انعلّم الدرس كمقروء تلقائياً.')},2200)}}),{threshold:.9});endIO.observe(nav);

/* header favourite for lessons */
$$('.view').forEach(v=>{const h=v.id.slice(2);if(!LESSONS.includes(h))return;const h2=$('h2',v);if(h2)h2.insertAdjacentHTML('beforeend',` <button class="favb inh" data-fav="l:${h}" aria-label="Les als favoriet">${ico('star')}</button>`)});

/* ---------- reveal + routing ---------- */
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -6% 0px'}):null;
const tagRv=()=>{$$('.view .card,.view .diag,.view .tip,.view .scroll,.view h3,.view .stats,.view .exam,.view .example,.view details.more,.view .qcard').forEach(e=>{if(!e.closest('.sign,.face,.diag .ar,.modal')&&!e.classList.contains('rv'))e.classList.add('rv')});$$('.rv:not(.in)').forEach(e=>io?io.observe(e):e.classList.add('in'))};
function show(){let h=location.hash.slice(1);if(!views.includes(h)){const el=h&&document.getElementById(h);h='start'}
 const go=()=>{$$('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+h));$$('.nav a').forEach(a=>a.classList.toggle('cur',a.dataset.f===h));endbar(h);document.body.classList.remove('menu');window.scrollTo(0,0);if(h==='favorieten')renderFavs();if(h==='examen'&&!document.querySelector('#exam .exbar'))window.__examIntro();if(io)$$('#v-'+h+' .rv:not(.in)').forEach(e=>{io.unobserve(e);io.observe(e)});document.title=(h==='start'?'Theorie Auto B – Uitleg':fTitle(h)+' · Theorie B')};
 if(document.startViewTransition&&!RM&&show.ready)document.startViewTransition(go);else go();show.ready=1}
addEventListener('hashchange',show);
$('#menuBtn').onclick=()=>document.body.classList.toggle('menu');$('#scrim').onclick=()=>document.body.classList.remove('menu');

/* ---------- Arabic toggle ---------- */
const setAr=v=>{P.ar=v;document.body.classList.toggle('no-ar',!v);$('#arBtn').classList.toggle('on',v);$('#arBtn').setAttribute('aria-pressed',v)};
setAr(P.ar!==false);$('#arBtn').onclick=()=>{setAr(!P.ar);save()};

/* ---------- 3D tilt + ripple + spotlight ---------- */
document.addEventListener('pointermove',e=>{if(RM)return;const t=e.target.closest('.sign .tilt,.stile .tilt,.sbig .tilt');if(t){const r=t.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;t.firstElementChild.style.transform=`rotateY(${x*38}deg) rotateX(${-y*38}deg) scale(1.08)`}
 const c=e.target.closest('.folder,.card,.qcard,.stile');if(c){const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}});
document.addEventListener('pointerout',e=>{const t=e.target.closest('.tilt');if(t&&!t.contains(e.relatedTarget)&&t.firstElementChild)t.firstElementChild.style.transform=''});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn,.opt,.chip');if(!b||RM)return;const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),sp=document.createElement('span');sp.className='rip';sp.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;b.appendChild(sp);setTimeout(()=>sp.remove(),650)});

fixAr();tagRv();renderProgress();renderFavs();syncFav();show();
})();
