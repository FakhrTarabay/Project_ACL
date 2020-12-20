const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
const express = require("express");
const router = express.Router();
const locM = require("../models/Location");
const depM = require("../models/Department");
const courseM = require("../models/Course");
const facM = require("../models/Faculty");
const schM = require("../models/Schedule");
const staffM = require("../models/StaffMember");
const reqM = require("../models/Request");


const { app } = require("./app");
const { schema } = require("../models/Location");
require("dotenv").config();
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("pass"));
app.listen(process.env.PORT);
