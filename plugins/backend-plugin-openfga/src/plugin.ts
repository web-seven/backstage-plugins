import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { openFGAServiceRef } from './service/OpenFGAService';

/**
 * openfgaPlugin backend plugin
 *
 * @public
 */
export const openfgaPlugin = createBackendPlugin({
  pluginId: 'openfga',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
        service: openFGAServiceRef,
      },
      async init({ httpRouter, logger, config, service }) {
        const router = await createRouter({ logger, config, service });
        httpRouter.use(router);
      },
    });
  },
});
