import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true });
});

app.post("/ai/quiz", async (req, res) => {
  const { text } = req.body;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
Genera 5 preguntas multiple choice SOLO basadas en el texto.

IMPORTANTE:
Responde SOLO JSON valido, sin markdown, sin explicaciones.

Formato:
{
  "questions": [
    {
      "question": "string",
      "options": ["A","B","C","D"],
      "correctAnswer": 0
    }
  ]
}

Texto:
${text}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let raw = response.text();

    raw = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const json = JSON.parse(raw);
    res.json(json);
  } catch (err) {
    console.log("ERROR IA:", err.message);
    res.status(500).json({ error: "IA failed", detail: err.message });
  }
});

app.post("/ai/summary", async (req, res) => {
  const { text } = req.body;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
Tu tarea es resumir el siguiente texto.

Devuelve la respuesta siguiendo ESTAS REGLAS OBLIGATORIAS:

- Responde únicamente en español.
- Basate exclusivamente en el texto proporcionado.
- No agregues información externa.
- La respuesta debe ser texto plano.
- No uses Markdown.
- No uses asteriscos (*).
- No uses **.
- No uses títulos.
- No escribas "Resumen", "Aquí tienes", "En conclusión" ni ninguna introducción o despedida.
- Escribe entre 2 y 4 párrafos corridos.
- La primera palabra de la respuesta debe pertenecer al resumen.
- Lo ideal seria que me respondas unicamente el resumen asi puedo copiar y pegar en un bloc de notas sin tener que borrar nada. (no tendra estilos ni nada, solo texto plano)



Texto:
${text}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().replace(/```/g, "").trim();

    res.json({ summary });
  } catch (err) {
    console.log("ERROR IA:", err.message);
    res.status(500).json({ error: "IA failed", detail: err.message });
  }
});

export default app;
