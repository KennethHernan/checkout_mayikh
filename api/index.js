const express = require('express');
const mercadopago = require('mercadopago');
const cors = require('cors');
const app = express();
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

app.use(cors());
app.use(express.json());

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `${process.env.PUBLIC_URL_BD}`,
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
    
    const mappedItems = items.map((item) => ({
      title: item.nameP,
      description: item.descriptionCar,
      unit_price: Number(item.price),
      quantity: Number(item.amount),
      picture_url: item.urlP,
      currency_id: "PEN",
    }));

    const preference = {
      items: mappedItems,
      external_reference: idOrder,
      payer: { email: userEmail || "cliente@mayikh.com" },
      back_urls: {
        success: `${process.env.PUBLIC_URL_SUCCESS}`,
        failure: `${process.env.PUBLIC_URL_FAILURE}`,
        pending: `${process.env.PUBLIC_URL_PENDING}`,
      },
      auto_return: "approved",
      notification_url: `${process.env.PUBLIC_URL_WEBHOOK}`,
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

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

module.exports = app;