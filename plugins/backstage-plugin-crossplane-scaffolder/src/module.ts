import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  catalogServiceRef,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';
import { XrdDataProvider } from './provider/XrdDataProvider';
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
        const frequencySeconds = config.getOptionalNumber(
          'crossplaneScaffolder.taskRunner.frequency.seconds',
        );
        const timeoutSeconds = config.getOptionalNumber(
          'crossplaneScaffolder.taskRunner.timeout.seconds',
        );

        const taskRunner = scheduler.createScheduledTaskRunner({
          frequency: { seconds: frequencySeconds },
          timeout: { seconds: timeoutSeconds },
        });

        const templateDataProvider = new XrdDataProvider(
          logger,
          config,
          catalogApi,
          discovery,
          permissions,
          auth,
          httpAuth,
        );

        const templateEntityProvider = new XRDTemplateEntityProvider(
          taskRunner,
          templateDataProvider,
        );

        await catalog.addEntityProvider(templateEntityProvider);
      },
    });
  },
});
