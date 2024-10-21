import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { OpenfgaRoutesService } from '../OpenfgaRoutesService';
import { RouterOptions } from '../types';
import express from 'express';
import Router from 'express-promise-router';
import { PermissionCollector } from '../permissions/PermissionCollector';
import { OpenFgaService } from './OpenFgaClient';

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, auth } = options;

  const router = Router();
  const service = new OpenfgaRoutesService({ logger, config, auth });
  router.use(express.json());

  router.get('/extract-permissions', async (_, response) => {
    const permissionCollector = new PermissionCollector(config, logger, auth);
    const permissions = await permissionCollector.collectPermissions();
    response.json({ data: permissions });
  });

  router.get('/create-authorization-model', async (_, response) => {
    const permissionCollector = new PermissionCollector(config, logger, auth);
    const permissions = await permissionCollector.collectPermissions();
    const openFgaService = new OpenFgaService(config);
    const model = await openFgaService.createAuthorizationModel(permissions);

    response.json({ data: model });
  });

  const baseUrl = config.getString('openfga.baseUrl').replace('/:base-url', '');

  router.get(baseUrl, service.getTupleGridData.bind(service));
  router.post(baseUrl, service.setRelations.bind(service));

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  return router;
}
