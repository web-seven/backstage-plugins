import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  catalogServiceRef,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';
import { XRDTemplateEntityProvider } from './provider/EntityProvider';

export const catalogModuleCrossplane = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'backstage-plugin-crossplane-scaffolder',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        catalogApi: catalogServiceRef,
        permissions: coreServices.permissions,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        scheduler: coreServices.scheduler,
      },
      async init({
        catalog,
        logger,
        config,
        catalogApi,
        permissions,
        discovery,
        httpAuth,
        auth,
        scheduler,
      }) {
        const taskRunner = scheduler.createScheduledTaskRunner({
          frequency: {
            seconds: config.getOptionalNumber(
              'crossplaneScaffolder.taskRunner.frequency',
            ),
          },
          timeout: {
            seconds: config.getOptionalNumber(
              'crossplaneScaffolder.taskRunner.timeout',
            ),
          },
        });

        const templateEntityProvider = new XRDTemplateEntityProvider(
          taskRunner,
          logger,
          config,
          catalogApi,
          discovery,
          permissions,
          auth,
          httpAuth,
        );

        await catalog.addEntityProvider(templateEntityProvider);
      },
    });
  },
});
