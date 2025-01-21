import { CredentialsMethod, OpenFgaClient, TypeDefinition } from '@openfga/sdk';
import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import { AuthService } from '@backstage/backend-plugin-api';
import { PermissionCollector } from '../permissions/PermissionCollector';

export class OpenFgaService {
  private openFgaClient: OpenFgaClient;
  private config: Config;
  private logger: LoggerService;
  private auth: AuthService;
  readonly user_type = 'group';
  /**
   * Constructor initializes the OpenFgaClient with API URL, store ID, and authorization token from config.
   * @param config - Backstage configuration object to retrieve OpenFGA connection details.
   */
  constructor(config: Config, logger: LoggerService, auth: AuthService) {
    this.config = config;
    this.logger = logger;
    this.auth = auth;
    const apiUrl = config.getString('openfga.host');
    const storeId = config.getString('openfga.storeId');
    const authorizationToken = config.getString('openfga.token');
    this.openFgaClient = new OpenFgaClient({
      apiUrl,
      storeId,
      credentials: {
        method: CredentialsMethod.ApiToken,
        config: {
          token: authorizationToken,
        },
      },
    });
  }

  /**
   * Creates or updates the authorization model by comparing the new model with the existing one.
   * @returns The updated authorization model from OpenFGA.
   */
  public async createAuthorizationModel() {
    const permissionCollector = new PermissionCollector(
      this.config,
      this.logger,
      this.auth,
    );
    const model = await permissionCollector.collectPermissions();

    const oldModel = await this.readModel();

    if (
      oldModel &&
      (oldModel.authorization_model?.type_definitions ?? []).length > 0
    ) {
      const types = oldModel.authorization_model?.type_definitions ?? [];

      for (const data in model) {
        if (model.hasOwnProperty(data)) {
          const type = this.findType(types, data);
          if (type) {
            this.updateTypeWithNewRelations(type, model[data]);
            this.removeOldRelations(type, model[data]);
          } else {
            const newType = this.generateCombinedActionTypes(data, model[data]);
            types.push(newType);
          }
        }
      }

      if (oldModel.authorization_model) {
        oldModel.authorization_model.type_definitions = types;
      }

      if (oldModel.authorization_model) {
        return await this.openFgaClient.writeAuthorizationModel(
          oldModel.authorization_model,
        );
      }
      throw new Error('Authorization model is undefined');
    }
    return this.createNewModel(model);
  }

  /**
   * Finds a type definition by its name within the existing types.
   * @param types - Array of type definitions to search in.
   * @param typeName - Name of the type to find.
   * @returns The matching type definition or undefined if not found.
   */
  private findType(types: any[], typeName: string) {
    return types.find(type => type.type === typeName);
  }

  /**
   * Updates an existing type with new actions/relations.
   * @param type - The type definition to update.
   * @param newActions - Array of new actions to be added to the type.
   */
  private updateTypeWithNewRelations(type: any, newActions: string[]) {
    const relations = type.relations ?? {};
    const metadataRelations = type.metadata?.relations ?? {};

    newActions.forEach(action => {
      if (!relations[action]) {
        relations[action] = { this: {} };
        metadataRelations[action] = this.generateMetadataRelation();
      }
    });
  }

  /**
   * Removes old actions/relations from a type if they are not present in the new model.
   * @param type - The type definition to clean up.
   * @param newActions - Array of new actions to retain in the type.
   */
  private removeOldRelations(type: any, newActions: string[]) {
    const existingActions = Object.keys(type.relations ?? {});

    existingActions.forEach(action => {
      if (!newActions.includes(action)) {
        delete type.relations[action];
        delete type.metadata.relations[action];
      }
    });
  }

  /**
   * Reads the latest authorization model from OpenFGA.
   * @returns The latest authorization model from OpenFGA or undefined if none exists.
   */
  private async readModel() {
    const options = { retryParams: { maxRetry: 3 } };
    return await this.openFgaClient.readLatestAuthorizationModel(options);
  }

  /**
   * Creates a completely new authorization model with the provided data.
   * @param model - New model data with types and actions.
   * @returns The newly created authorization model from OpenFGA.
   */
  private async createNewModel(model: any) {
    const newModel: {
      schema_version: string;
      type_definitions: TypeDefinition[];
    } = {
      schema_version: '1.1',
      type_definitions: [],
    };

    for (const data in model) {
      if (model.hasOwnProperty(data)) {
        const newType = this.generateCombinedActionTypes(data, model[data]);
        newModel.type_definitions.push(newType);
      }
    }

    newModel.type_definitions.push({
      type: this.user_type,
      relations: {},
      metadata: undefined,
    });

    return await this.openFgaClient.writeAuthorizationModel(newModel);
  }

  /**
   * Generates a new type definition combining the provided type and actions.
   * @param typeName - The name of the type.
   * @param typeActions - Array of actions associated with the type.
   * @returns A new TypeDefinition object containing the type, relations, and metadata.
   */
  private generateCombinedActionTypes(
    typeName: string,
    typeActions: string[],
  ): TypeDefinition {
    const relations: Record<string, object> = {};
    const metadataRelations: Record<string, object> = {};

    typeActions.forEach(action => {
      relations[action] = { this: {} };
      metadataRelations[action] = this.generateMetadataRelation();
    });

    return {
      type: typeName,
      relations,
      metadata: {
        relations: metadataRelations,
        module: '',
        source_info: undefined,
      },
    };
  }

  /**
   * Generates a default metadata relation object for actions.
   * @returns A metadata object defining the relationship to a "group".
   */
  private generateMetadataRelation() {
    return {
      directly_related_user_types: [
        {
          type: this.user_type,
          condition: '',
        },
      ],
      module: '',
      source_info: null,
    };
  }

  public async checkPermission(user: string, relation: string, object: string) {
    return this.openFgaClient.check({ user, relation, object });
  }

}
