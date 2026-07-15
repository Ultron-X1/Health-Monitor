const express = require("express");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Store latest sensor data
let latest = {
    heartRate: 0,
    spo2: 0,
    systolicBP: 0,
    diastolicBP: 0,
    glucose: 0,
    temperature: 0,
    status: "Waiting for data...",
    timestamp: ""
};

// Store history for charts
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
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===============================
// ESP8266 sends sensor data here
// ===============================
app.post("/data", (req, res) => {

    console.log("Received Data:");
    console.log(req.body);

    latest = {
        heartRate: Number(req.body.heartRate) || 0,
        spo2: Number(req.body.spo2) || 0,
        systolicBP: Number(req.body.systolicBP) || 0,
        diastolicBP: Number(req.body.diastolicBP) || 0,
        glucose: Number(req.body.glucose) || 0,
        temperature: Number(req.body.temperature) || 0,
        status: req.body.status || "NORMAL",
        timestamp: new Date().toLocaleString()
    };

    // Store chart history
    history.labels.push(new Date().toLocaleTimeString());
    history.heartRate.push(latest.heartRate);
    history.spo2.push(latest.spo2);
    history.glucose.push(latest.glucose);
    history.temperature.push(latest.temperature);

    // Keep only last 20 readings
    if (history.labels.length > 20) {
        history.labels.shift();
        history.heartRate.shift();
        history.spo2.shift();
        history.glucose.shift();
        history.temperature.shift();
    }

    res.json({
        success: true,
        message: "Data received successfully"
    });
});

// ===============================
// Dashboard gets latest values
// ===============================
app.get("/api/latest", (req, res) => {
    res.json(latest);
});

// ===============================
// Dashboard gets chart history
// ===============================
app.get("/api/history", (req, res) => {
    res.json(history);
});

// ===============================
// Health Check
// ===============================
app.get("/health", (req, res) => {
    res.json({
        status: "Server Running",
        uptime: process.uptime(),
        latestData: latest.timestamp
    });
});

// ===============================
// 404
// ===============================
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found"
    });
});

// Railway Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
