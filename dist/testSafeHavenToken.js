import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import jwt from "jsonwebtoken";
const BASE_URL = "https://api.safehavenmfb.com";
const CLIENT_ID = process.env.SAFEHAVEN_CLIENT_ID;
const PRIVATE_KEY = process.env.SAFE_HAVEN_PRIVATE_KEY;
function generateClientAssertion() {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign({
        iss: "https://edpays.online",
        sub: CLIENT_ID,
        aud: "https://api.safehavenmfb.com",
        iat: now,
        exp: now + 300, // max 5 minutes
    }, PRIVATE_KEY.replace(/\\n/g, "\n"), { algorithm: "RS256" });
}
async function getAccessToken() {
    try {
        const clientAssertion = generateClientAssertion();
        const response = await axios.post(`${BASE_URL}/oauth2/token`, new URLSearchParams({
            grant_type: "client_credentials",
            client_id: CLIENT_ID,
            client_assertion: clientAssertion,
            client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        }).toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        console.log(response.data);
        console.log("Access Token:", response.data.access_token);
        console.log("Expires In:", response.data.expires_in, "seconds");
    }
    catch (error) {
        console.error("Failed to get access token:", error.response?.data || error.message);
    }
}
getAccessToken();
