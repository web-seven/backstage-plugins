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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import useAsync from 'react-use/esm/useAsync';
import {
  EntityValuePickerFilterQueryValue,
  EntityValuePickerProps,
  EntityValuePickerUiOptions,
  EntityValuePickerFilterQuery,
} from './schema';
import { VirtualizedListbox } from '../../fieldsRelated/VirtualizedListBox';
import { EntityDisplayName } from '../../fieldsRelated/EntityDisplayName';
import { JsonObject, JsonValue } from '@backstage/types';
import nunjucks from 'nunjucks';
import { getFilledSchema, getValueByPath } from '../../../utils';
import { AdditionalPicker } from '../../fieldsRelated/AdditionalPicker';
import { useTemplateFormState } from '../../../FormStateContext';

type FormState = {
  additionalValues: JsonObject;
  entityName: string;
};

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
    name,
  } = props;

  const templateFormState = useTemplateFormState();
  const { formState, setFormState } = templateFormState
    ? templateFormState
    : { formState: null, setFormState: null };

  const [autocompleteValue, setAutocompleteValue] = useState<Entity | null>(
    null,
  );
  const entityChange = props.onChange;
  const catalogFilter = buildCatalogFilter(uiSchema);
  const [additionalInputs, setAdditionalInputs] = useState<React.ReactNode[]>(
    [],
  );
  const aggregatedProperties = useRef<JsonObject>({});
  const inputsState = useRef<FormState>({
    additionalValues: {},
    entityName: '',
  });

  const valuePath: string | undefined = uiSchema['ui:options']?.valuePath;

  const valuesSchema: JsonObject = useMemo(() => {
    return typeof uiSchema['ui:options']?.valuesSchema === 'object' &&
      uiSchema['ui:options']?.valuesSchema
      ? uiSchema['ui:options']?.valuesSchema
      : {};
  }, [uiSchema]);

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

  function setTargetValue(
    target: JsonObject,
    keys: string[],
    value: JsonValue | undefined,
  ) {
    let current = target;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key] as JsonObject;
    }

    const finalKey = keys[keys.length - 1];
    current[finalKey] =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? { ...value }
        : value;
  }

  function isAllPropertiesFilled(obj: JsonObject): boolean {
    return Object.values(obj).every(value => {
      if (value === null || value === undefined || Array.isArray(value))
        return false;

      if (typeof value === 'object') {
        return isAllPropertiesFilled(value as JsonObject);
      }

      return true;
    });
  }

  function setInputValue(
    keys: string[],
    value: JsonValue | undefined,
    filledProperties: JsonValue | undefined,
  ) {
    setTargetValue(inputsState.current.additionalValues, keys, value);
    setTargetValue(aggregatedProperties.current, keys, filledProperties);

    if (setFormState) {
      setFormState({
        [name]: {
          ...inputsState.current,
        },
      });
    }
    if (isAllPropertiesFilled(aggregatedProperties.current)) {
      entityChange(
        nunjucks.renderString(valueTemplate, aggregatedProperties.current),
      );
    }
  }

  function renderAdditionalInputs(entity: Entity | null) {
    const newAdditionalInputs: React.ReactNode[] = [];

    if (entity) {
      const entityValues = getFilledSchema(entity, valuesSchema);

      for (const key in entityValues) {
        if (entityValues.hasOwnProperty(key)) {
          aggregatedProperties.current = {
            ...aggregatedProperties.current,
            [key]: entityValues[key],
          };

          const currentEntityValue = entityValues[key] as JsonValue;
          let initialValue = null;
          if (inputsState.current.additionalValues) {
            initialValue = inputsState.current.additionalValues[key] ?? null;
          }

          if (Array.isArray(currentEntityValue)) {
            newAdditionalInputs.push(
              <AdditionalPicker
                key={key}
                options={currentEntityValue}
                label={key}
                setInputValue={setInputValue}
                keys={[key]}
                initialValue={initialValue}
              />,
            );
          } else if (
            currentEntityValue &&
            typeof currentEntityValue === 'object'
          ) {
            const optionLabel =
              typeof currentEntityValue?.optionLabel === 'string'
                ? currentEntityValue?.optionLabel
                : undefined;

            if (Array.isArray(currentEntityValue?.value)) {
              newAdditionalInputs.push(
                <AdditionalPicker
                  key={key}
                  options={currentEntityValue?.value}
                  label={key}
                  optionLabel={optionLabel}
                  properties={currentEntityValue?.properties}
                  setInputValue={setInputValue}
                  keys={[key]}
                  initialValue={initialValue}
                />,
              );
            }
          }
        }
      }
    } else {
      aggregatedProperties.current = {};
    }
    if (!newAdditionalInputs.length) {
      entityChange(
        nunjucks.renderString(valueTemplate, aggregatedProperties.current),
      );
    }
    setAdditionalInputs(newAdditionalInputs);
  }

  function onEntitySelect(
    ref: Entity | null,
    isInitialEntity: boolean = false,
  ) {
    if (ref) {
      if (!isInitialEntity) {
        inputsState.current = {
          entityName: ref.metadata.name,
          additionalValues: {},
        };
      }
      if (valuePath) {
        const valueByPath =
          typeof getValueByPath(ref, valuePath) === 'string'
            ? getValueByPath(ref, valuePath)
            : JSON.stringify(getValueByPath(ref, valuePath));

        entityChange(valueByPath);
      } else {
        if (setFormState) {
          setFormState({
            [name]: {
              ...inputsState.current,
            },
          });
        }
        renderAdditionalInputs(ref);
      }
    } else {
      renderAdditionalInputs(null);
    }
    setAutocompleteValue(ref);
  }
  /* eslint-disable */
  useEffect(() => {
    if (!loading && entities) {
      const initialFormState: FormState =
        props.formContext.formData.formState?.[name];

      let initialEntity: Entity | null = null;

      if (entities?.catalogEntities.length === 1) {
        initialEntity = entities.catalogEntities[0];
      } else {
        inputsState.current =
          formState && Object.keys(formState).length > 0 && formState?.[name]
            ? (formState?.[name] as FormState)
            : initialFormState || {
                additionalValues: {},
                entityName: '',
              };

        const entity = entities?.catalogEntities.find(
          e => e.metadata.name === inputsState.current.entityName,
        );
        initialEntity = entity ? entity : null;
      }
      onEntitySelect(initialEntity, true);
    }
  }, [entities, name, valuePath, valueTemplate]);
  /* eslint-enable */

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
