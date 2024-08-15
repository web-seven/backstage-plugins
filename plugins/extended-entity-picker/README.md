# extended-entity-picker

Welcome to the extended-entity-picker plugin!

## Backstage EntityPicker Field Extension Plugin

This plugin for Backstage provides a `ScaffolderFieldExtension` that enhances the functionality of the `EntityPicker` field. The plugin allows you to configure which property of the entity (`Entity`) will be used as the `value` for the options, as well as which property will be displayed as the `label` for these options.

## Configuration

Configuration is done through the field's settings in the template. The following options are supported:

- `ui:options.fieldOptionValue`: Specifies which entity property will be used as the `value` for the options. This allows dynamic selection of the option values based on specific entity properties.

- `ui:options.optionsLabelVariant`: Specifies which variant of the `label` should be used for displaying the options. The supported values are:
  - `primaryTitle`: The primary title of the entity.
  - `secondaryTitle`: The secondary title of the entity.
  - `entityRef`: The entity reference.

## Example Usage

Example configuration of the `EntityPicker` field in a template:

```yaml
ui:field: ExtendedEntityPicker
ui:options:
  fieldOptionValue: metadata.name
  optionsLabelVariant: primaryTitle