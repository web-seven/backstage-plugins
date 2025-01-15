import React from 'react';
import {
  EntityRefLink,
  EntityRefPresentationSnapshot,
} from '@backstage/plugin-catalog-react';
import { JsonObject, JsonValue } from '@backstage/types';
import { ParsedTemplateSchema } from '@backstage/plugin-scaffolder-react/alpha';
import {
  CATALOG_FILTER_EXISTS,
  EntityFilterQuery,
} from '@backstage/catalog-client';
import {
  CompoundEntityRef,
  Entity,
  stringifyEntityRef,
} from '@backstage/catalog-model';

export type PickerEntities =
  | {
      catalogEntities: Entity[];
      entityRefToPresentation: Map<string, EntityRefPresentationSnapshot>;
    }
  | undefined;

export function mergeSchemas(steps: ParsedTemplateSchema[]): JsonObject {
  const schema = { properties: {} };

  steps.forEach(step => {
    if (
      typeof step.mergedSchema.properties === 'object' &&
      step.mergedSchema.properties !== null
    ) {
      Object.assign(schema.properties, step.mergedSchema.properties);
    }
  });

  return schema;
}

export function getEntityOptionLabel(
  ref: Entity | CompoundEntityRef,
  entities: PickerEntities,
  labelVariant: string,
) {
  if (ref) {
    const presentation = entities?.entityRefToPresentation.get(
      stringifyEntityRef(ref),
    );
    return presentation?.[
      labelVariant as keyof EntityRefPresentationSnapshot
    ] as string;
  }
  return '';
}

export function replaceEntityObjectWithLink(
  formData: JsonObject,
  schema: JsonObject,
): JsonObject {
  const newFormData: any = { ...formData };

  for (const key in newFormData) {
    if (newFormData.hasOwnProperty(key)) {
      const value = newFormData[key];

      if (typeof schema.properties === 'object' && schema.properties !== null) {
        const fieldSchema: JsonValue | undefined = (
          schema.properties as JsonObject
        )[key];

        if (!fieldSchema) {
          delete newFormData[key];
        } else if (
          typeof fieldSchema === 'object' &&
          !Array.isArray(fieldSchema) &&
          fieldSchema !== null
        ) {
          if (fieldSchema['ui:field'] === 'EntityObjectPicker') {
            newFormData[key] = React.createElement(EntityRefLink, {
              entityRef: value,
            });
            fieldSchema['ui:backstage'] = { review: { explode: false } };
          } else if (fieldSchema['ui:field'] === 'MultiEntityObjectPicker') {
            const values: Entity[] = value;

            newFormData[key] = values.map(val =>
              React.createElement(EntityRefLink, {
                entityRef: val,
              }),
            );
          } else if (
            typeof value === 'object' &&
            value !== null &&
            fieldSchema?.type === 'object'
          ) {
            newFormData[key] = replaceEntityObjectWithLink(value, fieldSchema);
          }
        }
      }
    }
  }

  return newFormData;
}

export function getFilledSchema(
  obj: JsonObject,
  valuesSchema: JsonObject,
): JsonObject {
  const filledSchema = { ...valuesSchema };

  for (const key in filledSchema) {
    if (key !== 'properties') {
      if (typeof filledSchema[key] === 'string') {
        const valueByPath = getValueByPath(obj, filledSchema[key] as string);
        if (valueByPath !== undefined) {
          filledSchema[key] = valueByPath;
        }
      } else if (
        filledSchema[key] &&
        typeof filledSchema[key] === 'object' &&
        !Array.isArray(filledSchema[key])
      ) {
        const nestedSchema = filledSchema[key] as JsonObject;
        filledSchema[key] = getFilledSchema(obj, nestedSchema);
      }
    }
  }
  return filledSchema;
}

export function getValueByPath(obj: JsonObject, path: string): string {
  return path
    .split('.')
    .reduce((acc: any, part: string) => acc && acc[part], obj) as string;
}

/**
 * Converts a special `{exists: true}` value to the `CATALOG_FILTER_EXISTS` symbol.
 *
 * @param value - The value to convert.
 * @returns The converted value.
 */
export function convertOpsValues(
  value: Exclude<any, Array<any>>,
): string | symbol {
  if (typeof value === 'object' && value.exists) {
    return CATALOG_FILTER_EXISTS;
  }
  return value?.toString();
}

/**
 * Converts schema filters to an entity filter query, replacing `{exists:true}` values
 * with the constant `CATALOG_FILTER_EXISTS`.
 *
 * @param schemaFilters - An object containing schema filters with keys as filter names
 * and values as filter values.
 * @returns An object with the same keys as the input object, but with `{exists:true}` values
 * transformed to the `CATALOG_FILTER_EXISTS` symbol.
 */
export function convertSchemaFiltersToQuery(
  schemaFilters: Record<string, any>,
): Exclude<EntityFilterQuery, Array<any>> {
  const query: EntityFilterQuery = {};

  for (const [key, value] of Object.entries(schemaFilters)) {
    if (Array.isArray(value)) {
      query[key] = value;
    } else {
      query[key] = convertOpsValues(value);
    }
  }

  return query;
}

/**
 * Builds an `EntityFilterQuery` based on the `uiSchema` passed in.
 *
 * @param uiSchema - The `uiSchema` of a picker component.
 * @param optionsKey - Key to extract filter options.
 * @returns An `EntityFilterQuery` based on the `uiSchema`, or `undefined` if not specified.
 */
export function buildCatalogFilter(
  uiSchema: Record<string, any>,
  optionsKey: string = 'ui:options',
): EntityFilterQuery | undefined {
  const allowedKinds = uiSchema[optionsKey]?.allowedKinds;

  const catalogFilter =
    uiSchema[optionsKey]?.catalogFilter ||
    (allowedKinds && { kind: allowedKinds });

  if (!catalogFilter) {
    return undefined;
  }

  if (Array.isArray(catalogFilter)) {
    return catalogFilter.map(convertSchemaFiltersToQuery);
  }

  return convertSchemaFiltersToQuery(catalogFilter);
}
