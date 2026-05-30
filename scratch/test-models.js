const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Read API key from .env.local
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : "";

console.log("Loaded API key:", apiKey ? "FOUND" : "NOT FOUND");

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
  "gemini-3.1-pro-preview",
  "gemini-3.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash"
];

async function test() {
  for (const modelName of modelsToTest) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Respond with the word 'OK' only." }] }],
      });
      console.log(`Success! Response: "${response.response.text().trim()}"`);
    } catch (err) {
      console.log(`Failed! Error: ${err.message}`);
    }
  }
}

test();
