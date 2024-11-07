import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';

import { OpenFgaService } from '@web-seven/backstage-plugin-openfga-backend';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { OpenFGAPermissionPolicy } from './policies/OpenFGAPermissionPolicy';

export const openfgaModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'openfga-permission-policy',
  register(reg) {
    reg.registerInit({
      deps: {
        policy: policyExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
      },
      async init({ policy, logger, config, auth }) {
        policy.setPolicy(
          new OpenFGAPermissionPolicy(
            new OpenFgaService(config, logger, auth),
            logger,
          ),
        );
      },
    });
  },
});
