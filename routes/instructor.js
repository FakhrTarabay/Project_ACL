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
const { read } = require("fs");
require("dotenv").config();

router.use(async (req,res,next)=>{
  try{
    const role = req.user.role
    if(role.includes("Instructor")){
      next();
    }
  }catch(error){
    res.send("You are not allowed!");
    res.end();
  }
});

//done and tested
router.route("/viewCoverage").get(async (req, res) => {
  try {
    const coverage = await courseM.find({ instructors: req.user.id });
    if (coverage.length == 0) {
      res.send("You are not assigned as an instructor to any course");
    } else {
      res.send(coverage);
    }
  } catch (err) {
    res.send(err);
  }
});
//done and tested
router.route("/viewslots").get(async (req, res) => {
  try {
    const slots = await schM.find({ academicMember: req.user.id });
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
        res.send("You do not belong to the department entered");
        return;
      }
      const staff = await staffM.find({ department: req.body.department });
      res.send(staff);
    } catch (err) {
      res.send(err);
    }
  } else {
    try {
      const res2 = [req.user.id];
      const info = await courseM.find({ instructors: req.user.id });
      for (var i = 0; i < info.length; i++) {
        if (!res2.includes(info[i].coordinator)) {
          res2.push(info[i].coordinator);
        }
        for (var j = 0; j < info[i].instructors.length; j++) {
          if (!res2.includes(info[i].instructors[j])) {
            res2.push(info[i].instructors[j]);
          }
        }
        for (var j = 0; j < info[i].TAs.length; j++) {
          if (!res2.includes(info[i].TAs[j])) {
            res2.push(info[i].TAs[j]);
          }
        }
      }
      const res3 = [];
      for (var i = 0; i < res2.length; i++) {
        const entry = await staffM.findOne({ id: res2[i] });
        res3.push(entry);
      }
      if ((res3, lenght == 0)) {
        res.send("There are no results");
      } else {
        res.send(res3);
      }
    } catch (err) {
      res.send(err);
    }
  }
});
//done and tested
router.route("/assignToUnassigned").post(async (req, res) => {
  try {
    const staff = await staffM.findOne({ id: req.body.id });
    if (staff == null) {
      res.send("Staff member id entered does not exist");
      return;
    }
    const sch = await schM.findOne({ _id: req.body._id });
    if (sch.academicMember != null) {
      res.send("There is an academic member already assigned to this slot");
    } else {
      await sch.update({ academicMember: req.body.id });
      res.send("assignment is complete");
    }
  } catch (err) {
    res.send(err);
  }
});
//done and tested
router.route("/updateDelMem").post(async (req, res) => {
  if (req.body.newID) {
    try {
      await schM
        .findOne({ _id: req.body.slotID })
        .updateOne({ academicMember: req.body.newID });
      res.send("The record has been updated");
    } catch (err) {
      res.send(err);
    }
  } else {
    try {
      await schM
        .findOne({ _id: req.body.slotID })
        .updateOne({ academicMember: null });
      res.send("assignment has been deleted");
    } catch (err) {
      res.send(err);
    }
  }
});
//done and tested
router.route("/removeMember").post(async (req, res) => {
  try {
    const course =  await courseM
      .findOne({ name:req.body.courseName });
      const sched = await schM.find({course:req.body.courseName})
      const id = req.body.memID
    const coor = course.coordinator;
      if(id==coor){
        await courseM
      .findOne({ name:req.body.courseName }).updateOne({coordinator:null})
      res.send("Coordinator has been removed")
      }else{
        if(course.instructors.includes(id)){
          res.send("You cannot remove another instructor")
        }
        else{
          if(!course.TAs.includes(id)){
            res.send("The ID entered was not found in this course")
            return;
          }
          await courseM
      .findOne({ name:req.body.courseName }).updateOne({$pull:{TAs:id}})
          res.send("TA has been removed")
          for(var i=0;i<sched.length;i++){
            if(sched[i].academicMember==id){
              await schM.findOne({_id:sched[i]._id}).updateOne({academicMember:null})
            }
          }

        }
      }
  } catch (err) {
    res.send(err);
  }
});
//done and tested
router.route("/assignCourseC").post(async (req, res) => {
  try {
    await courseM
      .findOne({ name: req.body.courseName })
      .updateOne({ coordinator: req.body.coorID });
    res.send("Coordinator has been assigned");
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
