import {
  createPlugin,
} from '@backstage/core-plugin-api';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { EntityPicker } from './components/EntityPicker';
import { rootRouteRef } from './routes';
import { EntityPickerSchema } from './components/EntityPicker/schema';
import {
  createScaffolderFieldExtension
} from '@backstage/plugin-scaffolder-react';

export const extendedEntityPickerPlugin = createPlugin({
  id: 'extended-entity-picker',
  routes: {
    root: rootRouteRef,
  },
});

export const EntityPickerExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'EntityPicker',
    component: EntityPicker,
    schema: EntityPickerSchema,
  }),
);