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
import React, { useCallback, useEffect, useState } from 'react';
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
import { getValuesBySchema } from '../../fieldsRelated/utils';
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
  const onEntityChange = props.onChange;
  const catalogFilter = buildCatalogFilter(uiSchema);
  const defaultKind = uiSchema['ui:options']?.defaultKind;
  const defaultNamespace =
    uiSchema['ui:options']?.defaultNamespace || undefined;

  const valuesSchema: JsonObject =
    typeof uiSchema['ui:options']?.valuesSchema == 'object' &&
    uiSchema['ui:options']?.valuesSchema
      ? uiSchema['ui:options']?.valuesSchema
      : {};

  const valueTemplate = valuesSchema?.template;
  const [values, setValues] = useState<JsonObject>({});
  const [entityValues, setEntityValues] = useState<JsonObject>({});
  const [additionalInputs, setAdditionalInputs] = useState<React.ReactNode[]>([])

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

  const onEntitySelect = useCallback(
    (_: any, ref: Entity | null) => {
      ref
        ? setEntityValues(getValuesBySchema(ref, valuesSchema))
        : setEntityValues({});

      // console.log(getValuesBySchema(ref, valuesSchema));

      // onChange(valueToSelect);
    },
    [onEntityChange, valuesSchema],
  );

  useEffect(() => {
    if (entities?.catalogEntities.length === 1) {
      const firstEntity = entities.catalogEntities[0];
      setEntityValues(getValuesBySchema(firstEntity, valuesSchema));

      // onChange(fillValues(firstEntity, valuesSchema));
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

  function renderAdditionalInputs(entityValues: JsonObject): React.ReactNode {
    console.log(entityValues);


    console.log('render');
    let additionalInput: React.ReactNode;
    for (const key in entityValues) {
      
      if (Array.isArray(entityValues[key])) {
        additionalInput = <AdditionalPicker
          key={key}
          values={entityValues[key] as JsonArray}
          label={key}
          additionalInputs={additionalInputs}
        />
      } else if (entityValues[key] && typeof entityValues[key] === 'object') {
        const optionLabel =
          typeof entityValues[key].optionLabel === 'string' ? entityValues[key].optionLabel : undefined;

        if (Array.isArray(entityValues[key].value)) {

          additionalInput = <AdditionalPicker
            key={key}
            values={entityValues[key].value as JsonArray}
            label={key}
            optionLabel={optionLabel}
            additionalInputs={additionalInputs}
          />
        } 
        // else if(entityValues[key].value && typeof entityValues[key].value == 'object') {

        //   renderAdditionalInputs(getValuesBySchema(entityValues[key].value, entityValues[key].properties))
        // }

      }
      
      setAdditionalInputs(prev => [...prev, additionalInput])
    }

    return <>{additionalInputs.map(input => input)}</>;
  }    

  return (
    <>
      <FormControl
        margin="normal"
        required={required}
        error={rawErrors?.length > 0 && !formData}
      >
        <Autocomplete
          disabled={entities?.catalogEntities.length === 1}
          id={idSchema?.$id}
          loading={loading}
          onChange={onEntitySelect}
          options={entities?.catalogEntities || []}
          getOptionLabel={option => {
            return getEntityOptionLabel(option);
          }}
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
      {renderAdditionalInputs(entityValues)}
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
