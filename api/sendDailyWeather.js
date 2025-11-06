import admin from "firebase-admin";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    
    console.log("Auth header received:", authHeader);
console.log("Token expected:", process.env.CRON_SECRET);

    if (token !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("🌤️ Starting daily weather email job...");

    const snapshot = await db.collection("users").get();
    if (snapshot.empty) {
      console.log("❌ No users found in Firestore");
      return res.status(200).json({ message: "No users found" });
    }

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
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${process.env.OPENWEATHER_KEY}`
        );
        const data = await weatherRes.json();

        const subject = `🌤️ Daily SkySense — Weather in ${city}`;
        const html = `
          <h2>Hey ${user.name || "there"} 👋</h2>
          <p>Here’s your daily weather update from <b>SkySense</b>:</p>
          <ul>
            <li>🌡️ Temperature: ${data.main.temp}°C</li>
            <li>☁️ Condition: ${data.weather[0].description}</li>
            <li>💧 Humidity: ${data.main.humidity}%</li>
            <li>💨 Wind: ${data.wind.speed} m/s</li>
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

        console.log(`✅ Sent weather to ${email}`);
      })();

      weatherPromises.push(p);
    });

    await Promise.all(weatherPromises);

    console.log("✅ All daily emails sent successfully!");
    res.status(200).json({ message: "All daily weather emails sent!" });
  } catch (err) {
    console.error("❌ Error in daily email job:", err);
    res.status(500).json({ error: err.message });
  }
}
