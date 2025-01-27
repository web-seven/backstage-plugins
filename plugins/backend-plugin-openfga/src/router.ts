import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { OpenFGARoute } from './route/OpenFGARoute';
import { RouterOptions } from './types';
import express from 'express';
import Router from 'express-promise-router';

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, service } = options;

  const router = Router();
  const route = new OpenFGARoute(service, logger);
  router.use(express.json());

  const baseUrl = config.getString('openfga.baseUrl').replace('/:base-url', '');

  router.get(baseUrl, route.getTupleGridData.bind(route));
  router.post(baseUrl, route.setRelations.bind(route));

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  return router;
}
