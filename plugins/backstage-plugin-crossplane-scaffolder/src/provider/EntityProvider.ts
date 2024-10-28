import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { SchedulerServiceTaskRunner } from '@backstage/backend-plugin-api';
import { XrdDataProvider } from './XrdDataProvider';
import yaml from 'js-yaml';

export class XRDTemplateEntityProvider implements EntityProvider {
  private readonly taskRunner: SchedulerServiceTaskRunner;
  private templateDataProvider: XrdDataProvider;
  private connection?: EntityProviderConnection;

  constructor(
    taskRunner: SchedulerServiceTaskRunner,
    templateDataProvider: XrdDataProvider,
  ) {
    this.taskRunner = taskRunner;
    this.templateDataProvider = templateDataProvider;
  }

  getProviderName(): string {
    return 'XRDTemplateEntityProvider';
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Connection not initialized');
    }
    const xrdData = await this.templateDataProvider.fetchXRDObjects();
    const entities = xrdData.map(xrd => this.translateXRDToTemplate(xrd));

    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        entity,
        locationKey: `provider:${this.getProviderName()}`,
      })),
    });
  }

  private translateXRDToTemplate(xrd: any): Entity {
    if (!xrd?.metadata || !xrd?.spec) {
      throw new Error('Invalid XRD object');
    }

    const parameters = this.extractParameters(xrd.spec.versions);
    const steps = this.extractSteps(xrd.spec.versions);

    return {
      apiVersion: 'scaffolder.backstage.io/v1beta3',
      kind: 'Template',
      metadata: {
        name: xrd.metadata.name || 'example-xrd-template',
        title: `Template for ${xrd.metadata.name}`,
        description: `A template to create a ${xrd.spec.group} instance using ${xrd.metadata.name}`,
        annotations: {
          'backstage.io/managed-by-location': `cluster origin: ${xrd.clusterName}`,
          'backstage.io/managed-by-origin-location': `cluster origin: ${xrd.clusterName}`,
        },
      },
      spec: {
        type: 'object',
        parameters,
        steps,
      },
    };
  }

  private extractParameters(versions: any[]): any[] {
    return versions.flatMap(version =>
      version.schema?.openAPIV3Schema?.properties?.spec
        ? [version.schema.openAPIV3Schema.properties.spec]
        : [],
    );
  }

  private extractSteps(versions: any[]): any[] {
    return versions.flatMap(version => {
      const stepsYamlString =
        version.schema?.openAPIV3Schema?.properties?.steps?.default;
      if (!stepsYamlString) return [];

      const stepsYaml = stepsYamlString.substring(
        stepsYamlString.indexOf('|') + 1,
      );
      return yaml.load(stepsYaml) as any[];
    });
  }
}
