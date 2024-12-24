# EntityObjectPicker Field Extension Plugin

This plugin for Backstage provides a `ScaffolderFieldExtensions` that enhances the functionality of the `EntityPicker` field. The plugin allows you to select and use the entire object of the selected entity as a value or choose which specific field of the entity will be used as a value. Additionally, the plugin provides a custom `ReviewStepComponent` to display a preview link to the selected entity.

## Configuration

### EntityValuePicker

Configuration is done through the field's settings in the template. The following options are supported:

- `ui:options.labelVariant`: Specifies which variant of the `label` should be used for displaying the options. The supported values are:

  - `primaryTitle`: The primary title of the entity.
  - `secondaryTitle`: The secondary title of the entity.
  - `entityRef`: The entity reference.

- `ui:options.valuesSchema`: A schema that describes which entity properties should be used to create the object used by the template.

Example of a `valuesSchema`:

```yaml
valuesSchema:
  name: metadata.name
  tag: spec.tags
  version: spec.version
  user:
    value: spec.users
    optionLabel: name
    properties:
      user_name: name
      user_id: id
      address:
        value: address
        optionLabel: street
        properties:
          street: street
      jobs:
        value: jobs
        optionLabel: title
        properties:
          id: id
          address: address
  relations:
    value: relations
    optionLabel: type
    properties:
      type: type
      targetRef: targetRef
      kind: target.kind
      name: target.name
      namespace: target.namespace
```

If the selected value from the template is an array, an additional picker will be rendered to select the final value from the array. If the value is an array of objects, `optionLable` is used to specify which property of the selected object will be the label for the rendered picker options. Additionally, you can choose which properties of the object will be selected with `properties`. `value` is the path to this array of objects.

- `ui:options.template`: Nunjucks template that uses selected values from entity and set the final value of the EntityValuePicker
  Example of template:

```YAML
template: "Entity Name: {{ name }} \n
  Tag: {{ tag }} \n
  Version: {{ version }} \n
  User name: {{ user.user_name }} \n
  User id: {{ user.user_id }} \n
  User address street: {{ user.address.street }} \n
  Job id: {{ user.jobs.id }} \n
  Job address: {{ user.jobs.address }} \n
  Relations type: {{ relations.type }} \n
  Relations Target Ref: {{ relations.targetRef }} \n
  Relations kind: {{ relations.kind }} \n
  Relations name: {{ relations.name }} \n
  Relations namespace: {{ relations.namespace }}"
```

### EntityObjectPicker

- `ui:options.labelVariant`: same as for EntityValuePicker

## Example Usage

To use the field extension, you need to import it and add the following section to the `ScaffolderPage` route in `App.tsx`:

```javascript
import {
  EntityObjectPickerFieldExtension,
  EntityValuePickerFieldExtension,
} from '@web-seven/backstage-plugin-scaffolder-extensions';

<Route path="/create" element={<ScaffolderPage />}>
  <ScaffolderFieldExtensions>
    <EntityObjectPickerFieldExtension />
    <EntityValuePickerFieldExtension />
  </ScaffolderFieldExtensions>
</Route>;
```

To use the custom ReviewStepComponent, you need to import it and add the following prop for `ScaffolderPage` component in `App.tsx`:

```javascript
import { ReviewStepComponent } from '@web-seven/backstage-plugin-scaffolder-extensions';

<Route
  path="/create"
  element={<ScaffolderPage components={{ ReviewStepComponent }} />}
>
  ...
</Route>;
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
  valuesSchema: (described above)
```
