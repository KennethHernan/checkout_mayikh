const baseUrl = process.env.URL_FRONTED;

export default function VerifyEmail({ verificationCode }) {
  const logoUrl = `${baseUrl}/assets/mayikh-logo.png`;
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Verifica tu correo electrónico</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background:#fff; color:#212121; margin:0; padding:20px;">
    <div style="max-width:600px; margin:0 auto; background:#eee; padding:20px;">
      <div style="background:#fff; padding:25px 35px;">
        <div style="text-align:center; padding-bottom:14px;">
          <img src="${logoUrl}" width="75" height="75" alt="MAYIK STYLE Logo" style="display:inline-block;" />
        </div>
        <h1 style="font-size:20px; color:#333; margin:0 0 15px;">Verifica tu dirección de correo</h1>
        <p style="font-size:14px; color:#333; margin-bottom:14px;">
          Gracias por comenzar el proceso de creación de una nueva cuenta en MAYIK STYLE. 
          Por favor, ingresa el siguiente código de verificación cuando se te solicite. 
          Si no estás intentando crear una cuenta, puedes ignorar este mensaje.
        </p>
        <div style="text-align:center; margin:20px 0;">
          <div style="font-weight:bold; margin-bottom:8px;">Código de verificación</div>
          <div style="font-weight:bold; font-size:36px;">${verificationCode}</div>
          <div style="font-size:12px; color:#666;">(Este código es válido por 10 minutos)</div>
        </div>
        <hr />
        <p style="font-size:12px; color:#666;">
          MAYIK STYLE nunca te pedirá por correo electrónico que reveles o verifiques tu contraseña, 
          número de tarjeta de crédito o cuenta bancaria.
        </p>
      </div>
      <p style="font-size:12px; color:#666; padding:10px 20px;">
        Este mensaje fue enviado por MAYIK STYLE. Todos los derechos reservados. Consulta nuestra 
        <a href=${baseUrl+"/politica-y-privacidad"} target="_blank">política de privacidad</a>.
      </p>
    </div>
  </body>
</html>

  `;
}

// estilos ya integrados en la plantilla HTML estática
