const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

let readings = []; // In-memory storage

function isValidReading(data) {
  if (!data.sensorId || typeof data.sensorId !== 'string') return false;
  if (data.waterLevelCm === undefined || typeof data.waterLevelCm !== 'number') return false;
  if (data.waterLevelCm < 0 || data.waterLevelCm > 500) return false;
  return true;
}

function computeAnalytics() {
  if (readings.length === 0) return null;

  const levels = readings.map(r => r.waterLevelCm);
  const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
  const min = Math.min(...levels);
  const max = Math.max(...levels);

  let counts = { Normal: 0, Alert: 0, Danger: 0 };
  levels.forEach(val => {
    if (val < 100) counts.Normal++;
    else if (val <= 149) counts.Alert++;
    else counts.Danger++;
  });

  let trend = 'steady';
  if (readings.length >= 10) {
    const recent5 = readings.slice(0, 5).reduce((a, b) => a + b.waterLevelCm, 0) / 5;
    const prev5 = readings.slice(5, 10).reduce((a, b) => a + b.waterLevelCm, 0) / 5;
    if (recent5 > prev5 + 1) trend = 'rising';
    else if (recent5 < prev5 - 1) trend = 'falling';
  }

  return { average: avg.toFixed(1), min, max, statusCounts: counts, trend };
}

app.post('/api/readings', (req, res) => {
  if (!isValidReading(req.body)) {
    return res.status(400).json({ error: 'Invalid reading payload' });
  }
  const reading = {
    sensorId: req.body.sensorId,
    waterLevelCm: req.body.waterLevelCm,
    timestamp: req.body.timestamp || new Date().toISOString()
  };
  readings.unshift(reading);
  res.status(201).json(reading);
});

app.get('/api/readings', (req, res) => {
  res.json(readings.slice(0, 50));
});

app.get('/api/summary', (req, res) => {
  const summary = computeAnalytics();
  if (!summary) return res.status(400).json({ error: 'No data available' });
  res.json(summary);
});

app.get('/api/advisory', async (req, res) => {
  const summary = computeAnalytics();

  function getFallbackAdvisory(sum) {
    if (!sum) return "EN: No readings available yet. Keep safe. / FIL: Walang datos pa. Mag-ingat.";
    if (sum.max >= 150) {
      return "EN: High water levels detected! Evacuate if necessary. / FIL: Mataas ang tubig! Lumikas kung kinakailangan.";
    }
    return "EN: Water levels are stable. Continue monitoring. / FIL: Ligtas ang antas ng tubig. Patuloy na magmatyag.";
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ advisory: getFallbackAdvisory(summary) });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Based strictly on this flood monitoring data: Average water level ${summary ? summary.average : 0}cm, Max ${summary ? summary.max : 0}cm, Trend ${summary ? summary.trend : 'steady'}. Write a public safety advisory in exactly 3 sentences or fewer, in both Filipino and English. Do not invent details beyond these numbers.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ advisory: text || getFallbackAdvisory(summary) });
  } catch (error) {
    res.json({ advisory: getFallbackAdvisory(summary) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));