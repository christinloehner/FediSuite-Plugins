const translations = {
  de: {
    eyebrow: 'Bluesky Provider',
    title: 'Bluesky verbinden',
    intro: 'Verbinde dein Bluesky-Konto sicher mit Handle, App-Passwort und optionalem PDS-Host. Die Session wird direkt im Provider-Plugin erstellt.',
    noteAppPasswordTitle: 'App-Passwort verwenden',
    noteAppPasswordText: 'Nutze nach Möglichkeit ein Bluesky-App-Passwort statt deines normalen Kontopassworts.',
    notePdsTitle: 'PDS nur bei Bedarf anpassen',
    notePdsText: 'Für normale `bsky.social`-Konten reicht der Standardwert. Bei anderen Hosts trage deinen eigenen PDS ein.',
    identifierLabel: 'Handle oder DID',
    identifierHint: 'Beispiel: `alice.bsky.social` oder `did:plc:...`',
    passwordLabel: 'App-Passwort',
    passwordHint: 'Das Passwort wird nur serverseitig zur Session-Erzeugung verwendet.',
    pdsLabel: 'PDS-Host',
    pdsHint: 'Optional. Leer lassen oder den Standardwert für gehostete Bluesky-Konten verwenden.',
    submit: 'Bluesky-Konto verbinden',
    submitting: 'Verbinde…',
    actionHint: 'Nach erfolgreicher Verbindung wirst du zurück zur Account-Übersicht geleitet.',
    footerText: 'Dieses Plugin nutzt die generische FediSuite-Provider-Schnittstelle, hält die Bluesky-spezifische Logik aber vollständig im Plugin.',
    success: 'Bluesky-Konto erfolgreich verbunden. Weiterleitung zur Account-Übersicht…',
    errorFallback: 'Die Bluesky-Verbindung konnte nicht hergestellt werden.'
  },
  en: {
    eyebrow: 'Bluesky Provider',
    title: 'Connect Bluesky',
    intro: 'Connect your Bluesky account securely with your handle, app password and optional PDS host. The session is created directly inside the provider plugin.',
    noteAppPasswordTitle: 'Use an app password',
    noteAppPasswordText: 'Prefer a Bluesky app password instead of your normal account password whenever possible.',
    notePdsTitle: 'Only change the PDS when needed',
    notePdsText: 'The default is enough for regular `bsky.social` accounts. Enter your own PDS only if your account lives somewhere else.',
    identifierLabel: 'Handle or DID',
    identifierHint: 'Example: `alice.bsky.social` or `did:plc:...`',
    passwordLabel: 'App password',
    passwordHint: 'The password is only used server-side to create the session.',
    pdsLabel: 'PDS host',
    pdsHint: 'Optional. Leave empty or keep the default for hosted Bluesky accounts.',
    submit: 'Connect Bluesky account',
    submitting: 'Connecting…',
    actionHint: 'After a successful connection you will be redirected back to the accounts page.',
    footerText: 'This plugin uses the generic FediSuite provider contract while keeping all Bluesky-specific logic inside the plugin.',
    success: 'Bluesky account connected successfully. Redirecting to the accounts page…',
    errorFallback: 'The Bluesky connection could not be completed.'
  },
  it: {
    eyebrow: 'Provider Bluesky',
    title: 'Collega Bluesky',
    intro: 'Collega in modo sicuro il tuo account Bluesky con handle, app password e host PDS opzionale. La sessione viene creata direttamente nel plugin provider.',
    noteAppPasswordTitle: 'Usa una app password',
    noteAppPasswordText: 'Quando possibile usa una app password di Bluesky invece della password normale del tuo account.',
    notePdsTitle: 'Cambia il PDS solo se serve',
    notePdsText: 'Per i normali account `bsky.social` basta il valore predefinito. Inserisci un PDS diverso solo se il tuo account è ospitato altrove.',
    identifierLabel: 'Handle o DID',
    identifierHint: 'Esempio: `alice.bsky.social` oppure `did:plc:...`',
    passwordLabel: 'App password',
    passwordHint: 'La password viene usata solo lato server per creare la sessione.',
    pdsLabel: 'Host PDS',
    pdsHint: 'Opzionale. Lascia vuoto o mantieni il valore predefinito per gli account Bluesky ospitati.',
    submit: 'Collega account Bluesky',
    submitting: 'Collegamento…',
    actionHint: 'Dopo un collegamento riuscito verrai reindirizzato alla pagina degli account.',
    footerText: 'Questo plugin usa il contratto provider generico di FediSuite mantenendo però tutta la logica specifica di Bluesky nel plugin.',
    success: 'Account Bluesky collegato correttamente. Reindirizzamento alla pagina degli account…',
    errorFallback: 'Impossibile completare il collegamento Bluesky.'
  }
};

const form = document.getElementById('connect-form');
const submitButton = document.getElementById('submit-button');
const messageBox = document.getElementById('message');
const identifierInput = document.getElementById('identifier');
const passwordInput = document.getElementById('app-password');
const pdsInput = document.getElementById('pds-url');

let pluginContext = null;
let providerId = 'bluesky';
let language = 'en';

function getText(key) {
  return translations[language]?.[key] || translations.en[key] || key;
}

function setText(id, key) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = getText(key);
}

function applyTranslations() {
  setText('eyebrow', 'eyebrow');
  setText('title', 'title');
  setText('intro', 'intro');
  setText('noteAppPasswordTitle', 'noteAppPasswordTitle');
  setText('noteAppPasswordText', 'noteAppPasswordText');
  setText('notePdsTitle', 'notePdsTitle');
  setText('notePdsText', 'notePdsText');
  setText('identifierLabel', 'identifierLabel');
  setText('identifierHint', 'identifierHint');
  setText('passwordLabel', 'passwordLabel');
  setText('passwordHint', 'passwordHint');
  setText('pdsLabel', 'pdsLabel');
  setText('pdsHint', 'pdsHint');
  setText('actionHint', 'actionHint');
  setText('footerText', 'footerText');
  submitButton.textContent = getText('submit');
}

function showMessage(kind, text) {
  messageBox.textContent = text;
  messageBox.className = `message visible ${kind}`;
}

function clearMessage() {
  messageBox.textContent = '';
  messageBox.className = 'message';
}

async function boot() {
  const plugin = window.FediSuitePluginWeb;
  const stopAutoResize = plugin.autoResize();
  pluginContext = await plugin.ready();
  language = ['de', 'en', 'it'].includes(pluginContext.language) ? pluginContext.language : 'en';
  const params = new URLSearchParams(window.location.search);
  providerId = params.get('providerId') || 'bluesky';
  applyTranslations();
  plugin.resize();

  window.addEventListener('beforeunload', () => {
    if (typeof stopAutoResize === 'function') stopAutoResize();
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  submitButton.disabled = true;
  submitButton.textContent = getText('submitting');

  try {
    const token = window.localStorage.getItem('token');
    const response = await fetch(`/api/providers/${encodeURIComponent(providerId)}/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        identifier: String(identifierInput.value || '').trim(),
        appPassword: String(passwordInput.value || ''),
        pdsUrl: String(pdsInput.value || '').trim(),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || getText('errorFallback'));
    }

    showMessage('success', getText('success'));
    submitButton.textContent = getText('submit');
    window.setTimeout(() => {
      window.location.href = '/?tab=accounts';
    }, 900);
  } catch (error) {
    showMessage('error', error instanceof Error ? error.message : getText('errorFallback'));
    submitButton.disabled = false;
    submitButton.textContent = getText('submit');
    window.FediSuitePluginWeb.resize();
  }
});

boot().catch((error) => {
  showMessage('error', error instanceof Error ? error.message : 'Plugin runtime could not be initialized.');
  submitButton.disabled = true;
});
