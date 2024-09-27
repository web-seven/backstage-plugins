
import React from 'react';
import { EditEntityByTemplatePage, EditEntityByTemplatePageProps } from './EditEntityByTemplatePage';
import { FormStateContextProvider } from '../../FormStateContext';

export const EditEntityByTemplatePageWrapper = (props: EditEntityByTemplatePageProps,): JSX.Element => {

  return (
    <FormStateContextProvider>
        <EditEntityByTemplatePage {...props}/>
    </FormStateContextProvider>
  );
};
