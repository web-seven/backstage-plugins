import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';

import { KubernetesBuilder } from '@backstage/plugin-kubernetes-backend';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';


export const catalogModuleCrossplane = createBackendModule({
  pluginId: 'kubernetes',
  moduleId: 'crossplane',
  register(reg) {
    reg.registerInit({
      deps: {
        http: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        catalogApi: catalogServiceRef,
        permissions: coreServices.permissions,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
      },
      async init({
        logger, 
        config, 
        catalogApi, 
        permissions, 
        discovery, 
        httpAuth, 
        auth, 
      }) {
        const builder: KubernetesBuilder = KubernetesBuilder.createBuilder({
          logger,
          config,
          catalogApi,
          permissions,
          discovery,
          auth,
          httpAuth,
        })

        const { fetcher, clusterSupplier } = await builder.build();
        let clusters = await clusterSupplier.getClusters({
          credentials: await auth.getNoneCredentials()
        })
        console.log(clusters)
        // fetcher.fetchObjectsForService({
        //   serviceId: 'some-service',
        //   clusterDetails: {
        //     name: 'cluster1',
        //     url: 'http://localhost:9999',
        //     authMetadata: {},
        //   },
        //   credential: { type: 'bearer token', token: 'token' },
        //   objectTypesToFetch: OBJECTS_TO_FETCH,
        //   labelSelector: '',
        //   customResources: [],
        // })
      },
    });
  },
});
