# SVG-Diagramm-Generator

Statische, deutschsprachige Browser-App. Zum lokalen Start dist/index.html in einem aktuellen Browser öffnen. Alternativ im Projektordner `python3 -m http.server 8000 --directory dist` starten und http://localhost:8000 öffnen. Es gibt keine Abhängigkeiten und keinen Build-Schritt.

Für GitHub Pages den Inhalt von dist/ in den Stammordner eines GitHub-Repositorys kopieren. Unter Settings → Pages → Deploy from a branch den Branch und /(root) wählen. Alle Ressourcen verwenden relative Pfade. Für eine Veröffentlichung unter MIT eine LICENSE mit dem MIT-Lizenztext und dem eigenen Copyright-Vermerk ergänzen.

Die erste Ansicht verwendet die Diodenvorlage. Unter „Neu“ stehen +X / +Y, −X / −Y und Vier Richtungen zur Auswahl. „SVG öffnen“ öffnet eine lokale Datei oder lädt das Beispiel Diodenkennlinie. Ein Unterstrich im Größennamen oder Formelzeichen leitet einen Index ein. Die Schrittweite bezeichnet den Wert eines gleich großen Rasterfelds. Die Pfeilspitze belegt den äußeren Endpunkt.

Unter „Allgemeine Einstellungen“ gilt das Format der Einheitenbeschriftung für alle vier Achsenrichtungen. Neue Diagramme verwenden den Bruchstrich, etwa *t* / s oder *v* / (m/s). Alternativ stehen die Schreibweise mit „in“, runde Klammern und eckige Klammern zur Wahl. Jede Richtung hat eigene Felder für Größenname, kursives Formelzeichen und Einheit. Leere Felder werden ausgelassen. Ältere SVG-Dateien ohne Formatangabe öffnen sich mit eckigen Klammern und übernehmen den bisherigen Achsentitel als Größenname.

Unter der Live-Vorschau lässt sich das Hilfsgitter unabhängig vom Raster einschalten. Es teilt jedes Rasterfeld auf beiden Achsen in 2, 4, 5 oder 10 gleiche Abschnitte. Bei neuen Diagrammen und beim Öffnen älterer SVGs ohne Hilfsgitter-Einstellungen ist es ausgeschaltet. Beim Speichern werden Sichtbarkeit und Unterteilung mitgesichert.

SVG speichern exportiert das angezeigte Diagramm samt Einstellungen (schemaVersion 2). SVG öffnen liest ausschließlich den JSON-Eintrag im metadata-Element mit der ID svg-diagramm-generator-einstellungen. Dateien werden ausschließlich im Browser verarbeitet.

Unter „Allgemeine Einstellungen“ legen Breite und Höhe die gesamte SVG-Zeichenfläche wahlweise in Pixeln oder Millimetern fest. Das Koordinatensystem wird proportional eingepasst. Der Diagrammname bestimmt den Dateinamen und kann als Überschrift angezeigt werden. Bei leerem Namen wird Koordinatensystem.svg verwendet. Dateien der Version 1 übernehmen ihre bisherigen Zeichenflächenmaße und erhalten einen ausgeblendeten Standardtitel. Beim Einheitenwechsel entsprechen 96 px genau 25,4 mm. Der Export enthält die gewählte Einheit direkt an width und height.

## Installation als App

Den Generator über HTTPS oder lokal über localhost öffnen. In einem Browser mit PWA-Unterstützung die Installationsfunktion im Browsermenü wählen. Auf dem iPhone in Safari „Teilen“ und „Zum Home-Bildschirm“ wählen. Nach dem ersten abgeschlossenen Laden steht der Generator auch offline zur Verfügung. Zum Testen den Browser offline schalten und die installierte App erneut öffnen.

Bei Änderungen an den zwischengespeicherten Dateien die Versionsnummer in sw.js erhöhen, damit die Offline-Kopie aktualisiert wird.
