import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { OpenFgaService } from './service/OpenFgaService';

/**
 * openfgaPlugin backend plugin
 *
 * @public
 */
export const openfgaPlugin = createBackendPlugin({
  pluginId: 'openfga-backend',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
      },
      async init({ httpRouter, logger, config, auth }) {
        const router = await createRouter({ logger, config, auth });
        httpRouter.use(router);
        const openFgaService = new OpenFgaService(config, logger, auth);
        await openFgaService.createAuthorizationModel();
      },
    });
  },
});
