import {
  type EntityFilterQuery,
  CATALOG_FILTER_EXISTS,
} from '@backstage/catalog-client';
import {
  CompoundEntityRef,
  Entity,
  parseEntityRef,
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
  EntityValuePickerFilterQueryValue,
  EntityValuePickerProps,
  EntityValuePickerUiOptions,
  EntityValuePickerFilterQuery,
} from './schema';
import { VirtualizedListbox } from '../../fieldsRelated/VirtualizedListBox';
import { EntityDisplayName } from '../../fieldsRelated/EntityDisplayName'

export { EntityValuePickerSchema } from './schema';

/**
 * The underlying component that is rendered in the form for the `EntityValuePicker`
 * field extension.
 *
 * @public
 */
export const EntityValuePicker = (props: EntityValuePickerProps) => {
  const {
    onChange,
    schema: { title = 'Entity', description = 'An entity from the catalog' },
    required,
    uiSchema,
    rawErrors,
    formData,
    idSchema,
  } = props;
  const catalogFilter = buildCatalogFilter(uiSchema);
  const defaultKind = uiSchema['ui:options']?.defaultKind;
  const defaultNamespace =
    uiSchema['ui:options']?.defaultNamespace || undefined;

  const valuePath = uiSchema['ui:options']?.valuePath ?? '';

  let labelVariant = uiSchema['ui:options']?.labelVariant;
  
  labelVariant = labelVariant && ['entityRef', 'primaryTitle', 'secondaryTitle'].includes(labelVariant)
    ? labelVariant
    : 'primaryTitle';

  const catalogApi = useApi(catalogApiRef);
  const entityPresentationApi = useApi(entityPresentationApiRef);

  const { value: entities, loading } = useAsync(async () => {
    const fields = [
      'metadata.name',
      'metadata.namespace',
      'metadata.title',
      'kind',
    ];

    if (!fields.includes(valuePath) && Boolean(valuePath)) {
      fields.push(valuePath);
    }

    const { items } = await catalogApi.getEntities(
      catalogFilter
        ? { filter: catalogFilter, fields }
        : { filter: undefined, fields },
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

  const allowArbitraryValues =
    uiSchema['ui:options']?.allowArbitraryValues ?? true;

  const getLabel = useCallback(
    (freeSoloValue: string) => {
      try {
        // Will throw if defaultKind or defaultNamespace are not set
        const parsedRef = parseEntityRef(freeSoloValue, {
          defaultKind,
          defaultNamespace,
        });

        return getOptionValue(parsedRef);
      } catch (err) {
        return freeSoloValue;
      }
    },
    [defaultKind, defaultNamespace],
  );

  const onSelect = useCallback(
    (_: any, ref: any | null, reason: AutocompleteChangeReason) => {
      // ref can either be a string from free solo entry or

      if (typeof ref !== 'string') {
        // if ref does not exist: pass 'undefined' to trigger validation for required value
        const valueToSelect = ref
          ? getOptionValue(ref)
          : undefined;

        onChange(valueToSelect);
      } else {
        if (reason === 'blur' || reason === 'create-option') {
          // Add in default namespace, etc.
          let entityRef = ref;
          try {
            // Attempt to parse the entity ref into it's full form.
            entityRef = stringifyEntityRef(
              parseEntityRef(ref as string, {
                defaultKind,
                defaultNamespace,
              }),
            );
          } catch (err) {
            // If the passed in value isn't an entity ref, do nothing.
          }
          // We need to check against formData here as that's the previous value for this field.
          if (formData !== ref || allowArbitraryValues) {
            const valueToSelect = valuePath ? ref : entityRef;
            onChange(valueToSelect);
          }
        }
      }
    },
    [onChange, formData, defaultKind, defaultNamespace, allowArbitraryValues],
  );

  // Since free solo can be enabled, attempt to parse as a full entity ref first, then fall
  // back to the given value.
  const selectedEntity =
    entities?.catalogEntities.find(e => getOptionValue(e) === formData) ?? 
    (allowArbitraryValues && formData ? getLabel(formData) : '');
      
  useEffect(() => {
    if (entities?.catalogEntities.length === 1 && selectedEntity === '') {
      const firstEntity = entities.catalogEntities[0];
      const valueToSelect = getOptionValue(firstEntity);

      onChange(valueToSelect);
    }
  }, [entities, onChange, selectedEntity]);

  function getOptionLabel(ref: Entity | CompoundEntityRef) {
    if(ref) {
      const presentation = entities?.entityRefToPresentation.get(
        stringifyEntityRef(ref),
      );
      return presentation?.[
        labelVariant as keyof EntityRefPresentationSnapshot
      ] as string;
    }
    return '';
  }

  function getOptionValue(ref: Entity | CompoundEntityRef) {
    return valuePath
      ? getValueFromEntityRef(ref as Entity, valuePath)
      : stringifyEntityRef(ref as Entity);
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
          // option can be a string due to freeSolo.
          return typeof option === 'string' ? option : getOptionLabel(option);
        }}
        autoSelect
        freeSolo={allowArbitraryValues}
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
        renderOption={option => <EntityDisplayName entityRef={option} labelVariant={labelVariant} />}
        filterOptions={createFilterOptions<Entity>({
          stringify: option => getOptionLabel(option),
        })}
        ListboxComponent={VirtualizedListbox}
      />
    </FormControl>
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

function getValueByPath(entity: Entity, path: string): string {
  return path
    .split('.')
    .reduce((acc: any, part: string) => acc && acc[part], entity);
}

function getValueFromEntityRef(entity: Entity, key: string) {
  return getValueByPath(entity, key);
}