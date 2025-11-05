export default async function handler(req, res) {
  const city = req.query.city;
const API_KEY = process.env.OPENWEATHER_KEY;

  if (!city) {
    return res.status(400).json({ error: "Missing city parameter" });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.status !== 200) {
      return res.status(response.status).json({ error: data.message || "City not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
