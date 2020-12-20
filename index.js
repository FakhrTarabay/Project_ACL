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
router.route("/viewSlotLinking").get(async (req, res) => {
  try {
    const slots = await reqM.find({
      $and: [{ receiver: req.body.idOfRec }, { type: "Slot Linking" }],
    });
    res.send(slots);
  } catch (err) {
    console.log(err);
  }
});
//added changes to schema
router.route("/acceptRequest").post(async (req, res) => {
  try {
    const reqq = reqM.find({ _id: req.body._id });
    const sender = reqM.find({ _id: req.body._id }).select("sender");
    const course = reqM.find({ _id: req.body._id }).select("course");
    if (
      courseM.find(
        $and[
          ({ name: course }, $or[({ TAs: sender }, { instructors: sender })])
        ]
      )
    ) {
      await reqM.find({ _id: req.body._id }).update({ status: "Accepted" });
      await schM
        .find(
          $and[
            ({ course: course },
            { slot: reqq.select("slot") },
            { day: reqq.select("day") },
            { location: reqq.select("location") })
          ]
        )
        .update({ academicMember: sender });
    } else {
      res.send("The request sender does not belong to this course");
    }
  } catch (err) {
    console.log(err);
  }
});
router.route("/RejectRequest").post(async (req, res) => {
  try {
    const sender = reqM.find({ _id: req.body._id }).select("sender");
    const course = reqM.find({ _id: req.body._id }).select("course");
    if (
      courseM.find(
        $and[
          ({ name: course }, $or[({ TAs: sender }, { instructors: sender })])
        ]
      )
    ) {
      await reqM.find({ _id: req.body._id }).update({ status: "Rejected" });
    } else {
      res.send("The request sender does not belong to this course");
    }
  } catch (err) {
    console.log(err);
  }
});
const { app } = require("./app");
require("dotenv").config();
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("pass"));
app.listen(process.env.PORT);
