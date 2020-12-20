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
require('dotenv').config()


router.route("/viewCoverage").get(async (req, res) => {
    try {
      const coverage = await courseM.find(
        { instructors: req.body.id },
        { name: 1, TAs: 0, coordinator: 0 }
      );
      res.send(coverage);
    } catch (err) {
      console.log(err);
    }
  });
  router.route("/viewslots").get(async (req, res) => {
    try {
      const slots = await schM.find(
        { academicMember: req.body.id },
        { slot: 1, location: 1, course: 1 }
      );
      res.send(slots);
    } catch (err) {
      console.log(err);
    }
  });
  router.route("/viewStaff").get(async (req, res) => {
    if (req.body.dep) {
      try {
        const staff = await staffM.find({ department: req.body.dep });
        res.send(staff);
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        const staff = await courseM.find(
          { name: req.body.coursename },
          { name: 0 }
        );
        res.send(staff);
      } catch (err) {
        console.log(err);
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