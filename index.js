const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// ⚠️ GÜVENLİK UYARISI: Private Key'ini burada açıkça paylaşman risklidir. 
// Gerçek projede bunları Vercel Environment Variables'a taşımalısın.
const serviceAccount = {
  "type": "service_account",
  "project_id": "neuvalcall",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDV5NTxN8ih9ZOD\n... (burası aynı kalsın) ...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@neuvalcall.iam.gserviceaccount.com",
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// 🚀 ANDROID UYUMU: MainActivity.kt içindeki URL ile aynı olmalı
app.post('/api/sendCall', async (req, res) => {
  // Android'den gelen değişken isimleri tam olarak bunlar olmalı:
  const { fcmToken, callerName, roomId, callerId } = req.body;

  if (!fcmToken) {
    console.error("Hata: FCM Token gelmedi");
    return res.status(400).send({ error: "fcmToken gerekli!" });
  }

  const message = {
    token: fcmToken, // Android'den gelen hedef telefonun token'ı
    data: { 
      type: 'hybrid_call',
      callerName: String(callerName || "Bilinmeyen"),
      roomId: String(roomId),
      callerId: String(callerId || "")
    },
    android: {
      priority: 'high',
      ttl: 0
    }
  };
  
  try {
    await admin.messaging().send(message);
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('FCM Gönderim Hatası:', error);
    res.status(500).send({ error: error.message }); // 500 hatasını burası veriyor
  }
});

// Vercel için ana route
app.get('/', (req, res) => {
  res.send('NeuValCall Backend Çalışıyor!');
});

// 🚀 VERCEL İÇİN KRİTİK: app.listen yerine export kullanmalısın
module.exports = app;
