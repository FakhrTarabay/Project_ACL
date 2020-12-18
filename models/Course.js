const mongoose = require('mongoose')

let courseSchema = new mongoose.Schema({
    name:{ 
            type: String, 
            required: true
    },
    instructors: {
            type: []
    },
    coordinator: {
            type: String
    },
    TAs: {
            type: []
    }
})

module.exports=mongoose.model('course', courseSchema)