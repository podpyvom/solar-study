const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Document, Packer } = require('docx');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const FILES_DIR = path.join(__dirname, 'files');

// Ensure files directory exists
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, FILES_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

const upload = multer({ storage });

// Simple search by metadata stored in JSON files
const indexPath = path.join(FILES_DIR, 'index.json');
function loadIndex() {
  if (!fs.existsSync(indexPath)) return [];
  return JSON.parse(fs.readFileSync(indexPath));
}
function saveIndex(data) {
  fs.writeFileSync(indexPath, JSON.stringify(data, null, 2));
}

app.post('/upload', upload.array('files'), (req, res) => {
  const { university, instructor, course, subject, finalName, visibility } = req.body;
  const files = req.files || [];
  const fileName = `${university}_${instructor}_${course}_${finalName}.docx`;
  const destPath = path.join(FILES_DIR, fileName);

  // For demo: simply combine text names into a docx
  const doc = new Document();
  files.forEach(f => {
    doc.addSection({ children: [new docx.Paragraph(f.filename)] });
  });
  Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(destPath, buffer);

    const index = loadIndex();
    index.push({
      fileName,
      university,
      instructor,
      course,
      subject,
      visibility
    });
    saveIndex(index);

    res.json({ message: 'saved', fileName });
  });
});

app.get('/files', (req, res) => {
  const index = loadIndex();
  res.json(index);
});

app.get('/search', (req, res) => {
  const { text = '', subject = '', course = '', university = '', instructor = '' } = req.query;
  const index = loadIndex();
  const results = index.filter(item => {
    const matchMeta =
      item.subject.toLowerCase().includes(subject.toLowerCase()) &&
      item.course.toLowerCase().includes(course.toLowerCase()) &&
      (university ? item.university.toLowerCase().includes(university.toLowerCase()) : true) &&
      (instructor ? item.instructor.toLowerCase().includes(instructor.toLowerCase()) : true);
    const matchText = text ? item.fileName.toLowerCase().includes(text.toLowerCase()) : true;
    return matchMeta && matchText;
  });
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
