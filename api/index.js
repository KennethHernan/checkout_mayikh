import express from "express";
import mercadopago from "mercadopago";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

dotenv.config({ override: true });

const now = new Date();
const expirationDateTo = new Date(now.getTime() + 24 * 60 * 60 * 1000);
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

// https://checkoutmk.vercel.app/
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido al servicio Mayikh Style - Checkout",
  });
});

// https://checkoutmk.vercel.app/api/create_preference
app.post("/api/create_preference", async (req, res) => {
  try {
    const { idOrder, items, delivery, userData } = req.body;

    if (!idOrder || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    // Mapeador de Carrito
    const mappedItems = items.map((data) => {
      const price = Number(data.price);
      const discount = Number(data.discount) || 0;
      const finalPrice = price * (1 - discount / 100);

      return {
        title: data.nameP,
        description: data.description || "Producto Mayikh",
        unit_price: parseFloat(finalPrice.toFixed(2)),
        quantity: Number(data.cantidad),
        picture_url: data.urlP,
        currency_id: "PEN",
      };
    });

    // Validar delivery
    const deliveryPrice = Number(delivery) > 0 ? Number(delivery) : 0.01;
    mappedItems.push({
      title: "Envío Delivery",
      description: "Costo del envío ecoamigable",
      unit_price: deliveryPrice,
      quantity: 1,
      currency_id: "PEN",
    });

    const preference = {
      items: mappedItems,
      external_reference: idOrder,
      back_urls: {
        success: 'https://checkoutmk.vercel.app/success',
        failure: 'https://checkoutmk.vercel.app/failure',
        pending: 'https://checkoutmk.vercel.app/pending'
      },
      auto_return: "approved",
      external_reference: "",
      notification_url: "https://checkoutmk.vercel.app/api/webhook",
      statement_descriptor: "MAYIKH STYLE",
      expires: true,
      expiration_date_from: now.toISOString().replace("Z", "-05:00"),
      expiration_date_to: expirationDateTo.toISOString().replace("Z", "-05:00"),
    };

    const response = await mercadopago.preferences.create(preference);

    return res.status(200).json({
      preference: response,
      preferenceId: response.body.id,
      init_point: response.body.init_point,
    });
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    return res.status(500).json({ error: "Error al crear preferencia" });
  }
});

// https://checkoutmk.vercel.app/api/webhook
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

app.get("/success", (req, res) => {
  res.json({
    message: "MERCADO PAGO - success",
  });
});
app.get("/failure", (req, res) => {
  res.json({
    message: "MERCADO PAGO - failure",
  });
});
app.get("/pending", (req, res) => {
  res.json({
    message: "MERCADO PAGO - pending",
  });
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
