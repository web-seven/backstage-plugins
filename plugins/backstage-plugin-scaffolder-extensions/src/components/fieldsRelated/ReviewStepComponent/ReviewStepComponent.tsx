import React from 'react';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';
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

function isEntity(object: any): object is Entity {
  return (
    object &&
    typeof object === 'object' &&
    'kind' in object &&
    'metadata' in object &&
    'apiVersion' in object
  );
}

export const ReviewStepComponent = (props: ReviewStepProps): JSX.Element => {
  const styles = useStyles();
  const { formData, steps, handleBack, handleCreate } = props;
  console.log(formData);

  function replaceEntityObjectWithLink(data: JsonObject): JsonObject {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (isEntity(value)) {
          return [key, <EntityRefLink key={key} entityRef={value as Entity} />];
        }
        if (typeof value === 'object' && value !== null) {
          return [key, replaceEntityObjectWithLink(value as JsonObject)];
        }
        return [key, value];
      }),
    );
  }

  return (
    <>
      <ReviewState
        formState={replaceEntityObjectWithLink(formData)}
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
