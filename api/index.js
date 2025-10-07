const express = require('express');
const mercadopago = require('mercadopago');
const cors = require('cors');
const app = express();
const admin = require('firebase-admin');

app.use(cors());
app.use(express.json());

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mayikh-default-rtdb.firebaseio.com",
  });
}

const db = admin.firestore();

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});
app.get("/", (req, res) => {
    res.json({
        message: "Bienvenido al servicio Mayikh Style"
    })
})
app.post("/api/create_preference", async (req, res) => {
  try {
    const { idOrder, items, userEmail } = req.body;
    if (!idOrder || !Array.isArray(items)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const preference = {
      items: items.map((item) => ({
        title: item.nameP,
        description: item.descriptionCar,
        unit_price: Number(item.price),
        quantity: Number(item.amount),
        currency_id: "PEN",
      })),
      external_reference: idOrder,
      payer: { email: userEmail || "cliente@mayikh.com" },
      back_urls: {
        success: "https://mayikh.vercel.app/checkout/success",
        failure: "https://mayikh.vercel.app/checkout/failure",
      },
      auto_return: "approved",
      notification_url: "https://mayikh-back.vercel.app/api/webhook",
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({
      preferenceId: response.body.id,
      init_point: response.body.init_point,
    });
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    res.status(500).json({ error: "Error al crear preferencia" });
  }
});

app.post("/api/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type !== "payment" || !data.id) return res.sendStatus(200);

    const payment = await mercadopago.payment.findById(data.id);
    const info = payment.body;

    const orderRef = db.collection("orders").doc(info.external_reference);
    await orderRef.set(
      {
        status: info.status,
        paymentId: info.id,
        payer: info.payer.email,
        amount: info.transaction_amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook:", error);
    res.sendStatus(500);
  }
});

export default app;