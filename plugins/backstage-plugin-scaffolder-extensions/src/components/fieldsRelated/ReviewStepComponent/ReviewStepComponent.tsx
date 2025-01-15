import React from 'react';
import {
  ReviewState,
  ParsedTemplateSchema,
  useTemplateParameterSchema,
  useFilteredSchemaProperties,
  useTemplateSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { ReviewStepProps } from '@backstage/plugin-scaffolder-react';
import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { mergeSchemas, replaceEntityObjectWithLink } from '../../../utils';
import { useRouteRefParams } from '@backstage/core-plugin-api';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { stringifyEntityRef } from '@backstage/catalog-model';

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

  if (formData.formState) delete formData.formState;

  const { templateName, namespace } = useRouteRefParams(
    scaffolderPlugin.routes.selectedTemplate,
  );

  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { manifest } = useTemplateParameterSchema(templateRef);
  const sortedManifest = useFilteredSchemaProperties(manifest);

  let backLabel = 'Back';
  let createLabel = 'Create';

  const { presentation } = useTemplateSchema(
    sortedManifest
      ? sortedManifest
      : { title: '', steps: [{ title: '', schema: {} }] },
  );

  if (presentation?.buttonLabels) {
    backLabel = presentation.buttonLabels.backButtonText ?? backLabel;
    createLabel = presentation.buttonLabels.createButtonText ?? createLabel;
  }

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
          {backLabel}
        </Button>
        <Button variant="contained" color="primary" onClick={handleCreate}>
          {createLabel}
        </Button>
      </div>
    </>
  );
};
