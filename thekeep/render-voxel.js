// The Keep · render-voxel.js · v0.19.0 · Oct 29 2026
// The same world drawn as blocks, the way Minecraft draws its worlds: every cell becomes a column of 1 m blocks.
// Nothing here makes the world. It reads the exact arrays the ASCII raycaster reads, rounds each height to a whole
// block, and gives each column a block type. Sky, water, light and the people are shared with the Mesh renderer.
// Loaded only when Voxels is picked.
(function(){
'use strict';

// ---------------- small math ----------------
function persp(fy,asp,n,f){ const t=1/Math.tan(fy/2), nf=1/(n-f);
  return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)*nf,-1, 0,0,2*f*n*nf,0]); }
function mul(a,b){ const o=new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++){ let s=0; for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; } return o; }
function inv(m){ const a=m, o=new Float32Array(16);
  const b00=a[0]*a[5]-a[1]*a[4], b01=a[0]*a[6]-a[2]*a[4], b02=a[0]*a[7]-a[3]*a[4], b03=a[1]*a[6]-a[2]*a[5],
        b04=a[1]*a[7]-a[3]*a[5], b05=a[2]*a[7]-a[3]*a[6], b06=a[8]*a[13]-a[9]*a[12], b07=a[8]*a[14]-a[10]*a[12],
        b08=a[8]*a[15]-a[11]*a[12], b09=a[9]*a[14]-a[10]*a[13], b10=a[9]*a[15]-a[11]*a[13], b11=a[10]*a[15]-a[11]*a[14];
  let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06; if(!d) return o; d=1/d;
  o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*d; o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*d; o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*d; o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*d;
  o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*d; o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*d; o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*d; o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*d;
  o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*d; o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*d; o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*d; o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*d;
  o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*d; o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*d; o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*d; o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*d;
  return o; }

// ---------------- shaders ----------------
const HEAD=`#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
uniform mat4 uVP; uniform vec3 uEye; uniform vec3 uFog; uniform vec3 uTint; uniform float uFogK; uniform float uUW;
uniform vec2 uScr; uniform vec3 uLight; uniform float uNight; uniform float uTime; uniform vec2 uRight;
uniform int uNL; uniform vec4 uLP[16]; uniform vec4 uLC[16];
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
`;
// fog, underwater and the day tint, in the order the ASCII compose applies them; warm light from lanterns is added on top
const FINISH=`
float pool(vec3 wp){ float w=0.0;
  for(int i=0;i<16;i++){ if(i>=uNL) break; vec3 d=wp-uLP[i].xyz; if(d.z>0.6||d.z<-3.5) continue;
    float q=length(d.xy)/uLP[i].w; if(q<1.0){ float k=1.0-q; w+=uLC[i].x*k*k*1.25; } }
  return w; }
vec3 finish(vec3 cw, vec3 craw, vec3 wp, float warm){
  float f=1.0-exp(-length(wp.xy-uEye.xy)*uFogK);
  vec3 c=mix(cw,uFog,f);
  if(uUW>0.0){ float s=gl_FragCoord.y/uScr.y; vec3 ut=mix(vec3(12.,46.,72.),vec3(46.,118.,150.),s)/255.; c=mix(c,ut,uUW*0.6); }
  c=c*uTint+craw*(1.0-f);
  if(warm>0.0){ float k=warm*(1.0-f); c+=cw*k*vec3(1.0,0.74,0.40)+vec3(18.,8.,0.)/255.*k; }
  return min(c,vec3(1.0)); }
`;

// blocks: every face carries its block position (whole numbers), the cell whose light and shadow it takes,
// which way it faces (0 top, 1 +x, 2 -x, 3 +y, 4 -y, 5 bottom), its material and a corner darkening (ambient occlusion)
const VS_VOX=HEAD+`
layout(location=0) in vec4 aP; layout(location=1) in vec2 aC; layout(location=2) in vec4 aF;
out vec3 vW; flat out ivec2 vCell; flat out int vFace; flat out int vMat; flat out int vSl; flat out float vTop; out float vAO;
void main(){ vW=aP.xyz; vTop=aP.w; vCell=ivec2(aC); vFace=int(aF.x+0.5); vMat=int(aF.y+0.5); vSl=int(aF.w+0.5); vAO=aF.z/255.0;
  gl_Position=uVP*vec4(aP.xyz,1.0); }`;
const FS_VOX=HEAD+FINISH+`
uniform sampler2D uC; uniform sampler2D uT; uniform vec3 uMatF[10]; uniform vec3 uMatT[10]; uniform float uMatCH[10];
in vec3 vW; flat in ivec2 vCell; flat in int vFace; flat in int vMat; flat in int vSl; flat in float vTop; in float vAO; out vec4 o;
void main(){
  vec4 lit=texelFetch(uC,vCell,0); float sh=vSl==1?texelFetch(uT,vCell,0).a:lit.a;
  vec2 fc=(vFace==0||vFace==5)?vW.xy:((vFace<=2)?vec2(vW.y,vW.z):vec2(vW.x,vW.z));
  vec2 blk=floor(fc-0.0001*vec2(0.0,1.0)), px=floor(fract(fc)*16.0);
  float n=0.88+0.18*hash(px+blk*17.0+float(vMat)*3.1);
  vec3 c;
  if(vMat==20){ vec3 tc=texelFetch(uT,vCell,0).rgb; float hole=hash(px+blk*5.0+float(vFace)); c=tc*(hole<0.12?0.62:1.0)*(vFace==0?1.08:(vFace==5?0.7:0.9))*sh; }
  else if(vFace==0){
    if(vMat>=5&&vMat<=14){ int m=vMat-5; c=uMatT[m]; } else c=lit.rgb;
    c*=(vMat>=5&&vMat<=14)?sh:1.0; c*=n;
    if(vMat<5||vMat>14) c*=sh;
  } else {
    vec2 nn=vFace==1?vec2(1,0):vFace==2?vec2(-1,0):vFace==3?vec2(0,1):vec2(0,-1);
    float lt=vFace==5?0.5:0.64+0.46*max(0.0,dot(nn,uLight.xy));
    vec3 base;
    if(vMat==0){ float band=3.0+floor(2.0*hash(vec2(px.x,blk.x*7.0+blk.y)));   // grass hangs over the top of the dirt, jagged
      base=(vW.z>vTop-band/16.0)?vec3(88.,152.,52.)/255.:vec3(134.,96.,67.)/255.; }
    else if(vMat==1) base=vec3(214.,196.,138.)/255.;
    else if(vMat==2) base=(vW.z>vTop-0.25)?vec3(234.,238.,244.)/255.:vec3(132.,122.,108.)/255.;
    else if(vMat==3) base=vec3(132.,122.,108.)/255.;
    else if(vMat==4) base=vec3(134.,96.,67.)/255.;
    else if(vMat<=14){ int m=vMat-5; base=uMatF[m];
      if(uMatCH[m]>0.0){ float row=floor(px.y/8.0); float py=mod(px.y,8.0), qx=mod(px.x+(mod(row+blk.y,2.0)>0.5?8.0:0.0),16.0);
        if(py<1.0||qx<1.0) base*=0.74; } }
    else base=vec3(106.,76.,48.)/255.;
    c=base*lt*sh*n;
  }
  c*=vAO;
  o=vec4(finish(c,vec3(0.0),vW,uNight>0.0?pool(vW):0.0),1.0); }`;
// creatures and keepers: the same pixel sprites, standing up as cards that turn to face you
const VS_SPR=HEAD+`
layout(location=0) in vec4 iP; layout(location=1) in vec4 iS; layout(location=2) in vec4 iU; layout(location=3) in vec4 iX;
out vec2 vUV; out vec2 vLoc; flat out vec4 vS; flat out vec4 vX; out vec3 vW;
void main(){ int id=gl_VertexID; float cx=(id==1||id==3)?1.0:-1.0, cy=(id>=2)?1.0:0.0;
  vec3 p=vec3(iP.xy+uRight*cx*iS.x,iP.z+cy*iS.y);
  float u=cx*0.5+0.5; if(iX.z>0.5) u=1.0-u;
  vUV=vec2(mix(iU.x,iU.z,u),mix(iU.w,iU.y,cy)); vLoc=vec2(u,1.0-cy); vS=iS; vX=iX; vW=p;
  gl_Position=uVP*vec4(p,1.0); }`;
const FS_SPR=HEAD+FINISH+`
uniform sampler2D uA; in vec2 vUV; in vec2 vLoc; flat in vec4 vS; flat in vec4 vX; in vec3 vW; out vec4 o;
void main(){ vec4 t=texture(uA,vUV); if(t.a<0.2) discard;
  if(t.a<0.75&&uNight>0.02&&vX.w>0.5){ float fl=0.86+0.14*sin(uTime*9.0+vW.z*7.0);
    o=vec4(vec3(1.0,0.84,0.47)*fl,1.0); return; }
  vec3 c=t.rgb*vS.w; float w=0.0;
  if(vX.w>0.5&&uNight>0.02&&vX.x>=0.0){ vec2 px=vLoc*vec2(16.0,32.0); w=uNight*max(0.0,1.0-length(px-vX.xy)/12.0)*1.1; }
  o=vec4(finish(c,vec3(0.0),vW,w),1.0); }`;

// the sky: the same palette, sun, moon, stars and two cloud layers as the raycaster's sky(), per pixel
const SKYFN=`
uniform vec3 uSkyT; uniform vec3 uSkyH; uniform vec3 uSkyC; uniform vec3 uSunC; uniform vec4 uSkyK; // nd, du, cl, hx
uniform float uSkyHy; uniform vec4 uSun; uniform vec4 uMoon; uniform sampler2D uCl; uniform sampler2D uCl2; uniform float uCloudH;
vec3 skyCol(vec3 d){ float hl=max(length(d.xy),1e-4); vec2 dh=d.xy/hl; float sg=d.z/hl;
  float nd=uSkyK.x, du=uSkyK.y, cl=uSkyK.z;
  float tt=sqrt(clamp(sg*1.6,0.0,1.0));
  vec3 hz=uSkyH; if(du>0.0){ float side=0.35+0.65*max(0.0,dot(dh,vec2(uSkyK.w,uSkyHy))); float w=du*side;
    hz+=(vec3(1.0,150.0/255.0,70.0/255.0)-hz)*w*vec3(0.85,0.75,0.85); }
  vec3 c=mix(hz,uSkyT,tt);
  vec3 dn=normalize(d);
  if(nd>0.0&&sg>0.02){ vec2 g=vec2(atan(dh.y,dh.x),atan(sg))*520.0; vec2 sc=floor(g); float hs=hash(sc);
    if(hs>0.9986){ float br=nd*(0.5+0.5*hash(sc+7.0))*(0.7+0.3*sin(uTime*2.5+hs*60.0))*smoothstep(0.5,0.1,length(fract(g)-0.5));
      c=mix(c,vec3(232.,236.,255.)/255.,br); } }
  if(uSun.w>-0.03){ float k=dot(dn,uSun.xyz);
    if(k>0.9993) return uSunC;
    if(k>0.96){ float q=(k-0.96)/0.04; float gl=q*q*(1.0+du); c+=vec3(70.0,55.0-30.0*du,10.0-10.0*du)/255.0*gl; } }
  if(uMoon.w>-0.03&&nd>0.0){ float k=dot(dn,uMoon.xyz);
    if(k>0.9991) return vec3(226.,228.,214.)/255.*(0.5+0.5*nd);
    if(k>0.975){ float q=(k-0.975)/0.025*nd; c+=vec3(40.,44.,60.)/255.*q*q; } }
  if(sg>0.03){ vec3 cc=uSkyC*cl;
    float dist2=(uCloudH+50.0-uEye.z)/sg; vec2 p2=uEye.xy+dh*dist2+vec2(uTime*1.5,0.0);
    float c2=texture(uCl2,p2*0.7/256.0).r; float a2=smoothstep(0.52,0.74,c2)*clamp(1.0-dist2/1400.0,0.0,1.0)*0.7;
    if(a2>0.0){ float sh=0.88-0.2*smoothstep(0.7,0.95,c2); c=mix(c,cc*vec3(0.94,0.96,0.99)*sh,a2); }
    float dist=(uCloudH-uEye.z)/sg; vec2 p1=uEye.xy+dh*dist+vec2(uTime*3.0,0.0);
    float c1=texture(uCl,p1*1.1/256.0).r; float a1=smoothstep(0.50,0.70,c1)*clamp(1.0-dist/900.0,0.0,1.0);
    if(a1>0.0){ float sh=1.0-0.3*smoothstep(0.64,0.92,c1); c=mix(c,cc*sh,a1); } }
  return clamp(c,0.0,1.0); }
`;
const VS_SKY=`#version 300 es
out vec2 vN; void main(){ vec2 p=vec2((gl_VertexID==1)?3.0:-1.0,(gl_VertexID==2)?3.0:-1.0); vN=p; gl_Position=vec4(p,0.9999,1.0); }`;
const FS_SKY=HEAD+SKYFN+`
uniform mat4 uInv; in vec2 vN; out vec4 o;
void main(){ vec4 a=uInv*vec4(vN,-1.0,1.0), b=uInv*vec4(vN,1.0,1.0); vec3 d=normalize(b.xyz/b.w-a.xyz/a.w);
  vec3 c=skyCol(d);
  if(uUW>0.0){ float s=gl_FragCoord.y/uScr.y; vec3 ut=mix(vec3(12.,46.,72.),vec3(46.,118.,150.),s)/255.; c=mix(c,ut,uUW*0.6); }
  o=vec4(c,1.0); }`;

// water: one sheet at the waterline; it shows the bed through it near the shore and the sky in it at a glance
const VS_WATER=HEAD+`
uniform float uWater; out vec3 vW;
void main(){ vec2 p=vec2((gl_VertexID==1||gl_VertexID==3)?512.0:0.0,(gl_VertexID>=2)?512.0:0.0);
  vW=vec3(p,uWater); gl_Position=uVP*vec4(vW,1.0); }`;
const FS_WATER=HEAD+FINISH+SKYFN+`
uniform sampler2D uH; uniform float uWater; in vec3 vW; out vec4 o;
void main(){ ivec2 cell=clamp(ivec2(floor(vW.xy)),ivec2(0),ivec2(511)); float bed=texelFetch(uH,cell,0).r;
  float depth=uWater-bed; if(depth<-0.4) discard;
  vec3 v=normalize(vW-uEye);
  vec2 rp=vec2(0.030*sin(vW.x*0.9+uTime*1.3)+0.018*sin(vW.y*1.7-uTime*0.9+vW.x*0.3), 0.030*cos(vW.y*0.8+uTime*1.1)+0.018*cos(vW.x*1.5+uTime*0.7));
  vec3 n=normalize(vec3(rp,1.0));
  if(uEye.z<uWater){ o=vec4(finish(vec3(46.,118.,150.)/255.,vec3(0.0),vW,0.0),0.55); return; }
  vec3 r=reflect(v,n); r.z=max(r.z,0.02);
  float cosv=clamp(-v.z,0.0,1.0); float fres=0.12+0.78*pow(1.0-cosv,3.0);
  vec3 body=vec3(30.,78.,98.)/255.;
  float a=clamp(0.30+max(depth,0.0)*0.16,0.0,0.88); a=mix(a,1.0,fres*0.85);
  vec3 sk=skyCol(r);
  vec3 cw=body*(1.0-fres)/max(a,0.01), craw=sk*fres/max(a,0.01);
  o=vec4(finish(cw,craw,vW,0.0),a); }`;


// wall decorations (banners, paintings, tapestries): flat pictures a hand's width off the wall, from the same list the letters use
const VS_DECO=HEAD+`
layout(location=0) in vec3 aP; layout(location=1) in vec2 aU; layout(location=2) in vec2 aC;
out vec3 vW; out vec2 vU; flat out ivec2 vCell;
void main(){ vW=aP; vU=aU; vCell=ivec2(aC); gl_Position=uVP*vec4(aP,1.0); }`;
const FS_DECO=HEAD+FINISH+`
uniform sampler2D uD; uniform sampler2D uC; in vec3 vW; in vec2 vU; flat in ivec2 vCell; out vec4 o;
void main(){ vec4 t=texture(uD,vU); if(t.a<0.5) discard; float sh=texelFetch(uC,vCell,0).a;
  vec3 b=t.a<0.9?t.rgb*(0.55+0.6*(1.0-uNight)):t.rgb*0.9*sh;   // stained glass glows with the daylight behind it
  o=vec4(finish(b,vec3(0.0),vW,uNight>0.0?pool(vW):0.0),1.0); }`;
// ---------------- the renderer ----------------
function create(A){
  const R={ok:false,error:'',shown:false};
  const N=A.N, W=A.W;
  const canvas=document.createElement('canvas');
  canvas.id='glv'; canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:fixed;left:0;top:0;display:none;pointer-events:none;background:#000;touch-action:none';
  const ref=document.getElementById('c'); (ref&&ref.parentNode?ref.parentNode:document.body).insertBefore(canvas,ref?ref.nextSibling:null);
  let gl=null;
  try{ gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false}); }catch(e){ gl=null; }
  if(!gl){ R.error='no WebGL2'; canvas.remove(); return R; }
  canvas.addEventListener('webglcontextlost',function(e){ e.preventDefault(); R.ok=false; R.error='lost'; if(R.onLost) R.onLost(); });

  function sh(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function prog(vs,fs){ const p=gl.createProgram(); gl.attachShader(p,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u={}; const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS); for(let i=0;i<n;i++){ const a=gl.getActiveUniform(p,i); u[a.name.replace(/\[0\]$/,'')]=gl.getUniformLocation(p,a.name); }
    return {p:p,u:u}; }
  let PV,PSP,PSK,PW;
  try{ PV=prog(VS_VOX,FS_VOX); PSP=prog(VS_SPR,FS_SPR); PSK=prog(VS_SKY,FS_SKY); PW=prog(VS_WATER,FS_WATER); }
  catch(e){ R.error=String(e&&e.message||e).slice(0,300); canvas.remove(); return R; }

  // ---- textures ----
  gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
  function tex(w,h,ifmt,fmt,type,filter,wrap){ const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,ifmt,w,h,0,fmt,type,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wrap); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wrap); return t; }
  const texH=tex(N,N,gl.R32F,gl.RED,gl.FLOAT,gl.NEAREST,gl.CLAMP_TO_EDGE);
  const texC=tex(N,N,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,gl.LINEAR,gl.CLAMP_TO_EDGE);
  const texT=tex(N,N,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,gl.LINEAR,gl.CLAMP_TO_EDGE);
  const texCl=tex(256,256,gl.R8,gl.RED,gl.UNSIGNED_BYTE,gl.LINEAR,gl.REPEAT);
  const texCl2=tex(256,256,gl.R8,gl.RED,gl.UNSIGNED_BYTE,gl.LINEAR,gl.REPEAT);
  const cData=new Uint8Array(N*N*4), tData=new Uint8Array(N*N*4);
  function packRows(y0,y1){ const cr=W.cr,cg=W.cg,cb=W.cb,s=W.shad,tr=W.tr,tg=W.tg,tb=W.tb,st=W.shadTop,su=W.su;
    for(let i=y0*N;i<y1*N;i++){ const o=i*4;
      cData[o]=cr[i]; cData[o+1]=cg[i]; cData[o+2]=cb[i]; cData[o+3]=Math.max(0,Math.min(255,s[i]*255));
      tData[o]=tr[i]; tData[o+1]=tg[i]; tData[o+2]=tb[i]; tData[o+3]=su[i]>0?Math.max(0,Math.min(255,st[i]*255)):255; } }
  function uploadRows(y0,y1){ if(y0<0)y0=0; if(y1>N)y1=N; if(y1<=y0) return; packRows(y0,y1);
    gl.bindTexture(gl.TEXTURE_2D,texC); gl.texSubImage2D(gl.TEXTURE_2D,0,0,y0,N,y1-y0,gl.RGBA,gl.UNSIGNED_BYTE,cData.subarray(y0*N*4,y1*N*4));
    gl.bindTexture(gl.TEXTURE_2D,texT); gl.texSubImage2D(gl.TEXTURE_2D,0,0,y0,N,y1-y0,gl.RGBA,gl.UNSIGNED_BYTE,tData.subarray(y0*N*4,y1*N*4)); }

  // ---- block columns: the same heights, rounded to whole blocks, with a material per column ----
  const colTop=new Int16Array(N*N), colMat=new Uint8Array(N*N), slabB=new Int16Array(N*N), slabT=new Int16Array(N*N);
  // materials: 0 grass, 1 sand, 2 snow, 3 rock, 4 path, 5..11 stone of the keep and the ruins (RMAT 0..6), 12 leaves, 13 wood
  function buildColumns(){ const h=W.h, st=W.st, WATER=A.WATER;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const i=y*N+x, hh=h[i];
      const g=hh+st[i]; colTop[i]=g<WATER?Math.min(Math.round(g),Math.ceil(WATER)-1):Math.round(g);
      if(st[i]>0.3&&g>=WATER&&colTop[i]<=Math.round(hh)) colTop[i]=Math.round(hh)+1;   // a low bench or pew still stands one block up
      const xl=x>0?x-1:x, xr=x<N-1?x+1:x, yu=y>0?y-1:y, yd=y<N-1?y+1:y;
      const sx=(h[y*N+xr]-h[y*N+xl])*0.5, sy=(h[yd*N+x]-h[yu*N+x])*0.5, slope=Math.sqrt(sx*sx+sy*sy);
      let m;
      if(st[i]>0) m=5+Math.min(9,W.ruin[i]);
      else if(W.ruin[i]===6) m=11;
      else if(W.path[i]&&hh>WATER+0.3) m=4;
      else if(hh<WATER+1.4) m=1;
      else if(hh>58) m=2;
      else if(slope>1.0||hh>44) m=3;
      else m=0;
      colMat[i]=m;
      if(W.su[i]>0){ slabB[i]=Math.round(hh+W.sb[i]); slabT[i]=Math.round(hh+W.su[i]); } else { slabB[i]=0; slabT[i]=0; } } }
  const VSZ=16;   // bytes per vertex: Int16 x,y,z,top | Uint16 cell x,y | Uint8 face,mat,ao,0
  function ChunkBuf(){ this.vb=new ArrayBuffer(262144*VSZ); this.v16=new Int16Array(this.vb); this.u16=new Uint16Array(this.vb); this.u8=new Uint8Array(this.vb); this.nv=0; this.idx=new Uint32Array(262144*3/2); this.ni=0; this.full=false; this.sl=0; }
  ChunkBuf.prototype.vert=function(x,y,z,top,cx,cy,face,mat,ao){ const k=this.nv++, o=k*8;
    this.v16[o]=x; this.v16[o+1]=y; this.v16[o+2]=z; this.v16[o+3]=top; this.u16[o+4]=cx; this.u16[o+5]=cy;
    const b=k*VSZ+12; this.u8[b]=face; this.u8[b+1]=mat; this.u8[b+2]=ao; this.u8[b+3]=this.sl; return k; };
  // a quad from four corners in order around the face; skipped once a chunk reaches 65536 corners
  ChunkBuf.prototype.quad=function(p,top,cx,cy,face,mat,ao){ if(this.nv>262140){ this.full=true; return; }
    const a=this.vert(p[0],p[1],p[2],top,cx,cy,face,mat,ao[0]), b=this.vert(p[3],p[4],p[5],top,cx,cy,face,mat,ao[1]),
          c=this.vert(p[6],p[7],p[8],top,cx,cy,face,mat,ao[2]), d=this.vert(p[9],p[10],p[11],top,cx,cy,face,mat,ao[3]);
    const I=this.idx; let q=this.ni; if(ao[0]+ao[2]>=ao[1]+ao[3]){ I[q++]=a; I[q++]=b; I[q++]=c; I[q++]=a; I[q++]=c; I[q++]=d; } else { I[q++]=b; I[q++]=c; I[q++]=d; I[q++]=b; I[q++]=d; I[q++]=a; } this.ni=q; };
  const SCRATCH=new ChunkBuf();
  const AOT=[255,214,180,150], AO1=[255,255,255,255], AOS=[196,196,255,255];
  const DIRS=[[1,0,1],[-1,0,2],[0,1,3],[0,-1,4]];
  function sampleTop(x,y,s){ if(x<0||y<0||x>=N||y>=N) return -64; if(s===1) return colTop[y*N+x];
    const cx=Math.min(N-1,x+(s>>1)), cy=Math.min(N-1,y+(s>>1)); return colTop[cy*N+cx]; }
  function cellOf(x,y,s){ return [Math.min(N-1,x+(s>>1)),Math.min(N-1,y+(s>>1))]; }
  // a side face of a column from z0 up to z1, on the edge toward direction d
  function side(B,x,y,s,d,z0,z1,top,cx,cy,mat,ao){ const X=x, Y=y, S=s;
    if(d===0) B.quad([X+S,Y,z0, X+S,Y+S,z0, X+S,Y+S,z1, X+S,Y,z1],top,cx,cy,1,mat,ao);
    else if(d===1) B.quad([X,Y+S,z0, X,Y,z0, X,Y,z1, X,Y+S,z1],top,cx,cy,2,mat,ao);
    else if(d===2) B.quad([X+S,Y+S,z0, X,Y+S,z0, X,Y+S,z1, X+S,Y+S,z1],top,cx,cy,3,mat,ao);
    else B.quad([X,Y,z0, X+S,Y,z0, X+S,Y,z1, X,Y,z1],top,cx,cy,4,mat,ao); }
  function box(B,x0,y0,z0,x1,y1,z1,cx,cy,mat,skip){   // a whole block box (skip: faces hidden by a neighbour, bit per face)
    if(!(skip&1)) B.quad([x0,y0,z1, x1,y0,z1, x1,y1,z1, x0,y1,z1],z1,cx,cy,0,mat,AO1);
    if(!(skip&32)) B.quad([x0,y0,z0, x0,y1,z0, x1,y1,z0, x1,y0,z0],z1,cx,cy,5,mat,AO1);
    if(!(skip&2)) B.quad([x1,y0,z0, x1,y1,z0, x1,y1,z1, x1,y0,z1],z1,cx,cy,1,mat,AO1);
    if(!(skip&4)) B.quad([x0,y1,z0, x0,y0,z0, x0,y0,z1, x0,y1,z1],z1,cx,cy,2,mat,AO1);
    if(!(skip&8)) B.quad([x1,y1,z0, x0,y1,z0, x0,y1,z1, x1,y1,z1],z1,cx,cy,3,mat,AO1);
    if(!(skip&16)) B.quad([x0,y0,z0, x1,y0,z0, x1,y0,z1, x0,y0,z1],z1,cx,cy,4,mat,AO1); }
  // a tree as blocks: a one-block trunk up into a crown filled to the same profile the raycaster draws
  function voxTree(B,x,y,full){ const i=y*N+x, th=W.tree[i]; if(!(th>0)) return;
    const t=W.ttype[i], tw=0.55+1.35*A.hash2(x,y,W.seed+96), tj=A.hash2(x,y,W.seed+93);
    const rcw=0.92*(t===0?1.05:t===1?1.85:1.62)*tw, base=colTop[i], top=W.gh[i]+th;
    const cb0=W.gh[i]+th*(t===0?(0.06+0.16*tj):t===1?(0.36+0.22*tj):(0.22+0.24*tj)), cH=top-cb0;
    const zc=Math.max(base+1,Math.round(cb0)), zt=Math.max(zc+1,Math.round(top));
    if(zc>base) box(B,x,y,base,x+1,y+1,zc,x,y,21,1|32);
    if(!full){ const r=Math.max(1,Math.round(rcw)); box(B,x-r+1,y-r+1,zc,x+r,y+r,zt,x,y,20,0); return; }
    const R=Math.ceil(rcw)+1, set=new Set(), key=function(a,b,c){ return ((a+8)*32+(b+8))*256+c; };
    for(let z=zc;z<zt;z++){ const zz=z+0.5; let q;
      if(t===0){ const u=Math.max(0,Math.min(1,(top-zz)/cH)); q=(-0.22+Math.sqrt(0.0484+3.12*u))/1.56; }
      else if(t===1){ const u=(zz-cb0)/cH; q=Math.sqrt(Math.max(0,1-u*u)); }
      else { const u=(zz-cb0)/cH; q=Math.sqrt(Math.max(0,(1-u)/(0.5+0.4*tj))); }
      const rr=Math.min(1,q)*rcw+0.35;
      for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){ if(dx*dx+dy*dy<=rr*rr||(dx===0&&dy===0)) set.add(key(dx,dy,z-zc)); } }
    set.forEach(function(k){ const lz=k%256, ab=(k-lz)/256, by=ab%32-8, bx=(ab-ab%32)/32-8;
      let skip=0; if(set.has(key(bx,by,lz+1))) skip|=1; if(lz>0&&set.has(key(bx,by,lz-1))) skip|=32;
      if(set.has(key(bx+1,by,lz))) skip|=2; if(set.has(key(bx-1,by,lz))) skip|=4; if(set.has(key(bx,by+1,lz))) skip|=8; if(set.has(key(bx,by-1,lz))) skip|=16;
      if(skip!==63) box(B,x+bx,y+by,zc+lz,x+bx+1,y+by+1,zc+lz+1,x,y,20,skip); }); }
  function buildChunk(cxi,cyi,lod){
    const s=STRIDES[lod], B=SCRATCH, ox=cxi*SIDE, oy=cyi*SIDE;
    B.nv=0; B.ni=0; B.full=false; B.sl=0;
    for(let y=oy;y<oy+SIDE;y+=s)for(let x=ox;x<ox+SIDE;x+=s){
      const H=sampleTop(x,y,s), cc=cellOf(x,y,s), ci=cc[1]*N+cc[0], mat=colMat[ci];
      // top, with its corners darkened where a taller neighbour stands over them
      let ao=AO1;
      if(s===1){ const hi=function(dx,dy){ return sampleTop(x+dx,y+dy,1)>H?1:0; };
        const cor=function(ax,ay){ const a=hi(ax,0), b=hi(0,ay), c=hi(ax,ay); return AOT[a&&b?3:a+b+c]; };
        ao=[cor(-1,-1),cor(1,-1),cor(1,1),cor(-1,1)]; }
      B.quad([x,y,H, x+s,y,H, x+s,y+s,H, x,y+s,H],H,cc[0],cc[1],0,mat,ao);
      for(let d=0;d<4;d++){ const nx=x+DIRS[d][0]*s, ny=y+DIRS[d][1]*s; let nH=sampleTop(nx,ny,s);
        const edge=(nx<ox||ny<oy||nx>=ox+SIDE||ny>=oy+SIDE);
        if(edge&&lod>0) nH-=2*s;   // a skirt at the chunk's edge hides gaps against a finer or coarser neighbour
        if(nH>=H) continue;
        const fc=cellOf(Math.max(0,Math.min(N-1,nx)),Math.max(0,Math.min(N-1,ny)),s);
        side(B,x,y,s,d,Math.max(nH,H-64),H,H,fc[0],fc[1],mat,s===1?AOS:AO1); } }
    if(lod===0){ for(let y=oy;y<oy+SIDE;y++)for(let x=ox;x<ox+SIDE;x++){ const i=y*N+x; if(slabT[i]<=slabB[i]) continue;
        const zb=slabB[i], zt=slabT[i], mat=colMat[i]>=5?colMat[i]:5+Math.min(9,W.ruin[i]);
        let skip=0; const cov=function(j){ return slabT[j]>slabB[j]&&slabB[j]<=zb&&slabT[j]>=zt; };
        if(cov(i+1)) skip|=2; if(cov(i-1)) skip|=4; if(cov(i+N)) skip|=8; if(cov(i-N)) skip|=16;
        B.sl=1; box(B,x,y,zb,x+1,y+1,zt,x,y,mat,skip); B.sl=0; } }
    if(lod<=3){ for(let y=oy;y<oy+SIDE;y++)for(let x=ox;x<ox+SIDE;x++) voxTree(B,x,y,lod===0); }
    const vb=gl.createBuffer(), ib=gl.createBuffer(), vao=gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,vb); gl.bufferData(gl.ARRAY_BUFFER,new Uint8Array(B.vb,0,B.nv*VSZ),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,4,gl.SHORT,false,VSZ,0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,2,gl.UNSIGNED_SHORT,false,VSZ,8);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2,4,gl.UNSIGNED_BYTE,false,VSZ,12);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,B.idx.subarray(0,B.ni),gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    stats.verts+=B.nv; stats.chunks++; if(B.full) stats.full=(stats.full||0)+1;
    return {vao:vao,vb:vb,ib:ib,n:B.ni,full:B.full,nv:B.nv,used:frameNo}; }
  const SIDE=32, CH=N/SIDE, STRIDES=[1,2,4,8];
  const chunks=new Array(CH*CH*4), chunkMin=new Float32Array(CH*CH), chunkMax=new Float32Array(CH*CH);
  const stats={verts:0,chunks:0}; let frameNo=0;
  function freeChunks(){ for(let k=0;k<chunks.length;k++){ const c=chunks[k]; if(c){ gl.deleteBuffer(c.vb); gl.deleteBuffer(c.ib); gl.deleteVertexArray(c.vao); chunks[k]=null; } } stats.verts=0; stats.chunks=0; }
  function chunkBounds(){ for(let cy=0;cy<CH;cy++)for(let cx=0;cx<CH;cx++){ let lo=1e9,hi=-1e9;
      for(let y=cy*SIDE;y<cy*SIDE+SIDE;y++)for(let x=cx*SIDE;x<cx*SIDE+SIDE;x++){ const i=y*N+x; const g=colTop[i]; if(g<lo)lo=g;
        const v=Math.max(g,slabT[i])+(W.tree[i]>0?W.tree[i]+2:0); if(v>hi)hi=v; }
      chunkMin[cy*CH+cx]=Math.min(lo-64,A.WATER); chunkMax[cy*CH+cx]=hi+2; } }
  // material colors for the keep and ruin stone, the same table the raycaster uses
  const matF=new Float32Array(30), matT=new Float32Array(30), matCH=new Float32Array(10);
  for(let m=0;m<10;m++){ const M=A.RMAT[m]||A.RMAT[0]; for(let k=0;k<3;k++){ matF[m*3+k]=M.f[k]/255; matT[m*3+k]=M.t[k]/255; } matCH[m]=M.ch; }
  // ---- sprites: an atlas of every creature and keeper frame, built from the same pixel masks ----
  const SLOT_W=16, SLOT_H=32, ACOLS=16; const slots=[]; const atlasMap={};
  function addSlot(key,w,h,px,pal,glowIdx){ slots.push({key:key,w:w,h:h,px:px,pal:pal,glow:glowIdx}); atlasMap[key]=slots.length-1; }
  for(let id=0;id<A.KMASK.length;id++){ const M=A.KMASK[id]; for(let v=0;v<M.views.length;v++) for(let f=0;f<M.views[v].length;f++) addSlot('k'+id+'_'+v+'_'+f,16,32,M.views[v][f],M.pal,9); }
  for(const sp in A.MASKS){ const M=A.MASKS[sp]; addSlot('m'+sp,M.w,M.h,M.px,M.pal,9); }
  { const BW=16,BH=8; for(let fr=0;fr<2;fr++){ const px=new Uint8Array(BW*BH);   // birds: a small dark wing-beat V
      for(let x=0;x<BW;x++){ const ax=Math.abs(x-7.5)/7.5; const y=Math.round(fr?(2+3.5*ax):(5-3*ax+2*ax*ax)); for(let d=0;d<2;d++){ const yy=Math.min(BH-1,Math.max(0,y+d)); px[yy*BW+x]=1; } }
      px[4*BW+7]=1; px[4*BW+8]=1; addSlot('b'+fr,BW,BH,px,[null,[46,44,54]],-1); } }
  const ARows=Math.ceil(slots.length/ACOLS), AW=ACOLS*SLOT_W, AH=ARows*SLOT_H, atlas=new Uint8Array(AW*AH*4);
  const slotUV=[];
  slots.forEach(function(s,i){ const ox=(i%ACOLS)*SLOT_W, oy=((i/ACOLS)|0)*SLOT_H;
    for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){ const pi=s.px[y*s.w+x]; if(!pi) continue; const c=s.pal[pi]||[255,0,255]; const o=((oy+y)*AW+ox+x)*4;
      atlas[o]=c[0]; atlas[o+1]=c[1]; atlas[o+2]=c[2]; atlas[o+3]=(pi===s.glow)?128:255; }
    slotUV.push([ox/AW,oy/AH,(ox+s.w)/AW,(oy+s.h)/AH]); });
  const texA=tex(AW,AH,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,gl.NEAREST,gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D,texA); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,AW,AH,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
  const SPMAX=400, spData=new Float32Array(SPMAX*16); let nSpr=0;
  const vaoSp=gl.createVertexArray(), vbSp=gl.createBuffer();
  gl.bindVertexArray(vaoSp); gl.bindBuffer(gl.ARRAY_BUFFER,vbSp); gl.bufferData(gl.ARRAY_BUFFER,spData.byteLength,gl.DYNAMIC_DRAW);
  for(let a=0;a<4;a++){ gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,4,gl.FLOAT,false,64,a*16); gl.vertexAttribDivisor(a,1); }
  gl.bindVertexArray(null);
  const vaoEmpty=gl.createVertexArray();

  // the cloud field does not repeat on its own, and a smooth texture shows that edge as a straight line across the sky;
  // blend it with copies shifted half a tile so the edges meet, then restore the contrast the blend took out
  function seamless(src){ const S=256, out=new Uint8Array(S*S); let mean=0; for(let i=0;i<S*S;i++) mean+=src[i]; mean/=S*S;
    for(let y=0;y<S;y++){ const wy=Math.pow(Math.sin(Math.PI*y/S),2), y2=(y+128)&255;
      for(let x=0;x<S;x++){ const wx=Math.pow(Math.sin(Math.PI*x/S),2), x2=(x+128)&255;
        const a=wx*wy, b=(1-wx)*wy, c=wx*(1-wy), d=(1-wx)*(1-wy);
        const v=a*src[y*S+x]+b*src[y*S+x2]+c*src[y2*S+x]+d*src[y2*S+x2], k=1/Math.sqrt(a*a+b*b+c*c+d*d);
        out[y*S+x]=Math.max(0,Math.min(255,Math.round(mean+(v-mean)*k))); } }
    return out; }
  let sig='', relPass=-1, relRow=0;
  function worldSig(){ const D=A.DIALS; return W.seed+'|'+D.keep+'|'+D.forest+'|'+D.water+'|'+D.ruins+'|'+W.ruins.length+'|'+W.keepBuilt; }

  // ---- wall decorations ----
  let PD=null; try{ PD=prog(VS_DECO,FS_DECO); }catch(e){ PD=null; }
  const vaoD=gl.createVertexArray(), vbD=gl.createBuffer(); let nDeco=0, texD=null;
  gl.bindVertexArray(vaoD); gl.bindBuffer(gl.ARRAY_BUFFER,vbD);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,2,gl.FLOAT,false,28,12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2,2,gl.FLOAT,false,28,20);
  gl.bindVertexArray(null);
  function buildDeco(){ nDeco=0; const L=A.DECO||[], IM=A.DECO_IMG||{}; if(!PD||!L.length) return;
    const names=Object.keys(IM); let AW=0, AH=1; const at={};
    for(const k of names){ at[k]=AW; AW+=IM[k].w+1; AH=Math.max(AH,IM[k].h); }
    if(!texD){ const px=new Uint8Array(AW*AH*4);
      for(const k of names){ const I=IM[k], ox=at[k]; for(let y=0;y<I.h;y++)for(let x=0;x<I.w;x++){ const p=I.px[y*I.w+x]; if(!p) continue;
        const c=I.pal[p], o=(y*AW+ox+x)*4; px[o]=c[0]; px[o+1]=c[1]; px[o+2]=c[2]; px[o+3]=(I.glow&&p>1&&p<8)?204:255; } }
      texD=tex(AW,AH,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,gl.NEAREST,gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D,texD); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,AW,AH,gl.RGBA,gl.UNSIGNED_BYTE,px); }
    const v=[];
    for(const d of L){ const I=IM[d.img]; if(!I) continue;
      const u0=(at[d.img]+0.01)/AW, u1=(at[d.img]+I.w-0.01)/AW, t0=0.01/AH, t1=(I.h-0.01)/AH;
      let ua=u0, ub=u1; if((d.axis==='y'&&d.ny<0)||(d.axis==='x'&&d.nx>0)){ ua=u1; ub=u0; }
      const qa=d.axis==='y'?[d.a,d.p]:[d.p,d.a], qb=d.axis==='y'?[d.b,d.p]:[d.p,d.b];
      const cx=Math.max(0,Math.min(N-1,Math.floor((qa[0]+qb[0])/2+d.nx*0.5))), cy=Math.max(0,Math.min(N-1,Math.floor((qa[1]+qb[1])/2+d.ny*0.5)));
      const V=function(q,z,u,t){ v.push(q[0],q[1],z,u,t,cx,cy); };
      V(qa,d.z0Abs,ua,t1); V(qb,d.z0Abs,ub,t1); V(qb,d.z1Abs,ub,t0); V(qa,d.z0Abs,ua,t1); V(qb,d.z1Abs,ub,t0); V(qa,d.z1Abs,ua,t0); }
    gl.bindBuffer(gl.ARRAY_BUFFER,vbD); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW); nDeco=v.length/7; }
  function rebuild(){ buildDeco();
    freeChunks(); buildColumns(); chunkBounds();
    gl.bindTexture(gl.TEXTURE_2D,texH); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,N,N,gl.RED,gl.FLOAT,W.h);
    gl.bindTexture(gl.TEXTURE_2D,texCl); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,256,256,gl.RED,gl.UNSIGNED_BYTE,seamless(W.cloud));
    gl.bindTexture(gl.TEXTURE_2D,texCl2); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,256,256,gl.RED,gl.UNSIGNED_BYTE,seamless(W.cloud2));
    for(let c=0;c<CH*CH;c++) chunks[c*4+3]=buildChunk(c%CH,(c/CH)|0,3);   // the coarsest level, everywhere, so nothing is ever missing
    uploadRows(0,N); relPass=A.RELIGHT.passes; relRow=A.RELIGHT.row; sig=worldSig(); }
  // the sun moves: the core re-lights a couple of rows of the map each frame; send those rows to the chip as they change
  function syncLight(){ const RL=A.RELIGHT;
    if(RL.passes-relPass>1){ uploadRows(0,N); relPass=RL.passes; relRow=RL.row; return; }
    if(RL.passes!==relPass){ uploadRows(Math.max(0,relRow-3),N); relPass=RL.passes; relRow=0; }
    if(RL.row!==relRow){ uploadRows(Math.max(0,relRow-3),RL.row+1); relRow=RL.row; } }

  // ---- size ----
  let scale=1;
  function resize(){ const dpr=Math.min(window.devicePixelRatio||1,1.6)*scale;
    const w=Math.max(1,Math.round(window.innerWidth*dpr)), h=Math.max(1,Math.round(window.innerHeight*dpr));
    if(canvas.width!==w) canvas.width=w; if(canvas.height!==h) canvas.height=h;
    canvas.style.width=window.innerWidth+'px'; canvas.style.height=window.innerHeight+'px'; }

  // ---- per frame ----
  function common(P,U,vp){ gl.useProgram(P.p);
    const set=function(n,f){ if(P.u[n]!=null) f(P.u[n]); };
    set('uVP',function(l){ gl.uniformMatrix4fv(l,false,vp); });
    set('uEye',function(l){ gl.uniform3f(l,U.ex,U.ey,U.ez); });
    set('uFog',function(l){ gl.uniform3f(l,U.fog[0],U.fog[1],U.fog[2]); });
    set('uTint',function(l){ gl.uniform3f(l,U.tint[0],U.tint[1],U.tint[2]); });
    set('uFogK',function(l){ gl.uniform1f(l,0.0032); });
    set('uUW',function(l){ gl.uniform1f(l,U.uw); });
    set('uScr',function(l){ gl.uniform2f(l,canvas.width,canvas.height); });
    set('uLight',function(l){ gl.uniform3f(l,U.L.x,U.L.y,U.L.z); });
    set('uNight',function(l){ gl.uniform1f(l,U.night); });
    set('uTime',function(l){ gl.uniform1f(l,U.time); });
    set('uRight',function(l){ gl.uniform2f(l,U.rx,U.ry); });
    set('uNL',function(l){ gl.uniform1i(l,U.nl); });
    set('uLP',function(l){ gl.uniform4fv(l,U.lp); });
    set('uLC',function(l){ gl.uniform4fv(l,U.lc); }); }
  function bindTex(P,name,unit,t){ if(P.u[name]==null) return; gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,t); gl.uniform1i(P.u[name],unit); }
  function skyUniforms(P,U){ const S=A.SKY, SUN=A.SUN, MOON=A.MOON, u=P.u;
    gl.uniform3f(u.uSkyT,S.tr/255,S.tg/255,S.tb/255); gl.uniform3f(u.uSkyH,S.hr/255,S.hg/255,S.hb/255);
    gl.uniform3f(u.uSkyC,S.cr/255,S.cg/255,S.cb/255); gl.uniform3f(u.uSunC,S.sr/255,S.sg/255,S.sb/255);
    gl.uniform4f(u.uSkyK,S.nd,S.du,S.cl,S.hx); gl.uniform1f(u.uSkyHy,S.hy);
    const sl=Math.hypot(SUN.x,SUN.y,SUN.z)||1, ml=Math.hypot(MOON.x,MOON.y,MOON.z)||1;
    gl.uniform4f(u.uSun,SUN.x/sl,SUN.y/sl,SUN.z/sl,SUN.z); gl.uniform4f(u.uMoon,MOON.x/ml,MOON.y/ml,MOON.z/ml,MOON.z);
    gl.uniform1f(u.uCloudH,A.CLOUDH);
    bindTex(P,'uCl',5,texCl); bindTex(P,'uCl2',6,texCl2); }

  const lp=new Float32Array(64), lc=new Float32Array(64);
  function gather(px,py,pz,yaw,rx,ry,night){
    const C=A.CR_, SP=A.SP, SPP=A.SPP, R2=130*130; let k=0, nl=0; const DK=A.DAY.k<0.6;
    for(let c=0;c<C.n;c++){ if(C.al[c]===0) continue; const sp=C.sp[c], x=C.x[c], y=C.y[c], z=C.z[c], ex=x-px, ey=y-py;
      if(ex*ex+ey*ey>R2) continue;
      if((sp===SP.KEEPER||sp===SP.FIRE)&&nl<16&&night>0.02){ const low=C.po[c]===4;
        lp[nl*4]=x; lp[nl*4+1]=y; lp[nl*4+2]=z+(sp===SP.FIRE?1.0:0.9); lp[nl*4+3]=sp===SP.FIRE?3.6:(low?1.8:2.6);
        lc[nl*4]=night*(sp===SP.FIRE?1.1:(low?0.4:0.72)); nl++; }
      if(k>=SPMAX) continue;
      const o=k*16; const ci=(Math.max(0,Math.min(N-1,y|0)))*N+Math.max(0,Math.min(N-1,x|0));
      const shd=W.shadRaw[ci]; let amb=(shd>0.99&&A.DAY.lightAlt>0.035)?0.92:(0.56+0.36*shd);
      if(sp===SP.KEEPER){ const id=Math.min(3,C.ay[c]|0), hx=C.vx[c], hy=C.vy[c], hl=Math.hypot(hx,hy)||1, tl=Math.hypot(ex,ey)||1;
        const dot=-(hx*ex+hy*ey)/(hl*tl), v=dot>0.42?0:(dot<-0.42?2:1), mir=(v===1&&(hx*rx+hy*ry)<0)?1:0, fr=A.keeperPoseFrame(c);
        const uv=slotUV[atlasMap['k'+id+'_'+v+'_'+fr]]; const ln=A.KMASK[id].lan[v][fr];
        const P_=SPP[SP.KEEPER];
        spData.set([x,y,z,0, P_.wsize,P_.hsize,0,amb, uv[0],uv[1],uv[2],uv[3], ln[0],ln[1],mir,1],o); k++; continue; }
      const P_=SPP[sp], g=A.growOf(c);
      if(sp===SP.BIRD){ const fr=Math.sin(A.skyTime()*7+c*1.7)>0?1:0, uv=slotUV[atlasMap['b'+fr]];
        spData.set([x,y,z+P_.hsize*g*0.2,0, P_.wsize*g,P_.hsize*g*0.55,0,1, uv[0],uv[1],uv[2],uv[3], -1,0,0,0],o); k++; continue; }
      const key='m'+sp; if(atlasMap[key]==null) continue; const uv=slotUV[atlasMap[key]];
      // the masks face right; turn them to face the way the animal walks, as seen from here
      const mir=(C.vx[c]*(-Math.sin(yaw))+C.vy[c]*Math.cos(yaw)<0)?1:0;
      spData.set([x,y,z,0, P_.wsize*g,P_.hsize*g,0,amb, uv[0],uv[1],uv[2],uv[3], -1,0,mir,sp>=SP.KEEPER?1:0],o); k++; }
    nSpr=k; return nl; }

  function draw(){
    if(!R.ok) return;
    if(worldSig()!==sig) rebuild();
    syncLight();
    resize();
    const P=A.P, DAY=A.DAY, px=P.x, py=P.y, pz=P.z, yaw=P.yaw, pa=Math.atan(P.pitch||0);
    const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pa), spp=Math.sin(pa);
    const fx=cy*cp, fy=sy*cp, fz=spp, rx=-sy, ry=cy, ux=-cy*spp, uy=-sy*spp, uz=cp;
    // view rows: right, up, -forward (the world's y runs south, so the right-hand side is -fy,fx as in the raycaster)
    const view=new Float32Array([rx,ux,-fx,0, ry,uy,-fy,0, 0,uz,-fz,0, -(rx*px+ry*py),-(ux*px+uy*py+uz*pz),(fx*px+fy*py+fz*pz),1]);
    const asp=canvas.width/canvas.height, fovV=A.RS.fovV||0.66;
    const proj=persp(2*Math.atan(fovV),asp,0.08,760), vp=mul(proj,view), ivp=inv(vp);
    const night=Math.max(0,Math.min(1,(0.6-DAY.k)/0.6));
    const fogA=A.fog();
    const U={ex:px,ey:py,ez:pz,fog:[fogA[0]/255,fogA[1]/255,fogA[2]/255],tint:[DAY.tr,DAY.tg,DAY.tb],uw:A.uw(),L:DAY.light,night:night,time:A.skyTime(),rx:rx,ry:ry,nl:0,lp:lp,lc:lc};
    U.nl=gather(px,py,pz,yaw,rx,ry,night);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
    gl.depthMask(true); gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    // sky first, behind everything
    gl.disable(gl.DEPTH_TEST); common(PSK,U,vp); gl.uniformMatrix4fv(PSK.u.uInv,false,ivp); skyUniforms(PSK,U);
    gl.bindVertexArray(vaoEmpty); gl.drawArrays(gl.TRIANGLES,0,3);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    // blocks, chunk by chunk: finer near you; a chunk whose level is not built yet shows a coarser one until it is
    common(PV,U,vp); bindTex(PV,'uC',1,texC); bindTex(PV,'uT',2,texT);
    gl.uniform3fv(PV.u.uMatF,matF); gl.uniform3fv(PV.u.uMatT,matT); gl.uniform1fv(PV.u.uMatCH,matCH);
    const tb=performance.now()+5; let built=0; frameNo++;
    // every few seconds, hand back the finer blocks of chunks nobody has looked at for a while (the coarsest stay)
    if((frameNo&255)===0){ for(let k=0;k<chunks.length;k++){ const c=chunks[k]; if(c&&(k&3)!==3&&frameNo-c.used>900){ gl.deleteBuffer(c.vb); gl.deleteBuffer(c.ib); gl.deleteVertexArray(c.vao); stats.verts-=c.nv; stats.chunks--; chunks[k]=null; } } }
    for(let c=0;c<CH*CH;c++){ const cx=c%CH, cy=(c/CH)|0, ox=cx*SIDE, oy=cy*SIDE;
      if(!chunkVisible(vp,ox,oy,ox+SIDE,oy+SIDE,chunkMin[c],chunkMax[c])) continue;
      const d=Math.max(0,Math.hypot(ox+SIDE/2-px,oy+SIDE/2-py)-SIDE*0.71);
      const want=d<64?0:d<160?1:d<300?2:3;
      let l=want; if(!chunks[c*4+l]&&(built===0||performance.now()<tb)){ chunks[c*4+l]=buildChunk(cx,cy,l); built++; }
      while(!chunks[c*4+l]&&l<3) l++;
      const ch=chunks[c*4+l]; if(!ch) continue; ch.used=frameNo; if(!ch.n) continue;
      gl.bindVertexArray(ch.vao); gl.drawElements(gl.TRIANGLES,ch.n,gl.UNSIGNED_INT,0); }
    if(nDeco){ common(PD,U,vp); bindTex(PD,'uD',4,texD); bindTex(PD,'uC',1,texC);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1,-2); gl.bindVertexArray(vaoD); gl.drawArrays(gl.TRIANGLES,0,nDeco); gl.disable(gl.POLYGON_OFFSET_FILL); }
    if(nSpr){ common(PSP,U,vp); bindTex(PSP,'uA',3,texA); gl.bindVertexArray(vaoSp); gl.bindBuffer(gl.ARRAY_BUFFER,vbSp);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,spData,0,nSpr*16); gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,nSpr); }
    // water last, see-through near the shore
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    common(PW,U,vp); skyUniforms(PW,U); bindTex(PW,'uH',0,texH); gl.uniform1f(PW.u.uWater,A.WATER-0.12);   // just under a block top at the waterline, so the two never flicker
    gl.bindVertexArray(vaoEmpty); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
  }
  // a chunk is drawn if any corner of its box is in front of the camera and inside the side planes (with slack)
  function chunkVisible(m,x0,y0,x1,y1,z0,z1){ let left=0,right=0,below=0,above=0,behind=0;
    for(let k=0;k<8;k++){ const x=(k&1)?x1:x0, y=(k&2)?y1:y0, z=(k&4)?z1:z0;
      const cx=m[0]*x+m[4]*y+m[8]*z+m[12], cyy=m[1]*x+m[5]*y+m[9]*z+m[13], cw=m[3]*x+m[7]*y+m[11]*z+m[15];
      if(cw<0.05) behind++; if(cx<-cw) left++; if(cx>cw) right++; if(cyy<-cw) below++; if(cyy>cw) above++; }
    return !(behind===8||left===8||right===8||below===8||above===8); }

  R.draw=draw; R.resize=resize; R.rebuild=rebuild; R.canvas=canvas; R.stats=stats;
  R.show=function(on){ if(on&&!R.shown&&R.ok){ uploadRows(0,N); relPass=A.RELIGHT.passes; relRow=A.RELIGHT.row; } R.shown=!!on; canvas.style.display=on?'block':'none'; };
  R.scale=1;
  R.setScale=function(s){ scale=Math.max(0.5,Math.min(1,s)); R.scale=scale; resize(); };
  R.destroy=function(){ try{ const e=gl.getExtension('WEBGL_lose_context'); if(e) e.loseContext(); }catch(e){} canvas.remove(); R.ok=false; };
  try{ rebuild(); resize(); R.ok=true; }catch(e){ R.error=String(e&&e.message||e).slice(0,300); canvas.remove(); }
  return R;
}
window.KeepVoxel={ create:create, version:'v0.19.0' };
})();
