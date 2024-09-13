import { FormControl, TextField } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useState } from 'react';
import { VirtualizedListbox } from '../VirtualizedListBox';
import { JsonObject, JsonValue, JsonArray } from '@backstage/types';
import { PropertyDisplayName } from '../PropertyDisplayName';
import { getFilledSchema } from '../utils';

type AdditionalPickerProps = {
  required?: boolean;
  options: JsonArray;
  label: string;
  optionLabel?: string;
  properties?: JsonValue;
  setAggregatedProperties: (keys: string[], value: JsonValue) => void;
  keys: string[];
};

export const AdditionalPicker = ({
  required = true,
  options,
  label,
  optionLabel,
  properties,
  setAggregatedProperties,
  keys,
}: AdditionalPickerProps): JSX.Element => {
  const [newInputs, setNewInputs] = useState<React.ReactNode[]>([]);
  const [autocompleteValue, setAutocompleteValue] = useState<JsonValue | null>(
    null,
  );

  const onSelectEntityProperty = useCallback(
    (_: any, value: JsonValue | undefined) => {
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
        setAggregatedProperties(keys, filledProperties);
  
        let inputs: React.ReactNode[] = [];
  
        for (const key in filledProperties) {
          const filledProperty = filledProperties[key];
          if (filledProperty && Array.isArray(filledProperty)) {
            inputs.push(
              <AdditionalPicker
                key={key}
                options={filledProperty as JsonArray}
                label={key}
                setAggregatedProperties={setAggregatedProperties}
                keys={[...keys, key]}
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
                setAggregatedProperties={setAggregatedProperties}
                keys={[...keys, key]}
              />,
            );
          }
        }
        setNewInputs(inputs);
      } else {
        setNewInputs([]);
        if (value) setAggregatedProperties(keys, value);
      }
  
      if (value) {
        setAutocompleteValue(value);
      } else {
        setAutocompleteValue(null);
        setNewInputs([]);
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
    if (options.length === 1) {
      setAutocompleteValue(options[0]);
      onSelectEntityProperty(null, options[0]);
    } else {
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
