const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

let latest = {
    heartRate: 0,
    spo2: 0,
    systolicBP: 0,
    diastolicBP: 0,
    glucose: 0,
    status: "NORMAL"
};

let history = {
    labels: [],
    heartRate: [],
    spo2: [],
    glucose: []
};

// ESP8266 sends data here
app.post("/data", (req, res) => {

    latest = req.body;

    history.labels.push(new Date().toLocaleTimeString());
    history.heartRate.push(req.body.heartRate);
    history.spo2.push(req.body.spo2);
    history.glucose.push(req.body.glucose);

    if (history.labels.length > 20) {
        history.labels.shift();
        history.heartRate.shift();
        history.spo2.shift();
        history.glucose.shift();
    }

    console.log("Received:", latest);

    res.json({ success: true });
});

// Dashboard gets latest values
app.get("/api/latest", (req, res) => {
    res.json(latest);
});

// Dashboard gets chart history
app.get("/api/history", (req, res) => {
    res.json(history);
});

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
