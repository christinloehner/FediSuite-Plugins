# FediSuite Plugin-Authoring Guide

Diese Dokumentation richtet sich ausdruecklich **nicht nur an Experten**.

Sie soll dir helfen, ein neues FediSuite-Plugin so einfach wie moeglich zu bauen, ohne dass du zuerst den halben FediSuite-Kern verstehen musst.

Wichtig:

- Du musst natuerlich die **eigentliche Logik deines Plugins** selbst programmieren.
- Aber alles, was mit **Manifest**, **Registrierung**, **Integration**, **Plugin-Seiten**, **i18n** und **Grundstruktur** zu tun hat, sollte fuer dich moeglichst einfach sein.
- Genau dafuer gibt es jetzt ein Scaffold und diese Dokumentation.

Zugehoeriges GitHub-Issue fuer das Plugin-System: `#29`

## 1. Die Grundidee

Ein FediSuite-Plugin ist ein normales Verzeichnis im Plugin-Ordner.

FediSuite scannt dieses Verzeichnis, sucht darin nach einer `plugin.json` und prueft dann:

1. Ist die Struktur gueltig?
2. Passt die Plugin-API-Version?
3. Sind die Pfade sicher?
4. Hat das Plugin alle erforderlichen Angaben?
5. Darf es die angefragten Erweiterungspunkte ueberhaupt benutzen?

Wenn das alles stimmt, wird das Plugin geladen und seine Erweiterungen werden in FediSuite registriert.

## 2. Der einfachste Einstieg

Wenn du ein neues Plugin bauen willst, beginne **nicht** mit einem leeren Ordner.

Benutze stattdessen das Scaffold:

```bash
npm run plugins:create -- \
  --id my-plugin \
  --name "My Plugin" \
  --author "Your Name" \
  --presets admin-page
```

Dadurch wird standardmaessig ein neues Plugin unter

```text
plugins/my-plugin
```

angelegt.

Das Scaffold erzeugt bereits:

- eine gueltige `plugin.json`
- eine `server/index.js`
- Sprachdateien in `i18n/de.json`, `i18n/en.json`, `i18n/it.json`
- bei Bedarf ein `web/manifest.json`
- bei Bedarf fertige Beispiel-HTML-/JS-Dateien fuer Plugin-Seiten
- eine `README.md` direkt im Plugin-Ordner

Du startest also **nicht** bei null.

## 3. Verfuegbare Presets

Das Scaffold kennt aktuell diese Presets:

- `admin-page`
- `app-page`
- `dashboard-widget`
- `composer-extension`
- `provider`
- `auth-provider`
- `insights-provider`
- `settings`

Du kannst mehrere Presets kombinieren:

```bash
npm run plugins:create -- \
  --id publishing-helper \
  --name "Publishing Helper" \
  --author "Your Name" \
  --presets app-page,dashboard-widget,composer-extension
```

### Was jedes Preset automatisch macht

`admin-page`

- registriert eine Plugin-Admin-Seite
- erzeugt eine passende Admin-Webseite
- traegt automatisch die noetigen Capabilities und Permissions ein

`app-page`

- registriert eine allgemeine Plugin-Hauptsektion in der Sidebar
- erzeugt eine passende Plugin-Webseite
- traegt automatisch die noetigen Capabilities und Permissions ein

`dashboard-widget`

- registriert ein einfaches Dashboard-Widget
- erzeugt Beispieltexte in den i18n-Dateien

`composer-extension`

- registriert eine einfache Composer-Erweiterung
- erzeugt ein kleines Beispiel fuer ein zusaetzliches Eingabefeld und eine Text-Transformation

`provider`

- registriert einen einfachen Connector-Provider
- erzeugt nur die notwendige Integrationsstruktur
- du musst hauptsaechlich nur noch `beginConnection` und `handleCallback` mit deiner echten Logik fuellen

`auth-provider`

- registriert einen einfachen Login-Provider fuer FediSuite selbst
- erzeugt die noetige Grundstruktur fuer Start- und Callback-Flow

`insights-provider`

- registriert einen einfachen Insight-Provider
- du kannst mit statischen Tipps starten oder spaeter auf dynamische Generierung wechseln

`settings`

- erzeugt direkt ein minimales `settingsSchema` im Manifest
- zeigt dir den vorgesehenen Weg fuer plugin-eigene Laufzeitkonfiguration

## 4. Die minimale Plugin-Struktur

Ein Plugin sollte im einfachsten Fall so aussehen:

```text
my-plugin/
  plugin.json
  server/
    index.js
  i18n/
    de.json
    en.json
    it.json
```

Wenn dein Plugin eigene Plugin-Seiten im FediSuite-Frontend rendern soll, kommt noch dazu:

```text
  web/
    manifest.json
    ...
```

## 5. Was genau ist Pflicht?

Die Pflichtdaten werden im Kern in [server/plugins/security.js](/server/src/privat/FediSuite/FediSuite-Docker-Image/server/plugins/security.js:73) validiert.

Pflichtfelder in `plugin.json` sind aktuell:

- `id`
- `name`
- `version`
- `pluginApiVersion`
- `description`
- `author`
- `license`
- `capabilities`
- `serverEntry`

Ein minimales Manifest sieht so aus:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "pluginApiVersion": 1,
  "description": "A simple FediSuite plugin.",
  "author": "Your Name",
  "license": "GPL-3.0-or-later",
  "capabilities": [
    "admin.section"
  ],
  "requiredPermissions": [
    "admin.sections"
  ],
  "i18nDir": "./i18n",
  "displayNameKey": "meta.name",
  "descriptionKey": "meta.description",
  "serverEntry": "./server/index.js"
}
```

## 6. Was bedeuten die wichtigsten Manifest-Felder?

### `id`

Die stabile technische Plugin-ID.

Beispiel:

```json
"id": "my-plugin"
```

Diese ID wird an mehreren Stellen verwendet:

- als eindeutiger Schluessel in FediSuite
- im API-Pfad unter `/api/plugins/<pluginId>/...`
- im i18n-Namespace `plugin.<pluginId>`

Regel:

- nur Buchstaben, Zahlen, Punkt, Unterstrich, Bindestrich
- am besten kurz, eindeutig und stabil

### `pluginApiVersion`

Damit sagt dein Plugin, fuer welche FediSuite-Plugin-API es gebaut wurde.

Aktuell:

```json
"pluginApiVersion": 1
```

Wenn diese Version nicht passt, wird das Plugin nicht geladen.

### `capabilities`

Hier beschreibst du, **was dein Plugin fachlich kann**.

Beispiele:

- `admin.section`
- `app.section`
- `dashboard.widget`
- `composer.extension`
- `provider`
- `auth.provider`
- `insights.provider`

Wichtig:

`capabilities` sind **nicht** dasselbe wie `requiredPermissions`.

### `requiredPermissions`

Hier beschreibst du, **welche Integrationsrechte** dein Plugin wirklich braucht.

Beispiele:

- `admin.sections`
- `app.sections`
- `dashboard.widgets`
- `composer.extensions`
- `api.routes`
- `web.runtime`
- `providers`
- `auth.providers`

Wenn dein Plugin etwas registriert, ohne die passende Permission im Manifest zu deklarieren, scheitert das Booten bewusst mit einer klaren Fehlermeldung.

## 7. Welche Capability braucht welche Permission?

Hier ist die wichtigste Zuordnung fuer typische Plugin-Arten.

### Nur Admin-Seite

`capabilities`

```json
["admin.section"]
```

`requiredPermissions`

```json
["admin.sections"]
```

Wenn die Seite ueber `web/manifest.json` als echte Plugin-Webseite gerendert werden soll, kommt dazu:

```json
["web.runtime"]
```

Wenn diese Seite ueber eigene Plugin-API-Routen Daten laden soll, kommt dazu:

```json
["api.routes"]
```

### Nur App-Seite in der Hauptnavigation

`capabilities`

```json
["app.section"]
```

`requiredPermissions`

```json
["app.sections"]
```

Optional zusaetzlich:

- `web.runtime`
- `api.routes`

### Nur Dashboard-Widget

`capabilities`

```json
["dashboard.widget"]
```

`requiredPermissions`

```json
["dashboard.widgets"]
```

### Nur Composer-Erweiterung

`capabilities`

```json
["composer.extension"]
```

`requiredPermissions`

```json
["composer.extensions"]
```

### Nur Insight-Provider

`capabilities`

```json
["insights.provider"]
```

`requiredPermissions`

```json
["insight.providers"]
```

### Provider / Connector

`capabilities`

```json
["provider"]
```

`requiredPermissions`

```json
["providers"]
```

### Login-Provider fuer FediSuite selbst

`capabilities`

```json
["auth.provider"]
```

`requiredPermissions`

```json
["auth.providers"]
```

## 8. Die wichtigste Datei: `server/index.js`

Dein Plugin wird ueber die Funktion `register(context)` in FediSuite integriert.

Ein sehr einfaches Beispiel:

```js
export function register(context) {
  context.registerMarkdownAdminPage({
    id: 'main',
    titleKey: 'adminSections.main.title',
    descriptionKey: 'adminSections.main.description',
    markdownKey: 'adminSections.main.markdown',
  });
}
```

Das ist bereits ein voll gueltiges Plugin.

Du musst also **nicht** zuerst Provider, Hooks, Web-Runtime oder Auth implementieren.

## 9. Was ist `context`?

Der Plugin-Kontext ist deine offizielle Integrationsoberflaeche in FediSuite.

Er wird im Kern in [server/plugins/loader.js](/server/src/privat/FediSuite/FediSuite-Docker-Image/server/plugins/loader.js:223) aufgebaut.

Die wichtigsten Teile davon sind:

### `context.plugin`

Enthaelt die Plugin-Metadaten.

Beispiel:

```js
context.plugin.plugin_id
```

### `context.namespace`

Der feste i18n-Namespace deines Plugins.

Beispiel:

```js
plugin.my-plugin
```

### `context.createI18nRef(key, fallback)`

Erzeugt eine sichere Referenz auf einen Text in deinen Plugin-Sprachdateien.

Beispiel:

```js
context.createI18nRef('adminSections.main.title', 'My Plugin')
```

### `context.ref(key, fallback)`

Kurze Alias-Schreibweise fuer `context.createI18nRef(...)`.

Fuer neue Plugins ist das in der Regel die angenehmere Variante.

### `context.registerAdminSection(definition)`

Registriert eine Admin-Seite.

### `context.registerAppSection(definition)`

Registriert eine allgemeine Plugin-Sektion in der Sidebar.

### `context.registerMarkdownAdminPage(definition)`

Der einfachste Weg fuer eine Admin-Seite.

Du uebergibst nur Titel-/Beschreibung-/Markdown-Keys oder direkte Texte, und FediSuite erzeugt daraus die korrekte Admin-Section-Struktur.

### `context.registerMarkdownAppPage(definition)`

Der einfachste Weg fuer eine normale Plugin-Seite in der Hauptnavigation.

### `context.registerDashboardWidget(definition)`

Registriert ein Dashboard-Widget.

### `context.registerSimpleDashboardWidget(definition)`

Der einfachste Weg fuer ein kleines Stats-/Status-Widget.

### `context.registerSimpleComposerExtension(definition)`

Bequemer Wrapper fuer typische Composer-Erweiterungen mit Feldern und `transformPost`.

### `context.registerComposerExtension(definition)`

Registriert zusaetzliche Eingabefelder und Logik fuer den Composer.

### `context.registerSimpleProvider(definition)`

Der empfohlene Einstieg fuer neue Connector-Plugins.

Damit musst du nicht jedes Integrationsdetail selbst zusammensetzen. Meist reichen:

- `id`
- `displayName` oder `displayNameKey`
- `beginConnection`
- `handleCallback`

### `context.registerSimpleAuthProvider(definition)`

Der einfachste Einstieg fuer Login-Provider.

### `context.registerSimpleInsightProvider(definition)`

Der einfachste Einstieg fuer Insight-Provider.

### `context.registerApiRoute(definition)`

Registriert einen Plugin-API-Endpunkt unter:

```text
/api/plugins/<pluginId>/...
```

### `context.getSettings()`

Laedt die effektiven Plugin-Einstellungen.

### `context.getSetting(key, fallback)`

Laedt genau einen bestimmten Wert.

## 10. Der einfachste Plugin-Typ: eine statische Admin-Seite

Wenn du nur einen sichtbaren Bereich im Admin brauchst, starte so:

```js
export function register(context) {
  context.registerMarkdownAdminPage({
    id: 'main',
    titleKey: 'adminSections.main.title',
    descriptionKey: 'adminSections.main.description',
    markdownKey: 'adminSections.main.markdown',
  });
}
```

Dafuer brauchst du:

- `capabilities: ["admin.section"]`
- `requiredPermissions: ["admin.sections"]`

Mehr nicht.

## 10a. Der empfohlene Standardweg fuer neue Plugins

Wenn du neu anfängst, benutze nach Moeglichkeit diese Komfort-Helfer statt der niedrigeren Basis-APIs:

- fuer statische Admin-Seiten: `context.registerMarkdownAdminPage(...)`
- fuer statische App-Seiten: `context.registerMarkdownAppPage(...)`
- fuer einfache Widgets: `context.registerSimpleDashboardWidget(...)`
- fuer typische Composer-Erweiterungen: `context.registerSimpleComposerExtension(...)`
- fuer Connectoren: `context.registerSimpleProvider(...)`
- fuer Login-Provider: `context.registerSimpleAuthProvider(...)`
- fuer Insight-Tipps: `context.registerSimpleInsightProvider(...)`

Die niedrigeren Funktionen wie `registerAdminSection`, `registerProvider` oder `registerInsightProvider` bleiben wichtig, wenn du bewusst von der Standardstruktur abweichen willst. Fuer die meisten neuen Plugins solltest du sie aber nicht als ersten Einstieg brauchen.

## 10b. Minimalbeispiele fuer die neuen Komfort-Helfer

### Einfacher Provider

```js
export function register(context) {
  context.registerSimpleProvider({
    id: 'my-provider',
    displayNameKey: 'providers.main.displayName',
    descriptionKey: 'providers.main.description',
    beginConnection: async ({ req }) => ({
      redirect_url: `${req.protocol}://${req.get('host')}/api/providers/my-provider/callback?code=demo`,
    }),
    handleCallback: async () => ({
      user_id: 1,
      account: {
        instance_url: 'https://example.com',
        username: 'demo',
        display_name: 'Demo',
        stats_followers: 0,
        stats_following: 0,
        stats_statuses: 0,
        max_characters: 500,
        max_media_attachments: 4
      }
    })
  });
}
```

### Einfacher Insight-Provider

```js
export function register(context) {
  context.registerSimpleInsightProvider({
    id: 'my-insights',
    displayNameKey: 'insights.main.displayName',
    tips: [
      {
        id: 'first-tip',
        title: 'Beispiel-Tipp',
        text: 'Dieser Tipp kommt direkt aus dem Plugin.'
      }
    ]
  });
}
```

### Einfache Composer-Erweiterung

```js
export function register(context) {
  context.registerSimpleComposerExtension({
    id: 'main',
    displayNameKey: 'composer.main.displayName',
    fields: [
      {
        key: 'suffix',
        type: 'text',
        label: 'Suffix'
      }
    ],
    transformPost: async ({ post, data }) => ({
      content: `${String(post.content || '')}${String(data?.suffix || '')}`
    })
  });
}
```

## 11. Wann brauche ich `web/manifest.json`?

Nur wenn du **echte eigene HTML-/JS-Seiten** rendern willst.

Wenn dir einfacher Markdown- oder Text-Inhalt reicht, brauchst du **kein** `web/`-Verzeichnis.

Das ist wichtig:

- einfache Inhaltsseiten: nur `content.markdown` oder `content.text`
- echte dynamische Plugin-Webseite: `webEntry` plus `web/manifest.json`

## 12. Die einfachste Web-Seite

Wenn du das Scaffold mit `admin-page` oder `app-page` benutzt, bekommst du bereits:

- `web/manifest.json`
- eine HTML-Datei
- eine JS-Datei
- Anbindung an das Plugin-Web-SDK

Das `web/manifest.json` sieht zum Beispiel so aus:

```json
{
  "frontendApiVersion": 1,
  "adminPages": [
    {
      "sectionId": "main",
      "entry": "admin-main.html"
    }
  ]
}
```

Oder fuer eine App-Seite:

```json
{
  "frontendApiVersion": 1,
  "appPages": [
    {
      "sectionId": "main",
      "entry": "app-main.html"
    }
  ]
}
```

Wichtig:

- `sectionId` muss zu der registrierten Section-ID passen
- `entry` ist relativ zum `web/`-Verzeichnis

## 13. Das neue Plugin-Web-SDK

Der einfachste Weg fuer Plugin-Webseiten ist jetzt:

```html
<script src="/plugin-sdk/fedisuite-plugin-web.js"></script>
```

Danach steht im Browser zur Verfuegung:

```js
window.FediSuitePluginWeb
```

### Verfuegbare Helfer

`ready()`

- wartet auf die Initialisierung durch FediSuite
- liefert Kontextdaten wie `pluginId`, `sectionId`, `sectionKind`, `language`

Beispiel:

```js
const context = await window.FediSuitePluginWeb.ready();
```

`getContext()`

- liefert den bereits initialisierten Kontext sofort zurueck

`resize(height?)`

- ist ein Kompatibilitaetshelfer fuer Plugin-Seiten
- kann verwendet werden, wenn dein Plugin bewusst selbst nach einer Layout-Aenderung nachziehen will
- ist fuer normale Plugin-Seiten in der aktuellen direkten Integration meist nicht noetig

`autoResize()`

- ist ein Kompatibilitaetshelfer
- gibt weiterhin eine Cleanup-Funktion zurueck
- ist in der aktuellen direkten Integration in der Regel nicht erforderlich

`get(path)`, `post(path, body)`, `put(path, body)`, `patch(path, body)`, `delete(path, body)`

- rufen deine Plugin-API sicher ueber die Core-App auf
- du musst **weder Tokens noch Fetch-Header noch ein eigenes Kommunikationsprotokoll** selbst bauen

### Einfachstes Beispiel

```js
async function boot() {
  const plugin = window.FediSuitePluginWeb;

  try {
    const context = await plugin.ready();
    const status = await plugin.get('/status');
    console.log(context, status);
  }
}

boot();
```

## 13a. Wie Plugin-Webseiten heute eingebettet werden

Plugin-Webseiten werden aktuell **nicht** mehr per `iframe` gerendert.

Stattdessen:

- FediSuite laedt die Plugin-HTML direkt in die App
- Stylesheets werden auf den Plugin-Bereich gescoped
- relative Assets wie `./main.js`, `./style.css` oder Bilder aus dem `web/`-Ordner werden relativ zur Plugin-Asset-URL aufgeloest
- `window.FediSuitePluginWeb` bleibt fuer die Lebensdauer der Plugin-Seite verfuegbar

Das ist fuer Plugin-Autoren wichtig, weil du deine `web/`-Dateien jetzt wie eine kleine eigenstaendige Frontend-Seite strukturieren kannst, ohne dich selbst um Token-Weitergabe oder eine iframe-Kommunikation kuemmern zu muessen.

## 14. Plugin-API-Routen moeglichst einfach

Wenn deine Plugin-Seite Daten braucht, registriere lieber einen kleinen API-Endpunkt:

```js
context.registerApiRoute({
  method: 'get',
  path: '/status',
  auth: 'user',
  summary: 'Returns runtime status for the plugin page.',
  handler: async ({ req, res }) => {
    res.json({
      plugin_id: context.plugin.plugin_id,
      user_id: req.user?.id || null,
      status: 'ok',
    });
  },
});
```

Danach kannst du im Frontend einfach schreiben:

```js
const status = await window.FediSuitePluginWeb.get('/status');
```

Du musst also **weder Tokens lesen noch Fetch-Header selbst bauen**.

## 15. i18n: bitte immer benutzen

Ein Plugin soll moeglichst nicht mit fest verdrahteten Texten arbeiten.

Stattdessen:

1. Texte in `i18n/de.json`, `i18n/en.json`, `i18n/it.json` pflegen
2. im Code `context.createI18nRef(...)` benutzen

Beispiel:

```js
title: context.createI18nRef('adminSections.main.title', 'My Plugin')
```

Damit bleibt dein Plugin:

- mehrsprachig
- sauber namespaced
- konsistent mit dem Rest von FediSuite

## 16. Wann sollte ich mit einem Plugin beginnen?

Beginne klein.

Empfohlene Reihenfolge:

1. erst `admin-page` oder `app-page`
2. danach optional `dashboard-widget`
3. danach optional `composer-extension`
4. Provider/Auth/komplexe Hooks erst danach

Der groesste Fehler waere, direkt mit einem “Alles-in-einem”-Plugin zu starten.

## 17. Typische Fehler

### Das Plugin wird gar nicht erkannt

Pruefe:

- liegt eine `plugin.json` im Plugin-Hauptverzeichnis?
- stimmt der Mount-Pfad?
- ist `PLUGINS_ENABLED=true`?

### Das Plugin wird erkannt, bootet aber nicht

Pruefe:

- stimmt `pluginApiVersion`?
- existiert `serverEntry` wirklich?
- sind die Pfade relativ und sicher?
- sind `capabilities` und `requiredPermissions` korrekt?

### Eine Section erscheint nicht

Pruefe:

- wurde sie wirklich mit `registerAppSection(...)` oder `registerAdminSection(...)` registriert?
- stimmt die passende Permission?
- ist das Plugin aktiviert?
- ist bei Web-Seiten die `sectionId` im `web/manifest.json` identisch?

### Die Plugin-Webseite bleibt leer

Pruefe:

- ist `webEntry` im Manifest gesetzt?
- ist `web/manifest.json` gueltig?
- ist `entry` korrekt?
- ist in der HTML-Datei das SDK eingebunden?
- benutzt du `await window.FediSuitePluginWeb.ready()` bevor du API-Aufrufe machst?
- stimmen relative Script-/Asset-Pfade wie `./main.js` oder `./style.css` innerhalb des `web/`-Ordners?

## 18. Wie teste ich mein Plugin lokal?

Wenn dein Plugin unter `plugins/<plugin-id>/` liegt und `docker-compose.build.yml` dieses Verzeichnis in den Container nach `/app/plugins` einbindet, reicht in der Regel:

```bash
docker compose -f docker-compose.build.yml up -d --build
```

Danach:

1. im Adminbereich Plugin aktivieren
2. Plugin-Seite im Admin pruefen
3. falls vorhanden Sidebar-Eintrag pruefen
4. falls vorhanden Widget/Composer pruefen

## 19. Was ist aktuell der beste Startpunkt?

Wenn du heute neu beginnst, nimm am besten:

```bash
npm run plugins:create -- \
  --id my-plugin \
  --name "My Plugin" \
  --author "Your Name" \
  --presets admin-page
```

Dann:

1. die Texte anpassen
2. die Inhalte anpassen
3. optional eine kleine API-Route ergaenzen
4. spaeter erst weitere Presets oder Logik ergaenzen

## 20. Empfehlung fuer FediSuite-Plugin-Autoren

Wenn du moeglichst wenig Integrationsaufwand willst, halte dich an diese Regel:

- zuerst Scaffold
- dann nur die Presets nutzen, die du wirklich brauchst
- dann nur die Logik austauschen
- nicht die Integrationsschicht neu erfinden

Genau dafuer wurden das Scaffold und das Web-SDK eingefuehrt.
