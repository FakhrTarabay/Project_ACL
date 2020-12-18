const express = require('express')
const hr_routes = require('./routes/hr')
const app = express()
app.use(express.json())
require('dotenv').config()

app.use('',hr_routes)

module.exports.app = app;