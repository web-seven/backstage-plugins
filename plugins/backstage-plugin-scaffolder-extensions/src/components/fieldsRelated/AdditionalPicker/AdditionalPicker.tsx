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
  setInputStateValue: (keys: string[], value: JsonValue | undefined) => void;
  setAggregatedPropertiesValue: (keys: string[], value: JsonValue | undefined) => void;
  keys: string[];
  initialValue: JsonValue;
};

export const AdditionalPicker = ({
  required = true,
  options,
  label,
  optionLabel,
  properties,
  setInputStateValue,
  setAggregatedPropertiesValue,
  keys,
  initialValue,
}: AdditionalPickerProps): JSX.Element => {
  const [newInputs, setNewInputs] = useState<React.ReactNode[]>([]);
  const [autocompleteValue, setAutocompleteValue] = useState<JsonValue | null>(
    null,
  );

  const onSelectEntityProperty = useCallback(
    (_: any, value: JsonValue | undefined, newInitialValue: JsonValue = null) => {
      setAutocompleteValue(value || null);
      setNewInputs([]);
      newInitialValue ? newInitialValue : initialValue;
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        properties
      ) {
        const filledProperties = getFilledSchema(
          value,
          properties as JsonObject,
        );

        setInputStateValue(keys, {$_value: value});
        setAggregatedPropertiesValue(keys, filledProperties);
  
        let inputs: React.ReactNode[] = [];
  
        for (const key in filledProperties) {
          const filledProperty = filledProperties[key];

          let nextInitialValue = null;
          if(newInitialValue && typeof newInitialValue === 'object' && !Array.isArray(newInitialValue) && (key in newInitialValue) && newInitialValue[key]) {
            nextInitialValue = newInitialValue[key];
          }
          if (Array.isArray(filledProperty)) {   
            inputs.push(
              <AdditionalPicker
                key={key}
                options={filledProperty as JsonArray}
                label={key}
                setInputStateValue={setInputStateValue}
                setAggregatedPropertiesValue={setAggregatedPropertiesValue}
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
                setInputStateValue={setInputStateValue}
                setAggregatedPropertiesValue={setAggregatedPropertiesValue}
                keys={[...keys, key]}
                initialValue={nextInitialValue ?? null}
              />,
            );
          }
        }
        setNewInputs(inputs);
      } else {
        setInputStateValue(keys, value);
        setAggregatedPropertiesValue(keys, value);
      }
    },
    [properties],
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

    if(initialValue && typeof initialValue == 'object' && !Array.isArray(initialValue) && initialValue?.$_value) {
      optionToSelect = initialValue.$_value;
    } 
    else if(initialValue) {
      optionToSelect = initialValue;
    }
    else if (options.length === 1) {
      optionToSelect = options[0];
    }

    if(optionToSelect) {
      setAutocompleteValue(optionToSelect);
      onSelectEntityProperty(null, optionToSelect, initialValue);
    }
    else {
      setAutocompleteValue(null);
      setNewInputs([]);
    }
  }, [options]);

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
          freeSolo={true}
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
