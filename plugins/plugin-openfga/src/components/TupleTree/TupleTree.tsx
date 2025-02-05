import React, { useCallback, useEffect, useRef } from 'react';
import {
  Background,
  ReactFlow,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Node,
  Edge,
  Position,
} from '@xyflow/react';
import * as d3 from 'd3';

import '@xyflow/react/dist/style.css';
import { NODE_TYPES, NODE_WIDTH } from './reactFlowConfiguration';
import { TreeNode } from './types';
import { openFgaApiRef } from '../../api';
import {
  alertApiRef,
  useApi,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import { entityRouteRef } from '@backstage/plugin-catalog-react';

export const TupleTree = () => {
  const openfgaApi = useApi(openFgaApiRef);
  const alertApi = useApi(alertApiRef);

  const { kind: scope, name } = useRouteRefParams(entityRouteRef);

  const reactFlowRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const getPositionFromCoordinates = (x: number, y: number): Position => {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const normalizedAngle = (angle + 360) % 360;

    switch (true) {
      case normalizedAngle >= 315 || normalizedAngle < 45:
        return Position.Left;
      case normalizedAngle >= 45 && normalizedAngle < 135:
        return Position.Top;
      case normalizedAngle >= 135 && normalizedAngle < 225:
        return Position.Right;
      case normalizedAngle >= 225 && normalizedAngle < 315:
        return Position.Bottom;
      default:
        return Position.Bottom;
    }
  };

  const generateRadialTree = useCallback((data: TreeNode) => {
    if (!reactFlowRef.current) return { nodes: [], edges: [] };

    const width = reactFlowRef.current.clientWidth;
    const height = reactFlowRef.current.clientHeight;
    const radius = Math.min(width, height) / 2 - NODE_WIDTH;

    const tree = d3
      .tree<TreeNode>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    const root = tree(d3.hierarchy(data));

    const polarToCartesian = (angle: number, r: number) => ({
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    });

    const hierarchyNodes = root.descendants();
    const reactFlowNodes: Node[] = hierarchyNodes.map(node => {
      const { x, y } = polarToCartesian(node.x, node.y);
      const position = getPositionFromCoordinates(x, y);

      return {
        id: node.data.id,
        position: { x, y },
        data: {
          label: node.data.name,
          position,
          parentId: node.parent?.data?.id,
          allowed: node.data.allowed,
        },
        type: `${node.data.type}Node`,
        draggable: false,
      };
    });

    const getSourceHandle = (position: Position, sourceId: string) => {
      switch (position) {
        case Position.Top:
          return `bottom-${sourceId}`;
        case Position.Right:
          return `left-${sourceId}`;
        case Position.Bottom:
          return `top-${sourceId}`;
        case Position.Left:
        default:
          return `right-${sourceId}`;
      }
    };

    const hierarchyLinks = root.links();
    const reactFlowEdges: Edge[] = hierarchyLinks.map((link, index) => {
      const targetPosition = reactFlowNodes.find(
        node => node.id === link.target.data.id,
      )?.data?.position as Position;

      if (link.source.depth === 0) {
        return {
          id: `edge-${index}`,
          source: link.source.data.id,
          sourceHandle: getSourceHandle(targetPosition, link.source.data.id),
          target: link.target.data.id,
        };
      }
      return {
        id: `edge-${index}`,
        source: link.source.data.id,
        target: link.target.data.id,
      };
    });

    return { nodes: reactFlowNodes, edges: reactFlowEdges };
  }, []);

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await openfgaApi.getScopeRelations(scope, name);
        if (!res) return;

        const resources = res.resources.sort();

        const treeData: TreeNode = {
          id: '0',
          name: res.storeName,
          type: 'root',
          children: resources.map(resource => {
            const childrenResource: TreeNode = {
              id: resource,
              name: resource,
              type: 'resource',
            };

            const resourceRelations = Object.entries(
              res.relations[resource] || {},
            ).sort();

            if (resourceRelations.length) {
              childrenResource.children = resourceRelations.map(
                ([role, allowed]) => ({
                  id: resource + role,
                  name: role,
                  type: 'role',
                  allowed,
                }),
              );
            }

            return childrenResource;
          }),
        };

        const { nodes: generatedNodes, edges: generatedEdges } =
          generateRadialTree(treeData);

        setNodes(generatedNodes);
        setEdges(generatedEdges);
      } catch (error) {
        alertApi.post({
          message: 'Failed to get relations',
          severity: 'error',
        });
      }
    };

    getData();
  }, [
    openfgaApi,
    scope,
    name,
    alertApi,
    generateRadialTree,
    setEdges,
    setNodes,
  ]);

  const onNodeClick = async (node: Node) => {
    if (node.type !== 'roleNode') return;

    const parentId = node.data.parentId as string;
    const roleName = node.data.label as string;
    const allowed = !node.data.allowed;

    await openfgaApi.setScopeRelations(scope, name, {
      [parentId]: {
        [roleName]: allowed,
      },
    });

    setNodes(prevNodes =>
      prevNodes.map(n =>
        n.id === node.id ? { ...n, data: { ...n.data, allowed } } : n,
      ),
    );
  };

  return (
    <div ref={reactFlowRef} style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        fitView
        colorMode="dark"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        minZoom={0.2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        multiSelectionKeyCode={null}
        className="custom-editor"
        onNodeClick={async (_, node) => await onNodeClick(node)}
      >
        <Controls />
        <MiniMap position="bottom-right" />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};
