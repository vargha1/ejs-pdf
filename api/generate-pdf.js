const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");

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

    // 🧾 Render EJS
    const templatePath = path.join(__dirname, "../templates/invoice.ejs");
    const html = await ejs.renderFile(templatePath, data);

    // 🧩 Detect Environment
    const isLocal = !process.env.AWS_REGION; // true on local dev, false on Vercel
    console.log("Running environment:", isLocal ? "local" : "serverless");

    // 🧭 Get executable path
    let executablePath;
    if (isLocal) {
      // Local: use installed Chrome or Chromium
      executablePath =
        process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : "/usr/bin/google-chrome";
    } else {
      // Vercel: use Sparticuz bundled Chromium
      executablePath = await chromium.executablePath();
    }

    console.log("Using Chrome binary at:", executablePath);

    // 🧠 Launch Puppeteer
    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
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
    res
      .status(500)
      .json({ error: "Error generating PDF", details: err.message, stack: err.stack });
  }
};
