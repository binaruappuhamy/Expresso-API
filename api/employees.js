const express = require('express');
const employeeRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

 const timesheetRouter = require('./timesheets.js');

employeeRouter.param('employeeId', (req, res, next, employeeId) => {
  const query = 'SELECT * FROM Employee WHERE id = $employeeId';
  const params = {$employeeId: employeeId};
  
  db.get(query, params, (err, employee) => {
    if(err) {next(err)}
    else if(employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

employeeRouter.use('/:employeeId/timesheets', timesheetRouter);

// GET ALL EMPLOYEES
employeeRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE is_current_employee = 1', (err, rows) => {
    if(err) {next(err);}
    else {
      res.status(200).json({employees: rows});
    }
  });
});

// GET SINGLE EMPLOYEE
employeeRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

// CREATE NEW EMPLOYEE
employeeRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;
    
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }
  
  const query = 'INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, 1)';
  const params = {
    $name: name,
    $position: position,
    $wage: wage
  };
  
  db.run(query, params, function(err) {
    if(err) {next(err);}
    else {
      db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (err, employee) => {
        res.status(201).send({employee: employee});
      });
    }
  });
});

// UPDATE EMPLOYEE
employeeRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;
  const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
    
  
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }
  
  const query = 'UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId';
  const params = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee,
    $employeeId: req.params.employeeId
  };
  
  db.run(query, params, (err) => {
    if(err) {next(err);}
    else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (err, employee) => {
        res.status(200).json({employee: employee});
      });
    }
  });

});

// DELETE EMPLOYEE (FLIP is_current_employee TO 0)
employeeRouter.delete('/:employeeId', (req, res, next) => {
  const query = 'UPDATE Employee SET is_current_employee = 0 WHERE id = $id';
  const params = {$id: req.params.employeeId};
  
  db.run(query, params, (err) => {
    if(err) {next(err)}
    else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (err, employee) => {
        res.status(200).json({employee: employee});
        });
      }
    });
});

module.exports = employeeRouter;