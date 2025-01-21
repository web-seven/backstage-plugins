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
export const EntityObjectPickerFieldSchema = makeFieldSchemaFromZod(
  z.record(z.any()),
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
 * `EntityObjectPicker` field extension.
 *
 * @public
 */
export type EntityObjectPickerUiOptions =
  typeof EntityObjectPickerFieldSchema.uiOptionsType;

export type EntityObjectPickerProps = typeof EntityObjectPickerFieldSchema.type;

export const EntityObjectPickerSchema = EntityObjectPickerFieldSchema.schema;

export type EntityObjectPickerFilterQuery = z.TypeOf<
  typeof entityQueryFilterExpressionSchema
>;

export type EntityObjectPickerFilterQueryValue =
  EntityObjectPickerFilterQuery[keyof EntityObjectPickerFilterQuery];
