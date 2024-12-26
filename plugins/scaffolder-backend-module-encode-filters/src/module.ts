import { JsonValue } from '@backstage/types';
import { scaffolderTemplatingExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createBackendModule } from '@backstage/backend-plugin-api';

export const encodeFilters = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'encode-filters',
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
