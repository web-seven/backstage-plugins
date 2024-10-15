import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import express from 'express';
import Router from 'express-promise-router';
import { OpenfgaRoutesService } from '../OpenfgaRoutesService';
import { RouterOptions } from '../types';
import { LoggerService  } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import {collectPermissions} from '../permitions/permissionsCollector'
import {createAuthorizationModel} from '../fga/openfgaClient'

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;
  const router = Router();
  const service = new OpenfgaRoutesService({ logger, config });
  router.use(express.json());

  router.get('/health', async (_, response) => {
    logger.info('PONG!');
  response.json({ status: 'ok' });
  });

  router.get('/extract-permitions', async (_, response) => {
    const permissions = await collectPermissions(config);
    response.json({ data: permissions });
  });

  router.get('/create-authorization-model', async (_, response) => {
    const permitionList = await collectPermissions(config);
    const model = await createAuthorizationModel(permitionList, config);

    response.json({ data: model });
  });

  const baseUrl = config.getString('openfga.baseUrl').replace('/:base-url', '');

  router.get(baseUrl, service.getTupleGridData.bind(service));
  router.post(baseUrl, service.setRelations.bind(service));

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  return router;
}



