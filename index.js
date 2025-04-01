const express = require("express");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = "your-bucket-name";
const bucket = storage.bucket(bucketName);

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Upload file to Google Cloud Storage
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    const gcsFileName = `${Date.now()}-${req.file.originalname}`;
    await bucket.upload(req.file.path, {
      destination: gcsFileName,
      resumable: false,
    });

    res.status(200).send(`File uploaded as ${gcsFileName}`);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).send("Error uploading file.");
  }
});

// Download file from Google Cloud Storage
app.get("/download/:filename", async (req, res) => {
  const fileName = req.params.filename;
  const file = bucket.file(fileName);

  try {
    const exists = await file.exists();
    if (!exists[0]) {
      return res.status(404).send("File not found.");
    }

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    file.createReadStream().pipe(res);
  } catch (error) {
    console.error("Download Error:", error);
    res.status(500).send("Error downloading file.");
  }
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
})
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
