import express from 'express';
import { Relations, TupleTreeData, TupleKey, TupleKeys } from '../types';
import { LoggerService } from '@backstage/backend-plugin-api';
import { OpenFgaService } from '../service/OpenFGAService';

export class OpenFGARoute {
  constructor(private service: OpenFgaService, private logger: LoggerService) {}

  /**
   * Route for get tuples data
   * @param request request: express.Request
   * @param response express.Response
   * @returns void
   */
  async getTupleTreeData(request: express.Request, response: express.Response) {
    const { scope, name } = request.params;

    try {
      const storeId = await this.service.getStoreId();

      if (!storeId) {
        const message =
          'No store found with the specified ID in the configuration';
        this.logger.error(message);
        return response.status(404).json({ message });
      }

      const authorizationModel = await this.service.getAuthorizationModel(
        storeId,
      );
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

      const relationPromises = typeDefinitions.flatMap(typeDefinition =>
        Object.entries(typeDefinition.metadata?.relations || {}).map(
          async ([role, value]) => {
            if (
              value.directly_related_user_types?.some(
                relatedUser => relatedUser.type === scope,
              )
            ) {
              const listObjects = await this.service.getObjects(
                typeDefinition.type,
                role,
                `${scope}:${name}`,
              );
              validRelations[typeDefinition.type] =
                validRelations[typeDefinition.type] || {};
              validRelations[typeDefinition.type][role] =
                listObjects.length !== 0;
            }
          },
        ),
      );

      await Promise.all(relationPromises);

      const storeName = (await this.service.getStoreName()) || 'backstage';

      const data: TupleTreeData = {
        storeName,
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

  /**
   * Route for set relations
   * @param request express.Request
   * @param response express.Response
   * @returns void
   */
  async setRelations(request: express.Request, response: express.Response) {
    const { scope, name } = request.params;

    try {
      const storeId = await this.service.getStoreId();
      if (!storeId) {
        return response
          .status(404)
          .json({ message: 'No store was found or has the specified ID' });
      }

      const authorizationModel = await this.service.getAuthorizationModel(
        storeId,
      );
      if (!authorizationModel) {
        return response
          .status(404)
          .json({ message: 'No authorization model ID was found' });
      }

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
        await this.service.writeTuples(tupleKeys.writes);
      }

      if (tupleKeys.deletes.length) {
        await this.service.deleteTuples(tupleKeys.deletes);
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
}
