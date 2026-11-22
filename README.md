# SVG-Diagramm-Generator

Statische, deutschsprachige Browser-App. Zum lokalen Start dist/index.html in einem aktuellen Browser öffnen. Alternativ im Projektordner `python3 -m http.server 8000 --directory dist` starten und http://localhost:8000 öffnen. Es gibt keine Abhängigkeiten und keinen Build-Schritt.

Für GitHub Pages den Inhalt von dist/ in den Stammordner eines GitHub-Repositorys kopieren. Unter Settings → Pages → Deploy from a branch den Branch und /(root) wählen. Alle Ressourcen verwenden relative Pfade. Für eine Veröffentlichung unter MIT eine LICENSE mit dem MIT-Lizenztext und dem eigenen Copyright-Vermerk ergänzen.

Die erste Ansicht verwendet die Diodenvorlage. Unter „Neu“ stehen +X / +Y, −X / −Y und Vier Richtungen zur Auswahl. „SVG öffnen“ öffnet eine lokale Datei oder lädt das Beispiel Diodenkennlinie. Ein Unterstrich im Größennamen oder Formelzeichen leitet einen Index ein. Die Schrittweite bezeichnet den Wert eines gleich großen Rasterfelds. Die Pfeilspitze belegt den äußeren Endpunkt.

Mit „Entwurf auf diesem Gerät merken“ in der Kopfzeile lässt sich die lokale Entwurfsspeicherung einschalten. Die App merkt sich auch unfertige Eingaben und stellt den letzten Entwurf beim nächsten Öffnen im selben Browserprofil wieder her. Ausschalten löscht die lokale Sicherung. Für eine dauerhafte Kopie „SVG speichern“ verwenden.

Unter „Allgemeine Einstellungen“ gilt das Format der Einheitenbeschriftung für alle vier Achsenrichtungen. Neue Diagramme verwenden den Bruchstrich, etwa *t* / s oder *v* / (m/s). Alternativ stehen die Schreibweise mit „in“, runde Klammern und eckige Klammern zur Wahl. Jede Richtung hat eigene Felder für Größenname, kursives Formelzeichen und Einheit. Leere Felder werden ausgelassen.

Unter der Live-Vorschau lässt sich das Hilfsgitter unabhängig vom Raster einschalten. Es teilt jedes Rasterfeld auf beiden Achsen in 2, 4, 5 oder 10 gleiche Abschnitte. Bei neuen Diagrammen ist es ausgeschaltet. Beim Speichern werden Sichtbarkeit und Unterteilung mitgesichert.

Unter „Allgemeine Einstellungen“ legen Breite und Höhe die gesamte SVG-Zeichenfläche wahlweise in Pixeln oder Millimetern fest. Das Koordinatensystem wird proportional eingepasst. Der Diagrammname bestimmt den Dateinamen und kann als Überschrift angezeigt werden. Bei leerem Namen wird Koordinatensystem.svg verwendet. Beim Einheitenwechsel entsprechen 96 px genau 25,4 mm. Der Export enthält die gewählte Einheit direkt an width und height.

## SVG speichern und wieder öffnen

„SVG speichern“ schreibt die sichtbare Vektorgrafik und den vollständigen Diagrammzustand in dieselbe UTF-8-Datei. Der Zustand steht als JSON-Text in genau einem Projektelement unter einem direkten `<metadata>`-Kind des SVG-Wurzelelements. Der folgende Auszug zeigt die Hülle. Anstelle der Auslassung steht im Export das vollständige JSON-Objekt.

```xml
<metadata xmlns="http://www.w3.org/2000/svg">
  <sdg:document xmlns:sdg="https://github.com/adrido/svg-diagramm-generator/ns/diagram/1"
                version="1" encoding="application/json">…</sdg:document>
</metadata>
```

Die Namespace-URI identifiziert das Projekt dauerhaft. Das Präfix und die Position der Namespace-Deklaration können sich beim Speichern ändern. Das XML-Attribut `version` und das numerische JSON-Feld `schemaVersion` bezeichnen beide die Datenformatversion 1, unabhängig vom Versionsstand der App. Das JSON enthält die Vorlage, alle vier Achsen mit Beschriftungen und Skalierung, Raster, Hilfsgitter, Rahmen, Nullbeschriftung und sämtliche allgemeinen Einstellungen. Breite und Höhe sind intern Pixelwerte. `sizeUnit` bestimmt die Anzeige- und Exporteinheit.

Der Export setzt JSON als Textknoten ein. Der XML-Serializer übernimmt die Maskierung. Beim Öffnen liest ein XML-Parser die Datei lokal ein und löst Zeichenreferenzen genau einmal auf. So wird `&#x20;` zu einem Leerzeichen, während `&amp;#x20;` den wörtlich eingegebenen Text `&#x20;` erhält. Erst danach liest der Generator den Text als JSON und prüft Version, Pflichtfelder, Typen und Wertebereiche. Zusätzliche JSON-Felder und unbekannte Versionen führen zu einer Fehlermeldung. Für spätere Formatänderungen kann die Versionsprüfung um eine gezielte Migration vor der Validierung erweitert werden.

Der Import erlaubt Dateien bis 2 MiB und höchstens 65.536 UTF-16-Codeeinheiten im dekodierten JSON-Text. Dokumenttyp-Deklarationen werden abgewiesen. Die Vorschau entsteht vollständig aus den geprüften Einstellungen. Bei einem Importfehler bleiben das offene Diagramm und die bisherigen Eingaben erhalten.

### Bearbeiten in Inkscape

Manuelle Änderungen an Linien, Texten oder anderen sichtbaren Elementen bleiben in der extern bearbeiteten SVG erhalten. Beim erneuten Öffnen im Generator rekonstruiert dieser die Grafik aus den Projektdaten. Beim anschließenden Export gehen solche manuellen Änderungen verloren. Für beide Bearbeitungsstände separate Dateien speichern.

Beim optimierten Export müssen die Metadaten erhalten bleiben. Entfernt ein Werkzeug das Projektelement, bleibt die SVG als Vektorgrafik verwendbar. Das gilt auch für ältere Generator-SVGs mit JSON direkt im Metadatenelement. Der aktuelle Editor kann diese älteren Dateien nicht wieder öffnen. Vorhandene lokale Browserentwürfe aus der vorherigen App-Version werden beim Öffnen übernommen.

### Metadatentests

Im Projektstamm `python3 -m http.server 8000` starten und `http://localhost:8000/tests/metadata.html` öffnen. Die Tests laufen automatisch und melden das Ergebnis auf der Seite. Sie prüfen alle vier Beschriftungsformate, XML-Maskierung, Präfixwechsel, die Fehlerfälle beim Dateiöffnen und den Erhalt des bisherigen Editorzustands. Die Beispieldatei unter `tests/fixtures/` wurde mit Inkscape 1.2.2 als Inkscape-SVG gespeichert.

## Installation als App

Den Generator über HTTPS oder lokal über localhost öffnen. In einem Browser mit PWA-Unterstützung die Installationsfunktion im Browsermenü wählen. Auf dem iPhone in Safari „Teilen“ und „Zum Home-Bildschirm“ wählen. Nach dem ersten abgeschlossenen Laden steht der Generator auch offline zur Verfügung. Zum Testen den Browser offline schalten und die installierte App erneut öffnen.

Bei Änderungen an den zwischengespeicherten Dateien die Versionsnummer in sw.js erhöhen, damit die Offline-Kopie aktualisiert wird.
