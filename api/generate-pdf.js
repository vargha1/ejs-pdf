const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");

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
            ],
            total: 350,
          };

    const templatePath = path.join(__dirname, "../templates/invoice.ejs");
    const html = await ejs.renderFile(templatePath, data);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ PDF generation failed:", err);
    res.status(500).json({ error: "Error generating PDF", details: err.message });
  }
};
