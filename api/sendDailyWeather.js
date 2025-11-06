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
  // ✅ Secure cron access: only your Vercel cron job (with CRON_SECRET) can run this
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("⛔ Unauthorized cron request detected!");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("🌤️ Starting daily weather email job...");

    // Fetch all registered users
    const snapshot = await db.collection("users").get();
    if (snapshot.empty) {
      console.log("No users found ❌");
      return res.status(200).json({ message: "No users found" });
    }

    // Setup Gmail SMTP using environment variables
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
      const email = user.email;
      const city = user.city || "Nanded"; // default fallback city

      const p = (async () => {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${process.env.OPENWEATHER_KEY}`
        );
        const data = await weatherRes.json();

        const subject = `🌤️ Daily SkySense — Weather in ${city}`;
        const html = `
          <div style="font-family: Arial, sans-serif; background:#f3f4f6; padding:20px;">
            <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color:#2563eb;">Hey ${user.name || "there"} 👋</h2>
              <p>Here’s your daily <b>SkySense</b> weather update for <b>${city}</b>:</p>
              <div style="font-size:16px; line-height:1.6;">
                🌡️ <b>Temperature:</b> ${data.main.temp}°C <br/>
                ☁️ <b>Condition:</b> ${data.weather[0].description} <br/>
                💧 <b>Humidity:</b> ${data.main.humidity}% <br/>
                💨 <b>Wind:</b> ${data.wind.speed} m/s
              </div>
              <br/>
              <p style="color:#4b5563;">Stay awesome! 💙</p>
              <hr style="margin:20px 0; border:0; border-top:1px solid #e5e7eb;">
              <footer style="font-size:12px; color:#9ca3af;">
                ☁️ Sent automatically by <b>SkySense</b><br/>
                Want to stop receiving updates? (Unsubscribe link coming soon)
              </footer>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"SkySense ☁️" <${process.env.MAIL_USER}>`,
          to: email,
          subject,
          html,
        });

        console.log(`✅ Sent weather email to ${email}`);
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
