"use strict";
const NS="http://www.w3.org/2000/svg";
const diagramNamespace="https://github.com/adrido/svg-diagramm-generator/ns/diagram/1";
const currentSchemaVersion=1;
const maxSvgBytes=2*1024*1024, maxMetadataLength=64*1024;
const dirs=["px","nx","py","ny"], symbols=["+X","−X","+Y","−Y"];
const names=["+X / +Y","−X / −Y","Vier Richtungen","Diodenkennlinie – Achsen"];
const gridDivisions=[2,4,5,10];
function defaultMinorGrid(){return {enabled:false,divisions:5}}
function preset(n){
  const axes={};
  dirs.forEach((d,i)=>{axes[d]={active:n>=2 || (n===0?i%2===0:i%2===1),title:n===3?"":(i<2?"x":"y"),symbol:n===3?["U_F","U_R","I_F","I_R"][i]:"",unit:n===3?(i<2?"V":"mA"):"",step:n===3?[.1,2,.5,1][i]:1,cells:n===3?[9,8,5,5][i]:5,decimals:n===3&&i%2===0?1:0,sign:n===3||i%2===0?"amount":"negative"}});
  return {schemaVersion:currentSchemaVersion,template:n,axes,grid:true,minorGrid:defaultMinorGrid(),frame:true,zero:true,general:{...defaultGeneral(axes,n),unitFormat:"slash"}};
}
function geometry(a){
  const cell=56,count=d=>a[d].active?a[d].cells:0;
  const w=(count("nx")+count("px"))*cell,h=(count("ny")+count("py"))*cell;
  const ox=count("nx")*cell,oy=count("py")*cell;
  const padX=Math.max(26,...["py","ny"].filter(d=>a[d].active).map(d=>(a[d].title.length+(a[d].symbol||"").length+a[d].unit.length+4)*6));
  const padY=45;
  return {w,h,ox,oy,padX,padY,cell};
}
function defaultGeneral(axes,template){
  const {w,h,padX,padY}=geometry(axes);
  return {width:w+2*padX,height:h+2*padY,title:template===3?"Diodenkennlinie":"Koordinatensystem",showTitle:false,sizeUnit:"px"};
}
// Breite und Höhe bleiben in den Metadaten kompatibel zu früheren Pixel-Dateien.
const pixelsPerMillimeter=96/25.4;
function dimensionInUnit(pixels,unit){
  return unit==="mm"?Number((pixels/pixelsPerMillimeter).toFixed(12)):pixels;
}
function validDimension(v){return Number.isFinite(v)&&v>=1&&v<=20000}
function validTitle(v){return typeof v==="string"&&v.length<=120&&!/[\u0000-\u001f\ud800-\udfff\ufffe\uffff]/u.test(v)}
function downloadName(title){
  let base=title.trim().replace(/\.svg$/i,"").replace(/[<>:"/\\|?*]/g,"-").replace(/^[. ]+|[. ]+$/g,"");
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(base))base="_"+base;
  return (base||"Koordinatensystem")+".svg";
}
function validValue(k,v){
  if(["title","symbol","unit"].includes(k))return typeof v==="string" && v.length<=32 && !/[\u0000-\u001f\ud800-\udfff\ufffe\uffff]/u.test(v);
  if(k==="active")return typeof v==="boolean";
  if(k==="sign")return ["amount","negative","plus"].includes(v);
  if(k==="step")return Number.isFinite(v)&&v>0&&v<=1000000;
  return Number.isInteger(v)&&(k==="cells"?v>=1&&v<=50:v>=0&&v<=8);
}
const unitFormats=["slash","in","parentheses","brackets"];

function formatAxisTitle(label,symbol,unit,format){
  const parts=[];
  for(const [value,italic] of [[label,false],[symbol,true]]){
    if(!value?.trim())continue;
    if(parts.length)parts.push({text:" "});
    const [base,...index]=value.trim().split("_");
    parts.push({text:base,italic});
    if(index.length)parts.push({text:index.join("_"),italic,subscript:true});
  }
  const u=unit?.trim();
  if(!u)return parts;
  let text=u;
  if(parts.length){
    switch(format){
      case "in": text=" in "+u; break;
      case "parentheses": text=" ("+u+")"; break;
      case "brackets": text=" ["+u+"]"; break;
      default: text=u.includes("/")?" / ("+u+")":" / "+u;
    }
  }
  parts.push({text});
  return parts;
}
function checkVersion(version){
  if(!Number.isSafeInteger(version)||version<1)throw Error("Die Schemaversion fehlt oder ist ungültig.");
  if(version!==currentSchemaVersion)throw Error("Die Schemaversion "+version+" wird nicht unterstützt.");
}
function hasFields(record,fields){
  return record!==null && typeof record==="object" && !Array.isArray(record)
    && Object.keys(record).length===fields.length && fields.every(key=>Object.hasOwn(record,key));
}
function validate(s){
  checkVersion(s?.schemaVersion);
  const axisFields=["active","title","symbol","unit","step","cells","decimals","sign"];
  if(!hasFields(s,["schemaVersion","template","axes","grid","minorGrid","frame","zero","general"])
    ||!Number.isInteger(s.template)||s.template<0||s.template>=names.length
    ||!["grid","frame","zero"].every(key=>typeof s[key]==="boolean")
    ||!hasFields(s.axes,dirs)||!dirs.every(dir=>hasFields(s.axes[dir],axisFields)
      &&axisFields.every(key=>validValue(key,s.axes[dir][key])))){
    throw Error("Die Datei enthält unvollständige oder ungültige Diagrammeinstellungen.");
  }
  if(!hasFields(s.minorGrid,["enabled","divisions"])||typeof s.minorGrid.enabled!=="boolean"
    ||!gridDivisions.includes(s.minorGrid.divisions))throw Error("Die Hilfsgitter-Einstellungen sind ungültig.");
  const g=s.general;
  if(!hasFields(g,["width","height","title","showTitle","sizeUnit","unitFormat"])
    ||!["px","mm"].includes(g.sizeUnit)||!validDimension(g.width)||!validDimension(g.height)
    ||!validTitle(g.title)||typeof g.showTitle!=="boolean"||!unitFormats.includes(g.unitFormat)){
    throw Error("Die allgemeinen Diagrammeinstellungen sind ungültig.");
  }
  return s;
}
function diagramMetadata(s){
  const metadata=document.createElementNS(NS,"metadata");
  const record=document.createElementNS(diagramNamespace,"sdg:document");
  record.setAttribute("version",String(currentSchemaVersion));
  record.setAttribute("encoding","application/json");
  record.textContent=JSON.stringify(s,null,2);
  metadata.append(record);
  return metadata;
}
function checkSvgSize(bytes){
  if(bytes>maxSvgBytes)throw Error("Die SVG-Datei überschreitet die Grenze von 2 MiB.");
}
function readDiagram(source){
  checkSvgSize(source.length);
  checkSvgSize(new Blob([source]).size);
  if(/<!DOCTYPE/i.test(source))throw Error("SVG-Dateien mit Dokumenttyp-Deklaration werden nicht unterstützt.");
  const doc=new DOMParser().parseFromString(source,"image/svg+xml"), root=doc.documentElement;
  if(root.localName!=="svg"||root.namespaceURI!==NS||doc.getElementsByTagNameNS("*","parsererror").length)throw Error("Die Datei ist keine gültige SVG-Grafik.");
  const records=root.getElementsByTagNameNS(diagramNamespace,"document");
  if(!records.length)throw Error("Die SVG enthält keine Projektdaten im aktuellen Generatorformat.");
  if(records.length!==1)throw Error("Die SVG enthält mehrere Projektdatensätze.");
  const record=records[0], parent=record.parentElement;
  if(parent.localName!=="metadata"||parent.namespaceURI!==NS||parent.parentElement!==root
    ||record.childElementCount)throw Error("Die Struktur der SVG-Projektdaten ist ungültig.");
  const version=record.getAttribute("version");
  if(!/^[1-9][0-9]*$/.test(version))throw Error("Die XML-Schemaversion fehlt oder ist ungültig.");
  checkVersion(Number(version));
  if(record.getAttribute("encoding")!=="application/json")throw Error("Die Kodierung der Projektdaten wird nicht unterstützt.");
  const json=record.textContent;
  if(json.length>maxMetadataLength)throw Error("Die eingebetteten Diagrammeinstellungen sind zu groß.");
  let data;
  try{data=JSON.parse(json)}catch{throw Error("Die Diagrammeinstellungen sind kein gültiges JSON.")}
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
  const a=s.axes, {w,h,ox,oy,padX,padY,cell}=geometry(a);
  const {width,height,title,showTitle}=s.general;
  const heading=showTitle?title.trim():"";
  const headingSpace=heading?40:0;
  const unit=s.general.sizeUnit||"px";
  svg.setAttribute("width",dimensionInUnit(width,unit)+unit);
  svg.setAttribute("height",dimensionInUnit(height,unit)+unit);
  svg.setAttribute("viewBox",[-padX,-padY-headingSpace,w+2*padX,h+2*padY+headingSpace].join(" "));
  svg.setAttribute("font-family","Arial, sans-serif");svg.setAttribute("font-size","16");svg.setAttribute("fill","#253043");
  add("title",{},title.trim()||"Koordinatensystem · "+names[s.template]);
  if(heading){
    const size=Math.min(24,(w+2*padX-12)/Array.from(heading).length);
    add("text",{x:w/2,y:-padY-10,"text-anchor":"middle","font-size":size,"font-weight":"bold"},heading);
  }
  svg.append(diagramMetadata(s));
  function line(x1,y1,x2,y2,color,width){add("line",{x1,y1,x2,y2,stroke:color,"stroke-width":width})}
  function label(x,y,value,anchor="middle"){return add("text",{x,y,"text-anchor":anchor},value)}
  if(s.minorGrid.enabled && w>0 && h>0){
    const segments=[];
    const divisions=s.minorGrid.divisions;
    for(let part=1;part<divisions;part++){
      const offset=cell*part/divisions;
      for(let x=0;x<w;x+=cell)segments.push(`M ${x+offset} 0 v ${h}`);
      for(let y=0;y<h;y+=cell)segments.push(`M 0 ${y+offset} h ${w}`);
    }
    add("path",{d:segments.join(" "),fill:"none",stroke:"#dde2e8","stroke-width":0.7});
  }
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
    title.setAttribute("data-achsentitel",d);
    title.setAttribute("style","white-space: pre");
    for(const part of formatAxisTitle(v.title,v.symbol,v.unit,s.general.unitFormat)){
      const attrs={};
      if(part.italic)Object.assign(attrs,{"font-family":"serif","font-style":"italic"});
      if(part.subscript)Object.assign(attrs,{"baseline-shift":"sub","font-size":12});
      add("tspan",attrs,part.text,title);
    }
  });
  if(s.zero)label(ox+8,oy+20,"0","start");
  return svg;
}
