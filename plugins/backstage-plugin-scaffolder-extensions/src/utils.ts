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
      Object.assign(schema.properties, step.mergedSchema.properties);
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

    if (typeof schema.properties === 'object' && schema.properties !== null) {
      const fieldSchema: JsonValue | undefined = (
        schema.properties as JsonObject
      )[key];

      if (
        typeof fieldSchema === 'object' &&
        !Array.isArray(fieldSchema) &&
        fieldSchema !== null
      ) {
        if (fieldSchema['ui:field'] === 'EntityObjectPicker') {
          newFormData[key] = React.createElement(EntityRefLink, {
            entityRef: value,
          });
          fieldSchema['ui:backstage'] = { review: { explode: false } };
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

  return newFormData;
}

export function getFilledSchema(obj: JsonObject, valuesSchema: JsonObject): JsonObject {
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
