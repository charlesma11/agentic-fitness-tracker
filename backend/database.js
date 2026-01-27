const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = 'db.sqlite';

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  } else {
    console.log('Connected to the SQLite database.');
    db.run(
      `CREATE TABLE workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text, 
            reps integer, 
            sets integer,
            weight integer,
            createdAt TEXT DEFAULT (date('now'))
            )`,
      (err) => {
        if (err) {
          // Table already created
        } else {
          // Table just created, creating some rows
          const insert = 'INSERT INTO workouts (name, reps, sets, weight) VALUES (?,?,?,?)';
          db.run(insert, ['Bench Press', 10, 3, 135]);
          db.run(insert, ['Squat', 8, 4, 225]);
        }
      }
    );
    db.run(
      `CREATE TABLE meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text, 
            calories integer, 
            protein integer,
            createdAt TEXT DEFAULT (date('now'))
            )`,
      (err) => {
        if (err) {
          // Table already created
        } else {
          // Table just created, creating some rows
          const insert = 'INSERT INTO meals (name, calories, protein) VALUES (?,?,?)';
          db.run(insert, ['Chicken and Rice', 500, 40]);
        }
      }
    );
    db.run(
      `CREATE TABLE bodyweight (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weight integer,
        createdAt TEXT DEFAULT (date('now'))
      )`,
      (err) => {
        if (err) {
          // Table already created
        }
      }
    )
  }
});

module.exports = db;
