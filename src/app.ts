import express from 'express';

export const app = express();
const session = require("express-session");

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
    throw new Error("CRITICAL: SESSION_SECRET is not defined in your environment.");
}
