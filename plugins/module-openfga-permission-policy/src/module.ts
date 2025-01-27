import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';

import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { OpenFGAPermissionPolicy } from './policies/OpenFGAPermissionPolicy';
import { openFGAServiceRef } from '@web-seven/backstage-backend-plugin-openfga';

export const openfgaModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'openfga-permission-policy',
  register(reg) {
    reg.registerInit({
      deps: {
        policy: policyExtensionPoint,
        logger: coreServices.logger,
        service: openFGAServiceRef,
        config: coreServices.rootConfig,
      },
      async init({ policy, logger, service, config }) {
        policy.setPolicy(new OpenFGAPermissionPolicy(service, logger, config));
      },
    });
  },
});
