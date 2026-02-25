// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL     = 'http://localhost:3000/api/download';
const SAVE_URL    = 'http://localhost:3000/api/save';
const CSV_URL     = 'http://localhost:3000/api/raw/csv';   // proxied — fixes CORS
const TSV_URL     = 'http://localhost:3000/api/raw/tsv';   // proxied — fixes CORS
const FILENAME    = 'output.json';
const POLL_INTERVAL_MS = 50000*6; // 5 minutes

// ─── State ────────────────────────────────────────────────────────────────────
let allData     = [];
let currentPage = 1;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const tableBody    = document.getElementById('tableBody');
const pageButtons  = document.getElementById('pageButtons');
const prevBtn      = document.getElementById('prevBtn');
const nextBtn      = document.getElementById('nextBtn');
const rowsPerPageEl = document.getElementById('rowsPerPage');

// ─── iFrame mode toggle (Preview / Edit) ─────────────────────────────────────
function setIframeMode(mode) {
    const previewPanel = document.getElementById('iframePreviewPanel');
    const editPanel    = document.getElementById('iframeEditPanel');
    const btnPreview   = document.getElementById('btnModePreview');
    const btnEdit      = document.getElementById('btnModeEdit');
    const desc         = document.getElementById('iframeModeDesc');

    if (mode === 'preview') {
        previewPanel.classList.remove('hidden');
        editPanel.classList.add('hidden');
        btnPreview.classList.add('bg-blue-500', 'text-white');
        btnPreview.classList.remove('text-gray-600', 'hover:bg-gray-100');
        btnEdit.classList.remove('bg-green-600', 'text-white');
        btnEdit.classList.add('text-gray-600', 'hover:bg-gray-100');
        desc.textContent = 'Read-only preview.';
    } else {
        previewPanel.classList.add('hidden');
        editPanel.classList.remove('hidden');
        btnEdit.classList.add('bg-green-600', 'text-white');
        btnEdit.classList.remove('text-gray-600', 'hover:bg-gray-100');
        btnPreview.classList.remove('bg-blue-500', 'text-white');
        btnPreview.classList.add('text-gray-600', 'hover:bg-gray-100');
        desc.textContent = 'Edit mode — editing directly in Google Sheets (autosave).';
    }
}

// ─── Tab switching ────────────────────────────────────────────────────────────
function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white', 'shadow');
        btn.classList.add('text-gray-600', 'hover:bg-gray-100');
    });
    document.getElementById(id).classList.add('active');
    const activeBtn = document.getElementById('btn-' + id);
    activeBtn.classList.add('bg-blue-500', 'text-white', 'shadow');
    activeBtn.classList.remove('text-gray-600', 'hover:bg-gray-100');
}

// ─── Display 2: CSV & TSV raw text ───────────────────────────────────────────
function loadCSV() {
    fetch(CSV_URL)
        .then(r => r.text())
        .then(text => {
            document.getElementById('csvLoading').classList.add('hidden');
            const el = document.getElementById('csvContent');
            el.textContent = text;
            el.classList.remove('hidden');
        })
        .catch(err => {
            document.getElementById('csvLoading').textContent = 'Failed to load CSV: ' + err.message;
        });
}

function loadTSV() {
    fetch(TSV_URL)
        .then(r => r.text())
        .then(text => {
            document.getElementById('tsvLoading').classList.add('hidden');
            const el = document.getElementById('tsvContent');
            el.textContent = text;
            el.classList.remove('hidden');
        })
        .catch(err => {
            document.getElementById('tsvLoading').textContent = 'Failed to load TSV: ' + err.message;
        });
}

// ─── Display 3 & 4: fetch from API ───────────────────────────────────────────
function fetchAPIData() {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    console.log(`[Polling] Date: ${dateStr} | Time: ${timeStr} | File: ${FILENAME}`);

    // Update header timestamp
    document.getElementById('lastUpdated').textContent =
        'Updated ' + now.toLocaleTimeString();

    fetch(API_URL)
        .then(r => r.json())
        .then(json => {
            // ── Display 3: pretty JSON ──
            document.getElementById('jsonLoading').classList.add('hidden');
            const jsonEl = document.getElementById('jsonContent');
            jsonEl.textContent = JSON.stringify(json, null, 2);
            jsonEl.classList.remove('hidden');

            // ── Display 4: table ──
            allData = json.data || [];
            document.getElementById('tableLoading').classList.add('hidden');

            if (allData.length === 0) {
                document.getElementById('tableEmpty').classList.remove('hidden');
            } else {
                document.getElementById('tableEmpty').classList.add('hidden');
                renderPage(currentPage);
            }
        })
        .catch(err => {
            console.error('[API Error]', err);
            document.getElementById('jsonLoading').innerHTML =
                '<p class="text-red-500">Error: ' + err.message + '</p>';
            document.getElementById('tableLoading').innerHTML =
                '<p class="text-red-500 py-8 text-center">Error: ' + err.message + '</p>';
        });
}

// ─── Display 4: render paginated table ───────────────────────────────────────
function getRowsPerPage() {
    return parseInt(rowsPerPageEl.value, 10) || 5;
}

function renderPage(page) {
    const itemsPerPage = getRowsPerPage();
    const totalPages   = Math.max(1, Math.ceil(allData.length / itemsPerPage));

    // Clamp page in case rows-per-page changed
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    currentPage = page;

    const startIdx = (page - 1) * itemsPerPage;
    const endIdx   = startIdx + itemsPerPage;
    const pageData = allData.slice(startIdx, endIdx);

    // Populate rows
    tableBody.innerHTML = '';
    pageData.forEach((row, i) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';
        tr.innerHTML = `
            <td class="px-5 py-3 text-sm text-gray-500">${startIdx + i + 1}</td>
            <td class="px-5 py-3 text-sm font-mono text-gray-800">${row.code  || '-'}</td>
            <td class="px-5 py-3 text-sm text-gray-800">${row.name  || '-'}</td>
            <td class="px-5 py-3 text-sm text-blue-600">${row.mail  || '-'}</td>
            <td class="px-5 py-3 text-sm text-gray-700">${row.byear || '-'}</td>
            <td class="px-5 py-3 text-sm text-gray-700">${row.city  || '-'}</td>
        `;
        tableBody.appendChild(tr);
    });

    // Pagination info
    document.getElementById('currentPageLabel').textContent = page;
    document.getElementById('totalPagesLabel').textContent  = totalPages;
    document.getElementById('showingStart').textContent     = allData.length ? startIdx + 1 : 0;
    document.getElementById('showingEnd').textContent       = Math.min(endIdx, allData.length);
    document.getElementById('totalCount').textContent       = allData.length;

    prevBtn.disabled = page === 1;
    nextBtn.disabled = page === totalPages;

    // Page number buttons
    pageButtons.innerHTML = '';
    const maxVisible = 7;
    let pages = [];
    if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages = [1];
        if (page > 3) pages.push('...');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }
    pages.forEach(p => {
        if (p === '...') {
            const span = document.createElement('span');
            span.className = 'px-2 py-1.5 text-gray-400 text-sm';
            span.textContent = '…';
            pageButtons.appendChild(span);
            return;
        }
        const btn = document.createElement('button');
        btn.className = `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            p === page
                ? 'bg-blue-500 text-white shadow-sm'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
        }`;
        btn.textContent = p;
        btn.onclick = () => renderPage(p);
        pageButtons.appendChild(btn);
    });
}

// ─── Pagination controls ──────────────────────────────────────────────────────
prevBtn.addEventListener('click', () => { if (currentPage > 1) renderPage(currentPage - 1); });
nextBtn.addEventListener('click', () => {
    const total = Math.ceil(allData.length / getRowsPerPage());
    if (currentPage < total) renderPage(currentPage + 1);
});
rowsPerPageEl.addEventListener('change', () => renderPage(1));

// ─── Init ─────────────────────────────────────────────────────────────────────
loadCSV();
loadTSV();
fetchAPIData();                               // initial load
setInterval(fetchAPIData, POLL_INTERVAL_MS);  // polling every 5 s