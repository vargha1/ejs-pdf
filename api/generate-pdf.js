import ejs from "ejs";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  try {
    // Example JSON body (if using POST)
    const data =
      req.body && Object.keys(req.body).length
        ? req.body
        : {
            customer: "John Doe",
            date: new Date().toLocaleDateString(),
            items: [
              { name: "Website Design", price: 300 },
              { name: "Hosting", price: 50 },
            ],
            total: 350,
          };

    // 1️⃣ Render the EJS template
    const templatePath = path.join(__dirname, "../templates/invoice.ejs");
    const html = await ejs.renderFile(templatePath, data);

    // 2️⃣ Launch serverless Chrome via chrome-aws-lambda
    const executablePath = await chromium.executablePath;
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // 3️⃣ Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm" },
    });

    await browser.close();

    // 4️⃣ Return as PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).send("Error generating PDF");
  }
}
