import { createDevApp } from '@backstage/dev-utils';
import { openfgaPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(openfgaPlugin)
  .render();
