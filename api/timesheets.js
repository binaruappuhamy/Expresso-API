const express = require('express');
const timesheetRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || '/database.sqlite');


timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const query = 'SELECT * FROM Timesheet WHERE id = $timesheetId';
  const params = { $timesheetId: timesheetId }
  
  db.get(query, params, (err, row) => {
    if (err) {next(err);}
    else if (row) {
      req.timesheet = row;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});


//GET ALL TIMESHEETS FOR EMPLOYEE
timesheetRouter.get('/', (req, res, next) => {
  const query = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const params = { $employeeId: req.params.employeeId};
  
  db.all(query, params, (err,rows) => {
    if(err) {next(err);}
    else { res.status(200).json({timesheets: rows});}
  });
  
});

// CREATE NEW TIMESHEET
timesheetRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  const employeeId = req.params.employeeId;
  
  if(!hours || !rate || !date || !employeeId) {
    return res.sendStatus(400);
  }
  
  const query = "INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)";
  const params = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $employeeId: employeeId
  };
  
  db.run(query, params, function(err) {
    if(err) {next(err);}
    else {
      db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (err, timesheet) => {
        res.status(201).send({timesheet: timesheet});
      });
    }
  });
  
});

timesheetRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  const employeeId = req.params.employeeId;
  
  if(!hours || !rate || !date || !employeeId) {
    return res.sendStatus(400);
  }
  
  const query = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE Timesheet.id = $timesheetId';
  const params = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $employeeId: employeeId,
    $timesheetId: req.params.timesheetId
  };
  
  db.run(query, params, (err) => {
    if(err) { next(err);}
    else {
      db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (err, timesheet) => {
        if(err) {next(err);}
        else {res.status(200).send({timesheet: timesheet});}
      })
    }})
});

timesheetRouter.delete('/:timesheetId', (req, res, next) => {
  const timesheetId = req.params.timesheetId;
  
  const query = 'DELETE FROM Timesheet WHERE id = $timesheetId';
  const params = {$timesheetId: timesheetId};
  
  db.run(query, params, (err) => {
   if (err) {next(err);}
    else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetRouter;
