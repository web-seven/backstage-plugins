import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

export const scaffolderExtensionsTranslationRef = createTranslationRef({
  id: 'scaffolder-extensions',
  messages: {
    editEntityByTemplatePage: {
      title: 'Edit entity',
      subtitle:
        'Edit the entity using the template with which it was created.',
      pageTitle: 'Edit entity',
    },
  }
});
