const reqM = require('../models/Request')
const courseM = require('../models/course')
const schM = require('../models/Schedule')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

router.use(async (req, res, next) => {
    try {
        const role = req.user.role
        //console.log(role)
        if (role.includes("coordinator")) {
            next();
        }

    } catch (error) {
        res.send("You are not allowed!")
        res.end();
    }
})

//done and tested
router.route("/viewSlotLinking").get(async (req, res) => {
    try {
        const results = []
        const result = await reqM.find(
            {
                 receiver: req.user.id ,  type: "Slot Linking" }
            )
        console.log(result)
        for (var i = 0; i < result.length; i++) {
            var id = result[i].schedule_ID;
            console.log(id)
            const sch = await schM.findOne({ _id: id });
            console.log(sch)
            const courseName = sch.course;
            const course = await courseM.findOne({ name: courseName });
            console.log(course)
            const courseCoor = course.coordinator
            console.log(courseCoor == req.user.id)
            if (courseCoor == req.user.id) {
                results.push(result[i]);
            }   
        }
        if (results.length == 0) {
            res.send("You do not have any Slot Linking requests")
        } else {
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
            const request = await reqM.findOneAndUpdate({ _id: req.body._id },{ status: "Accepted" });
            if(request){
                await schM.findOneAndUpdate({_id:request.schedule_ID},{ academicMember: sender })
                res.send("Request Accepted");
            }
            else {
                res.send("No request with this ID!")
            }
        } 
        else {
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
    try {
        const course = await courseM.findOne({ name: req.body.courseName });
        if (req.user.id != course.coordinator) {
            res.send("you are not a coordinator in this course");
            return;
        }
        const takenSlot = (await schM.find({
            slot: req.body.slot,
            day: req.body.day
        })).filter(function (slot) {
            return slot.location == req.body.location
        })
        console.log(takenSlot)
        if (takenSlot.length != 0) {
            res.send("This slot is already occupied");
        } else {
            const newslot = new schM({
                location: req.body.location,
                day: req.body.day,
                slot: req.body.slot,
                course: req.body.courseName,
            });
            await newslot.save();
            res.send("Slot added successfully");
        }
    } catch (error) {
        res.send(
            "please make you sure that you have entered the required fields"
        );
    }
});
//done and tested
router.route("/updateSlot").post(async (req, res) => {
    try {
        const slot = await schM.findOne({ _id: req.body._id });
        const course = await courseM.findOne({ name: slot.course });
        if (req.body.courseName == null) {
            if (
                req.user.id != course.coordinator
            ) {
                res.send("you are not a coordinator in one of the courses");
                return;
            }
        } else {
            const course2 = await courseM.findOne({ name: req.body.courseName });
            if (
                course2.coordinator != course.coordinator &&
                req.user.id != course.coordinator &&
                req.user.id != course2.coordinator
            ) {
                res.send("you are not a coordinator in one of the courses");
                return;
            }
        }
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
                res.send("This slot is updated!")
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
        await schM.deleteOne({ _id: req.body.slotID });
        res.send("slot has been deleted")
    } catch (err) {
        res.send(err);
    }
});

module.exports = router;