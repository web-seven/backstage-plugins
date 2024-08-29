/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { scmIntegrationsApiRef } from '@backstage/integration-react';
import {
  scaffolderApiRef,
} from '@backstage/plugin-scaffolder-react';
import { ScaffolderClient } from '@backstage/plugin-scaffolder';
import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import {
  editingByTemplateRouteRef,
  rootRouteRef,
} from './routes';

/**
 * The main plugin export for the scaffolder.
 * @public
 */
export const scaffolderExtensionsPlugin = createPlugin({
  id: 'scaffolder-extensions',
  apis: [
    createApiFactory({
      api: scaffolderApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        scmIntegrationsApi: scmIntegrationsApiRef,
        fetchApi: fetchApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, scmIntegrationsApi, fetchApi, identityApi }) =>
        new ScaffolderClient({
          discoveryApi,
          scmIntegrationsApi,
          fetchApi,
          identityApi,
        }),
    }),
  ],
  routes: {
    root: rootRouteRef,
    edit: editingByTemplateRouteRef,
  },
});

/**
 * The Router and main entrypoint to the Scaffolder plugin.
 *
 * @public
 */
export const EditEntity = scaffolderExtensionsPlugin.provide(
  createRoutableExtension({
    name: 'EditEntity',
    component: () => import('./components/Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);
