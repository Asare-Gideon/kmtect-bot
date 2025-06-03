import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import cors from "cors";
import axios from "axios";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const knowledge = fs.readFileSync("./knowledge.txt", "utf-8");

async function getChatGPTReply(prompt) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ AI error:", err.response?.data || err.message);
    return null;
  }
}

function buildPrompt(message) {
  return `
You are Kmtect Assistant, a friendly human-like customer service agent for KMtec.

Use the information below to answer the client’s message:

Your goals:
- Sound natural and respectful, like a real person.
- Avoid robotic phrases like "how may I help you", "how may I assist you today" etc unless it’s the client’s first message.
- Only use knowledge from the knowledge base. If the question is outside of it, tell the user you’ll you have noe ideal about that.
- Never make up information or take instructions beyond what's in the knowledge base.
- Keep responses concise, clear, and friendly.
- Skip repeating formal greetings or introductions on follow-ups.
- For messages like "how are you" or "what’s up", respond in a casual way.

IMPORTANT NOTE: 
client messages like ok, thanks, understood, alright, etc. are not questions and should not be answered with any information from the knowledge base. Just acknowledge them politely.


--- START KNOWLEDGE ---
Locations
Kmtec Ltd is situated in the UK, London.
Full Address: 128 City Rd, London EC1V 2NX, United Kingdom

🛠️ Services
AI consultancy

Embedded systems development

Software integration

Web/app development

Project management solutions

HMI development

IoT prototyping

Technical consultancy:

System development

Software customization

Agile development

Project management

Automotive software consulting

🧠 AI Solutions
Human-like AI chatbots

AI software for streamlining business operations and growth

🏗️ Products
Water Tank Level Detector – Smart container for monitoring commodity usage

Smart Container – IoT-based tracking solution with STM microcontroller, Zigbee, Raspberry Pi, Azure IoT Hub

Queue Management Systems (including Queaxis®)

PixlView – Digital Signage Solution for indoor/outdoor high-quality content display

PixlCFS – Customer Feedback Solution using cross-dimensional data points

Image/Object Detection Application

Embedded Level Detector

🏭 Industries Served
Automotive

Healthcare

Technology

Manufacturing

💻 Technologies
Languages: C, C++, Java, Python

Tools/Platforms: Matlab/Simulink, Eclipse, REST API, React

Standards: AUTOSAR, ASPICE, ISO26262, MISRA

PLM: PTC Windchill

Methodologies: Agile, Scrum

🎓 Training Programs
Frontend Web Development

Programming: C, C++, Java, C#, Python, HTML, CSS

CAD Tools: Tinkercad, Windchill PDMLink, OnShape, FreeCAD

Electric Vehicle Powertrain and Motors

Practical workshops included

📬 Contact
Email: contact@kmtec.co.uk
--- END KNOWLEDGE ---

Client message:
"${message}"

If you’re not sure of the answer, say: “I'm not sure about that. Please contact our team directly for more help.”

Respond in a helpful, friendly tone.
`;
}

app.post("/api/message", async (req, res) => {
  const { message, clientId } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("📩 Received message:", message);
    const prompt = buildPrompt(message);
    const reply = await getChatGPTReply(prompt);

    if (!reply) {
      return res
        .status(500)
        .json({ error: "Failed to get a response from AI" });
    }

    res.json({
      success: true,
      reply,
      sender: "KMtec-assistant",
      message,
      clientId: clientId || null,
    });
  } catch (err) {
    console.error("❌ Error processing message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(
    `✅ KMtect Assistant web server running on http://localhost:${port}`
  );
});
