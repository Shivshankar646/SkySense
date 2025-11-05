export default async function handler(req, res) {
  const API_KEY = process.env.OPENWEATHER_KEY;
  const { lat, lon } = req.query;

  if (!lat || !lon)
    return res.status(400).json({ error: 'Missing coordinates' });

  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) res.status(200).json(data);
    else res.status(response.status).json({ error: data.message });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}
