# EntityObjectPicker Field Extension Plugin

This plugin for Backstage provides a `ScaffolderFieldExtension` that enhances the functionality of the `EntityPicker` field. The plugin allows you to select and use the entire object of the selected entity as the value.

## Configuration

Configuration is done through the field's settings in the template. The following options are supported:

- `ui:options.labelVariant`: Specifies which variant of the `label` should be used for displaying the options. The supported values are:
  - `primaryTitle`: The primary title of the entity.
  - `secondaryTitle`: The secondary title of the entity.
  - `entityRef`: The entity reference.

## Example Usage

To use the field extension, you need to import it and add the following section to the `ScaffolderPage` route in `App.tsx`:

```javascript
import { EntityObjectPickerFieldExtension } from '@web-seven/scaffolder-fields-extensions';

<Route path="/create" element={<ScaffolderPage />}>
  <ScaffolderFieldExtensions>
    <EntityObjectPickerFieldExtension />
  </ScaffolderFieldExtensions>
</Route>
```

Example configuration of the `EntityObjectPicker` field in a template:

```yaml
ui:field: EntityObjectPicker
ui:options:
  labelVariant: primaryTitle
```