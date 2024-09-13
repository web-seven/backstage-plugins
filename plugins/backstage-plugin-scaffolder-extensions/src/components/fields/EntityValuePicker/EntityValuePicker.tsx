import {
  type EntityFilterQuery,
  CATALOG_FILTER_EXISTS,
} from '@backstage/catalog-client';
import {
  CompoundEntityRef,
  Entity,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  EntityRefPresentationSnapshot,
  catalogApiRef,
  entityPresentationApiRef,
} from '@backstage/plugin-catalog-react';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Autocomplete, {
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useAsync from 'react-use/esm/useAsync';
import {
  EntityValuePickerFilterQueryValue,
  EntityValuePickerProps,
  EntityValuePickerUiOptions,
  EntityValuePickerFilterQuery,
} from './schema';
import { VirtualizedListbox } from '../../fieldsRelated/VirtualizedListBox';
import { EntityDisplayName } from '../../fieldsRelated/EntityDisplayName';
import { JsonObject, JsonValue, JsonArray } from '@backstage/types';
export { EntityValuePickerSchema } from './schema';

import nunjucks from 'nunjucks';
import { getFilledSchema } from '../../fieldsRelated/utils';
import { AdditionalPicker } from '../../fieldsRelated/AdditionalPicker';

/**
 * The underlying component that is rendered in the form for the `EntityValuePicker`
 * field extension.
 *
 * @public
 */
export const EntityValuePicker = (props: EntityValuePickerProps) => {
  const {
    schema: { title = 'Entity', description = 'An entity from the catalog' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
  } = props;
  const [inputValue, setInputValue] = useState<string>('');
  const onEntityChange = props.onChange;
  const catalogFilter = buildCatalogFilter(uiSchema);
  const [additionalInputs, setAdditionalInputs] = useState<React.ReactNode[]>(
    [],
  );
  const aggregatedPropertiesRef = useRef<JsonObject>({});

  const valuesSchema: JsonObject =
    typeof uiSchema['ui:options']?.valuesSchema == 'object' &&
    uiSchema['ui:options']?.valuesSchema
      ? uiSchema['ui:options']?.valuesSchema
      : {};

  const valueTemplate = uiSchema['ui:options']?.template as string;  

  let labelVariant = uiSchema['ui:options']?.labelVariant;

  labelVariant =
    labelVariant &&
    ['entityRef', 'primaryTitle', 'secondaryTitle'].includes(labelVariant)
      ? labelVariant
      : 'primaryTitle';

  const catalogApi = useApi(catalogApiRef);
  const entityPresentationApi = useApi(entityPresentationApiRef);

  const { value: entities, loading } = useAsync(async () => {
    const { items } = await catalogApi.getEntities({ filter: catalogFilter });

    const entityRefToPresentation = new Map<
      string,
      EntityRefPresentationSnapshot
    >(
      await Promise.all(
        items.map(async item => {
          const presentation = await entityPresentationApi.forEntity(item)
            .promise;
          return [stringifyEntityRef(item), presentation] as [
            string,
            EntityRefPresentationSnapshot,
          ];
        }),
      ),
    );

    return { catalogEntities: items, entityRefToPresentation };
  });

  function setAggregatedProperties(keys: string[], value: JsonValue) {
    let current: JsonObject = aggregatedPropertiesRef.current;

    for (let i = 0; i < keys.length - 1; i++) {
      if (typeof current[keys[i]] !== 'object' || current[keys[i]] === null) {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as JsonObject;
    }

    if (typeof value === 'object' && value !== null) {
      current[keys[keys.length - 1]] = { ...value };
    } else {
      current[keys[keys.length - 1]] = value;
    }

    onEntityChange(nunjucks.renderString(valueTemplate, aggregatedPropertiesRef.current));
  }

  const onEntitySelect = useCallback(
    (_: any, ref: Entity | null) => {
      if (ref) {
        renderAdditionalInputs(getFilledSchema(ref, valuesSchema));
        setInputValue(getEntityOptionLabel(ref));
      } else {
        renderAdditionalInputs({});
        setInputValue('');
      }
      onEntityChange(nunjucks.renderString(valueTemplate, aggregatedPropertiesRef.current));
    },
    [onEntityChange],
  );

  useEffect(() => {
    if (entities?.catalogEntities.length === 1) {
      const firstEntity = entities.catalogEntities[0];
      setInputValue(getEntityOptionLabel(firstEntity));
      renderAdditionalInputs(getFilledSchema(firstEntity, valuesSchema));
    }
  }, [entities, onEntityChange]);

  function getEntityOptionLabel(ref: Entity | CompoundEntityRef) {
    if (ref) {
      const presentation = entities?.entityRefToPresentation.get(
        stringifyEntityRef(ref),
      );
      return presentation?.[
        labelVariant as keyof EntityRefPresentationSnapshot
      ] as string;
    }
    return '';
  }

  function renderAdditionalInputs(entityValues: JsonObject) {
    let additionalInputs: React.ReactNode[] = [];
  
    for (const key in entityValues) {
      aggregatedPropertiesRef.current = {
        ...aggregatedPropertiesRef.current,
        [key]: entityValues[key],
      };
  
      const currentValue = entityValues[key];
  
      if (Array.isArray(currentValue)) {
        additionalInputs.push(
          <AdditionalPicker
            key={key}
            options={currentValue as JsonArray}
            label={key}
            setAggregatedProperties={setAggregatedProperties}
            keys={[key]}
          />,
        );
      } 

      else if (currentValue && typeof currentValue === 'object') {
        const optionLabel = typeof (currentValue as any)?.optionLabel === 'string'
          ? (currentValue as any)?.optionLabel
          : undefined;
  
        if (Array.isArray((currentValue as any)?.value)) {
          additionalInputs.push(
            <AdditionalPicker
              key={key}
              options={(currentValue as any)?.value as JsonArray}
              label={key}
              optionLabel={optionLabel}
              properties={(currentValue as any)?.properties}
              setAggregatedProperties={setAggregatedProperties}
              keys={[key]}
            />,
          );
        }
      }
    }
  
    setAdditionalInputs(additionalInputs);
  }  

  return (
    <>
      <FormControl
        margin="normal"
        required={required}
        error={rawErrors?.length > 0 && !formData}
      >
        <Autocomplete
          inputValue={inputValue}
          onInputChange={(_, newValue) => setInputValue(newValue)}
          disabled={entities?.catalogEntities.length === 1}
          id={idSchema?.$id}
          loading={loading}
          onChange={onEntitySelect}
          options={entities?.catalogEntities || []}
          getOptionLabel={option => getEntityOptionLabel(option)}
          autoSelect
          freeSolo={false}
          renderInput={params => (
            <TextField
              {...params}
              label={title}
              margin="dense"
              helperText={description}
              FormHelperTextProps={{
                margin: 'dense',
                style: { marginLeft: 0 },
              }}
              variant="outlined"
              required={required}
              InputProps={params.InputProps}
            />
          )}
          renderOption={option => (
            <EntityDisplayName entityRef={option} labelVariant={labelVariant} />
          )}
          filterOptions={createFilterOptions<Entity>({
            stringify: option => getEntityOptionLabel(option),
          })}
          ListboxComponent={VirtualizedListbox}
        />
      </FormControl>
      {additionalInputs}
    </>
  );
};

/**
 * Converts a especial `{exists: true}` value to the `CATALOG_FILTER_EXISTS` symbol.
 *
 * @param value - The value to convert.
 * @returns The converted value.
 */
function convertOpsValues(
  value: Exclude<EntityValuePickerFilterQueryValue, Array<any>>,
): string | symbol {
  if (typeof value === 'object' && value.exists) {
    return CATALOG_FILTER_EXISTS;
  }
  return value?.toString();
}

/**
 * Converts schema filters to entity filter query, replacing `{exists:true}` values
 * with the constant `CATALOG_FILTER_EXISTS`.
 *
 * @param schemaFilters - An object containing schema filters with keys as filter names
 * and values as filter values.
 * @returns An object with the same keys as the input object, but with `{exists:true}` values
 * transformed to `CATALOG_FILTER_EXISTS` symbol.
 */
function convertSchemaFiltersToQuery(
  schemaFilters: EntityValuePickerFilterQuery,
): Exclude<EntityFilterQuery, Array<any>> {
  const query: EntityFilterQuery = {};

  for (const [key, value] of Object.entries(schemaFilters)) {
    if (Array.isArray(value)) {
      query[key] = value;
    } else {
      query[key] = convertOpsValues(value);
    }
  }

  return query;
}

/**
 * Builds an `EntityFilterQuery` based on the `uiSchema` passed in.
 * If `catalogFilter` is specified in the `uiSchema`, it is converted to a `EntityFilterQuery`.
 * If `allowedKinds` is specified in the `uiSchema` will support the legacy `allowedKinds` option.
 *
 * @param uiSchema The `uiSchema` of an `EntityValuePicker` component.
 * @returns An `EntityFilterQuery` based on the `uiSchema`, or `undefined` if `catalogFilter` is not specified in the `uiSchema`.
 */
function buildCatalogFilter(
  uiSchema: EntityValuePickerProps['uiSchema'],
): EntityFilterQuery | undefined {
  const allowedKinds = uiSchema['ui:options']?.allowedKinds;

  const catalogFilter: EntityValuePickerUiOptions['catalogFilter'] | undefined =
    uiSchema['ui:options']?.catalogFilter ||
    (allowedKinds && { kind: allowedKinds });

  if (!catalogFilter) {
    return undefined;
  }

  if (Array.isArray(catalogFilter)) {
    return catalogFilter.map(convertSchemaFiltersToQuery);
  }

  return convertSchemaFiltersToQuery(catalogFilter);
}
