const path = require('path');
const fs = require('fs');
const express = require('express');
const { Telegraf } = require('telegraf');
const multer = require('multer');
const mammoth = require('mammoth');
const stringSimilarity = require('string-similarity');
const { TELEGRAM_TOKEN } = require('../config');

const app = express();
const bot = new Telegraf(TELEGRAM_TOKEN);

const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
const META_FILE = path.join(__dirname, '..', 'data', 'meta.json');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(META_FILE)) {
  fs.writeFileSync(META_FILE, '[]', 'utf8');
}

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const { university = '', teacher = '', course = '', final_name = '' } = req.body;
    const stamp = Date.now();
    const ext = path.extname(file.originalname);
    const safe = `${university}_${teacher}_${course}_${final_name}_${stamp}${ext}`;
    cb(null, safe.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

function loadMeta() {
  return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
}
function saveMeta(data) {
  fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.use('/static', express.static(path.join(__dirname, '..', 'public')));
app.use('/docs', express.static(path.join(__dirname, '..', 'docs')));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'index.html')));
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'menu.html')));
app.get('/upload', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'upload.html')));
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'search.html')));
app.get('/files', (req, res) => res.sendFile(path.join(__dirname, '..', 'views', 'files.html')));

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const { teacher = '', university = '', course = '', subject = '', final_name = '' } = req.body;
  let text = '';
  if (path.extname(filePath) === '.docx') {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } catch (e) {
      text = '';
    }
  } else if (path.extname(filePath) === '.txt') {
    text = fs.readFileSync(filePath, 'utf8');
  }
  const meta = loadMeta();
  meta.push({
    path: path.basename(filePath),
    teacher,
    university,
    course,
    subject,
    final_name,
    text
  });
  saveMeta(meta);
  res.json({ status: 'success', file: path.basename(filePath) });
});

app.get('/api/files', (req, res) => {
  res.json(loadMeta());
});

app.get('/api/search', (req, res) => {
  const { text = '', course = '', subject = '' } = req.query;
  const meta = loadMeta();
  const results = [];
  meta.forEach(item => {
    let score = 0;
    if (text) {
      score += stringSimilarity.compareTwoStrings(item.text.toLowerCase(), text.toLowerCase());
    }
    if (course && item.course.toLowerCase().includes(course.toLowerCase())) score += 1;
    if (subject && item.subject.toLowerCase().includes(subject.toLowerCase())) score += 1;
    if (score > 0) results.push({ ...item, score });
  });
  results.sort((a,b) => b.score - a.score);
  res.json(results);
});

bot.start((ctx) => {
  ctx.reply('Добро пожаловать в Solar Study!', {
    reply_markup: {
      inline_keyboard: [[{ text: 'Открыть Solar Study', web_app: { url: 'https://yourdomain.com/' } }]]
    }
  });
});

bot.launch();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
