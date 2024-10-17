import {
  Relations,
  SetScopeRelationsResponse,
  TupleGridData,
} from '@web-seven/backstage-plugin-openfga-backend';

/** @public */
export interface OpenFgaApi {
  getScopeRelations: (scope: string, name: string) => Promise<TupleGridData>;
  setScopeRelations: (
    scope: string,
    name: string,
    relations: Relations,
  ) => Promise<SetScopeRelationsResponse>;
}
