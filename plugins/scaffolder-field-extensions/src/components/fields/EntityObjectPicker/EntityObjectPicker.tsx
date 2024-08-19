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
  AutocompleteChangeReason,
  createFilterOptions,
} from '@material-ui/lab/Autocomplete';
import React, { useCallback, useEffect } from 'react';
import useAsync from 'react-use/esm/useAsync';
import {
  EntityObjectPickerFilterQueryValue,
  EntityObjectPickerProps,
  EntityObjectPickerUiOptions,
  EntityObjectPickerFilterQuery,
} from './schema';
import { VirtualizedListbox } from '../../VirtualizedListBox';
import { EntityDisplayName } from '../../EntityDisplayName';

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
  } = props;

  // Build a filter for querying catalog entities based on the uiSchema provided in props.
  const catalogFilter = buildCatalogFilter(uiSchema);

  // Determine the variant of label that will be displayed for each option in the picker.
  let labelVariant = uiSchema['ui:options']?.labelVariant;

  labelVariant =
    labelVariant &&
    ['entityRef', 'primaryTitle', 'secondaryTitle'].includes(labelVariant)
      ? labelVariant
      : 'entityRef';

  const catalogApi = useApi(catalogApiRef);
  const entityPresentationApi = useApi(entityPresentationApiRef);

  // Fetch entities from the catalog and build a map of entity references to presentation snapshots.
  const { value: entities, loading } = useAsync(async () => {
    const { items } = await catalogApi.getEntities(
      catalogFilter
        ? { filter: catalogFilter }
        : { filter: undefined }
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
  const onSelect = useCallback(
    (_: any, ref: Entity | null, reason: AutocompleteChangeReason) => {
      if (typeof ref !== 'string') {
        // If no entity is selected, trigger validation for required fields.
        onChange(ref ? ref : undefined);  
      } else {
        if (reason === 'blur' || reason === 'create-option') {
          const entityToSelect = entities?.catalogEntities.find(
            e => getOptionLabel(e) === ref,
          );

          if (formData !== entityToSelect) {
            onChange(entityToSelect);
          }
        }
      }
    },
    [onChange, formData],
  );

  // Find the currently selected entity from the fetched entities.
  const selectedEntity = entities?.catalogEntities.find(e => e === formData);

  // If only one entity is available, select it automatically.
  useEffect(() => {
    if (
      entities?.catalogEntities.length === 1 &&
      selectedEntity === undefined
    ) {
      const firstEntity = entities.catalogEntities[0];

      onChange(firstEntity);
    }
  }, [entities, onChange, selectedEntity]);

  // Get the label to display for a given entity based on the chosen label variant.
  function getOptionLabel(ref: Entity | CompoundEntityRef) {
    const presentation = entities?.entityRefToPresentation.get(
      stringifyEntityRef(ref),
    );

    return presentation?.[
      labelVariant as keyof EntityRefPresentationSnapshot
    ] as string;
  }

  return (
    <FormControl
      margin="normal"
      required={required}
      error={rawErrors?.length > 0 && !formData}
    >
      <Autocomplete
        disabled={entities?.catalogEntities.length === 1}
        id={idSchema?.$id}
        value={selectedEntity}
        loading={loading}
        onChange={onSelect}
        options={entities?.catalogEntities || []}
        getOptionLabel={option => {
          return typeof option === 'string' ? option : getOptionLabel(option);
        }}
        autoSelect
        freeSolo={false}
        renderInput={params => (
          <TextField
            {...params}
            label={title}
            margin="dense"
            helperText={description}
            FormHelperTextProps={{ margin: 'dense', style: { marginLeft: 0 } }}
            variant="outlined"
            required={required}
            InputProps={params.InputProps}
          />
        )}
        renderOption={option => (
          <EntityDisplayName
            entityRef={option}
            labelVariant={labelVariant}
          />
        )}
        filterOptions={createFilterOptions<Entity>({
          stringify: option => getOptionLabel(option),
        })}
        ListboxComponent={VirtualizedListbox}
      />
    </FormControl>
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