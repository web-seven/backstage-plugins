import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { OpenfgaRoutesService } from '../OpenfgaRoutesService';
import { RouterOptions } from '../types';
import { LoggerService  } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router'
import {collectPermissions} from '../permissions/permissionsCollector'
import {OpenFgaService} from './openfgaClient'


export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;
  const router = Router();
  const service = new OpenfgaRoutesService({ logger, config });
  router.use(express.json());
 
  router.get('/extract-permissions', async (_, response) => {
    const permissions = await collectPermissions(config, logger);
    response.json({ data: permissions });
  });

  router.get('/create-authorization-model', async (_, response) => {
    const permitionList = await collectPermissions(config, logger);
    const openFgaService = new OpenFgaService(config);
    const model = await openFgaService.createAuthorizationModel(permitionList);

    response.json({ data: model });
  });

  const baseUrl = config.getString('openfga.baseUrl').replace('/:base-url', '');

  router.get(baseUrl, service.getTupleGridData.bind(service));
  router.post(baseUrl, service.setRelations.bind(service));

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  return router;
}



