import admin from "firebase-admin";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

if (!admin.apps.length) {
  console.log("🧠 Firebase Admin initializing...");
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
    console.log("🧩 Received token:", token);
    console.log("🧩 Expected secret:", process.env.CRON_SECRET);

    if (token !== process.env.CRON_SECRET) {
      console.warn("⛔ Unauthorized cron request detected!");
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
        try {
          console.log(`🌍 Fetching weather for: ${city}`);

          const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
              city
            )}&units=metric&appid=${process.env.OPENWEATHER_KEY}`
          );
          const data = await weatherRes.json();

          console.log(`🧩 API response for ${city}:`, data);

          // ✅ Safety check — avoid crash if data missing
          if (!data || data.cod !== 200 || !data.main) {
            console.warn(`⚠️ Invalid data for ${city}:`, data);
            return;
          }

          const temp = data.main?.temp ?? "N/A";
          const desc = data.weather?.[0]?.description ?? "N/A";
          const humidity = data.main?.humidity ?? "N/A";
          const wind = data.wind?.speed ?? "N/A";

          const subject = `🌤️ Daily SkySense — Weather in ${city}`;
          const html = `
            <h2>Hey ${user.name || "there"} 👋</h2>
            <p>Here’s your daily weather update from <b>SkySense</b>:</p>
            <ul>
              <li>🌡️ Temperature: ${temp}°C</li>
              <li>☁️ Condition: ${desc}</li>
              <li>💧 Humidity: ${humidity}%</li>
              <li>💨 Wind: ${wind} m/s</li>
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

          console.log(`✅ Email sent to ${email}`);
        } catch (err) {
          console.error(`❌ Error sending to ${email}:`, err.message);
        }
      })();

      weatherPromises.push(p);
    });

    await Promise.all(weatherPromises);

    console.log("✅ All daily emails processed successfully!");
    res.status(200).json({ message: "Emails sent successfully" });
  } catch (err) {
    console.error("❌ Error in daily email job:", err);
    res.status(500).json({ error: err.message });
  }
}
