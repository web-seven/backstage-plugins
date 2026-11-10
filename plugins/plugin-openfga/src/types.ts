/** @public */
export type Relations = {
  [resourceKey in string]: {
    [roleKey in string]: boolean;
  };
};

/** @public */
export type TupleTreeData = {
  storeName: string;
  resources: string[];
  roles: string[];
  relations: Relations;
};

/** @public */
export type SetScopeRelationsResponse = {
  message: string;
};

/** @public */
export interface OpenFgaApi {
  getScopeRelations: (scope: string, name: string) => Promise<TupleTreeData>;
  setScopeRelations: (
    scope: string,
    name: string,
    relations: Relations,
  ) => Promise<SetScopeRelationsResponse>;
}
