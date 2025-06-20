function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark');
    body.classList.toggle('light');
    const icon = document.getElementById('theme-icon');
    if (body.classList.contains('dark')) {
        icon.textContent = '\uD83C\uDF19'; // moon
    } else {
        icon.textContent = '\u2600\uFE0F'; // sun
    }
}

function goToMenu() {
    window.location.href = '/menu';
}

function navigate(path) {
    window.location.href = path;
}

async function doSearch() {
    const text = document.getElementById('search-text').value;
    const subject = document.getElementById('search-subject').value;
    const course = document.getElementById('search-course').value;
    const res = await fetch(`/api/search?text=${encodeURIComponent(text)}&subject=${encodeURIComponent(subject)}&course=${encodeURIComponent(course)}`);
    const data = await res.json();
    const list = document.getElementById('results');
    list.innerHTML = '';
    data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.final_name} (${item.university}, ${item.course}, ${item.subject}, ${item.teacher})`;
        list.appendChild(li);
    });
}

async function loadFiles() {
    const res = await fetch('/api/files');
    const data = await res.json();
    const list = document.getElementById('file-list');
    list.innerHTML = '';
    data.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `/uploads/${item.path}`;
        a.textContent = item.final_name;
        li.appendChild(a);
        const info = document.createElement('div');
        info.textContent = `${item.university}, ${item.course}, ${item.subject}, ${item.teacher}`;
        li.appendChild(info);
        list.appendChild(li);
    });
}

async function initFilesPage() {
    if (document.getElementById('file-list')) {
        loadFiles();
    }
}

async function initUpload() {
    const form = document.getElementById('upload-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const res = await fetch('/api/upload', { method: 'POST', body: data });
        const json = await res.json();
        document.getElementById('upload-result').textContent = json.status === 'success' ? 'успешно' : json.error;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initFilesPage();
    initUpload();
});
