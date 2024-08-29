import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useAsync from 'react-use/esm/useAsync';
import {
  stringifyEntityRef,
} from '@backstage/catalog-model';
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

import {
  rootRouteRef,
  editingByTemplateRouteRef,
} from '../../routes';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
// import { scaffolderTranslationRef } from '../../translation';

/**
 * @alpha
 */
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

export const EditEntityByTemplatePage = (props: EditEntityByTemplatePageProps) => {
  const rootRef = useRouteRef(rootRouteRef);
  // const taskRoute = useRouteRef(scaffolderTaskRouteRef);
  const { secrets } = useTemplateSecrets();
  const scaffolderApi = useApi(scaffolderApiRef);
  const catalogApi = useApi(catalogApiRef);
  const navigate = useNavigate();
  const { entityName, namespace } = useRouteRefParams(
    editingByTemplateRouteRef,
  );
  // const { t } = useTranslationRef(scaffolderTranslationRef);

  const EntityRef = stringifyEntityRef({
    kind: 'Entity',
    namespace,
    name: entityName,
  });

  const { value: entity } = useAsync(async () => {
    return await catalogApi.getEntityByRef(EntityRef);;
  }, [EntityRef, catalogApi]);

console.log(entity);


  // const { value: editUrl } = useAsync(async () => {
  //   const data = await catalogApi.getEntityByRef(templateRef);
  //   return data?.metadata.annotations?.[ANNOTATION_EDIT_URL];
  // }, [templateRef, catalogApi]);

  // const onCreate = async (values: Record<string, JsonValue>) => {
  //   const { taskId } = await scaffolderApi.scaffold({
  //     templateRef,
  //     values,
  //     secrets,
  //   });

  //   navigate(taskRoute({ taskId }));
  // };

  const onError = () => <Navigate to={rootRef()} />;

  return (
    <AnalyticsContext attributes={{ entityRef: 'templateRef' }}>
      <Page themeId="website">
        <Header
          pageTitleOverride={'test'}
          title={'test'}
          subtitle={'test'}
          {...props.headerOptions}
        >
        </Header>
        <Workflow
          namespace={'namespace'}
          templateName={'templateName'}
          // onCreate={onCreate}
          onCreate={async ()=>{}}
          components={props.components}
          onError={onError}
          extensions={props.customFieldExtensions}
          formProps={props.formProps}
          layouts={props.layouts}
        />
      </Page>
    </AnalyticsContext>
  );
};