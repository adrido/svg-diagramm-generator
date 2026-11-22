"use strict";
const editor=document.getElementById("editor");
editor.addEventListener("load",async()=>{
  const app=editor.contentWindow, doc=editor.contentDocument;
  const report=document.getElementById("result");
  const results=[];
  function check(condition,name){
    if(!condition)throw Error(name);
    results.push(name);
  }
  function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
  function exportSvg(){return app.serializeDiagram(doc.querySelector("#sheet svg"))}
  async function openFile(xml){
    const input=doc.getElementById("file"), transfer=new DataTransfer();
    transfer.items.add(new File([xml],"Test.svg",{type:"image/svg+xml"}));
    input.files=transfer.files;
    await input.onchange();
    return doc.getElementById("message").textContent;
  }
  try{
    doc.getElementById("remember-draft").checked=false;
    const inkscape=await fetch("fixtures/inkscape-1.2.2.svg").then(response=>response.text());
    const expected=app.preset(3);
    Object.assign(expected.general,{sizeUnit:"mm",width:912.5,title:'Mäßig & <heiß> "Δ" µΩ° &#x20; &amp; 🧭',showTitle:true});
    Object.assign(expected.minorGrid,{enabled:true,divisions:10});
    Object.values(expected.axes).forEach((axis,i)=>Object.assign(axis,{title:"Wert < "+i,symbol:"Δ_"+i,unit:"µΩ / °"}));
    check(same(app.readDiagram(inkscape),expected),"Inkscape 1.2.2 – gespeicherte Beispieldatei");
    const state=app.preset(3);
    Object.assign(state.general,{width:899.125,height:573.5,title:'Größe & <Wert> "µΩ°Δ" &#x20; &amp; 🧭',showTitle:true,sizeUnit:"mm"});
    state.minorGrid={enabled:true,divisions:10};
    for(const [i,axis] of Object.values(state.axes).entries()){
      Object.assign(axis,{title:'Größe '+i+' & < >',symbol:'Δ_'+i,unit:'µΩ / °',sign:["plus","amount","negative","plus"][i]});
    }
    for(const format of ["in","brackets","parentheses","slash"]){
      state.general.unitFormat=format;
      app.loadState(state);
      check(same(app.readDiagram(exportSvg()),state),"Vollständiger Roundtrip für "+format);
    }
    const xml=exportSvg();
    check(xml===exportSvg(),"Deterministischer Export");
    const parser=new DOMParser();
    const svg=parser.parseFromString(xml,"image/svg+xml");
    const ns="https://github.com/adrido/svg-diagramm-generator/ns/diagram/1";
    const record=svg.getElementsByTagNameNS(ns,"document")[0];
    check(record&&record.parentNode.localName==="metadata"&&record.textContent.includes("\n"),"Gültiges XML mit mehrzeiligem JSON");
    function modified(edit){
      const copy=svg.cloneNode(true), item=copy.getElementsByTagNameNS(ns,"document")[0];
      edit(item,copy);
      return new XMLSerializer().serializeToString(copy);
    }
    function changeData(edit){return modified(item=>{
      const data=JSON.parse(item.textContent);
      edit(data);
      item.textContent=JSON.stringify(data);
    })}
    const rewritten=xml.replaceAll("sdg:document","projekt:document").replace("xmlns:sdg=","xmlns:projekt=")
      .replace(/>([^<]+)<\/projekt:document>/,(_,json)=>">"+json.replaceAll(" ","&#x20;")
        .replaceAll('"',"&quot;").replaceAll(">","&gt;")+"</projekt:document>");
    check(rewritten.includes("&quot;schemaVersion&quot;")&&rewritten.includes("&amp;#x20;")
      &&same(app.readDiagram(rewritten),state),"Präfixwechsel, Zeichenreferenzen und wörtliche Entity-Texte");
    const edited=modified((item,copy)=>{
      const circle=copy.createElementNS(copy.documentElement.namespaceURI,"circle");
      circle.id="extern";copy.documentElement.append(circle);
    });
    check(await openFile(edited)==="Diagramm geöffnet."&&!doc.querySelector("#extern")
      &&same(app.readDiagram(exportSvg()),state),"Datei öffnen und Vorschau aus Projektdaten aufbauen");
    const before=exportSvg(), title=doc.getElementById("diagram-title");
    title.value="Unfertige Eingabe";
    const bad=[
      ["XML","<svg"],["Dokumenttyp",'<!DOCTYPE svg>'+xml.slice(xml.indexOf("<svg"))],
      ["Fehlende Metadaten",modified(item=>item.remove())],
      ["Früheres Format",modified(item=>{item.parentNode.id="svg-diagramm-generator-einstellungen";item.replaceWith(item.textContent)})],
      ["Ungültiges JSON",modified(item=>item.textContent="{")],
      ["XML-Version fehlt",modified(item=>item.removeAttribute("version"))],
      ["Unbekannte XML-Version",modified(item=>item.setAttribute("version","2"))],
      ["Kodierung",modified(item=>item.removeAttribute("encoding"))],
      ["JSON-Version fehlt",changeData(data=>delete data.schemaVersion)],
      ["Unbekannte JSON-Version",changeData(data=>data.schemaVersion=2)],
      ["Ungültiger Versionstyp",changeData(data=>data.schemaVersion="1")],
      ["Achse unvollständig",changeData(data=>delete data.axes.ny.symbol)],
      ["Ungültiger Datentyp",changeData(data=>data.axes.px.cells="3")],
      ["Hilfsgitter fehlt",changeData(data=>delete data.minorGrid)],
      ["Zeichenflächeneinheit fehlt",changeData(data=>delete data.general.sizeUnit)],
      ["Unbekanntes Feld",changeData(data=>data.general.neu=true)],
      ["Mehrdeutige Metadaten",modified(item=>item.after(item.cloneNode(true)))],
      ["Falsche Position",modified((item,copy)=>copy.documentElement.append(item))],
      ["Metadatenlimit",modified(item=>item.prepend(" ".repeat(65536)))],
      ["Dateigrößenlimit",xml+" ".repeat(2*1024*1024)]
    ];
    for(const [name,input] of bad){
      const message=await openFile(input);
      check(message.startsWith("Öffnen fehlgeschlagen.")&&exportSvg()===before&&title.value==="Unfertige Eingabe",name+" – bisheriger Zustand erhalten");
    }
    report.textContent=results.length+" Prüfungen bestanden.\n"+results.join("\n");
  }catch(error){
    report.textContent="FEHLER nach "+results.length+" Prüfungen: "+error.message;
    console.error(error);
  }
});
