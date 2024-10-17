import express from 'express';
import {
  GetAuthorizationModelsResponse,
  GetStoresResponse,
  ListObjectsResponse,
  Relations,
  RouterOptions,
  TupleGridData,
  TupleKey,
  TupleKeys,
} from './types';
import { LoggerService } from '@backstage/backend-plugin-api';

export class OpenfgaRoutesService {
  private host: string;
  private token: string;
  private configStoreId: string;
  private logger: LoggerService;

  constructor(options: RouterOptions) {
    const { config, logger } = options;
    this.host = config.getString('openfga.host');
    this.token = config.getString('openfga.token');
    this.configStoreId = config.getString('openfga.storeId');
    this.logger = logger;
  }

  async getStoreId(): Promise<string | undefined> {
    const storesURL = `${this.host}/stores`;
    const getStoresResponse = await this.openfgaApiRequest<GetStoresResponse>(
      storesURL,
    );

    if (!getStoresResponse?.stores.length) {
      return undefined;
    }

    const storeId = getStoresResponse.stores.find(
      store => store.id === this.configStoreId,
    )?.id;

    return storeId;
  }

  async getAuthorizationModel(
    storeId: string,
  ): Promise<GetAuthorizationModelsResponse['authorization_models'][0] | null> {
    const authorizationModelsUrl = `${this.host}/stores/${storeId}/authorization-models`;
    const getAuthorizationModelsResponse =
      await this.openfgaApiRequest<GetAuthorizationModelsResponse>(
        authorizationModelsUrl,
      );

    const authorizationModel =
      getAuthorizationModelsResponse?.authorization_models?.[0];

    return authorizationModel;
  }

  async getTupleGridData(request: express.Request, response: express.Response) {
    const { scope, name } = request.params;

    try {
      const storeId = await this.getStoreId();
      if (!storeId) {
        const message =
          'No store found with the specified ID in the configuration';
        this.logger.error(message);
        return response.status(404).json({ message });
      }

      const authorizationModel = await this.getAuthorizationModel(storeId);
      if (!authorizationModel) {
        const message = 'No authorization model was found';
        this.logger.error(message);
        return response.status(404).json({ message });
      }

      const typeDefinitions = authorizationModel.type_definitions;
      const hasScopeType = typeDefinitions.some(
        typeDefinition => typeDefinition.type === scope,
      );

      if (!hasScopeType) {
        const message = 'Authorization model has no scope type';
        this.logger.error(message);
        return response.status(400).json({ message });
      }

      const validRelations: Relations = {};
      const listObjectsUrl = `${this.host}/stores/${storeId}/list-objects`;

      const relationPromises = typeDefinitions.flatMap(typeDefinition =>
        Object.entries(typeDefinition.metadata?.relations || {}).map(
          async ([role, value]) => {
            if (
              value.directly_related_user_types.some(
                relatedUser => relatedUser.type === scope,
              )
            ) {
              const listObjects =
                await this.openfgaApiRequest<ListObjectsResponse>(
                  listObjectsUrl,
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      authorization_model_id: authorizationModel.id,
                      type: typeDefinition.type,
                      user: `${scope}:${name}`,
                      relation: role,
                    }),
                  },
                );
              validRelations[typeDefinition.type] =
                validRelations[typeDefinition.type] || {};
              validRelations[typeDefinition.type][role] =
                listObjects.objects.length !== 0;
            }
          },
        ),
      );

      await Promise.all(relationPromises);

      const data: TupleGridData = {
        relations: validRelations,
        resources: Object.keys(validRelations),
        roles: [
          ...new Set(
            Object.values(validRelations).flatMap(relation =>
              Object.keys(relation),
            ),
          ),
        ],
      };

      return response.status(200).json(data);
    } catch (error) {
      this.logger.error(`Failed to get relations: ${error}`);
      return response
        .status(500)
        .json({ message: 'Failed to get relations', error });
    }
  }

  async setRelations(request: express.Request, response: express.Response) {
    const { scope, name } = request.params;

    try {
      const storeId = await this.getStoreId();
      if (!storeId) {
        return response
          .status(404)
          .json({ message: 'No store was found or has the specified ID' });
      }

      const authorizationModel = await this.getAuthorizationModel(storeId);
      if (!authorizationModel) {
        return response
          .status(404)
          .json({ message: 'No authorization model ID was found' });
      }

      const writeTuplesUrl = `${this.host}/stores/${storeId}/write`;
      const relations: Relations = request.body;
      const tupleKeys: TupleKeys = { writes: [], deletes: [] };

      Object.entries(relations).forEach(([resource, resourceRelations]) => {
        Object.entries(resourceRelations).forEach(([relation, value]) => {
          const tupleKey: TupleKey = {
            user: `${scope}:${name}`,
            relation,
            object: `${resource}:all`,
          };
          if (value) {
            tupleKeys.writes.push(tupleKey);
          } else {
            tupleKeys.deletes.push(tupleKey);
          }
        });
      });

      if (tupleKeys.writes.length) {
        await this.openfgaApiRequest<unknown>(writeTuplesUrl, {
          method: 'POST',
          body: JSON.stringify({
            writes: { tuple_keys: tupleKeys.writes },
            authorization_model_id: authorizationModel.id,
          }),
        });
      }

      if (tupleKeys.deletes.length) {
        await this.openfgaApiRequest<unknown>(writeTuplesUrl, {
          method: 'POST',
          body: JSON.stringify({
            deletes: { tuple_keys: tupleKeys.deletes },
          }),
        });
      }

      return response
        .status(200)
        .json({ message: 'Relations updated successfully' });
    } catch (error) {
      this.logger.error(`Failed to update relations: ${error}`);
      return response
        .status(500)
        .json({ message: 'Failed to update relations', error });
    }
  }

  async openfgaApiRequest<T>(
    requestURL: string,
    options?: RequestInit,
  ): Promise<T> {
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    };

    const response = await fetch(requestURL, requestOptions);

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status} Error`);
    }

    return await response.json();
  }
}
