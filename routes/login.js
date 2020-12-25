const staffMember = require('../models/StaffMember')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()


router.route('/login')
.post(async (req,res)=> {
    const staff = await staffMember.findOne({email: req.body.email})
    if(staff){
        if(!staff.loggedInBefore){
            const salt = await bcrypt.genSalt(10)
            const newPassword = await bcrypt.hash(req.body.password, salt)
            await staffMember.findOneAndUpdate({email: req.body.email}, {password: newPassword, loggedInBefore: true})
            const token = jwt.sign({id: staff.id, role: staff.role}, process.env.TOKEN_SECRET, {expiresIn: '1d'})
            console.log('passeddd')
            res.header('token', token).send(token)
        }
        else {
            const correctPass= await bcrypt.compare(req.body.password, staff.password)
            if(correctPass){
                try{
                    const token = jwt.sign({id: staff.id, role: staff.role}, process.env.TOKEN_SECRET, {expiresIn: '1d'})
                    console.log(staff.role)
                    res.header('token', token).send(token)
                }
                catch(error){
                    console.log('error')
                }
            }
            else {
                return res.status(401).send("Incorrect Password!")
            }
        }
    }
    else {
        res.send("Incorrect email!!")
    }
})

module.exports = router;

