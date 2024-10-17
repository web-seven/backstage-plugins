import {
  createVersionedContext,
  createVersionedValueMap,
} from '@backstage/version-bridge';
import React, {
  useState,
  useCallback,
  useContext,
  PropsWithChildren,
} from 'react';
import { JsonObject } from '@backstage/types';

/**
 * The contents of the `FormState`
 */
type FormStateContents = {
  formState: JsonObject;
  setFormState: React.Dispatch<React.SetStateAction<JsonObject>>;
};

/**
 * The context to hold the FormState.
 */
const FormState = createVersionedContext<{
  1: FormStateContents;
}>('initial-form-state-context');

/**
 * The Context Provider that holds the state for the formState.
 * @public
 */
export const FormStateContextProvider = (
  props: PropsWithChildren<{ initialFormState?: JsonObject }>,
) => {
  const { initialFormState = {} } = props;
  const [formState, setFormState] = useState<JsonObject>({
    ...initialFormState,
  });

  return (
    <FormState.Provider
      value={createVersionedValueMap({ 1: { formState, setFormState } })}
    >
      {props.children}
    </FormState.Provider>
  );
};

/**
 * The return type from the useTemplateFormState hook.
 * @public
 */
export interface ScaffolderUseTemplateFormState {
  setFormState: (input: JsonObject) => void;
  formState: JsonObject;
}

/**
 * Hook to access the formState context to be able to set formState that are
 * passed to the Scaffolder backend.
 * @public
 */
export const useTemplateFormState = (): ScaffolderUseTemplateFormState => {
  const value = useContext(FormState)?.atVersion(1);

  const { setFormState: updateFormState, formState = {} } = value || {};

  const setFormState = useCallback(
    (input: JsonObject) => {
      updateFormState?.(currentFormState => ({
        ...currentFormState,
        ...input,
      }));
    },
    [updateFormState],
  );

  return { setFormState, formState: formState || {} };
};
