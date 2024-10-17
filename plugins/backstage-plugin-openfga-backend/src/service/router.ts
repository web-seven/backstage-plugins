import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import express from 'express';
import Router from 'express-promise-router';
import { OpenfgaRoutesService } from '../OpenfgaRoutesService';
import { RouterOptions } from '../types';

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;
  const router = Router();
  const service = new OpenfgaRoutesService({ logger, config });
  router.use(express.json());

  const baseUrl = config.getString('openfga.baseUrl').replace('/:base-url', '');

  router.get(baseUrl, service.getTupleGridData.bind(service));
  router.post(baseUrl, service.setRelations.bind(service));

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  return router;
}
