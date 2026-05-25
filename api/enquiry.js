const nodemailer = require("nodemailer");

function clean(value, limit = 3000) {
  return String(value || "").trim().slice(0, limit);
}

function headerValue(value, limit) {
  return clean(value, limit).replace(/[\r\n]+/g, " ");
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

module.exports = async function enquiry(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(503).json({ success: false, message: "Email service is not configured." });
  }

  let data;
  try {
    data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid request." });
  }
  if (clean(data.website)) {
    return res.status(200).json({ success: true });
  }

  const name = headerValue(data.name, 120);
  const email = headerValue(data.email, 180);
  const company = headerValue(data.company, 160);
  const phone = clean(data.phone, 80);
  const goal = clean(data.campaign_goal, 120);
  const message = clean(data.message, 4000);

  if (!name || !email || !email.includes("@") || !company || !phone || !goal || !message) {
    return res.status(400).json({ success: false, message: "Please complete all required fields." });
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.ENQUIRY_TO || "sales@pushmedia.ng",
      replyTo: email,
      subject: `New Smartbox campaign enquiry - ${company}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company}`,
        `Phone: ${phone}`,
        `Campaign goal: ${goal}`,
        "",
        "Campaign details:",
        message,
      ].join("\n"),
      html: `
        <h2>New Smartbox campaign enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Campaign goal:</strong> ${escapeHtml(goal)}</p>
        <h3>Campaign details</h3>
        <p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>
      `,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Enquiry delivery failed:", error.code || "SMTP_ERROR");
    return res.status(502).json({ success: false, message: "Unable to deliver enquiry." });
  }
};
