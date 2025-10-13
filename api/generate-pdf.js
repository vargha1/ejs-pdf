const ejs = require("ejs");
const chromium = require("@sparticuz/chromium-min");
const puppeteer = require("puppeteer-core");
const path = require("path");

module.exports = async (req, res) => {
  try {
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

    // 2️⃣ Launch Puppeteer
    const executablePath = await chromium.executablePath;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm" },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ PDF generation failed:", err);
    res.status(500).json({
      error: "Error generating PDF",
      details: err.message,
      stack: err.stack,
    });
  }
};