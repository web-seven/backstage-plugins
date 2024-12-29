import { z } from 'zod';
import { makeFieldSchemaFromZod } from '@backstage/plugin-scaffolder';

/**
 * @public
 */
export const entityQueryFilterExpressionSchema = z.record(
  z
    .string()
    .or(z.object({ exists: z.boolean().optional() }))
    .or(z.array(z.string())),
);

/**
 * @public
 */
export const MultiEntityValuePickerFieldSchema = makeFieldSchemaFromZod(
  z.array(z.string()),
  z.object({
    catalogFilter: z
      .array(entityQueryFilterExpressionSchema)
      .or(entityQueryFilterExpressionSchema)
      .optional()
      .describe('List of key-value filter expression for entities'),
    valuePath: z
      .string()
      .optional()
      .describe('Path to property of entity used as value of picker'),
    valuesSchema: z
      .record(z.any())
      .optional()
      .describe(
        'Scheme that describes which entity properties we must use to create object used by template option.',
      ),
    template: z
      .string()
      .optional()
      .describe(
        'Nunjucks template that uses selected values from entity and set the final value of the MultiEntityValuePicker',
      ),
    labelVariant: z
      .string()
      .optional()
      .describe(
        'Variant of displaying options labels (entityRef, primaryTitle, secondaryTitle)',
      ),
  }),
);

/**
 * The input props that can be specified under `ui:options` for the
 * `MultiEntityValuePicker` field extension.
 *
 * @public
 */
export type MultiEntityValuePickerUiOptions =
  typeof MultiEntityValuePickerFieldSchema.uiOptionsType;

export type MultiEntityValuePickerProps =
  typeof MultiEntityValuePickerFieldSchema.type;

export const MultiEntityValuePickerSchema =
  MultiEntityValuePickerFieldSchema.schema;

export type MultiEntityValuePickerFilterQuery = z.TypeOf<
  typeof entityQueryFilterExpressionSchema
>;

export type MultiEntityValuePickerFilterQueryValue =
  MultiEntityValuePickerFilterQuery[keyof MultiEntityValuePickerFilterQuery];
