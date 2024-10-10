import { JsonObject } from '@backstage/types';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { TupleGridData } from '@web-seven/backstage-plugin-openfga-common';
import express from 'express';
import Router from 'express-promise-router';

type TypeDefinition = {
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

type Store = {
  id: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
};

type AuthorizationModel = {
  id: string;
  schema_version: string;
  type_definitions: TypeDefinition[];
  conditions: JsonObject;
};

type GetStoresResponse = {
  stores: Store[];
  continuation_token: string;
};

type GetAuthorizationModelsResponse = {
  authorization_models: AuthorizationModel[];
  continuation_token: string;
};

const REQUIRED_TYPES = [
  {
    type: 'group',
  },
  {
    type: 'resource',
    relations: {
      create: {
        type: 'group',
      },
      delete: {
        type: 'group',
      },
      read: {
        type: 'group',
      },
      update: {
        type: 'group',
      },
    },
  },
];

export interface RouterOptions {
  logger: LoggerService;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;

  const router = Router();
  router.use(express.json());

  const openfgaHost = config.getString('openfga.host'),
    openfgaToken = config.getString('openfga.token');

  router.get('/relations/:scope', async (request, response) => {
    const scope = request.params?.scope;
    const storesURL = `${openfgaHost}/stores`;

    const store = await openfgaApiRequest<GetStoresResponse>(storesURL);

    const storeId = store.stores[0].id;
    const authorizationModelsUrl = `${openfgaHost}/stores/${storeId}/authorization-models`;

    const getAuthorizationModelsResponse =
      await openfgaApiRequest<GetAuthorizationModelsResponse>(
        authorizationModelsUrl,
      );

    const authorizationModels =
      getAuthorizationModelsResponse.authorization_models;

    const authorizationModel = authorizationModels.filter(
      authorizationModel => {
        const typeDefinitions = authorizationModel.type_definitions;
        const filteredTypes = typeDefinitions.filter(typeDefinition => {
          return REQUIRED_TYPES.find(requiredType => {
            typeDefinition.type === requiredType.type &&
              requiredType.type in typeDefinition.metadata.relations &&
              typeDefinition.metadata.relations[requiredType.type].directly_related_user_types;
          });
        });
        return filteredTypes.length === REQUIRED_TYPES.length;
      },
    );
    console.log(authorizationModel);

    // response.send(data);
  });

  const openfgaApiRequest = async <T>(
    requestURL: string,
    options?: RequestInit,
  ): Promise<T> => {
    const response = await fetch(requestURL, options);

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status} Error`);
    }

    const data = await response?.json();

    return data;
  };

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
