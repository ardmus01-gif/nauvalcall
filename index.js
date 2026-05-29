const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const serviceAccount = {
  "type": "service_account",
  "project_id": "neuvalcall",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDV5NTxN8ih9ZOD\ngAoHBNB6eCDJd0AtcLtRFBcSks1uk1InDxOOOhc5GjzZMtPQYaXLGra+HfT5esD9\n5jSuxP7tifKz5/YOtehlyuj+I3VOa2aC5xV6rpNooLVgkEMj1Xsyl+srK/f+PcP5\nX62oF33NyVSp1+OscZqMEru4B5pc3V+B0oGBDgCoZ4GeNq/vBKq7zq1fz/VmARiJ\nHVXaEXxcDYupAv7HGhS6DEEjhgGPZ5orOtlIz7ukE9cT2jciX+o5oE5mC7Yg+qoK\nK8inwCzFz8FU3UN5SnkXwphtWu5gPJrDya0CSC0RZ/PkrJQ0OYntIRTHCbe0XvrS\nQm4nllufAgMBAAECggEAX/saBQ5btTWuVr1/gmvKI5LBX7Zn8ZwbKkRiIB8JGVv5\navaMd2+g2SppcKuqueD/lVbs9v4ZXlQTwztom55hqPUUmF94HlzJptf5WoVNz/1I\n2Gfazx0En9gx292Qi0VyTZ83U72cwJU12jLxibLU7KGyIK70hv7Jc566ZtfekFmh\n2V2Z3azXenrAbTopXr+3mCQSe+3FmJA+ycanmXTe/p+qDnbRdV0PKpt7SEGvijtB\nMYT1nCWJCPL+Atafxo/y6hAaRPilS9R640xh79gOvYB69cNM7i/og1KlEX8pdkdi\niaieyX16Y8NEljaeUMYc1c18RukJ3gKrbqlp/ERQFQKBgQD553IVCDpSuruWTegS\nLlpL504WoTFbTzPVzp9ahKXl5T17l70dspw3M8ddpLe8Ue79C09GlI7LduJRC+S0\nu1Yor5q1JEYMHtV+A6o+VGL+3C4JKIZonHCKwBiRbUZ43uiO8gnJzKM+mbrzB9E3\nKQkAPsQhAqCFnwGqhorbEHjW1QKBgQDbHIQuhC5B8eH8jvS6Vyo3n8iYYZHmsbd9\npvel11ruZJ0W2hSJKaPlpi0FRduup1RlvKkWd0YsMom+kAeO4kAnTw3lXSHwUq1C\nWMzn6ApeRuLXc88jcvy8cG/nvVLpw885GQvUg70SSUx4kJu5vU6QjNDSxZ9dPgQx\nVWuMaFxKowKBgQCG3kKyWRto1IAykN8DGOMAfdel3N6PQcJezEEyD86csMgqsGyO\n33rxS893mVLTnoBVLkpddAVQh1uCk+GdLFFGaecbhXUMS4O6m23Ab7hxhRCPPsCz\nKmKObzeTHJ9g0iQ+KR/hOcCMI1lCmeBuXYYPDNC6Y/mPw42ZozzDFzOv9QKBgA9W\n07od7s8XC+cOavuQlpgGS5i/W+N2lY3qXnPxu5/s00KCSeXAUIUHOSehWFvFwxbM\nOlokR3lYoGQC2USbejpGQobIGlQktZRrewzRJcir1b2Xkey9ZAwdIvhqPJ+44Yzx\nv+5EurvI/d2C4iQCqLld4lCfHST97nU1sa3GsI9ZAoGAerQRARrwjvlQlsaCwprw\n/P9W3wQdySK+0sW3pYeCfoRJXFnRrKgN5sODFeQgN5594dVgjjdHDS11yvgeMO1h\nO2B9+/GxGgKtcv1bhlue6KgvRRu2eXU+upD61CaRhDvm2jhWQyErQG/7cfMn9ZHD\ntpBvrJp9c8Bah3eRJ/mnFts=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-fbsvc@neuvalcall.iam.gserviceaccount.com",
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("Firebase Başlatıldı");
  } catch (e) { console.error("Firebase Hatası:", e); }
}

app.post('/api/sendCall', async (req, res) => {
  // Gelen veriyi logla (Vercel Dashboard'da ne geldiğini görmek için)
  console.log("Gelen Gövde (Body):", req.body);

  // Android'den gelebilecek alternatif isimleri kontrol et
  const targetToken = req.body.fcmToken || req.body.token;
  const roomId = req.body.roomId;
  const callerName = req.body.callerName || "Bilinmeyen";

  if (!targetToken || !roomId) {
    console.error("Hata: fcmToken veya roomId eksik!");
    return res.status(400).send({ 
        error: "Eksik veri!", 
        gelenData: req.body 
    });
  }

  const message = {
    token: targetToken,
    data: { 
      type: 'hybrid_call',
      callerName: String(callerName),
      roomId: String(roomId),
      callerId: String(req.body.callerId || "")
    },
    android: { priority: 'high', ttl: 0 }
  };
  
  try {
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, messageId: response });
  } catch (error) {
    console.error('FCM Hatası:', error);
    res.status(500).send({ error: error.message });
  }
});

app.get('/', (req, res) => { res.send('Backend Aktif!'); });
module.exports = app;
