import {
  Relations,
  SetScopeRelationsResponse,
  TupleTreeData,
} from '@web-seven/backstage-backend-plugin-openfga';

/** @public */
export interface OpenFgaApi {
  getScopeRelations: (scope: string, name: string) => Promise<TupleTreeData>;
  setScopeRelations: (
    scope: string,
    name: string,
    relations: Relations,
  ) => Promise<SetScopeRelationsResponse>;
}
