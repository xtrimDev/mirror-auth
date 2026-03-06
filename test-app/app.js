import MirrorAuth from "./mirrorAuth.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import e from "express";

/** basic configurations */
const app = e();
app.use(cookieParser()); 
dotenv.config({ silent: true });

/** OAuth configuration with MirrorAuth */
const OAuth = new MirrorAuth();
OAuth.provider({
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET
})


/** Login route, generates auth link and redirect to that place */
app.get("/login", (req, res) => {
    const link = OAuth.generateAuthLink();
    return res.redirect(link);
})

app.get("/auth/callback", async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: "Token not provided"
            });
        }

        const result = await OAuth.validate(token);
        console.log("Validation result:", result);

        if (!result || !result.success) {
            return res.status(401).json({
                success: false,
                error: "Invalid token provided"
            });
        }

        const t = jwt.sign(result.userData, process.env.JWT_CRED, {
            expiresIn: '1h' // Token expires in 1 hour
        });

        // Set cookie with token
        res.cookie('AuthCookie', t, {
            httpOnly: true, 
            secure: true,
            maxAge: 3600000, // 1 hour in milliseconds
            sameSite: 'strict'
        });

        return res.status(200).json({
            success: true,
        });

    } catch (error) {
        console.error("Auth callback error:", error.message);

        return res.status(500).json({
            success: false,
            error: "Authentication failed: " + error.message
        });
    }
});

app.get("/", (req, res) => {
    try {

        const authCookie = req.cookies?.AuthCookie;

        if (!authCookie) {
            return res.send("You are not logged in");
        }

        const decode = jwt.verify(authCookie, process.env.JWT_CRED);

        res.send("You are logged in as: " + decode.fullName);

    } catch (error) {
        res.send("You are not logged in");
    }
});

app.listen(2200, "localhost")

