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
let journalPage;
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
    journalPage = document.getElementById('journalPage');
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

    if (typeof initJournal === 'function') {
        initJournal();
    }

    showPage(state.currentPage);
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
    if (navBtns) {
        navBtns.forEach(btn => {
            const target = btn.dataset.page;
            btn.classList.toggle('active', target === page);
        });
    }

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
    } else if (page === 'journal' && journalPage) {
        journalPage.classList.add('active');
        if (typeof initJournal === 'function') {
            initJournal();
        }
        if (typeof handleJournalNavigation === 'function') {
            handleJournalNavigation();
        }
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

    list.innerHTML = todos.map(item => {
        // Extract title (first line) and check if there are notes
        const lines = item.content.split('\n');
        const title = lines[0];
        const hasNotes = lines.length > 1 || item.dueDate;

        return `
        <div class="todo-item" data-id="${item.id}">
            ${listName !== 'awaiting' ? `
                <input
                    type="checkbox"
                    ${item.completed ? 'checked' : ''}
                    onchange="toggleTodo('${listName}', ${item.id})"
                    class="todo-checkbox">
            ` : ''}
            <div class="todo-content ${item.completed && listName !== 'awaiting' ? 'completed' : ''}" onclick="openTodoDetail('${listName}', ${item.id})">
                <div class="todo-title">${escapeHtml(title)}</div>
                ${hasNotes ? '<span class="todo-has-notes">📝</span>' : ''}
            </div>
        </div>
        `;
    }).join('');
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

// Open move modal for todos
function openMoveModal(fromList, id) {
    const todo = state.categories.todos[fromList].find(t => t.id === id);
    if (!todo) return;

    state.movingTodo = { fromList, id };

    const modal = document.getElementById('moveModal');
    modal.style.display = 'flex';
}

// Close move modal
function closeMoveModal() {
    const modal = document.getElementById('moveModal');
    modal.style.display = 'none';
    state.movingTodo = null;
}

// Move todo to selected list
function moveToList(toList) {
    if (!state.movingTodo) return;

    const { fromList, id } = state.movingTodo;

    // Don't move if same list
    if (fromList === toList) {
        closeMoveModal();
        return;
    }

    const todo = state.categories.todos[fromList].find(t => t.id === id);
    if (!todo) return;

    const notes = prompt('Add notes about this move (optional):', '');

    // User cancelled
    if (notes === null) {
        closeMoveModal();
        return;
    }

    // Remove from current list
    state.categories.todos[fromList] = state.categories.todos[fromList].filter(t => t.id !== id);

    // Update content with notes if provided
    if (notes.trim()) {
        const listLabels = {
            active: 'Active',
            someday: 'Someday',
            awaiting: 'Awaiting'
        };
        todo.content = `${todo.content}\n\n→ ${listLabels[toList]}: ${notes.trim()}`;
    }

    // Add to new list
    state.categories.todos[toList].unshift(todo);

    saveData();
    renderTodos();
    closeMoveModal();
}

// Open todo detail modal
function openTodoDetail(listName, id) {
    const todo = state.categories.todos[listName].find(t => t.id === id);
    if (!todo) return;

    state.viewingTodo = { listName, id };

    const modal = document.getElementById('todoDetailModal');
    const contentInput = document.getElementById('todoEditContent');
    const dueDateInput = document.getElementById('todoEditDueDate');
    const dueTimeInput = document.getElementById('todoEditDueTime');
    const timestamp = document.getElementById('todoDetailTimestamp');

    contentInput.value = todo.content;

    // Parse existing dueDate if it exists
    if (todo.dueDateTime) {
        dueDateInput.value = todo.dueDateTime.date || '';
        dueTimeInput.value = todo.dueDateTime.time || '';
    } else {
        dueDateInput.value = '';
        dueTimeInput.value = '';
    }

    timestamp.textContent = `Created: ${formatTimestamp(todo.timestamp)}`;

    modal.style.display = 'flex';
}

// Close todo detail modal
function closeTodoDetail() {
    const modal = document.getElementById('todoDetailModal');
    modal.style.display = 'none';
    state.viewingTodo = null;
}

// Save todo changes from detail view
function saveTodoFromDetail() {
    if (!state.viewingTodo) return;

    const { listName, id } = state.viewingTodo;
    const todo = state.categories.todos[listName].find(t => t.id === id);
    if (!todo) return;

    const contentInput = document.getElementById('todoEditContent');
    const dueDateInput = document.getElementById('todoEditDueDate');
    const dueTimeInput = document.getElementById('todoEditDueTime');

    const newContent = contentInput.value.trim();
    if (!newContent) {
        alert('Task content cannot be empty');
        return;
    }

    todo.content = newContent;

    // Store date and time separately
    const date = dueDateInput.value.trim();
    const time = dueTimeInput.value.trim();

    if (date || time) {
        todo.dueDateTime = {
            date: date || null,
            time: time || null
        };
        // Create display string for backward compatibility
        todo.dueDate = formatDueDateTime(date, time);
    } else {
        todo.dueDateTime = null;
        todo.dueDate = null;
    }

    saveData();
    renderTodos();
    closeTodoDetail();
}

// Format due date/time for display
function formatDueDateTime(date, time) {
    if (!date && !time) return null;

    let formatted = '';

    if (date) {
        // Convert YYYY-MM-DD to readable format
        const dateObj = new Date(date + 'T00:00:00');
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        formatted = dateObj.toLocaleDateString('en-US', options);
    }

    if (time) {
        // Convert 24h time to 12h format
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        formatted += (formatted ? ' at ' : '') + `${hour12}:${minutes} ${ampm}`;
    }

    return formatted;
}

// Move todo from detail view
function moveTodoFromDetail() {
    if (!state.viewingTodo) return;
    const { listName, id } = state.viewingTodo;
    closeTodoDetail();
    openMoveModal(listName, id);
}

// Delete todo from detail view
function deleteTodoFromDetail() {
    if (!state.viewingTodo) return;
    const { listName, id } = state.viewingTodo;

    if (confirm('Delete this todo?')) {
        state.categories.todos[listName] = state.categories.todos[listName].filter(t => t.id !== id);
        saveData();
        renderTodos();
        closeTodoDetail();
    }
}

// Export todo to calendar
function exportTodoToCalendar() {
    if (!state.viewingTodo) return;

    const { listName, id } = state.viewingTodo;
    const todo = state.categories.todos[listName].find(t => t.id === id);
    if (!todo) return;

    // Get title (first line of content)
    const lines = todo.content.split('\n');
    const title = lines[0];
    const description = lines.slice(1).join('\n').trim();

    // Build event data
    let eventDate = new Date();
    let hasSpecificDate = false;

    if (todo.dueDateTime && todo.dueDateTime.date) {
        hasSpecificDate = true;
        const dateParts = todo.dueDateTime.date.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
        const day = parseInt(dateParts[2]);

        if (todo.dueDateTime.time) {
            const timeParts = todo.dueDateTime.time.split(':');
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            eventDate = new Date(year, month, day, hours, minutes);
        } else {
            // Default to 9 AM if no time specified
            eventDate = new Date(year, month, day, 9, 0);
        }
    } else {
        // No date specified, default to tomorrow at 9 AM
        eventDate.setDate(eventDate.getDate() + 1);
        eventDate.setHours(9, 0, 0, 0);
    }

    const eventData = {
        title: title,
        description: description,
        startDate: eventDate,
        endDate: new Date(eventDate.getTime() + (60 * 60 * 1000)) // 1 hour duration
    };

    const calendarUrl = generateGoogleCalendarUrl(eventData);
    window.open(calendarUrl, '_blank');
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
