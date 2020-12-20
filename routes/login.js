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
            const newPassword = await bcrypt.hash(req.body.newPassword, salt)
            staff.update({email: req.body.email}, {password: newPassword})
            staff.update({email: req.body.email}, {loggedInBefore: true})
        }
        else {
            const correctPass= await bcrypt.compare(req.body.password, staff.password)
            if(correctPass){
                try{
                    const token = jwt.sign({id: staff.id}, process.env.TOKEN_SECRET, {expiresIn: '1d'})
                    console.log('passeddd')
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
})

module.exports = router;

