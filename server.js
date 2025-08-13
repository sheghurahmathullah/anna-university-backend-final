const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// Logging middleware
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.path}`);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  next();
});

// Configure CORS with specific options
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:3000", // Potential React dev server
      "http://localhost:5000", // Backend server
      "http://localhost:8080", // Add your frontend port explicitly
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true // Add this if you're using cookies/credentials
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "stuffztrending@gmail.com",
    pass: "mezosqvfxpbmdkax",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Add verification of transporter
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

// Email endpoint
app.post("/api/send-email", async (req, res) => {
  const { email, authorName, paperTitle, submissionId } = req.body;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Paper Submission Confirmation</h2>
      <p>Dear ${authorName},</p>
      <p>Thank you for submitting your paper to Anna University. Here are your submission details:</p>
      <ul>
        <li>Paper Title: ${paperTitle}</li>
        <li>Submission ID: ${submissionId}</li>
      </ul>
      <p>We will review your submission and get back to you soon.</p>
      <p>Best regards,<br/>Anna University Team</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Anna University" <stuffztrending@gmail.com>', // Update this line
      to: email,
      subject: "Paper Submission Confirmation - Anna University",
      html: emailHtml,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// Email status update endpoint
app.post("/api/send-status-update-email", async (req, res) => {
  const { email, authorName, paperTitle, submissionId, status, remarks } =
    req.body;

  // Validate input parameters
  if (!email || !authorName || !paperTitle || !submissionId || !status) {
    return res.status(400).json({
      success: false,
      message: "Missing required email parameters",
    });
  }

  let emailHtml = "";
  let subject = "";

  try {
    if (status === "selected") {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Abstract Accepted – ICAIEA 2026</h2>
          <p>Dear ${authorName},</p>
          <p>We are pleased to inform you that your abstract titled "${paperTitle}" (Submission ID: ${submissionId}) has been accepted for the International Conference on Advances in Industrial Engineering Applications (ICAIEA 2026).</p>
          <p>You are now invited to submit your full paper by December 5th, 2025 through the submission portal.</p>
          <p>To proceed further, we kindly request you to fill out the following form with your author details, payment information, and proof of payment:</p>
          <p>🔗 Form Link: <a href="https://forms.gle/ChiKC4VmTp9hvXUH9">Conference Registration Form</a></p>
          <p>Note: Submission of this form is mandatory for full paper consideration and conference registration.</p>
          <p>We look forward to your continued participation.</p>
          <p>For any queries, feel free to reach us at icaiea2026@gmail.com.</p>
          <p>Warm regards,<br/>Organizing Committee<br/>ICAIEA 2026<br/>Anna University</p>
        </div>
      `;
      subject = "Abstract Accepted – ICAIEA 2026";
    } else if (status === "rejected") {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Abstract Review Outcome – ICAIEA 2026</h2>
          <p>Dear ${authorName},</p>
          <p>Thank you for your submission to ICAIEA 2026. After careful review, we regret to inform you that your abstract titled "${paperTitle}" (Submission ID: ${submissionId}) has not been accepted for presentation at the conference.</p>
          ${
            remarks
              ? `<p><strong>Reviewer Remarks:</strong> ${remarks}</p>`
              : ""
          }
          <p>We appreciate your interest in the conference and encourage you to consider submitting to future editions.</p>
          <p>For any clarifications, you may contact us at icaiea2026@gmail.com.</p>
          <p>Best wishes,<br/>Organizing Committee<br/>ICAIEA 2026<br/>Anna University</p>
        </div>
      `;
      subject = "Abstract Review Outcome – ICAIEA 2026";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'selected' or 'rejected'.",
      });
    }

    // Send email
    const mailOptions = {
      from: '"Anna University" <stuffztrending@gmail.com>',
      to: email,
      subject: subject,
      html: emailHtml,
    };

    // Log email details for debugging
    console.log("Sending email:", {
      to: email,
      subject: subject,
      submissionId: submissionId,
      status: status,
    });

    await transporter.sendMail(mailOptions);

    console.log(
      `Email sent successfully to ${email} for submission ${submissionId}`
    );

    res.json({
      success: true,
      message: "Status update email sent successfully",
    });
  } catch (error) {
    console.error("Comprehensive email sending error:", {
      errorMessage: error.message,
      email,
      submissionId,
      status,
      paperTitle,
    });

    res.status(500).json({
      success: false,
      message: `Failed to send status update email: ${error.message}`,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
