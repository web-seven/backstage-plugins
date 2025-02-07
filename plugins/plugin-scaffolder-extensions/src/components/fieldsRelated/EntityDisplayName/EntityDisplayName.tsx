import { CompoundEntityRef, Entity } from '@backstage/catalog-model';
import Box from '@material-ui/core/Box';
import Tooltip from '@material-ui/core/Tooltip';
import { Theme, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useEntityPresentation } from '@backstage/plugin-catalog-react';

/**
 * The available style class keys for {@link EntityDisplayName}, under the name
 * "CatalogReactEntityDisplayName".
 *
 * @public
 */
export type CatalogReactEntityDisplayNameClassKey = 'root' | 'icon';

const useStyles = makeStyles(
  (theme: Theme) => ({
    root: {
      display: 'inline-flex',
      alignItems: 'center',
    },
    icon: {
      marginRight: theme.spacing(0.5),
      color: theme.palette.text.secondary,
      '& svg': {
        verticalAlign: 'middle',
      },
    },
  }),
  { name: 'CatalogReactEntityDisplayName' },
);

/**
 * Props for {@link EntityDisplayName}.
 *
 * @public
 */
export type EntityDisplayNameProps = {
  entityRef: Entity | CompoundEntityRef | string;
  hideIcon?: boolean;
  disableTooltip?: boolean;
  defaultKind?: string;
  defaultNamespace?: string;
  labelVariant?: string;
};

/**
 * Shows a nice representation of a reference to an entity.
 *
 * @public
 */
export const EntityDisplayName = (
  props: EntityDisplayNameProps,
): JSX.Element => {
  const {
    entityRef,
    hideIcon,
    disableTooltip,
    defaultKind,
    defaultNamespace,
    labelVariant = 'primaryTitle',
  } = props;

  const classes = useStyles();
  const entityPresentation = useEntityPresentation(entityRef, {
    defaultKind,
    defaultNamespace,
  });

  const contentTitle =
    entityPresentation?.[labelVariant as keyof typeof entityPresentation];

  const title = typeof contentTitle === 'string' ? contentTitle : '';

  let content = <>{title}</>;

  content = (
    <Box component="span" className={classes.root}>
      {entityPresentation.Icon && !hideIcon ? (
        <Box component="span" className={classes.icon}>
          <entityPresentation.Icon fontSize="inherit" />
        </Box>
      ) : null}
      {content}
    </Box>
  );

  if (entityPresentation.secondaryTitle && !disableTooltip) {
    content = (
      <Tooltip enterDelay={1500} title={entityPresentation.secondaryTitle}>
        {content}
      </Tooltip>
    );
  }

  return content;
};
