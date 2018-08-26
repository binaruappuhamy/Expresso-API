const express = require('express');
const menuRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

 const menuItemsRouter = require('./menuitems.js');

menuRouter.param('menuId', (req, res, next, menuId) => {
  const query = 'SELECT * FROM Menu WHERE id = $menuId';
  const params = {$menuId: menuId};
  
  db.get(query, params, (err, menu) => {
    if(err) {next(err)}
    else if(menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

menuRouter.use('/:menuId/menu-items', menuItemsRouter);

// GET ALL MENUS
menuRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, rows) => {
    if(err) {next(err);}
    else {
      res.status(200).json({menus: rows});
    }
  });
});

// GET SINGLE MENU
menuRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

// CREATE NEW MENU
menuRouter.post('/', (req, res, next) => {
  const title = req.body.menu.name;
    
  if (!title) {
    return res.sendStatus(400);
  }
  
  const query = 'INSERT INTO Menu (title) VALUES ($title)';
  const params = {
    $title: title
  };
  
  db.run(query, params, function(err) {
    if(err) {next(err);}
    else {
      db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`, (err, menu) => {
        res.status(201).send({menu: menu});
      });
    }
  });
});

// UPDATE MENU
menuRouter.put('/:menuId', (req, res, next) => {
  const title = req.body.menu.title;
    
  if (!title) {
    return res.sendStatus(400);
  }
  
  const query = 'UPDATE Menu SET title = $title WHERE Menu.id = $menuId';
  const params = {
    $title: title,
    $menuId: req.params.menuId
  };
  
//  db.run(query, params, function (err) {
  db.run(query, params, (err) => {
    if(err) {next(err);}
    else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`, (err, menu) => {
        res.status(200).json({menu: menu});
      });
    }
  });

});

// DELETE MENU
menuRouter.delete('/:menuId', (req, res, next) => {
  const menuItemQuery = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
    const deleteQuery = 'DELETE FROM Menu WHERE id = $menuId';
  
  const params = {$menuId: req.params.menuId};
  
  db.get(menuItemQuery, params, (err, items) => {
    if(err) {next(err); }
    else if (items) { res.sendStatus(400);}
    else {
      db.run(deleteQuery, params, function (err) {
        if(err) {next(err);}
        else { res.sendStatus(204);}
      })
    }
  })
});

module.exports = menuRouter;