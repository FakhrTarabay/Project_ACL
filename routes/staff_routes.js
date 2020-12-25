const staffMember = require('../models/StaffMember')
const requests = require('../models/Request')
const blocklist = require('../models/tokens')
const requestModel = require('../models/Request')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

router.use(async (req,res,next)=> {
    try {
        const token = req.user.id
        next()
        
    } catch (error) {
        res.send("Please log in first!")
        res.end();
    }
})

router.route('/signIn')
.post(async (req,res)=> {
    const staff = await staffMember.findOne({id: req.user.id})
    if(staff){
        const date = new Date()
        date.setHours(date.getHours()+2)
        console.log(date.getHours())
        if(date.getHours() < 9){
            staff.attendanceRecords.push({date: date.setHours(9,0,0), type: 'signIn'})
            console.log("roro")
            await staffMember.update({id: req.user.id}, {attendanceRecords: staff.attendanceRecords, $sort : {date : 1}})
            res.send('Signed in but at 7am!')
        }
        else if(date.getHours() >= 21)
            res.send('Its after 7pm!')
        else{
            staff.attendanceRecords.push({date: date.setHours(date.getHours()), type: 'signIn'})
            console.log("roro1")
            await staffMember.update({id: req.user.id}, {attendanceRecords: staff.attendanceRecords, $sort : {date : 1}})
            res.send('Signed in!')
        }
    }
})

router.route('/signout')
.post(async (req,res)=> {
        const date = new Date()
        console.log(date.getHours())
        if(date.getHours() < 19){
            var staff = await staffMember.findOne({id: req.user.id})
            if(staff){
                staff.attendanceRecords.push({date: date.setHours(date.getHours()+2), type: 'signOut'})
                await staffMember.update({id: req.user.id}, {attendanceRecords: staff.attendanceRecords, $sort : {date : 1}})
                res.send('Signed out!')
            }
        }
        else {
            var staff = await staffMember.findOne({id: req.user.id})
            if(staff){
                staff.attendanceRecords.push({date: date.setHours(21,0,0), type: 'signOut'})
                await staffMember.update({id: req.user.id}, {attendanceRecords: staff.attendanceRecords, $sort : {date : 1}})
                res.send('Signed out but at 7pm!')
            }
        }
})

router.route('/viewProfile')
.get(async (req,res)=> {
    try{
        const staff = await staffMember.findOne({id: req.user.id},{password : 0,_id :0})
        res.send(staff)
    }
    catch(error){
        res.send('error')
    }    
})

router.route('/logOut')
.post(async (req,res)=> {
    const blockedToken = new blocklist({
        header: req.headers.token
    })
    await blockedToken.save()
    res.send("Logged Out!")
})

router.route('/updatePassword')
.post(async (req,res)=> {
    const staff = await staffMember.findOne({id: req.user.id})
    if(staff){
        const salt = await bcrypt.genSalt(10)
        const newPassword = await bcrypt.hash(req.body.password, salt)
        await staffMember.update({id: req.user.id}, {password: newPassword})
        res.send('Password changed!')
    }
})

router.route('/update')
.post(async (req,res)=> {
    const staff = await staffMember.findOne({id: req.user.id})
    if(req.body.updates.email){
        const newEmail = await staffMember.findOne({email: req.body.updates.email})
        if(!newEmail){
            await staffMember.update({id: req.user.id}, {email: req.body.updates.email.concat('@staff.guc.edu.eg')})  
            res.send('Email updated!')
        }
    }
    if(req.body.updates.office){
        const validOffice = await locationModel.findOne({$and : [
            {location : req.body.office}, 
            {type : 'Office'},
            {$expr : {
                $gt : ["$maxCapacity","$currentCapacity"]
            }}
        ]})
        if(validOffice){
            await staffMember.update({id:req.user.id}, {office: req.body.updates.office})
            res.send('Office updated!')
        }
        else{
            res.send(`Location ${req.body.office} is either full or not an Office`)
        }
    }
    if(req.body.updates.extraInfo){
        await staffMember.update({id:req.user.id}, {extraInfo : req.body.updates.extraInfo})
        res.send('Extra info updated!')
    }
})

router.route('/viewAttendance')
.get(async (req,res)=> {
    const staff = await staffMember.findOne({id:req.user.id})
    if(staff){
        if(req.body.month){
            const startDate = new Date(req.body.year,req.body.month-1,11,2,0,0);
            let endYear = req.body.year 
            const endDate = new Date(endYear,req.body.month,10,2,0,0);
            const checkedMonth = attendanceRange(startDate, endDate, staff.attendanceRecords)
            try{
                res.send(checkedMonth)
            }
            catch(error){
                console.log('Enter a valid month')
            }
        }
        else{
            res.send(staff.attendanceRecords)
        }
    }
})

function getStartEndDate(month){
    const currentDate = new Date()
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
    const startDate = new Date(startYear,startMonth,startDay,2,0,0);
    const endDate = new Date(endYear,endMonth,endDay,2,0,0);
    return {startDate, endDate}
}

function attendanceRange(startDate, endDate, records){
    let out = []
    for(let i =0;i<records.length;i++){
        if(records[i].date.getTime() >= startDate.getTime() && records[i].date.getTime() < endDate.getTime())
            out.push(records[i])
    }
    return out;
}

router.route('/viewMissingDays')
.get(async (req,res)=> {
    const output = []
    const staff = await staffMember.findOne({id: req.user.id})
    const leaves = await requests.findOne({sender: req.user.id, status: "Accepted"})
    const startEndDates = getStartEndDate()
    const staffMemberRecords = (await staffMember.find({id:req.user.id},{id : 1, attendanceRecords : 1, name : 1, dayOff : 1, _id : 0})).map(function (member){
    member.attendanceRecords = member.attendanceRecords.filter(function (record) {
        return (record.date.getTime() >= startEndDates.startDate.getTime() && record.date.getTime() < startEndDates.endDate.getTime())
        })
        return member.attendanceRecords;
    })
    let leavesRecords = await requestModel.find({
        sender : staff.id,
        type : {$in : ['Annual Leaves', 'Sick Leaves', 'Accidental Leaves', 'Maternity Leaves', 'Compensation Leaves']},
        status : "Accepted"
    })
    missingDaysHours = missingDays_missingHours_extraHours(staffMemberRecords[0],leavesRecords,staff.dayOff,startEndDates.startDate,startEndDates.endDate)
    if (missingDaysHours.missingDays.length > 0 || missingDaysHours.missingHours > 0){
        output.push(({id : staff.id, name : staff.name, missingDays : missingDaysHours.missingDays}))
    }
    res.send(output)
})

router.route('/viewMissingExtraHours')
.get(async (req,res)=> {
    let output = []
    const staff = await staffMember.findOne({id: req.user.id})
    const startEndDates = getStartEndDate()
    const staffMemberRecords = (await staffMember.find({id:req.user.id},{id : 1, attendanceRecords : 1, name : 1, dayOff : 1, _id : 0})).map(function (member){
        member.attendanceRecords = member.attendanceRecords.filter(function (record) {
            return (record.date.getTime() >= startEndDates.startDate.getTime() && record.date.getTime() < startEndDates.endDate.getTime())
            })
        return member.attendanceRecords;
    })
    let leavesRecords = await requestModel.find({
        sender : staffMemberRecords.id,
        type : {$in : ['Annual Leaves', 'Sick Leaves', 'Accidental Leaves', 'Maternity Leaves', 'Compensation Leaves']},
        status : "Accepted"
    })
    missingHours = missingDays_missingHours_extraHours(staffMemberRecords[0],leavesRecords,staff.dayOff,startEndDates.startDate,startEndDates.endDate)
    if (missingHours.missingDays.length > 0 || missingHours.missingHours > 0){
        output.push(({id : staff.id, name : staff.name, missingHours : missingHours.missingHours , extraHours :missingHours.extraHours}))
    }
    res.send(output)
})

// return 1 -> date_One > date_Two , 0 -> date_One = date_Two, -1 -> date_One < date_Two
function compareDates(date_One,date_Two){
    if (date_One.getFullYear() > date_Two.getFullYear())
        return 1;
    else if (date_One.getFullYear() < date_Two.getFullYear())
        return -1;    
    else{
        if (date_One.getMonth() > date_Two.getMonth())
            return 1;
        else if (date_One.getMonth() < date_Two.getMonth())
            return -1;
        else {
            if (date_One.getDate() > date_Two.getDate())
                return 1;
            else if (date_One.getDate() < date_Two.getDate())
                return -1;
            else
                return 0;        
        }        
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
        // dEnd = new Date(dStart)
        // dEnd.setHours(25,59,59)
        // dStart.setHours(3,0,0)
        dayWeek = dStart.getDay() // 0 -> sunday , 6 -> saturday
        dayAttendance = records.filter(function (record) {
            // return record.date.getTime() >= dStart.getTime() && record.date.getTime() <= dEnd.getTime()
            return (compareDates(record.date,dStart) == 0)            
        })
        dayLeaves = leaves.filter(function (leave) {
            // return dStart.getTime() >= leave.startDate.getTime() && dStart.getTime() < leave.endDate.getTime()
            return (compareDates(dStart,leave.startDate) >= 0 && compareDates(dStart,leave.endDate) <= 0)
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
                if (dayWeek == dayOff 
                    && !compensationDates.map(function (leave){
                        // return leave.getTime() == dStart.getTime()
                        return compareDates(leave,dStart) == 0
                    })){
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

module.exports = router;