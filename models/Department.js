const mongoose = require('mongoose')

let departmentSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        HOD: {
            type: String,
            required: true
        },
        courses: {
            type: []
        }  
})

module.exports=mongoose.model('department', departmentSchema)