const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkhhYmltYW5hIiwiaWF0IjoxNzEzMTAxNDM4LCJleHAiOjE3MTMxMDUwMzh9.1F5xRjHIMOb8DIMzrzCI4UwkPIu_mfPa33691lVudhY';

jwt.verify(token, 'secret', (err, decoded) => {
  if (err) {
    console.error('Error verifying token:', err);
  } else {
    console.log('Decoded token:', decoded);
  }
});
