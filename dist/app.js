"use strict";
const $=id=>document.getElementById(id);
const paths={plus:"M12 5v14M5 12h14",folder:"M3 7V5h7l2 3h9v3M3 9v11h16l3-10H7l-3 9",save:"M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",lock:"M7 10V8a5 5 0 0 1 10 0v2M5 10h14v11H5z",sliders:"M3 7h7m4 0h7M3 17h12m4 0h2M10 4v6m5 4v6",graph:"M3 3v18h18M6 15l5-6 4 3 6-8"};
function icon(path){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg>'}
document.querySelectorAll("[data-i]").forEach(i=>i.innerHTML=icon(paths[i.dataset.i]));
document.querySelector(".logo").innerHTML=icon("M6 2v20M2 18h20M3 14h6m-6-5h6m3 6v6m5-6v6M9 14l4-5 3 2 5-7");
let state=preset(3),expanded=new Set(["px"]);
const captions=["Positive X-Achse","Negative X-Achse","Positive Y-Achse","Negative Y-Achse"];
const thumbPaths=["M9 7v27h27 M6 11l3-4 3 4m20 20 4 3-4 3","M34 35V9H7m24 22 3 4 3-4M11 6 7 9l4 3","M4 22h36M22 4v36m-3-32 3-4 3 4m11 11 4 3-4 3","M4 24h36M20 4v36m-3-32 3-4 3 4m11 13 4 3-4 3M10 21v6m20-6v6M17 14h6m-6 18h6"];
names.forEach((name,i)=>{const b=document.createElement("button");b.className="template";b.innerHTML='<span class="thumb"><svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8"><path d="'+thumbPaths[i]+'"/></svg></span>';b.append(name);b.onclick=()=>loadState(preset(i));$("templates").append(b)});
const labels={title:"Achsentitel",unit:"Einheit",step:"Schrittweite",cells:"Rasterfelder",decimals:"Dezimalstellen",sign:"Vorzeichen"};
const errors={title:"Maximal 32 druckbare Zeichen.",unit:"Maximal 32 druckbare Zeichen.",step:"Zahl größer 0 bis 1.000.000 eingeben.",cells:"Ganze Zahl von 1 bis 50 eingeben.",decimals:"Ganze Zahl von 0 bis 8 eingeben."};
function fields(){
  $("axes").replaceChildren();
  dirs.forEach((d,i)=>{
    const axis=document.createElement("section");axis.className="axis";axis.innerHTML='<div class="axisbar"><button class="fold"><span class="dir">'+symbols[i]+'</span>'+captions[i]+'<span class="chev"></span></button><input type="checkbox" class="toggle" aria-label="'+captions[i]+' aktiv"></div><div class="fields"></div>';
    const group=axis.querySelector(".fields"),fold=axis.querySelector(".fold"),active=axis.querySelector(".toggle");
    group.id="fields-"+d;fold.setAttribute("aria-controls",group.id);
    function show(){group.hidden=!expanded.has(d);axis.classList.toggle("expanded",!group.hidden);fold.setAttribute("aria-expanded",String(!group.hidden))}
    fold.onclick=()=>{expanded.has(d)?expanded.delete(d):expanded.add(d);show()};show();
    active.checked=state.axes[d].active;active.id=d+"-active";active.oninput=update;
    for(const [k,label] of Object.entries(labels)){
      const wrap=document.createElement("label");wrap.textContent=label;
      const f=document.createElement(k==="sign"?"select":"input");f.id=d+"-"+k;
      if(k==="sign")for(const [val,txt] of [["amount","Betrag"],["negative","Minus (−)"],["plus","Plus (+)"]])f.add(new Option(txt,val));
      if(["step","cells","decimals"].includes(k))f.inputMode=k==="step"?"decimal":"numeric";
      const v=state.axes[d][k];f.value=typeof v==="number"?String(v).replace(".",","):v;
      const err=document.createElement("small");err.className="error";err.id="err-"+f.id;f.setAttribute("aria-describedby",err.id);
      f.oninput=update;wrap.append(f,err);group.append(wrap);
    }$("axes").append(axis);
  });
}
for(const [k,label] of [["grid","Raster"],["frame","Rahmen"],["zero","Nullbeschriftung"]]){
  const wrap=document.createElement("label"),f=document.createElement("input");f.type="checkbox";f.id=k;f.oninput=update;wrap.append(f,label);$("options").append(wrap);
}
function paint(){$("sheet").replaceChildren(renderDiagram(state))}
function update(){
  const next=structuredClone(state);let ok=true;
  for(const d of dirs){
    next.axes[d].active=$(d+"-active").checked;
    for(const k of Object.keys(labels)){
      const f=$(d+"-"+k);let v=f.value;
      if(["step","cells","decimals"].includes(k)){const raw=v.trim().replace(",",".");v=/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)?Number(raw):NaN}
      const good=validValue(k,v);f.setAttribute("aria-invalid",String(!good));$("err-"+f.id).textContent=good?"":errors[k];ok&&=good;next.axes[d][k]=v;
    }
  }
  $("save").disabled=!ok;$("live").textContent=ok?"Aktuell":"Eingabe prüfen";$("message").textContent="";
  if(ok){for(const k of ["grid","frame","zero"])next[k]=$(k).checked;state=next;paint()}
}
function loadState(s){
  state=s;fields();for(const k of ["grid","frame","zero"])$(k).checked=s[k];
  [...$("templates").children].forEach((b,i)=>b.setAttribute("aria-pressed",String(i===s.template)));
  $("save").disabled=false;$("live").textContent="Aktuell";$("message").textContent="";paint();
}
$("fresh").onclick=()=>loadState(preset(0));$("open").onclick=()=>$("file").click();
$("file").onchange=async()=>{
  const file=$("file").files[0];if(!file)return;
  try{loadState(readDiagram(await file.text()));$("message").textContent="Diagramm geöffnet."}
  catch(e){$("message").textContent="Öffnen fehlgeschlagen. "+e.message}
  $("file").value="";
};
$("save").onclick=()=>{
  const xml=new XMLSerializer().serializeToString($("sheet").firstElementChild);
  const url=URL.createObjectURL(new Blob([xml],{type:"image/svg+xml;charset=utf-8"})),link=document.createElement("a");
  link.href=url;link.download="koordinatensystem.svg";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
};
loadState(state);
