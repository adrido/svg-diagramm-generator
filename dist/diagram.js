"use strict";
const NS="http://www.w3.org/2000/svg", META="svg-diagramm-generator-einstellungen";
const dirs=["px","nx","py","ny"], symbols=["+X","−X","+Y","−Y"];
const names=["+X / +Y","−X / −Y","Vier Richtungen","Diodenkennlinie – Achsen"];
function preset(n){
  const axes={};
  dirs.forEach((d,i)=>{axes[d]={active:n>=2 || (n===0?i%2===0:i%2===1),title:n===3?["U_F","U_R","I_F","I_R"][i]:i<2?"x":"y",unit:n===3?(i<2?"V":"mA"):"",step:n===3?[.1,2,.5,1][i]:1,cells:n===3?[9,8,5,5][i]:5,decimals:n===3&&i%2===0?1:0,sign:n===3||i%2===0?"amount":"negative"}});
  return {schemaVersion:1,template:n,axes,grid:true,frame:true,zero:true};
}
function validValue(k,v){
  if(["title","unit"].includes(k))return typeof v==="string" && v.length<=32 && !/[\u0000-\u001f\ud800-\udfff\ufffe\uffff]/u.test(v);
  if(k==="active")return typeof v==="boolean";
  if(k==="sign")return ["amount","negative","plus"].includes(v);
  if(k==="step")return Number.isFinite(v)&&v>0&&v<=1000000;
  return Number.isInteger(v)&&(k==="cells"?v>=1&&v<=50:v>=0&&v<=8);
}
function validate(s){
  if(!s||s.schemaVersion!==1)throw Error("Diese Schemaversion wird nicht unterstützt.");
  if(!names[s.template]||!Number.isInteger(s.template)||!["grid","frame","zero"].every(k=>typeof s[k]==="boolean")||!dirs.every(d=>s.axes?.[d]&&Object.keys(preset(3).axes[d]).every(k=>validValue(k,s.axes[d][k]))))throw Error("Die Datei enthält ungültige Diagrammeinstellungen.");
  return s;
}
function readDiagram(source){
  if(/<!DOCTYPE/i.test(source))throw Error("SVG-Dateien mit Dokumenttyp-Deklaration werden nicht unterstützt.");
  const doc=new DOMParser().parseFromString(source,"image/svg+xml"), root=doc.documentElement;
  if(root.localName!=="svg"||root.namespaceURI!==NS||doc.getElementsByTagName("parsererror").length)throw Error("Die Datei ist keine gültige SVG-Grafik.");
  const records=Array.from(root.children).filter(e=>e.namespaceURI===NS&&e.localName==="metadata"&&e.id===META);
  if(records.length!==1||records[0].children.length)throw Error("Die SVG enthält keine eindeutigen Metadaten des SVG-Diagramm-Generators.");
  let data;try{data=JSON.parse(records[0].textContent)}catch{throw Error("Die Diagrammeinstellungen sind kein gültiges JSON.")}
  return validate(data);
}
function renderDiagram(s){
  const svg=document.createElementNS(NS,"svg");
  function add(tag,attrs={},value,parent=svg){
    const el=document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(value!==undefined)el.textContent=value;
    parent.append(el);return el;
  }
  const a=s.axes,cell=56,count=d=>a[d].active?a[d].cells:0;
  const w=(count("nx")+count("px"))*cell,h=(count("ny")+count("py"))*cell;
  const ox=count("nx")*cell,oy=count("py")*cell;
  const padX=Math.max(26,...["py","ny"].filter(d=>a[d].active).map(d=>(a[d].title.length+a[d].unit.length+4)*6));
  const padY=45;
  svg.setAttribute("viewBox",[-padX,-padY,w+2*padX,h+2*padY].join(" "));
  svg.setAttribute("font-family","Arial, sans-serif");svg.setAttribute("font-size","16");svg.setAttribute("fill","#253043");
  add("title",{},"Koordinatensystem · "+names[s.template]);add("metadata",{id:META},JSON.stringify(s));
  function line(x1,y1,x2,y2,color,width){add("line",{x1,y1,x2,y2,stroke:color,"stroke-width":width})}
  function label(x,y,value,anchor="middle"){return add("text",{x,y,"text-anchor":anchor},value)}
  if(s.grid){for(let x=0;x<=w;x+=cell)line(x,0,x,h,"#c1c8d1",1);for(let y=0;y<=h;y+=cell)line(0,y,w,y,"#c1c8d1",1)}
  if(s.frame)add("rect",{x:0,y:0,width:w,height:h,fill:"none",stroke:"#929dab"});
  dirs.forEach((d,i)=>{
    const v=a[d];if(!v.active)return;
    const dx=[1,-1,0,0][i],dy=[0,0,-1,1][i],x=ox+dx*v.cells*cell,y=oy+dy*v.cells*cell;
    line(ox,oy,x,y,"#273145",2.2);
    add("path",{d:`M ${x-10*dx+5*dy} ${y-10*dy+5*dx} L ${x} ${y} L ${x-10*dx-5*dy} ${y-10*dy-5*dx}`,stroke:"#273145","stroke-width":2.4,fill:"none"});
    for(let j=1;j<v.cells;j++){
      const tx=ox+dx*j*cell,ty=oy+dy*j*cell;
      const val=(v.sign==="negative"?"−":v.sign==="plus"?"+":"")+(j*v.step).toFixed(v.decimals).replace(".",",");
      line(tx,ty,tx+(dx?0:6),ty+(dx?6:0),"#273145",1.8);
      label(tx+(dx?0:11),ty+(dx?22:5),val,dx?"middle":"start");
    }
    const title=label(x+(dx?-dx*7:0),y+(dx?(h===oy?-13:41):dy<0?-14:28),"",dx>0?"end":dx<0?"start":"middle");
    const [base,...sub]=v.title.split("_");
    add("tspan",{},base,title);
    if(sub.length)add("tspan",{"baseline-shift":"sub","font-size":12},sub.join("_"),title);
    if(v.unit)add("tspan",{}," ["+v.unit+"]",title);
  });
  if(s.zero)label(ox+8,oy+20,"0","start");
  return svg;
}
