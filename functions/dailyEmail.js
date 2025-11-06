import fetch from "node-fetch";
import { sendWeatherEmail } from "./sendEmail.js";
import admin from "firebase-admin";

// initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const usersSnapshot = await db.collection("users").get();

    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      const city = user.city || "Nanded";

      // Fetch weather
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${process.env.OPENWEATHER_KEY}`;
      const weatherRes = await fetch(weatherUrl);
      const data = await weatherRes.json();

      const weather = {
        main: data.weather[0].main,
        description: data.weather[0].description,
        temp: data.main.temp,
        humidity: data.main.humidity,
        wind: data.wind.speed,
      };

      // Send email
      await sendWeatherEmail(user.email, city, weather);
    }

    res.status(200).json({ message: "✅ Daily emails sent!" });
  } catch (err) {
    console.error("❌ Error sending emails:", err);
    res.status(500).json({ error: err.message });
  }
}
