import React from 'react';
import {
  EditEntityByTemplatePageContext,
  EditEntityByTemplatePageProps,
} from './EditEntityByTemplatePageContext';
import { FormStateContextProvider } from '../../FormStateContext';

export const EditEntityByTemplatePage = (
  props: EditEntityByTemplatePageProps,
): JSX.Element => {
  return (
    <FormStateContextProvider>
      <EditEntityByTemplatePageContext {...props} />
    </FormStateContextProvider>
  );
};
