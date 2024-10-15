import { Config } from '@backstage/config';
import axios from 'axios';
import { LoggerService  } from '@backstage/backend-plugin-api';

export async function collectPermissions(config: Config, logger: LoggerService): Promise<{ [name: string]: string[] }> {
  const urls = permissionsPaths(config);
  const permissions: Array<any> = [];

  for (const url of urls) {
    try {
      const result = await axios.get(url);
      if (result.data.permissions) {
        permissions.push(...result.data.permissions);
      } else {
        logger.error('No permissions found');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.error(`URL not found: ${url}`);
      } else {
        logger.error(`Error fetching permissions from ${url}`);
      }
    }
  }

  if (permissions.length > 0) {
    const permissionData = changeArrayStructure(permissions, logger);
    return permissionData;
  } else {
    return {};
  }
}

function changeArrayStructure<T extends { name: string}>(permissions: Array<T>, logger: LoggerService): { [name: string]: string[] } {
  const permissionMap: { [name: string]: string[] } = {};

  permissions.forEach((permission: any) => {
    if (permission.name) {
      const parts = permission.name.split('.');
      const action = parts.pop();
      const name = parts.join('.');

      if (action) {
        if (!permissionMap[name]) {
          permissionMap[name] = []; 
        }
        permissionMap[name].push(action);
      } else {
        logger.error('Permission action is undefined for:', permission);
            }
          } else {
            logger.error('Permission name is undefined:', permission);
    }
  });

  return permissionMap;
}

function permissionsPaths(config: Config) {
  const baseurl = config.getOptionalString('backend.baseUrl') ?? '';
  const pluginsList = config.getOptionalStringArray('openfga.plugins') ?? [];
  let paths = [];
  for (let plugin of pluginsList) {
    paths.push(`${baseurl}/api/${plugin}/.well-known/backstage/permissions/metadata`);
  }
  return paths;
}



