const ITEMS_PER_PAGE = 3;
let allData = [];
let currentPage = 1;

const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const tableBody = document.getElementById('tableBody');
const pageButtons = document.getElementById('pageButtons');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Fetch data from backend
fetch('http://localhost:3000/api/download')
    .then(response => response.json())
    .then(data => {
        allData = data.data || [];
        loadingState.classList.add('hidden');
        
        if (allData.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            renderPage(1);
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        loadingState.innerHTML = '<p class="text-red-600">Error loading data. Make sure the backend is running.</p>';
    });

function renderPage(page) {
    currentPage = page;
    const totalPages = Math.ceil(allData.length / ITEMS_PER_PAGE);
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageData = allData.slice(startIdx, endIdx);

    // Clear table
    tableBody.innerHTML = '';

    // Populate table rows
    pageData.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${row.ID || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row.NAME || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${row.EMAIL || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row['BIRTH YEAR'] || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row.CITY || '-'}</td>
        `;
        tableBody.appendChild(tr);
    });

    // Update pagination info
    document.getElementById('currentPage').textContent = page;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('showingStart').textContent = startIdx + 1;
    document.getElementById('showingEnd').textContent = Math.min(endIdx, allData.length);
    document.getElementById('totalCount').textContent = allData.length;

    // Update buttons state
    prevBtn.disabled = page === 1;
    nextBtn.disabled = page === totalPages;

    // Render page buttons
    renderPageButtons(totalPages, page);
}

function renderPageButtons(totalPages, currentPageNum) {
    pageButtons.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            i === currentPageNum
                ? 'bg-blue-500 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`;
        btn.textContent = i;
        btn.onclick = () => renderPage(i);
        pageButtons.appendChild(btn);
    }
}

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) renderPage(currentPage - 1);
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(allData.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) renderPage(currentPage + 1);
});