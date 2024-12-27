import {
  type EntityFilterQuery,
  CATALOG_FILTER_EXISTS,
} from '@backstage/catalog-client';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
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
  EntityObjectPickerFilterQueryValue,
  EntityObjectPickerProps,
  EntityObjectPickerUiOptions,
  EntityObjectPickerFilterQuery,
} from './schema';
import { VirtualizedListbox } from '../../fieldsRelated/VirtualizedListBox';
import { EntityDisplayName } from '../../fieldsRelated/EntityDisplayName';
import { useTemplateFormState } from '../../../FormStateContext';

export { EntityObjectPickerSchema } from './schema';

/**
 * The underlying component that is rendered in the form for the `EntityObjectPicker`
 * field extension.
 *
 * @public
 */
export const EntityObjectPicker = (props: EntityObjectPickerProps) => {
  const {
    onChange,
    schema: { title = 'Entity', description = 'An entity from the catalog' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
    name,
  } = props;

  const templateFormState = useTemplateFormState();
  const { formState, setFormState } = templateFormState
    ? templateFormState
    : { formState: null, setFormState: null };

  const [autocompleteValue, setAutocompleteValue] = useState<Entity | null>(
    null,
  );

  // Build a filter for querying catalog entities based on the uiSchema provided in props.
  const catalogFilter = buildCatalogFilter(uiSchema);

  // Determine the variant of label that will be displayed for each option in the picker.
  let labelVariant = uiSchema['ui:options']?.labelVariant;

  labelVariant =
    labelVariant &&
    ['entityRef', 'primaryTitle', 'secondaryTitle'].includes(labelVariant)
      ? labelVariant
      : 'primaryTitle';

  const catalogApi = useApi(catalogApiRef);
  const entityPresentationApi = useApi(entityPresentationApiRef);

  // Fetch entities from the catalog and build a map of entity references to presentation snapshots.
  const { value: entities, loading } = useAsync(async () => {
    const { items } = await catalogApi.getEntities(
      catalogFilter ? { filter: catalogFilter } : { filter: undefined },
    );

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

  // Handle changes to the selected entity in the picker.
  const onEntitySelect = useCallback(
    (entity: Entity | null) => {
      if (entity && setFormState) {
        setFormState({
          [name]: entity.metadata.name,
        });
      }
      onChange(entity ? entity : undefined);
      setAutocompleteValue(entity ? entity : null);
    },
    [onChange, name, setFormState],
  );

  /* eslint-disable */
  useEffect(() => {
    if (!loading && entities) {
      let initialEntityName = props.formContext.formData.formState?.[name];

      let initialEntity: Entity | null = null;

      if (entities?.catalogEntities.length === 1) {
        initialEntity = entities.catalogEntities[0];
      } else {
        initialEntityName =
          formState && Object.keys(formState).length > 0 && formState?.[name]
            ? formState?.[name]
            : initialEntityName || formData?.metadata.name;

        const entity = entities?.catalogEntities.find(
          e => e.metadata.name === initialEntityName,
        );
        initialEntity = entity ? entity : null;
      }
      onEntitySelect(initialEntity);
    }
  }, [entities, name]);
  /* eslint-enable */

  // Get the label to display for a given entity based on the chosen label variant.
  const getEntityOptionLabel = useCallback(
    (entity: Entity) => {
      try {
        const presentation = entities?.entityRefToPresentation.get(
          stringifyEntityRef(entity),
        );

        return presentation?.[
          labelVariant as keyof EntityRefPresentationSnapshot
        ] as string;
      } catch (e) {
        return '';
      }
    },
    [entities, labelVariant],
  );

  return (
    <>
      <FormControl
        margin="normal"
        required={required}
        error={rawErrors?.length > 0 && !formData}
      >
        <Autocomplete
          value={autocompleteValue}
          disabled={entities?.catalogEntities.length === 1}
          id={idSchema?.$id}
          loading={loading}
          onChange={(_, value) => onEntitySelect(value)}
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
    </>
  );
};

/**
 * Converts a special `{exists: true}` value to the `CATALOG_FILTER_EXISTS` symbol.
 *
 * @param value - The value to convert.
 * @returns The converted value.
 */
function convertOpsValues(
  value: Exclude<EntityObjectPickerFilterQueryValue, Array<any>>,
): string | symbol {
  if (typeof value === 'object' && value.exists) {
    return CATALOG_FILTER_EXISTS;
  }
  return value?.toString();
}

/**
 * Converts schema filters to an entity filter query, replacing `{exists:true}` values
 * with the constant `CATALOG_FILTER_EXISTS`.
 *
 * @param schemaFilters - An object containing schema filters with keys as filter names
 * and values as filter values.
 * @returns An object with the same keys as the input object, but with `{exists:true}` values
 * transformed to the `CATALOG_FILTER_EXISTS` symbol.
 */
function convertSchemaFiltersToQuery(
  schemaFilters: EntityObjectPickerFilterQuery,
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
 * If `catalogFilter` is specified in the `uiSchema`, it is converted to an `EntityFilterQuery`.
 * If `allowedKinds` is specified in the `uiSchema`, it will support the legacy `allowedKinds` option.
 *
 * @param uiSchema - The `uiSchema` of an `EntityObjectPicker` component.
 * @returns An `EntityFilterQuery` based on the `uiSchema`, or `undefined` if `catalogFilter` is not specified in the `uiSchema`.
 */
function buildCatalogFilter(
  uiSchema: EntityObjectPickerProps['uiSchema'],
): EntityFilterQuery | undefined {
  const allowedKinds = uiSchema['ui:options']?.allowedKinds;

  const catalogFilter:
    | EntityObjectPickerUiOptions['catalogFilter']
    | undefined =
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
