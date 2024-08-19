import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { EntityObjectPicker } from './EntityObjectPicker';
import { EntityObjectPickerSchema } from './schema';
import {
  createScaffolderFieldExtension
} from '@backstage/plugin-scaffolder-react';

export const EntityObjectPickerFieldExtension = scaffolderPlugin.provide(
    createScaffolderFieldExtension({
      name: 'EntityObjectPicker',
      component: EntityObjectPicker,
      schema: EntityObjectPickerSchema,
    }),
  );