"use strict";
const $=id=>document.getElementById(id);
const paths={plus:"M12 5v14M5 12h14",folder:"M3 7V5h7l2 3h9v3M3 9v11h16l3-10H7l-3 9",save:"M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",lock:"M7 10V8a5 5 0 0 1 10 0v2M5 10h14v11H5z",sliders:"M3 7h7m4 0h7M3 17h12m4 0h2M10 4v6m5 4v6",graph:"M3 3v18h18M6 15l5-6 4 3 6-8"};
function icon(path){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg>'}
document.querySelectorAll("[data-i]").forEach(i=>i.innerHTML=icon(paths[i.dataset.i]));
let state=preset(3),expanded=new Set(["px"]);
const captions=["Positive X-Achse","Negative X-Achse","Positive Y-Achse","Negative Y-Achse"];
const labels={title:"Größenname",symbol:"Formelzeichen",unit:"Einheit",step:"Schrittweite",cells:"Rasterfelder",decimals:"Dezimalstellen",sign:"Vorzeichen"};
const errors={symbol:"Maximal 32 druckbare Zeichen.",title:"Maximal 32 druckbare Zeichen.",unit:"Maximal 32 druckbare Zeichen.",step:"Zahl größer 0 bis 1.000.000 eingeben.",cells:"Ganze Zahl von 1 bis 50 eingeben.",decimals:"Ganze Zahl von 0 bis 8 eingeben."};
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
const divisionsField=$("grid-divisions");
for(const divisions of gridDivisions)divisionsField.add(new Option(divisions,divisions));
divisionsField.oninput=update;
$("minor-grid").oninput=update;
function paint(){
  const svg=renderDiagram(state);
  $("sheet").replaceChildren(svg);
  // Der Browser kann die tatsächliche Textbreite erst nach dem Einfügen messen.
  const left=svg.querySelector('[data-achsentitel="nx"]');
  const right=svg.querySelector('[data-achsentitel="px"]');
  if(left?.textContent && right?.textContent){
    const box=left.getBBox();
    if(box.x+box.width+4>right.getBBox().x){
      left.setAttribute("y",Number(left.getAttribute("y"))+ (state.axes.ny.active?24:-24));
    }
  }
  const box=svg.getBBox(), view=svg.viewBox.baseVal;
  const x=Math.min(view.x,box.x-4), y=Math.min(view.y,box.y-4);
  const endX=Math.max(view.x+view.width,box.x+box.width+4);
  const endY=Math.max(view.y+view.height,box.y+box.height+4);
  svg.setAttribute("viewBox",[x,y,endX-x,endY-y].join(" "));
}
for(const id of ["width","height","diagram-title","show-title","unit-format"])$(id).oninput=update;
function displayDimensions(general,unit){
  for(const k of ["width","height"]){
    $(k+"-unit").textContent=unit;
    $(k).value=String(dimensionInUnit(general[k],unit)).replace(".",",");
  }
}
$("size-unit").onchange=()=>{
  displayDimensions(state.general,$("size-unit").value);
  update();
};
function update(){
  applyInputs();
  saveDraft();
}
function applyInputs(){
  const next=structuredClone(state);let ok=true;
  next.minorGrid={enabled:$("minor-grid").checked,divisions:Number(divisionsField.value)};
  divisionsField.disabled=!next.minorGrid.enabled;
  const unit=$("size-unit").value;
  next.general.sizeUnit=unit;
  next.general.unitFormat=$("unit-format").value;
  for(const k of ["width","height"]){
    const field=$(k), raw=field.value.trim().replace(",",".");
    const value=/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)?Number(raw):NaN;
    const previous=state.general[k];
    const pixels=value===dimensionInUnit(previous,unit)?previous:value*(unit==="mm"?pixelsPerMillimeter:1);
    const valid=validDimension(pixels);
    field.setAttribute("aria-invalid",String(!valid));
    $(k+"-error").textContent=valid?"":unit==="mm"?"Maß in mm eingeben (entsprechend 1 bis 20.000 px).":"1 bis 20.000 Pixel eingeben.";
    next.general[k]=pixels;
    ok&&=valid;
  }
  next.general.title=$("diagram-title").value;
  next.general.showTitle=$("show-title").checked;
  const titleValid=validTitle(next.general.title);
  $("diagram-title").setAttribute("aria-invalid",String(!titleValid));
  $("title-error").textContent=titleValid?"":"Maximal 120 druckbare Zeichen eingeben.";
  ok&&=titleValid;
  for(const d of dirs){
    next.axes[d].active=$(d+"-active").checked;
    for(const k of Object.keys(labels)){
      const f=$(d+"-"+k);let v=f.value;
      if(["step","cells","decimals"].includes(k)){const raw=v.trim().replace(",",".");v=/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)?Number(raw):NaN}
      const good=validValue(k,v);f.setAttribute("aria-invalid",String(!good));$("err-"+f.id).textContent=good?"":errors[k];ok&&=good;next.axes[d][k]=v;
    }
  }
  $("size-unit").disabled=!ok;$("save").disabled=$("copy").disabled=!ok;$("live").textContent=ok?"Aktuell":"Eingabe prüfen";$("message").textContent="";
  if(ok){for(const k of ["grid","frame","zero"])next[k]=$(k).checked;state=next;paint()}
}
function loadState(s){
  const unit=s.general.sizeUnit||"px";
  $("unit-format").value=s.general.unitFormat;
  $("size-unit").value=unit;$("size-unit").disabled=false;
  displayDimensions(s.general,unit);
  for(const k of ["width","height"]){
    $(k).removeAttribute("aria-invalid");$(k+"-error").textContent="";
  }
  $("diagram-title").value=s.general.title;$("show-title").checked=s.general.showTitle;
  $("diagram-title").removeAttribute("aria-invalid");$("title-error").textContent="";
  $("minor-grid").checked=s.minorGrid.enabled;
  divisionsField.value=s.minorGrid.divisions;
  divisionsField.disabled=!s.minorGrid.enabled;
  state=s;fields();for(const k of ["grid","frame","zero"])$(k).checked=s[k];
  $("save").disabled=$("copy").disabled=false;$("live").textContent="Aktuell";$("message").textContent="";paint();
}
for(const menu of document.querySelectorAll(".nav-menu")){
  const trigger=menu.querySelector("summary");
  function closeMenu(){
    menu.open=false;
    trigger.focus();
  }
  menu.addEventListener("click",event=>{
    const item=event.target.closest("button");
    if(!item)return;
    closeMenu();
    if(item.id==="open-local")$("file").click();
    else if(item.id==="open-clipboard") openClipboard();
    else {loadState(preset(Number(item.dataset.template)));saveDraft()}
  });
  menu.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&menu.open){event.preventDefault();closeMenu()}
  });
  menu.addEventListener("focusout",event=>{
    if(event.relatedTarget&&!menu.contains(event.relatedTarget))menu.open=false;
  });
  document.addEventListener("pointerdown",event=>{
    if(!menu.contains(event.target))menu.open=false;
  });
}
function openDiagram(source){
  loadState(readDiagram(source));
  saveDraft();
  $("message").textContent="Diagramm geöffnet.";
}
async function openFile(file){
  try{
    checkSvgSize(file.size);
    openDiagram(await file.text());
  }catch(error){
    $("message").textContent="Öffnen fehlgeschlagen. "+error.message;
  }
}
$("file").onchange=async()=>{
  const file=$("file").files[0];
  $("file").value="";
  if(file)await openFile(file);
};

const preview=document.querySelector(".preview");
window.addEventListener("dragover",event=>{
  if(!event.dataTransfer.types.includes("Files"))return;
  event.preventDefault();
  const overPreview=preview.contains(event.target);
  preview.classList.toggle("drop-active",overPreview);
  event.dataTransfer.dropEffect=overPreview?"copy":"none";
});
preview.addEventListener("dragleave",event=>{
  if(!preview.contains(event.relatedTarget))preview.classList.remove("drop-active");
});
window.addEventListener("drop",event=>{
  preview.classList.remove("drop-active");
  if(!event.dataTransfer.types.includes("Files"))return;
  event.preventDefault();
  if(!preview.contains(event.target))return;
  const files=event.dataTransfer.files;
  if(files.length===1)openFile(files[0]);
  else $("message").textContent="Bitte genau eine SVG-Datei ablegen.";
});

const clipboardDialog=$("clipboard-dialog");
const clipboardSource=$("clipboard-source");
function showClipboardDialog(source){
  const copying=source!==undefined;
  $("clipboard-heading").textContent=copying?"SVG kopieren":"Aus Zwischenablage öffnen";
  $("clipboard-instruction").textContent=copying?"Mit Strg+C (Mac: ⌘C) das Diagramm kopieren.":"SVG-Datei oder SVG-Quelltext mit Strg+V (Mac: ⌘V) einfügen.";
  $("clipboard-error").textContent="";
  $("clipboard-import").hidden=copying;
  clipboardSource.readOnly=copying;
  clipboardSource.value=source??"";
  clipboardDialog.showModal();
  clipboardSource.focus();
  if(copying)clipboardSource.select();
}
$("clipboard-close").onclick=()=>clipboardDialog.close();
clipboardDialog.addEventListener("close",()=>{clipboardSource.value=""});
$("clipboard-import").onclick=()=>{
  try{
    openDiagram(clipboardSource.value);
    clipboardDialog.close();
  }catch(error){
    $("clipboard-error").textContent="Öffnen fehlgeschlagen. "+error.message;
    clipboardSource.focus();
  }
};
const svgType="image/svg+xml";
const filePasteHint="Der Browser stellt den Dateiinhalt nicht bereit. Ziehe die SVG-Datei auf die Vorschau oder öffne sie über die Dateiauswahl.";
function clipboardError(message){
  const target=clipboardDialog.open?"clipboard-error":"message";
  $(target).textContent=message;
}
async function importClipboard(source){
  try{
    if(source instanceof Blob){
      checkSvgSize(source.size);
      source=await source.text();
    }
    openDiagram(source);
    if(clipboardDialog.open)clipboardDialog.close();
  }catch(error){
    clipboardError("Öffnen fehlgeschlagen. "+error.message);
  }
}
document.addEventListener("paste",event=>{
  const data=event.clipboardData;
  if(!data || (clipboardDialog.open && clipboardSource.readOnly))return;
  const text=data.getData("text/plain");
  const files=data.files;
  const editing=event.target.closest("input, textarea, [contenteditable=true]");
  const svgText=text.trimStart().startsWith("<");
  // Beim Kopieren einer Grafik liefern manche Browser zusätzlich eine PNG-Datei.
  const pastedSvg=files.length===1 && (files[0].type===svgType || /\.svg$/i.test(files[0].name));
  if(editing && !clipboardDialog.open && !pastedSvg)return;
  if(files.length>1){
    event.preventDefault();
    clipboardError("Bitte genau eine SVG-Datei einfügen.");
    return;
  }
  const source=pastedSvg?files[0]:svgText?text:files[0];
  if(source){
    event.preventDefault();
    importClipboard(source);
  }else if(clipboardDialog.open || data.types.includes("text/uri-list")){
    event.preventDefault();
    clipboardError(filePasteHint);
  }
});
async function openClipboard(){
  try{
    if(navigator.clipboard.read){
      const items=await navigator.clipboard.read();
      if(items.length>1){
        clipboardError("Bitte genau ein Diagramm einfügen.");
        return;
      }
      const item=items[0];
      // Der Text erhält auch Metadaten, die Browser beim Lesen von SVG filtern.
      for(const type of ["text/plain",svgType]){
        if(!item?.types.includes(type))continue;
        const blob=await item.getType(type);
        if(type===svgType || (await blob.slice(0,1024).text()).trimStart().startsWith("<")){
          await importClipboard(blob);
          return;
        }
      }
    }else{
      const text=await navigator.clipboard.readText();
      if(text.trimStart().startsWith("<")){
        await importClipboard(text);
        return;
      }
    }
  }catch{
    // Das native Einfügeereignis kann auch bei gesperrtem API-Zugriff Dateien liefern.
  }
  showClipboardDialog();
}
function serializeDiagram(svg) {
  const copy = svg.cloneNode(true);
  for (const element of Array.from(copy.children)) {
    // Innerhalb von <text> würde zusätzlicher Leerraum die Beschriftung ändern.
    element.before("\n  ");
  }
  copy.append("\n");
  const xml = new XMLSerializer().serializeToString(copy);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml + "\n";
}
function clipboardImageHtml(xml){
  const image=document.createElement("img");
  image.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(xml);
  return image.outerHTML;
}
clipboardSource.addEventListener("copy",event=>{
  if(!clipboardSource.readOnly || !event.clipboardData)return;
  event.clipboardData.setData("text/html",clipboardImageHtml(clipboardSource.value));
  event.clipboardData.setData("text/plain",clipboardSource.value);
  event.preventDefault();
});
$("copy").onclick=async()=>{
  const xml=serializeDiagram($("sheet").firstElementChild);
  const svg=new Blob([xml],{type:svgType});
  try{
    if(!navigator.clipboard?.write || !window.ClipboardItem){
      showClipboardDialog(xml);
      return;
    }
    // Writer kann das eingebettete SVG auch über das HTML-Bild übernehmen.
    const formats={
      "text/html":new Blob([clipboardImageHtml(xml)],{type:"text/html"}),
      "text/plain":new Blob([xml],{type:"text/plain"})
    };
    if(ClipboardItem.supports?.(svgType))formats[svgType]=svg;
    await navigator.clipboard.write([new ClipboardItem(formats)]);
    $("message").textContent="Diagramm als Grafik kopiert.";
  }catch{
    showClipboardDialog(xml);
  }
};
$("save").onclick=()=>{
  const xml=serializeDiagram($("sheet").firstElementChild);
  const url=URL.createObjectURL(new Blob([xml],{type:"image/svg+xml;charset=utf-8"})),link=document.createElement("a");
  link.href=url;link.download=downloadName(state.general.title);document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
};
const draftKey="svg-diagramm-generator:entwurf:"+new URL(".",location.href).pathname;
const rememberDraft=$("remember-draft");
const draftMessage=$("draft-message");
function diagramFields(){
  return document.querySelectorAll(".workspace input[id], .workspace select[id]");
}
function saveDraft(){
  if(!rememberDraft.checked)return;
  const values={};
  for(const field of diagramFields()){
    values[field.id]=field.type==="checkbox"?field.checked:field.value;
  }
  try{
    localStorage.setItem(draftKey,JSON.stringify({version:2,state,values}));
    draftMessage.textContent="";
  }catch{
    draftMessage.textContent="Der Entwurf konnte nicht lokal gespeichert werden. Prüfe die Eingaben und sichere das Diagramm über „SVG speichern“.";
  }
}
rememberDraft.onchange=()=>{
  if(rememberDraft.checked){
    saveDraft();
    if(!draftMessage.textContent)draftMessage.textContent="Entwurf auf diesem Gerät gespeichert. Beim Ausschalten wird der lokale Entwurf gelöscht.";
  }else{
    try{
      localStorage.removeItem(draftKey);
      draftMessage.textContent="Lokaler Entwurf gelöscht.";
    }catch{
      rememberDraft.checked=true;
      draftMessage.textContent="Der lokale Entwurf konnte nicht gelöscht werden.";
    }
  }
};
window.addEventListener("storage",event=>{
  if((event.key===draftKey||event.key===null)&&event.newValue===null&&rememberDraft.checked){
    rememberDraft.checked=false;
    draftMessage.textContent="Die lokale Entwurfsspeicherung wurde in einem anderen Fenster aufgehoben.";
  }
});
function startEditor(){
  rememberDraft.checked=false;
  let saved;
  try{saved=localStorage.getItem(draftKey)}catch{
    loadState(state);
    draftMessage.textContent="Der lokale Speicher ist nicht verfügbar. Sichere dein Diagramm über „SVG speichern“.";
    return;
  }
  if(saved===null){loadState(state);return}
  try{
    const draft=JSON.parse(saved);
    if(![1,2].includes(draft?.version)||!draft.values)throw Error();
    // Frühere lokale Entwürfe verwenden das alte Zustandsformat 2, teils ohne sizeUnit.
    if(draft.version===1){
      if(draft.state?.schemaVersion!==2)throw Error();
      draft.state.schemaVersion=currentSchemaVersion;
      if(draft.state.general.sizeUnit===undefined)draft.state.general.sizeUnit="px";
    }
    loadState(validate(draft.state));
    for(const field of diagramFields()){
      const value=draft.values[field.id];
      if(field.type==="checkbox"){
        if(typeof value!=="boolean")throw Error();
        field.checked=value;
      }else{
        if(typeof value!=="string")throw Error();
        field.value=value;
        if(field.tagName==="SELECT"&&field.selectedIndex===-1)throw Error();
      }
    }
    applyInputs();
    rememberDraft.checked=true;
    draftMessage.textContent="Lokaler Entwurf wiederhergestellt.";
  }catch{
    loadState(preset(3));
    draftMessage.textContent="Der lokale Entwurf konnte nicht gelesen werden. Die Standardvorlage wurde geöffnet.";
  }
}
startEditor();
if ("serviceWorker" in navigator && ["https:", "http:"].includes(location.protocol)) {
  navigator.serviceWorker.register("./sw.js").catch(error => {
    console.warn("Der Offline-Modus konnte nicht aktiviert werden.", error);
  });
}
