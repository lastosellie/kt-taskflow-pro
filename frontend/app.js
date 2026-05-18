// ─── 상태 (모듈 스코프 단일 진실 공급원) ─────────────────
const API = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:8000/api'
  : '/api';
let tasks = [];
let pollingTimer = null;
let editingId = null;

// ─── API ──────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function fetchTasks() {
  try {
    tasks = await apiFetch('/tasks');
    renderTasks();
    hideError();
  } catch {
    showError('서버에 연결할 수 없습니다. 백엔드(uvicorn)가 실행 중인지 확인하세요.');
  }
}

const createTask = (data) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) });
const updateTask = (id, data) => apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
const deleteTask = (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' });

// ─── 유틸 ─────────────────────────────────────────────────
function formatDueAt(dueAtStr) {
  if (!dueAtStr) return null;
  const due = new Date(dueAtStr);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueMidnight  = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueMidnight - todayMidnight) / 86_400_000);
  const hh = String(due.getHours()).padStart(2, '0');
  const mm = String(due.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;
  if (diffDays < 0) return { text: `D+${Math.abs(diffDays)} ${time}`, overdue: true };
  // 당일이라도 시각이 지나면 빨간색
  return { text: `D-${diffDays} ${time}`, overdue: due < now };
}

const STATUS_LABEL = { todo: 'Todo', in_progress: 'In Progress', done: 'Done' };
const STATUS_CLASS = {
  todo:        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  done:        'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
};

// 로컬 datetime-local 값 → UTC ISO 문자열
function localToISO(val) {
  return val ? new Date(val).toISOString() : null;
}

// UTC ISO 문자열 → datetime-local 입력값 ("YYYY-MM-DDTHH:MM")
function isoToLocal(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// ─── 렌더 ─────────────────────────────────────────────────
function renderTasks() {
  const container = document.getElementById('task-list');
  if (!tasks.length) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <span class="text-5xl mb-4">📋</span>
        <p class="text-sm">태스크가 없습니다.</p>
        <p class="text-xs mt-1">+ 새 태스크 버튼으로 추가하세요.</p>
      </div>`;
    return;
  }

  container.innerHTML = tasks.map(taskCardHTML).join('');

  // 카드 클릭 → 수정 모달
  container.querySelectorAll('[data-edit-id]').forEach((el) =>
    el.addEventListener('click', () => openEditModal(Number(el.dataset.editId)))
  );
  // 휴지통 → 삭제 확인
  container.querySelectorAll('[data-delete-id]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDelete(Number(el.dataset.deleteId));
    })
  );
  // 마감 시각 인라인 편집
  container.querySelectorAll('[data-due-edit]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.stopPropagation(); // 카드 클릭(수정 모달) 방지
      openInlineDueEdit(Number(el.dataset.dueEdit), el);
    })
  );
}

function taskCardHTML(t) {
  const due = formatDueAt(t.due_at);
  // 클릭하면 인라인 datetime-local 입력기로 전환
  const dueHTML = due
    ? `<button type="button"
               class="text-xs mt-1 block ${due.overdue ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}
                      hover:text-blue-500 dark:hover:text-blue-400 hover:underline transition-colors text-left"
               data-due-edit="${t.id}" data-due-iso="${t.due_at}"
               title="클릭하여 마감 시각 변경">${due.text}</button>`
    : `<button type="button"
               class="text-xs mt-1 block text-gray-300 dark:text-gray-600
                      hover:text-blue-400 dark:hover:text-blue-400 transition-colors"
               data-due-edit="${t.id}" data-due-iso=""
               title="마감 시각 설정">+ 마감 설정</button>`;
  return `
    <article class="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                    rounded-xl shadow-md hover:shadow-lg
                    border border-gray-200/60 dark:border-gray-700/60
                    p-4 cursor-pointer select-none
                    transition-all duration-200 hover:-translate-y-0.5"
             data-edit-id="${t.id}">
      <button class="absolute top-2.5 right-2.5
                     opacity-0 group-hover:opacity-100 focus:opacity-100
                     min-w-[44px] min-h-[44px] flex items-center justify-center
                     rounded-lg text-gray-400 hover:text-red-500
                     hover:bg-red-50 dark:hover:bg-red-900/20
                     transition-all duration-150"
              data-delete-id="${t.id}"
              title="삭제"
              aria-label="태스크 삭제">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
                   a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4
                   a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
      <div class="mb-2.5 pr-8">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[t.status] ?? ''}">
          ${STATUS_LABEL[t.status] ?? t.status}
        </span>
      </div>
      <p class="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug mb-2 line-clamp-2">
        ${escapeHTML(t.title)}
      </p>
      ${dueHTML}
    </article>`;
}

// ─── 추가 폼 ──────────────────────────────────────────────
function showAddForm() {
  document.getElementById('add-form-section').classList.remove('hidden');
  document.getElementById('add-title').focus();
}

function hideAddForm() {
  document.getElementById('add-form-section').classList.add('hidden');
  document.getElementById('add-form').reset();
}

document.getElementById('btn-add').addEventListener('click', showAddForm);
document.getElementById('btn-add-cancel').addEventListener('click', hideAddForm);

document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.submitter;
  btn.disabled = true;
  try {
    await createTask({
      title:       document.getElementById('add-title').value.trim(),
      description: document.getElementById('add-desc').value.trim() || null,
      status:      document.getElementById('add-status').value,
      due_at:      localToISO(document.getElementById('add-due').value),
    });
    hideAddForm();
    await fetchTasks();
  } catch (err) {
    alert(`저장 실패: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
});

// ─── 수정 모달 ────────────────────────────────────────────
function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  editingId = id;
  document.getElementById('edit-title').value  = task.title;
  document.getElementById('edit-desc').value   = task.description ?? '';
  document.getElementById('edit-status').value = task.status;
  document.getElementById('edit-due').value    = isoToLocal(task.due_at);
  document.getElementById('edit-modal').classList.remove('hidden');
  document.getElementById('edit-title').focus();
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingId = null;
}

// 모달 외부 클릭 닫기
document.getElementById('edit-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('edit-modal')) closeEditModal();
});
document.getElementById('btn-edit-close').addEventListener('click', closeEditModal);
document.getElementById('btn-edit-cancel').addEventListener('click', closeEditModal);

// ESC 키 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeEditModal();
});

document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!editingId) return;
  const btn = e.submitter;
  btn.disabled = true;
  try {
    await updateTask(editingId, {
      title:       document.getElementById('edit-title').value.trim(),
      description: document.getElementById('edit-desc').value.trim() || null,
      status:      document.getElementById('edit-status').value,
      due_at:      localToISO(document.getElementById('edit-due').value),
    });
    closeEditModal();
    await fetchTasks();
  } catch (err) {
    alert(`수정 실패: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
});

// ─── 마감 시각 인라인 편집 ────────────────────────────────
function openInlineDueEdit(id, btn) {
  const input = document.createElement('input');
  input.type = 'datetime-local';
  input.value = isoToLocal(btn.dataset.dueIso);
  input.className = [
    'text-xs px-1.5 py-0.5 rounded-lg cursor-pointer',
    'border border-blue-400 dark:border-blue-500',
    'bg-white dark:bg-gray-900',
    'text-gray-800 dark:text-gray-100',
    'focus:outline-none focus:ring-1 focus:ring-blue-400',
  ].join(' ');

  let saved = false;

  input.addEventListener('change', async () => {
    saved = true;
    try {
      await updateTask(id, { due_at: localToISO(input.value) || null });
    } catch (err) {
      alert(`마감 설정 실패: ${err.message}`);
    }
    await fetchTasks();
  });

  // change 없이 포커스 이탈 → 원래 표시로 복원
  input.addEventListener('blur', () => {
    if (!saved) setTimeout(fetchTasks, 80);
  });

  btn.replaceWith(input);
  input.focus();
  input.showPicker?.(); // 모던 브라우저에서 달력 즉시 오픈
}

// ─── 삭제 확인 ────────────────────────────────────────────
async function confirmDelete(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  if (!confirm(`"${task.title}"\n\n정말 삭제하시겠습니까?`)) return;
  try {
    await deleteTask(id);
    await fetchTasks();
  } catch (err) {
    alert(`삭제 실패: ${err.message}`);
  }
}

// ─── 에러 배너 ────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('error-banner');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-banner').classList.add('hidden');
}

// ─── 폴링 (3초, 탭 숨김 시 중단) ─────────────────────────
function startPolling() {
  if (pollingTimer) return;
  pollingTimer = setInterval(fetchTasks, 3_000);
}

function stopPolling() {
  clearInterval(pollingTimer);
  pollingTimer = null;
}

document.addEventListener('visibilitychange', () => {
  document.hidden ? stopPolling() : startPolling();
});

// ─── 테마 토글 ────────────────────────────────────────────
document.getElementById('btn-theme').addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
});

// ─── 초기화 ───────────────────────────────────────────────
(async function init() {
  // 테마 아이콘 초기 동기화
  const isDark = document.documentElement.classList.contains('dark');
  document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';

  await fetchTasks();
  startPolling();
})();
