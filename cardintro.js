/* Game Shelf — universal card-game intro (cardintro.js)
   Include right after <body> in any standard-deck game:
     <script src="cardintro.js"></script>
   Deck box opens, cards rise out, shuffle + cut, fade to black, game reveals.
   - PLAY_MODE: "always" (every open) or "daily" (first open per day, per game)
   - Tap anywhere to skip. prefers-reduced-motion skips automatically.
   - Pure CSS transforms, 16 elements, no audio, no canvas. */
(function(){
"use strict";
var PLAY_MODE="always";

/* guarded storage (only used by "daily" mode) */
var mem={};
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return mem[k]||null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){mem[k]=v;}}

if(PLAY_MODE==="daily"){
  var key="ci_seen:"+location.pathname.split("/").pop();
  var today=new Date().toDateString();
  if(lsGet(key)===today)return;
  lsSet(key,today);
}

var reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(reduced)return; /* skip entirely — game just loads */

var css=
".ciov{position:fixed;inset:0;z-index:99990;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,#1d4a2e 0%,#143621 75%);transition:opacity .45s}"+
".ciov.cifade{opacity:0;pointer-events:none}"+
".ciov .ciskip{position:absolute;bottom:20px;left:0;right:0;text-align:center;font-size:12px;color:rgba(243,233,210,.55);letter-spacing:.08em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;animation:ciskipin 1s .8s both}"+
"@keyframes ciskipin{from{opacity:0}to{opacity:1}}"+
".cistage{position:absolute;inset:0}"+
".cibox{position:absolute;left:50%;top:50%;width:84px;height:118px;transform:translate(-50%,-50%);z-index:2;animation:ciboxdrop .7s cubic-bezier(.2,1.6,.4,1) both}"+
"@keyframes ciboxdrop{0%{transform:translate(-50%,-220%) rotate(-9deg)}100%{transform:translate(-50%,-50%) rotate(-4deg)}}"+
".ciboxbody{position:absolute;inset:0;border-radius:7px;background:linear-gradient(160deg,#12213a,#0c1626);border:2px solid #d9a441;box-shadow:0 14px 30px rgba(0,0,0,.55),inset 0 0 22px rgba(217,164,65,.12);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}"+
".ciboxbody .ciwm{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:12px;letter-spacing:.14em;color:#f0c869;text-align:center;line-height:1.35}"+
".ciboxbody .cisuits{font-size:15px;letter-spacing:3px}"+
".ciboxbody .cir{color:#e0596a}.ciboxbody .cib{color:#cfd8e6}"+
".ciflap{position:absolute;left:-2px;right:-2px;top:-2px;height:26px;border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,#1a2c4a,#12213a);border:2px solid #d9a441;border-bottom-color:rgba(217,164,65,.4);transform-origin:top center;box-shadow:0 3px 8px rgba(0,0,0,.4)}"+
".ciov.cis1 .ciflap{animation:ciflapopen .5s .15s cubic-bezier(.3,1.4,.5,1) both}"+
"@keyframes ciflapopen{to{transform:rotateX(150deg)}}"+
".ciov.cis3 .cibox{animation:ciboxout .5s ease both}"+
"@keyframes ciboxout{to{transform:translate(-50%,220%) rotate(6deg);opacity:.6}}"+
".cicard{position:absolute;left:50%;top:50%;width:64px;height:90px;margin-left:-32px;margin-top:-45px;border-radius:7px;transform:translateY(8px);opacity:0;z-index:1;will-change:transform}"+
".cicard .ciback{position:absolute;inset:0;border-radius:7px;background:radial-gradient(circle at 50% 46%,rgba(76,240,224,.22) 0 16%,rgba(24,40,48,.55) 34%,transparent 52%),repeating-linear-gradient(45deg,rgba(76,240,224,.07) 0 6px,transparent 6px 12px),linear-gradient(160deg,#141c24,#0d1218);box-shadow:0 4px 10px rgba(0,0,0,.45),inset 0 0 0 1.5px rgba(76,240,224,.55),inset 0 0 0 3px rgba(245,152,71,.32);display:flex;align-items:center;justify-content:center}"+
".cicard .ciback::after{content:'';position:absolute;inset:0;background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='960 -180 680 840'%3E%3Cpath transform=%22translate%28844.9%2C-213.7%29 scale%289.2129%29%22 d=%22M27.6%2C5.0 L26.5%2C6.7 L24.6%2C9.4 L23.0%2C11.8 L20.7%2C15.0 L20.4%2C15.6 L19.4%2C15.7 L13.5%2C15.8 L12.3%2C16.0 L12.3%2C19.9 L12.7%2C20.1 L18.6%2C20.2 L22.7%2C20.2 L23.8%2C18.8 L25.5%2C16.4 L26.6%2C14.7 L28.5%2C12.0 L29.9%2C9.9 L31.0%2C8.2 L32.3%2C6.3 L32.5%2C6.1 L63.5%2C6.1 L63.8%2C6.8 L65.4%2C9.1 L66.8%2C11.1 L68.6%2C13.7 L69.6%2C15.1 L71.1%2C17.4 L72.8%2C19.6 L73.5%2C20.4 L86.2%2C20.4 L86.3%2C20.2 L86.3%2C15.8 L86.2%2C15.7 L75.9%2C15.6 L73.9%2C13.0 L73.0%2C11.5 L71.8%2C9.9 L70.1%2C7.5 L68.6%2C5.3 L68.5%2C5.0 Z  M48.5%2C33.3 L45.9%2C33.6 L42.7%2C34.2 L39.4%2C35.1 L38.0%2C35.7 L38.0%2C36.3 L40.8%2C38.0 L44.4%2C40.1 L46.6%2C41.3 L50.3%2C43.6 L52.5%2C45.0 L54.5%2C46.1 L58.5%2C48.5 L61.4%2C50.4 L62.1%2C50.9 L62.5%2C50.8 L62.3%2C49.5 L60.8%2C43.9 L59.0%2C36.7 L58.6%2C34.7 L58.0%2C34.3 L55.4%2C33.7 L53.7%2C33.5 L52.0%2C33.3 Z  M61.4%2C35.6 L61.3%2C36.3 L61.5%2C37.1 L62.1%2C39.9 L63.8%2C46.7 L65.4%2C52.6 L66.1%2C55.1 L67.2%2C59.1 L68.0%2C62.2 L68.2%2C63.3 L68.7%2C63.5 L70.4%2C60.4 L71.7%2C58.2 L73.7%2C54.7 L75.1%2C52.3 L75.9%2C50.8 L76.8%2C49.4 L76.6%2C48.7 L75.6%2C47.3 L75.1%2C46.3 L73.4%2C44.0 L73.1%2C44.0 L72.8%2C43.5 L70.1%2C40.8 L67.3%2C38.7 L64.8%2C37.1 L62.5%2C36.0 L61.7%2C35.6 Z  M34.6%2C37.3 L33.1%2C38.2 L31.4%2C39.5 L29.9%2C40.8 L28.2%2C42.3 L26.5%2C44.2 L26.5%2C44.4 L26.2%2C44.4 L24.8%2C46.4 L23.8%2C48.0 L22.5%2C49.9 L21.7%2C51.8 L21.3%2C53.2 L23.0%2C52.9 L26.2%2C52.0 L28.0%2C51.5 L33.5%2C49.9 L35.2%2C49.4 L36.3%2C49.1 L40.3%2C48.0 L43.5%2C47.0 L47.0%2C46.0 L48.3%2C45.6 L48.3%2C45.1 L46.8%2C44.3 L44.1%2C42.7 L43.1%2C42.2 L39.2%2C39.8 L36.9%2C38.5 L34.8%2C37.3 Z  M35.2%2C51.8 L33.7%2C52.3 L31.3%2C53.0 L28.5%2C54.0 L24.9%2C55.0 L22.1%2C55.8 L20.3%2C56.5 L20.1%2C57.1 L20.4%2C57.1 L20.4%2C57.5 L19.9%2C57.4 L19.4%2C60.6 L19.4%2C61.9 L19.7%2C61.8 L19.9%2C60.5 L19.9%2C62.3 L20.0%2C63.5 L19.7%2C63.5 L19.7%2C62.3 L19.6%2C62.3 L19.4%2C65.0 L19.4%2C68.1 L19.7%2C70.4 L20.3%2C72.5 L20.8%2C74.6 L21.4%2C76.3 L21.8%2C76.3 L23.2%2C73.9 L24.6%2C71.6 L26.6%2C68.2 L27.3%2C67.0 L29.2%2C63.9 L31.5%2C59.8 L33.5%2C56.4 L34.8%2C54.2 L35.9%2C52.0 L35.9%2C51.8 Z  M77.9%2C51.9 L77.0%2C53.2 L76.2%2C54.7 L74.5%2C57.7 L72.5%2C61.1 L71.7%2C62.6 L69.6%2C66.3 L68.2%2C68.7 L66.3%2C71.9 L65.2%2C73.9 L64.1%2C75.7 L63.5%2C76.7 L63.7%2C77.3 L64.2%2C77.1 L68.2%2C76.0 L69.7%2C75.4 L71.7%2C74.9 L74.9%2C73.9 L78.9%2C72.7 L79.7%2C72.3 L80.1%2C70.5 L80.6%2C67.4 L80.7%2C66.0 L80.7%2C61.9 L80.3%2C58.5 L79.9%2C56.4 L79.2%2C54.2 L78.5%2C52.2 Z  M31.0%2C65.6 L29.3%2C68.4 L28.3%2C70.4 L26.9%2C72.7 L26.1%2C74.2 L25.2%2C75.7 L23.7%2C78.4 L23.0%2C79.8 L23.9%2C81.3 L25.2%2C83.0 L26.5%2C84.6 L28.0%2C86.3 L30.1%2C88.2 L31.8%2C89.5 L33.7%2C90.8 L35.5%2C91.9 L37.7%2C92.9 L38.2%2C92.7 L37.9%2C91.3 L36.9%2C87.5 L35.6%2C82.2 L34.5%2C77.8 L33.9%2C75.8 L33.2%2C72.9 L31.5%2C66.7 L31.3%2C65.6 Z  M78.2%2C75.1 L73.8%2C76.5 L70.4%2C77.5 L67.3%2C78.4 L63.7%2C79.5 L60.7%2C80.4 L56.5%2C81.6 L53.0%2C82.6 L51.3%2C83.0 L51.1%2C83.6 L53.9%2C85.3 L56.9%2C87.1 L60.8%2C89.5 L63.5%2C91.2 L64.4%2C91.6 L65.2%2C91.5 L66.6%2C90.5 L67.5%2C89.9 L69.4%2C88.4 L70.1%2C87.8 L70.1%2C87.5 L70.7%2C87.3 L73.0%2C85.0 L74.5%2C83.0 L76.1%2C80.9 L77.0%2C79.4 L78.3%2C76.7 L78.7%2C75.8 L78.7%2C75.1 Z  M37.2%2C78.1 L37.0%2C78.5 L37.6%2C80.5 L38.5%2C83.9 L39.2%2C87.0 L40.3%2C91.6 L41.0%2C93.9 L41.1%2C94.2 L43.4%2C94.7 L44.8%2C95.0 L45.1%2C95.1 L54.5%2C95.1 L55.6%2C94.9 L58.0%2C94.3 L60.6%2C93.5 L61.7%2C93.0 L61.5%2C92.6 L59.9%2C91.6 L57.3%2C90.1 L54.6%2C88.4 L51.5%2C86.5 L49.6%2C85.3 L46.9%2C83.7 L44.9%2C82.5 L42.0%2C80.8 L41.0%2C80.1 L39.4%2C79.2 L38.5%2C78.5 L37.6%2C78.1 Z%22 fill=%22%234cf0e0%22 fill-rule=%22evenodd%22/%3E%3C/svg%3E\") center/46% no-repeat;filter:drop-shadow(0 0 5px rgba(76,240,224,.65))}"+
".civeil{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .35s;pointer-events:none}";

var st=document.createElement("style");
st.textContent=css;
document.head.appendChild(st);

var ov=document.createElement("div");
ov.className="ciov";
ov.innerHTML=
 "<div class='cistage'>"+
  "<div class='cibox'>"+
   "<div class='ciboxbody'><div class='ciwm'>GAME<br>SHELF</div>"+
   "<div class='cisuits'><span class='cib'>\u2660</span><span class='cir'>\u2665</span><span class='cir'>\u2666</span><span class='cib'>\u2663</span></div></div>"+
   "<div class='ciflap'></div>"+
  "</div>"+
 "</div>"+
 "<div class='ciskip'>tap to skip</div>"+
 "<div class='civeil'></div>";
document.body.appendChild(ov);

var stage=ov.firstChild, veil=ov.querySelector(".civeil");
var N=16, cards=[], timers=[], done=false;
for(var i=0;i<N;i++){
  var c=document.createElement("div");
  c.className="cicard";
  c.innerHTML="<div class='ciback'></div>";
  stage.appendChild(c);cards.push(c);
}
function at(ms,fn){timers.push(setTimeout(fn,ms));}
function setT(el,t){el.style.transition=t;}

function finish(){
  if(done)return;done=true;
  timers.forEach(clearTimeout);
  veil.style.opacity=1;
  setTimeout(function(){
    ov.classList.add("cifade");
    setTimeout(function(){if(ov.parentNode)ov.parentNode.removeChild(ov);},500);
  },380);
}
ov.addEventListener("pointerdown",finish);

/* sequence */
at(700,function(){ov.classList.add("cis1");});
at(950,function(){
  cards.forEach(function(c,i){
    c.style.opacity=1;
    setT(c,"transform .55s cubic-bezier(.3,1.15,.4,1) "+(i*16)+"ms");
    c.style.transform="translateY("+(-116-i*1.6)+"px) rotate("+(-4+((i%2?1:-1)*(i%4)))+"deg)";
  });
});
at(1750,function(){
  ov.classList.add("cis3");
  cards.forEach(function(c,i){
    setT(c,"transform .45s cubic-bezier(.35,1.1,.5,1) "+(i*8)+"ms");
    c.style.transform="translateY("+(-6-i*1.5)+"px)";
  });
});
at(2350,function(){
  cards.forEach(function(c,i){
    var half=i<N/2?-1:1,j=i%(N/2);
    setT(c,"transform .36s cubic-bezier(.4,1.2,.5,1) "+(j*10)+"ms");
    c.style.transform="translateX("+(half*74)+"px) translateY("+(-4-j*1.6)+"px) rotate("+(half*10)+"deg)";
  });
});
at(2850,function(){
  var order=[];
  for(var j=0;j<N/2;j++){order.push(j);order.push(j+N/2);}
  order.forEach(function(idx,k){
    var c=cards[idx];
    setT(c,"transform .34s cubic-bezier(.3,1.5,.45,1) "+(k*26)+"ms");
    c.style.transform="translateX(0) translateY("+(-4-k*1.5)+"px) rotate("+((k%2?1:-1)*2)+"deg)";
  });
});
at(3550,function(){
  cards.forEach(function(c,i){
    if(i>=N/2){
      setT(c,"transform .3s ease");
      c.style.transform="translateX(-60px) translateY(-44px) rotate(-8deg)";
    }
  });
  at(260,function(){
    cards.forEach(function(c,i){
      if(i>=N/2){
        setT(c,"transform .28s cubic-bezier(.3,1.3,.5,1)");
        c.style.transform="translateX(0) translateY("+(-4-(i%(N/2))*1.5-12)+"px)";
      }
    });
  });
});
at(4250,function(){
  cards.forEach(function(c,i){
    setT(c,"transform .3s ease "+(i*6)+"ms");
    c.style.transform="translateY("+(-4-i*1.2)+"px) rotate(0deg)";
  });
});
at(4800,finish);
})();
