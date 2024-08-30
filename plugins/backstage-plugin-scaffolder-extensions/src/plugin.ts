import {
  createPlugin,
  createRoutableExtension,
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
export const ScaffolderExtensionsPage = scaffolderExtensionsPlugin.provide(
  createRoutableExtension({
    name: 'ScaffolderExtensionsPage',
    component: () => import('./components/Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);
