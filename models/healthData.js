const mongoose = require("mongoose");


const healthSchema = new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    heartRate:{
        type:Number
    },

    spo2:{
        type:Number
    },

    systolicBP:{
        type:Number
    },

    diastolicBP:{
        type:Number
    },

    glucose:{
        type:Number
    },

    status:{
        type:String
    },


    createdAt:{
        type:Date,
        default:Date.now
    }

});


module.exports = mongoose.model(
    "HealthData",
    healthSchema
);