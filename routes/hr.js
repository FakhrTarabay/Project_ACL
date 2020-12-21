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
const requestModel = require('../models/Request')
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
    try {
        foundLocation = await locationModel.findOne({location : req.body.updates.location})
        if (foundLocation){
            res.send("this location is already in use")
        }
        else {
            const prevLocation = await locationModel.findOne({location : req.body.location})
            if (req.body.updates.maxCapacity < prevLocation.currentCapacity){
                res.send("new Maximum Capacity is smaller than the current capacity!")
            }
            else{
                await locationModel.findOneAndUpdate({location : req.body.location},req.body.updates)
                if (prevLocation){
                    if (req.body.updates.location){
                        await scheduleModel.updateMany({location : req.body.location},{location : req.body.updates.location})
                        await staffModel.updateMany({office : req.body.location},{office : req.body.updates.location})
                    }
                    res.send("Successful location update!")
                }   
                else
                    res.send("There is no Location with the given name")    
            }
        }
    }
    catch (error) {
        res.send(error)
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

router.route('/deleteFaculty')
.post(async (req,res) =>{
    try {
        const deletedFaculty = await facultyModel.findOneAndDelete({name : req.body.name})
        if (deletedFaculty){
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
    try {
        const prevFaculty = await facultyModel.findOneAndUpdate({name : req.body.name},req.body.updates)
        if (!prevFaculty)
            if (req.body.updates.name){
                await staffModel.updateMany({faculty : req.body.name},{faculty : req.body.updates.name})
                res.send("faculty updated successfuly!")
        }
        else
            res.send("There is no faculty with the given name")    
    } catch (error) {
        res.send(error)    
    }
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.route('/addDepartment')
.post(async (req,res) =>{
    try {
        const foundFaculty = await facultyModel.findOne({name : req.body.faculty})
        if (!foundFaculty){
            res.send(`There is no such Faculty called ${req.body.faculty}!`)
            res.end() 
        }
        const foundDepartment = await departmentModel.findOne({name : req.body.name})
        if (!foundDepartment){
            const newDepartment = departmentModel({
                name : req.body.name
            })
            await newDepartment.save()
        }
        await facultyModel.update({name : req.body.faculty},
            {$addToSet : 
                {departments : req.body.name}
            })
        res.send(`Department ${req.body.name} is added to Faculty ${req.body.faculty}`)     
         
    } catch (error) {
        res.send(error)
    }
})

router.route('/updateDepartment')
.post(async (req,res) =>{
    try {
        const foundFaculty = await facultyModel.findOne({name : req.body.facultyName , departments : [req.body.name]})
        if (foundFaculty){
            const prevDepartment =await departmentModel.findOneAndUpdate({name : req.body.name},req.body.updates)
            if (prevDepartment){
                if (req.body.updates.name){
                    await staffModel.updateMany({department : req.body.name},{department : req.body.updates.name})
                    await facultyModel.findOneAndUpdate({name : req.body.facultyName},{$addToSet : {departments : req.body.updates.name}})
                    await facultyModel.findOneAndUpdate({name : req.body.facultyName},{$pull : {departments : {$in : [req.body.name]}}})
                }
                if (req.body.updates.HOD){
                    await staffModel.updateOne({id : req.body.updates.HOD}, {$addToSet : {role : "HOD"}})    
                }
                res.send(`Department ${req.body.name} unber faculty ${req.body.facultyName} updated successfully!`)
            }
            else
                res.send(`There is no department called ${req.body.name}`)
        }
        else 
            res.send(`There is no department called ${req.body.name} under a faculty called ${req.body.facultyName}`)
        
    } catch (error) {
        res.send(error)
    }
})

router.route('/deleteDepartments')
.post(async (req,res)=>{
    try {
        await facultyModel.update({name : req.body.faculty} , 
            {$pull: {departments : {$in : req.body.departments}}},{ multi: true})                
        const staffMembers  = (await staffModel.find({department : {$in : req.body.departments}},{id : 1, _id : 0})).map(function (staff) {
            return staff.id;
          });
        const courses = (await departmentModel.find({name : {$in : req.body.departments}},{courses : 1,_id : 0})).map(function (obj){
            return obj.courses[0];
        })
        await staffModel.updateMany({faculty : req.body.faculty, department : {$in : req.body.departments}},{department : null})
        await scheduleModel.updateMany({course : {$in : courses}, academicMember : {$in : staffMembers}},{academicMember : null})
        await courseModel.updateMany({name : {$in : courses}}, {$pull :{
            instructors : {$in : staffMembers},
            TAs : {$in : staffMembers},
            coordinator : {$in : staffMembers}}})
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
        const foundDepartment =  await departmentModel.findOne({name : req.body.department})  
        if (foundDepartment){
            if (!foundCourse){
                const newCourse  = new courseModel({
                    name : req.body.name
                })
                await newCourse.save()
            }
            await departmentModel.findOneAndUpdate(
                {name : req.body.department}, 
                {$addToSet : {courses : req.body.name}
            })    
            res.send(`Course ${req.body.name} is addedd successfully to department ${req.body.department}`)
        }
        else
            res.send(`There is no Department called ${req.body.department}!`)                
    } catch (error) {
        res.send(error)        
    }
})

router.route('/updateCourse')
.post(async (req,res) => {
    try {
       const foundDepartment = await departmentModel.find({name : req.body.departmentName , courses : [req.body.courseName]})
       if (foundDepartment){
            const prevCourse = await courseModel.findOneAndUpdate({name : req.body.courseName},req.body.updates)
            if (prevCourse && req.body.updates.name){
                await scheduleModel.findOneAndUpdate({course : req.body.courseName},{course : req.body.updates.name})
                await departmentModel.updateOne({name : req.body.departmentName},{$pull : {courses :{ $in : [req.body.courseName]}}})
                await departmentModel.updateOne({name : req.body.departmentName},{$addToSet : {courses : req.body.updates.name}})
                res.send(`Course ${req.body.courseName} in department ${req.body.departmentName} updated successfully!`)
            }
            else
            res.send(`There is no course called ${req.body.courseName}`)
       }
       else
            res.send(`There is no course called ${req.body.courseName} under department ${req.body.departmentName}`)    
    } catch (error) {
        res.send(error)
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
        await departmentModel.update({name : req.body.department} , {$pull: {courses : {$in : req.body.courses}}},{ multi: true})
        const staffMembers = await staffModel.find({department : req.body.department}, {id : 1,_id : 0}).map(function (staff) {
            return staff.id;
          });
        await courseModel.updateMany({name : {$in : req.body.courses}}, {$pull :{
            instructors : {$in : staffMembers},
            TAs : {$in : staffMembers},
            coordinator : {$in : staffMembers}
        }},{ multi: true})
        await scheduleModel.updateMany({course : {$in : req.body.courses},academicMember : {$in : staffMembers}},{academicMember : null})
        res.send("Courses deleted successfully")
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
    if (req.body.id.localeCompare(req.user.id)==0){
        res.send("Sorry, you are not allowed to update your own Attendance!")
    }
    else {
       try {
           const foundStaff = await staffModel.findOne({id : req.body.id})
           if (!foundStaff){
               res.send(`There is no staff member with ID ${req.body.id}`)
               res.end()
           }
           await staffModel.update({id : req.body.id},
                {$push :{
                    attendanceRecords : {
                        $each :  req.body.newAttendanceRecords,
                        $sort : {date : 1}
                    }
                }
            })
            res.send("Attendance updated successfully!")
       } catch (error) {
           res.send(error)
       } 
    }
})

function getStartEndDates() {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    let startDay = 11;
    let startMonth;
    let startYear;
    let endDay = 10;
    let endMonth;
    let endYear;
    if (currentDay >= 11){
        startMonth = currentMonth
        startYear = currentYear
        if (startMonth == 11){
   	    	endMonth = 0
        	endYear = currentYear + 1
        }
        else {
   	  	    endMonth = currentMonth + 1
      	    endYear = currentYear
        }
    }
    else {
	    endYear = currentYear
  	    endMonth = currentMonth
  	    if (endMonth == 0){
    	    startMonth = 11
      	    startYear = currentYear - 1
        }
  	    else {
    	    startMonth = currentMonth - 1
      	    startYear = currentYear
        }
    }
    return {
        startDate : new Date(startYear,startMonth,startDay,2,0,0),
        endDate : new Date(endYear,endMonth,endDay,2,0,0)
    }
}

function missingDays_missingHours_extraHours(records, leaves, dayOff, startDate, endDate){
    let missingDays = [];
    let dEnd, dayAttendance, dayLeaves, dayWeek, signIn, signOut;
    let foundSignOut = false , attended = false;
    let attendanceTime = 0 ,missingHours = 0, extraHours = 0;
    
    let compensationDates = leaves.map(function (leave) {
        if (leave.type == "Compensation Leaves"){
            return leave.compensationDate
        }
    })
    for (dStart = new Date(startDate) ; dStart <= endDate; dStart.setDate(dStart.getDate() + 1)) {
        dEnd = new Date(dStart)
        dEnd.setHours(25,59,59)
        dayWeek = dStart.getDay() // 0 -> sunday , 6 -> saturday
        dayAttendance = records.filter(function (record) {
            return record.date.getTime() >= dStart.getTime() && record.date.getTime() <= dEnd.getTime()
        })
        dayLeaves = leaves.filter(function (leave) {
            return dStart.getTime() >= leave.startDate.getTime() && dStart.getTime() < leave.endDate.getTime()
        })

        for (let i = dayAttendance.length -1 ; i >= 0 ; i--){
            if (dayAttendance[i].type.localeCompare("signOut") == 0){
                foundSignOut = true;
                signOut = dayAttendance[i].date; 
            }
            if (foundSignOut && dayAttendance[i].type.localeCompare("signIn") == 0){
                signIn = dayAttendance[i].date;
                foundSignOut = false;
                attended = true;
                attendanceTime = signOut.getTime() - signIn.getTime();
                attendanceTime /= 60000
                if (dayWeek == dayOff && !compensationDates.map(function (leave){return leave.getTime() == dStart.getTime()})){
                    missingHours -= attendanceTime
                }
                else
                    missingHours += (504 - attendanceTime) 
            }
        }
        if (!attended && dayWeek != 5 && dayWeek != dayOff && dayLeaves.length == 0){
            missingDays.push(new Date(dStart))
        }
        foundSignOut = false;
        attended = false;
        signIn = null;
        signOut = null;
        attendanceTime = 0;             
    }  
    if (missingHours < 0){
        extraHours = (missingHours * -1)
        missingHours = 0
    }
    return {missingDays : missingDays , missingHours : missingHours , extraHours : extraHours}  
}

router.route('/viewMissingDaysHours')
.get(async (req,res) =>{
    try {
        let output = [];
        let missingDaysHours;
        let startEndDates = getStartEndDates()
        const staffMembersRecords = (await staffModel.find({},{id : 1, attendanceRecords : 1, name : 1, dayOff : 1, _id : 0})).map(function (member){
            member.attendanceRecords = member.attendanceRecords.filter(function (record) {
                return (record.date.getTime() >= startEndDates.startDate.getTime() && record.date.getTime() < startEndDates.endDate.getTime())
            })
            return member;
        })
        for (let i = 0 ; i < staffMembersRecords.length ; i++){
            let leavesRecords = await requestModel.find({
                sender : staffMembersRecords[i].id,
                type : {$in : ['Annual Leaves', 'Sick Leaves', 'Accidental Leaves', 'Maternity Leaves', 'Compensation Leaves']},
                status : "Accepted"
            })
            missingDaysHours = missingDays_missingHours_extraHours(staffMembersRecords[i].attendanceRecords,leavesRecords,staffMembersRecords[i].dayOff,startEndDates.startDate,startEndDates.endDate)
            if (missingDaysHours.missingDays.length > 0 || missingDaysHours.missingHours > 0){
                output.push(({id : staffMembersRecords[i].id, name : staffMembersRecords[i].name, missingDays : missingDaysHours.missingDays,
                     missingHours : missingDaysHours.missingHours , extraHours :missingDaysHours.extraHours}))
            }
        }
        res.send(output)
        } catch (error) {
            res.send(error)            
    }
})
        
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.route('/registerStaff')
.post(async (req,res) =>{
    try {
        if (req.body.name && req.body.salary  && req.body.office && req.body.dayOff && req.body.role){
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
            else if ((req.body.role.includes("HR") && validOffice) || (fouudFaculty && foundDepartment && validOffice)){
                const salt = await bcrypt.genSalt(10)
                const hashedPassword = await bcrypt.hash("123456",salt)
                let id;
                let idNumber = 1;
                if (req.body.role.includes("HR")){
                    idNumber += (await staffModel.find({role : {$in : ["HR"]}})).length
                    id = "hr-" + idNumber
                    req.body.dayOff = 6
                    console.log(1)
                }
                else{
                    idNumber += (await staffModel.find({role : {$in : ['HOD', 'Coordinator', 'Instructor', 'TA']}})).length
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
                if (req.body.role.includes("HOD")){
                    await departmentModel.updateOne({name : req.body.department},{HOD : id})
                }    
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
.post(async (req,res)=> {
    try {
        if (req.body.updates){
            if (req.body.updates.faculty){
                const foundFaculty = await facultyModel.findOne({name : req.body.updates.faculty})
                if (!foundFaculty){
                    res.send(`There is no faculty called ${req.body.updates.faculty}`)
                    res.end()
                }
            }
            if (req.body.updates.department){
                const foundDepartment = await departmentModel.findOne({name : req.body.updates.department})
                if (!foundDepartment){
                    res.send(`There is no department called ${req.body.updates.department}`)
                    res.end()
                }
            }
        }
        const staff = await staffModel.findOneAndUpdate({id : req.body.id}, req.body.updates)
        if (staff){
            if (staff.role.includes("HOD")){
                await departmentModel.findOneAndUpdate({HOD : staff.id},{HOD : null})
                await departmentModel.findOneAndUpdate({name : req.body.updates.department},{HOD : req.body.id})
            }
            res.send(`StaffMember with ID ${req.body.id} updated successfully`)
        }
        else 
            res.send(`${req.body.id} is not connected to any Staff Member!`)    
    } catch (error) {
        res.send(error)
    }
})

router.route('/deleteStaffMember')
.post(async (req,res) => {
    try { 
        const member = await staffModel.findOneAndDelete({id : req.body.staffMember})
        await scheduleModel.updateMany({academicMember : req.body.staffMember} , {academicMember : null})
        await courseModel.updateMany({},{$pull: { 
            instructors :  req.body.staffMember, 
            TAs: req.body.staffMember,
            coordinator :  req.body.staffMember}},
            {multi: true})
        await requestModel.deleteMany({$or : [
            {sender : req.body.staffMember},
            {receiver : req.body.staffMember}]})
        await locationModel.findOneAndUpdate({location : member.office},{$inc : {currentCapacity : - 1}})
        await departmentModel.findOneAndUpdate({HOD : member.id},{HOD : null})        
        res.send(`Staff member ${member.name} deleted successfully!`)
    } catch (error) {
        res.send(error)
    }
})
module.exports=router;