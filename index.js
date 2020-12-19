const mongoose = require('mongoose');
mongoose.set('useFindAndModify',false);
const express = require('express');
const router = express.Router();
const locM = require('../models/Location');
const depM = require('../models/Department');
const courseM = require('../models/Course');
const facM = require('../models/Faculty');
const schM = require('../models/Schedule');
const staffM = require('../models/StaffMember');
const reqM = require('../models/Request');

router.route('/viewslots')
.post(async(req,res)=>{
    const slots = await schM.find({slot:1},{location:1},{course:1},{academicMember:req.body.name});
    res.send(slots);
})
router.route('/viewStaffInDep')
.post(async(req,res)=>{
    const dep = await staffM.find({name:req.body.name}).select('department');
    const staff = await staffM.find({},{department:dep});
    res.send(staff);
})
const {app} = require('./app')
require('dotenv').config()
mongoose.connect(process.env.DB_URL,{useNewUrlParser: true, useUnifiedTopology: true}).then(console.log("pass"))
app.listen(process.env.PORT)