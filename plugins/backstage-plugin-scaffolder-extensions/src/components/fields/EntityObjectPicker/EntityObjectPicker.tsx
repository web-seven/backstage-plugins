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
import { EntityObjectPickerProps } from './schema';
import { VirtualizedListbox } from '../../fieldsRelated/VirtualizedListBox';
import { EntityDisplayName } from '../../fieldsRelated/EntityDisplayName';
import { buildCatalogFilter, getEntityOptionLabel } from '../../../utils';
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
    if (!loading && entities?.catalogEntities?.length) {
      let initialEntityName =
        props.formContext.formData?.formState?.[name] ||
        formData?.metadata?.name;

      const initialEntity =
        entities.catalogEntities.length === 1
          ? entities.catalogEntities[0]
          : entities.catalogEntities.find(
              (e: Entity) =>
                e.metadata.name === (formState?.[name] || initialEntityName),
            ) || null;

      onEntitySelect(initialEntity);
    }
  }, [entities, name]);
  /* eslint-enable */

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
          getOptionLabel={option =>
            getEntityOptionLabel(option, entities, labelVariant)
          }
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
            stringify: option =>
              getEntityOptionLabel(option, entities, labelVariant),
          })}
          ListboxComponent={VirtualizedListbox}
        />
      </FormControl>
    </>
  );
};
