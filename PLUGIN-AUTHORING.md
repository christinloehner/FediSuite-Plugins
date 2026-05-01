# FediSuite Plugin Authoring Guide

For the most detailed authoring documentation, see:

- [PLUGIN-AUTHORING.de.md](PLUGIN-AUTHORING.de.md)

Short version:

1. Do not start from an empty folder.
2. Use the scaffold:

```bash
npm run plugins:create -- \
  --id my-plugin \
  --name "My Plugin" \
  --author "Your Name" \
  --presets admin-page
```

3. Edit the generated files instead of rebuilding the integration layer from scratch.

The scaffold already generates:

- a valid `plugin.json`
- `server/index.js`
- `i18n/de.json`, `i18n/en.json`, `i18n/it.json`
- optional `web/manifest.json`
- optional plugin page files
- a plugin-local `README.md`

Useful presets:

- `admin-page`
- `app-page`
- `dashboard-widget`
- `composer-extension`
- `provider`
- `auth-provider`
- `insights-provider`
- `settings`

Preferred high-level helpers for new plugins:

- `context.ref(key, fallback)`
- `context.registerMarkdownAdminPage(...)`
- `context.registerMarkdownAppPage(...)`
- `context.registerSimpleDashboardWidget(...)`
- `context.registerSimpleComposerExtension(...)`
- `context.registerSimpleProvider(...)`
- `context.registerSimpleAuthProvider(...)`
- `context.registerSimpleInsightProvider(...)`

If your plugin renders its own page in FediSuite, include the helper SDK in the generated HTML:

```html
<script src="/plugin-sdk/fedisuite-plugin-web.js"></script>
```

Then use:

```js
const plugin = window.FediSuitePluginWeb;
await plugin.ready();
const status = await plugin.get('/status');
```

Plugin web pages are now integrated directly into the app instead of being rendered in an `iframe`. Relative assets such as `./main.js` or `./style.css` inside the plugin `web/` directory are resolved relative to the plugin asset URL, and `window.FediSuitePluginWeb` stays available for the full mounted lifetime of the page. The older `resize()` and `autoResize()` helpers still exist for compatibility, but they are usually not needed for normal plugin pages anymore.

The German guide explains:

- every required manifest field
- capability/permission mapping
- the plugin context API
- the web runtime SDK
- minimal examples
- common mistakes
- local testing workflow
