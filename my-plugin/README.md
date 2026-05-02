# My Plugin

Dieses Plugin wurde ueber das FediSuite-Scaffold erzeugt.

## Enthaltene Presets

- `admin-page`

## Wichtige Dateien

- `plugin.json`: Manifest und Pflichtdaten
- `server/index.js`: Plugin-Registrierung in FediSuite
- `i18n/`: Plugin-eigene Uebersetzungen
- `web/`: optionale Plugin-Webseiten fuer App- oder Admin-Sektionen

## Naechste Schritte

1. Passe `plugin.json` an, falls Name, Beschreibung oder Version noch nicht stimmen.
2. Bearbeite `server/index.js` und ersetze die Beispiel-Logik durch die echte Plugin-Logik.
3. Passe die Texte in `i18n/de.json`, `i18n/en.json` und `i18n/it.json` an.
4. Bearbeite die Dateien in `web/`, falls dein Plugin eine eigene Seite rendern soll.
5. Teste das Plugin lokal ueber das gemountete Plugin-Verzeichnis.

## Komfort-Helfer im Plugin-Kontext

Das aktuelle Scaffold nutzt bereits die bequemeren Integrationshelfer aus FediSuite:

- `context.ref(key, fallback)`
- `context.registerStatusRoute(...)`
- `context.registerMarkdownAdminPage(...)`
- `context.registerMarkdownAppPage(...)`
- `context.registerSimpleDashboardWidget(...)`
- `context.registerSimpleComposerExtension(...)`
- `context.registerSimpleProvider(...)`
- `context.registerSimpleAuthProvider(...)`
- `context.registerSimpleInsightProvider(...)`

Damit musst du fuer Standardfaelle deutlich weniger Boilerplate selbst schreiben.

## Hilfe

Die ausfuehrliche Autoren-Dokumentation findest du im Hauptrepo in `docs/PLUGIN-AUTHORING.de.md`.
