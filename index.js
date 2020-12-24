const{app} = require('./app')
const mongoose = require('mongoose')
const mongodb = require('mongodb');
const locM = require("./models/Location");
const depM = require("./models/Department");
const courseM = require("./models/Course");
const facM = require("./models/Faculty");
const schM = require("./models/Schedule");
const staffM = require("./models/StaffMember");
const reqM = require("./models/Request");
// require('dotenv').config() //in order to be able to read the .env
// mongoose.connect(process.env.DB_URL,{useNewUrlParser: true, useUnifiedTopology: true}).then(console.log("pass"))
// mongoose.set('useNewUrlParser', true);
// mongoose.set('useFindAndModify', false);
// mongoose.set('useCreateIndex', true); 
// app.listen(process.env.PORT)


// mongoose.connect('mongodb://localhost/ACL');
// mongoose.connection.once('open',function(){
//     console.log("success");
// })
// mongoose.connection.on('error',function(error){
//     console.log(error);
// })
const MongoClient= require('mongodb').MongoClient;
const { EDESTADDRREQ } = require('constants');
const url= 'mongodb://localhost/ACL'
// MongoClient.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
//     console.log("Connected correctly to server");
//     const db= client.db('ACL')
//     db.createCollection('Course');
//     db.createCollection('Department');
//     db.createCollection('Faculty');
//     db.createCollection('Location');
//     db.createCollection('Schedule');
//     db.createCollection('staffMember', (err, result)=>{
//     client.close();
//     })
//     });
mongoose.connect(url, { useNewUrlParser: true,
    useUnifiedTopology: true }).then( ()=>console.log('mongoDB connected'))
    .catch(err => console.log(err));
// let entry = new reqM({
//     type:'Slot Linking',
//     sender:'6',
//     receiver:'4',
//     status:'Pending',
//     schedule_ID:'5fe352a64649d5152c31ee66'
//     })
//     entry.save()
// .then(doc => {
// console.log(doc)
// }).catch(err => {
//     console.error(err)
//     })
async function maybe() {
  // try{
  //   const slot = await schM.findOne({_id:req.body._id});
  //   const course = await courseM.findOne({name:slot.course});
  //   const course2 = await courseM.findOne({name:req.body.courseName});
  //   if((course2.coordinator!=course.coordinator)||req.user.id!=course.coordinator||req.user.id!=course2.coordinator){
  //     res.send("you are not a coordinator in one of the courses")
  //     return ;
  //   }
  //   const arr = [];
  //   if(req.body.courseName!=null){arr.push(req.body.courseName)}else{arr.push(slot.course)};
  //   if(req.body.day!=null){arr.push(req.body.day)}else{arr.push(slot.day)};
  //   if(req.body.slot!=null){arr.push(req.body.slot)}else{arr.push(slot.slot)};
  //   if(req.body.location!=null){arr.push(req.body.location)}else{arr.push(slot.location)};
  //   if (
  //     await schM.findOne({$and:[{ location: arr[3] },{ slot: arr[2] },{ day:arr[1] },{course:arr[0]}]})!=null
  //   ){
  //     res.send("This slot is already occupied");
  //   }else {
  //     try{
  //     await slot.update({$set:{location:arr[3],slot:arr[2],day:arr[1],course:arr[0]}});
  //     }catch(err){
  //       res.send(err);
  //     }
  //   }}catch(err){
  //     res.send(err);
  //   }

}
  maybe();
    //   }).then(doc=>{
    //       if(doc.length==0){
    //           console.log("There are no results");
    //       }else{
    //       console.log(doc)}
    //   }).catch(err => {
    //         console.error(err+'iin')
    //         })