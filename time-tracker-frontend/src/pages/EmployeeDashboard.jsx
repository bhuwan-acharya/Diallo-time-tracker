import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ClientSideRowModelModule,
  PaginationModule,
  TextFilterModule,
  DateFilterModule,
  NumberFilterModule,
  ValidationModule,
  TooltipModule, // Register TooltipModule for tooltips
} from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import { useNavigate } from 'react-router-dom';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import API from '../services/api';

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  PaginationModule,
  TextFilterModule,
  DateFilterModule,
  NumberFilterModule,
  ValidationModule,
  TooltipModule, // Register TooltipModule
]);

function EmployeeDashboard() {
  const [workLogs, setWorkLogs] = useState([]);
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
        // Fetch work logs for the authenticated employee
        const response = await API.get('/api/employee/work-logs', {
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

  // Helper functions
  const formatTime = (datetime) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const calculateWorkedHours = (startTime, finishTime) => {
    if (startTime && finishTime) {
      const start = new Date(startTime);
      const finish = new Date(finishTime);
      const diff = (finish - start) / (1000 * 60 * 60); // Difference in hours
      return diff.toFixed(2);
    }
    return '-';
  };

  const calculateBreakMinutes = (breakStart, breakEnd) => {
    if (breakStart && breakEnd) {
      const start = new Date(breakStart);
      const end = new Date(breakEnd);
      const diff = (end - start) / (1000 * 60); // Difference in minutes
      return diff.toFixed(0);
    }
    return '-';
  };

  const calculateOvertime = (workedHours) => {
    if (workedHours !== '-' && workedHours > 8) {
      return (workedHours - 8).toFixed(2); // Overtime is the amount over 8 hours
    }
    return '0.00';
  };

  // Helper function to format dates
  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Return in ISO 8601 format
  };

  // Transform workLogs into rows for AG Grid
  const rowData = workLogs.map((log) => {
    const workedHours = calculateWorkedHours(log.start_time, log.finish_time);
    const breakMinutes = calculateBreakMinutes(log.break_start, log.break_end);
    const overtime = calculateOvertime(workedHours);

    return {
      date: formatDate(log.date), // Format the date in ISO 8601 format
      startTime: formatTime(log.start_time),
      breakStart: formatTime(log.break_start),
      breakEnd: formatTime(log.break_end),
      finishTime: formatTime(log.finish_time),
      workedHours: `${workedHours} Hr`,
      breakMinutes: `${breakMinutes} Min`,
      overtime: `${overtime} Hr`,
    };
  });

  // Define columns for AG Grid
  const columnDefs = [
    {
      headerName: 'Date',
      field: 'date',
      sortable: true,
      filter: 'agTextColumnFilter',
      tooltipField: 'date',
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
    { headerName: 'Start Time', field: 'startTime', sortable: true, filter: 'agTextColumnFilter', tooltipField: 'startTime' },
    { headerName: 'Break Start', field: 'breakStart', sortable: true, filter: 'agTextColumnFilter', tooltipField: 'breakStart' },
    { headerName: 'Break End', field: 'breakEnd', sortable: true, filter: 'agTextColumnFilter', tooltipField: 'breakEnd' },
    { headerName: 'Finish Time', field: 'finishTime', sortable: true, filter: 'agTextColumnFilter', tooltipField: 'finishTime' },
    { headerName: 'Work Time', field: 'workedHours', sortable: true, filter: 'agNumberColumnFilter', tooltipField: 'workedHours' },
    { headerName: 'Break', field: 'breakMinutes', sortable: true, filter: 'agNumberColumnFilter', tooltipField: 'breakMinutes' },
    { headerName: 'Overtime', field: 'overtime', sortable: true, filter: 'agNumberColumnFilter', tooltipField: 'overtime' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2 className="dashboard-title">Employee Dashboard</h2>
        {workLogs.length === 0 ? (
          <p>No work logs available.</p>
        ) : (
          <div className="ag-theme-alpine custom-grid-theme" style={{ height: '70vh', width: '100%' }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
              }}
              pagination={true}
              paginationPageSize={20} // Default page size
              paginationPageSizeOptions={[10, 20, 50]} // Allow users to select page sizes
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;