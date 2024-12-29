import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { MultiEntityObjectPicker } from './MultiEntityObjectPicker';
import { MultiEntityObjectPickerSchema } from './schema';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';

export const MultiEntityObjectPickerFieldExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'MultiEntityObjectPicker',
    component: MultiEntityObjectPicker,
    schema: MultiEntityObjectPickerSchema,
  }),
);
