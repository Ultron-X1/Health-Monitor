require("dotenv").config();

console.log(process.env.MONGODB_URI);

const express = require("express");

const mongoose = require("mongoose");
const path = require("path");




// Import User Model
let currentPatient = null;
const User = require("./models/user");
const HealthData = require("./models/healthData");

const app = express();


// ===============================
// MongoDB Connection
// ===============================
console.log(process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
});

// ===============================
// Middleware
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// Latest Sensor Data
// ===============================
let latest = {
    heartRate: null,
    spo2: null,
    systolicBP: null,
    diastolicBP: null,
    glucose: null,
    temperature: null,
    status: "Waiting for data...",
    timestamp: ""
};

// ===============================
// Chart History
// ===============================
let history = {
    labels: [],
    heartRate: [],
    spo2: [],
    glucose: [],
    temperature: []
};

// ===============================
// Home Page
// ===============================
// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// ===============================
// Dashboard Page
// ===============================
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});



// =====================================
// LOGIN (Doctor & Patient)
// =====================================
app.post("/api/login", async (req, res) => {

    try {

        console.log(req.body);   // <-- ADD THIS HERE

        const { loginType } = req.body;

        // Doctor Login
        if (loginType === "doctor") {

            if (
                req.body.doctorId === "DOCTOR001" &&
                req.body.password === "Admin123"
            ) {

                return res.json({
                    success: true,
                    role: "doctor"
                });

            }

            return res.status(401).json({
                success: false,
                message: "Invalid Doctor ID or Password"
            });

        }

        // Patient Login
        // Patient Login
const { email, phone } = req.body;

console.log("Email received:", email);
console.log("Phone received:", phone);

const user = await User.findOne({
    email,
    phone
});

console.log("User found:", user);

if (!user) {
    return res.status(401).json({
        success: false,
        message: "Invalid Email or Phone Number"
    });
}

app.post("/api/device/connect", (req, res) => {

    const { userId } = req.body;

    currentPatient = userId;

    console.log("Device connected to:", currentPatient);

    res.json({
        success: true,
        message: "Device connected successfully"
    });

});


// =====================================
// GET ALL PATIENTS
// =====================================
app.get("/api/users", async (req, res) => {

    try {

        const users = await User.find().sort({ createdAt: -1 });

        res.json(users);

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

// =====================================
// REGISTER NEW PATIENT
// =====================================
app.post("/api/users", async (req, res) => {

    try {

        const {
            fullName,
            age,
            gender,
            email,
            phone,
            address,
            emergencyContact,
            medicalCondition
        } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const user = new User({
            fullName,
            age,
            gender,
            email,
            phone,
            address,
            emergencyContact,
            medicalCondition
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "Registration Successful",
            user
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ======================================================
// RECEIVE SENSOR DATA FROM ESP8266
// ======================================================
app.post("/data", async(req,res)=>{

try{


console.log("Received Sensor Data:");
console.log(req.body);


// Save patient health data

const data = new HealthData({

userId: currentPatient,

heartRate:Number(req.body.heartRate),

spo2:Number(req.body.spo2),

systolicBP:Number(req.body.systolicBP),

diastolicBP:Number(req.body.diastolicBP),

glucose:Number(req.body.glucose),

status:req.body.status || "NORMAL"

});


await data.save();



// Update latest display

latest = {

heartRate:data.heartRate,

spo2:data.spo2,

systolicBP:data.systolicBP,

diastolicBP:data.diastolicBP,

glucose:data.glucose,

status:data.status,

timestamp:new Date().toLocaleString()

};



res.json({

success:true,

message:"Sensor Data Saved"

});


}
catch(error){

console.log(error);


res.status(500).json({

success:false,

message:error.message

});


}


});
// ======================================================
// GET LATEST SENSOR DATA
// ======================================================
app.get("/api/latest", (req, res) => {

    res.json(latest);

});

// ======================================================
// GET SENSOR HISTORY
// ======================================================
app.get("/api/history", (req, res) => {

    res.json(history);

});

// ======================================================
// HEALTH CHECK
// ======================================================
app.get("/health", (req, res) => {

    res.json({

        server: "Running",

        database: mongoose.connection.readyState === 1
            ? "Connected"
            : "Disconnected",

        uptime: process.uptime(),

        latestReading: latest.timestamp

    });

});

// ======================================================
// 404
// ======================================================
app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Route Not Found"

    });

});

// ======================================================
// START SERVER
// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(`🚀 Server Running on Port ${PORT}`);

});
