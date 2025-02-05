import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';
import { permissionApiRef } from '@backstage/plugin-permission-react';
import { discoveryApiRef } from '@backstage/core-plugin-api';
import { identityApiRef } from '@backstage/core-plugin-api';
import { IdentityPermissionApi } from '@web-seven/backstage-plugin-openfga';
import { alertApiRef } from '@backstage/core-plugin-api';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  createApiFactory({
    api: permissionApiRef,
    deps: {
      discovery: discoveryApiRef,
      identity: identityApiRef,
      config: configApiRef,
      alertApi: alertApiRef,
    },
    factory: ({ config, discovery, identity, alertApi }) =>
      IdentityPermissionApi.create({
        config,
        discovery,
        identity,
        alertApi,
      }),
  }),
  ScmAuth.createDefaultApiFactory(),
];
