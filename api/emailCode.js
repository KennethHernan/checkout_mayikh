import { createElement } from "react";
import { Html, Head, Body, Container, Section, Img, Heading, Text, Hr, Link, Preview } from "@react-email/components";

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "";

function VerifyEmail({ verificationCode }) {
  return createElement(
    Html,
    null,
    createElement(Head, null),
    createElement(
      Body,
      { style: main },
      createElement(Preview, null, "AWS Email Verification"),
      createElement(
        Container,
        { style: container },
        createElement(
          Section,
          { style: coverSection },
          createElement(
            Section,
            { style: imageSection },
            createElement(Img, {
              src: `${baseUrl}/static/aws-logo.png`,
              width: "75",
              height: "45",
              alt: "AWS's Logo",
            })
          ),
          createElement(
            Section,
            { style: upperSection },
            createElement(Heading, { style: h1 }, "Verify your email address"),
            createElement(
              Text,
              { style: mainText },
              "Thanks for starting the new AWS account creation process. We want to make sure it's really you. Please enter the following verification code when prompted. If you don't want to create an account, you can ignore this message."
            ),
            createElement(
              Section,
              { style: verificationSection },
              createElement(Text, { style: verifyText }, "Verification code"),
              createElement(Text, { style: codeText }, verificationCode),
              createElement(Text, { style: validityText }, "(This code is valid for 10 minutes)")
            )
          ),
          createElement(Hr, null),
          createElement(
            Section,
            { style: lowerSection },
            createElement(
              Text,
              { style: cautionText },
              "Amazon Web Services will never email you and ask you to disclose or verify your password, credit card, or banking account number."
            )
          )
        ),
        createElement(
          Text,
          { style: footerText },
          "This message was produced and distributed by Amazon Web Services, Inc., 410 Terry Ave. North, Seattle, WA 98109. © 2022, Amazon Web Services, Inc.. All rights reserved. AWS is a registered trademark of ",
          createElement(
            Link,
            { href: "https://amazon.com", target: "_blank", style: link },
            "Amazon.com"
          ),
          ", Inc. View our ",
          createElement(
            Link,
            { href: "https://amazon.com", target: "_blank", style: link },
            "privacy policy"
          ),
          "."
        )
      )
    )
  );
}

export default VerifyEmail;

// Estilos (igual que antes, sin TypeScript)
const main = {
  backgroundColor: "#fff",
  color: "#212121",
};

const container = {
  padding: "20px",
  margin: "0 auto",
  backgroundColor: "#eee",
};

const h1 = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "15px",
};

const link = {
  color: "#2754C5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  textDecoration: "underline",
};

const text = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  margin: "24px 0",
};

const imageSection = {
  backgroundColor: "#252f3d",
  display: "flex",
  padding: "20px 0",
  alignItems: "center",
  justifyContent: "center",
};

const coverSection = { backgroundColor: "#fff" };

const upperSection = { padding: "25px 35px" };

const lowerSection = { padding: "25px 35px" };

const footerText = {
  ...text,
  fontSize: "12px",
  padding: "0 20px",
};

const verifyText = {
  ...text,
  margin: 0,
  fontWeight: "bold",
  textAlign: "center",
};

const codeText = {
  ...text,
  fontWeight: "bold",
  fontSize: "36px",
  margin: "10px 0",
  textAlign: "center",
};

const validityText = {
  ...text,
  margin: "0px",
  textAlign: "center",
};

const verificationSection = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const mainText = { ...text, marginBottom: "14px" };

const cautionText = { ...text, margin: "0px" };