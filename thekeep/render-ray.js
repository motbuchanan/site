// The Keep · render-ray.js · v0.20.0 · Oct 29 2026
// The same world drawn with rays, the way Shadertoy demos draw theirs: no triangles for the land at all. For every pixel
// one small program walks a ray across the same height data the ASCII raycaster reads, then walks toward the sun for a
// soft shadow and off the lake for a real reflection. Sky, light and the people are shared with the Mesh renderer.
// Loaded only when Raymarched is picked.
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
// one full-screen pass: every pixel walks its own ray across the height data until it meets ground, stone, a floating
// slab, a tree crown or a trunk; then it walks again toward the sun for a soft shadow, and a third time off the water
const VS_RAY=`#version 300 es
out vec2 vN; void main(){ vec2 p=vec2((gl_VertexID==1)?3.0:-1.0,(gl_VertexID==2)?3.0:-1.0); vN=p; gl_Position=vec4(p,0.0,1.0); }`;
const FS_RAY=HEAD+FINISH+SKYFN+`
uniform mat4 uInv; uniform sampler2D uMax; uniform sampler2D uH; uniform sampler2D uS; uniform sampler2D uAlb; uniform sampler2D uInf; uniform sampler2D uCr; uniform sampler2D uC;
uniform vec3 uMatF[14]; uniform vec3 uMatT[14]; uniform float uMatCH[14]; uniform float uMatMoss[14];
uniform float uDk; uniform float uDark; uniform float uCast; uniform float uWater; uniform int uSteps;
in vec2 vN; out vec4 o;
float hLin(vec2 p){ return texture(uH,(p+0.5)/512.0).r; }
// what stands at p: ground (h + stone), a floating slab [s.y,s.z], a tree crown [h+bot,h+top], a trunk up to s.w
struct Col { float h; float g; vec4 s; float cb; float ct; };
Col colAt(vec2 p){ Col c; ivec2 q=clamp(ivec2(floor(p)),ivec2(0),ivec2(511)); c.h=hLin(p); c.s=texelFetch(uS,q,0); c.g=c.h+c.s.x;
  vec2 cr=texture(uCr,p/512.0).rg*(255.0/4.0); c.cb=c.h+cr.x; c.ct=c.h+cr.y; return c; }
bool crownAt(Col c,float z){ return c.ct-c.cb>0.35&&z>c.cb&&z<c.ct; }
bool slabAt(Col c,float z){ return c.s.z>c.s.y&&z>=c.s.y&&z<=c.s.z; }
bool trunkAt(Col c,vec3 p){ if(c.s.w<=0.0||p.z>c.s.w) return false; vec2 d=fract(p.xy)-0.5; return dot(d,d)<0.04; }
// kind: 1 ground, 2 stone, 3 slab, 4 leaves, 5 trunk
int solidAt(vec3 p){ Col c=colAt(p.xy);
  if(p.z<c.g) return c.s.x>0.02?2:1; if(slabAt(c,p.z)) return 3; if(crownAt(c,p.z)) return 4; if(trunkAt(c,p)) return 5; return 0; }
// a ray steps until it lands inside something, then halves its last step eight times to find the surface:
// pp ends just outside it (where the light is measured) and hp just inside (which says what was hit)
// above the tallest thing in an 8 x 8 block of cells the ray leaps to where it leaves the block (or drops into it);
// inside, it walks in steps short enough not to pass through a one-cell wall
float blockExit(vec3 ro,vec3 rd,vec3 p,float bm){ vec2 lo=floor(p.xy/8.0)*8.0, hi=lo+8.0;
  vec2 e=vec2(rd.x>0.0?hi.x:lo.x, rd.y>0.0?hi.y:lo.y);
  vec2 tt=vec2(abs(rd.x)>1e-5?(e.x-ro.x)/rd.x:1e9, abs(rd.y)>1e-5?(e.y-ro.y)/rd.y:1e9);
  float tx=min(tt.x,tt.y)+0.02; if(rd.z<0.0) tx=min(tx,(bm-ro.z)/rd.z+0.01); return tx; }
// near the camera the ray walks cell by cell, like the ASCII raycaster: it tests the exact face of every block it
// enters, so wall edges are straight and a wall's face direction is known, not guessed. Past 80 m it switches to
// short steps. Above the tallest thing in an 8 x 8 block it leaps over the whole block.
float march(vec3 ro,vec3 rd,float tmax,int steps,out int kind,out vec3 hp,out vec3 pp,out bool spent,out vec3 hn){
  float t=0.05, tp=0.0; kind=0; pp=ro; spent=false; hn=vec3(0.0); vec3 lastN=vec3(0.0);
  for(int i=0;i<260;i++){ if(i>=steps){ spent=true; break; }
    vec3 p=ro+rd*t;
    if(p.x<0.0||p.y<0.0||p.x>511.0||p.y>511.0) break;
    float bm=texelFetch(uMax,ivec2(floor(p.xy/8.0)),0).r;
    if(p.z>bm+0.02){ if(rd.z>=0.0&&p.z>140.0) break;
      vec2 lo=floor(p.xy/8.0)*8.0, hi=lo+8.0, e=vec2(rd.x>0.0?hi.x:lo.x, rd.y>0.0?hi.y:lo.y);
      float tx=abs(rd.x)>1e-6?(e.x-ro.x)/rd.x:1e9, ty=abs(rd.y)>1e-6?(e.y-ro.y)/rd.y:1e9, tb=min(tx,ty)+1e-4;
      float td=rd.z<0.0?(bm-ro.z)/rd.z+0.01:1e9;
      tp=t; if(td<tb){ t=max(td,t+0.02); lastN=vec3(0.0); } else { t=max(tb,t+0.02); lastN=tx<ty?vec3(-sign(rd.x),0.0,0.0):vec3(0.0,-sign(rd.y),0.0); }
      if(t>tmax) break; continue; }
    Col c=colAt(p.xy);
    if(t<80.0){
      ivec2 ci=ivec2(floor(p.xy)); vec2 cf=vec2(ci); vec4 s=c.s;
      float tx=rd.x>1e-6?(cf.x+1.0-ro.x)/rd.x:(rd.x<-1e-6?(cf.x-ro.x)/rd.x:1e9);
      float ty=rd.y>1e-6?(cf.y+1.0-ro.y)/rd.y:(rd.y<-1e-6?(cf.y-ro.y)/rd.y:1e9);
      float t1=max(min(tx,ty),t+1e-4); vec3 nNext=tx<ty?vec3(-sign(rd.x),0.0,0.0):vec3(0.0,-sign(rd.y),0.0);
      vec3 pX=ro+rd*t1; float gX=hLin(pX.xy)+s.x;
      // already below the ground or a block's top at the entry: a block entered through its side, or ground we must back up to
      if(p.z<c.g){
        if(s.x>0.02&&lastN!=vec3(0.0)){ kind=2; hp=p; pp=p-rd*0.01; hn=lastN; return t; }
        float a=tp, b=t; for(int j=0;j<8;j++){ float m=0.5*(a+b); if(solidAt(ro+rd*m)>0) b=m; else a=m; }
        kind=solidAt(ro+rd*b); if(kind==0) kind=s.x>0.02?2:1; hp=ro+rd*b; pp=ro+rd*a; return b; }
      if(s.z>s.y&&p.z>=s.y&&p.z<=s.z){ kind=3; hp=p; pp=p-rd*0.01; hn=lastN!=vec3(0.0)?lastN:vec3(0.0,0.0,rd.z<0.0?1.0:-1.0); return t; }
      float tHit=1e9; int kh=0; vec3 nh=vec3(0.0);
      if(pX.z<gX){ float a=t, b=t1; for(int j=0;j<10;j++){ float m=0.5*(a+b); vec3 q=ro+rd*m; if(q.z<hLin(q.xy)+s.x) b=m; else a=m; }
        tHit=b; kh=s.x>0.02?2:1; nh=s.x>0.02?vec3(0.0,0.0,1.0):vec3(0.0); }
      if(s.z>s.y){
        if(rd.z<0.0&&p.z>s.z){ float tq=(s.z-ro.z)/rd.z; if(tq<=t1&&tq<tHit){ tHit=tq; kh=3; nh=vec3(0.0,0.0,1.0); } }
        if(rd.z>0.0&&p.z<s.y){ float tq=(s.y-ro.z)/rd.z; if(tq<=t1&&tq<tHit){ tHit=tq; kh=3; nh=vec3(0.0,0.0,-1.0); } } }
      if(s.w>0.0){ vec2 cc=cf+0.5, d=ro.xy-cc; float aa=dot(rd.xy,rd.xy), bq=dot(d,rd.xy), cq=dot(d,d)-0.04, disc=bq*bq-aa*cq;
        if(disc>0.0&&aa>1e-8){ float tt=(-bq-sqrt(disc))/aa; if(tt>=t&&tt<=t1&&tt<tHit){ vec3 q=ro+rd*tt; if(q.z<s.w&&q.z>hLin(q.xy)){ tHit=tt; kh=5; nh=vec3(normalize(q.xy-cc),0.0); } } } }
      for(int j=0;j<3;j++){ float tm=mix(t,t1,(float(j)+0.5)/3.0); if(tm>=tHit) break; vec3 q=ro+rd*tm;
        if(tm>0.6&&crownAt(colAt(q.xy),q.z)){ float a=mix(t,t1,float(j)/3.0), b=tm;
          for(int k=0;k<6;k++){ float m=0.5*(a+b); vec3 r=ro+rd*m; if(crownAt(colAt(r.xy),r.z)) b=m; else a=m; }
          tHit=b; kh=4; nh=vec3(0.0); break; } }
      if(kh>0){ kind=kh; hp=ro+rd*(tHit+0.002); pp=ro+rd*max(t,tHit-0.01); hn=nh; return tHit; }
      tp=t; t=t1+1e-4; lastN=nNext; if(t>tmax) break; continue; }
    int k=0;
    if(p.z<c.g) k=c.s.x>0.02?2:1; else if(slabAt(c,p.z)) k=3; else if(crownAt(c,p.z)) k=4; else if(trunkAt(c,p)) k=5;
    if(k>0){ float a=tp, b=t;
      for(int j=0;j<8;j++){ float m=0.5*(a+b); int km=solidAt(ro+rd*m); if(km>0){ b=m; k=km; } else a=m; }
      kind=k; hp=ro+rd*b; pp=ro+rd*a; return b; }
    float d=p.z-c.g;
    if(c.ct-c.cb>0.35) d=min(d,p.z<c.cb?c.cb-p.z:p.z-c.ct);
    if(c.s.z>c.s.y) d=min(d,p.z<c.s.y?c.s.y-p.z:p.z-c.s.z);
    tp=t; t+=clamp(d*0.6,0.05,0.5+(t-80.0)*0.02); lastN=vec3(0.0);
    if(t>tmax) break; }
  return -1.0; }
float shadowRay(vec3 p,vec3 L){ if(uCast<0.5||L.z<=0.0) return 1.0;
  float res=1.0, t=0.2+0.3*hash(gl_FragCoord.xy);   // a different start per pixel: the penumbra turns to fine grain instead of banding
  for(int i=0;i<48;i++){ vec3 q=p+L*t; if(q.x<0.0||q.y<0.0||q.x>511.0||q.y>511.0||q.z>140.0) break;
    float bm=texelFetch(uMax,ivec2(floor(q.xy/8.0)),0).r;
    if(q.z>bm+1.5){ t=max(blockExit(p,L,q,-1e3),t+0.25); if(t>160.0) break; continue; }   // clear air over this block: skip it; the penumbra comes from the near walk
    Col c=colAt(q.xy);
    if(q.z<c.g||slabAt(c,q.z)||crownAt(c,q.z)) return 0.0;
    float d=q.z-c.g; if(c.ct-c.cb>0.35&&q.z<c.cb) d=min(d,c.cb-q.z);
    res=min(res,6.0*d/t); t+=clamp(d*0.7,0.2,1.0); if(t>160.0) break; }
  return clamp(res,0.0,1.0); }
float aoAt(vec3 p,vec3 n){ float occ=0.0, w=1.0;
  for(int i=1;i<=4;i++){ float hk=0.35*float(i)*float(i); vec3 q=p+n*hk; Col c=colAt(q.xy); float top=max(c.g,(c.ct-c.cb>0.35&&q.z>c.cb)?c.ct:-1e3);
    occ+=w*clamp(hk-(q.z-top),0.0,hk)/hk; w*=0.6; }
  return clamp(1.0-occ*0.45,0.35,1.0); }
float bricks(vec3 w,float along,int m,out float bi,out float zi){ float ch=uMatCH[m];
  if(ch>0.0){ float cl=ch*1.6; float cz=w.z/ch; zi=floor(cz); float fz=cz-zi; float av=(along+(mod(zi,2.0)>0.5?0.55:0.0))/cl; bi=floor(av); float fb=av-bi;
    return (0.90+0.14*hash(vec2(bi,zi*3.0+1.0)))*((fz<0.08||fb<0.06)?0.78:1.0); }
  zi=floor(w.z*1.3); bi=floor(along*1.3); return 0.86+0.20*hash(vec2(bi,zi)+17.0); }
// light and color at a hit, the same light the raycaster uses: (ambient + sun on the slope) x shadow
vec3 shade(int kind,vec3 hp,vec3 pp,vec3 rd,float t,bool cheap,vec3 nIn,out vec3 nrm){
  ivec2 cell=clamp(ivec2(floor(hp.xy)),ivec2(0),ivec2(511)); vec3 n=vec3(0.0,0.0,1.0); vec3 alb; vec4 inf0=texelFetch(uInf,cell,0); int m=int(inf0.r*255.0+0.5); if(kind==3){ int sm=int(inf0.b*255.0+0.5); if(sm>0) m=sm; } m=min(m,13);
  vec4 sc=texelFetch(uS,cell,0);
  bool side=(kind==2&&pp.z<hLin(hp.xy)+sc.x-0.02)||(kind==3&&pp.z>sc.y+0.02&&pp.z<sc.z-0.02);
  if(side){ vec2 f=fract(hp.xy)-0.5; n=abs(f.x)>=abs(f.y)?vec3(sign(f.x),0.0,0.0):vec3(0.0,sign(f.y),0.0);
    vec2 g=pp.xy-hp.xy; if(dot(n.xy,g)<0.0) n=-n; }
  if((kind==2||kind==3)&&dot(nIn,nIn)>0.5){ n=nIn; side=abs(nIn.z)<0.5; }
  if(kind==1){ float e=0.5; n=normalize(vec3(hLin(hp.xy-vec2(e,0))-hLin(hp.xy+vec2(e,0)),hLin(hp.xy-vec2(0,e))-hLin(hp.xy+vec2(0,e)),2.0*e));
    alb=texture(uAlb,hp.xy/512.0).rgb*(0.93+0.12*hash(floor(hp.xy*3.0))); }
  else if(kind==2||kind==3){
    if(kind==3&&!side&&pp.z<sc.y+0.02) n=vec3(0.0,0.0,-1.0);
    if(n.z>0.5){ alb=uMatT[m]*(0.94+0.14*hash(vec2(cell))); if(uMatMoss[m]>0.0&&hash(vec2(cell)+13.0)<uMatMoss[m]*0.5) alb=mix(alb,vec3(92.,124.,62.)/255.,0.55); }
    else if(n.z<-0.5){ nrm=n; return uMatF[m]*0.83*texelFetch(uC,cell,0).a; }
    else { float bi,zi; float along=abs(n.x)>0.5?hp.y:hp.x; alb=uMatF[m]*bricks(hp,along,m,bi,zi);
      float moss=uMatMoss[m]; if(moss>0.0){ float gz=hp.z-hLin(hp.xy+n.xy*0.6); if(gz<0.35+0.5*hash(vec2(bi,7.0))) alb=mix(alb,vec3(92.,124.,62.)/255.,moss*0.6); } } }
  else if(kind==4){ vec4 inf=texelFetch(uInf,cell,0); int tt=int(inf.g*255.0+0.5);
    vec3 base=tt==1?vec3(68.,136.,50.):tt==2?vec3(96.,124.,48.):vec3(36.,108.,40.);
    float e=0.4; Col a=colAt(hp.xy+vec2(e,0)), b=colAt(hp.xy-vec2(e,0)), c2=colAt(hp.xy+vec2(0,e)), d2=colAt(hp.xy-vec2(0,e));
    n=normalize(vec3(b.ct-a.ct,d2.ct-c2.ct,2.0*e)+vec3(hash(floor(hp.xy*4.0))-0.5,hash(floor(hp.yx*4.0)+3.0)-0.5,0.0)*0.6);
    alb=(base+vec3(16.,30.,12.)*hash(vec2(cell)+55.0))/255.*(0.82+0.3*hash(floor(hp.xy*5.0)+floor(hp.z*5.0))); }
  else { alb=vec3(76.,54.,36.)/255.; vec2 d=fract(hp.xy)-0.5; n=normalize(vec3(d,0.0)); }
  nrm=n;
  float diff=max(0.0,dot(n,uLight));
  float baked=texelFetch(uC,cell,0).a;
  float sv=cheap?baked:min(baked+0.15,mix(uDark,1.0,shadowRay(pp+n*0.03,uLight)));
  sv=max(sv,uDark);
  float ao=cheap?1.0:aoAt(pp,n);
  if(kind==2||kind==3){ float L=n.z>0.5?ao:(0.64+0.46*max(0.0,dot(n.xy,uLight.xy)))*ao; return alb*L*sv; }
  float L=0.42*ao+uDk*diff;
  if(kind==4) return alb*(0.62+0.55*L)*sv;
  return alb*L*sv; }
void main(){
  vec4 a=uInv*vec4(vN,-1.0,1.0), b=uInv*vec4(vN,1.0,1.0); vec3 ro=uEye; vec3 rd=normalize(b.xyz/b.w-a.xyz/a.w);
  int kind; vec3 hp, pp;
  bool spent; vec3 hn; float t=march(ro,rd,520.0,uSteps,kind,hp,pp,spent,hn);
  // the water: where the ray crosses the waterline before it meets anything
  float tw=-1.0; if(ro.z>uWater&&rd.z<0.0) tw=(uWater-ro.z)/rd.z; else if(ro.z<uWater&&rd.z>0.0) tw=(uWater-ro.z)/rd.z;
  bool water=tw>0.0&&(t<0.0||tw<t);
  vec3 col, raw=vec3(0.0); vec3 wp; float warm=0.0; vec3 n;
  if(t<0.0&&!water&&spent&&rd.z<0.0){ o=vec4(uFog*uTint,1.0); gl_FragDepth=1.0; return; }   // out of steps over far land: it is in the fog anyway
  if(t<0.0&&!water){ col=skyCol(rd);
    if(uUW>0.0){ float s=gl_FragCoord.y/uScr.y; col=mix(col,mix(vec3(12.,46.,72.),vec3(46.,118.,150.),s)/255.,uUW*0.6); }
    o=vec4(col,1.0); gl_FragDepth=1.0; return; }
  if(water&&ro.z<uWater){ wp=ro+rd*tw; col=vec3(12.,46.,72.)/255.; }
  else if(water){ wp=ro+rd*tw;
    vec3 bed=vec3(30.,78.,98.)/255.;
    if(t>0.0){ vec3 bc=shade(kind,hp,pp,rd,t,true,hn,n); float k=exp(-(t-tw)*0.35); bed=mix(bed,bc,k*0.85); }
    vec2 rp=vec2(0.030*sin(wp.x*0.9+uTime*1.3)+0.018*sin(wp.y*1.7-uTime*0.9+wp.x*0.3), 0.030*cos(wp.y*0.8+uTime*1.1)+0.018*cos(wp.x*1.5+uTime*0.7));
    vec3 wn=normalize(vec3(rp,1.0)); vec3 rr=reflect(rd,wn); rr.z=max(rr.z,0.01);
    float fres=0.12+0.78*pow(1.0-clamp(-rd.z,0.0,1.0),3.0);
    int k2; vec3 h2,p2,n2i; bool sp2; float t2=march(wp+vec3(0,0,0.05),rr,200.0,64,k2,h2,p2,sp2,n2i);
    vec3 refl; if(t2>0.0){ vec3 n2; vec3 rc=shade(k2,h2,p2,rr,t2,true,n2i,n2); float f2=1.0-exp(-t2*uFogK); refl=mix(rc,uFog,f2)*uTint; } else refl=skyCol(rr);
    col=bed*(1.0-fres); raw=refl*fres; }
  else { wp=hp; col=shade(kind,hp,pp,rd,t,t>70.0,hn,n); }
  if(uNight>0.0) warm=pool(wp);
  vec4 cp=uVP*vec4(wp,1.0); gl_FragDepth=clamp(0.5*cp.z/cp.w+0.5,0.0,1.0);
  o=vec4(finish(col,raw,wp,warm),1.0); }`;
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
  canvas.id='glr'; canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:fixed;left:0;top:0;display:none;pointer-events:none;background:#000;touch-action:none';
  const ref=document.getElementById('c'); (ref&&ref.parentNode?ref.parentNode:document.body).insertBefore(canvas,ref?ref.nextSibling:null);
  let gl=null;
  try{ gl=canvas.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false}); }catch(e){ gl=null; }
  if(!gl){ R.error='no WebGL2'; canvas.remove(); return R; }
  canvas.addEventListener('webglcontextlost',function(e){ e.preventDefault(); R.ok=false; R.error='lost'; if(R.onLost) R.onLost(); });

  function sh(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function prog(vs,fs){ const p=gl.createProgram(); gl.attachShader(p,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u={}; const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS); for(let i=0;i<n;i++){ const a=gl.getActiveUniform(p,i); u[a.name.replace(/\[0\]$/,'')]=gl.getUniformLocation(p,a.name); }
    return {p:p,u:u}; }
  let PR,PSP;
  try{ PR=prog(VS_RAY,FS_RAY); PSP=prog(VS_SPR,FS_SPR); }
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

  // ---- what the rays read: heights, stone and slabs, albedo, materials, and a map of tree crowns at half-metre detail ----
  const texSt=tex(N,N,gl.RGBA16F,gl.RGBA,gl.FLOAT,gl.NEAREST,gl.CLAMP_TO_EDGE);
  const texAlb=tex(N,N,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,gl.LINEAR,gl.CLAMP_TO_EDGE);
  const texInf=tex(N,N,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,gl.NEAREST,gl.CLAMP_TO_EDGE);
  const CR=1024, texCr=tex(CR,CR,gl.RG8,gl.RG,gl.UNSIGNED_BYTE,gl.LINEAR,gl.CLAMP_TO_EDGE);
  const texHL=tex(N,N,gl.R16F,gl.RED,gl.FLOAT,gl.LINEAR,gl.CLAMP_TO_EDGE);
  const NB=N/8, texMax=tex(NB,NB,gl.R32F,gl.RED,gl.FLOAT,gl.NEAREST,gl.CLAMP_TO_EDGE);
  const matF=new Float32Array(42), matT=new Float32Array(42), matCH=new Float32Array(14), matMoss=new Float32Array(14);
  for(let m=0;m<14;m++){ const M=A.RMAT[m]||A.RMAT[0]; for(let k=0;k<3;k++){ matF[m*3+k]=M.f[k]/255; matT[m*3+k]=M.t[k]/255; } matCH[m]=M.ch; matMoss[m]=M.moss; }
  function buildWorldTex(){ const h=W.h, st=W.st, sb=W.sb, su=W.su;
    const S=new Float32Array(N*N*4), AL=new Uint8Array(N*N*4), IN=new Uint8Array(N*N*4), CRD=new Uint8Array(CR*CR*2);
    for(let i=0;i<CR*CR;i++){ CRD[i*2]=255; CRD[i*2+1]=0; }   // no crown: bottom high, top low, so the edge of a crown stays crisp
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const i=y*N+x;
      S[i*4]=st[i]; if(su[i]>0){ S[i*4+1]=h[i]+sb[i]; S[i*4+2]=h[i]+su[i]; }
      AL[i*4]=W.ar[i]; AL[i*4+1]=W.ag[i]; AL[i*4+2]=W.ab[i]; AL[i*4+3]=255;
      IN[i*4]=W.ruin[i]; IN[i*4+1]=W.ttype[i]; IN[i*4+2]=W.smat[i];
      const th=W.tree[i]; if(!(th>0)) continue;
      const t=W.ttype[i], tw=0.55+1.35*A.hash2(x,y,W.seed+96), tj=A.hash2(x,y,W.seed+93);
      const rcw=0.92*(t===0?1.05:t===1?1.85:1.62)*tw, base=W.gh[i], top=base+th;
      const cb0=base+th*(t===0?(0.06+0.16*tj):t===1?(0.36+0.22*tj):(0.22+0.24*tj)), cH=top-cb0;
      S[i*4+3]=cb0+0.3;
      const cx=x+0.5, cy=y+0.5, r2=Math.ceil(rcw*2)+1;
      for(let v=Math.floor(cy*2)-r2;v<=Math.floor(cy*2)+r2;v++)for(let u=Math.floor(cx*2)-r2;u<=Math.floor(cx*2)+r2;u++){
        if(u<0||v<0||u>=CR||v>=CR) continue;
        const q=Math.hypot((u+0.5)/2-cx,(v+0.5)/2-cy)/rcw; if(q>1) continue;
        let ct; if(t===0) ct=top-cH*(0.22*q+0.78*q*q); else if(t===1) ct=cb0+cH*Math.sqrt(Math.max(0,1-q*q)); else ct=cb0+cH*(1-(0.5+0.4*tj)*q*q);
        const j=(v*CR+u)*2, bot=Math.max(0,Math.round((cb0-base)*4)), tp=Math.min(255,Math.round((ct-base)*4));
        if(tp>CRD[j+1]){ CRD[j+1]=tp; CRD[j]=bot; } } }   // where crowns overlap, the tallest one owns the texel, bottom and top
    gl.bindTexture(gl.TEXTURE_2D,texSt); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,N,N,gl.RGBA,gl.FLOAT,S);
    gl.bindTexture(gl.TEXTURE_2D,texAlb); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,N,N,gl.RGBA,gl.UNSIGNED_BYTE,AL);
    gl.bindTexture(gl.TEXTURE_2D,texInf); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,N,N,gl.RGBA,gl.UNSIGNED_BYTE,IN);
    gl.bindTexture(gl.TEXTURE_2D,texCr); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,CR,CR,gl.RG,gl.UNSIGNED_BYTE,CRD);
    gl.bindTexture(gl.TEXTURE_2D,texHL); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,N,N,gl.RED,gl.FLOAT,W.h);
    // the tallest thing in each 8 x 8 block: ground at every corner, stone, slab tops, crown tops (plus a little slack)
    const MX=new Float32Array(NB*NB);
    for(let by=0;by<NB;by++)for(let bx=0;bx<NB;bx++){ let m=-1e9;
      for(let y=by*8;y<=Math.min(N-1,by*8+8);y++)for(let x=bx*8;x<=Math.min(N-1,bx*8+8);x++){ const i=y*N+x;
        m=Math.max(m,h[i]+st[i],su[i]>0?h[i]+su[i]:-1e9,W.tree[i]>0?W.gh[i]+W.tree[i]:-1e9); }
      for(let y=Math.max(0,by*8-4);y<Math.min(N,by*8+12);y++)for(let x=Math.max(0,bx*8-4);x<Math.min(N,bx*8+12);x++){ const i=y*N+x; if(W.tree[i]>0) m=Math.max(m,W.gh[i]+W.tree[i]); }
      MX[by*NB+bx]=m+0.3; }
    gl.bindTexture(gl.TEXTURE_2D,texMax); gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,NB,NB,gl.RED,gl.FLOAT,MX); }
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
  function worldSig(){ const D=A.DIALS; return W.seed+'|'+D.keep+'|'+D.forest+'|'+D.water+'|'+D.ruins+'|'+W.ruins.length+'|'+W.keepBuilt+'|'+(D.folk||[]).join('')+'|'+(W.places?W.places.length:0); }

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
    buildWorldTex();
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
  let steps=200;
  // rays cost per pixel, so this mode draws at about half the screen's detail and lets the browser smooth it up
  function resize(){ const dpr=Math.min(window.devicePixelRatio||1,1.6)*scale*0.55;
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
      if(sp===SP.KEEPER){ const id=Math.min(A.KMASK.length-1,C.ay[c]|0), hx=C.vx[c], hy=C.vy[c], hl=Math.hypot(hx,hy)||1, tl=Math.hypot(ex,ey)||1;
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
    // the whole world in one pass of rays; it writes its own depth so the people and animals sit in it correctly
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.ALWAYS);
    common(PR,U,vp); gl.uniformMatrix4fv(PR.u.uInv,false,ivp); skyUniforms(PR,U);
    bindTex(PR,'uC',1,texC); bindTex(PR,'uS',2,texSt); bindTex(PR,'uAlb',3,texAlb); bindTex(PR,'uInf',4,texInf); bindTex(PR,'uCr',7,texCr); bindTex(PR,'uMax',0,texMax); bindTex(PR,'uH',8,texHL);
    gl.uniform3fv(PR.u.uMatF,matF); gl.uniform3fv(PR.u.uMatT,matT); gl.uniform1fv(PR.u.uMatCH,matCH); gl.uniform1fv(PR.u.uMatMoss,matMoss);
    { const L=DAY.light, lz=Math.max(0.0001,L.z); const dk=0.70*(DAY.sunLight?1:0.70)*(0.75/Math.max(0.6,lz))*Math.min(1,lz/0.14);
      gl.uniform1f(PR.u.uDk,L.z>0?dk:0); gl.uniform1f(PR.u.uDark,DAY.shadowK); gl.uniform1f(PR.u.uCast,DAY.lightAlt>0.035?1:0); }
    gl.uniform1f(PR.u.uWater,A.WATER); gl.uniform1i(PR.u.uSteps,Math.round(120+160*(scale-0.5)));
    gl.bindVertexArray(vaoEmpty); gl.drawArrays(gl.TRIANGLES,0,3);
    gl.depthFunc(gl.LEQUAL);
    if(nDeco){ common(PD,U,vp); bindTex(PD,'uD',4,texD); bindTex(PD,'uC',1,texC);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1,-2); gl.bindVertexArray(vaoD); gl.drawArrays(gl.TRIANGLES,0,nDeco); gl.disable(gl.POLYGON_OFFSET_FILL); }
    if(nSpr){ common(PSP,U,vp); bindTex(PSP,'uA',3,texA); gl.bindVertexArray(vaoSp); gl.bindBuffer(gl.ARRAY_BUFFER,vbSp);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,spData,0,nSpr*16); gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,nSpr); }
    gl.bindVertexArray(null);
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
window.KeepRay={ create:create, version:'v0.20.0' };
})();
