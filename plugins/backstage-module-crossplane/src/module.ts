import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';

import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';

export const catalogModuleCrossplane = createBackendModule({
  pluginId: 'kubernetes',
  moduleId: 'crossplane',
  register(reg) {
    reg.registerInit({
      deps: { 
        logger: coreServices.logger, 
        fetcher: catalogProcessingExtensionPoint 
      },
      async init({ logger }) {
        logger.info('Hello World!');
      },
    });
  },
});
