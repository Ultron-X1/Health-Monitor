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
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("MongoDB Error:", err));

// ===============================
// Middleware
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// Pages
// ===============================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ===============================
// Register Patient
// ===============================
app.post("/api/users", async (req, res) => {

    try {

        const existing = await User.findOne({
            email: req.body.email
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const user = new User(req.body);

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

// ===============================
// Login
// ===============================
const DOCTOR = {
    id: "DOCTOR001",
    password: "Admin123"
};

app.post("/api/login", async (req, res) => {

    try {

        const { loginType } = req.body;

        if (loginType === "doctor") {

            if (
                req.body.doctorId === DOCTOR.id &&
                req.body.password === DOCTOR.password
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

        const { email, phone } = req.body;

        const user = await User.findOne({
            email,
            phone
        });

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid Email or Phone Number"
            });

        }

        res.json({
            success: true,
            role: "patient",
            user
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ===============================
// Get Patients
// ===============================
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

// ===============================
// Doctor selects patient
// ===============================
app.post("/api/device/connect", (req, res) => {

    currentPatient = req.body.userId;

    console.log("Current Patient:", currentPatient);

    res.json({
        success: true,
        message: "Device Connected"
    });

});

// ===============================
// ESP8266 Upload
// ===============================
app.post("/data", async (req, res) => {

    try {

        if (!currentPatient) {

            return res.status(400).json({
                success: false,
                message: "Doctor has not selected a patient."
            });

        }

        const data = new HealthData({

            userId: currentPatient,

            heartRate: Number(req.body.heartRate),
            spo2: Number(req.body.spo2),
            systolicBP: Number(req.body.systolicBP),
            diastolicBP: Number(req.body.diastolicBP),
            glucose: Number(req.body.glucose),

            status: req.body.status || "NORMAL"

        });

        await data.save();

        res.json({
            success: true,
            message: "Sensor Data Saved"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ===============================
// Latest Reading (Patient Only)
// ===============================
app.get("/api/latest/:userId", async (req, res) => {

    try {

        const latest = await HealthData.findOne({
            userId: req.params.userId
        }).sort({ createdAt: -1 });

        if (!latest) {

            return res.status(404).json({
                success: false,
                message: "No data available."
            });

        }

        res.json(latest);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ===============================
// History (Patient Only)
// ===============================
app.get("/api/history/:userId", async (req, res) => {

    try {

        const history = await HealthData.find({
            userId: req.params.userId
        })
        .sort({ createdAt: -1 })
        .limit(50);

        res.json(history);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ===============================
// Health Check
// ===============================
app.get("/health", (req, res) => {

    res.json({

        server: "Running",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        uptime: process.uptime()

    });

});

// ===============================
// 404
// ===============================
app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "Route Not Found"
    });

});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`🚀 Server Running on ${PORT}`);

});
