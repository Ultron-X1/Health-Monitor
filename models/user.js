const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({



    fullName: {
        type: String,
        required: true
    },

    age: {
        type: Number,
        required: true
    },

    gender: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    phone: {
        type: String,
        required: true
    },

    address: {
        type: String,
        default: ""
    },

    emergencyContact: {
        type: String,
        default: ""
    },

    medicalCondition: {
        type: String,
        default: ""
    },

    active: {
        type: Boolean,
        default: true
    },

    hiddenFromDoctor: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);
