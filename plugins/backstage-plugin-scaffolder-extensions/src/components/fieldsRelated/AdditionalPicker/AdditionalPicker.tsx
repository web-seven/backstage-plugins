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
  aggregatedProperties?: JsonValue;
  qwerty: () => void;
};

export const AdditionalPicker = ({
  required = true,
  options,
  label,
  optionLabel,
  properties,
  aggregatedProperties,
  qwerty,
}: AdditionalPickerProps): JSX.Element => {
  const [newInputs, setNewInputs] = useState<React.ReactNode[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [autocompleteValue, setAutocompleteValue] = useState<JsonValue | null>(null);

  function fillAggregatedProperties(key: string, value: JsonValue) {
    console.log('aggregatedProperties', aggregatedProperties);
    console.log('key', key);
    if (
      aggregatedProperties &&
      typeof aggregatedProperties === 'object' &&
      aggregatedProperties.hasOwnProperty(key) &&
      !Array.isArray(aggregatedProperties)
    ) {
      if (
        aggregatedProperties[key] &&
        typeof aggregatedProperties[key] === 'object' &&
        !Array.isArray(aggregatedProperties[key]) &&
        value &&
        typeof value === 'object'
      ) {
        aggregatedProperties[key] = {
          ...value,
        };
      } else {
        aggregatedProperties[key] = value;
      }
    }
    else {      
      aggregatedProperties = value;
    }
  }


  const onSelectEntityProperty = useCallback(
    (_: any, value: JsonValue | undefined) => {
      setAutocompleteValue(value || null);
      if (value) {
        fillAggregatedProperties(label, value);
      } else {
        fillAggregatedProperties(label, {});
      }
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
        

        let inputs: React.ReactNode[] = [];

        for (const key in filledProperties) {
          if (Array.isArray(filledProperties[key])) {
            inputs.push(
              <AdditionalPicker
                key={key}
                options={filledProperties[key]}
                label={key}
                aggregatedProperties={aggregatedProperties[key]}
                qwerty={qwerty}
              />,
            );
          } else if (
            filledProperties[key] &&
            typeof filledProperties[key] === 'object' &&
            filledProperties[key].hasOwnProperty('value') &&
            Array.isArray(filledProperties[key].value)
          ) {
            inputs.push(
              <AdditionalPicker
                key={key}
                label={key}
                options={filledProperties[key].value}
                properties={filledProperties[key].properties}
                optionLabel={filledProperties[key].optionLabel as string}
                aggregatedProperties={aggregatedProperties[key]}
                qwerty={qwerty}
              />,
            );
          }
        }

        setNewInputs(inputs);
      } else {
        setNewInputs([]);
      }
    // qwerty();
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
      const optionLabel = getPropertyOptionLabel(options[0]);
      setAutocompleteValue(options[0]);
      setInputValue(optionLabel);
      onSelectEntityProperty(null, options[0]);
    } else {
      setAutocompleteValue(null);
      setInputValue('');
      onSelectEntityProperty(null, undefined);
    }
  }, [options]);

  return (
    <>
      <FormControl margin="normal" required={required}>
        <Autocomplete
          value={autocompleteValue}
          inputValue={inputValue}
          onInputChange={(_, newValue) => setInputValue(newValue)}
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
