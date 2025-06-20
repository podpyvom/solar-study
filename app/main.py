import os
import json
from flask import Flask, render_template, request, send_from_directory, jsonify
from werkzeug.utils import secure_filename
from difflib import SequenceMatcher
from datetime import datetime
from pathlib import Path

import asyncio
from aiogram import Bot, Dispatcher, types

from .config import TELEGRAM_TOKEN

UPLOAD_FOLDER = Path('uploads')
METADATA_FILE = Path('uploads/metadata.json')

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not UPLOAD_FOLDER.exists():
    UPLOAD_FOLDER.mkdir(parents=True)

if not METADATA_FILE.exists():
    METADATA_FILE.write_text('[]', encoding='utf-8')

def load_metadata():
    with open(METADATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_metadata(data):
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/menu')
def menu():
    return render_template('menu.html')

@app.route('/upload')
def upload_page():
    return render_template('upload.html')

@app.route('/search')
def search_page():
    return render_template('search.html')

@app.route('/files')
def files_page():
    return render_template('files.html')

@app.route('/docs/<path:filename>')
def docs(filename):
    return send_from_directory('docs', filename)

@app.post('/api/upload')
def api_upload():
    file = request.files.get('file')
    teacher = request.form.get('teacher', '')
    university = request.form.get('university', '')
    course = request.form.get('course', '')
    subject = request.form.get('subject', '')
    final_name = request.form.get('final_name', '')

    if not file:
        return jsonify({'error': 'no file'}), 400

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = secure_filename(f"{university}_{teacher}_{course}_{final_name}_{timestamp}" + os.path.splitext(file.filename)[1])
    filepath = UPLOAD_FOLDER / filename
    file.save(filepath)

    text = ''
    if filepath.suffix == '.txt':
        text = filepath.read_text(encoding='utf-8', errors='ignore')
    elif filepath.suffix == '.docx':
        try:
            from docx import Document
            doc = Document(str(filepath))
            text = "\n".join([p.text for p in doc.paragraphs])
        except Exception:
            text = ''

    meta = load_metadata()
    meta.append({
        'path': str(filename),
        'teacher': teacher,
        'university': university,
        'course': course,
        'subject': subject,
        'final_name': final_name,
        'text': text
    })
    save_metadata(meta)

    return jsonify({'status': 'success', 'file': filename})

@app.get('/api/files')
def api_files():
    return jsonify(load_metadata())

@app.get('/api/search')
def api_search():
    text_query = request.args.get('text', '').lower()
    course = request.args.get('course', '').lower()
    subject = request.args.get('subject', '').lower()

    results = []
    for item in load_metadata():
        score = 0
        if text_query:
            score += SequenceMatcher(None, item.get('text', '').lower(), text_query).ratio()
        if course and course in item.get('course', '').lower():
            score += 1
        if subject and subject in item.get('subject', '').lower():
            score += 1
        if score > 0:
            item_copy = item.copy()
            item_copy['score'] = score
            results.append(item_copy)

    results.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(results)

# Telegram bot
bot = Bot(token=TELEGRAM_TOKEN)
dp = Dispatcher(bot)

@dp.message_handler(commands=['start'])
async def start_cmd(message: types.Message):
    keyboard = types.InlineKeyboardMarkup()
    keyboard.add(types.InlineKeyboardButton('Открыть Solar Study', web_app=types.WebAppInfo(url='https://yourdomain.com/')))
    await message.answer('Добро пожаловать в Solar Study!', reply_markup=keyboard)

async def run_bot():
    await dp.start_polling()

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.create_task(run_bot())
    app.run(host='0.0.0.0', port=8080)
