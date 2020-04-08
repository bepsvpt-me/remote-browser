const express = require('express');
const app = express();
const path = require('path');
const ice = require('../../ice-servers');

app.use(
  '/assets',
  express.static(path.join(__dirname, 'assets'))
);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client.html'));
});

app.get('/credentials.json', (req, res) => {
  res.json(ice());
});

app.get('*', (req, res) => {
  res.redirect('/');
});

module.exports = app;
