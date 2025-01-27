import React, { useEffect, useState } from 'react';
import {
  DataGrid,
  GridCellEditCommitParams,
  GridCellParams,
  GridColDef,
  GridToolbarContainer,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import { JsonObject } from '@backstage/types';
import { Button, makeStyles } from '@material-ui/core';
import { entityRouteRef } from '@backstage/plugin-catalog-react';
import {
  alertApiRef,
  useApi,
  useRouteRefParams,
} from '@backstage/core-plugin-api';
import { Relations } from '@web-seven/backstage-plugin-openfga-backend';
import { openFgaApiRef } from '../../api';

const useStyles = makeStyles(theme => ({
  backButton: {
    marginTop: theme.spacing(2),
    float: 'right',
  },
  disabledCell: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    cursor: 'not-allowed',
  },
}));

export const TupleGrid = (): JSX.Element => {
  const styles = useStyles();
  const { kind: scope, name } = useRouteRefParams(entityRouteRef);
  const openfgaApi = useApi(openFgaApiRef);
  const alertApi = useApi(alertApiRef);
  const [initialRelations, setInitialRelations] = useState<Relations>({});
  const [changedRelations, setChangedRelations] = useState<Relations>({});

  const [columns, setColumns] = useState<GridColDef[]>([
    {
      type: 'string',
      headerName: 'resource',
      field: 'resource',
      editable: false,
      width: 150,
    },
  ]);
  const [rows, setRows] = useState<JsonObject[]>([]);
  const [disableButton, setDisableButton] = useState<boolean>(true);

  useEffect(() => {
    const getData = async () => {
      openfgaApi
        .getScopeRelations(scope, name)
        .then(res => {
          if (!res) {
            return;
          }

          const roles = res.roles;
          if (Array.isArray(roles)) {
            const newColumns = roles.map(role => ({
              type: 'boolean',
              field: role,
              headerName: role,
              editable: true,
              width: 150,
            }));
            setColumns(prevColumns => [...prevColumns, ...newColumns]);
          }
          const resources = res.resources;
          const relations = res.relations;
          if (Array.isArray(resources)) {
            const newRows = resources.map(resource => ({
              id: resource,
              resource: resource,
              ...(relations[resource] || {}),
            }));
            setRows(newRows);
            setInitialRelations(relations);
          }
        })
        .catch(() => {
          alertApi.post({
            message: 'Failed to get relations',
            severity: 'error',
          });
        });
    };

    getData();
  }, [openfgaApi, scope, name, alertApi]);

  const handleCellEditCommit = (params: GridCellEditCommitParams) => {
    const { id, field, value } = params;

    setRows(prevRows =>
      prevRows.map(row =>
        row.id === id ? { ...row, [field]: value as boolean } : row,
      ),
    );

    setChangedRelations(prevChangedRelations => {
      const newChangedRelations = { ...prevChangedRelations };

      const initialValue = initialRelations[id]?.[field];
      if (initialValue !== value) {
        if (!newChangedRelations[id]) {
          newChangedRelations[id] = {};
        }
        newChangedRelations[id][field] = value as boolean;
      } else if (newChangedRelations[id]) {
        delete newChangedRelations[id][field];
        if (Object.keys(newChangedRelations[id]).length === 0) {
          delete newChangedRelations[id];
        }
      }

      return newChangedRelations;
    });

    setDisableButton(false);
  };

  const handleSetScopeRelations = async () => {
    await openfgaApi.setScopeRelations(scope, name, changedRelations);

    setInitialRelations(prevInitialRelations => {
      const newInitialRelations = { ...prevInitialRelations };

      Object.entries(changedRelations).forEach(([resource, relations]) => {
        if (!newInitialRelations[resource]) {
          newInitialRelations[resource] = {};
        }

        Object.entries(relations).forEach(([relation, value]) => {
          newInitialRelations[resource][relation] = value;
        });
      });

      return newInitialRelations;
    });

    setChangedRelations({});
    setDisableButton(true);
  };

  const handleCellClick = (params: GridCellParams) => {
    if (!params.row.hasOwnProperty(params.field)) {
      alertApi.post({
        message: `${params.field} ${params.row.resource} is not allowed for ${name} ${scope}`,
        severity: 'info',
      });
    }
  };

  function CustomToolbar(props: any) {
    return (
      <GridToolbarContainer>
        <GridToolbarFilterButton {...props} />
      </GridToolbarContainer>
    );
  }

  return (
    <>
      <div style={{ height: '70vh', width: 'auto' }}>
        <DataGrid
          columns={columns}
          rows={rows}
          components={{ Toolbar: CustomToolbar }}
          onCellEditCommit={handleCellEditCommit}
          isCellEditable={params => {
            return params.row.hasOwnProperty(params.field);
          }}
          getCellClassName={params => {
            return !params.row.hasOwnProperty(params.field)
              ? styles.disabledCell
              : '';
          }}
          onCellClick={handleCellClick}
        />
        <Button
          onClick={handleSetScopeRelations}
          variant="contained"
          color="primary"
          className={styles.backButton}
          disabled={disableButton}
        >
          Save
        </Button>
      </div>
    </>
  );
};
