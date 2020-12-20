const express=require('express');
const app=express();
const login_route = require('./routes/login')
const hr_routes = require('./routes/hr_routes')
const blocklist = require('./models/tokens')
const staff_routes = require('./routes/staff_routes')
app.use(express.json());
const jwt=require('jsonwebtoken')
require('dotenv').config();

app.use('', login_route)

app.use(async(req,res,next)=>{
    const token=req.headers.token
    const checkedToken = await blocklist.findOne({header: token})
    console.log(token);
    console.log(await blocklist.findOne({header: token}))
    if(!checkedToken){
        const verified = jwt.verify(token,process.env.TOKEN_SECRET);
        console.log(verified);
        req.user=verified;
    }
    next();

})
app.use('', staff_routes)

app.use('', hr_routes)

//app.use()


module.exports.app=app; 
