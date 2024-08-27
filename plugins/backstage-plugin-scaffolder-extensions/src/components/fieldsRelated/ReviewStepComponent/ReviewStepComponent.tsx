import React from 'react';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';
import { ReviewState, ParsedTemplateSchema } from '@backstage/plugin-scaffolder-react/alpha';
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
    flexDirection: 'row',
    justifyContent: 'right',
    marginTop: theme.spacing(2),
  },
  formWrapper: {
    padding: theme.spacing(2),
  },
}));

export const ReviewStepComponent = (
  props: ReviewStepProps
): JSX.Element => {
  
  const styles = useStyles();
  const { formData, steps, handleBack, handleCreate } = props;

  function replaceEntityObjectWithLink(formData: JsonObject): JsonObject {
    const newFormData: any = { ...formData };

    for (const key in newFormData) {
      if (newFormData.hasOwnProperty(key)) {
        const value = newFormData[key];

        if (key === 'entityObject') {
          delete newFormData[key];
          newFormData['Entity'] = <EntityRefLink entityRef={value as Entity} />;
        } else if (typeof value === 'object' && value !== null) {
          newFormData[key] = replaceEntityObjectWithLink(value as JsonObject);
        }
      }
    }

    return newFormData;
  }
  return (
    <>
      <ReviewState formState={replaceEntityObjectWithLink(formData)} schemas={steps as ParsedTemplateSchema[]} />
      <div className={styles.footer}>
        <Button
          onClick={handleBack}
          className={styles.backButton}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
        >
          Create
        </Button>
      </div>
    </>
  );
};