const mongoose = require('mongoose')
const {app} = require('./app')
require('dotenv').config()
mongoose.connect(process.env.DB_URL,{useNewUrlParser: true, useUnifiedTopology: true}).then(console.log("pass"))
app.listen(process.env.PORT)