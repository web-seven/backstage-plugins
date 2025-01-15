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
import { MultiEntityValuePickerProps } from './schema';
import { VirtualizedListbox } from '../../fieldsRelated/VirtualizedListBox';
import { EntityDisplayName } from '../../fieldsRelated/EntityDisplayName';
import { useTemplateFormState } from '../../../FormStateContext';
import {
  buildCatalogFilter,
  getEntityOptionLabel,
  getValueByPath,
} from '../../../utils';

export { MultiEntityValuePickerSchema } from './schema';

/**
 * The underlying component that is rendered in the form for the `MultiEntityValuePicker`
 * field extension.
 *
 * @public
 */
export const MultiEntityValuePicker = (props: MultiEntityValuePickerProps) => {
  const {
    onChange,
    schema: { title = 'Entities', description = 'Entities from the catalog' },
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

  const [autocompleteValue, setAutocompleteValue] = useState<Entity[]>([]);

  const catalogFilter = buildCatalogFilter(uiSchema);
  const valuePath: string | undefined = uiSchema['ui:options']?.valuePath;

  let labelVariant = uiSchema['ui:options']?.labelVariant;

  labelVariant =
    labelVariant &&
    ['entityRef', 'primaryTitle', 'secondaryTitle'].includes(labelVariant)
      ? labelVariant
      : 'primaryTitle';

  const catalogApi = useApi(catalogApiRef);
  const entityPresentationApi = useApi(entityPresentationApiRef);

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

  const onEntitiesSelect = useCallback(
    (selectedEntities: Entity[]) => {
      if (!valuePath) {
        throw new Error('Value Path is not set in ui:options');
      } else {
        if (setFormState) {
          setFormState({
            [name]: selectedEntities.map(entity => entity.metadata.name),
          });
        }
        onChange(
          selectedEntities.map(entity => getValueByPath(entity, valuePath)),
        );
        setAutocompleteValue(selectedEntities);
      }
    },
    [onChange, name, setFormState, valuePath],
  );

  /* eslint-disable */
  useEffect(() => {
    if (!loading && entities) {
      let initialEntitiesNames: string[] = [];

      if (Array.isArray(props.formContext.formData.formState?.[name])) {
        initialEntitiesNames = props.formContext.formData.formState?.[
          name
        ] as string[];
      }

      let initialEntities: Entity[] = [];

      if (entities?.catalogEntities.length === 1) {
        initialEntities = [entities.catalogEntities[0]];
      } else {
        const formStateEntitiesNames = formState?.[name] as
          | string[]
          | undefined;

        initialEntitiesNames =
          formStateEntitiesNames && formStateEntitiesNames.length
            ? formStateEntitiesNames
            : initialEntitiesNames || [];

        initialEntities = initialEntitiesNames
          .map(entityName =>
            entities?.catalogEntities.find(
              (e: Entity) => e.metadata.name === entityName,
            ),
          )
          .filter(Boolean) as Entity[];
      }

      onEntitiesSelect(initialEntities);
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
          multiple
          value={autocompleteValue}
          filterSelectedOptions
          disabled={entities?.catalogEntities.length === 1}
          id={idSchema?.$id}
          loading={loading}
          onChange={(_, value) => onEntitiesSelect(value)}
          options={entities?.catalogEntities || []}
          renderOption={option => (
            <EntityDisplayName entityRef={option} labelVariant={labelVariant} />
          )}
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
              required={required ? autocompleteValue.length === 0 : required}
              InputProps={params.InputProps}
            />
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
