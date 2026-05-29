const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Vercel Environment Variables'tan bilgileri alıyoruz
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        // KRİTİK DÜZELTME: JWT Signature hatasını bu satır çözer
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin Başarıyla Başlatıldı");
  } catch (error) {
    console.error("Firebase Başlatma Hatası:", error);
  }
}

app.post('/api/sendCall', async (req, res) => {
  const { fcmToken, callerName, roomId, callerId } = req.body;

  if (!fcmToken || !roomId) {
    return res.status(400).send({ error: "Eksik parametre" });
  }

  const message = {
    token: fcmToken,
    data: { 
      type: 'hybrid_call',
      callerName: String(callerName),
      roomId: String(roomId),
      callerId: String(callerId)
    },
    android: {
      priority: 'high',
      ttl: 0
    }
  };
  
  try {
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, messageId: response });
  } catch (error) {
    console.error('FCM Gönderim Hatası:', error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = app;
