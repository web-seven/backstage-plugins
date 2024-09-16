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
export const EntityValuePickerFieldSchema = makeFieldSchemaFromZod(
  z.string(),
  z.object({
    /**
     * @deprecated Use `catalogFilter` instead.
     */
    allowedKinds: z
      .array(z.string())
      .optional()
      .describe(
        'DEPRECATED: Use `catalogFilter` instead. List of kinds of entities to derive options from',
      ),
    defaultKind: z
      .string()
      .optional()
      .describe(
        'The default entity kind. Options of this kind will not be prefixed.',
      ),
    allowArbitraryValues: z
      .boolean()
      .optional()
      .describe('Whether to allow arbitrary user input. Defaults to true'),
    defaultNamespace: z
      .union([z.string(), z.literal(false)])
      .optional()
      .describe(
        'The default namespace. Options with this namespace will not be prefixed.',
      ),
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
      .describe('Scheme that describes which entity properties we must use to create object used by template option.'),
    template: z
      .string()
      .optional()
      .describe('Nunjucks template that uses selected values from entity and set the final value of the EntityValuePicker'),
    labelVariant: z
      .string()
      .optional()
      .describe('Variant of displaying options labels (entityRef, primaryTitle, secondaryTitle)'),
  }),
);

/**
 * The input props that can be specified under `ui:options` for the
 * `EntityValuePicker` field extension.
 *
 * @public
 */
export type EntityValuePickerUiOptions =
  typeof EntityValuePickerFieldSchema.uiOptionsType;

export type EntityValuePickerProps = typeof EntityValuePickerFieldSchema.type;

export const EntityValuePickerSchema = EntityValuePickerFieldSchema.schema;

export type EntityValuePickerFilterQuery = z.TypeOf<
  typeof entityQueryFilterExpressionSchema
>;

export type EntityValuePickerFilterQueryValue =
EntityValuePickerFilterQuery[keyof EntityValuePickerFilterQuery];