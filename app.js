// Main application logic
console.log('Flowlyfe app initialized');

// Storage keys
const STORAGE_KEY = 'flowlyfe_inbox';
const CATEGORIES_KEY = 'flowlyfe_categories';

// App state
const state = {
    inbox: [],
    categories: {
        thoughts: [],
        todos: {
            active: [],
            someday: [],
            awaiting: []
        },
        contacts: []
    },
    currentPage: 'capture',
    processingItem: null
};

// DOM elements
let captureInput;
let captureBtn;
let captureStatus;
let viewInboxBtn;
let navBtns;
let inboxCount;
let inboxList;
let capturePage;
let inboxPage;
let thoughtsPage;
let todosPage;
let contactsPage;
let processModal;

// Initialize app
function init() {
    console.log('App ready');

    // Get DOM elements
    captureInput = document.getElementById('captureInput');
    captureBtn = document.getElementById('captureBtn');
    captureStatus = document.getElementById('captureStatus');
    viewInboxBtn = document.getElementById('viewInboxBtn');
    navBtns = document.querySelectorAll('.nav-btn');
    inboxCount = document.getElementById('inboxCount');
    inboxList = document.getElementById('inboxList');
    capturePage = document.getElementById('capturePage');
    inboxPage = document.getElementById('inboxPage');
    thoughtsPage = document.getElementById('thoughtsPage');
    todosPage = document.getElementById('todosPage');
    contactsPage = document.getElementById('contactsPage');
    processModal = document.getElementById('processModal');

    // Load data from localStorage
    loadData();

    // Event listeners
    captureBtn.addEventListener('click', handleCapture);
    captureInput.addEventListener('keydown', handleInputKeydown);
    viewInboxBtn.addEventListener('click', () => showPage('inbox'));

    // Navigation buttons
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);
        });
    });

    // Auto-expand textarea
    captureInput.addEventListener('input', autoExpandTextarea);

    // Update UI
    updateCounts();
}

// Auto-expand textarea as user types
function autoExpandTextarea() {
    captureInput.style.height = 'auto';
    captureInput.style.height = captureInput.scrollHeight + 'px';
}

// Handle keyboard shortcuts in capture input
function handleInputKeydown(e) {
    // Enter to capture (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
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
        timestamp: new Date().toISOString(),
        category: null
    };

    state.inbox.unshift(item); // Add to beginning
    saveData();

    // Clear input and reset height
    captureInput.value = '';
    captureInput.style.height = 'auto';

    // Show success message
    showStatus('Captured!', 'success');

    // Update counts
    updateCounts();

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

// Update all count badges
function updateCounts() {
    inboxCount.textContent = state.inbox.length;
}

// Show page
function showPage(page) {
    state.currentPage = page;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show selected page
    if (page === 'capture') {
        capturePage.classList.add('active');
        captureInput.focus();
    } else if (page === 'inbox') {
        inboxPage.classList.add('active');
        renderInbox();
    } else if (page === 'thoughts') {
        thoughtsPage.classList.add('active');
        renderThoughts();
    } else if (page === 'todos') {
        todosPage.classList.add('active');
        renderTodos();
    } else if (page === 'contacts') {
        contactsPage.classList.add('active');
        renderContacts();
    }
}

// Render inbox items
function renderInbox() {
    if (state.inbox.length === 0) {
        inboxList.innerHTML = `
            <div class="empty-state">
                <p>Your inbox is empty</p>
                <p>Capture your first thought!</p>
            </div>
        `;
        return;
    }

    inboxList.innerHTML = state.inbox.map(item => `
        <div class="inbox-item" data-id="${item.id}">
            <div class="inbox-item-content">${escapeHtml(item.content)}</div>
            <div class="inbox-item-meta">
                <span class="inbox-item-time">${formatTimestamp(item.timestamp)}</span>
                <div class="inbox-item-actions">
                    <button class="process-btn" onclick="startProcessing(${item.id})">Process</button>
                    <button class="delete-btn" onclick="deleteInboxItem(${item.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Start processing an inbox item
function startProcessing(id) {
    const item = state.inbox.find(i => i.id === id);
    if (!item) return;

    state.processingItem = item;
    showProcessModal(item);
}

// Show process modal
function showProcessModal(item) {
    processModal.style.display = 'flex';
    document.getElementById('processContent').textContent = item.content;
}

// Close process modal
function closeProcessModal() {
    processModal.style.display = 'none';
    state.processingItem = null;
}

// Process item to category
function processTo(category, sublist = null) {
    if (!state.processingItem) return;

    const item = { ...state.processingItem };

    // Remove from inbox
    state.inbox = state.inbox.filter(i => i.id !== item.id);

    // Add to category
    if (category === 'thoughts') {
        state.categories.thoughts.unshift(item);
    } else if (category === 'todos' && sublist) {
        item.completed = false;
        state.categories.todos[sublist].unshift(item);
    } else if (category === 'contacts') {
        // Parse contact info
        const contactData = parseContact(item.content);
        item.contactData = contactData;
        state.categories.contacts.unshift(item);
    }

    saveData();
    closeProcessModal();
    renderInbox();
    updateCounts();
}

// Parse contact information from text
function parseContact(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let firstName = '';
    let lastName = '';
    let phone = '';
    let email = '';
    let notes = '';

    // Try to extract phone number
    const phoneMatch = text.match(/[\d\s\-\(\)\+]{7,}/);
    if (phoneMatch) {
        phone = phoneMatch[0].replace(/\s/g, '');
    }

    // Try to extract email
    const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) {
        email = emailMatch[0];
    }

    // First non-phone/email line is likely the name
    for (let line of lines) {
        if (!line.match(/[\d\s\-\(\)\+]{7,}/) && !line.match(/[\w\.-]+@[\w\.-]+\.\w+/)) {
            const nameParts = line.split(/\s+/);
            if (nameParts.length >= 2) {
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(' ');
            } else {
                firstName = line;
            }
            break;
        }
    }

    // Everything else is notes
    const nameAndContactPattern = new RegExp(`${firstName}|${lastName}|${phone}|${email}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    notes = text.replace(nameAndContactPattern, '').trim();

    return { firstName, lastName, phone, email, notes };
}

// Delete inbox item
function deleteInboxItem(id) {
    if (confirm('Delete this item?')) {
        state.inbox = state.inbox.filter(item => item.id !== id);
        saveData();
        renderInbox();
        updateCounts();
    }
}

// Render Thoughts page
function renderThoughts() {
    const thoughtsList = document.getElementById('thoughtsList');

    if (state.categories.thoughts.length === 0) {
        thoughtsList.innerHTML = `
            <div class="empty-state">
                <p>No thoughts yet</p>
            </div>
        `;
        return;
    }

    thoughtsList.innerHTML = state.categories.thoughts.map(item => `
        <div class="category-item" data-id="${item.id}">
            <div class="category-item-content">${escapeHtml(item.content)}</div>
            <div class="category-item-meta">
                <span class="category-item-time">${formatTimestamp(item.timestamp)}</span>
                <button class="delete-btn" onclick="deleteThought(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete thought
function deleteThought(id) {
    if (confirm('Delete this thought?')) {
        state.categories.thoughts = state.categories.thoughts.filter(item => item.id !== id);
        saveData();
        renderThoughts();
    }
}

// Render Todos page
function renderTodos() {
    renderTodoList('active', 'activeTodosList');
    renderTodoList('someday', 'somedayTodosList');
    renderTodoList('awaiting', 'awaitingTodosList');
}

// Render individual todo list
function renderTodoList(listName, elementId) {
    const list = document.getElementById(elementId);
    const todos = state.categories.todos[listName];

    if (todos.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>No items</p></div>`;
        return;
    }

    list.innerHTML = todos.map(item => `
        <div class="todo-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
            <input
                type="checkbox"
                ${item.completed ? 'checked' : ''}
                onchange="toggleTodo('${listName}', ${item.id})"
                class="todo-checkbox">
            <div class="todo-content">
                <div class="todo-text">${escapeHtml(item.content)}</div>
                <div class="todo-meta">
                    <span class="todo-time">${formatTimestamp(item.timestamp)}</span>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteTodo('${listName}', ${item.id})">Delete</button>
        </div>
    `).join('');
}

// Toggle todo completion
function toggleTodo(listName, id) {
    const todo = state.categories.todos[listName].find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveData();
        renderTodoList(listName, `${listName}TodosList`);
    }
}

// Delete todo
function deleteTodo(listName, id) {
    if (confirm('Delete this todo?')) {
        state.categories.todos[listName] = state.categories.todos[listName].filter(t => t.id !== id);
        saveData();
        renderTodoList(listName, `${listName}TodosList`);
    }
}

// Render Contacts page
function renderContacts() {
    const contactsList = document.getElementById('contactsList');

    if (state.categories.contacts.length === 0) {
        contactsList.innerHTML = `
            <div class="empty-state">
                <p>No contacts yet</p>
            </div>
        `;
        return;
    }

    contactsList.innerHTML = state.categories.contacts.map(item => {
        const data = item.contactData || {};
        const displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown';

        return `
            <div class="contact-item" data-id="${item.id}">
                <div class="contact-header">
                    <div class="contact-name">${escapeHtml(displayName)}</div>
                    <button class="export-btn" onclick="exportContact(${item.id})">Export vCard</button>
                </div>
                <div class="contact-details">
                    ${data.phone ? `<div class="contact-detail"><strong>Phone:</strong> ${escapeHtml(data.phone)}</div>` : ''}
                    ${data.email ? `<div class="contact-detail"><strong>Email:</strong> ${escapeHtml(data.email)}</div>` : ''}
                    ${data.notes ? `<div class="contact-detail"><strong>Notes:</strong> ${escapeHtml(data.notes)}</div>` : ''}
                </div>
                <div class="contact-meta">
                    <span class="contact-time">${formatTimestamp(item.timestamp)}</span>
                    <button class="delete-btn" onclick="deleteContact(${item.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Export contact as vCard
function exportContact(id) {
    const contact = state.categories.contacts.find(c => c.id === id);
    if (!contact || !contact.contactData) return;

    const data = contact.contactData;
    const vCard = generateVCard(data);

    // Create download
    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.firstName || 'contact'}_${data.lastName || ''}.vcf`.replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Generate vCard format
function generateVCard(data) {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0'
    ];

    if (data.firstName || data.lastName) {
        lines.push(`N:${data.lastName || ''};${data.firstName || ''};;;`);
        lines.push(`FN:${data.firstName || ''} ${data.lastName || ''}`.trim());
    }

    if (data.phone) {
        lines.push(`TEL;TYPE=CELL:${data.phone}`);
    }

    if (data.email) {
        lines.push(`EMAIL:${data.email}`);
    }

    if (data.notes) {
        lines.push(`NOTE:${data.notes.replace(/\n/g, '\\n')}`);
    }

    lines.push('END:VCARD');

    return lines.join('\r\n');
}

// Delete contact
function deleteContact(id) {
    if (confirm('Delete this contact?')) {
        state.categories.contacts = state.categories.contacts.filter(c => c.id !== id);
        saveData();
        renderContacts();
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

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.inbox));
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(state.categories));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        showStatus('Error saving data', 'error');
    }
}

// Load data from localStorage
function loadData() {
    try {
        // Load inbox
        const storedInbox = localStorage.getItem(STORAGE_KEY);
        if (storedInbox) {
            state.inbox = JSON.parse(storedInbox);
        }

        // Load categories
        const storedCategories = localStorage.getItem(CATEGORIES_KEY);
        if (storedCategories) {
            state.categories = JSON.parse(storedCategories);
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        state.inbox = [];
        state.categories = {
            thoughts: [],
            todos: {
                active: [],
                someday: [],
                awaiting: []
            },
            contacts: []
        };
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
