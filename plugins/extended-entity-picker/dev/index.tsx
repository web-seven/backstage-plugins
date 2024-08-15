import { createDevApp } from '@backstage/dev-utils';
import { extendedEntityPickerPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(extendedEntityPickerPlugin)
  .render();
