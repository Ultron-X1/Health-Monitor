const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

// Import User Model
const User = require("./models/user");

const app = express();

// ===============================
// MongoDB Connection
// ===============================
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
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// ======================================================
// REGISTER NEW PATIENT
// ======================================================
app.post("/api/users", async (req, res) => {

    try {

        const user = new User({

    fullName: req.body.fullName,
    age: req.body.age,
    gender: req.body.gender,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    emergencyContact: req.body.emergencyContact,
    medicalCondition: req.body.medicalCondition

});
        await user.save();

        res.status(201).json({

            success: true,
            message: "Patient Registered Successfully",
            user

        });

    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

});

// ======================================================
// GET ALL PATIENTS
// ======================================================
app.get("/api/users", async (req, res) => {

    try {

        const users = await User.find().sort({ createdAt: -1 });

        res.json(users);

    } catch (error) {

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

});

// ======================================================
// RECEIVE SENSOR DATA FROM ESP8266
// ======================================================
app.post("/data", (req, res) => {

    console.log("Received Sensor Data:");

    console.log(req.body);

    latest = {

        heartRate: Number(req.body.heartRate),

        spo2: Number(req.body.spo2),

        systolicBP: Number(req.body.systolicBP),

        diastolicBP: Number(req.body.diastolicBP),

        glucose: Number(req.body.glucose),

        temperature: Number(req.body.temperature),

        status: req.body.status || "NORMAL",

        timestamp: new Date().toLocaleString()

    };

    history.labels.push(new Date().toLocaleTimeString());

    history.heartRate.push(latest.heartRate);

    history.spo2.push(latest.spo2);

    history.glucose.push(latest.glucose);

    history.temperature.push(latest.temperature);

    // Keep only latest 20 records

    if (history.labels.length > 20) {

        history.labels.shift();

        history.heartRate.shift();

        history.spo2.shift();

        history.glucose.shift();

        history.temperature.shift();

    }

    res.json({

        success: true,

        message: "Sensor Data Received"

    });

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
