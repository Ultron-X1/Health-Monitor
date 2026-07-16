// =====================================
// LOGIN (Doctor & Patient)
// =====================================

const DOCTOR_CREDENTIALS = {
    id: "DOCTOR001",
    password: "Admin123"
};

app.post("/api/login", async (req, res) => {
    try {
        const { loginType } = req.body;

        if (loginType === "doctor") {
            return handleDoctorLogin(req, res);
        }

        return handlePatientLogin(req, res);

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// -------------------------------------
// Doctor login
// -------------------------------------
function handleDoctorLogin(req, res) {
    const { doctorId, password } = req.body;

    if (doctorId === DOCTOR_CREDENTIALS.id && password === DOCTOR_CREDENTIALS.password) {
        return res.json({ success: true, role: "doctor" });
    }

    return res.status(401).json({
        success: false,
        message: "Invalid Doctor ID or Password"
    });
}

// -------------------------------------
// Patient login
// -------------------------------------
async function handlePatientLogin(req, res) {
    const { email, phone } = req.body;

    const user = await User.findOne({ email, phone });

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid Email or Phone Number"
        });
    }

    return res.json({ success: true, role: "patient", user });
}
