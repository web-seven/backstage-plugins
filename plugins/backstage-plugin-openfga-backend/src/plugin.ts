import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';

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
      },
      async init({ httpRouter, logger, config, auth }) {
        const router = await createRouter({logger, config, auth });
        httpRouter.use(router);        
      },
    });
  },
});
