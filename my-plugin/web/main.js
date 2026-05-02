const output = document.getElementById('output');

async function boot() {
  const plugin = window.FediSuitePluginWeb;
  const context = await plugin.ready();
  const stopAutoResize = plugin.autoResize();

  try {
    const status = await plugin.get('/status');
    output.textContent = JSON.stringify({ context, status }, null, 2);
  } catch (error) {
    output.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    plugin.resize();
  }

  window.addEventListener('beforeunload', () => {
    if (typeof stopAutoResize === 'function') stopAutoResize();
  });
}

boot();
