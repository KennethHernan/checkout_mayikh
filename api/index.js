import express from "express";
import mercadopago from "mercadopago";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "http://72.20.100.40:5173",
      "https://mayikh.vercel.app",
      "https://checkoutmk.vercel.app",
    ],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `${process.env.PUBLIC_URL_BD}`,
  });
}

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido al servicio Mayikh Style - Checkout",
  });
});
app.post("/api/create_preference", async (req, res) => {
  try {
    const { idOrder, items, userEmail } = req.body;
    if (!idOrder || !Array.isArray(items)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const mappedItems = items.map((item) => {
      const data = item.items;
      const price = Number(data.price);
      const discount = Number(data.discount) || 0;
      const finalPrice = price * (1 - discount / 100);

      return {
        title: data.nameP,
        description: data.description,
        unit_price: parseFloat(finalPrice.toFixed(2)),
        quantity: Number(data.cantidad),
        picture_url: data.urlP,
        currency_id: "PEN",
      };
    });
    console.log("mappedItems:");

    console.log(mappedItems);

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
    return res.status(200).json({
      preferenceId: response.body.id,
      init_point: response.body.init_point,
    });
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    return res.status(500).json({ error: "Error al crear preferencia" });
  }
});

app.post("/api/webhook", async (req, res) => {
  try {
    const parsedBody = JSON.parse(req.body);
    const { type, data } = parsedBody;

    if (type !== "payment" || !data.id || isNaN(Number(data.id))) {
      console.warn("Evento ignorado o ID inválido");
      return res.sendStatus(200);
    }

    let payment;
    let status;
    try {
      const result = await mercadopago.payment
        .findById(data.id)
        .then(async (paymentResponse) => {
          status = paymentResponse.body.status;
          if (status === "approved") {
            console.log("Pago Exitoso");
          } else if (status === "pending") {
            console.log("Pago pendiente");
          } else if (status === "rejected") {
            console.log("Pago rechazado");
          }
          res.status(200).send("OK");
        })
        .catch((error) => {
          console.error("Error al recibir el webhook:", error);
          res.status(500).send("Error al recibir el webhook");
        });
      payment = result.body;
      // Actualizar Order
      await updatePaymentId(payment, status);
    } catch (err) {
      console.warn("No se encontró el pago con ID:", data.id);
      return res.status(200).send("Pago no encontrado, ignorado");
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook:", error);
    res.sendStatus(500);
  }
});

// Generar boleta - PDF
async function generarReciboPDF(payment) {
  const doc = new PDFDocument();
  const filePath = path.join("./recibos", `recibo_${payment.id}.pdf`);

  // Crear carpeta si no existe
  if (!fs.existsSync("./recibos")) fs.mkdirSync("./recibos");

  doc.pipe(fs.createWriteStream(filePath));

  // Encabezado
  doc.fontSize(18).text("Recibo de compra - MAYIKH STYLE", { align: "center" });
  doc.moveDown();

  // Datos del cliente
  doc.fontSize(12).text(`Cliente: ${payment.payer?.email || "Sin correo"}`);
  doc.text(`Fecha: ${new Date().toLocaleString()}`);
  doc.text(`Método de pago: ${payment.payment_type_id}`);
  doc.text(`ID de Pago: ${payment.id}`);
  doc.moveDown();

  // Detalles del pedido
  doc.text("Detalles del pedido:");
  doc.text(`ID Orden: ${payment.external_reference}`);
  doc.text(`Total: S/ ${payment.transaction_amount}`);
  doc.moveDown();

  // Footer
  doc.text("Gracias por tu compra 💎", { align: "center" });

  doc.end();
  console.log("✅ Recibo PDF generado:", filePath);

  return filePath;
}

// Funcion para Actualziar Order
async function updatePaymentId(payment, status) {
  const db = admin.database();
  const ref = db.ref("orderMK/" + payment.external_reference);
  try {
    await ref.update({
      status: status,
      idPayment: payment.id,
    });
    console.log("Payment ID actualizado correctamente.");
  } catch (error) {
    console.error("Error al actualizar el Payment ID:", error);
  }
}

export default app;
