import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
import { scaffolderExtensionsTranslationRef } from '../../translation';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import qs from 'qs';

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

export const EditEntityByTemplatePage = (
  props: EditEntityByTemplatePageProps,
) => {
  const rootRef = useRouteRef(scaffolderPlugin.routes.root);
  const taskRoute = useRouteRef(scaffolderPlugin.routes.ongoingTask);
  const { secrets } = useTemplateSecrets();
  const scaffolderApi = useApi(scaffolderApiRef);
  const catalogApi = useApi(catalogApiRef);
  const navigate = useNavigate();

  const FORMDATA_ANNOTATION_PATH = 'backstage.io/form-data';

  const [initialState, setInitialState] = useState<Record<string, JsonValue>>(
    {},
  );

  useEffect(() => {
    if (window.location.search !== '') {
      const query = qs.parse(window.location.search, {
          ignoreQueryPrefix: true,
        }),
        entityKind = query.kind as string,
        entityNamespace = query.namespace as string,
        entityName = query.name as string;

      if (entityKind && entityNamespace && entityName) {
        const entityRef = stringifyEntityRef({
          kind: entityKind,
          namespace: entityNamespace,
          name: entityName,
        });

        (async () => {
          const entity = await catalogApi.getEntityByRef(entityRef);
          const encodedInitialState =
            entity?.metadata?.annotations?.[FORMDATA_ANNOTATION_PATH] || '';
          
          if (encodedInitialState) {
            setInitialState(JSON.parse(atob(encodedInitialState)));
          }
        })();
      }
    }
  }, []);

  const { t } = useTranslationRef(scaffolderExtensionsTranslationRef);

  const { templateName, namespace: templateNamespace } = useRouteRefParams(
    scaffolderPlugin.routes.selectedTemplate,
  );

  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: templateNamespace,
    name: templateName,
  });

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
          namespace={templateNamespace}
          templateName={templateName}
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
};
