'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 8000;

app.get('/', async (req, res) => {
    res.render('index.ejs');
});

app.listen(PORT, async (req, res) => {
    console.log('Server is up!');
});
