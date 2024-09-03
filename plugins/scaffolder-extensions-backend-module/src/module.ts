import { JsonValue } from '@backstage/types';
import { scaffolderTemplatingExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createBackendModule } from '@backstage/backend-plugin-api';

export const scaffolderExtensionsModuleCustomFilters = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'custom-filters',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: scaffolderTemplatingExtensionPoint,
      },
      async init({ scaffolder }) {
        scaffolder.addTemplateFilters({
          base64: (...args: JsonValue[]) => btoa(args.join('')),
        });
      },
    });
  },
});
