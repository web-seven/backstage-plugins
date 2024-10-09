import {
  Relations,
  TupleGridData
} from '@web-seven/backstage-plugin-openfga-common';
import { createApiRef } from '@backstage/core-plugin-api';

/** @public */
export const openFgaApiRef = createApiRef<OpenFgaApi>({
  id: 'plugin.openfga',
});

/** @public */
export interface OpenFgaApi {
  getScopeRelations: (scope: string) => Promise<TupleGridData>;
  setScopeRelations: (scope: string, relations: Relations) => Promise<unknown>;
}