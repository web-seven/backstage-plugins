import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { MultiEntityValuePicker } from './MultiEntityValuePicker';
import { MultiEntityValuePickerSchema } from './schema';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';

export const MultiEntityValuePickerFieldExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'MultiEntityValuePicker',
    component: MultiEntityValuePicker,
    schema: MultiEntityValuePickerSchema,
  }),
);
