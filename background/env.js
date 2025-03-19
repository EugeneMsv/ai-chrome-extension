// background/env.js

export function loadEnv() {
    if (typeof process === 'undefined' || !process.env) {
        // Running in a browser environment, not Node.js
        console.warn('Not running in a Node.js environment. .env file will not be loaded.');
        return;
    }
    // Only loads .env if process.env is available
    const fs = require('fs');
    const path = require('path');
    const dotenv = require('dotenv');
    const envPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath });
        if (result.error) {
            console.error('Error loading .env file:', result.error);
        } else {
            console.log('.env file loaded.');
        }
    } else {
        console.warn('.env file not found.');
    }

}
