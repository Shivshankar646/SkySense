export default async function handler(req, res) {
  const API_KEY = process.env.OPENWEATHER_KEY; // key stored safely in Vercel
  const { city, lat, lon } = req.query;

  try {
    let url;
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    } else if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    } else {
      return res.status(400).json({ error: 'Missing city or coordinates' });
    }

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) res.status(200).json(data);
    else res.status(response.status).json({ error: data.message });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}
