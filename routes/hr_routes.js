const locationModel = require('../models/Location');
const express = require('express');
const router = express.Router();
require('dotenv').config();

router.route('/addLocation')
.post(async (req,res) =>{
     let locat = await locationModel.findOne({location: req.body.location}).then(console.log("hi"))
     if (locat){
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
            console.log('error');
            res.send(error);
        }
     }
});
module.exports=router;

