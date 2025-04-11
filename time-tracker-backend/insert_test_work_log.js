import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function insertWorkLogs() {
  // Create a connection using environment variables
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const employees = [
    { id: 1, logs: 10 },
    { id: 2, logs: 5 },
    { id: 3, logs: 0 }, // No logs for this employee
    { id: 4, logs: 10 },
    { id: 5, logs: 7},
    { id: 6, logs: 3 },
    { id: 7, logs: 10 },
    { id: 8, logs: 6 },
    { id: 9, logs: 4 },
  ];

  for (const employee of employees) {
    for (let i = 0; i < employee.logs; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 10)); // Random date within the last 10 days

      // Generate random times for the work log
      const startTime = new Date(date);
      startTime.setHours(8, Math.floor(Math.random() * 60), 0); // Random start time between 8:00 and 8:59

      const breakStart = new Date(date);
      breakStart.setHours(12, Math.floor(Math.random() * 30), 0); // Random break start between 12:00 and 12:29

      const breakEnd = new Date(date);
      breakEnd.setHours(12, 30 + Math.floor(Math.random() * 30), 0); // Random break end between 12:30 and 12:59

      const finishTime = new Date(date);
      finishTime.setHours(17, Math.floor(Math.random() * 60), 0); // Random finish time between 17:00 and 17:59

      const description = `Work log for employee ${employee.id}`;

      await connection.execute(
        'INSERT INTO work_logs (employee_id, date, start_time, break_start, break_end, finish_time, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          employee.id,
          date.toISOString().split('T')[0], // Format as YYYY-MM-DD for the date field
          startTime.toISOString().slice(0, 19).replace('T', ' '), // Format as DATETIME
          breakStart.toISOString().slice(0, 19).replace('T', ' '), // Format as DATETIME
          breakEnd.toISOString().slice(0, 19).replace('T', ' '), // Format as DATETIME
          finishTime.toISOString().slice(0, 19).replace('T', ' '), // Format as DATETIME
          description,
        ]
      );
    }
  }

  console.log('Work logs inserted successfully.');
  await connection.end();
}

insertWorkLogs();