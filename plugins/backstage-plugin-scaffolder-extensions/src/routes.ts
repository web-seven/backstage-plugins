import {
  createRouteRef,
  createSubRouteRef,
} from '@backstage/core-plugin-api';

/**
 * @public
 */
export const rootRouteRef = createRouteRef({
  id: 'scaffolder-extensions',
});

export const editingByTemplateRouteRef = createSubRouteRef({
  id: 'scaffolder-extensions/entity/edit-by-template',
  parent: rootRouteRef,
  path: '/entity/edit-by-template/:kind/:namespace/:entityName',
});
