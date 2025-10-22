const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

export default function VerifyEmail({ verificationCode }) {
  const logoUrl = `${baseUrl}/static/mayikh-logo.png`;
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Verify your email</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background:#fff; color:#212121; margin:0; padding:20px;">
      <div style="max-width:600px; margin:0 auto; background:#eee; padding:20px;">
        <div style="background:#fff; padding:25px 35px;">
          <div style="text-align:center; padding-bottom:14px;">
            <img src="${logoUrl}" width="75" height="45" alt="logo" style="display:inline-block;" />
          </div>
          <h1 style="font-size:20px; color:#333; margin:0 0 15px;">Verify your email address</h1>
          <p style="font-size:14px; color:#333; margin-bottom:14px;">Thanks for starting the new account creation process. Please enter the following verification code when prompted. If you don't want to create an account, you can ignore this message.</p>
          <div style="text-align:center; margin:20px 0;">
            <div style="font-weight:bold; margin-bottom:8px;">Verification code</div>
            <div style="font-weight:bold; font-size:36px;">${verificationCode}</div>
            <div style="font-size:12px; color:#666;">(This code is valid for 10 minutes)</div>
          </div>
          <hr />
          <p style="font-size:12px; color:#666;">Amazon Web Services will never email you and ask you to disclose or verify your password, credit card, or banking account number.</p>
        </div>
        <p style="font-size:12px; color:#666; padding:10px 20px;">This message was produced and distributed by Amazon Web Services, Inc., 410 Terry Ave. North, Seattle, WA 98109. © 2022, Amazon Web Services, Inc.. All rights reserved. View our <a href="https://amazon.com" target="_blank">privacy policy</a>.</p>
      </div>
    </body>
  </html>
  `;
}

// estilos ya integrados en la plantilla HTML estática