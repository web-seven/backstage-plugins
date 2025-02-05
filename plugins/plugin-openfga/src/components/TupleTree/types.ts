import { Position } from '@xyflow/react';

export type ResourceNodeData = {
  label: string;
  position: Position;
  parentId: string;
};

export type RoleNodeData = {
  label: string;
  position: Position;
  allowed: boolean;
  parentId: string;
};

export type RootNode = {
  label: string;
};

export type TreeNode = {
  id: string;
  name: string;
  type: 'root' | 'role' | 'resource';
  children?: TreeNode[];
  allowed?: boolean;
};
