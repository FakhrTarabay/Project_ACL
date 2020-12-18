const mongoose = require('mongoose')

let facultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    departments: {
        type: []
    }
})

module.exports=mongoose.model('faculty', facultySchema)