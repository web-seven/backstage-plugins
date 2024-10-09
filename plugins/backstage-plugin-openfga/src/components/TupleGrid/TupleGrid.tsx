import React, { useEffect, useState } from 'react';
import {
  DataGrid,
  GridCellEditCommitParams,
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
import { TupleGridData } from '@web-seven/backstage-plugin-openfga-common';
import { openFgaApiRef } from '../../api';

const useStyles = makeStyles(theme => ({
  backButton: {
    marginTop: theme.spacing(2),
    float: 'right',
  },
}));

export const TupleGrid = (): JSX.Element => {
  const styles = useStyles();
  const { kind, name } = useRouteRefParams(entityRouteRef);
  const scope = `${kind}:${name}`;
  const openFgaApi = useApi(openFgaApiRef);
  const [data, setData] = useState<TupleGridData>({
    resources: [],
    roles: [],
    relations: {},
  });
  const alertApi = useApi(alertApiRef);

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
      openFgaApi
        .getScopeRelations(scope)
        .then(res => {
          if (!res) {
            return;
          }
          setData(res);

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
            const rowRelations: JsonObject = Object.entries(
              relations,
            ).reduce((acc: JsonObject, [resource, roles]) => {
              acc[resource] = {};
              roles.forEach(role => {
                (acc[resource] as JsonObject)[role] = true;
              });
              return acc;
            }, {});

            const newRows = resources.map(resource => ({
              id: resource,
              resource: resource,
              ...rowRelations[resource] as JsonObject,
            }));
            setRows(newRows);
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
  }, [openFgaApi, scope, alertApi]);

  const handleCellEditCommit = (params: GridCellEditCommitParams) => {
    const { id, field, value } = params;

    setRows(prevRows =>
      prevRows.map(row =>
        row.id === id
          ? { ...row, [field]: value as boolean }
          : row
      )
    );
  
    setData(prevData => {
      const newRelations = { ...prevData.relations };
  
      if (value) {
        if (!newRelations[id]) {
          newRelations[id] = [];
        }
        if (!newRelations[id].includes(field)) {
          newRelations[id].push(field);
        }
      } else {
        if (newRelations[id]) {
          newRelations[id] = newRelations[id].filter(
            (role: string) => role !== field,
          );
        }
      }
  
      return {
        ...prevData,
        relations: newRelations,
      };
    });
  
    setDisableButton(false);
  };

  const handleGetAllData = () => {
    openFgaApi.setScopeRelations(scope, data.relations);
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
        />
        <Button
          onClick={handleGetAllData}
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
