import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { JsonObject, JsonValue } from '@backstage/types';
import { ParsedTemplateSchema } from '@backstage/plugin-scaffolder-react/alpha';
import React from 'react';

export function mergeSchemas(steps: ParsedTemplateSchema[]): JsonObject {
  const schema = { properties: {} };

  steps.forEach(step => {
    if (
      typeof step.mergedSchema.properties === 'object' &&
      step.mergedSchema.properties !== null
    ) {
      Object.assign(
        schema.properties,
        step.mergedSchema.properties,
      );
    }
  });

  return schema;
}

export function replaceEntityObjectWithLink(
  formData: JsonObject,
  schema: JsonObject,
): JsonObject {
  const newFormData: any = { ...formData };

  for (const key in newFormData) {
    const value = newFormData[key];

    if (
      typeof schema.properties === 'object' &&
      schema.properties !== null
    ) {
      const fieldSchema: JsonValue | undefined = (schema.properties as JsonObject)[key];

      if (typeof fieldSchema === 'object' && !Array.isArray(fieldSchema) && fieldSchema !== null) {
        if (
          fieldSchema['ui:field'] === 'EntityObjectPicker'
        ) {
          newFormData[key] = React.createElement(EntityRefLink, { entityRef: value });
        } else if (
          typeof value === 'object' &&
          value !== null &&
          fieldSchema?.type === 'object'
        ) {
          newFormData[key] = replaceEntityObjectWithLink(
            value,
            fieldSchema,
          );
        }
      }
    }
  }

  return newFormData;
}