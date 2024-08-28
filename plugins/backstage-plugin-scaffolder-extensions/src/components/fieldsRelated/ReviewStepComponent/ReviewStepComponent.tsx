import React from 'react';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { JsonObject, JsonValue } from '@backstage/types';
import {
  ReviewState,
  ParsedTemplateSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { ReviewStepProps } from '@backstage/plugin-scaffolder-react';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
/**
 * Custom review step component
 *
 * @public
 */
const useStyles = makeStyles(theme => ({
  backButton: {
    marginRight: theme.spacing(1),
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(2),
  },
  formWrapper: {
    padding: theme.spacing(2),
  },
}));

export const ReviewStepComponent = (props: ReviewStepProps): JSX.Element => {
  const styles = useStyles();
  const { formData, steps, handleBack, handleCreate } = props;

  function mergeSchemas(steps: ParsedTemplateSchema[]): JsonObject {
    const mergedSchema = { properties: {} };

    steps.forEach(step => {
      if (
        typeof step.mergedSchema.properties === 'object' &&
        step.mergedSchema.properties !== null
      ) {
        Object.assign(
          mergedSchema.properties,
          step.mergedSchema.properties,
        );
      }
    });

    return mergedSchema;
  }

  function replaceEntityObjectWithLink(
    formData: JsonObject,
    mergedSchema: JsonObject,
  ): JsonObject {
    const newFormData: any = { ...formData };

    for (const key in newFormData) {
      const value = newFormData[key];

      if (
        typeof mergedSchema.properties === 'object' &&
        mergedSchema.properties !== null
      ) {
        const fieldSchema: JsonValue | undefined = (mergedSchema.properties as JsonObject)[key];

        if (typeof fieldSchema === 'object' && !Array.isArray(fieldSchema) && fieldSchema !== null) {
          if (
            fieldSchema['ui:field'] === 'EntityObjectPicker'
          ) {
            newFormData[key] = <EntityRefLink entityRef={value} />;
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

  const mergedSchema = mergeSchemas(steps as ParsedTemplateSchema[]);
  const updatedFormData = replaceEntityObjectWithLink(formData, mergedSchema);

  return (
    <>
      <ReviewState
        formState={updatedFormData}
        schemas={steps as ParsedTemplateSchema[]}
      />
      <div className={styles.footer}>
        <Button onClick={handleBack} className={styles.backButton}>
          Back
        </Button>
        <Button variant="contained" color="primary" onClick={handleCreate}>
          Create
        </Button>
      </div>
    </>
  );
};
