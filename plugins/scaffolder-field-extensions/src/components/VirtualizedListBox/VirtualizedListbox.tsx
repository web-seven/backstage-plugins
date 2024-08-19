import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

const ITEM_SIZE = 36;
const MAX_ITEMS_TO_SHOW = 10;

const renderRow = ({ data, index, style }: ListChildComponentProps) => {
  return React.cloneElement(data[index], { style });
};

export const VirtualizedListbox = React.forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode }
>((props, ref) => {
  const itemData = React.Children.toArray(props.children);
  const itemCount = itemData.length;

  const itemsToShow = Math.min(MAX_ITEMS_TO_SHOW, itemCount);
  const height =
    itemsToShow * ITEM_SIZE -
    (itemCount > MAX_ITEMS_TO_SHOW ? 0.5 * ITEM_SIZE : 0);

  return (
    <div ref={ref}>
      <FixedSizeList
        height={height}
        itemData={itemData}
        itemCount={itemCount}
        itemSize={ITEM_SIZE}
        width="100%"
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
});
