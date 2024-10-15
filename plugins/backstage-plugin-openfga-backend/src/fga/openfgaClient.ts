import { OpenFgaClient, TypeDefinition } from '@openfga/sdk';
import { Config } from '@backstage/config';

function getOpenFgaClient(config: Config) {
    return new OpenFgaClient({
        apiUrl: config.getOptionalString('openfga.auth.apiUrl') ?? '',
        storeId: config.getOptionalString('openfga.auth.storeId') ?? '',
        authorizationModelId: config.getOptionalString('openfga.auth.authorizationModelId') ?? '',
    });
}

export const createAuthorizationModel = async (model: any, config: Config) => {
    const openFgaClient = getOpenFgaClient(config);
    const oldModel = await readModel(openFgaClient);

    if (oldModel && (oldModel.authorization_model?.type_definitions ?? []).length > 0) {
        const types = oldModel.authorization_model?.type_definitions ?? [];

        for (const data in model) {
            let type = findType(types, data);
            if (type) {
                updateTypeWithNewRelations(type, model[data]);
                removeOldRelations(type, model[data]);  // Remove actions not in the new schema
            } else {
                const newType = generateCombinedActionTypes(data, model[data]);
                types.push(newType);
            }
        }

        if (oldModel.authorization_model) {
            oldModel.authorization_model.type_definitions = types;
        }
        if (oldModel.authorization_model) {
            return await openFgaClient.writeAuthorizationModel(oldModel.authorization_model);
        } else {
            throw new Error('Authorization model is undefined');
        }
    } else {
        return createNewModel(model, openFgaClient);
    }
};

function findType(types: any[], typeName: string) {
    return types.find(type => type.type === typeName);
}

function updateTypeWithNewRelations(type: any, newActions: string[]) {
    const relations = type.relations ?? {};
    const metadataRelations = type.metadata?.relations ?? {};
    
    newActions.forEach(action => {
        if (!relations[action]) {
            relations[action] = { "this": {} };
            metadataRelations[action] = generateMetadataRelation();
        }
    });
}

function removeOldRelations(type: any, newActions: string[]) {
    const existingActions = Object.keys(type.relations ?? {});
    
    existingActions.forEach(action => {
        if (!newActions.includes(action)) {
            delete type.relations[action];
            delete type.metadata.relations[action];
        }
    });
}

async function readModel(openFgaClient: OpenFgaClient) {
    const options = { retryParams: { maxRetry: 3 } };
    return await openFgaClient.readLatestAuthorizationModel(options);
}

async function createNewModel(model: any, openFgaClient: OpenFgaClient) {
    const newModel: { schema_version: string; type_definitions: TypeDefinition[] } = {
        schema_version: '1.1',
        type_definitions: [],
    };

    for (const data in model) {
        const newType = generateCombinedActionTypes(data, model[data]);
        newModel.type_definitions.push(newType);
    }

    newModel.type_definitions.push({
        type: "userGroup",
        relations: {},
        metadata: undefined
    });

    return await openFgaClient.writeAuthorizationModel(newModel);
}

function generateCombinedActionTypes(typeName: string, typeActions: string[]): TypeDefinition {
    const relations: Record<string, object> = {};
    const metadataRelations: Record<string, object> = {};

    typeActions.forEach(action => {
        relations[action] = { "this": {} };
        metadataRelations[action] = generateMetadataRelation();
    });

    return {
        type: typeName,
        relations,
        metadata: {
            relations: metadataRelations,
            module: "",
            source_info: undefined
        }
    };
}

function generateMetadataRelation() {
    return {
        "directly_related_user_types": [
            {
                "type": "userGroup",
                "condition": ""
            }
        ],
        "module": "",
        "source_info": null
    };
}