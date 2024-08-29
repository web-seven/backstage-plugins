/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { PropsWithChildren } from 'react';
import { Routes, Route, useOutlet } from 'react-router-dom';

import {
  FieldExtensionOptions,
  FormProps,
  ReviewStepProps,
  TemplateGroupFilter,
} from '@backstage/plugin-scaffolder-react';
import {
  ScaffolderTaskOutput,
  SecretsContextProvider,
  useCustomFieldExtensions,
  useCustomLayouts,
} from '@backstage/plugin-scaffolder-react';

import { TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';
import { DEFAULT_SCAFFOLDER_FIELD_EXTENSIONS } from '@backstage/plugin-scaffolder/dist/extensions/default.esm';

import { 
  editingByTemplateRouteRef,
} from '../../routes';
import { ErrorPage } from '@backstage/core-components';

import {
  TemplateListPageProps,
  TemplateWizardPageProps
} from '@backstage/plugin-scaffolder/alpha';
import { EditEntityByTemplatePage } from '../EditEntityByTemplatePage';

/**
 * The Props for the Scaffolder Router
 *
 * @public
 */
export type RouterProps = {
  components?: {
    ReviewStepComponent?: React.ComponentType<ReviewStepProps>;
    TemplateCardComponent?: React.ComponentType<{
      template: TemplateEntityV1beta3;
    }>;
    TaskPageComponent?: React.ComponentType<PropsWithChildren<{}>>;
    EXPERIMENTAL_TemplateOutputsComponent?: React.ComponentType<{
      output?: ScaffolderTaskOutput;
    }>;
    EXPERIMENTAL_TemplateListPageComponent?: React.ComponentType<TemplateListPageProps>;
    EXPERIMENTAL_TemplateWizardPageComponent?: React.ComponentType<TemplateWizardPageProps>;
  };
  groups?: TemplateGroupFilter[];
  templateFilter?: (entity: TemplateEntityV1beta3) => boolean;
  headerOptions?: {
    pageTitleOverride?: string;
    title?: string;
    subtitle?: string;
  };
  defaultPreviewTemplate?: string;
  formProps?: FormProps;
  contextMenu?: {
    /** Whether to show a link to the template editor */
    editor?: boolean;
    /** Whether to show a link to the actions documentation */
    actions?: boolean;
    /** Whether to show a link to the tasks page */
    tasks?: boolean;
  };
};

/**
 * The Scaffolder Router
 *
 * @public
 */
export const Router = (props: PropsWithChildren<RouterProps>) => {
  const {
    components: {
      ReviewStepComponent,
    } = {},
  } = props;
  const outlet = useOutlet() || props.children;
  const customFieldExtensions =
    useCustomFieldExtensions<FieldExtensionOptions>(outlet);

  const fieldExtensions = [
    ...customFieldExtensions,
    ...DEFAULT_SCAFFOLDER_FIELD_EXTENSIONS.filter(
      ({ name }) =>
        !customFieldExtensions.some(
          customFieldExtension => customFieldExtension.name === name,
        ),
    ),
  ] as FieldExtensionOptions[];

  const customLayouts = useCustomLayouts(outlet);

  return (
    <Routes>
      <Route
        path={editingByTemplateRouteRef.path}
        element={
          <SecretsContextProvider>
            <EditEntityByTemplatePage
              headerOptions={props.headerOptions}
              customFieldExtensions={fieldExtensions}
              layouts={customLayouts}
              components={{ ReviewStepComponent }}
              formProps={props.formProps}
            />
          </SecretsContextProvider>
        }
      />
      <Route
        path="*"
        element={<ErrorPage status="404" statusMessage="Page not found" />}
      />
    </Routes>
  );
};
