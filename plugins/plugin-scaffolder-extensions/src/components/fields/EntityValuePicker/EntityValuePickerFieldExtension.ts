import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { EntityValuePicker } from './EntityValuePicker';
import { EntityValuePickerSchema } from './schema';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';

export const EntityValuePickerFieldExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'EntityValuePicker',
    component: EntityValuePicker,
    schema: EntityValuePickerSchema,
  }),
);
