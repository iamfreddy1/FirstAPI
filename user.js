const express = require('express');
const router = express.Router();
const pool = require('./connection');
const authenticateToken = require('./middlewares/auth').authenticateToken;

// Protected endpoint
router.get('/', authenticateToken, (req, res) => {
  // Endpoint logic
});

 
module.exports = router;
