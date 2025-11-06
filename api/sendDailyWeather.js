import admin from "firebase-admin";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

// =======================
// 🔥 Initialize Firebase Admin SDK
// =======================
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase initialized successfully!");
  } catch (err) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", err);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    // =======================
    // 🛡️ Authorization Check
    // =======================
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (token !== process.env.CRON_SECRET) {
      console.warn("⛔ Unauthorized cron request detected!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("🌤️ Starting daily weather email job...");

    // =======================
    // 🔎 Fetch Users
    // =======================
    const snapshot = await db.collection("users").get();
    if (snapshot.empty) {
      console.log("❌ No users found in Firestore");
      return res.status(200).json({ message: "No users found" });
    }

    // =======================
    // 📧 Mail Setup
    // =======================
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const weatherPromises = [];

    snapshot.forEach((doc) => {
      const user = doc.data();
      if (!user.email) return;

      const email = user.email;
      const city = user.city || "Nanded";

      const p = (async () => {
        try {
          console.log(`🌍 Fetching weather for: ${city} ...`);
          const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            city
          )}&units=metric&appid=${process.env.OPENWEATHER_KEY}`;

          const weatherRes = await fetch(apiUrl);
          const data = await weatherRes.json();

          console.log(`🧩 API response for ${city}:`, JSON.stringify(data));

          // ⚠️ Validate data
          if (!data || !data.main || !data.weather) {
            console.warn(`⚠️ Invalid weather data for ${city}. Using fallback city: Nanded`);
            // fallback retry
            const fallbackUrl = `https://api.openweathermap.org/data/2.5/weather?q=Nanded,IN&units=metric&appid=${process.env.OPENWEATHER_KEY}`;
            const fallbackRes = await fetch(fallbackUrl);
            const fallbackData = await fallbackRes.json();

            console.log(`🧩 Fallback API response:`, fallbackData);

            if (!fallbackData || !fallbackData.main) {
              console.error("❌ Fallback also failed:", fallbackData);
              return; // skip user
            }
            data.main = fallbackData.main;
            data.weather = fallbackData.weather;
            data.wind = fallbackData.wind;
          }

          const subject = `🌤️ Daily SkySense — Weather in ${city}`;
          const html = `
            <h2>Hey ${user.name || "there"} 👋</h2>
            <p>Here’s your daily weather update from <b>SkySense</b>:</p>
            <ul>
              <li>🌡️ Temperature: ${data.main.temp}°C</li>
              <li>☁️ Condition: ${data.weather[0].description}</li>
              <li>💧 Humidity: ${data.main.humidity}%</li>
              <li>💨 Wind: ${data.wind?.speed || "N/A"} m/s</li>
            </ul>
            <p>Stay awesome! 💙</p>
            <p><i>— Sent automatically by SkySense ☁️</i></p>
          `;

          await transporter.sendMail({
            from: `"SkySense ☁️" <${process.env.MAIL_USER}>`,
            to: email,
            subject,
            html,
          });

          console.log(`✅ Weather email sent to ${email}`);
        } catch (err) {
          console.error(`❌ Failed for ${email || "unknown"} (${city}):`, err);
        }
      })();

      weatherPromises.push(p);
    });

    await Promise.all(weatherPromises);

    console.log("✅ All daily weather emails processed successfully!");
    res.status(200).json({ message: "All daily weather emails processed!" });
  } catch (err) {
    console.error("❌ Error in daily email job:", err);
    res.status(500).json({ error: err.message });
  }
}
