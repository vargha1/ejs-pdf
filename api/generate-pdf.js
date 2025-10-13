import ejs from "ejs";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  try {
    // Example data (you can also send it in req.body)
    const data =
      req.body && Object.keys(req.body).length
        ? req.body
        : {
            customer: "John Doe",
            date: new Date().toLocaleDateString(),
            items: [
              { name: "Website Design", price: 300 },
              { name: "Hosting", price: 50 },
              { name: "Support", price: 20 },
            ],
            total: 370,
          };

    // 1️⃣ Render EJS → HTML
    const templatePath = path.join(__dirname, "../templates/invoice.ejs");
    const html = await ejs.renderFile(templatePath, data);

    // 2️⃣ Launch Puppeteer with Sparticuz Chromium
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true, // force headless mode
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // 3️⃣ Generate PDF Buffer
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm" },
    });

    await browser.close();

    // 4️⃣ Send PDF as a download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ PDF generation failed:", err);
    res.status(500).send("Error generating PDF");
  }
}
