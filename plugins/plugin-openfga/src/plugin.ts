import {
  configApiRef,
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { openFgaApiRef } from './api';
import OpenFgaApiClient from './api/OpenFgaApi';

export const openfgaPlugin = createPlugin({
  id: 'openfga',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: openFgaApiRef,
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
