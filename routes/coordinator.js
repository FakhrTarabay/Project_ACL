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
const { findOne } = require("../models/Request");
require("dotenv").config();

//done and tested
router.route("/viewSlotLinking").get(async (req, res) => {
  try {
    const result = await reqM.find(
      {
        $and: [{ receiver:req.user.id}, { type: "Slot Linking" }],
      },
      { _id: 0 }
    );
    const results = []
    for(var i =0;i<result.length;i++){
      var id = result[i].schedule_ID;
      const sch = await schM.findOne({ _id:id });
      const courseName = sch.course;
      const course = await courseM.findOne({name:courseName});
      const courseCoor = course.coordinator
      if(courseCoor==req.user.id){
        results.push(result[i]);
      }
    }
    if(results.length==0){
      res.send("You do not have any Slot Linking requests")
    }else{
    res.send(results)
  }
  } catch (err) {
    res.send(err);
  }
});
//done and tested
router.route("/acceptRequest").post(async (req, res) => {
  try {
    const reqq = await reqM.findOne({ _id: req.body._id });
    const sender = reqq.sender;
    const schId = reqq.schedule_ID;
    const sch = await schM.findOne({ _id: schId });
    const course = sch.course;
    if (
      (await courseM.findOne({
        $and: [({ name: course }, { TAs: sender })],
      })) &&
      sch.academicMember == null
    ) {
      await reqM.find({ _id: req.body._id }).updateOne({ status: "Accepted" });
      await schM
        .find({
          $and: [
            ({ course: course },
            { slot: sch.slot },
            { day: sch.day },
            { location: sch.location }),
          ],
        })
        .updateOne({ academicMember: sender });
      res.send("Request Accepted");
    } else {
      if (sch.academicMember != null) {
        res.send("A TA is already assigned to this slot");
      } else {
        res.send("The request sender does not belong to this course");
      }
    }
  } catch (err) {
    res.send(err);
  }
});
//done and tested
router.route("/RejectRequest").post(async (req, res) => {
  try {
    const reqq = await reqM.findOne({ _id: req.body._id });
    const sender = reqq.sender;
    const schId = reqq.schedule_ID;
    const sch = await schM.findOne({ _id: schId });
    const course = sch.course;
    if (
      await courseM.findOne({ $and: [({ name: course }, { TAs: sender })] })
    ) {
      await reqM.find({ _id: req.body._id }).updateOne({ status: "Rejected" });
      res.send("Request has been rejected");
    } else {
      res.send("The request sender does not belong to this course");
    }
  } catch (err) {
    res.send(err);
  }
});
//done and tested
router.route("/addSlot").post(async (req, res) => {
  const course = await courseM.findOne({ name: req.body.courseName });
  if (req.user.id != course.coordinator) {
    res.send("you are not a coordinator in this course");
    return;
  }
  if (
    await schM.find({
      $and: [
        { loaction: req.body.location },
        { slot: req.body.slot },
        { day: req.body.day },
      ],
    })
  ) {
    res.send("This slot is already occupied");
  } else {
    const newslot = new schM({
      location: req.body.location,
      day: req.body.day,
      slot: req.body.slot,
      course: req.body.course,
    });
    try {
      await newslot.save();
      res.send("Slot added successfully");
    } catch (error) {
      res.send(
        "please make you sure that you have entered the required fields"
      );
    }
  }
});
//done and tested
router.route("/updateSlot").post(async (req, res) => {
  try {
    const slot = await schM.findOne({ _id: req.body._id });
    const course = await courseM.findOne({ name: slot.course });
    if(req.body.courseName==null){
      if (
        req.user.id != course.coordinator
      ) {
        res.send("you are not a coordinator in one of the courses");
        return;
      }
    }else{
    const course2 = await courseM.findOne({ name: req.body.courseName });
    if (
      course2.coordinator != course.coordinator &&
      req.user.id != course.coordinator &&
      req.user.id != course2.coordinator
    ) {
      res.send("you are not a coordinator in one of the courses");
      return;
    }}
    const arr = [];
    if (req.body.courseName != null) {
      arr.push(req.body.courseName);
    } else {
      arr.push(slot.course);
    }
    if (req.body.day != null) {
      arr.push(req.body.day);
    } else {
      arr.push(slot.day);
    }
    if (req.body.slot != null) {
      arr.push(req.body.slot);
    } else {
      arr.push(slot.slot);
    }
    if (req.body.location != null) {
      arr.push(req.body.location);
    } else {
      arr.push(slot.location);
    }
    if (
      (await schM.findOne({
        $and: [
          { location: arr[3] },
          { slot: arr[2] },
          { day: arr[1] },
          { course: arr[0] },
        ],
      })) != null
    ) {
      res.send("This slot is already occupied");
    } else {
      try {
        await slot.update({
          $set: { location: arr[3], slot: arr[2], day: arr[1], course: arr[0] },
        });
      } catch (err) {
        res.send(err);
      }
    }
  } catch (err) {
    res.send(err);
  }
});
//done and tested
router.route("/deleteSlot").post(async (req, res) => {
  try {
    const slot = await schM.findOne({ _id: req.body.slotID });
    const course = await courseM.findOne({ name: slot.course });
    if (req.user.id != course.coordinator) {
      res.send("you are not a coordinator in this course");
      return;
    }
    await schM.deleteOne({ _id:req.body.slotID});
    res.send("slot has been deleted")
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
