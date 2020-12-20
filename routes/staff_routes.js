const staffMember = require('../models/StaffMember')
const requests = require('../models/Request')
const blocklist = require('../models/tokens')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

router.route('/signin')
.post(async (req,res)=> {
    const token = await blocklist.findOne({header: req.header.token})
    if(!token){
        const staff = await staffMember.findOne({id: req.user.id})
        if(staff){
            staff.attendanceRecords.push({date: Date.now(), type: 'signIn'})
            await staffMember.update({id: req.user.id}, {attendanceRecords: staff.attendanceRecords})
            res.send('Signed in!')
        }
    }
    else{
        res.status(401).send("Please log in first")
    }
})

router.route('/signout')
.post(async (req,res)=> {
    const token = await blocklist.findOne({header: req.header.token})
    if(!token){
        const staff = await staffMember.findOne({id: req.user.id})
        if(staff){
            staff.attendanceRecords.push({date: Date.now(), type: 'signOut'})
            await staffMember.update({id: req.user.id}, {attendanceRecords: staff.attendanceRecords})
            res.send('Signed out!')
        }
    }
    else {
        res.status(401).send("Please log in first")
    }
})

router.route('/viewProfile')
.get(async (req,res)=> {
    const token = await blocklist.findOne({header: req.header.token})
    if(!token){
        const staff = await staffMember.findOne({id: req.user.id})
        res.send(staff)
    }
    else {
        res.send("Please log in first!")
    }
})

router.route('/logOut')
.post(async (req,res)=> {
    const token = req.headers.token
    const blocks = blocklist
    await blocklist.create({header: token})
    res.send("Logged Out!")
})

router.route('/updatePassword')
.post(async (req,res)=> {
    const token = await blocklist.findOne({header: req.header.token})
    if(!token){
        const staff = await staffMember.findOne({id: req.user.id})
        if(staff){
            const salt = await bcrypt.genSalt(10)
            const newPassword = await bcrypt.hash(req.body.newPassword, salt)
            staff.update({id: req.user.id}, {password: newPassword})
            console.log(staff.password)
            res.send('Password changed!')
        }
    }
    else {
        res.status(401).send("Please log in first")
    }
})

router.route('/update')
.post(async (req,res)=> {
    const token = await blocklist.findOne({header: req.header.token})
    if(!token){
        const staff = await staffMember.findOne({id: req.user.id})
        if(req.body.updates.email){
            const newEmail = await staffMember.findOne({email: req.body.updates.email})
            if(!newEmail){
                await staffMember.update({id: req.user.id}, {email: req.body.updates.email.concat('@staff.guc.edu.eg')})  
                console.log(staff.email)
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
    }
    else {
        res.status(401).send("Please log in first")
    }
})

router.route('/viewAttendance')
.get(async (req,res)=> {
    const token = await blocklist.findOne({header: req.header.token})
    if(!token){
        const staff = await staffMember.findOne({id:req.user.id})
        if(staff){
            if(req.body.month){
                const date = await staff.attendanceRecords
                const checkedMonth = checkMonth(date,req.body.month)
                try{
                res.send(checkedMonth)
                }
                catch(error){
                    console.log('error')
                }
            }
            else{
                res.send(staff.attendanceRecords)
            }
        }
    }
    else {
        res.status(401).send("Please log in first")
    }
})

/////checks the attendance records with on emonth starting from 0 and the other from 1
function checkMonth(dateArray, requiredMonth){
    const out = [];
    for(let x = 0; x < dateArray.length; x++){
        if(dateArray[x].date.getMonth() == requiredMonth-1){
            out.push(dateArray[x])
        }
    }
    return out;
}

function getStartEndDate(){
    const currentDate = new Date()
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    let startDay = 11;
    let startMonth;
    let startYear;
    let endDay = 11;
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
    const startDate = new Date(startYear,startMonth,startDay);
    const endDate = new Date(endYear,endMonth,endDay);
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
    const token = await blocklist.findOne({header: req.header.token})
    if(!token){
        const staff = await staffMember.findOne({id: req.user.id})
        const startEnd = getStartEndDate()
        var startDate = startEnd.startDate
        const endDate = startEnd.endDate
        const monthRecords = attendanceRange(startDate, endDate, staff.attendanceRecords)
        console.log(monthRecords)
        const dayAndType = []
        monthRecords.forEach(function (record,index) {
            dayAndType.push({dayWeek: record.date.getDay(), dayMonth: record.date.getDate(), type: record.type})
        })
        console.log(dayAndType)
        const missingDays = []
        var trackOfDay = 11;
        const startMonth = startDate.getMonth()
        const startDay = startDate.getDay()
        console.log(startDate.getDate())
        for(let i = 0; i < 5; i++){
            let k=0
            if(i == 0){
                k = startDay
            }
            for(j = k; j < 7; j++){
                if(j == staff.dayOff || j == 5){

                }
                else{
                    if(!signout(dayAndType,trackOfDay) || !signIn(dayAndType,trackOfDay)){
                        missingDays.push({day: trackOfDay});
                    }
                }
                if((startMonth % 2 == 0 && startMonth <= 6) || (startMonth % 2 == 1 && startMonth >=7)){
                    if(trackOfDay == 31)
                        trackOfDay = 0
                }
                else if((startMonth % 2 == 1 && startMonth <= 6 && startMonth != 1) || (startMonth % 2 == 0 && startMonth >= 7)){
                    if(trackOfDay == 30)
                        trackOfDay = 0
                }
                else if(startMonth == 1){
                    if(startDate.getFullYear % 4 == 0){
                        if(trackOfDay == 29){
                            trackOfDay = 0
                        }
                    }
                    else if(trackOfDay == 28){
                        trackOfDay = 0
                    }
                }
                trackOfDay++
            }
        }
        res.send(missingDays)
    }
    else {
        res.status(401).send("Please log in first")
    }
})

function signIn(array, day){
    for(let i=0;i<array.length-1;i++){
        if(array[i].dayMonth == day){
            return array[i].dayMonth
        }
    }
}

function signout(array, day){
    for(let i=0;i<array.length-1;i++){
        if(array[i].dayMonth == day){
            return array[i+1].dayMonth
        }
    }
}

router.route('/viewMissingExtraHours')
.get(async (req,res)=> {
    const token = await blocklist.findOne({header: req.header.token})
    console.log(token)
    if(!token){
        const staff = await staffMember.findOne({id: req.user.id})
        const startEnd = getStartEndDate()
        const startDate = startEnd.startDate
        console.log(startDate)
        const endDate = startEnd.endDate
        const monthRecords = attendanceRange(startDate, endDate, staff.attendanceRecords)
        const signInANDOut = []
        for(let i=0;i<7;i++){
            if(i == staff.dayOff || i == 5){

            }
            else
                if(!isEmpty(mostRecentSignIn(monthRecords,i)) && !isEmpty(mostRecentSignOut(monthRecords,i)))
                signInANDOut.push({recentSignIn: mostRecentSignIn(monthRecords,i), recentSignOut: mostRecentSignOut(monthRecords, i)})
        }
        const missingHours = getMissingHours(signInANDOut)
        const extraHours = getExtraHours(signInANDOut)
        if(missingHours - extraHours > 0)
            res.send("Missing Hours: " + `${missingHours - extraHours}`)
        else 
            res.send("Extra Hours: " + `${extraHours - missingHours}`)
    }
    else {
        res.status(401).send("Please log in first")
    }
})

function isEmpty(obj) {
    for(var prop in obj) {
      if(obj.hasOwnProperty(prop)) {
        return false;
      }
    }
    return JSON.stringify(obj) === JSON.stringify({});
  }

function getMissingHours(records){
    var missinghours = 0
    for(let i = 0; i < records.length; i++){
        if(!isEmpty(records[i].recentSignIn && !isEmpty(records[i].recentSignOut))){
            var timenow = (records[i].recentSignOut.date.getTime() - records[i].recentSignIn.date.getTime()) / (60000)
        }
        if(timenow < 504){
            missinghours += (504 - timenow)
        }
    }
    return missinghours
}

function getExtraHours(records){
    var extrahours = 0
    for(let i = 0; i < records.length; i++){
        if(!isEmpty(records[i].recentSignIn && !isEmpty(records[i].recentSignOut))){
            var timenow = (records[i].recentSignOut.date.getTime() - records[i].recentSignIn.date.getTime()) / (60000)
        }
        if(timenow > 504){
            extrahours += (timenow - 504)
        }
    }
    return extrahours
}

function mostRecentSignIn(records, day){
    var recentSignIn ={};
    for(let i = 0; i < records.length; i++){
        if(records[i].date.getDay() == day){
                if(records[i].type == 'signIn'){
                    recentSignIn = records[i]
                }
                if(records[i].type == 'signOut'){
                    return recentSignIn
                }
        }
    }
    return recentSignIn
}

function mostRecentSignOut(records, day){
    var recentSignOut = {};
    for(let i = 0; i < records.length-1; i++){
        if(records[i].date.getDay() == day){
            if(records[i].type == 'signOut'){
                recentSignOut = records[i]
            }
            if(records[i+1].type == 'signIn'){
                return recentSignOut
            }
        }
    }
    return recentSignOut
}


module.exports = router;