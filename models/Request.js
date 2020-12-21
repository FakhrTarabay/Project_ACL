const mongoose = require('mongoose')

let requestSchema = new mongoose.Schema({
    type: {
        type: String, 
        required: true,
        enum: ['Slot Linking', 'Replacement', 'Change dayoff', 'Annual Leaves', 'Sick Leaves', 'Accidental Leaves', 'Maternity Leaves', 'Compensation Leaves']
    },
    sender: {
        type: String, 
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    // the date on which the request was sent
    requestDate : {
        type : Date
    },
    status: {
        type: String,
        required: true,
        enum: ['Accepted', 'Rejected', 'Pending']
    },
    //start date of any leave,specified by the sender 
    startDate: {
        type: Date
    },
    // end date of any leave,specified by the receiver 
    endDate: {
        type: Date
    },

    //Sick and maternity leaves have duration of one month,
    // in case of compensation leave, this field will contain the date of the compensated  Date
    // make sure that startDate & compensationDate start at 12 AM!! ex: 2020-3-1 00:00:00
    compensationDate : {
        type : Date
    },
    comment: {
        type: String
    },
    schedule_ID : {
        type : String
    }
})

module.exports=mongoose.model('request', requestSchema);