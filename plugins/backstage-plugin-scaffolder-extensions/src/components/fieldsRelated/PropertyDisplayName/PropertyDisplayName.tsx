import React, { useCallback } from 'react';
import { Box, makeStyles, Theme } from '@material-ui/core';

type PropertyDisplayNameProps = {
  optionLabel: string
}

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
  },
});

export const PropertyDisplayName = ( { optionLabel }: PropertyDisplayNameProps): JSX.Element => {


  const classes = useStyles();

  return (
    <Box component="span" className={classes.root}>
      {optionLabel}
    </Box>
  );
};
