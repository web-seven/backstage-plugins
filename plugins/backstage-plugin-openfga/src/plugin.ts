import {
  configApiRef,
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { openfgaApiRef } from './api';
import OpenFgaApiClient from './api/OpenfgaApiClient';

export const openfgaPlugin = createPlugin({
  id: 'openfga',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: openfgaApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, fetchApi, configApi }) =>
        new OpenFgaApiClient({ discoveryApi, fetchApi, configApi }),
    }),
  ],
});
