function showMenu() {
  hideAll();
  document.getElementById('menu').classList.remove('hidden');
}

function showPage(id) {
  hideAll();
  document.getElementById(id).classList.remove('hidden');
  if (id === 'myfiles') loadFiles();
}

function hideAll() {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
}

function toggleTheme() {
  const body = document.body;
  const toggle = document.getElementById('themeToggle');
  if (body.classList.contains('dark')) {
    body.classList.remove('dark');
    toggle.textContent = '🌞';
  } else {
    body.classList.add('dark');
    toggle.textContent = '🌜';
  }
}

function search() {
  const params = new URLSearchParams({
    text: document.getElementById('sText').value,
    subject: document.getElementById('sSubject').value,
    course: document.getElementById('sCourse').value,
    university: document.getElementById('sUniversity').value,
    instructor: document.getElementById('sInstructor').value
  });
  fetch('/search?' + params.toString())
    .then(r => r.json())
    .then(data => {
      const ul = document.getElementById('results');
      ul.innerHTML = '';
      data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.fileName;
        ul.appendChild(li);
      });
    });
}

function uploadFiles() {
  const formData = new FormData();
  formData.append('university', document.getElementById('uUniversity').value);
  formData.append('instructor', document.getElementById('uInstructor').value);
  formData.append('course', document.getElementById('uCourse').value);
  formData.append('subject', document.getElementById('uSubject').value);
  formData.append('finalName', document.getElementById('uFinal').value);
  formData.append('visibility', document.getElementById('visibility').value);
  const files = document.getElementById('files').files;
  for (const f of files) formData.append('files', f);

  fetch('/upload', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(data => {
      document.getElementById('uploadMsg').textContent = 'Successfully saved';
    });
}

function loadFiles() {
  fetch('/files')
    .then(r => r.json())
    .then(data => {
      const ul = document.getElementById('fileList');
      ul.innerHTML = '';
      data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.fileName;
        ul.appendChild(li);
      });
    });
}
