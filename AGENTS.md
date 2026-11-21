# SVG-Diagramm-Generator

Deutschsprachige, statische Browser-App für SVG-Koordinatensysteme mit separat konfigurierbaren Achsen in vier Richtungen und Live-Vorschau. SVG-Dateien werden lokal im Browser verarbeitet. Ihre JSON-Metadaten speichern die Einstellungen für das spätere Öffnen und Bearbeiten.

- `dist/` enthält die auslieferbaren Quelldateien. Das Projekt hat keine Abhängigkeiten und keinen Build-Schritt. Für lokale Prüfungen `python3 -m http.server 8000 --directory dist` ausführen.
- `dist/app.js` steuert die Oberfläche. `dist/diagram.js` rendert das SVG und verarbeitet die Diagrammeinstellungen. Bei Änderungen am Metadatenschema die Importkompatibilität mit älteren Exporten prüfen.
- Bei Änderungen an Dateien im Offline-Cache die Cache-Version in `dist/sw.js` erhöhen.

## Git-Commits

- Vor dem Commit `git diff --cached` prüfen. Pro Commit eine zusammenhängende Änderung erfassen.
- Titel auf Deutsch mit einem konkreten Verb im Infinitiv formulieren. Betroffenen Bereich und sichtbare Wirkung benennen. Beispiel: `Millimeter als Einheit für die SVG-Zeichenfläche ergänzen`.
- Bei mehreren relevanten Aspekten nach einer Leerzeile einen kurzen Text ergänzen. Grund, wichtige Verhaltensänderungen oder Folgen für bestehende Dateien beschreiben.
- Bei manuellen Commits und Sites-Exporten, sofern sich der Titel setzen lässt, konkrete Titel verwenden. Bestehende automatische Titel wie `Update Site source` nur im Rahmen einer ausdrücklich beauftragten Überarbeitung der Git-Historie ersetzen.
