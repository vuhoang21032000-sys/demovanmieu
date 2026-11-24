"use strict";
const config = window.MUSEUM;
const $ = id => document.getElementById(id);
const lookup = (items, id) => items.find(item => item.id === id);
const route = (section, id) => '#' + section + (id ? '/' + id : '');
const libraries = new Map();
const uploads = { scene: new Map(), model: new Map() };
let viewer, model, scene = config.scenes[0], artifact = config.objects[0];
let page, tourTimer, generation = 0, soundOn = false, narrating = false;
let canvaUrl = config.canva;
const audio = Object.fromEntries(Object.entries(config.audio).map(([key, src]) => [
  key, src ? new Audio(src) : null
]));
const voice = new Audio();
for (const track of [audio.music, audio.ambience]) if (track) track.loop = true;

function loadScript(path, type) {
  if (!libraries.has(path)) {
    const pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = path;
      if (type) script.type = type;
      script.onload = resolve;
      script.onerror = () => { script.remove(); reject(new Error(path)); };
      document.head.append(script);
    }).catch(error => { libraries.delete(path); throw error; });
    libraries.set(path, pending);
  }
  return libraries.get(path);
}
function dialog(title, ...elements) {
  $('dialogTitle').textContent = title;
  $('dialogBody').replaceChildren(...elements);
  if (!$('dialog').open) $('dialog').showModal();
}
function paragraph(content) {
  const el = document.createElement('p');
  el.textContent = content;
  return el;
}
function button(label, action) {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = label;
  el.onclick = action;
  return el;
}
function status(kind, message, busy = false) {
  const el = $(kind + 'Status');
  el.textContent = message;
  el.hidden = !message;
  const bar = $(kind + 'Progress');
  bar.hidden = !busy;
  bar.removeAttribute('value');
}
function animate(stage) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  loadScript('vendor/gsap.min.js').then(() => {
    window.gsap.fromTo(stage, { opacity: .55 }, { opacity: 1, duration: .5, overwrite: true });
  }).catch(() => {
    stage.classList.remove('fade');
    void stage.offsetWidth;
    stage.classList.add('fade');
  });
}
function setTourControls(ready) {
  document.querySelectorAll('[data-pano]').forEach(el => el.disabled = !ready);
  $('fullscreen').disabled = !ready || !document.fullscreenEnabled;
}
function setModelControls(ready) {
  document.querySelectorAll('[data-model], #rotate, #reset').forEach(el => el.disabled = !ready);
}
function setAuto(enabled) {
  clearInterval(tourTimer);
  tourTimer = null;
  const control = $('autotour');
  control.setAttribute('aria-pressed', String(enabled));
  control.textContent = enabled ? 'Dừng tham quan tự động' : 'Tham quan tự động';
  if (enabled) tourTimer = setInterval(() => {
    const playable = config.scenes.filter(item => item.panorama || uploads.scene.has(item.id));
    if (!playable.length) return setAuto(false);
    const index = playable.indexOf(scene);
    if (playable.length === 1 && index === 0) return;
    location.hash = route('tham-quan', playable[(index + 1) % playable.length].id);
  }, 8500);
  if (viewer) enabled ? viewer.startAutoRotate(-2) : viewer.stopAutoRotate();
}
function updateAutoControl() {
  $('autotour').disabled = !config.scenes.some(item => item.panorama || uploads.scene.has(item.id));
}
async function showScene(id, token) {
  scene = lookup(config.scenes, id) || config.scenes[0];
  $('sceneTitle').textContent = scene.title;
  $('sceneMap').replaceChildren(...config.scenes.map(item => {
    const el = button(item.title, () => { location.hash = route('tham-quan', item.id); });
    el.setAttribute('aria-current', String(item.id === scene.id));
    return el;
  }));
  setTourControls(false);
  updateAutoControl();
  const source = uploads.scene.get(scene.id) || scene.panorama;
  if (!source) return status('tour', 'Chưa có ảnh 360° ở vị trí này. Chọn ảnh panorama tỉ lệ 2:1 để xem thử.');
  status('tour', 'Đang tải ảnh 360°…', true);
  try {
    await loadScript('vendor/pannellum.js');
    if (token !== generation) return;
    if (!$('panoCSS')) {
      const css = document.createElement('link');
      css.id = 'panoCSS'; css.rel = 'stylesheet'; css.href = 'vendor/pannellum.css';
      document.head.append(css);
    }
    const hotSpots = scene.points.flatMap(point => {
      const target = point.scene ? lookup(config.scenes, point.scene) : lookup(config.objects, point.object);
      if (!target) return [];
      const href = route(point.scene ? 'tham-quan' : 'hien-vat', target.id);
      return [{ pitch: point.pitch, yaw: point.yaw, type: 'info', cssClass: 'hotspot',
        text: target.title, createTooltipFunc(el) {
          el.title = target.title;
          el.tabIndex = 0;
          el.setAttribute('role', 'link');
          el.setAttribute('aria-label', target.title);
          el.onkeydown = event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              location.hash = href;
            }
          };
        }, clickHandlerFunc() { location.hash = href; } }];
    });
    viewer = window.pannellum.viewer('panorama', {
      type: 'equirectangular', panorama: source, autoLoad: true, showControls: false,
      yaw: scene.yaw || 0, autoRotate: tourTimer ? -2 : false, hotSpots
    });
    viewer.on('load', () => { if (token === generation) { status('tour', ''); setTourControls(true); viewer.resize(); } });
    viewer.on('error', () => { if (token === generation) status('tour', 'Không mở được panorama. Kiểm tra tệp và khả năng hỗ trợ WebGL.'); });
  } catch {
    if (token === generation) status('tour', 'Không khởi động được trình xem 360°. Kiểm tra thư mục vendor và thử lại.');
  }
}
async function showObject(id, token) {
  artifact = lookup(config.objects, id) || config.objects[0];
  $('objectTitle').textContent = artifact.title;
  $('objectInfo').textContent = artifact.info;
  $('objectSelect').value = artifact.id;
  $('backTour').href = route('tham-quan', scene.id);
  setModelControls(false);
  const source = uploads.model.get(artifact.id) || artifact.model;
  if (!source) return status('model', 'Chưa có mô hình GLB cho hiện vật này. Nạp tệp GLB từ máy để xoay và quan sát.');
  status('model', 'Đang tải mô hình GLB…', true);
  try {
    await loadScript('vendor/model-viewer.min.js', 'module');
    if (token !== generation) return;
    await customElements.whenDefined('model-viewer');
    if (token !== generation) return;
    model = document.createElement('model-viewer');
    const current = model;
    for (const [key, value] of Object.entries({
      alt: artifact.title, 'camera-controls': '', 'touch-action': 'pan-y',
      'environment-image': artifact.environment || 'neutral', 'shadow-intensity': '1', exposure: '1', loading: 'eager'
    })) current.setAttribute(key, value);
    $('rotate').setAttribute('aria-pressed', 'false');
    for (const [index, point] of artifact.hotspots.entries()) {
      const el = button(point.label, () => dialog(point.label, paragraph(point.text)));
      el.className = 'hotspot';
      el.slot = 'hotspot-' + index;
      el.dataset.position = point.position;
      el.dataset.normal = point.normal || '0m 1m 0m';
      current.append(el);
    }
    current.addEventListener('progress', event => {
      if (token === generation && !$('modelProgress').hidden) $('modelProgress').value = event.detail.totalProgress;
    });
    current.addEventListener('load', () => {
      if (token === generation) { status('model', ''); setModelControls(true); }
    });
    current.addEventListener('error', () => {
      if (token === generation) status('model', 'Không mở được mô hình. Hãy kiểm tra tệp GLB, dữ liệu nén và WebGL.');
    });
    current.src = source;
    $('modelHost').replaceChildren(current);
  } catch {
    if (token === generation) status('model', 'Không khởi động được trình xem 3D. Kiểm tra thư mục vendor và thử lại.');
  }
}
function play(track) {
  if (!track || !soundOn) return;
  track.volume = Number($('volume').value);
  return track.play().catch(() => {
    $('audioStatus').textContent = 'Không phát được âm thanh. Kiểm tra tệp hoặc quyền phát của trình duyệt.';
  });
}
function effect(track) {
  if (track && soundOn) { track.currentTime = 0; play(track); }
}
function stopNarration() {
  voice.pause();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  narrating = false;
  $('narrate').textContent = 'Nghe thuyết minh';
}
function enableSound(enabled) {
  soundOn = enabled;
  $('sound').setAttribute('aria-pressed', String(enabled));
  $('sound').textContent = enabled ? 'Tắt âm thanh' : 'Bật âm thanh';
  if (enabled) { play(audio.music); play(audio.ambience); }
  else { Object.values(audio).forEach(track => track?.pause()); stopNarration(); }
  if (enabled && !audio.music && !audio.ambience) {
    $('audioStatus').textContent = 'Nhạc và âm thanh nền đang chờ tư liệu. Bạn có thể nghe giọng đọc ở phòng hiện vật.';
  }
}
function narrate(restart) {
  if (!restart && narrating) {
    if (artifact.audio) voice.pause();
    else window.speechSynthesis.pause();
    narrating = false;
    $('narrate').textContent = 'Tiếp tục thuyết minh';
    return;
  }
  if (!soundOn) enableSound(true);
  const resume = !restart && $('narrate').textContent === 'Tiếp tục thuyết minh';
  if (!artifact.audio && (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window))) {
    return dialog('Thuyết minh', paragraph('Thiết bị chưa hỗ trợ giọng đọc tự động.'), paragraph(artifact.info));
  }
  narrating = true;
  $('narrate').textContent = 'Tạm dừng thuyết minh';
  const done = () => { narrating = false; $('narrate').textContent = 'Nghe thuyết minh'; };
  if (artifact.audio) {
    if (!resume) voice.src = artifact.audio;
    voice.onended = done;
    voice.onerror = done;
    play(voice);
  } else if (resume) window.speechSynthesis.resume();
  else {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(artifact.title + '. ' + artifact.info);
    speech.lang = 'vi-VN';
    speech.volume = Number($('volume').value);
    const vietnamese = window.speechSynthesis.getVoices().find(v => /^vi\b/i.test(v.lang));
    if (!vietnamese) {
      done();
      return dialog('Thuyết minh', paragraph('Thiết bị chưa có giọng tiếng Việt hoặc giọng đọc chưa tải xong.'), paragraph(artifact.info));
    }
    speech.voice = vietnamese;
    speech.onend = done;
    speech.onerror = event => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        done();
        dialog('Thuyết minh', paragraph('Không phát được giọng đọc trên thiết bị này.'), paragraph(artifact.info));
      }
    };
    window.speechSynthesis.speak(speech);
  }
}
function redraw(scroll = false) {
  const [name, id] = location.hash.slice(1).split('/');
  const views = { 'xem-khu-bia': 'photo', 'tham-quan': 'tour', 'hien-vat': 'objects', 'lich-su': 'history', 'trac-nghiem': 'quiz' };
  const next = Object.hasOwn(views, name) ? views[name] : 'home';
  const token = ++generation;
  if (viewer) { viewer.destroy(); viewer = null; }
  if (model) { model.remove(); model = null; }
  if (next !== 'tour') {
    setAuto(false);
    if (document.fullscreenElement === $('tourStage')) document.exitFullscreen().catch(() => {});
  }
  if (page === 'objects') stopNarration();
  if (scroll && page !== next) window.scrollTo(0, 0);
  if (page) effect(audio.transition);
  page = next;
  document.querySelectorAll('.view').forEach(el => el.hidden = el.id !== page);
  if (page === 'tour') { showScene(id, token); animate($('tourStage')); }
  if (page === 'objects') { showObject(id, token); animate($('modelStage')); }
}
async function upload(event, type, id) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const key = location.hash;
  const url = URL.createObjectURL(file);
  try {
    if (type === 'scene') {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (Math.abs(image.width / image.height - 2) > .05) throw new Error('Ảnh cần ở định dạng panorama toàn cầu với tỉ lệ gần 2:1.');
    } else {
      const header = new DataView(await file.slice(0, 12).arrayBuffer());
      if (header.byteLength !== 12 || header.getUint32(0, true) !== 0x46546c67 ||
          header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== file.size) {
        throw new Error('Tệp cần là GLB 2.0 hợp lệ.');
      }
    }
    const old = uploads[type].get(id);
    if (old) URL.revokeObjectURL(old);
    uploads[type].set(id, url);
    if (location.hash === key) redraw();
  } catch (error) {
    URL.revokeObjectURL(url);
    dialog('Không nạp được tệp', paragraph(error.message));
  }
}
function allowedCanva(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /(^|\.)canva\.com$|^canva\.link$/i.test(url.hostname) ? url.href : '';
  } catch { return ''; }
}
function canva() {
  const link = allowedCanva(canvaUrl);
  if (link) { location.assign(link); return; }
  const form = document.createElement('form');
  const input = document.createElement('input');
  input.type = 'url'; input.required = true;
  input.setAttribute('aria-label', 'Đường dẫn xem hoặc trình chiếu Canva');
  input.placeholder = 'https://www.canva.com/design/…/view';
  const submit = document.createElement('button');
  submit.textContent = 'Mở Canva';
  form.append(input, submit);
  form.onsubmit = event => {
    event.preventDefault();
    const value = allowedCanva(input.value);
    if (!value) { input.setCustomValidity('Hãy nhập link HTTPS của Canva.'); input.reportValidity(); return; }
    canvaUrl = value;
    try { sessionStorage.setItem('museum-canva', value); } catch {}
    location.assign(value);
  };
  input.oninput = () => input.setCustomValidity('');
  dialog('Quay lại Canva', paragraph('Dán link xem hoặc trình chiếu của nhóm. Để khách mở trực tiếp, điền link vào js/config.js trước khi đăng web.'), form);
}
async function share() {
  const url = new URL(location.href);
  if (!url.hash) url.hash = 'trang-chu';
  const field = document.createElement('input');
  field.readOnly = true; field.value = url.href;
  field.setAttribute('aria-label', 'Đường dẫn khu vực hiện tại');
  const message = paragraph('Sao chép link để dán vào Canva hoặc gửi qua Zalo.');
  const controls = document.createElement('div');
  controls.className = 'actions';
  controls.append(button('Sao chép link', async () => {
    try { await navigator.clipboard.writeText(field.value); message.textContent = 'Đã sao chép đường dẫn.'; }
    catch { field.select(); message.textContent = 'Nhấn Ctrl+C hoặc chọn Sao chép trên điện thoại.'; }
  }));
  if (navigator.share) controls.append(button('Gửi qua ứng dụng', () => navigator.share({ title: document.title, url: field.value }).catch(() => {})));
  dialog('Chia sẻ khu vực này', message, field, controls);
  if (!/^(https?:)$/.test(url.protocol) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)) {
    $('dialogBody').append(paragraph('Mã QR dùng được trên điện thoại sau khi trang có địa chỉ web công khai.'));
    return;
  }
  try {
    await loadScript('vendor/qrcode.js');
    if ($('dialogTitle').textContent !== 'Chia sẻ khu vực này') return;
    const qr = window.qrcode(0, 'M');
    qr.addData(url.href); qr.make();
    const canvas = document.createElement('canvas');
    const size = qr.getModuleCount();
    canvas.width = canvas.height = (size + 8) * 4;
    canvas.setAttribute('aria-label', 'Mã QR mở khu vực hiện tại');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
      if (qr.isDark(row, col)) ctx.fillRect((col + 4) * 4, (row + 4) * 4, 4, 4);
    }
    $('dialogBody').append(canvas);
  } catch { $('dialogBody').append(paragraph('Không tạo được mã QR. Bạn vẫn có thể sao chép đường dẫn.')); }
}
const questions = [
  ['Bao nhiêu bia tiến sĩ còn lưu giữ tại Văn Miếu?', ['33', '82', '130'], 1, 'Hiện còn 82 bia tiến sĩ tại khu di tích.'],
  ['Những tấm bia đầu tiên được dựng vào năm nào?', ['1442', '1484', '1779'], 1, 'Năm 1442 là năm thi khoa Nhâm Tuất. Những tấm bia đầu tiên được dựng năm 1484.'],
  ['Bộ bia giúp tìm hiểu trực tiếp điều gì?', ['Khoa cử và việc tuyển chọn nhân tài', 'Đường biển thời Lê', 'Lịch sử nghề làm gốm'], 0, 'Văn bia lưu dấu các khoa thi và danh tính những người đỗ đạt.']
];
function setupQuiz() {
  const form = $('quizForm');
  questions.forEach(([question, choices], i) => {
    const group = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = (i + 1) + '. ' + question;
    group.append(legend);
    choices.forEach((choice, j) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'q' + i; input.value = j; input.required = true;
      label.append(input, ' ' + choice); group.append(label);
    });
    const feedback = paragraph('');
    feedback.id = 'feedback' + i; feedback.hidden = true;
    group.append(feedback); form.append(group);
  });
  const submit = document.createElement('button');
  submit.textContent = 'Xem kết quả'; submit.className = 'primary';
  form.append(submit, button('Làm lại', () => {
    form.reset(); $('score').textContent = '';
    questions.forEach((_, i) => $('feedback' + i).hidden = true);
  }));
  form.onsubmit = event => {
    event.preventDefault();
    const answers = new FormData(form);
    let correct = 0;
    questions.forEach(([, , answer, explanation], i) => {
      const right = Number(answers.get('q' + i)) === answer;
      if (right) correct++;
      const el = $('feedback' + i);
      el.textContent = (right ? 'Đúng. ' : 'Chưa đúng. ') + explanation;
      el.hidden = false;
    });
    $('score').textContent = 'Kết quả ' + correct + '/' + questions.length + ' câu đúng';
  };
}
try { canvaUrl ||= sessionStorage.getItem('museum-canva') || ''; } catch {}
$('team').textContent = config.team;
for (const item of config.objects) $('objectSelect').add(new Option(item.title, item.id));
$('objectSelect').onchange = () => { location.hash = route('hien-vat', $('objectSelect').value); };
$('panofile').onchange = event => upload(event, 'scene', scene.id);
$('glbfile').onchange = event => upload(event, 'model', artifact.id);
$('autotour').onclick = () => setAuto(!tourTimer);
$('fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('tourStage').requestFullscreen();
  } catch { dialog('Toàn màn hình', paragraph('Trình duyệt không mở được chế độ toàn màn hình.')); }
};
document.addEventListener('fullscreenchange', () => viewer?.resize());
document.querySelectorAll('[data-pano]').forEach(el => el.onclick = () => {
  if (viewer) viewer.setHfov(viewer.getHfov() + (el.dataset.pano === 'in' ? -10 : 10));
});
document.querySelectorAll('[data-model]').forEach(el => el.onclick = () => {
  if (model) model.zoom(el.dataset.model === 'in' ? 1 : -1);
});
$('rotate').onclick = () => {
  if (model) $('rotate').setAttribute('aria-pressed', String(model.toggleAttribute('auto-rotate')));
};
$('reset').onclick = () => {
  if (!model) return;
  model.removeAttribute('auto-rotate');
  $('rotate').setAttribute('aria-pressed', 'false');
  model.resetTurntableRotation();
  model.cameraOrbit = 'auto auto auto';
  model.cameraTarget = 'auto auto auto';
  model.fieldOfView = 'auto';
  model.jumpCameraToGoal();
};
$('narrate').onclick = () => narrate(false);
$('replay').onclick = () => narrate(true);
$('sound').onclick = () => enableSound(!soundOn);
$('volume').oninput = () => {
  for (const track of [...Object.values(audio), voice]) if (track) track.volume = Number($('volume').value);
};
$('share').onclick = share;
document.querySelectorAll('[data-canva]').forEach(el => {
  el.hidden = !allowedCanva(canvaUrl);
  el.onclick = canva;
});
const photoDetails = {
  shelter: 'Các nhà che giúp bảo vệ những dãy bia đá ở hai bên giếng Thiên Quang. Năm 1994, khu di tích xây thêm tám nhà che bia.',
  inscription: 'Văn bia ghi khoa thi và tên người đỗ. Nội dung còn cho biết những người tham gia soạn, hiệu đính, viết chữ và khắc bia.',
  turtle: 'Bia đặt trên đế đá tạc hình rùa. Kiểu dáng đế rùa và hoa văn trên bia thay đổi qua các thời kỳ.'
};
const detailButtons = [...document.querySelectorAll('[data-detail]')];
for (const detail of detailButtons) detail.onclick = () => {
  detailButtons.forEach(item => item.setAttribute('aria-pressed', String(item === detail)));
  $('photoDetail').textContent = photoDetails[detail.dataset.detail];
};
document.addEventListener('click', event => {
  if (event.target.closest('button, a, summary, select')) effect(audio.interaction);
});
window.addEventListener('hashchange', () => redraw(true));
setupQuiz();
window.speechSynthesis?.getVoices();
redraw();
