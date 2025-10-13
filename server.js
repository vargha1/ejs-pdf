const express = require("express");
const ejs = require("ejs");
const path = require("path");
const wkhtmltopdf = require("wkhtmltopdf");

const app = express();
app.use(express.json());

// Function to format numbers with commas
const formatNumber = (num) => {
  return Number(num).toLocaleString("fa-IR");
};

// Endpoint to generate PDF invoice
app.post("/generate-pdf", async (req, res) => {
  try {
    // Default data if request body is empty
    const data = req.body && Object.keys(req.body).length ? req.body : {
      customer: "علی رضایی",
      date: new Date().toLocaleDateString("fa-IR"),
      items: [
        { name: "طراحی سایت", price: 3000000 },
        { name: "هاستینگ", price: 500000 },
      ],
      total: 3500000,
    };

    // Add formatted numbers for template
    data.items.forEach(item => {
      item.formattedPrice = formatNumber(item.price);
    });
    data.formattedTotal = formatNumber(data.total);

    // Render EJS template
    const templatePath = path.join(__dirname, "templates/invoice.ejs");
    const html = await ejs.renderFile(templatePath, data);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

    // Generate PDF with page breaks for large tables
    wkhtmltopdf(html, {
      pageSize: "A4",
      marginTop: "10mm",
      marginBottom: "10mm",
      marginLeft: "10mm",
      marginRight: "10mm",
      encoding: "UTF-8",
      zoom: 1,
      disableSmartShrinking: true, // ensures CSS widths are respected
    }).pipe(res);

  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
