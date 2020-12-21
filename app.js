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
    try {
        const token=req.headers.token
        const checkedToken = await blocklist.findOne({header: token})
        if(!checkedToken){
            console.log(token)
            const verified = jwt.verify(token,process.env.TOKEN_SECRET);
            req.user=verified;
        }
        next();
    } 
    catch (error) {
        res.send("Log in first!")    
    }

})
app.use('', staff_routes)

app.use('/HR/', hr_routes)

//app.use()


module.exports.app=app; 
