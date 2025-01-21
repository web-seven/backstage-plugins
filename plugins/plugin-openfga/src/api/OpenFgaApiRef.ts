import { createApiRef } from '@backstage/core-plugin-api';
import { OpenFgaApi } from '../types';

/** @public */
export const openFgaApiRef = createApiRef<OpenFgaApi>({
  id: 'plugin.openfga',
});
