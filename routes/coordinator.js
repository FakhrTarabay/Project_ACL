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
  router.route("/acceptRequest").post(async (req, res) => {
    try {
      const reqq = reqM.find({ _id: req.body._id });
      const sender = reqq.select("sender");
      const schId = reqq.select("schedule_ID");
      const sch = schM.find({ _id: schId });
      const course = sch.select("course");
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
              { slot: sch.select("slot") },
              { day: sch.select("day") },
              { location: sch.select("location") })
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
      const reqq = reqM.find({ _id: req.body._id });
      const sender = reqq.select("sender");
      const schId = reqq.select("schedule_ID");
      const sch = schM.find({ _id: schId });
      const course = sch.select("course");
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
  router.route("/addSlot").post(async (req, res) => {
    if (
      (await schM.find({ loaction: req.body.location })) &&
      (await schM.find({ slot: req.body.slot })) &&
      (await schM.find({ day: req.body.day }))
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
  router.route("/updateSlot").post(async (req,res)=>{
    const slot = await schM.find({_id:req.body.id});
    const arr = [];
    if(req.body.course!=null){arr.push(req.body.course)}else{arr.push(slot.select('course'))};
    if(req.body.day!=null){arr.push(req.body.day)}else{arr.push(slot.select('day'))};
    if(req.body.slot!=null){arr.push(req.body.slot)}else{arr.push(slot.select('slot'))};
    if(req.body.location!=null){arr.push(req.body.location)}else{arr.push(slot.select('location'))};
    if (
      (await schM.find({ loaction: arr[3] })) &&
      (await schM.find({ slot: arr[2] })) &&
      (await schM.find({ day: arr[1] })) &&
      (await schM.find({course:arr[0]}))
    ){
      res.send("This slot is already occupied");
    }else {
      try{
      slot.update({$set:{location:arr[3],slot:arr[2],day:arr[1],course:arr[0]}});
      }catch(err){
        res.send(err);
      }
    }
  
  })
  router.route("/deleteSlot").post(async (req,res)=>{
    try{
      await (schM.deleteOne({_id:req.body.id}));
    }catch(err){
      res.send(err);
    }
  })

  module.exports=router;