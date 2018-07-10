const express = require('express');
const app = express();

app.use(express.static('public'));

app.post('/projects', (req, res) => {
  return res.json({
    name: "Hello"
  });
});
// app.get('/', (req, res) => res.send('Hello World!'));

app.listen(3000, () => console.log('Example app listening on port 3000!')); // eslint-disable-line no-console