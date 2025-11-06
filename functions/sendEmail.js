import nodemailer from "nodemailer";

// Function to send weather email
export async function sendWeatherEmail(to, city, weather) {
  // Email setup (use Gmail for demo; switch to SendGrid or Mailgun later)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // your gmail
      pass: process.env.MAIL_PASS, // your app password
    },
  });

  const subject = `🌤️ Today's weather in ${city}`;
  const message = `
    <h2>Hey there 👋</h2>
    <p>Here’s your daily weather update for <b>${city}</b>:</p>
    <p><b>${weather.main}</b> — ${weather.description}</p>
    <p>🌡️ Temp: ${weather.temp}°C</p>
    <p>💧 Humidity: ${weather.humidity}%</p>
    <p>💨 Wind: ${weather.wind} m/s</p>
    <br>
    <p>Stay comfy,<br>— Team SkySense ☁️</p>
  `;

  await transporter.sendMail({
    from: `"SkySense" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html: message,
  });

  console.log(`✅ Email sent to ${to}`);
}
