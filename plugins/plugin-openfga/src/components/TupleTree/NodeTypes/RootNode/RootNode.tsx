'use client';
import React from 'react';
import { Handle, Node, NodeProps, Position, useViewport } from '@xyflow/react';
import { RoleNodeData } from '../../types';
import { NODE_HEIGHT, NODE_WIDTH } from '../../reactFlowConfiguration';
import '@xyflow/react/dist/style.css';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  wrapper: {
    borderRadius: '100%',
    position: 'relative',
    backgroundColor: theme.palette.background.default,
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
    background: 'blue',
    position: 'absolute',
    top: '0',
    left: '0',
    borderRadius: '0',
    transform: 'none',
    border: 'none',
    opacity: '0',
  },
}));

const RootNodeComponent = ({ id, data }: NodeProps<Node<RoleNodeData>>) => {
  const { label } = data;
  const styles = useStyles();
  const { zoom } = useViewport();

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
          id={`top-${id}`}
          className={styles.customHandle}
          position={Position.Top}
          type="source"
          isConnectableStart={false}
          isConnectableEnd={false}
        />
        <Handle
          id={`right-${id}`}
          className={styles.customHandle}
          position={Position.Right}
          type="source"
          isConnectableStart={false}
          isConnectableEnd={false}
        />
        <Handle
          id={`bottom-${id}`}
          className={styles.customHandle}
          position={Position.Bottom}
          type="source"
          isConnectableStart={false}
          isConnectableEnd={false}
        />
        <Handle
          id={`left-${id}`}
          className={styles.customHandle}
          position={Position.Left}
          type="source"
          isConnectableStart={false}
          isConnectableEnd={false}
        />
      </div>
    </div>
  );
};

export const RootNode = React.memo(RootNodeComponent);
