require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

const User = require("./models/user");
const HealthData = require("./models/healthData");

let currentPatient = null;

// ===============================
// MongoDB
// ===============================

mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
    console.log("✅ MongoDB Connected");
})
.catch(err=>{
    console.log("MongoDB Error:",err);
});

// ===============================
// Middleware
// ===============================

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname,"public")));

// ===============================
// Latest Sensor Data
// ===============================

let latest={

heartRate:null,
spo2:null,
systolicBP:null,
diastolicBP:null,
glucose:null,
status:"Waiting...",
timestamp:""

};

let history=[];

// ===============================
// Pages
// ===============================

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"public","register.html"));
});

app.get("/dashboard",(req,res)=>{
    res.sendFile(path.join(__dirname,"public","dashboard.html"));
});

// ===============================
// Register Patient
// ===============================

app.post("/api/users",async(req,res)=>{

try{

const existing=await User.findOne({
email:req.body.email
});

if(existing){

return res.status(400).json({

success:false,
message:"Email already registered"

});

}

const user=new User(req.body);

await user.save();

res.status(201).json({

success:true,
message:"Registration Successful",
user

});

}
catch(err){

res.status(500).json({

success:false,
message:err.message

});

}

});

// ===============================
// Login
// ===============================

const DOCTOR={

id:"DOCTOR001",
password:"Admin123"

};

app.post("/api/login",async(req,res)=>{

try{

const {loginType}=req.body;

// Doctor

if(loginType==="doctor"){

if(

req.body.doctorId===DOCTOR.id &&
req.body.password===DOCTOR.password

){

return res.json({

success:true,
role:"doctor"

});

}

return res.status(401).json({

success:false,
message:"Invalid Doctor ID or Password"

});

}

// Patient

const {email,phone}=req.body;

console.log("Email:",email);
console.log("Phone:",phone);

const user=await User.findOne({

email,
phone

});

console.log(user);

if(!user){

return res.status(401).json({

success:false,
message:"Invalid Email or Phone Number"

});

}

res.json({

success:true,
role:"patient",
user

});

}
catch(err){

res.status(500).json({

success:false,
message:err.message

});

}

});

// ===============================
// Get Patients
// ===============================

app.get("/api/users",async(req,res)=>{

try{

const users=await User.find().sort({createdAt:-1});

res.json(users);

}
catch(err){

res.status(500).json({

success:false,
message:err.message

});

}

});

// ===============================
// Connect Device
// ===============================

app.post("/api/device/connect",(req,res)=>{

currentPatient=req.body.userId;

console.log("Connected Patient:",currentPatient);

res.json({

success:true,
message:"Device Connected"

});

});

// ===============================
// Receive Sensor Data
// ===============================

app.post("/data",async(req,res)=>{

try{

console.log(req.body);

const data=new HealthData({

userId:currentPatient,

heartRate:Number(req.body.heartRate),

spo2:Number(req.body.spo2),

systolicBP:Number(req.body.systolicBP),

diastolicBP:Number(req.body.diastolicBP),

glucose:Number(req.body.glucose),

status:req.body.status||"NORMAL"

});

await data.save();

latest={

heartRate:data.heartRate,
spo2:data.spo2,
systolicBP:data.systolicBP,
diastolicBP:data.diastolicBP,
glucose:data.glucose,
status:data.status,
timestamp:new Date().toLocaleString()

};

history.push(latest);

if(history.length>50){

history.shift();

}

res.json({

success:true,
message:"Data Saved"

});

}
catch(err){

console.log(err);

res.status(500).json({

success:false,
message:err.message

});

}

});

// ===============================
// Latest Reading
// ===============================

app.get("/api/latest",(req,res)=>{

res.json(latest);

});

// ===============================
// History
// ===============================

app.get("/api/history",(req,res)=>{

res.json(history);

});

// ===============================
// Health Check
// ===============================

app.get("/health",(req,res)=>{

res.json({

server:"Running",
database:mongoose.connection.readyState===1?"Connected":"Disconnected",
uptime:process.uptime(),
latestReading:latest.timestamp

});

});

// ===============================
// 404
// ===============================

app.use((req,res)=>{

res.status(404).json({

success:false,
message:"Route Not Found"

});

});

// ===============================
// Server
// ===============================

const PORT=process.env.PORT||3000;

app.listen(PORT,()=>{

console.log(`🚀 Server Running on ${PORT}`);

});
