export function register(context) {
  context.registerStatusRoute();

  context.registerMarkdownAdminPage({
    id: 'main',
    titleKey: 'adminSections.main.title',
    descriptionKey: 'adminSections.main.description',
    badgeKey: 'adminSections.main.badge',
    markdownKey: 'adminSections.main.markdown',
  });
}
