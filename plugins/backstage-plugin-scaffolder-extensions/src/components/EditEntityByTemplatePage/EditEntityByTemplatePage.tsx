import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useAsync from 'react-use/esm/useAsync';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  AnalyticsContext,
  useApi,
  useRouteRef,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import {
  scaffolderApiRef,
  useTemplateSecrets,
  type LayoutOptions,
  FormProps,
  FieldExtensionOptions,
  ReviewStepProps,
} from '@backstage/plugin-scaffolder-react';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Workflow } from '@backstage/plugin-scaffolder-react/alpha';
import { JsonValue } from '@backstage/types';
import { Header, Page } from '@backstage/core-components';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { rootRouteRef, editingByTemplateRouteRef } from '../../routes';
import { scaffolderExtensionsTranslationRef } from '../../translation';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';

export type EditEntityByTemplatePageProps = {
  customFieldExtensions: FieldExtensionOptions<any, any>[];
  components?: {
    ReviewStepComponent?: React.ComponentType<ReviewStepProps>;
  };
  layouts?: LayoutOptions[];
  formProps?: FormProps;
  headerOptions?: {
    pageTitleOverride?: string;
    title?: string;
    subtitle?: string;
  };
};

export type InitialStateSchemaType = {
  [key: string]: any;
};

export const EditEntityByTemplatePage = (
  props: EditEntityByTemplatePageProps,
) => {
  const rootRef = useRouteRef(rootRouteRef);
  const taskRoute = useRouteRef(scaffolderPlugin.routes.ongoingTask);
  const { secrets } = useTemplateSecrets();
  const scaffolderApi = useApi(scaffolderApiRef);
  const catalogApi = useApi(catalogApiRef);
  const navigate = useNavigate();
  const { kind, namespace, entityName } = useRouteRefParams(
    editingByTemplateRouteRef,
  );
  const { t } = useTranslationRef(scaffolderExtensionsTranslationRef);
  const FORMDATA_ANNOTATION_PATH = 'backstage.io/form-data';

  const entityRef = stringifyEntityRef({
    kind,
    namespace,
    name: entityName,
  });

  const { value: entity, loading } = useAsync(async () => {
    return await catalogApi.getEntityByRef(entityRef);
  }, [entityRef, catalogApi]);

  if (!loading) {
    const createdByTemplateAnnotation =
      entity?.metadata?.annotations?.['backstage.io/created-by-template'] || '';

    const [relatedTemplateNamespace, relatedTemplateName] =
      createdByTemplateAnnotation.split('/');

    const templateRef = stringifyEntityRef({
      kind: 'template',
      namespace: relatedTemplateNamespace,
      name: relatedTemplateName,
    });

    const encodedInitialState =
      entity?.metadata?.annotations?.[FORMDATA_ANNOTATION_PATH] || '';

    const initialState = JSON.parse(atob(encodedInitialState));

    const onCreate = async (values: Record<string, JsonValue>) => {
      const { taskId } = await scaffolderApi.scaffold({
        templateRef,
        values,
        secrets,
      });

      navigate(taskRoute({ taskId }));
    };

    const onError = () => <Navigate to={rootRef()} />;

    return (
      <AnalyticsContext attributes={{ entityRef: templateRef }}>
        <Page themeId="website">
          <Header
            pageTitleOverride={t('editEntityByTemplatePage.pageTitle')}
            title={t('editEntityByTemplatePage.title')}
            subtitle={t('editEntityByTemplatePage.subtitle')}
            {...props.headerOptions}
          />
          <Workflow
            namespace={relatedTemplateNamespace}
            templateName={relatedTemplateName}
            onCreate={onCreate}
            components={props.components}
            onError={onError}
            extensions={props.customFieldExtensions}
            formProps={props.formProps}
            layouts={props.layouts}
            initialState={initialState}
          />
        </Page>
      </AnalyticsContext>
    );
  }
  return <></>;
};
