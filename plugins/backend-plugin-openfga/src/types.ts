import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { JsonObject } from '@backstage/types';
import { OpenFgaService } from './service/OpenFGAService';

export type Relations = {
  [resourceKey in string]: {
    [roleKey in string]: boolean;
  };
};

export type TupleTreeData = {
  storeName: string;
  resources: string[];
  roles: string[];
  relations: Relations;
};

export type SetScopeRelationsResponse = {
  message: string;
};

export type TypeDefinition = {
  type: string;
  relations: JsonObject;
  metadata: {
    relations: {
      [key: string]: {
        directly_related_user_types: {
          type: string;
        }[];
      };
    };
  };
};

export type Store = {
  id: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
};

export type AuthorizationModel = {
  id: string;
  schema_version: string;
  type_definitions: TypeDefinition[];
  conditions: JsonObject;
};

export type GetStoresResponse = {
  stores: Store[];
  continuation_token: string;
};

export type GetAuthorizationModelsResponse = {
  authorization_models: AuthorizationModel[];
  continuation_token: string;
};

export type ListObjectsResponse = {
  objects: string[];
};

export type TupleKey = {
  user: string;
  relation: string;
  object: string;
};

export type TupleKeys = {
  deletes: TupleKey[];
  writes: TupleKey[];
};

export interface RouterOptions {
  logger: LoggerService;
  config: Config;
  service: OpenFgaService;
}
