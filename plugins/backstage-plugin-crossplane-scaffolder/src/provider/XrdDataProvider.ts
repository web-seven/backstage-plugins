import {
  KubernetesBuilder,
  KubernetesObjectTypes,
} from '@backstage/plugin-kubernetes-backend';
import { CatalogApi } from '@backstage/catalog-client';
import { PermissionEvaluator } from '@backstage/plugin-permission-common';
import { Config } from '@backstage/config';
import {
  LoggerService,
  DiscoveryService,
  HttpAuthService,
  AuthService,
} from '@backstage/backend-plugin-api';

export class XrdDataProvider {
  logger: LoggerService;
  config: Config;
  catalogApi: CatalogApi;
  permissions: PermissionEvaluator;
  discovery: DiscoveryService;
  auth: AuthService;
  httpAuth: HttpAuthService;

  constructor(
    logger: LoggerService,
    config: Config,
    catalogApi: CatalogApi,
    discovery: DiscoveryService,
    permissions: PermissionEvaluator,
    auth: AuthService,
    httpAuth: HttpAuthService,
  ) {
    this.logger = logger;
    this.config = config;
    this.catalogApi = catalogApi;
    this.permissions = permissions;
    this.discovery = discovery;
    this.auth = auth;
    this.httpAuth = httpAuth;
  }

  async fetchXRDObjects(): Promise<any[]> {
    try {
      const builder: KubernetesBuilder = KubernetesBuilder.createBuilder({
        logger: this.logger,
        config: this.config,
        catalogApi: this.catalogApi,
        permissions: this.permissions,
        discovery: this.discovery,
        httpAuth: this.httpAuth,
        auth: this.auth,
      });

      const { fetcher, clusterSupplier } = await builder.build();
      const clusters = await clusterSupplier.getClusters({
        credentials: await this.auth.getNoneCredentials(),
      });

      if (clusters.length === 0) {
        this.logger.warn('No clusters found.');
        return [];
      }

      const objectType: KubernetesObjectTypes = 'customresources';
      const group = 'apiextensions.crossplane.io';
      const apiVersion = 'v1';
      const plural = 'compositeresourcedefinitions';

      const objectDef = {
        objectType,
        group,
        apiVersion,
        plural,
      };

      const objectTypesToFetch = new Set([objectDef]);

      let allFetchedObjects: any[] = [];

      for (const cluster of clusters) {
        const token = cluster.authMetadata.serviceAccountToken;

        const kobjects = await fetcher.fetchObjectsForService({
          serviceId: 'xrdServiseId',
          clusterDetails: cluster,
          credential: { type: 'bearer token', token: token },
          objectTypesToFetch,
          labelSelector: '',
          customResources: [],
        });

        const fetchedResources = kobjects.responses.flatMap(response =>
          response.resources.map(resource => ({
            ...resource,
            clusterName: cluster.name,
          })),
        );
        allFetchedObjects = allFetchedObjects.concat(fetchedResources);

        this.logger.info(
          `Fetched ${fetchedResources.length} objects from cluster: ${cluster.name}`,
        );
      }

      this.logger.info(`Total fetched objects: ${allFetchedObjects.length}`);

      return allFetchedObjects;
    } catch (error) {
      this.logger.error('Error fetching XRD objects');
      throw error;
    }
  }
}
