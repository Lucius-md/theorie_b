/* ---------- icons (consistent 24px line set) ---------- */
const IC={
 start:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 borden:'<path d="M12 3l9.5 16.5h-19z"/><path d="M12 10v4"/><path d="M12 17.2v.1"/>',
 voorrang:'<path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/><path d="M12 6v12" stroke-dasharray="2 3"/>',
 snelheid:'<path d="M3.5 16a8.5 8.5 0 1 1 17 0"/><path d="M12 16l4.5-5"/><circle cx="12" cy="16" r="1.3"/><path d="M6.5 11.5l1 .8M12 7.5v1.3M17.5 11.5l-1 .8"/>',
 snelweg:'<path d="M9 3L5 21M15 3l4 18"/><path d="M12 4v3M12 11v3M12 18v3"/>',
 inhalen:'<path d="M7 21V9"/><path d="M4 12l3-3 3 3"/><path d="M17 21V4"/><path d="M14 7l3-3 3 3"/>',
 parkeren:'<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M10 17V7h3.2a3 3 0 0 1 0 6H10"/>',
 verlichting:'<path d="M10 6h1.5a6 6 0 0 1 0 12H10z"/><path d="M2.5 8.5H7M2.5 12H7M2.5 15.5H7"/>',
 wetten:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 rijhulp:'<path d="M5 17h14l-1.6-5.3A2 2 0 0 0 15.5 10h-7a2 2 0 0 0-1.9 1.7z"/><path d="M5 17v2M19 17v2"/><path d="M4 7.5a11 11 0 0 1 16 0M7 9.5a7 7 0 0 1 10 0"/>',
 gevaar:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 woorden:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
 bronnen:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
 check:'<path d="M5 12l5 5 9-10"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',
 play:'<path d="M7 4.5v15l12-7.5z"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
 left:'<path d="M15 5l-7 7 7 7"/>',right:'<path d="M9 5l7 7-7 7"/>',flip:'<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
 shuffle:'<path d="M3 7h3.5c3 0 4.5 10 8 10H21M3 17h3.5c1.5 0 2.5-2 3.4-4M14.1 11c.9-2 1.9-4 3.4-4H21"/><path d="M18 4l3 3-3 3M18 14l3 3-3 3"/>',
 arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'
};
const ico=(k,c='')=>`<svg class="ico ${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;

/* ---------- realistic traffic signs ---------- */
const R='#d0122c',B='#1f4fa8',Y='#f9b800',K='#151515';
const SH={c:'<circle cx="50" cy="50" r="47.5"/>',t:'<path d="M50 3 L98 92 H2 Z"/>',d:'<path d="M2 8 H98 L50 97 Z"/>',r:'<path d="M50 2 L98 50 L50 98 L2 50 Z"/>',o:'<path d="M93.5 68 L68 93.5 H32 L6.5 68 V32 L32 6.5 H68 L93.5 32 Z"/>',s:'<rect x="3" y="3" width="94" height="94" rx="10"/>',z:'<rect x="6" y="2" width="88" height="96" rx="8"/>'};
const T=(t,s,y,f=K)=>`<text x="50" y="${y}" font-family="Overpass,Arial,sans-serif" font-weight="800" font-size="${s}" text-anchor="middle" fill="${f}">${t}</text>`;
const ringS=i=>`<circle cx="50" cy="50" r="47.5" fill="${R}"/><circle cx="50" cy="50" r="35" fill="#fff"/>${i||''}<circle cx="50" cy="50" r="47" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`;
const warnS=i=>`<path d="M50 12 L89 82.5 H11 Z" fill="#fff" stroke="${R}" stroke-width="14" stroke-linejoin="round"/><path d="M50 4.5 L96 88.5 H4 Z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" opacity=".85"/>${i||''}`;
const boxS=i=>`<rect x="3" y="3" width="94" height="94" rx="10" fill="${B}"/><rect x="8.5" y="8.5" width="83" height="83" rx="6.5" fill="none" stroke="#fff" stroke-width="3"/>${i||''}`;
const led=(d,c)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="6.5" stroke-linecap="round" stroke-dasharray="0 7.6" style="filter:drop-shadow(0 0 2px ${c})"/>`;
const panel=i=>`<rect x="3" y="3" width="94" height="94" rx="9" fill="#0d0f12"/><rect x="7" y="7" width="86" height="86" rx="6" fill="none" stroke="#24282e" stroke-width="2"/>${i}`;
const SG={
 C1:['c',ringS()],
 C2:['c',`<circle cx="50" cy="50" r="47.5" fill="${R}"/><rect x="17" y="41" width="66" height="18" rx="1.5" fill="#fff"/><circle cx="50" cy="50" r="47" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`],
 A50:['c',ringS(T('50',37,63))],A30:['c',ringS(T('30',37,63))],
 E1:['c',`<circle cx="50" cy="50" r="47.5" fill="${R}"/><circle cx="50" cy="50" r="36" fill="${B}"/><path d="M25.5 25.5 L74.5 74.5" stroke="${R}" stroke-width="10"/><circle cx="50" cy="50" r="47" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`],
 E2:['c',`<circle cx="50" cy="50" r="47.5" fill="${R}"/><circle cx="50" cy="50" r="36" fill="${B}"/><path d="M25.5 25.5 L74.5 74.5 M74.5 25.5 L25.5 74.5" stroke="${R}" stroke-width="10"/><circle cx="50" cy="50" r="47" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`],
 Dup:['c',`<circle cx="50" cy="50" r="47.5" fill="${B}"/><circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M50 17 L71 42 H57.5 V81 H42.5 V42 H29 Z" fill="#fff"/>`],
 Drot:['c',`<circle cx="50" cy="50" r="47.5" fill="${B}"/><circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" stroke-width="2.4"/><g fill="none" stroke="#fff" stroke-width="8"><path d="M50 23 A27 27 0 0 1 73 62"/><path d="M67 70 A27 27 0 0 1 26 62"/><path d="M24 48 A27 27 0 0 1 40 25"/></g><g fill="#fff"><path d="M62 58 L84 58 L76 77 Z"/><path d="M32 71 L17 55 L12 74 Z"/><path d="M35 12 L52 24 L35 33 Z"/></g>`],
 Fiets:['c',`<circle cx="50" cy="50" r="47.5" fill="${B}"/><circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" stroke-width="2.4"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="30" cy="61" r="12"/><circle cx="70" cy="61" r="12"/><path d="M30 61 L43 41 H61 L70 61 M43 41 L52 61 L61 41 M38 34 H48"/></g>`],
 B1:['r',`<path d="M50 2 L98 50 L50 98 L2 50 Z" fill="#fff"/><path d="M50 4.5 L95.5 50 L50 95.5 L4.5 50 Z" fill="none" stroke="#222" stroke-width="1.6"/><path d="M50 18 L82 50 L50 82 L18 50 Z" fill="${Y}"/>`],
 B2:['r',`<path d="M50 2 L98 50 L50 98 L2 50 Z" fill="#fff"/><path d="M50 4.5 L95.5 50 L50 95.5 L4.5 50 Z" fill="none" stroke="#222" stroke-width="1.6"/><path d="M50 18 L82 50 L50 82 L18 50 Z" fill="${Y}"/><path d="M30 70 L70 30 M23 59 L59 23 M41 77 L77 41" stroke="${K}" stroke-width="5.5"/>`],
 B3:['t',warnS(`<path d="M50 38 V77" stroke="${K}" stroke-width="10"/><path d="M33 60 H67" stroke="${K}" stroke-width="4.5"/>`)],
 J8:['t',warnS(`<path d="M50 38 V77 M33 59 H67" stroke="${K}" stroke-width="5.5"/>`)],
 Jx:['t',warnS(`<rect x="45.5" y="38" width="9" height="25" rx="2" fill="${K}"/><circle cx="50" cy="71" r="5" fill="${K}"/>`)],
 B6:['d',`<path d="M12 15 H88 L50 85 Z" fill="#fff" stroke="${R}" stroke-width="14" stroke-linejoin="round"/>`],
 B7:['o',`<path d="M93.5 68 L68 93.5 H32 L6.5 68 V32 L32 6.5 H68 L93.5 32 Z" fill="${R}"/><path d="M89.5 66.3 L66.3 89.5 H33.7 L10.5 66.3 V33.7 L33.7 10.5 H66.3 L89.5 33.7 Z" fill="none" stroke="#fff" stroke-width="3"/>${T('STOP',27,60,'#fff')}`],
 G1:['s',boxS(`<rect x="13" y="22" width="74" height="11" rx="2" fill="#fff"/><path d="M23 87 L41 38 M77 87 L59 38" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/><path d="M50 42 V51 M50 60 V73" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`)],
 G3:['s',boxS(`<path d="M20 62 H80 V73 H20 Z M29 62 L37 45 H63 L71 62 Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><circle cx="33" cy="75" r="6.5" fill="#fff"/><circle cx="67" cy="75" r="6.5" fill="#fff"/>`)],
 G5:['s',boxS(`<path d="M17 57 L38 38 L59 57 V80 H17 Z" fill="#fff"/><circle cx="74" cy="47" r="5.5" fill="#fff"/><path d="M74 54 V68 M66 60 H82 M74 68 L67 81 M74 68 L81 81" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`)],
 L2:['s',boxS(`<path d="M50 14 L86 81 H14 Z" fill="#fff"/><circle cx="52" cy="40" r="5" fill="${K}"/><path d="M52 46 L48 62 L42 74 M48 62 L56 74 M50 52 L58 58 M50 52 L42 57" stroke="${K}" stroke-width="3.8" fill="none" stroke-linecap="round"/><path d="M23 78.5 h8 M37 78.5 h8 M51 78.5 h8 M65 78.5 h8" stroke="${K}" stroke-width="3.4"/>`)],
 E4:['s',boxS(T('P',66,76,'#fff'))],
 Z30:['z',`<rect x="6" y="2" width="88" height="96" rx="8" fill="#fff"/><rect x="9" y="5" width="82" height="90" rx="6" fill="none" stroke="${K}" stroke-width="2"/><circle cx="50" cy="40" r="28" fill="${R}"/><circle cx="50" cy="40" r="20" fill="#fff"/>${T('30',25,49)}${T('ZONE',19,87)}`],
 Mx:['s',panel(led('M27 27 L73 73 M73 27 L27 73','#ff3040'))],
 Mv:['s',panel(`<circle cx="50" cy="50" r="34" fill="none" stroke="#ff3040" stroke-width="5.5" stroke-dasharray="0 7.1" stroke-linecap="round" style="filter:drop-shadow(0 0 2px #ff3040)"/>${T('80',30,61,'#fff')}`)],
 Mp:['s',panel(led('M30 30 L66 66 M66 38 V66 H38','#f4f4f4'))],
 Mg:['s',panel(led('M50 22 V74 M31 55 L50 75 L69 55','#33e07a'))],
 TL:['s',`<rect x="27" y="2" width="46" height="96" rx="12" fill="#1c1f24"/><rect x="31" y="6" width="38" height="88" rx="9" fill="none" stroke="#33383f" stroke-width="2"/><circle cx="50" cy="22" r="11" fill="#ff3040"/><circle cx="50" cy="50" r="11" fill="#5a3b10"/><circle cx="50" cy="78" r="11" fill="#123a22"/><circle cx="50" cy="22" r="16" fill="#ff3040" opacity=".18"/>`]
};
let sid=0;
const sign=(k,label)=>{const [sh,body]=SG[k];const id='sc'+(sid++);return `<span class="tilt"><svg class="sg" viewBox="-2 -2 104 104" role="img" aria-label="${label||k}"><defs><clipPath id="${id}">${SH[sh]}</clipPath></defs>${body}<g clip-path="url(#${id})" style="pointer-events:none"><rect x="-2" y="-2" width="104" height="104" fill="url(#shine)"/></g></svg></span>`};


/* ---------- extra icons ---------- */
Object.assign(IC,{
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 star:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
 simulator:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M3.5 10.5h6M14.5 10.5h6M12 14.5V21"/>',
 voetfiets:'<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9l3 7M9 6h3"/>',
 weer:'<path d="M7 15a4.5 4.5 0 0 1 .5-9 6 6 0 0 1 11 2.5A3.5 3.5 0 0 1 18 15z"/><path d="M8 18.5l-1 2M12 18.5l-1 2M16 18.5l-1 2"/>',
 nacht:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
 ongeval:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
 fouten:'<path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7z"/><path d="M12 8v5M12 16.2v.1"/>',
 examen:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M8.5 12.5l2.2 2.2 4.8-4.8"/>',
 favorieten:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
 cube:'<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M4 7.4l8 4.6 8-4.6M12 12v9.2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 down:'<path d="M6 9l6 6 6-6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',
 refresh:'<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 21v-5h-5"/>'
});

/* ---------- extra signs (vereenvoudigde, nette tekeningen) ---------- */
SH.w='<rect x="1" y="20" width="98" height="60" rx="7"/>';
const stripeR='<path d="M14 74 L86 26" stroke="'+R+'" stroke-width="7" stroke-linecap="round"/>';
const person=(x,y,c=K,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-15" r="4.6" fill="${c}"/><path d="M0 -9 L-2 4 L-7 16 M-2 4 L4 16 M-1 -6 L7 1 M-1 -6 L-7 0" stroke="${c}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const plate=(txt)=>`<rect x="1" y="20" width="98" height="60" rx="7" fill="${B}"/><rect x="6" y="25" width="88" height="50" rx="4" fill="none" stroke="#fff" stroke-width="2.6"/>${T(txt,20,57,'#fff')}`;
const miniCar=(x,y,c)=>`<g transform="translate(${x} ${y})"><path d="M-14 4 H14 V11 H-14 Z M-9 4 L-5 -4 H5 L9 4 Z" fill="${c}"/><circle cx="-8" cy="12" r="3.4" fill="${c}"/><circle cx="8" cy="12" r="3.4" fill="${c}"/></g>`;
Object.assign(SG,{
 H1:['w',plate('Utrecht')],
 H2:['w',plate('Utrecht')+stripeR],
 A2:['c',`<circle cx="50" cy="50" r="46" fill="#fff" stroke="#2a2a2a" stroke-width="2.5"/>${T('50',34,62,'#9a9a9a')}<path d="M24 76 L76 24 M18 66 L66 18 M34 82 L82 34" stroke="#2a2a2a" stroke-width="3"/>`],
 A4:['s',boxS(T('70',40,64,'#fff'))],
 B4:['t',warnS(`<path d="M52 38 V77" stroke="${K}" stroke-width="10"/><path d="M52 58 H33" stroke="${K}" stroke-width="4.5"/>`)],
 J9:['t',warnS(`<g fill="none" stroke="${K}" stroke-width="4.5"><path d="M50 47 A12 12 0 0 1 61 63"/><path d="M57 70 A12 12 0 0 1 39 64"/><path d="M38 56 A12 12 0 0 1 46 47"/></g><g fill="${K}"><path d="M56 61 L66 61 L62 69 Z"/><path d="M42 69 L34 62 L33 71 Z"/><path d="M44 42 L52 47 L44 52 Z"/></g>`)],
 C3:['s',boxS(`<path d="M50 16 L70 40 H57 V84 H43 V40 H30 Z" fill="#fff"/>`)],
 D2:['c',`<circle cx="50" cy="50" r="47.5" fill="${B}"/><circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M50 17 L71 42 H57.5 V81 H42.5 V42 H29 Z" fill="#fff" transform="rotate(135 50 50)"/>`],
 D7:['c',`<circle cx="50" cy="50" r="47.5" fill="${B}"/><circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M42 84 V36 M42 58 H66" stroke="#fff" stroke-width="10" fill="none"/><path d="M42 18 L56 38 H28 Z M82 58 L64 44 V72 Z" fill="#fff"/>`],
 L8:['s',boxS(`<rect x="42" y="38" width="16" height="46" fill="#fff"/><rect x="24" y="22" width="52" height="16" fill="${R}"/>`)],
 J1:['t',warnS(`<path d="M27 72 Q35 56 43 72 Q50 56 57 72 Q65 56 73 72" stroke="${K}" stroke-width="5" fill="none"/>`)],
 J2:['t',warnS(`<path d="M42 78 V62 Q42 48 60 46" stroke="${K}" stroke-width="7" fill="none" stroke-linecap="round"/>`)],
 J10:['t',warnS(`<path d="M30 54 H70 M30 64 H70" stroke="${K}" stroke-width="5"/><path d="M33 48 V74 M50 48 V74 M67 48 V74" stroke="${K}" stroke-width="4"/>`)],
 J11:['t',warnS(`<path d="M30 70 V54 H50 V46 H58 V54 H66 Q72 54 72 62 V70 Z" fill="${K}"/><rect x="36" y="44" width="6" height="10" fill="${K}"/><circle cx="38" cy="72" r="4.5" fill="${K}"/><circle cx="62" cy="72" r="4.5" fill="${K}"/>`)],
 J16:['t',warnS(`${person(46,62,K,.9)}<path d="M53 56 L66 72" stroke="${K}" stroke-width="3.6"/><path d="M60 74 L74 74 L68 66 Z" fill="${K}"/>`)],
 J20:['t',warnS(`${miniCar(50,48,K)}<path d="M36 72 q6 -6 0 -12 M64 72 q-6 -6 0 -12" stroke="${K}" stroke-width="3.5" fill="none"/>`)],
 J21:['t',warnS(`${person(42,62,K,.95)}${person(60,64,K,.8)}`)],
 J22:['t',warnS(`${person(50,58,K,.95)}<path d="M32 76 h7 M44 76 h7 M56 76 h7" stroke="${K}" stroke-width="3"/>`)],
 J32:['t',warnS(`<rect x="42" y="39" width="16" height="40" rx="4" fill="${K}"/><circle cx="50" cy="47" r="4.4" fill="${R}"/><circle cx="50" cy="59" r="4.4" fill="#f5a400"/><circle cx="50" cy="71" r="4.4" fill="#18a058"/>`)],
 J36:['t',warnS(`<g stroke="${K}" stroke-width="3.6" stroke-linecap="round"><path d="M50 44 V78 M35 52 L65 70 M65 52 L35 70"/><path d="M45 46 L50 50 L55 46 M45 76 L50 72 L55 76"/></g>`)],
 J38:['t',warnS(`<path d="M24 74 H36 Q50 52 64 74 H76" stroke="${K}" stroke-width="5" fill="none"/>`)],
 G2:['s',boxS(`<rect x="13" y="22" width="74" height="11" rx="2" fill="#fff"/><path d="M23 87 L41 38 M77 87 L59 38" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/>`)+`<path d="M14 88 L86 14" stroke="${R}" stroke-width="7" stroke-linecap="round"/>`],
 G7:['c',`<circle cx="50" cy="50" r="47.5" fill="${B}"/><circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" stroke-width="2.4"/>${person(50,56,'#fff',1.5)}`],
 G12:['c',`<circle cx="50" cy="50" r="47.5" fill="${B}"/><circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" stroke-width="2.4"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="30" cy="61" r="12"/><circle cx="70" cy="61" r="12"/><path d="M30 61 L43 41 H61 L70 61 M43 41 L52 61 L61 41"/></g><path d="M18 82 L82 18" stroke="${R}" stroke-width="7" stroke-linecap="round"/>`],
 C12:['c',ringS(`${miniCar(50,40,K)}<g transform="translate(50 66)"><circle cx="-10" cy="4" r="4.5" fill="none" stroke="${K}" stroke-width="2.6"/><circle cx="10" cy="4" r="4.5" fill="none" stroke="${K}" stroke-width="2.6"/><path d="M-10 4 L-2 -4 H6 L10 4" stroke="${K}" stroke-width="2.6" fill="none"/></g>`)],
 C10:['c',ringS(`<g transform="translate(-2 2)">${miniCar(38,46,K)}<rect x="56" y="44" width="18" height="12" rx="2" fill="${K}"/><path d="M52 52 H56" stroke="${K}" stroke-width="2"/><circle cx="65" cy="58" r="3.4" fill="${K}"/></g>`)],
 C14:['c',ringS(`<g fill="none" stroke="${K}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(50 52) scale(.62) translate(-50 -61)"><circle cx="30" cy="61" r="12"/><circle cx="70" cy="61" r="12"/><path d="M30 61 L43 41 H61 L70 61 M43 41 L52 61 L61 41"/></g>`)],
 C16:['c',ringS(person(50,56,K,1.2))],
 C19:['c',ringS(`${T('3.5m',17,57)}<path d="M50 22 L44 30 H56 Z M50 78 L44 70 H56 Z" fill="${K}"/>`)],
 F1:['c',ringS(`<g transform="translate(36 52)"><rect x="-9" y="-13" width="18" height="24" rx="5" fill="${R}"/><rect x="-6" y="-9" width="12" height="6" rx="1.5" fill="#fff"/></g><g transform="translate(64 52)"><rect x="-9" y="-13" width="18" height="24" rx="5" fill="${K}"/><rect x="-6" y="-9" width="12" height="6" rx="1.5" fill="#fff"/></g>`)],
 F7:['c',ringS(`<path d="M60 74 V44 A10 10 0 0 0 40 44 V60" stroke="${K}" stroke-width="5.5" fill="none"/><path d="M32 56 L40 68 L48 56 Z" fill="${K}"/><path d="M24 76 L76 24" stroke="${R}" stroke-width="6"/>`)],
 E6:['s',boxS(`<circle cx="44" cy="26" r="5.5" fill="#fff"/><path d="M44 33 V54 H62 L68 72" stroke="#fff" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 50 A16 16 0 1 0 60 66" stroke="#fff" stroke-width="5" fill="none"/>`)],
 E10:['z',`<rect x="6" y="2" width="88" height="96" rx="8" fill="#fff"/><rect x="9" y="5" width="82" height="90" rx="6" fill="none" stroke="${K}" stroke-width="2"/><rect x="20" y="14" width="34" height="40" rx="4" fill="${B}"/>${`<text x="37" y="47" font-family="Overpass,Arial,sans-serif" font-weight="800" font-size="32" text-anchor="middle" fill="#fff">P</text>`}<circle cx="70" cy="34" r="13" fill="${B}"/><circle cx="70" cy="34" r="8" fill="#fff"/><path d="M70 34 V28 M70 34 H75" stroke="${K}" stroke-width="2"/>${T('ZONE',19,84)}`],
 L3:['s',boxS(`<rect x="24" y="28" width="52" height="40" rx="6" fill="#fff"/><rect x="29" y="33" width="42" height="15" rx="2" fill="${B}"/><circle cx="34" cy="72" r="5" fill="#fff"/><circle cx="66" cy="72" r="5" fill="#fff"/>`)],
 L51:['z',`<rect x="6" y="2" width="88" height="96" rx="8" fill="#fff"/><rect x="9" y="5" width="82" height="90" rx="6" fill="none" stroke="${K}" stroke-width="2"/><g fill="none" stroke="${R}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="translate(50 36) scale(.62) translate(-50 -61)"><circle cx="30" cy="61" r="12"/><circle cx="70" cy="61" r="12"/><path d="M30 61 L43 41 H61 L70 61 M43 41 L52 61 L61 41"/></g>${T('fietsstraat',14,72)}<text x="50" y="88" font-family="Overpass,Arial,sans-serif" font-weight="700" font-size="11.5" text-anchor="middle" fill="${R}">auto te gast</text>`]
});

/* ---------- complete catalogue (bestaande teksten + nieuwe borden) ---------- */
const CAT={verbod:'Verbod',gebod:'Gebod',voorrang:'Voorrang',waarschuwing:'Waarschuwing',aanwijzing:'Aanwijzing',parkeren:'Parkeren',matrix:'Matrixborden'};
const CATAR={verbod:'ممنوع',gebod:'إجباري',voorrang:'أفضلية',waarschuwing:'تحذير',aanwijzing:'إرشاد',parkeren:'صف',matrix:'لوحات إلكترونية'};
const CODES={C1:'C1',C2:'C2',A50:'A1',E1:'E1',E2:'E2',Dup:'D4',Drot:'D1',Fiets:'G11',B1:'B1',B2:'B2',B3:'B3',B6:'B6',B7:'B7',J8:'J8',Jx:'J37',G1:'G1',G3:'G3',G5:'G5',L2:'L2',E4:'E4',Z30:'E10-30',Mx:'Matrix',Mv:'A3',Mp:'Matrix',Mg:'Matrix'};
const EXTRA=[
 ['A2','A2','verbod','Einde maximumsnelheid','Vanaf hier geldt de gewone maximumsnelheid voor deze weg weer.','نهاية السرعة المحددة: من هون بترجع السرعة العادية للطريق.'],
 ['A4','A4','aanwijzing','Adviessnelheid','Een advies, geen verplichting. Bijvoorbeeld voor een scherpe bocht of afrit.','سرعة استشارية (نصيحة مو إجبار)، مثلاً قبل كوع حاد أو مخرج.'],
 ['C3','C3','aanwijzing','Eenrichtingsweg','Je mag de weg alleen inrijden vanaf deze kant. Een onderbord kan zeggen dat fietsers wel van twee kanten mogen.','طريق اتجاه واحد: بتفوت بس من هالجهة. لوحة تحتها ممكن تسمح للدراجات من الجهتين.'],
 ['C10','C10','verbod','Gesloten voor motorvoertuigen met aanhangwagen','Met een aanhanger mag je hier niet in.','ممنوع للمركبات اللي معها مقطورة.'],
 ['C12','C12','verbod','Gesloten voor alle motorvoertuigen','Auto’s, motoren en andere motorvoertuigen mogen hier niet in.','ممنوع لكل المركبات بمحرك.'],
 ['C14','C14','verbod','Gesloten voor fietsen','Hier mag je niet fietsen.','ممنوع الدراجات.'],
 ['C16','C16','verbod','Gesloten voor voetgangers','Voetgangers mogen hier niet lopen.','ممنوع المشاة.'],
 ['C19','C19','verbod','Maximale hoogte','Gesloten voor voertuigen die hoger zijn dan het getal op het bord.','ممنوع للمركبات الأعلى من الرقم.'],
 ['F1','F1','verbod','Inhaalverbod','Je mag hier geen motorvoertuigen inhalen (wel bijvoorbeeld fietsers).','ممنوع تتجاوز المركبات بمحرك (الدراجات مسموح).'],
 ['F7','F7','verbod','Keerverbod','Je mag hier niet keren (omdraaien).','ممنوع اللف والرجوع (U-turn).'],
 ['D2','D2','gebod','Passeerplicht','Je moet het bord passeren aan de kant waar de pijl naar wijst.','لازم تمرق من الجهة اللي السهم مأشّر عليها.'],
 ['D7','D7','gebod','Verplichte keuze rijrichting','Je moet één van de aangegeven richtingen volgen.','لازم تختار وحدة من الاتجاهات المحددة.'],
 ['G7','G7','gebod','Voetpad','Alleen voor voetgangers.','بس للمشاة.'],
 ['G12','G12','gebod','Einde verplicht fietspad','Hier stopt het verplichte fietspad.','نهاية مسار الدراجات الإجباري.'],
 ['B4','B4','voorrang','Voorrangskruispunt (zijweg links)','Je hebt voorrang op verkeer uit de zijweg links.','إلك الأفضلية على اللي جاي من الطريق الجانبي الشمال.'],
 ['J9','J9','waarschuwing','Rotonde','Waarschuwing: er komt een rotonde.','تحذير: جاي دوّار.'],
 ['J1','J1','waarschuwing','Slecht wegdek','Het wegdek is hobbelig of beschadigd. Rijd rustiger.','الطريق مخرّب أو فيه مطبّات. خفّف.'],
 ['J2','J2','waarschuwing','Bocht naar rechts','Er komt een bocht naar rechts.','جاي كوع لليمين.'],
 ['J10','J10','waarschuwing','Overweg met slagbomen','Er komt een spoorwegovergang met slagbomen.','جاي تقاطع قطار مع حواجز.'],
 ['J11','J11','waarschuwing','Overweg zonder slagbomen','Er komt een spoorwegovergang zonder slagbomen. Extra goed kijken.','جاي تقاطع قطار بدون حواجز، انتبه كتير.'],
 ['J16','J16','waarschuwing','Werk in uitvoering','Er wordt aan de weg gewerkt. Let op werkers en versmallingen.','في أشغال عالطريق، انتبه للعمال والتضييق.'],
 ['J20','J20','waarschuwing','Slipgevaar','De weg kan glad zijn. Rem en stuur rustig.','خطر انزلاق: فرمل ولف بهدوء.'],
 ['J21','J21','waarschuwing','Kinderen','Kinderen kunnen de weg op komen, bijvoorbeeld bij een school.','ولاد ممكن يطلعوا عالطريق، مثلاً قرب مدرسة.'],
 ['J22','J22','waarschuwing','Voetgangersoversteekplaats','Waarschuwing: er komt een zebrapad.','تحذير: جاي ممر مشاة.'],
 ['J32','J32','waarschuwing','Verkeerslichten','Er komen verkeerslichten.','جاية إشارات ضوئية.'],
 ['J36','J36','waarschuwing','Sneeuw of ijzel','Gevaar voor sneeuw of gladheid.','خطر ثلج أو جليد.'],
 ['J38','J38','waarschuwing','Verkeersdrempel','Er komt een drempel. Rijd langzaam.','جاي مطبّ، خفّف.'],
 ['H1','H1','aanwijzing','Bebouwde kom','Begin bebouwde kom: voor auto’s maximaal 50 km/u.','بداية البلد: أقصى 50 للسيارات.'],
 ['H2','H2','aanwijzing','Einde bebouwde kom','Einde bebouwde kom: voor auto’s maximaal 80 km/u als er niets anders staat.','نهاية البلد: أقصى 80 إذا ما في غير شي.'],
 ['G2','G2','aanwijzing','Einde autosnelweg','Hier stopt de autosnelweg. Let op de nieuwe maximumsnelheid.','نهاية الأوتوستراد. انتبه للسرعة الجديدة.'],
 ['L8','L8','aanwijzing','Doodlopende weg','Deze weg loopt dood.','طريق مسدود.'],
 ['L3','L3','aanwijzing','Bushalte','Hier stopt de bus. Let op instappende en uitstappende mensen.','محطة باص. انتبه للناس اللي نازلة وطالعة.'],
 ['L51','L51','aanwijzing','Fietsstraat','Fietsers zijn hier de belangrijkste weggebruikers. Auto’s mogen er rijden, maar zijn “te gast”.','شارع دراجات: الدراجات هي الأهم، والسيارات مسموح بس «ضيف».'],
 ['E6','E6','parkeren','Gehandicaptenparkeerplaats','Alleen voor voertuigen van mensen met een gehandicaptenparkeerkaart.','صف بس لأصحاب بطاقة الإعاقة.'],
 ['E10','E10','parkeren','Parkeerschijfzone (blauwe zone)','Parkeren mag alleen met een parkeerschijf, voor de tijd op het bord.','الصف بس مع قرص الوقت، وللمدة المكتوبة.']
];
