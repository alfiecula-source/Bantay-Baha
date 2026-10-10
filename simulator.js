const API_URL = process.env.API_URL || 'http://localhost:3000/api/readings';
let currentLevel = 80;

setInterval(async () => {
  const change = (Math.random() * 6) - 3;
  currentLevel = Math.max(10, Math.min(250, currentLevel + change));

  const payload = {
    sensorId: 'CREEK-01',
    waterLevelCm: parseFloat(currentLevel.toFixed(1)),
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`[Simulator] Sent level: ${payload.waterLevelCm} cm - Status: ${response.status}`);
  } catch (err) {
    console.error('[Simulator Error]:', err.message);
  }
}, 5000);
