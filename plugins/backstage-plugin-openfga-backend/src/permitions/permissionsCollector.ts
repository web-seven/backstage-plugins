import { Config } from '@backstage/config';
import axios from 'axios';

export async function collectPermissions(config: Config): Promise<{ [name: string]: string[] }> {
  const urls = permitionsPaths(config);
  const permissions: Array<any> = [];

  for (const url of urls) {
    try {
      const result = await axios.get(url);
      if (result.data.permissions) {
        permissions.push(...result.data.permissions);
      } else {
        console.log('No permissions found at:', url);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`URL not found: ${url}`);
      } else {
        console.error(`Error fetching permissions from ${url}:`, error);
      }
    }
  }

  if (permissions.length > 0) {
    const permissionData = changeArrayStructure(permissions);
    return permissionData;
  } else {
    return {};
  }
}

function changeArrayStructure<T extends { name: string }>(permissions: Array<T>): { [name: string]: string[] } {
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
        console.warn('Permission action is undefined for:', permission);
      }
    } else {
      console.warn('Permission name is undefined:', permission);
    }
  });

  return permissionMap;
}

function permitionsPaths(config: Config) {
  const baseurl = config.getOptionalString('backend.baseUrl') ?? '';
  const pluginsList = config.getOptionalStringArray('openfga.plugins') ?? [];
  let paths = [];
  for (let plugin of pluginsList) {
    paths.push(`${baseurl}/api/${plugin}/.well-known/backstage/permissions/metadata`);
  }
  return paths;
}



