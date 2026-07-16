const mongoose = require("mongoose");

const healthDataSchema = new mongoose.Schema({
    userId: String,
    heartRate: Number,
    spo2: Number,
    systolicBP: Number,
    diastolicBP: Number,
    glucose: Number,
    status: String
}, {
    timestamps: true
});

module.exports = mongoose.model("HealthData", healthDataSchema);
