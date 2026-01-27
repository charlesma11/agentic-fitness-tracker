const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the fitness tracker backend!');
});

// Get all workouts or by date
app.get('/workouts', (req, res) => {
  const date = req.query.date;
  let sql = 'SELECT * FROM workouts';
  let params = [];
  if (date) {
    sql += ' WHERE createdAt = ?';
    params.push(date);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows,
    });
  });
});

// Add a new workout
app.post('/workouts', (req, res) => {
  const { name, reps, sets, weight } = req.body;
  const sql = 'INSERT INTO workouts (name, reps, sets, weight) VALUES (?, ?, ?, ?)';
  const params = [name, reps, sets, weight];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    // Manually add createdAt to the response data since the DB default won't be in the immediate response
    const workoutData = { id: this.lastID, ...req.body, createdAt: new Date().toISOString().slice(0,10) };
    res.json({
      message: 'success',
      data: workoutData,
    });
  });
});

// Get all meals or by date
app.get('/meals', (req, res) => {
  const date = req.query.date;
  let sql = 'SELECT * FROM meals';
  let params = [];
  if (date) {
    sql += ' WHERE createdAt = ?';
    params.push(date);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows,
    });
  });
});

// Add a new meal
app.post('/meals', (req, res) => {
  const { name, calories, protein } = req.body;
  const sql = 'INSERT INTO meals (name, calories, protein) VALUES (?, ?, ?)';
  const params = [name, calories, protein];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    const mealData = { id: this.lastID, ...req.body, createdAt: new Date().toISOString().slice(0,10) };
    res.json({
      message: 'success',
      data: mealData,
    });
  });
});

// Update a workout
app.put('/workouts/:id', (req, res) => {
    const { name, reps, sets, weight, createdAt } = req.body;
    const sql = `UPDATE workouts set name = ?, reps = ?, sets = ?, weight = ?, createdAt = ? WHERE id = ?`;
    const params = [name, reps, sets, weight, createdAt, req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": res.message})
            return;
        }
        res.json({
            message: "success",
            data: req.body,
            changes: this.changes
        })
    });
});

// Delete a workout
app.delete('/workouts/:id', (req, res) => {
    db.run('DELETE FROM workouts WHERE id = ?', req.params.id, function (err) {
        if (err){
            res.status(400).json({"error": res.message})
            return;
        }
        res.json({"message":"deleted", changes: this.changes})
    });
});

// Update a meal
app.put('/meals/:id', (req, res) => {
    const { name, calories, protein, createdAt } = req.body;
    const sql = `UPDATE meals set name = ?, calories = ?, protein = ?, createdAt = ? WHERE id = ?`;
    const params = [name, calories, protein, createdAt, req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": res.message})
            return;
        }
        res.json({
            message: "success",
            data: req.body,
            changes: this.changes
        })
    });
});

// Delete a meal
app.delete('/meals/:id', (req, res) => {
    db.run('DELETE FROM meals WHERE id = ?', req.params.id, function (err) {
        if (err){
            res.status(400).json({"error": res.message})
            return;
        }
        res.json({"message":"deleted", changes: this.changes})
    });
});

// Get all bodyweight entries
app.get('/bodyweight', (req, res) => {
  db.all('SELECT * FROM bodyweight ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows,
    });
  });
});

// Add a new bodyweight entry
app.post('/bodyweight', (req, res) => {
  const { weight, createdAt } = req.body;
  const sql = 'INSERT INTO bodyweight (weight, createdAt) VALUES (?, ?)';
  const params = [weight, createdAt || new Date().toISOString().slice(0,10)];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: { id: this.lastID, ...req.body },
    });
  });
});

// Update a bodyweight entry
app.put('/bodyweight/:id', (req, res) => {
    const { weight, createdAt } = req.body;
    const sql = `UPDATE bodyweight set weight = ?, createdAt = ? WHERE id = ?`;
    const params = [weight, createdAt, req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": res.message})
            return;
        }
        res.json({
            message: "success",
            data: req.body,
            changes: this.changes
        })
    });
});

// Delete a bodyweight entry
app.delete('/bodyweight/:id', (req, res) => {
    db.run('DELETE FROM bodyweight WHERE id = ?', req.params.id, function (err) {
        if (err){
            res.status(400).json({"error": res.message})
            return;
        }
        res.json({"message":"deleted", changes: this.changes})
    });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
