import {
  createPlugin,
} from '@backstage/core-plugin-api';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { EntityObjectPicker } from './components/EntityObjectPicker';
import { EntityObjectPickerSchema } from './components/EntityObjectPicker/schema';
import {
  createScaffolderFieldExtension
} from '@backstage/plugin-scaffolder-react';

export const backstagePluginScaffolder = createPlugin({
  id: 'backstage-plugin-scaffolder',
});

export const EntityObjectPickerFieldExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'EntityObjectPicker',
    component: EntityObjectPicker,
    schema: EntityObjectPickerSchema,
  }),
);