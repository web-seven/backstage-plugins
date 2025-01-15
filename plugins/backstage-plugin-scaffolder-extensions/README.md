# EntityObjectPicker Field Extension Plugin

This plugin for Backstage provides a `ScaffolderFieldExtensions` that enhances the functionality of the `EntityPicker` field. The plugin allows you to select and use the entire object of the selected entity as a value or choose which specific fields of the entity will be used as a value. Additionally, the plugin provides a custom `ReviewStepComponent` to display a preview link to the selected entity.

## Configuration

### EntityValuePicker

Configuration is done through the field's settings in the template. The following options are supported:

- `ui:options.labelVariant`: Specifies which variant of the `label` should be used for displaying the options. The supported values are:

  - `primaryTitle`: The primary title of the entity.
  - `secondaryTitle`: The secondary title of the entity.
  - `entityRef`: The entity reference.

- `ui:options.valuesSchema`: A schema that describes which entity properties should be used to create the object used by the ui:options.template.

Example of a `valuesSchema`:

```yaml
ui:options:
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

- `ui:options.valuePath`: Can be used instead of ui:options.valuesSchema. If is need to select only one property from the entity, specify the path to this property in valuePath. Value of selected property must be string.

- `ui:options.template`: Nunjucks template that uses selected values from entity and set the final value of the EntityValuePicker

Example of template:

```YAML
ui:options:
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

### MultiEntityObjectPicker and MultiEntityValuePicker

Is used in the same way as EntityValuePicker and EntityObjectPicker.
The difference is that the returned value is an array, in the case of MultiEntityObjectPicker is an array with the selected entity objects.

For MultiEntityValuePicker the value is an array of strings containing the property specified in valuePath for each selected entity. For MultiEntityValuePicker valuesSchema cannot be used.

## Example Usage

To use the field extension, you need to import it and add the following section to the `ScaffolderPage` route in `App.tsx`:

```javascript
import {
  EntityObjectPickerFieldExtension,
  MultiEntityObjectPickerFieldExtension,
  EntityValuePickerFieldExtension,
  MultiEntityValuePickerFieldExtension,
} from '@web-seven/backstage-plugin-scaffolder-extensions';

<Route path="/create" element={<ScaffolderPage />}>
  <ScaffolderFieldExtensions>
    <EntityObjectPickerFieldExtension />
    <EntityValuePickerFieldExtension />
    <MultiEntityObjectPickerFieldExtension />
    <MultiEntityValuePickerFieldExtension />
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
ui:field: EntityValuePicker
ui:options:
  labelVariant: primaryTitle,
  valuesSchema: (described above)
  template: (described above)
```

### EditEntityByTemplatePage

You can edit an entity using the same template that you created the entity with.

To use this feature you need to:

1. import it and add the following prop for `ScaffolderPage` component in `App.tsx`:

```javascript
import { EditEntityByTemplatePage } from '@web-seven/backstage-plugin-scaffolder-extensions';

<Route
  path="/create"
  element={
    <ScaffolderPage
      components={{
        EXPERIMENTAL_TemplateWizardPageComponent: EditEntityByTemplatePage,
      }}
    />
  }
>
  ...
</Route>;
```

This component is also used to autofill custom fields when moving between template steps.

2. add folowing annotations in catalog-info.yaml of your component:

```yaml
backstage.io/edit-data:
backstage.io/edit-url:
```

values ​​for these annotations can be obtained from template parameters

template:

```yaml
steps:
  - id: fetch-base
    name: your fetch base name
    action: fetch:template
    input:
      url: ./content
      values:
        name: ${{ parameters.name }}
        editData: ${{ parameters._editData }}
```

catalog-info.yaml of your entity (replace text in square brackets with required data):

```yaml
metadata:
  name: ${{ values.name | dump }}
  annotations:
    backstage.io/edit-data: '${{ values.editData }}'
    backstage.io/edit-url: /create/templates/default/[template name]?kind=[kind of entity]&namespace=[namespace of entity]&name=${{ values.name }}
```
