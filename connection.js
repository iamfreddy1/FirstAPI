const mysql = require('mysql');

// Create a connection pool to the MySQL database
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'bsbzqdke0fnscdn1sr7p-mysql.services.clever-cloud.com',
  user: 'uklcpayndn1ijkxr',
  password: 'AabQ4VNLmKAx0bOGeAvU',
  database: 'bsbzqdke0fnscdn1sr7p'
});

module.exports = pool;
