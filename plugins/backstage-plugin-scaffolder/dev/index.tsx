import { createDevApp } from '@backstage/dev-utils';
import { backstagePluginScaffolder } from '../src/plugin';

createDevApp()
  .registerPlugin(backstagePluginScaffolder)
  .render();
