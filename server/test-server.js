const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  console.log('Request received!');
  res.json({ message: 'Hello World!' });
});

console.log('Starting test server...');
app.listen(PORT, (err) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(`Test server running on http://localhost:${PORT}`);
  }
});