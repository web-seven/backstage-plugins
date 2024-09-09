import { FormControl, TextField } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import React, { useCallback } from 'react';
import { VirtualizedListbox } from '../VirtualizedListBox';
import { JsonObject, JsonValue, JsonArray } from '@backstage/types';
import { EntityDisplayName } from '../EntityDisplayName';
import { PropertyDisplayName } from '../PropertyDisplayName';

type AdditionalPickerProps = {
  required?: boolean;
  values: JsonArray;
  label: string;
  optionLabel?: string;
  additionalInputs?: React.ReactNode[]
};

export const AdditionalPicker = ({
  required = true,
  values,
  label,
  optionLabel,
  additionalInputs
}: AdditionalPickerProps): JSX.Element => {
  const onSelectEntityProperty = useCallback((_: any, ref: any) => {    
    // if(additionalInputs) {
    //   additionalInputs.push(<AdditionalPicker values={[]} label={'EFGW'} />);
    // }
    
  }, []);

  const getPropertyOptionLabel = (option: JsonValue): string => {
    let value: string = typeof option == 'string' ? option : JSON.stringify(option);
  
    if (option && typeof option === 'object' && !Array.isArray(option)) {
      if (optionLabel && option.hasOwnProperty(optionLabel)) {
        const labelValue = option[optionLabel];
        value =
          typeof labelValue === 'string' ? labelValue : JSON.stringify(labelValue);
      }
    }
  
    return value;
  };

  return (
    <>
      <FormControl
        margin="normal"
        required={required}
        // error={rawErrors?.length > 0 && !formData}
      >
        <Autocomplete
          disabled={values.length === 1}
          // id={idSchema?.$id}
          // loading={loading}
          onChange={onSelectEntityProperty}
          options={values || []}
          getOptionLabel={option => {
            return getPropertyOptionLabel(option);
          }}
          autoSelect
          freeSolo={false}
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
          // filterOptions={createFilterOptions<Entity>({
          //   stringify: option => getPropertyOptionLabel(option),
          // })}
          ListboxComponent={VirtualizedListbox}
        />
      </FormControl>
    </>
  );
};
