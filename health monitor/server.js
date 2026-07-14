const express = require("express");
const path = require("path");

const app = express();

// Allow ESP8266 to send JSON
app.use(express.json());

// Serve everything inside the public folder
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to receive data from ESP8266
app.post("/data", (req, res) => {

    console.log("Received Data:");
    console.log(req.body);

    res.json({
        success: true
    });

});

// Railway uses its own port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
