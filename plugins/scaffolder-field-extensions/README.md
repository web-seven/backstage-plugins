# EntityObjectPicker Field Extension Plugin

This plugin for Backstage provides a `ScaffolderFieldExtensions` that enhances the functionality of the `EntityPicker` field. The plugin allows you to select and use as value the entire object of the selected entity or select which field of Entity will be used as value.

## Configuration

### EntityValuePicker
Configuration is done through the field's settings in the template. The following options are supported:

- `ui:options.labelVariant`: Specifies which variant of the `label` should be used for displaying the options. The supported values are:
  - `primaryTitle`: The primary title of the entity.
  - `secondaryTitle`: The secondary title of the entity.
  - `entityRef`: The entity reference.

- `ui:options.valuePath`: Specifies which field of selected entity will be used as value.

### EntityObjectPicker

- `ui:options.labelVariant`: same as for EntityValuePicker

## Example Usage

To use the field extension, you need to import it and add the following section to the `ScaffolderPage` route in `App.tsx`:

```javascript
import { EntityObjectPickerFieldExtension, EntityValuePickerFieldExtension } from '@web-seven/scaffolder-field-extensions';

<Route path="/create" element={<ScaffolderPage />}>
  <ScaffolderFieldExtensions>
    <EntityObjectPickerFieldExtension />
    <EntityValuePickerFieldExtension />
  </ScaffolderFieldExtensions>
</Route>
```

Example configuration of the `EntityObjectPicker` field in a template:

```yaml
ui:field: EntityObjectPicker
ui:options:
  labelVariant: primaryTitle
```

Example configuration of the `EntityValuePicker` field in a template:

```yaml
ui:field: EntityObjectPicker
ui:options:
  labelVariant: primaryTitle,
  valuePath: metadata.name