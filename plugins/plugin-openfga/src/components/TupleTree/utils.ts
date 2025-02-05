import { Position } from '@xyflow/react';

export const getOppositePosition = (position: Position): Position => {
  switch (position) {
    case Position.Top:
      return Position.Bottom;
    case Position.Bottom:
      return Position.Top;
    case Position.Left:
      return Position.Right;
    case Position.Right:
      return Position.Left;
    default:
      return Position.Bottom;
  }
};
