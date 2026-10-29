// The Keep · render-mesh.js · v0.19.0 · Oct 29 2026
// The same world drawn the way most 3D games draw theirs: triangles on the graphics chip (WebGL2).
// Nothing here makes the world. It reads the exact arrays the ASCII raycaster reads (heights, stone,
// slabs, trees, the lit colors and shadows) and turns them into meshes. Loaded only when Mesh is picked.
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

const VS_TERR=HEAD+`
uniform sampler2D uH; uniform ivec2 uOff; uniform int uSide; uniform ivec4 uEdge; // stride of the chunk to the -x, +x, -y, +y
out vec3 vW;
float hAt(ivec2 c){ return texelFetch(uH,min(c,ivec2(511)),0).r; }
void main(){ int lx=gl_VertexID%(uSide+1), ly=gl_VertexID/(uSide+1);
  ivec2 c=uOff+ivec2(lx,ly); float h=hAt(c);
  // where a coarser chunk is next door, lie on its edge so no crack opens between them
  int s=0; bool alongY=false;
  if(lx==0&&uEdge.x>1){ s=uEdge.x; alongY=true; } else if(lx==uSide&&uEdge.y>1){ s=uEdge.y; alongY=true; }
  else if(ly==0&&uEdge.z>1){ s=uEdge.z; } else if(ly==uSide&&uEdge.w>1){ s=uEdge.w; }
  if(s>1){ int v=alongY?c.y:c.x; int v0=(v/s)*s; if(v0!=v){ float t=float(v-v0)/float(s);
      ivec2 a=alongY?ivec2(c.x,v0):ivec2(v0,c.y), b=alongY?ivec2(c.x,v0+s):ivec2(v0+s,c.y); h=mix(hAt(a),hAt(b),t); } }
  vec3 p=vec3(float(min(c.x,511)),float(min(c.y,511)),h); vW=p; gl_Position=uVP*vec4(p,1.0); }`;
const FS_TERR=HEAD+FINISH+`
uniform sampler2D uC; in vec3 vW; out vec4 o;
void main(){ vec4 t=texture(uC,vW.xy/512.0);
  float n=0.94+0.12*hash(floor(vW.xy*3.0))+0.05*hash(floor(vW.xy*0.7));
  vec3 c=t.rgb*t.a*n;
  o=vec4(finish(c,vec3(0.0),vW,uNight>0.0?pool(vW):0.0),1.0); }`;

// stone: mass tops (0), mass faces (1), slab tops (2), slab undersides (3), slab faces (4)
const VS_STONE=HEAD+`
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec3 aCol;
layout(location=3) in vec4 aAux; layout(location=4) in vec4 aMat;
out vec3 vW; flat out vec3 vN; flat out vec3 vCol; flat out vec4 vAux; flat out vec4 vMat; out float vAlong;
void main(){ vW=aPos; vN=aNrm; vCol=aCol; vAux=aAux; vMat=aMat; vAlong=aAux.w; gl_Position=uVP*vec4(aPos,1.0); }`;
const FS_STONE=HEAD+FINISH+`
uniform sampler2D uC; uniform sampler2D uT;
in vec3 vW; flat in vec3 vN; flat in vec3 vCol; flat in vec4 vAux; flat in vec4 vMat; in float vAlong; out vec4 o;
float bricks(out float bi, out float zi){ float ch=vMat.x, cl=vMat.y;
  if(ch>0.0){ float cz=vW.z/ch; zi=floor(cz); float fz=cz-zi; float av=(vAlong+(mod(zi,2.0)>0.5?0.55:0.0))/cl; bi=floor(av); float fb=av-bi;
    return (0.90+0.14*hash(vec2(bi,zi*3.0+1.0)))*((fz<0.08||fb<0.06)?0.78:1.0); }
  zi=floor(vW.z*1.3); bi=floor(vAlong*1.3);
  return 0.86+0.20*hash(vec2(bi,zi)+17.0)+0.08*hash(floor(vec2(bi,zi)*0.5)+19.0); }
void main(){ int k=int(vAux.x+0.5); ivec2 cell=ivec2(vAux.yz); vec3 c;
  if(k==0){ float sh=texelFetch(uC,cell,0).a; vec3 tc=vCol; if(vMat.z>0.0&&hash(vec2(cell)+13.0)<vMat.z*0.5) tc=mix(tc,vec3(92.,124.,62.)/255.,0.55);
    c=tc*(0.94+0.14*hash(vec2(cell)))*sh; }
  else if(k==2){ float sh=texelFetch(uT,cell,0).a; c=vCol*(0.94+0.14*hash(vec2(cell)))*sh; }
  else if(k==3){ float sh=texelFetch(uT,cell,0).a; c=vCol*0.83*sh; }
  else { float sh=k==4?texelFetch(uT,cell,0).a:texelFetch(uC,cell,0).a;
    float lit=0.64+0.46*max(0.0,dot(vN.xy,uLight.xy)); float bi,zi; float bl=bricks(bi,zi)*lit;
    c=vCol*bl*sh;
    float moss=vMat.z; if(moss>0.0){ float gz=vW.z-vMat.w; float m=0.0;
      if(gz<0.35+0.5*hash(vec2(bi,7.0))) m=moss*0.9; else if(hash(vec2(bi,zi)+29.0)<moss*0.22) m=moss*0.75;
      c=mix(c,vec3(92.,124.,62.)/255.*bl*sh,m*0.7); } }
  o=vec4(finish(c,vec3(0.0),vW,uNight>0.0?pool(vW):0.0),1.0); }`;

// trees: one small lathe mesh, instanced. The crown shape follows the same three profiles as the raycaster.
const VS_TREE=HEAD+`
layout(location=0) in vec3 aB; layout(location=1) in vec4 iA; layout(location=2) in vec4 iB;
uniform sampler2D uC; uniform sampler2D uT;
out vec3 vW; out vec3 vCol;
void main(){ float q=aB.x, a=aB.y, s=aB.z; float base=iA.z, th=iA.w, top=base+th, rcw=iB.x, tj=iB.z, trw=iB.w; int tt=int(iB.y+0.5);
  float cb0; float ctop;
  if(tt==0){ cb0=base+th*(0.06+0.16*tj); ctop=top-(top-cb0)*(0.22*q+0.78*q*q); }
  else if(tt==1){ cb0=base+th*(0.36+0.22*tj); ctop=cb0+(top-cb0)*sqrt(max(0.0,1.0-q*q)); }
  else { cb0=base+th*(0.22+0.24*tj); ctop=cb0+(top-cb0)*(1.0-(0.5+0.4*tj)*q*q); }
  ivec2 cell=ivec2(floor(iA.xy)); float shc=texelFetch(uC,cell,0).a; vec3 tc=texelFetch(uT,cell,0).rgb;
  vec2 dir=vec2(cos(a),sin(a)); vec3 p;
  if(s<1.5){ float z=s<0.5?ctop:cb0; p=vec3(iA.xy+dir*q*rcw,z);
    float side=0.10*q*dot(dir,uLight.xy);
    vCol=tc*(0.62+0.38*(1.0-q)+side)*shc; }
  else { float z=s<2.5?base-0.3:cb0+0.2; p=vec3(iA.xy+dir*trw,z);
    vCol=vec3(76.,54.,36.)/255.*(0.80+0.25*dot(dir,uLight.xy))*shc; }
  vW=p; gl_Position=uVP*vec4(p,1.0); }`;
const FS_TREE=HEAD+FINISH+`
in vec3 vW; in vec3 vCol; out vec4 o;
void main(){ float n=0.92+0.14*hash(floor(vW*2.2).xy+floor(vW.z*2.2));
  o=vec4(finish(vCol*n,vec3(0.0),vW,uNight>0.0?pool(vW):0.0),1.0); }`;

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
  canvas.id='glc'; canvas.setAttribute('aria-hidden','true');
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
  let PT,PS,PTR,PSP,PSK,PW;
  try{ PT=prog(VS_TERR,FS_TERR); PS=prog(VS_STONE,FS_STONE); PTR=prog(VS_TREE,FS_TREE); PSP=prog(VS_SPR,FS_SPR); PSK=prog(VS_SKY,FS_SKY); PW=prog(VS_WATER,FS_WATER); }
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

  // ---- terrain: 16 x 16 chunks of 32 x 32 cells, one shared index list, culled per chunk ----
  const SIDE=32, CH=N/SIDE;
  const vaoT=gl.createVertexArray(); gl.bindVertexArray(vaoT);
  const STRIDES=[1,2,4,8], lodOff=[], lodCnt=[]; { const all=[]; const s=SIDE+1;
    for(const st of STRIDES){ lodOff.push(all.length*2); let n=0;
      for(let y=0;y<SIDE;y+=st)for(let x=0;x<SIDE;x+=st){ const a=y*s+x, b=a+st, c=a+st*s, d=c+st; all.push(a,b,c,b,d,c); n+=6; }
      lodCnt.push(n); }
    const ibT=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibT); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(all),gl.STATIC_DRAW); }
  const chunkLod=new Int8Array(CH*CH);
  gl.bindVertexArray(null);
  const chunkMin=new Float32Array(CH*CH), chunkMax=new Float32Array(CH*CH);

  // ---- stone ----
  const vaoS=gl.createVertexArray(), vbS=gl.createBuffer(); let nStone=0;
  gl.bindVertexArray(vaoS); gl.bindBuffer(gl.ARRAY_BUFFER,vbS);
  { const F=4, st=17*F; gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,st,0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,3,gl.FLOAT,false,st,3*F);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2,3,gl.FLOAT,false,st,6*F);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3,4,gl.FLOAT,false,st,9*F);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4,4,gl.FLOAT,false,st,13*F); }
  gl.bindVertexArray(null);

  // ---- trees: a full lathe near you, a light one farther off; the split is redone as you walk ----
  function lathe(S,QS,trunk){ const v=[]; const P=function(a){ v.push(a[0],a[1],a[2]); };
    const rings=QS.slice(1).map(function(q,ri){ const r=[]; for(let i=0;i<S;i++) r.push([q,(i+0.5*(ri&1))/S*Math.PI*2,0]); return r; });
    for(let i=0;i<S;i++){ P([0,0,0]); P(rings[0][i]); P(rings[0][(i+1)%S]); }
    for(let b=0;b<rings.length-1;b++){ const A0=rings[b], B0=rings[b+1];
      for(let i=0;i<S;i++){ const j=(i+1)%S; P(A0[i]); P(B0[i]); P(A0[j]); P(A0[j]); P(B0[i]); P(B0[j]); } }
    const last=rings[rings.length-1], skirt=last.map(function(r){ return [r[0],r[1],1]; });
    for(let i=0;i<S;i++){ const j=(i+1)%S; P(last[i]); P(skirt[i]); P(last[j]); P(last[j]); P(skirt[i]); P(skirt[j]); }
    for(let i=0;i<S;i++){ P([0,0,1]); P(skirt[(i+1)%S]); P(skirt[i]); }
    if(trunk){ const T=6; for(let i=0;i<T;i++){ const a0=i/T*Math.PI*2, a1=(i+1)/T*Math.PI*2;
      P([1,a0,2]); P([1,a0,3]); P([1,a1,2]); P([1,a1,2]); P([1,a0,3]); P([1,a1,3]); } }
    return new Float32Array(v); }
  function treeVao(base){ const vao=gl.createVertexArray(), vb=gl.createBuffer(), ib=gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,vb); gl.bufferData(gl.ARRAY_BUFFER,base,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,12,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,ib);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,4,gl.FLOAT,false,32,0); gl.vertexAttribDivisor(1,1);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2,4,gl.FLOAT,false,32,16); gl.vertexAttribDivisor(2,1);
    gl.bindVertexArray(null); return {vao:vao,ib:ib,nv:base.length/3,n:0}; }
  const TN=treeVao(lathe(7,[0,0.35,0.65,0.86,1],true)), TF=treeVao(lathe(5,[0,0.55,1],false));
  let allTrees=new Float32Array(0), nAll=0, splitX=-1e9, splitY=-1e9;
  const NEAR_T=90;
  function splitTrees(px,py){ splitX=px; splitY=py; const near=[], far=[], R2=NEAR_T*NEAR_T;
    for(let k=0;k<nAll;k++){ const o=k*8, dx=allTrees[o]-px, dy=allTrees[o+1]-py, d2=dx*dx+dy*dy; if(d2>420*420) continue; const dst=(d2<R2)?near:far; for(let j=0;j<8;j++) dst.push(allTrees[o+j]); }
    gl.bindBuffer(gl.ARRAY_BUFFER,TN.ib); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(near),gl.DYNAMIC_DRAW); TN.n=near.length/8;
    gl.bindBuffer(gl.ARRAY_BUFFER,TF.ib); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(far),gl.DYNAMIC_DRAW); TF.n=far.length/8; }

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

  // ---- build the static meshes from the world ----
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
  function buildStone(){
    const h=W.h, st=W.st, sb=W.sb, su=W.su, ruin=W.ruin, RM=A.RMAT, out=[]; let n=0;
    const V=function(x,y,z,nx,ny,nz,c,k,cx,cy,al,M,bot){ out.push(x,y,z,nx,ny,nz,c[0]/255,c[1]/255,c[2]/255,k,cx,cy,al,M?M.ch:0,M?M.cl:1,M?M.moss:0,bot); n++; };
    const quad=function(a,b,c,d,nx,ny,nz,col,k,cx,cy,al,M,bot){ // a b c d around; along per corner
      V(a[0],a[1],a[2],nx,ny,nz,col,k,cx,cy,a[3],M,bot); V(b[0],b[1],b[2],nx,ny,nz,col,k,cx,cy,b[3],M,bot); V(c[0],c[1],c[2],nx,ny,nz,col,k,cx,cy,c[3],M,bot);
      V(a[0],a[1],a[2],nx,ny,nz,col,k,cx,cy,a[3],M,bot); V(c[0],c[1],c[2],nx,ny,nz,col,k,cx,cy,c[3],M,bot); V(d[0],d[1],d[2],nx,ny,nz,col,k,cx,cy,d[3],M,bot); };
    const H=function(x,y){ return h[Math.min(N-1,y)*N+Math.min(N-1,x)]; };
    const NB=[[1,0,1,0],[-1,0,-1,0],[0,1,0,1],[0,-1,0,-1]];
    for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){ const i=y*N+x, s=st[i];
      if(s>0.02){ const M=RM[ruin[i]]||RM[0];
        const z00=H(x,y)+s, z10=H(x+1,y)+s, z11=H(x+1,y+1)+s, z01=H(x,y+1)+s;
        quad([x,y,z00,0],[x+1,y,z10,0],[x+1,y+1,z11,0],[x,y+1,z01,0],0,0,1,M.t,0,x,y,0,M,0);
        for(let d=0;d<4;d++){ const nx=x+NB[d][0], ny=y+NB[d][1], j=ny*N+nx, s2=st[j]; if(s2>=s-0.01) continue;
          // the shared edge, its two corners, and the step from the neighbour's top up to this cell's top
          let ax,ay,bx,by; if(d===0){ ax=x+1;ay=y;bx=x+1;by=y+1; } else if(d===1){ ax=x;ay=y+1;bx=x;by=y; } else if(d===2){ ax=x+1;ay=y+1;bx=x;by=y+1; } else { ax=x;ay=y;bx=x+1;by=y; }
          const ha=H(ax,ay), hb=H(bx,by), alA=d<2?ay:ax, alB=d<2?by:bx;
          quad([ax,ay,ha+s2,alA],[bx,by,hb+s2,alB],[bx,by,hb+s,alB],[ax,ay,ha+s,alA],NB[d][0],NB[d][1],0,M.f,1,nx,ny,0,M,Math.min(ha,hb)+s2); } }
      if(su[i]>0){ const M=RM[ruin[i]]||RM[0], zg=h[i], zb=zg+sb[i], zt=zg+su[i];
        const top=M.t;
        quad([x,y,zt,0],[x+1,y,zt,0],[x+1,y+1,zt,0],[x,y+1,zt,0],0,0,1,top,2,x,y,0,M,0);
        quad([x,y,zb,0],[x,y+1,zb,0],[x+1,y+1,zb,0],[x+1,y,zb,0],0,0,-1,M.f,3,x,y,0,M,0);
        for(let d=0;d<4;d++){ const nx=x+NB[d][0], ny=y+NB[d][1], j=ny*N+nx;
          let ax,ay,bx,by; if(d===0){ ax=x+1;ay=y;bx=x+1;by=y+1; } else if(d===1){ ax=x;ay=y+1;bx=x;by=y; } else if(d===2){ ax=x+1;ay=y+1;bx=x;by=y+1; } else { ax=x;ay=y;bx=x+1;by=y; }
          const alA=d<2?ay:ax, alB=d<2?by:bx;
          const spans=[];
          if(su[j]<=0) spans.push([zb,zt]);
          else { const nb=h[j]+sb[j], nt=h[j]+su[j]; if(nb>zb+0.01) spans.push([zb,Math.min(zt,nb)]); if(nt<zt-0.01) spans.push([Math.max(zb,nt),zt]); }
          for(const sp of spans){ if(sp[1]<=sp[0]) continue;
            quad([ax,ay,sp[0],alA],[bx,by,sp[0],alB],[bx,by,sp[1],alB],[ax,ay,sp[1],alA],NB[d][0],NB[d][1],0,M.f,4,x,y,0,M,zg); } } } }
    gl.bindBuffer(gl.ARRAY_BUFFER,vbS); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(out),gl.STATIC_DRAW); nStone=n; }
  function buildTrees(){
    const tree=W.tree, tt=W.ttype, gh=W.gh, seed=W.seed, hash2=A.hash2, RC=0.92, out=[]; let n=0;
    for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){ const i=y*N+x, th=tree[i]; if(!(th>0)) continue;
      const t=tt[i], tw=0.55+1.35*hash2(x,y,seed+96), tj=hash2(x,y,seed+93);
      const rcw=RC*(t===0?1.05:t===1?1.85:1.62)*tw, trw=(t===0?0.085:0.12)*(0.85+0.5*hash2(x,y,seed+91));
      out.push(x+0.5,y+0.5,gh[i],th, rcw,t,tj,Math.max(0.10,trw*1.1)); n++; }
    allTrees=new Float32Array(out); nAll=n; splitX=-1e9; }
  function buildTerrain(){
    gl.bindTexture(gl.TEXTURE_2D,texH); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,N,N,gl.RED,gl.FLOAT,W.h);
    for(let cy=0;cy<CH;cy++)for(let cx=0;cx<CH;cx++){ let lo=1e9,hi=-1e9;
      for(let y=cy*SIDE;y<=Math.min(N-1,cy*SIDE+SIDE);y++)for(let x=cx*SIDE;x<=Math.min(N-1,cx*SIDE+SIDE);x++){ const v=W.h[y*N+x]+W.st[y*N+x]+W.tree[y*N+x]; const g=W.h[y*N+x]; if(g<lo)lo=g; if(v>hi)hi=v; }
      chunkMin[cy*CH+cx]=Math.min(lo,A.WATER); chunkMax[cy*CH+cx]=hi+2; } }

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
    buildTerrain(); buildStone(); buildTrees();
    gl.bindTexture(gl.TEXTURE_2D,texCl); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,256,256,gl.RED,gl.UNSIGNED_BYTE,seamless(W.cloud));
    gl.bindTexture(gl.TEXTURE_2D,texCl2); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,256,256,gl.RED,gl.UNSIGNED_BYTE,seamless(W.cloud2));
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
    // terrain, chunk by chunk, skipping chunks behind the camera
    common(PT,U,vp); bindTex(PT,'uH',0,texH); bindTex(PT,'uC',1,texC); gl.uniform1i(PT.u.uSide,SIDE);
    gl.bindVertexArray(vaoT);
    for(let c=0;c<CH*CH;c++){ const ox=(c%CH)*SIDE+SIDE/2-px, oy=((c/CH)|0)*SIDE+SIDE/2-py, d=Math.max(0,Math.hypot(ox,oy)-SIDE*0.71);
      chunkLod[c]=d<70?0:d<170?1:d<300?2:3; }
    const stOf=function(cx,cy,me){ if(cx<0||cy<0||cx>=CH||cy>=CH) return 1; const l=chunkLod[cy*CH+cx]; return l>me?STRIDES[l]:1; };
    for(let c=0;c<CH*CH;c++){ const cx=c%CH, cy=(c/CH)|0, ox=cx*SIDE, oy=cy*SIDE;
      if(!chunkVisible(vp,ox,oy,ox+SIDE,oy+SIDE,chunkMin[c],chunkMax[c])) continue;
      const l=chunkLod[c];
      gl.uniform2i(PT.u.uOff,ox,oy); gl.uniform4i(PT.u.uEdge,stOf(cx-1,cy,l),stOf(cx+1,cy,l),stOf(cx,cy-1,l),stOf(cx,cy+1,l));
      gl.drawElements(gl.TRIANGLES,lodCnt[l],gl.UNSIGNED_SHORT,lodOff[l]); }
    if(nStone){ common(PS,U,vp); bindTex(PS,'uC',1,texC); bindTex(PS,'uT',2,texT); gl.bindVertexArray(vaoS); gl.drawArrays(gl.TRIANGLES,0,nStone); }
    if(nAll){ if(Math.hypot(px-splitX,py-splitY)>12) splitTrees(px,py);
      common(PTR,U,vp); bindTex(PTR,'uC',1,texC); bindTex(PTR,'uT',2,texT);
      for(const T of [TN,TF]){ if(!T.n) continue; gl.bindVertexArray(T.vao); gl.drawArraysInstanced(gl.TRIANGLES,0,T.nv,T.n); } }
    if(nDeco){ common(PD,U,vp); bindTex(PD,'uD',4,texD); bindTex(PD,'uC',1,texC);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1,-2); gl.bindVertexArray(vaoD); gl.drawArrays(gl.TRIANGLES,0,nDeco); gl.disable(gl.POLYGON_OFFSET_FILL); }
    if(nSpr){ common(PSP,U,vp); bindTex(PSP,'uA',3,texA); gl.bindVertexArray(vaoSp); gl.bindBuffer(gl.ARRAY_BUFFER,vbSp);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,spData,0,nSpr*16); gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,nSpr); }
    // water last, see-through near the shore
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    common(PW,U,vp); skyUniforms(PW,U); bindTex(PW,'uH',0,texH); gl.uniform1f(PW.u.uWater,A.WATER);
    gl.bindVertexArray(vaoEmpty); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
  }
  // a chunk is drawn if any corner of its box is in front of the camera and inside the side planes (with slack)
  function chunkVisible(m,x0,y0,x1,y1,z0,z1){ let left=0,right=0,below=0,above=0,behind=0;
    for(let k=0;k<8;k++){ const x=(k&1)?x1:x0, y=(k&2)?y1:y0, z=(k&4)?z1:z0;
      const cx=m[0]*x+m[4]*y+m[8]*z+m[12], cyy=m[1]*x+m[5]*y+m[9]*z+m[13], cw=m[3]*x+m[7]*y+m[11]*z+m[15];
      if(cw<0.05) behind++; if(cx<-cw) left++; if(cx>cw) right++; if(cyy<-cw) below++; if(cyy>cw) above++; }
    return !(behind===8||left===8||right===8||below===8||above===8); }

  R.draw=draw; R.resize=resize; R.rebuild=rebuild; R.canvas=canvas;
  R.show=function(on){ if(on&&!R.shown&&R.ok){ uploadRows(0,N); relPass=A.RELIGHT.passes; relRow=A.RELIGHT.row; } R.shown=!!on; canvas.style.display=on?'block':'none'; };
  R.scale=1;
  R.setScale=function(s){ scale=Math.max(0.5,Math.min(1,s)); R.scale=scale; resize(); };
  R.destroy=function(){ try{ const e=gl.getExtension('WEBGL_lose_context'); if(e) e.loseContext(); }catch(e){} canvas.remove(); R.ok=false; };
  try{ rebuild(); resize(); R.ok=true; }catch(e){ R.error=String(e&&e.message||e).slice(0,300); canvas.remove(); }
  return R;
}
window.KeepMesh={ create:create, version:'v0.19.0' };
})();
