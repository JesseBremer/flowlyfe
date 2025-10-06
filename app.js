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
        }
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
        saveData();
        closeProcessModal();
        renderInbox();
        updateCounts();
    } else if (category === 'todos' && sublist) {
        item.completed = false;
        state.categories.todos[sublist].unshift(item);
        saveData();
        closeProcessModal();
        renderInbox();
        updateCounts();
    } else if (category === 'contacts') {
        // Parse contact info and immediately export vCard
        const contactData = parseContact(item.content);
        const vCard = generateVCard(contactData);

        // Create download
        const blob = new Blob([vCard], { type: 'text/vcard' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contactData.firstName || 'contact'}_${contactData.lastName || ''}.vcf`.replace(/\s+/g, '_');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Remove from inbox (don't save to contacts category)
        saveData();
        closeProcessModal();
        renderInbox();
        updateCounts();
    } else if (category === 'calendar') {
        // Parse calendar event and open Google Calendar
        const eventData = parseCalendarEvent(item.content);
        const calendarUrl = generateGoogleCalendarUrl(eventData);

        // Open Google Calendar in new tab
        window.open(calendarUrl, '_blank');

        // Remove from inbox
        saveData();
        closeProcessModal();
        renderInbox();
        updateCounts();
    }
}

// Parse contact information from text
function parseContact(text) {
    let firstName = '';
    let lastName = '';
    let phone = '';
    let email = '';
    let notes = '';

    // Helper function to capitalize first letter
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Extract phone number (pattern like 343-999-9999 or 3439999999)
    const phoneMatch = text.match(/\b[\d\-\(\)\+]{7,}\b/);
    if (phoneMatch) {
        phone = phoneMatch[0];
    }

    // Extract email
    const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) {
        email = emailMatch[0];
    }

    // Remove phone and email from text to get name
    let nameText = text;
    if (phone) {
        nameText = nameText.replace(phone, '');
    }
    if (email) {
        nameText = nameText.replace(email, '');
    }

    // Extract name from remaining text
    const nameParts = nameText.trim().split(/\s+/).filter(part => part.length > 0);
    if (nameParts.length >= 2) {
        firstName = capitalize(nameParts[0]);
        lastName = nameParts.slice(1).map(capitalize).join(' ');
    } else if (nameParts.length === 1) {
        firstName = capitalize(nameParts[0]);
    }

    // Any remaining text after removing name, phone, email is notes
    notes = text
        .replace(phone || '', '')
        .replace(email || '', '')
        .replace(new RegExp(nameParts.join('\\s+'), 'i'), '')
        .trim();

    return { firstName, lastName, phone, email, notes };
}

// Parse calendar event from text
function parseCalendarEvent(text) {
    let title = '';
    let startDate = null;
    let startTime = '';
    let endTime = '';
    let description = '';

    const now = new Date();
    const lowerText = text.toLowerCase();

    // Extract time first (e.g., "3pm", "3:30pm", "15:00", "7pm-9pm")
    const timeRangeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*-\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeRangeMatch) {
        startTime = timeRangeMatch[1] + (timeRangeMatch[2] ? ':' + timeRangeMatch[2] : '') + (timeRangeMatch[3] || '');
        endTime = timeRangeMatch[4] + (timeRangeMatch[5] ? ':' + timeRangeMatch[5] : '') + (timeRangeMatch[6] || '');
    } else {
        const timeMatches = text.match(/\b(\d{1,2}):?(\d{2})?\s*(am|pm)?\b/gi);
        if (timeMatches && timeMatches.length > 0) {
            startTime = timeMatches[0];
            if (timeMatches.length > 1) {
                endTime = timeMatches[1];
            }
        }
    }

    // Try to extract dates
    // Pattern: "friday 10th" or "friday the 10th"
    const dayWithOrdinal = lowerText.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(the\s+)?(\d{1,2})(st|nd|rd|th)?/i);
    if (dayWithOrdinal) {
        const dayName = dayWithOrdinal[1].toLowerCase();
        const dayNum = parseInt(dayWithOrdinal[3]);

        // Find the next occurrence of this day of week
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDayIndex = daysOfWeek.indexOf(dayName);
        const currentDayIndex = now.getDay();

        let daysUntilTarget = targetDayIndex - currentDayIndex;
        if (daysUntilTarget <= 0) daysUntilTarget += 7;

        startDate = new Date(now);
        startDate.setDate(now.getDate() + daysUntilTarget);

        // Set the specific day of month if provided
        if (dayNum) {
            startDate.setDate(dayNum);
        }
    }
    // Pattern: "today" or "tomorrow"
    else if (lowerText.includes('today')) {
        startDate = new Date(now);
    } else if (lowerText.includes('tomorrow')) {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() + 1);
    }
    // Pattern: day of week only (e.g., "friday")
    else {
        const dayMatch = lowerText.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
        if (dayMatch) {
            const dayName = dayMatch[1].toLowerCase();
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDayIndex = daysOfWeek.indexOf(dayName);
            const currentDayIndex = now.getDay();

            let daysUntilTarget = targetDayIndex - currentDayIndex;
            if (daysUntilTarget <= 0) daysUntilTarget += 7;

            startDate = new Date(now);
            startDate.setDate(now.getDate() + daysUntilTarget);
        }
    }

    // Pattern: MM/DD/YYYY
    const slashDateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (slashDateMatch && !startDate) {
        startDate = new Date(slashDateMatch[0]);
    }

    // Pattern: "Dec 25" or "December 25"
    const monthDateMatch = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i);
    if (monthDateMatch && !startDate) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.findIndex(m => monthDateMatch[1].toLowerCase().startsWith(m));
        const day = parseInt(monthDateMatch[2]);
        startDate = new Date(now.getFullYear(), monthIndex, day);
    }

    // Extract title by removing date/time keywords
    const lines = text.split('\n');
    title = lines[0].trim();

    // Remove all date/time patterns from title
    title = title
        .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
        .replace(/\b(the\s+)?(\d{1,2})(st|nd|rd|th)\b/gi, '')
        .replace(/\b(today|tomorrow)\b/gi, '')
        .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}\b/gi, '')
        .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '')
        .replace(/\d{1,2}:?\d{0,2}\s*(am|pm)?(\s*-\s*\d{1,2}:?\d{0,2}\s*(am|pm)?)?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Remaining lines as description
    if (lines.length > 1) {
        description = lines.slice(1).join('\n').trim();
    }

    return { title, startDate, startTime, endTime, description };
}

// Generate Google Calendar URL
function generateGoogleCalendarUrl(eventData) {
    const { title, startDate, startTime, endTime, description } = eventData;

    // If no date, default to today
    const date = startDate || new Date();

    // Format date as YYYYMMDD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Parse time or default to current time
    let startHour = new Date().getHours();
    let startMin = 0;

    if (startTime) {
        const timeParts = startTime.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        if (timeParts) {
            startHour = parseInt(timeParts[1]);
            startMin = timeParts[2] ? parseInt(timeParts[2]) : 0;

            // Convert to 24-hour format if PM
            if (timeParts[3] && timeParts[3].toLowerCase() === 'pm' && startHour < 12) {
                startHour += 12;
            } else if (timeParts[3] && timeParts[3].toLowerCase() === 'am' && startHour === 12) {
                startHour = 0;
            }
        }
    }

    // End time defaults to 1 hour after start
    let endHour = startHour + 1;
    let endMin = startMin;

    if (endTime) {
        const timeParts = endTime.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        if (timeParts) {
            endHour = parseInt(timeParts[1]);
            endMin = timeParts[2] ? parseInt(timeParts[2]) : 0;

            if (timeParts[3] && timeParts[3].toLowerCase() === 'pm' && endHour < 12) {
                endHour += 12;
            } else if (timeParts[3] && timeParts[3].toLowerCase() === 'am' && endHour === 12) {
                endHour = 0;
            }
        }
    }

    // Format times as YYYYMMDDTHHMMSS
    const startDateTime = `${year}${month}${day}T${String(startHour).padStart(2, '0')}${String(startMin).padStart(2, '0')}00`;
    const endDateTime = `${year}${month}${day}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`;

    // Build Google Calendar URL
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title || 'New Event',
        dates: `${startDateTime}/${endDateTime}`,
        details: description || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
            }
        };
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
