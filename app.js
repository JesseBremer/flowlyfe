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
let captureFab;
let captureStatus;
let inboxBtn;
let navBtns;
let inboxBadge;
let inboxList;
let capturePage;
let inboxPage;
let thoughtsPage;
let todosPage;
let journalPage;
let processModal;
let focusScrim;
let captureCard;
let navInboxBtn;
let captureAudio = null;
let lastPlaceholderIndex = -1;

const PLACEHOLDERS = [
    'Flow your life…',
    'Catch it before it drifts…',
    "What\'s circling in your head?",
    'Type it, tap capture, done.',
    'One line now, sort later.'
];

// Initialize app
function init() {
    console.log('App ready');

    // Get DOM elements
    captureInput = document.getElementById('captureInput');
    captureFab = document.getElementById('captureFab');
    captureStatus = document.getElementById('captureStatus');
    inboxBtn = document.getElementById('inboxBtn');
    navBtns = document.querySelectorAll('.nav-btn');
    inboxBadge = document.getElementById('inboxBadge');
    inboxList = document.getElementById('inboxList');
    capturePage = document.getElementById('capturePage');
    inboxPage = document.getElementById('inboxPage');
    thoughtsPage = document.getElementById('thoughtsPage');
    todosPage = document.getElementById('todosPage');
    journalPage = document.getElementById('journalPage');
    processModal = document.getElementById('processModal');
    focusScrim = document.getElementById('focusScrim');
    captureCard = document.getElementById('captureCard');
    navInboxBtn = document.getElementById('navInbox');

    if (focusScrim) {
        focusScrim.addEventListener('click', () => {
            if (captureInput) {
                captureInput.blur();
            }
        });
    }

    // Load data from localStorage
    loadData();

    // Event listeners
    if (captureFab) {
        captureFab.addEventListener('click', handleCapture);
    }
    if (captureInput) {
        captureInput.addEventListener('keydown', handleInputKeydown);
        captureInput.addEventListener('input', () => autoExpandTextarea());
        captureInput.addEventListener('focus', handleCaptureFocus);
        captureInput.addEventListener('blur', handleCaptureBlur);
    }

    if (inboxBtn) {
        inboxBtn.addEventListener('click', () => showPage('inbox'));
    }

    // Navigation buttons
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);
        });
    });

    // Initialize capture UI helpers
    rotatePlaceholder();
    autoExpandTextarea();

    // Update UI
    updateCounts();

    if (typeof initJournal === 'function') {
        initJournal();
    }

    const handledHash = handleHashRoute(true);
    window.addEventListener('hashchange', () => handleHashRoute());

    if (!handledHash) {
    showPage(state.currentPage);

    window.state = state;
}

    document.addEventListener('click', event => {
        if (!event.target.closest('.category-item-actions')) {
            closeThoughtMoveMenus();
        }
    });
}

// Auto-expand textarea as user types
function autoExpandTextarea(el = captureInput) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
}

// Handle keyboard shortcuts in capture input
function handleInputKeydown(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        captureInput.blur();
        return;
    }
    // Enter to capture (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleCapture();
    }
}

function handleCaptureFocus() {
    if (captureCard) {
        captureCard.classList.add('is-focused');
    }
    if (focusScrim) {
        focusScrim.classList.add('is-visible');
    }
}

function handleCaptureBlur() {
    if (captureCard) {
        captureCard.classList.remove('is-focused');
    }
    if (focusScrim) {
        focusScrim.classList.remove('is-visible');
    }
    if (captureInput && !captureInput.value.trim()) {
        rotatePlaceholder();
    }
}

// Capture item
function handleCapture() {
    if (!captureInput) return;

    const content = captureInput.value.trim();

    if (!content) {
        showStatus('Please enter something to capture', 'error');
        playHapticAndSound(true);
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
    autoExpandTextarea();
    rotatePlaceholder();

    if (captureFab) {
        captureFab.classList.remove('is-rippling');
        // force reflow
        void captureFab.offsetWidth;
        captureFab.classList.add('is-rippling');
        setTimeout(() => captureFab.classList.remove('is-rippling'), 480);
    }

    playHapticAndSound(false);
    flashInboxIcon();

    // Show success message
    showStatus('Captured!', 'success');

    // Update counts
    updateCounts(true);

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

function refreshDoneLogView() {
    document.dispatchEvent(new CustomEvent('journal:refreshDone'));
}

function rotatePlaceholder() {
    if (!captureInput || !PLACEHOLDERS.length) return;
    let nextIndex = Math.floor(Math.random() * PLACEHOLDERS.length);
    if (PLACEHOLDERS.length > 1) {
        while (nextIndex === lastPlaceholderIndex) {
            nextIndex = Math.floor(Math.random() * PLACEHOLDERS.length);
        }
    }
    lastPlaceholderIndex = nextIndex;
    captureInput.placeholder = PLACEHOLDERS[nextIndex];
}

// Update all count badges
function updateCounts(animateBadge = false) {
    updateInboxBadge(animateBadge);
}

function updateInboxBadge(animate = false) {
    if (!inboxBadge) return;
    inboxBadge.textContent = state.inbox.length;
    if (animate) {
        inboxBadge.classList.remove('bump');
        void inboxBadge.offsetWidth;
        inboxBadge.classList.add('bump');
    } else {
        inboxBadge.classList.remove('bump');
    }
}

function flashInboxIcon() {
    if (!navInboxBtn) return;
    navInboxBtn.classList.remove('ping');
    void navInboxBtn.offsetWidth;
    navInboxBtn.classList.add('ping');
    setTimeout(() => navInboxBtn.classList.remove('ping'), 420);
}

function playHapticAndSound(isError = false) {
    if (navigator.vibrate) {
        navigator.vibrate(isError ? 8 : 18);
    }

    if (captureAudio === null) {
        try {
            captureAudio = new Audio('/assets/capture.mp3');
            captureAudio.preload = 'auto';
        } catch (err) {
            captureAudio = undefined;
        }
    }

    if (!captureAudio || captureAudio === undefined) return;

    try {
        captureAudio.currentTime = 0;
        captureAudio.volume = isError ? 0.18 : 0.35;
        captureAudio.play().catch(() => {});
    } catch (err) {
        // silently ignore unsupported playback
    }
}

function handleHashRoute(initial = false) {
    const hash = window.location.hash;
    if (hash === '#capture') {
        showPage('capture');
        if (captureInput) {
            requestAnimationFrame(() => captureInput.focus());
        }
        return true;
    }
    if (hash === '#inbox') {
        showPage('inbox');
        return true;
    }
    if (!initial && hash === '') {
        return false;
    }
    return false;
}

// Show page
function showPage(page) {
    state.currentPage = page;

    if (page !== 'capture' && captureInput) {
        captureInput.blur();
    }

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
        if (captureInput) {
            requestAnimationFrame(() => captureInput.focus());
        }
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
            <div class="category-item-content" data-view>
                <div class="category-item-text">${escapeHtml(item.content)}</div>
            </div>
            <div class="category-item-meta">
                <span class="category-item-time">${formatTimestamp(item.timestamp)}</span>
                <div class="category-item-actions">
                    <button class="edit-btn" data-action="edit" onclick="startThoughtEdit(${item.id})">Edit</button>
                    <button class="save-btn" data-action="save" onclick="saveThoughtEdit(${item.id})" hidden>Save</button>
                    <button class="cancel-btn" data-action="cancel" onclick="cancelThoughtEdit(${item.id})" hidden>Cancel</button>
                    <div class="thought-move">
                        <button class="move-btn" data-action="move" onclick="toggleThoughtMove(${item.id})">Move</button>
                        <div class="thought-move-options" data-move-options hidden>
                            <button onclick="moveThoughtToTodo(${item.id}, 'active')">✓ Active</button>
                            <button onclick="moveThoughtToTodo(${item.id}, 'someday')">⏳ Someday</button>
                            <button onclick="moveThoughtToTodo(${item.id}, 'awaiting')">⏱️ Awaiting</button>
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deleteThought(${item.id})">Delete</button>
                </div>
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

// Edit thought
function startThoughtEdit(id) {
    const container = document.querySelector(`.category-item[data-id="${id}"]`);
    const thought = state.categories.thoughts.find(item => item.id === id);
    if (!container || !thought) return;

    const textEl = container.querySelector('.category-item-text');
    const viewWrap = container.querySelector('[data-view]');
    const editButton = container.querySelector('[data-action="edit"]');
    const saveButton = container.querySelector('[data-action="save"]');
    const cancelButton = container.querySelector('[data-action="cancel"]');
    const moveButton = container.querySelector('[data-action="move"]');
    const moveMenu = container.querySelector('[data-move-options]');

    if (!textEl || !viewWrap || !editButton || !saveButton || !cancelButton) return;

    if (!container.querySelector('textarea')) {
        const textarea = document.createElement('textarea');
        textarea.className = 'category-item-editor';
        textarea.value = thought.content;
        textarea.rows = Math.min(Math.max(thought.content.split('\n').length, 2), 8);
        viewWrap.replaceWith(textarea);
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);

        editButton.hidden = true;
        saveButton.hidden = false;
        cancelButton.hidden = false;
        if (moveButton) moveButton.hidden = true;
        if (moveMenu) moveMenu.hidden = true;

        container.dataset.editing = 'true';
    }
}

function saveThoughtEdit(id) {
    const container = document.querySelector(`.category-item[data-id="${id}"]`);
    const thought = state.categories.thoughts.find(item => item.id === id);
    if (!container || !thought) return;

    const textarea = container.querySelector('.category-item-editor');
    if (!textarea) return;

    const trimmed = textarea.value.trim();
    if (!trimmed) {
        alert('Thought cannot be empty');
        textarea.focus();
        return;
    }

    thought.content = trimmed;
    thought.timestamp = new Date().toISOString();
    saveData();
    container.dataset.editing = '';
    renderThoughts();
}

function cancelThoughtEdit(id) {
    const container = document.querySelector(`.category-item[data-id="${id}"]`);
    const thought = state.categories.thoughts.find(item => item.id === id);
    if (!container || !thought) return;

    const textarea = container.querySelector('.category-item-editor');
    if (!textarea) return;

    const viewWrap = document.createElement('div');
    viewWrap.className = 'category-item-content';
    viewWrap.setAttribute('data-view', '');

    const textDiv = document.createElement('div');
    textDiv.className = 'category-item-text';
    textDiv.textContent = thought.content;
    viewWrap.appendChild(textDiv);

    textarea.replaceWith(viewWrap);

    const editButton = container.querySelector('[data-action="edit"]');
    const saveButton = container.querySelector('[data-action="save"]');
    const cancelButton = container.querySelector('[data-action="cancel"]');
    const moveButton = container.querySelector('[data-action="move"]');

    if (editButton && saveButton && cancelButton) {
        editButton.hidden = false;
        saveButton.hidden = true;
        cancelButton.hidden = true;
    }
    if (moveButton) moveButton.hidden = false;

    container.dataset.editing = '';
}

function toggleThoughtMove(id) {
    const container = document.querySelector(`.category-item[data-id="${id}"]`);
    if (!container || container.dataset.editing === 'true') return;

    const menu = container.querySelector('[data-move-options]');
    const moveButton = container.querySelector('[data-action="move"]');
    if (!menu || !moveButton) return;

    const isHidden = menu.hasAttribute('hidden');
    closeThoughtMoveMenus();
    if (isHidden) {
        menu.hidden = false;
        moveButton.classList.add('active');
    } else {
        menu.hidden = true;
        moveButton.classList.remove('active');
    }
}

function closeThoughtMoveMenus(exceptId = null) {
    document.querySelectorAll('.thought-move-options').forEach(menu => {
        const container = menu.closest('.category-item');
        if (!container) return;
        if (exceptId && Number(container.dataset.id) === exceptId) {
            return;
        }
        menu.hidden = true;
        const moveButton = container.querySelector('[data-action="move"]');
        if (moveButton) moveButton.classList.remove('active');
    });
}

function moveThoughtToTodo(id, listName) {
    const idx = state.categories.thoughts.findIndex(item => item.id === id);
    if (idx === -1) return;

    const thought = state.categories.thoughts.splice(idx, 1)[0];
    const todo = {
        id: Date.now(),
        content: thought.content,
        timestamp: thought.timestamp || new Date().toISOString(),
        completed: false
    };

    if (!state.categories.todos[listName]) {
        state.categories.todos[listName] = [];
    }

    state.categories.todos[listName].unshift(todo);
    saveData();
    closeThoughtMoveMenus();
    renderThoughts();
    renderTodoList(listName, `${listName}TodosList`);
    showStatus('Moved to To-Do list', 'success');
    refreshDoneLogView();
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
        if (todo.completed) {
            todo.completedAt = new Date().toISOString();
        } else {
            delete todo.completedAt;
        }
        saveData();
        renderTodoList(listName, `${listName}TodosList`);
        refreshDoneLogView();
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
    refreshDoneLogView();
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
    refreshDoneLogView();
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
        refreshDoneLogView();
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
        refreshDoneLogView();
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
