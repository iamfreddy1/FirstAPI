const express = require('express');
const pool = require('./connection');
const { authenticateToken } = require('./middlewares/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 3306;

app.use(express.json());

// Middleware to authenticate token for protected routes
app.use('/users', authenticateToken);

// GET route to fetch and display users in a table format
app.get('/users', (req, res) => {
  try {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting MySQL database connection:', err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      connection.query('SELECT user_id, username, role_id, created_at FROM users', (error, results) => {
        connection.release();
        if (error) {
          console.error('Error executing query:', error.stack);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST method to create a new user (secured with authenticateToken middleware)
app.post('/users', authenticateToken, (req, res) => {
  const { username, password, role_id } = req.body;
  const created_at = new Date();

  try {
    // Hash the password before inserting into the database
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      pool.getConnection((err, connection) => {
        if (err) {
          console.error('Error getting MySQL database connection:', err.stack);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

        connection.query(
          'INSERT INTO users (username, password, role_id, created_at) VALUES (?, ?, ?, ?)',
          [username, hashedPassword, role_id, created_at],
          (error, results) => {
            connection.release();
            if (error) {
              console.error('Error executing query:', error.stack);
              return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ message: 'User created successfully', userId: results.insertId });
          }
        );
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT method to update a user (secured with authenticateToken middleware)
app.put('/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const { username, role_id } = req.body;

  try {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting MySQL database connection:', err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      connection.query(
        'UPDATE users SET username = ?, role_id = ? WHERE user_id = ?',
        [username, role_id, userId], // Updated the query parameters
        (error, results) => {
          connection.release();
          if (error) {
            console.error('Error executing query:', error.stack);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
          if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
          }
          res.json({ message: 'User updated successfully' });
        }
      );
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH method to partially update a user (secured with authenticateToken middleware)
app.patch('/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const { username } = req.body;

  try {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting MySQL database connection:', err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      const updateFields = [];
      const params = [];

      // Check if username is provided in the request body
      if (username && Object.keys(req.body).length === 1) { // Ensure only username is provided
        updateFields.push('username = ?');
        params.push(username);
      } else if (!username) {
        return res.status(400).json({ error: 'Username is required for update' });
      } else {
        return res.status(400).json({ error: 'Only username can be updated' });
      }

      // Add updated_at field with current timestamp
      updateFields.push('updated_at = NOW()');

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields provided for update' });
      }

      // Construct the SET clause of the SQL query dynamically based on the fields provided
      const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
      params.push(userId); // Add userId to the parameters array

      connection.query(
        updateQuery,
        params,
        (error, results) => {
          connection.release();
          if (error) {
            console.error('Error executing query:', error.stack);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
          if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
          }
          res.json({ message: 'User updated successfully' });
        }
      );
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.delete('/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;

  try {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting MySQL database connection:', err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      connection.query(
        'DELETE FROM users WHERE user_id = ?',
        [userId],
        (error, results) => {
          connection.release();
          if (error) {
            console.error('Error executing query:', error.stack);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
          if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
          }
          res.json({ message: 'User deleted successfully' });
        }
      );
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/auth', (req, res) => {
  try {
    const { username, password } = req.body;

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting MySQL database connection:', err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      connection.query('SELECT user_id, username, password FROM users WHERE username = ?', [username], (error, results) => {
        connection.release();
        if (error) {
          console.error('Error executing query:', error.stack);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];

        if (!user.password) {
          return res.status(401).json({ error: 'User has no password set' });
        }

        // Compare the provided password with the hashed password from the database
        bcrypt.compare(password, user.password, (err, passwordMatch) => {
          if (err) {
            console.error('Error comparing passwords:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
          }

          if (!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect username or password' });
          }

          const token = jwt.sign({ user: { user_id: user.user_id, username: user.username } }, 'rafiki', {
            expiresIn: '1h',
          });

          res.json({ token: token });
        });
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});







