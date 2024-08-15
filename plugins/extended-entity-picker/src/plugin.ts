import {
  createPlugin,
} from '@backstage/core-plugin-api';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { ExtendedEntityPicker } from './components/ExtendedEntityPicker';
import { ExtendedEntityPickerSchema } from './components/ExtendedEntityPicker/schema';
import {
  createScaffolderFieldExtension
} from '@backstage/plugin-scaffolder-react';

export const extendedEntityPickerPlugin = createPlugin({
  id: 'extended-entity-picker',
});

export const EntityPickerExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'ExtendedEntityPicker',
    component: ExtendedEntityPicker,
    schema: ExtendedEntityPickerSchema,
  }),
);