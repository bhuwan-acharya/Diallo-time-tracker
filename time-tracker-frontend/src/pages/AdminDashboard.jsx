import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  PaginationModule,
  TextFilterModule,
  DateFilterModule,
  NumberFilterModule,
  TooltipModule,
  SelectEditorModule,
  RenderApiModule,
  ValidationModule,
  ModuleRegistry,
} from 'ag-grid-community';
import { Button, Modal, Box, Typography } from '@mui/material';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';

// Register required AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelApiModule]);

function AdminDashboard() {
  const [workLogs, setWorkLogs] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // To differentiate between modals
  const [modalData, setModalData] = useState({ colDef: null, newValue: null, oldValue: null, params: null });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkLogs = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found. Redirecting to login.');
        navigate('/login');
        return;
      }

      try {
        const response = await API.get('/api/work-logs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkLogs(response.data);
      } catch (error) {
        console.error('Error fetching work logs:', error);
        if (error.response?.status === 401) {
          console.log('Unauthorized. Redirecting to login.');
          navigate('/login');
        }
      }
    };

    fetchWorkLogs();
  }, [navigate]);

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Return in ISO 8601 format
  };

  const formatTime = (time) => {
    if (!time) return '-';
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateWorkedHours = (startTime, finishTime) => {
    if (startTime && finishTime) {
      const start = new Date(startTime);
      const finish = new Date(finishTime);
      const diff = (finish - start) / (1000 * 60 * 60);
      return diff.toFixed(2);
    }
    return '-';
  };

  const calculateBreakMinutes = (breakStart, breakEnd) => {
    if (breakStart && breakEnd) {
      const start = new Date(breakStart);
      const end = new Date(breakEnd);
      const diff = (end - start) / (1000 * 60);
      return diff.toFixed(0);
    }
    return '-';
  };

  const calculateOvertime = (startTime, finishTime) => {
    const workedHours = calculateWorkedHours(startTime, finishTime);
    if (workedHours !== '-' && workedHours > 8) {
      const overtime = workedHours - 8;
      const hours = Math.floor(overtime);
      const minutes = Math.round((overtime - hours) * 60);
      return `${hours} Hr ${minutes} Min`;
    }
    return '0 Hr 0 Min';
  };

  const rowData = workLogs.map((log) => ({
    id: log.id,
    employeeId: log.employee_id || '-',
    date: formatDate(log.date), // Format the date in ISO 8601 format
    startTime: formatTime(log.start_time),
    breakStart: formatTime(log.break_start),
    breakEnd: formatTime(log.break_end),
    finishTime: formatTime(log.finish_time),
    workedHours: `${calculateWorkedHours(log.start_time, log.finish_time)} Hr`,
    breakMinutes: `${calculateBreakMinutes(log.break_start, log.break_end)} Min`,
    overtime: calculateOvertime(log.start_time, log.finish_time),
  }));

  const handleCellValueChange = async (params) => {
    const { data, colDef, newValue, oldValue } = params;

    console.log('Cell Value Change:', { field: colDef.field, newValue, oldValue });

    if (newValue === oldValue) {
      console.log('No changes detected. Skipping update.');
      return;
    }

    if (!newValue || !newValue.includes(':')) {
      toast.error('Invalid time format. Please select a valid time.');
      params.node.setDataValue(colDef.field, oldValue);
      return;
    }

    setModalData({ colDef, newValue, oldValue, params });
    setModalType('update'); // Set modal type to "update"
    setIsModalOpen(true);
  };

  const handleModalConfirm = async () => {
    if (modalType === 'update') {
      const { colDef, newValue, oldValue, params } = modalData;
      const { data } = params;

      const formattedTime = newValue;
      params.node.setDataValue(colDef.field, formattedTime);

      const isoTime = convertToISO(newValue);
      console.log('Converted Time to ISO:', isoTime);

      data[colDef.field] = isoTime;

      const updatedField = {
        [colDef.field === 'startTime' ? 'start_time' :
         colDef.field === 'breakStart' ? 'break_start' :
         colDef.field === 'breakEnd' ? 'break_end' :
         'finish_time']: isoTime,
      };

      try {
        const response = await API.put(`/api/work-logs/${data.id}`, updatedField);
        console.log('Backend Response:', response);
        toast.success('Update successful!');
      } catch (error) {
        console.error('Error updating work log:', error);
        toast.error('Failed to update work log.');
        params.node.setDataValue(colDef.field, oldValue);
      }

      // Refresh the page after update
      window.location.reload();
    } else if (modalType === 'download') {
      const dataToDownload = filteredRows.length > 0 ? filteredRows : rowData;

      const worksheet = XLSX.utils.json_to_sheet(dataToDownload);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Logs');
      XLSX.writeFile(workbook, 'work_logs.xlsx');
    }

    setIsModalOpen(false);
  };

  const handleDownload = () => {
    setModalType('download'); // Set modal type to "download"
    setIsModalOpen(true);
  };

  const convertToISO = (time) => {
    if (!time || !time.includes(':')) return null;

    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() - timezoneOffset);

    return adjustedDate.toISOString();
  };

  const generateTimeOptions = () => {
    const options = [];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Start at midnight (00:00)
  
    for (let i = 0; i < 96; i++) { // 96 slots for 15-minute intervals in a day
      const time = new Date(startOfDay.getTime() + i * 15 * 60 * 1000);
      options.push({
        label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        value: time.toISOString(),
      });
    }
  
    return options;
  };
  
  const timeOptions = generateTimeOptions();
  
  const columnDefs = [
    { headerName: 'Employee ID', field: 'employeeId', sortable: true, filter: 'agTextColumnFilter', editable: false },
    {
      headerName: 'Date',
      field: 'date',
      sortable: true,
      filter: 'agTextColumnFilter',
      editable: false,
      filterParams: {
        comparator: (filterDate, cellValue) => {
          if (!cellValue) return -1; // If no date, exclude it
          const cellDate = new Date(cellValue);
          if (cellDate.getTime() === filterDate.getTime()) {
            return 0; // Match
          }
          return cellDate < filterDate ? -1 : 1; // Compare dates
        },
      },
    },
    {
      headerName: 'Start Time',
      field: 'startTime',
      sortable: true,
      filter: 'agTextColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: timeOptions.map((option) => option.label) },
      tooltipField: 'startTime',
    },
    {
      headerName: 'Break Start',
      field: 'breakStart',
      sortable: true,
      filter: 'agTextColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: timeOptions.map((option) => option.label) },
      tooltipField: 'breakStart',
    },
    {
      headerName: 'Break End',
      field: 'breakEnd',
      sortable: true,
      filter: 'agTextColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: timeOptions.map((option) => option.label) },
      tooltipField: 'breakEnd',
    },
    {
      headerName: 'Finish Time',
      field: 'finishTime',
      sortable: true,
      filter: 'agTextColumnFilter',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: timeOptions.map((option) => option.label) },
      tooltipField: 'finishTime',
    },
    { headerName: 'Work Time', field: 'workedHours', sortable: true, filter: 'agNumberColumnFilter', editable: false },
    { headerName: 'Break', field: 'breakMinutes', sortable: true, filter: 'agNumberColumnFilter', editable: false },
    { headerName: 'Overtime', field: 'overtime', sortable: true, filter: 'agNumberColumnFilter', editable: false },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2 className="dashboard-title">Admin Dashboard</h2>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <Button variant="contained" color="primary" onClick={handleDownload}>
            Download Data
          </Button>
        </div>
        <div className="ag-theme-alpine" style={{ height: '70vh', width: '100%' }}>
          <AgGridReact
            modules={[
              ClientSideRowModelModule,
              PaginationModule,
              TextFilterModule,
              DateFilterModule,
              NumberFilterModule,
              TooltipModule,
              SelectEditorModule,
              RenderApiModule,
              ValidationModule, // Register ValidationModule
            ]}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
            pagination={true}
            paginationPageSize={20}
            onCellValueChanged={handleCellValueChange}
            onFilterChanged={(params) => {
              const filteredNodes = [];
              params.api.forEachNodeAfterFilter((node) => filteredNodes.push(node.data));
              setFilteredRows(filteredNodes);
              console.log('Filtered Rows:', filteredNodes); // Debugging to verify filtered rows
            }}
          />
        </div>
      </div>

      {/* Unified Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              marginBottom: 2,
            }}
          >
            {modalType === 'update' ? 'Confirm Update' : 'Confirm Download'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              marginBottom: 3,
            }}
          >
            {modalType === 'update'
              ? `Are you sure you want to update ${modalData.colDef?.headerName} to ${modalData.newValue}?`
              : filteredRows.length > 0
              ? `The filtered data (${filteredRows.length} rows) will be downloaded.`
              : 'No filters are applied. All data will be downloaded.'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleModalConfirm}
            >
              Confirm
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}

export default AdminDashboard;