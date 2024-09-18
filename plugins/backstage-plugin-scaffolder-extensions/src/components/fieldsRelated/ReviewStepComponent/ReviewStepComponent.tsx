import React from 'react';
import {
  ReviewState,
  ParsedTemplateSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { ReviewStepProps } from '@backstage/plugin-scaffolder-react';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { mergeSchemas, replaceEntityObjectWithLink } from '../../../utils';
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
  const { formData, handleBack, steps, handleCreate } = props;

  return (
    <>
      <ReviewState
        formState={replaceEntityObjectWithLink(
          formData,
          mergeSchemas(steps as ParsedTemplateSchema[]),
        )}
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
