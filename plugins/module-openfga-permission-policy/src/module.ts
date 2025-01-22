import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';

import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { OpenFGAPermissionPolicy } from './policies/OpenFGAPermissionPolicy';
import { openFGAServiceRef } from '@web-seven/backstage-backend-plugin-openfga/src/service/OpenFGAService';

export const openfgaModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'openfga-permission-policy',
  register(reg) {
    reg.registerInit({
      deps: {
        policy: policyExtensionPoint,
        logger: coreServices.logger,
        service: openFGAServiceRef,
      },
      async init({ policy, logger, service }) {
        policy.setPolicy(
          new OpenFGAPermissionPolicy( service, logger )
        );
      },
    });
  },
});
