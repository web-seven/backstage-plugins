import { FormControl, TextField } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useState } from 'react';
import { VirtualizedListbox } from '../VirtualizedListBox';
import { JsonObject, JsonValue, JsonArray } from '@backstage/types';
import { PropertyDisplayName } from '../PropertyDisplayName';
import { getFilledSchema } from '../../../utils';

type AdditionalPickerProps = {
  required?: boolean;
  options: JsonArray;
  label: string;
  optionLabel?: string;
  properties?: JsonValue;
  setInputValue: (
    keys: string[],
    inputValue: JsonValue | undefined,
    filledProperties: JsonValue | undefined,
  ) => void;
  keys: string[];
  initialValue: JsonValue;
};

export const AdditionalPicker = ({
  required = true,
  options,
  label,
  optionLabel,
  properties,
  setInputValue,
  keys,
  initialValue,
}: AdditionalPickerProps): JSX.Element => {
  const [newInputs, setNewInputs] = useState<React.ReactNode[]>([]);
  const [autocompleteValue, setAutocompleteValue] = useState<JsonValue | null>(
    null,
  );

  const onSelectEntityProperty = useCallback(
    (
      _: any,
      inputValue: JsonValue | undefined,
      newInitialValue: JsonValue = null,
    ) => {
      setAutocompleteValue(inputValue || null);
      setNewInputs([]);

      const currentInitialValue = newInitialValue || initialValue;

      if (
        inputValue &&
        typeof inputValue === 'object' &&
        !Array.isArray(inputValue) &&
        properties
      ) {
        const filledProperties = getFilledSchema(
          inputValue,
          properties as JsonObject,
        );

        setInputValue(keys, { $_value: inputValue }, filledProperties);

        const inputs: React.ReactNode[] = [];

        for (const key in filledProperties) {
          if (Object.prototype.hasOwnProperty.call(filledProperties, key)) {
            const filledProperty = filledProperties[key];

            let nextInitialValue = null;
            if (
              currentInitialValue &&
              typeof currentInitialValue === 'object' &&
              !Array.isArray(currentInitialValue) &&
              key in currentInitialValue &&
              currentInitialValue[key]
            ) {
              nextInitialValue = currentInitialValue[key];
            }
            if (Array.isArray(filledProperty)) {
              inputs.push(
                <AdditionalPicker
                  key={key}
                  options={filledProperty as JsonArray}
                  label={key}
                  setInputValue={setInputValue}
                  keys={[...keys, key]}
                  initialValue={nextInitialValue ?? null}
                />,
              );
            } else if (
              filledProperty &&
              typeof filledProperty === 'object' &&
              'value' in filledProperty &&
              Array.isArray((filledProperty as any).value)
            ) {
              inputs.push(
                <AdditionalPicker
                  key={key}
                  label={key}
                  options={(filledProperty as any).value as JsonArray}
                  properties={(filledProperty as any).properties}
                  optionLabel={(filledProperty as any).optionLabel as string}
                  setInputValue={setInputValue}
                  keys={[...keys, key]}
                  initialValue={nextInitialValue ?? null}
                />,
              );
            }
          }
        }
        setNewInputs(inputs);
      } else {
        setInputValue(keys, inputValue, inputValue);
      }
    },
    [properties, initialValue, keys, setInputValue],
  );

  const getPropertyOptionLabel = (option: JsonValue | undefined): string => {
    let value: string =
      typeof option === 'string' ? option : JSON.stringify(option);

    if (option && typeof option === 'object' && !Array.isArray(option)) {
      if (optionLabel && option.hasOwnProperty(optionLabel)) {
        const labelValue = option[optionLabel];
        value =
          typeof labelValue === 'string'
            ? labelValue
            : JSON.stringify(labelValue);
      }
    }

    return value;
  };

  useEffect(() => {
    let optionToSelect = null;

    if (
      initialValue &&
      typeof initialValue === 'object' &&
      !Array.isArray(initialValue) &&
      initialValue?.$_value
    ) {
      optionToSelect = initialValue.$_value;
    } else if (initialValue) {
      optionToSelect = initialValue;
    } else if (options.length === 1) {
      optionToSelect = options[0];
    }

    if (optionToSelect) {
      setAutocompleteValue(optionToSelect);
      onSelectEntityProperty(null, optionToSelect, initialValue);
    } else {
      setAutocompleteValue(null);
      setNewInputs([]);
    }
  }, [options, initialValue, onSelectEntityProperty]);

  return (
    <>
      <FormControl margin="normal" required={required}>
        <Autocomplete
          value={autocompleteValue}
          disabled={options.length === 1}
          onChange={onSelectEntityProperty}
          options={options || []}
          getOptionLabel={option => getPropertyOptionLabel(option)}
          getOptionSelected={(option, value) =>
            JSON.stringify(option) === JSON.stringify(value)
          }
          autoSelect
          freeSolo
          renderInput={params => (
            <TextField
              {...params}
              label={label}
              margin="dense"
              variant="outlined"
              required={required}
              InputProps={params.InputProps}
            />
          )}
          renderOption={option => (
            <PropertyDisplayName optionLabel={getPropertyOptionLabel(option)} />
          )}
          ListboxComponent={VirtualizedListbox}
        />
      </FormControl>
      {newInputs}
    </>
  );
};
