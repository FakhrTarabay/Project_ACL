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
require('dotenv').config()

//done and tested
router.route("/viewCoverage").get(async (req, res) => {
  try {
    const coverage = await courseM.find(
      { instructors:req.user.id }
    );
    if(coverage.length==0){
      res.send("You are not assigned as an instructor to any course")
    }else{
    res.send(coverage);
    }
  } catch (err) {
    res.send(err);
  }
});
//done and tested
router.route("/viewslots").get(async (req, res) => {
    try {
      const slots = await schM.find(
        { academicMember: req.user.id }
      );
      if(slots.length==0){
        res.send("There are no results")
      }else{
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
        if(req.body.department!=deps){
          res.send("You do not belong to the department entered")
          return;
        }
        const staff = await staffM.find({ department: req.body.department});
      res.send(staff);
      } catch (err) {
        res.send(err);
      }
    } else {
      try {
        const res2 = [req.user.id]
        const info = await courseM.find({instructors:req.user.id})
        for(var i = 0;i<info.length;i++){
          if(!res2.includes(info[i].coordinator)){
          res2.push(info[i].coordinator)
          }
          for(var j = 0;j<info[i].instructors.length;j++){
            if(!res2.includes(info[i].instructors[j])){
              res2.push(info[i].instructors[j])
              }
          }
          for(var j = 0;j<info[i].TAs.length;j++){
            if(!res2.includes(info[i].TAs[j])){
              res2.push(info[i].TAs[j])
              }
          }
        }
        const res3 = []
        for(var i = 0;i<res2.length;i++){
          const entry = await staffM.findOne({id:res2[i]})
          res3.push(entry);
        }
        if(res3,lenght==0){
          res.send("There are no results")
        }else{
        res.send(res3)
        }
      } catch (err) {
        res.send(err);
      }
    }
});
router.route("/assignToUnassigned").post(async (req, res) => {
    try {
      await schM
        .find({
          $and: [{ course: req.body.courseName }, { academicMember: null }],
        })
        .update({ academicMember: req.body.id });
    } catch (err) {
      console.log(err);
    }
});
router.route("/updateDelMem").post(async (req, res) => {
    if (req.body.newname != null) {
      try {
        await schM
          .find({ course: req.body.courseName })
          .update({ academicMember: req.body.id });
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        await schM
          .find({ course: req.body.courseName })
          .update({ academicMember: null });
      } catch (err) {
        console.log(err);
      }
    }
});
router.route("/assignCourseC").post(async (req, res) => {
    try {
      await courseM
        .find({ name: req.body.coursename })
        .update({ coordinator: req.body.id });
    } catch (err) {
      console.log(err);
    }
});

  module.exports=router;