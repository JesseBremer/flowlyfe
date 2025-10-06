// Main application logic
console.log('Flowlyfe app initialized');

// Storage key
const STORAGE_KEY = 'flowlyfe_inbox';

// App state
const state = {
    items: [],
    currentPage: 'capture'
};

// DOM elements
let captureInput;
let captureBtn;
let captureStatus;
let viewInboxBtn;
let backBtn;
let inboxCount;
let inboxList;
let capturePage;
let inboxPage;

// Initialize app
function init() {
    console.log('App ready');

    // Get DOM elements
    captureInput = document.getElementById('captureInput');
    captureBtn = document.getElementById('captureBtn');
    captureStatus = document.getElementById('captureStatus');
    viewInboxBtn = document.getElementById('viewInboxBtn');
    backBtn = document.getElementById('backBtn');
    inboxCount = document.getElementById('inboxCount');
    inboxList = document.getElementById('inboxList');
    capturePage = document.getElementById('capturePage');
    inboxPage = document.getElementById('inboxPage');

    // Load items from localStorage
    loadItems();

    // Event listeners
    captureBtn.addEventListener('click', handleCapture);
    captureInput.addEventListener('keydown', handleInputKeydown);
    viewInboxBtn.addEventListener('click', () => showPage('inbox'));
    backBtn.addEventListener('click', () => showPage('capture'));

    // Auto-expand textarea
    captureInput.addEventListener('input', autoExpandTextarea);

    // Update UI
    updateInboxCount();
}

// Auto-expand textarea as user types
function autoExpandTextarea() {
    captureInput.style.height = 'auto';
    captureInput.style.height = captureInput.scrollHeight + 'px';
}

// Handle keyboard shortcuts in capture input
function handleInputKeydown(e) {
    // Cmd/Ctrl + Enter to capture
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCapture();
    }
}

// Capture item
function handleCapture() {
    const content = captureInput.value.trim();

    if (!content) {
        showStatus('Please enter something to capture', 'error');
        return;
    }

    const item = {
        id: Date.now(),
        content: content,
        timestamp: new Date().toISOString()
    };

    state.items.unshift(item); // Add to beginning
    saveItems();

    // Clear input and reset height
    captureInput.value = '';
    captureInput.style.height = 'auto';

    // Show success message
    showStatus('Captured!', 'success');

    // Update count
    updateInboxCount();

    // Focus back on input
    captureInput.focus();
}

// Show status message
function showStatus(message, type) {
    captureStatus.textContent = message;
    captureStatus.className = `status-message ${type}`;

    // Clear after 2 seconds
    setTimeout(() => {
        captureStatus.textContent = '';
        captureStatus.className = 'status-message';
    }, 2000);
}

// Update inbox count badge
function updateInboxCount() {
    inboxCount.textContent = state.items.length;
}

// Show page
function showPage(page) {
    state.currentPage = page;

    if (page === 'capture') {
        capturePage.classList.add('active');
        inboxPage.classList.remove('active');
        captureInput.focus();
    } else if (page === 'inbox') {
        capturePage.classList.remove('active');
        inboxPage.classList.add('active');
        renderInbox();
    }
}

// Render inbox items
function renderInbox() {
    if (state.items.length === 0) {
        inboxList.innerHTML = `
            <div class="empty-state">
                <p>Your inbox is empty</p>
                <p>Capture your first thought!</p>
            </div>
        `;
        return;
    }

    inboxList.innerHTML = state.items.map(item => `
        <div class="inbox-item" data-id="${item.id}">
            <div class="inbox-item-content">${escapeHtml(item.content)}</div>
            <div class="inbox-item-meta">
                <span class="inbox-item-time">${formatTimestamp(item.timestamp)}</span>
                <button class="delete-btn" onclick="deleteItem(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete item
function deleteItem(id) {
    if (confirm('Delete this item?')) {
        state.items = state.items.filter(item => item.id !== id);
        saveItems();
        renderInbox();
        updateInboxCount();
    }
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Save items to localStorage
function saveItems() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        showStatus('Error saving data', 'error');
    }
}

// Load items from localStorage
function loadItems() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            state.items = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        state.items = [];
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
