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
export const MultiEntityObjectPickerFieldSchema = makeFieldSchemaFromZod(
  z.array(z.record(z.any())),
  z.object({
    catalogFilter: z
      .array(entityQueryFilterExpressionSchema)
      .or(entityQueryFilterExpressionSchema)
      .optional()
      .describe('List of key-value filter expression for entities'),
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
 * `MultiEntityObjectPicker` field extension.
 *
 * @public
 */
export type MultiEntityObjectPickerUiOptions =
  typeof MultiEntityObjectPickerFieldSchema.uiOptionsType;

export type MultiEntityObjectPickerProps =
  typeof MultiEntityObjectPickerFieldSchema.type;

export const MultiEntityObjectPickerSchema =
  MultiEntityObjectPickerFieldSchema.schema;

export type MultiEntityObjectPickerFilterQuery = z.TypeOf<
  typeof entityQueryFilterExpressionSchema
>;

export type MultiEntityObjectPickerFilterQueryValue =
  MultiEntityObjectPickerFilterQuery[keyof MultiEntityObjectPickerFilterQuery];
