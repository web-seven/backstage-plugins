import { Config } from '@backstage/config';
import axios from 'axios';
import { LoggerService } from '@backstage/backend-plugin-api';
import { AuthService } from '@backstage/backend-plugin-api';

export async function collectPermissions(config: Config, logger: LoggerService, auth: AuthService): Promise<{ [name: string]: string[] }> {
  const urlsAndPlugins = permissionsPaths(config);
  const permissions: Array<any> = [];

  for (const { url, plugin } of urlsAndPlugins) {
    try {
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: await auth.getOwnServiceCredentials(),
        targetPluginId: plugin,
      });

      const result = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (result.data.permissions) {
        permissions.push(...result.data.permissions);
      } else {
        logger.error(`No permissions found for plugin: ${plugin}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.error(`URL not found for plugin: ${plugin}, URL: ${url}`);
      } else {
        logger.error(`Error fetching permissions for plugin: ${plugin}, URL: ${url}`);
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
  const paths = [];

  for (const plugin of pluginsList) {
    paths.push({
      url: `${baseurl}/api/${plugin}/.well-known/backstage/permissions/metadata`,
      plugin,
    });
  }

  return paths;
}



