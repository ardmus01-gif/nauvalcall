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
  // Android'den gelen verileri alıyoruz
  const { fcmToken, callerName, roomId, callerId, isVideo } = req.body;

  if (!fcmToken || !roomId) {
    return res.status(400).send({ error: "fcmToken ve roomId gerekli!" });
  }

  const message = {
    token: fcmToken,
    data: { 
      type: 'hybrid_call', // MyFirebaseMessagingService.kt bunu kontrol ediyor
      callerName: String(callerName || "Aile Üyesi"),
      roomId: String(roomId),
      callerId: String(callerId || ""), 
      isVideo: String(isVideo || "true")
    },
    android: {
      priority: 'high',
      ttl: 0,
      direct_boot_ok: true
    }
  };
  
  try {
    const response = await admin.messaging().send(message);
    console.log('Bildirim gönderildi:', response);
    res.status(200).send({ success: true, response });
  } catch (error) {
    console.error('FCM Hatası:', error);
    res.status(500).send({ error: error.message });
  }
});

// Vercel için ana route
app.get('/', (req, res) => {
  res.send('NeuValCall Backend Çalışıyor!');
});

// 🚀 VERCEL İÇİN KRİTİK: app.listen yerine export kullanmalısın
module.exports = app;
