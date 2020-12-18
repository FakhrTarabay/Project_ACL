const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false)
const express = require('express')
const router = express.Router()
const locationModel = require('../models/Location')
const staffModel = require('../models/StaffMember')
const facultyModel = require('../models/faculty')
const scheduleModel = require('../models/Schedule')
const departmentModel = require('../models/department')
const courseModel = require('../models/course')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// display location
router.route('/viewLocations')
.get(async (req,res) => {
    const locations = await locationModel.find();
    res.send(locations);
})

// adds a location
router.route('/addLocation')
.post(async (req,res) =>{
    let room = await locationModel.findOne({location: req.body.location})
    if (room){
        res.send("This room is already in use");
    }
    else{
        const newLocation = new locationModel({
            location : req.body.location,
            type : req.body.type,
            maxCapacity : req.body.maxCapacity
        })
        try {
            await newLocation.save();
            res.send("Location added successfully");
        } 
        catch (error) {
            res.send("please make you sure that you have entered the required fields");
        }
     }
});

// deletes a location using the location name
router.route('/deleteLocation')
.post(async(req,res) => {
    try {
        const deletedLocation = await locationModel.findOneAndDelete({location : req.body.location})
        if (deletedLocation){
            await scheduleModel.updateMany({location : req.body.location},{location : null})
            await staffModel.updateMany({office : req.body.location},{office : null})
            res.send('deleted')
        }
        else
            res.send("there is no such location")    
    } catch (error) {
        res.send(error)
    }
})

// updates a location
router.route('/updateLocation')
.post(async(req,res) => {
    foundLocation = await locationModel.findOne({location : req.body.updates.location})
    if (foundLocation){
            res.send("this location is already in use")
    }
    else {
        try {
            const prevLocation = await locationModel.findOneAndUpdate({location : req.body.location},req.body.updates)
            if (prevLocation){
                console.log(prevLocation)
                if (req.body.updates.location){
                    await scheduleModel.updateMany({location : req.body.location},{location : req.body.updates.location})
                    await staffModel.updateMany({office : req.body.location},{office : req.body.updates.location})
                }
                res.send("Successful location update!")
            }   
            else
                res.send("There is no Location with the given name")    
        } catch (error) {
            res.send(error)
        }
    }
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.route('/addFaculty')
.post(async (req,res) =>{
    try {
        const foundFaculty = await facultyModel.findOne({name : req.body.faculty})  
        if (foundFaculty)
        res.send("mhya ma3molaaaaaaa")
        else {
            const newFaculty = new facultyModel({
                name : req.body.faculty
            })
            await newFaculty.save()
            res.send("Faculty added successfuly")
        }
    } catch (error) {
        res.send(error)
    }    
})
// updated code to delete multiple faculties
router.route('/deleteFaculty')
.post(async (req,res) =>{
    try {
        const deletedFaculty = await facultyModel.findOneAndDelete({name : req.body.name})
        if (deletedFaculty){
            console.log(deletedFaculty)
            await staffModel.updateMany({faculty : req.body.name},{faculty : null})
            res.send("Faculty Deleted!")
        }
        else 
            res.send("There is no such a Faculty")    
    } catch (error) {
        res.send(error)        
    }
})

router.route('/updateFaculty')
.post(async (req,res) =>{
    const foundFaculty = await facultyModel.findOne({name : req.body.updates.name})
    if (foundFaculty)
        res.send("please choose another name,This name is already in use")
    else {
        const prevFaculty = await facultyModel.findOneAndUpdate({name : req.body.name},req.body.updates)
        if (prevFaculty){
            if (req.body.updates.name)
                await staffModel.updateMany({faculty : req.body.name},{faculty : req.body.updates.name})
            res.send("faculty updated successfuly!")
        }
        else
            res.send("There is no faculty with the given name")
    }    
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.route('/addDepartment')
.post(async (req,res) =>{
    try {
        const foundDepartment = await departmentModel.findOne({name : req.body.name})
        if (foundDepartment){
            const foundFaculty = await facultyModel.findOne({name : req.body.faculty})
            if (foundFaculty){
                await facultyModel.update({name : req.body.faculty},
                    {$addToSet : 
                        {departments : req.body.name}
                    })
                res.send(`Department ${req.body.name} is added to Faculty ${req.body.faculty}`)     
            }
            else 
                res.send(`There is no such Faculty called ${req.body.faculty}!`)
            }
        else
            res.send(`There is no such Department called ${req.body.name}!`) 
    } catch (error) {
        res.send(error)
    }
})    
// update code to handle deleting multiple departments simultaneously
router.route('/deleteDpartment')
.post(async (req,res)=>{
    try {
        await facultyModel.update({name : req.body.faculty} , 
            {$pull: 
                {departments : req.body.name}},
                { multi: true}
                )
        res.send("Department deleted successfully")
    } catch (error) {
        res.send(error)
    }
})
///////////////////////  Add/update/delete a course under a department. ///////////////////////
/*
    adds an existing course to a department
    req.body.name -> name of the course to be added
    req.body.department -> name of the department where the course will be added
*/ 
router.route('/addCourse')
.post(async (req,res) => {
    try {
        const foundCourse = await courseModel.findOne({name : req.body.name})
        if (foundCourse){
            const foundDepartment = await departmentModel.findOne({name : req.body.department})
            if (foundDepartment){
                await departmentModel.update({name : req.body.department} , 
                    {$addToSet : 
                        {courses : req.body.name}
                    })
                res.send(`Course ${req.body.name} is addedd successfully to department ${req.body.department}`)        
            }
            else
            res.send(`There is no Department called ${req.body.department}!`) 
        }
        else
            res.send(`there is no course called ${req.body.name}!`)        
    } catch (error) {
        
    }
})

/*
    Deletes courses from a selected department
    req.body.department -> the selected Department
    req.body.courses -> array of courses' name to be deleted
*/
router.route('/deleteCourse')
.post(async (req,res)=>{
    try {
        await departmentModel.update({name : req.body.department} , {$pull: {courses : {$in : req.body.courses}}},{ multi: true })
        res.send("Course deleted successfully")
    } catch (error) {
        res.send(error)
    }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.route('/updateSalary')
.post(async (req,res) =>{
    if (!req.body.salary && req.body.salary !=0){
        res.send("please enter the new salary")
    }
    else if (req.body.salary < 0)
        res.send("please Enter a valid salary")
    else {
        try {
            const prevStaff = await staffModel.findOneAndUpdate({id : req.body.id}, {salary : req.body.salary})
            if (prevStaff)
                res.send("Salary is updated successfully")
            else
                res.send("there is no StaffMember with the given ID")
        } catch (error) {
            res.send(error)
        }
    }
})
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.route('/viewAttendance')
.get(async (req,res) =>{
    try {
        const staff = await staffModel.findOne({id : req.body.id})
        if (staff){
            res.send(staff.attendanceRecords)
        }
        else {
            res.send(`There is no StaffMember with ID ${req.body.id}`)
        }
    } catch (error) {
        res.send(error)
    }
})

router.route('/addAttendance')
.post(async (req,res) => {
    if (req.body.id.localeCompare(req.user.id)){
        res.send("Sorry, you are not allowed to update your own Attendance!")
    }
    else {
       try {
           await staffModel.update({id : req.body.id},
            {$addToSet :{
                attendanceRecords :  req.body.newAttendanceRecords}
            })
            res.send("Attendance updated successfully!")
       } catch (error) {
           res.send(error)
       } 
    }
})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.route('/registerStaff')
.post(async (req,res) =>{
    try {
        if (req.body.name && req.body.salary && req.body.department && req.body.faculty && req.body.office && req.body.dayOff && req.body.role){
            const foundDepartment = await departmentModel.findOne({name : req.body.department})
            const fouudFaculty = await facultyModel.findOne({name : req.body.faculty})
            const validOffice = await locationModel.findOne({$and : [
                {location : req.body.office}, 
                {type : 'Office'},
                {$expr : {
                    $gt : ["$maxCapacity","$currentCapacity"]
                }}
            ]})
            if (!validOffice){
                res.send(`Location ${req.body.office} is either full or not an Office`)
            }
            else if (fouudFaculty && foundDepartment && validOffice){
                const salt = await bcrypt.genSalt(10)
                const hashedPassword = await bcrypt.hash("123456",salt)
                let id;
                let idNumber = 1;
                if (req.body.role.localeCompare("HR")==0){
                    idNumber += (await staffModel.find({role : "HR"})).length
                    id = "hr-" + idNumber
                }
                else{
                    idNumber += (await staffModel.find({role : {$in : ['HOD', 'Coordinator', 'Instructor', 'TA']}})).length
                    console.log(idNumber)
                    id =  "ac-" + idNumber
                }

                const email = (req.body.name + "." + id + "@staff.guc.edu.eg")
                const calculatedData = {
                    email : email,
                    id : id,
                    password : hashedPassword
                }
                const fullData = {...calculatedData,...req.body}
                const newStaff = new staffModel(fullData)
                await newStaff.save()
                await locationModel.updateOne({location : req.body.office},
                    { $inc: 
                        { currentCapacity : 1 } 
                    })
                res.send("StaffMember Added successfully!")
            }
            else {
                res.send("please select a valid Faculty and Department")
            }
        }
        else {
            res.send("please make sure to fill/choose all the required fields")
        }    
    } catch (error) {
        res.send(error)
    }       
})

router.route('/updateStaffMember')
.post(async => {

})

router.route('/deleteStaffMembers')
.post(async (req,res) => {
    try {
        await staffModel.deleteMany({id : {$in: req.body.staffMembers}})
        await scheduleModel.updateMany({academicMember : {$in: req.body.staffMembers}} , {academicMember : null})
        await courseModel.updateMany({},{ $pull: { 
            instructors : { $in: req.body.staffMembers}, 
            TAs: { $in: req.body.staffMembers},
            coordinator : { $in: req.body.staffMembers}}},
            {multi: true})
        res.send("Staff member(s) deleted successfully")
    } catch (error) {
        res.send(deletedMembers)
    }
})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.route('/test')
.post(async (req,res) => {
   const dummy = new dummyModel({
       id : "ac-1",
       attendanceRecords :
        [
            {
            date : new Date("October 13, 2014 11:13:00"),
            type : "signIn"
            },
            {
            date : new Date("October 15, 2014 11:13:00"),
            type : "signOut"
            }
        ]
   })
   try {
       await dummy.save();
       res.send("3azma")
   } catch (error) {
       res.send(error)
   }
})

module.exports=router;