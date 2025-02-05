'use client';
import React from 'react';
import { Handle, Node, NodeProps, useViewport } from '@xyflow/react';
import { ResourceNodeData } from '../../types';
import { NODE_HEIGHT, NODE_WIDTH } from '../../reactFlowConfiguration';
import '@xyflow/react/dist/style.css';
import { makeStyles } from '@material-ui/core';
import { getOppositePosition } from '../../utils';

const useStyles = makeStyles(() => ({
  wrapper: {
    borderRadius: '100%',
    position: 'relative',
    backgroundColor: '#908bff',
  },
  title: {
    fontSize: '12px',
    position: 'absolute',
    bottom: '-25px',
    left: '50%',
  },
  customHandle: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: '0',
    left: '0',
    borderRadius: '0',
    transform: 'none',
    border: 'none',
    opacity: '0',
  },
}));

const ResourceNodeComponent = ({ data }: NodeProps<Node<ResourceNodeData>>) => {
  const { label, position } = data;
  const styles = useStyles();
  const { zoom } = useViewport();

  const sourcePosition = getOppositePosition(position);
  const targetPosition = position;

  return (
    <div
      className={styles.wrapper}
      style={{ minHeight: NODE_HEIGHT, minWidth: NODE_WIDTH }}
    >
      <div className="inner">
        <div className="body">
          <div
            className={styles.title}
            style={{ transform: `translateX(-50%) scale(${1 / zoom})` }}
          >
            {label}
          </div>
        </div>
        <Handle
          className={styles.customHandle}
          position={sourcePosition}
          type="source"
          isConnectableStart={false}
          isConnectableEnd={false}
        />
        <Handle
          className={styles.customHandle}
          position={targetPosition}
          type="target"
          isConnectableStart={false}
          isConnectableEnd={false}
        />
      </div>
    </div>
  );
};

export const ResourceNode = React.memo(ResourceNodeComponent);
