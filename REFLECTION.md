# Reflection - Bantay Baha Flood Monitor

1. **Security Risks & Fixes:**
   - Risk 1: Unauthenticated POST endpoint allows malicious actors to post fake sensor data.
     * Fix: Implement API Key authentication or HMAC signature headers for the sensor script.
   - Risk 2: Denial of Service (DoS) via spamming the API endpoints.
     * Fix: Apply rate limiting middleware (e.g., express-rate-limit) on all backend routes.

2. **AI Advisory Responsibility & Safeguards:**
   - Responsibility lies with the application developers and barangay authorities deploying the system.
   - Safeguard: Enforce rigid rule-based validation checks on the AI text response and maintain a rule-based fallback mechanism to prevent false warnings or missed alarms.

3. **Emerging Tech Integration (AR/VR vs Blockchain):**
   - Blockchain: Could create an immutable, transparent audit trail for water readings and official advisories during disasters.
   - Trade-off: Not worth the cost due to unnecessary transaction fees, slow processing times, and high complexity for simple real-time flood monitoring.

4. **Impact of 200 Sensors (Big Data Analytics):**
   - Scaling to 200 sensors requires migrating from in-memory arrays to a distributed time-series database (e.g., InfluxDB or PostgreSQL).
   - It enables spatial heatmaps, predictive flood routing, and city-wide emergency response automation across Metro Manila.