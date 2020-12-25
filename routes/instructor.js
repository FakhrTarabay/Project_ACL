const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
const express = require("express");
const router = express.Router();
const courseM = require("../models/course");
const schM = require("../models/Schedule");
const staffM = require("../models/StaffMember");
const { read } = require("fs");
require('dotenv').config()

router.use(async (req, res, next) => {
  try {
    const role = req.user.role
    console.log(role)
    if (role.includes("instructor")) {
      next();
    }

  } catch (error) {
    res.send("You are not allowed!")
    res.end();
  }
})

//done and tested
router.route("/viewCoverage").get(async (req, res) => {
    try {
      const coverage = await courseM.find(
        { instructors: req.user.id }
      );
      if (coverage.length == 0) {
        res.send("You are not assigned as an instructor to any course")
      } else {
        res.send(coverage);
      }
    }  
    catch (err) {
        res.send(err);
    }
})

//done and tested
router.route("/viewSlots").get(async (req, res) => {
  try {
    const courses = await courseM.find({ instructors: req.user.id })
    const slots = []
    for (var i = 0; i < courses.length; i++) {
      var courseName = courses[i].name
      slots.push(await schM.find({ course: courseName }))
    }
    if (slots.length == 0) {
      res.send("There are no results");
    } else {
      res.send(slots);
    }
  } catch (err) {
    res.send(err);
  }
});

//done and tested
router.route("/viewStaff").get(async (req, res) => {
  if (req.body.department) {
    try {
      const mydep = await staffM.findOne({ id: req.user.id });
      const deps = mydep.department;
      if (req.body.department != deps) {
        res.send("You do not belong to the department entered")
        return;
      }
      const staff = await staffM.find({ department: req.body.department }, {password:0});
      res.send(staff);
    } catch (err) {
      res.send(err);
    }
  } 
  else {
    try {
      const res2 = [req.user.id]
      const info = await courseM.find({ instructors: req.user.id })
      for (var i = 0; i < info.length; i++) {
        if (!res2.includes(info[i].coordinator)) {
          res2.push(info[i].coordinator)
        }
        for (var j = 0; j < info[i].instructors.length; j++) {
          if (!res2.includes(info[i].instructors[j])) {
            res2.push(info[i].instructors[j])
          }
        }
        for (var j = 0; j < info[i].TAs.length; j++) {
          if (!res2.includes(info[i].TAs[j])) {
            res2.push(info[i].TAs[j])
          }
        }
      }
      const res3 = []
      for (var i = 0; i < res2.length; i++) {
        const entry = await staffM.findOne({ id: res2[i] }, {password:0})
        res3.push(entry);
      }
      if (res3, lenght == 0) {
        res.send("There are no results")
      } else {
        res.send(res3)
      }
    } catch (err) {
      res.send(err);
    }
  }
});

router.route("/assignToUnassigned").post(async (req, res) => {
    try {
        const schedule = await schM.findOne({_id: req.body.scheduleId, academicMember: null})
        console.log(schedule)
        if(schedule){
          await schM.findOneAndUpdate({_id: schedule._id}, { academicMember: req.body.id })
          res.send("Updated!")
        } 
        else {
          res.send("Already taken!")
        }
    }
    catch (err) {
        res.send(err)
    }
});

router.route("/updateDelMem").post(async (req, res) => {
  if (req.body.id) {
    try {
      const schedule =await schM.findOneAndUpdate({_id: req.body.scheduleID}, { academicMember: req.body.id })
      console.log(schedule)
      if (schedule){
        res.send("Updated!")
      }
      else {
        res.send("Schedule not found!")
      }
    } catch (err) {
      res.send("Schedule not found!");
    }
  } 
  else {
    try {
      const schedule =await schM.findOneAndUpdate({_id: req.body.scheduleID}, { academicMember: null })
      if (schedule){
        res.send("Deleted!")
      }
      else {
        res.send("Schedule not found!")
      }
    } catch (err) {
      send.res("Schedule not found!");
    }
  }
});

router.route("/assignCourseC").post(async (req, res) => {
  try {
    const check = await staffM.find({ id: req.body.coorID })
    if (check.length == 0) {
      res.send("This staff member does not exist")
      return
    }
    await courseM
      .findOne({ name: req.body.courseName })
      .updateOne({ coordinator: req.body.coorID });
    res.send("Coordinator has been assigned");
  } catch (err) {
    res.send(err);
  }
});

router.route('/removeAcademicMember')
.post(async (req,res)=>{
 try{
    await courseM.updateMany({name :{$in : req.body.courses}}, {$pull :{
      instructors  : req.body.staffMember},
      TAs  : req.body.staffMember}
    ,{ multi: true})
      await courseM.updateMany({name :{$in : req.body.courses}, coordinator : req.body.staffMember}, {coordinator : null})
      const schedule =await schM.updateMany({name :{$in : req.body.courses}, academicMember: req.body.staffMember}, { academicMember: null })
      res.send("Removed!")
 }
 catch(error){
   console.log("There is an error")
   res.send(error)
 }
})

module.exports = router;