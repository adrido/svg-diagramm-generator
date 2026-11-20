# SVG-Diagramm-Generator

Statische, deutschsprachige Browser-App. Zum lokalen Start dist/index.html in einem aktuellen Browser öffnen. Alternativ im Projektordner `python3 -m http.server 8000 --directory dist` starten und http://localhost:8000 öffnen. Es gibt keine Abhängigkeiten und keinen Build-Schritt.

Für GitHub Pages den Inhalt von dist/ in den Stammordner eines GitHub-Repositorys kopieren. Unter Settings → Pages → Deploy from a branch den Branch und /(root) wählen. Alle Ressourcen verwenden relative Pfade. Für eine Veröffentlichung unter MIT eine LICENSE mit dem MIT-Lizenztext und dem eigenen Copyright-Vermerk ergänzen.

Die erste Ansicht verwendet die Diodenvorlage. „Neu“ startet mit +X / +Y. Ein Unterstrich im Titel leitet den Index ein. Die Schrittweite bezeichnet den Wert eines gleich großen Rasterfelds. Die Pfeilspitze belegt den äußeren Endpunkt.

SVG speichern exportiert das angezeigte Diagramm samt Einstellungen (schemaVersion 2). SVG öffnen liest ausschließlich den JSON-Eintrag im metadata-Element mit der ID svg-diagramm-generator-einstellungen. Dateien werden ausschließlich im Browser verarbeitet.

Unter „Allgemeine Einstellungen“ legen Breite und Höhe die gesamte SVG-Zeichenfläche in Pixeln fest. Das Koordinatensystem wird proportional eingepasst. Der Diagrammname bestimmt den Dateinamen und kann als Überschrift angezeigt werden. Bei leerem Namen wird Koordinatensystem.svg verwendet. Dateien der Version 1 übernehmen ihre bisherigen Zeichenflächenmaße und erhalten einen ausgeblendeten Standardtitel.
