(() => {
    const JOURNAL_STORAGE_KEY = 'flowlyfe_journal_entries_v1';
    const FREEFORM_DRAFT_KEY = 'flowlyfe_journal_freeform_draft';
    const ROTEFORM_PREFIX = 'flowlyfe_journal_roteform_';
    const FLOWFORM_PREFIX = 'flowlyfe_journal_flowform_';

    const JOURNAL_TYPES = {
        flowform: { icon: '🎯', label: 'Flowform' },
        freeform: { icon: '📝', label: 'Freeform' },
        roteform: { icon: '🌱', label: 'Roteform' }
    };

    const FLOWFORM_CATEGORIES = {
        mood: { key: 'mood', name: 'Mood', prompt: 'How are you feeling right now?' },
        gratitude: { key: 'gratitude', name: 'Gratitude', prompt: 'What are you grateful for today?' },
        event: { key: 'event', name: 'Event', prompt: 'Note a moment you want to remember.' },
        accomplishment: { key: 'accomplishment', name: 'Accomplishment', prompt: 'What did you move forward?' },
        idea: { key: 'idea', name: 'Idea', prompt: 'Capture your sparks before they fade.' },
        quote: { key: 'quote', name: 'Quote', prompt: 'Log a phrase that stayed with you.' },
        picture: { key: 'picture', name: 'Picture', prompt: 'Pin a photo from today with an optional caption.' }
    };

    const MOOD_OPTIONS = [
        { emoji: '😇', name: 'Peaceful', color: '#6cbfa7' },
        { emoji: '😍', name: 'Grateful', color: '#7ec7ab' },
        { emoji: '😊', name: 'Happy', color: '#93d3b3' },
        { emoji: '🤗', name: 'Energized', color: '#b7dfa8' },
        { emoji: '😌', name: 'Content', color: '#dfe7a7' },
        { emoji: '🤔', name: 'Thoughtful', color: '#f3d884' },
        { emoji: '😑', name: 'Neutral', color: '#f2c078' },
        { emoji: '😴', name: 'Tired', color: '#e9a36c' },
        { emoji: '😰', name: 'Anxious', color: '#dc8d7c' },
        { emoji: '😢', name: 'Tender', color: '#cc7c7f' },
        { emoji: '😠', name: 'Fiery', color: '#b76870' }
    ];

    const FREEFORM_PROMPTS = [
        "What three moments did you feel grateful for today and why?",
        "Describe a moment today when you felt fully alive.",
        "What emotion surprised you, and what do you think sparked it?",
        "What did you learn about yourself from today’s interactions?",
        "How did you step toward the person you want to become?",
        "Recall a conversation that energized you. What stayed with you?",
        "If today were a story, what would the title be?",
        "Where did you notice beauty or stillness in the day?",
        "Write a note of encouragement to tomorrow’s self.",
        "What question do you want to carry into tomorrow?"
    ];

    const journalState = {
        initialized: false,
        view: 'home',
        entries: [],
        activeEntryId: null,
        flowform: null,
        flowformKey: null
    };

    let journalPage;
    const journalViews = {};

    // Cached DOM nodes for repeated updates
    let flowformContainer;
    let freeformWordCount;
    let freeformStatus;
    let roteformStatus;
    let flowformStatusEl;
    let journalDetailContent;
    let journalDeleteBtn;
    let journalDoneList;
    let journalDoneDateLabel;

    let freeformDraftTimeout;

    function initJournal() {
        if (journalState.initialized) return;

        journalPage = document.getElementById('journalPage');
        if (!journalPage) return;

        journalViews.home = document.getElementById('journalHomeView');
        journalViews.flowform = document.getElementById('journalFlowformView');
        journalViews.freeform = document.getElementById('journalFreeformView');
        journalViews.roteform = document.getElementById('journalRoteformView');
        journalViews.entries = document.getElementById('journalEntriesView');
        journalViews.detail = document.getElementById('journalDetailView');
        journalViews.done = document.getElementById('journalDoneView');

        flowformContainer = document.getElementById('flowformContainer');
        freeformWordCount = document.getElementById('freeformWordCount');
        freeformStatus = document.getElementById('freeformStatus');
        roteformStatus = document.getElementById('roteformStatus');
        journalDetailContent = document.getElementById('journalDetailContent');
        journalDeleteBtn = document.getElementById('journalDeleteBtn');
        journalDoneList = document.getElementById('journalDoneList');
        journalDoneDateLabel = document.getElementById('doneSummaryDate');

        journalState.entries = loadJournalEntries();
        initializeFlowformState();
        bindGlobalListeners();
        setupFreeform();
        setupRoteform();
        renderFlowformHome();
        renderJournalEntriesList();
        renderDoneView();

        document.addEventListener('journal:refreshDone', renderDoneView);

        journalState.initialized = true;
    }

    function bindGlobalListeners() {
        journalPage.addEventListener('click', event => {
            const navTarget = event.target.closest('[data-journal-target]');
            if (navTarget) {
                event.preventDefault();
                handleJournalNavigation(navTarget.dataset.journalTarget);
                return;
            }

            const categoryBtn = event.target.closest('[data-flowform-category]');
            if (categoryBtn) {
                event.preventDefault();
                renderFlowformCategory(categoryBtn.dataset.flowformCategory);
                return;
            }

            const overviewBtn = event.target.closest('[data-flowform-overview]');
            if (overviewBtn) {
                event.preventDefault();
                renderFlowformOverview();
                return;
            }

            const saveFlowformBtn = event.target.closest('[data-flowform-save]');
            if (saveFlowformBtn) {
                event.preventDefault();
                saveFlowformToJournal();
                return;
            }

            const flowformBackBtn = event.target.closest('[data-flowform-back]');
            if (flowformBackBtn) {
                event.preventDefault();
                renderFlowformHome();
                return;
            }

            const flowformDeleteBtn = event.target.closest('[data-flowform-delete]');
            if (flowformDeleteBtn) {
                event.preventDefault();
                const category = flowformDeleteBtn.dataset.flowformDelete;
                const index = Number(flowformDeleteBtn.dataset.index);
                deleteFlowformEntry(category, index);
                return;
            }

            const entryCard = event.target.closest('[data-entry-id]');
            if (entryCard) {
                event.preventDefault();
                openJournalEntry(entryCard.dataset.entryId);
            }
        });

        const searchInput = document.getElementById('journalSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', renderJournalEntriesList);
        }

        const filterSelect = document.getElementById('journalFilterSelect');
        if (filterSelect) {
            filterSelect.addEventListener('change', renderJournalEntriesList);
        }

        if (journalDeleteBtn) {
            journalDeleteBtn.addEventListener('click', handleDeleteCurrentEntry);
        }
    }

    function handleJournalNavigation(target) {
        switch (target) {
            case 'home':
                showJournalView('home');
                break;
            case 'flowform':
                showJournalView('flowform');
                renderFlowformHome();
                break;
            case 'freeform':
                showJournalView('freeform');
                focusFreeform();
                break;
            case 'roteform':
                showJournalView('roteform');
                break;
            case 'done':
                showJournalView('done');
                renderDoneView();
                break;
            case 'entries':
                showJournalView('entries');
                renderJournalEntriesList();
                break;
            case 'detail':
                if (journalState.activeEntryId) {
                    showJournalView('detail');
                } else {
                    showJournalView('entries');
                }
                break;
            default:
                break;
        }
    }

    function showJournalView(view) {
        Object.values(journalViews).forEach(section => section && section.classList.remove('active'));
        if (journalViews[view]) {
            journalViews[view].classList.add('active');
            journalState.view = view;
        }
    }

    function loadJournalEntries() {
        try {
            const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            }
            return [];
        } catch (err) {
            console.error('Error loading journal entries', err);
            return [];
        }
    }

    function saveJournalEntries() {
        try {
            localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journalState.entries));
            renderJournalEntriesList();
        } catch (err) {
            console.error('Error saving journal entries', err);
        }
    }

    function getTodosState() {
        if (typeof window === 'undefined') return null;
        if (!window.state || !window.state.categories || !window.state.categories.todos) {
            return null;
        }
        return window.state.categories.todos;
    }

    function formatFullDate(dateKey) {
        const parts = dateKey.split('-');
        if (parts.length !== 3) return dateKey;
        const dateObj = new Date(`${dateKey}T00:00:00`);
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString(undefined, options);
    }

    function formatTimeLabel(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    function formatListName(listName) {
        switch (listName) {
            case 'active':
                return 'Active';
            case 'someday':
                return 'Someday';
            case 'awaiting':
                return 'Awaiting';
            default:
                return listName;
        }
    }

    function setupFreeform() {
        const titleInput = document.getElementById('freeformTitle');
        const contentInput = document.getElementById('freeformContent');
        const saveButton = document.getElementById('freeformSaveBtn');
        const promptButton = document.getElementById('freeformPromptBtn');

        if (!titleInput || !contentInput || !saveButton || !promptButton) {
            return;
        }

        const savedDraft = loadFreeformDraft();
        if (savedDraft) {
            if (savedDraft.title) titleInput.value = savedDraft.title;
            if (savedDraft.content) contentInput.value = savedDraft.content;
        }

        updateFreeformWordCount();

        titleInput.addEventListener('input', scheduleFreeformDraftSave);
        contentInput.addEventListener('input', () => {
            updateFreeformWordCount();
            scheduleFreeformDraftSave();
        });

        saveButton.addEventListener('click', saveFreeformEntry);
        promptButton.addEventListener('click', () => applyRandomPrompt(contentInput));
    }

    function focusFreeform() {
        const contentInput = document.getElementById('freeformContent');
        if (contentInput) {
            contentInput.focus({ preventScroll: false });
        }
    }

    function loadFreeformDraft() {
        try {
            const stored = localStorage.getItem(FREEFORM_DRAFT_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (err) {
            console.error('Error loading freeform draft', err);
            return null;
        }
    }

    function scheduleFreeformDraftSave() {
        clearTimeout(freeformDraftTimeout);
        freeformDraftTimeout = setTimeout(saveFreeformDraft, 800);
    }

    function saveFreeformDraft() {
        const titleInput = document.getElementById('freeformTitle');
        const contentInput = document.getElementById('freeformContent');
        if (!titleInput || !contentInput) return;

        const draft = {
            title: titleInput.value,
            content: contentInput.value
        };

        try {
            localStorage.setItem(FREEFORM_DRAFT_KEY, JSON.stringify(draft));
        } catch (err) {
            console.error('Error saving freeform draft', err);
        }
    }

    function clearFreeformDraft() {
        localStorage.removeItem(FREEFORM_DRAFT_KEY);
    }

    function updateFreeformWordCount() {
        const contentInput = document.getElementById('freeformContent');
        if (!contentInput || !freeformWordCount) return;
        const text = contentInput.value.trim();
        const words = text === '' ? 0 : text.split(/\s+/).length;
        freeformWordCount.textContent = String(words);
    }

    function applyRandomPrompt(textarea) {
        const prompt = FREEFORM_PROMPTS[Math.floor(Math.random() * FREEFORM_PROMPTS.length)];
        textarea.placeholder = prompt;
        setStatusMessage(freeformStatus, 'Prompt refreshed ✨', 'info');
    }

    function saveFreeformEntry() {
        const titleInput = document.getElementById('freeformTitle');
        const contentInput = document.getElementById('freeformContent');
        if (!titleInput || !contentInput) return;

        const content = contentInput.value.trim();
        if (!content) {
            setStatusMessage(freeformStatus, 'Write a few words before saving.', 'error');
            return;
        }

        const entry = {
            id: String(Date.now()),
            type: 'freeform',
            title: titleInput.value.trim() || formatJournalDate(new Date().toISOString()),
            content,
            createdAt: new Date().toISOString()
        };

        journalState.entries.unshift(entry);
        saveJournalEntries();
        setStatusMessage(freeformStatus, 'Entry saved to your journal.', 'success');
        titleInput.value = '';
        contentInput.value = '';
        updateFreeformWordCount();
        clearFreeformDraft();
    }

    function setupRoteform() {
        const dateLabel = document.getElementById('roteformDateLabel');
        if (dateLabel) {
            dateLabel.textContent = formatJournalDate(new Date().toISOString());
        }

        const fields = getRoteformFields();
        const draft = loadRoteformDraft();
        if (draft) {
            Object.entries(fields).forEach(([key, element]) => {
                if (draft[key] && element) {
                    element.value = draft[key];
                }
            });
        }

        Object.values(fields).forEach(element => {
            element.addEventListener('input', () => {
                saveRoteformDraft();
                updateRoteformProgress();
            });
        });

        updateRoteformProgress();

        const draftButton = document.getElementById('roteformDraftBtn');
        const saveButton = document.getElementById('roteformSaveBtn');

        if (draftButton) draftButton.addEventListener('click', handleRoteformDraftSave);
        if (saveButton) saveButton.addEventListener('click', saveRoteformEntry);
    }

    function getRoteformFields() {
        return {
            gratitude: document.getElementById('roteGratitude'),
            emotions: document.getElementById('roteEmotions'),
            values: document.getElementById('roteValues'),
            growth: document.getElementById('roteGrowth'),
            connection: document.getElementById('roteConnection'),
            compassion: document.getElementById('roteCompassion'),
            story: document.getElementById('roteStory')
        };
    }

    function getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }

    function roteformStorageKey() {
        return `${ROTEFORM_PREFIX}${getTodayKey()}`;
    }

    function loadRoteformDraft() {
        try {
            const stored = localStorage.getItem(roteformStorageKey());
            return stored ? JSON.parse(stored) : null;
        } catch (err) {
            console.error('Error loading roteform draft', err);
            return null;
        }
    }

    function saveRoteformDraft() {
        const fields = getRoteformFields();
        const draft = {};
        Object.entries(fields).forEach(([key, element]) => {
            draft[key] = element.value;
        });

        try {
            localStorage.setItem(roteformStorageKey(), JSON.stringify(draft));
        } catch (err) {
            console.error('Error saving roteform draft', err);
        }
    }

    function handleRoteformDraftSave() {
        saveRoteformDraft();
        setStatusMessage(roteformStatus, 'Draft saved locally.', 'success');
    }

    function clearRoteformDraft() {
        localStorage.removeItem(roteformStorageKey());
    }

    function updateRoteformProgress() {
        const fields = getRoteformFields();
        const answered = Object.values(fields).filter(el => el.value.trim().length > 0).length;
        const total = Object.keys(fields).length;

        const progressText = document.getElementById('roteformProgressText');
        const progressFill = document.getElementById('roteformProgressFill');

        if (progressText) {
            progressText.textContent = `${answered}/${total} reflections noted`;
        }
        if (progressFill) {
            progressFill.style.width = `${(answered / total) * 100}%`;
        }
    }

    function saveRoteformEntry() {
        const fields = getRoteformFields();
        const payload = {};
        let answeredCount = 0;

        Object.entries(fields).forEach(([key, element]) => {
            const value = element.value.trim();
            payload[key] = value;
            if (value) answeredCount += 1;
        });

        if (answeredCount === 0) {
            setStatusMessage(roteformStatus, 'Capture at least one reflection before saving.', 'error');
            return;
        }

        const entry = {
            id: String(Date.now()),
            type: 'roteform',
            title: `Daily Reflection – ${formatJournalDate(new Date().toISOString())}`,
            content: payload,
            createdAt: new Date().toISOString()
        };

        journalState.entries.unshift(entry);
        saveJournalEntries();
        setStatusMessage(roteformStatus, 'Reflection saved. Nice work.', 'success');

        Object.values(fields).forEach(element => {
            element.value = '';
        });
        updateRoteformProgress();
        clearRoteformDraft();
    }

    function initializeFlowformState() {
        const todayKey = getTodayKey();
        const stored = localStorage.getItem(`${FLOWFORM_PREFIX}${todayKey}`);
        if (stored) {
            try {
                journalState.flowform = JSON.parse(stored);
                journalState.flowformKey = todayKey;
                return;
            } catch (err) {
                console.error('Error loading flowform draft', err);
            }
        }

        journalState.flowform = createFreshFlowform(todayKey);
        journalState.flowformKey = todayKey;
        persistFlowformDraft();
    }

    function createFreshFlowform(dateKey) {
        const base = {};
        Object.keys(FLOWFORM_CATEGORIES).forEach(category => {
            base[category] = [];
        });
        return {
            date: dateKey,
            entries: base
        };
    }

    function persistFlowformDraft() {
        try {
            localStorage.setItem(`${FLOWFORM_PREFIX}${journalState.flowformKey}`, JSON.stringify(journalState.flowform));
        } catch (err) {
            console.error('Error persisting flowform draft', err);
        }
    }

    function renderFlowformHome() {
        if (!flowformContainer || !journalState.flowform) return;

        const today = formatJournalDate(new Date().toISOString());
        const counts = Object.entries(journalState.flowform.entries).map(([key, items]) => ({
            key,
            label: FLOWFORM_CATEGORIES[key].name,
            count: items.length
        }));

        const summary = counts.filter(item => item.count > 0)
            .map(item => `${item.label} (${item.count})`).join(' · ');

        flowformContainer.innerHTML = `
            <header class="flowform-header">
                <div>
                    <h3>Flowform Daily Capture</h3>
                    <p class="flowform-subtitle">${today}</p>
                </div>
                <p class="flowform-summary">${summary || 'No captures yet. Tap a tile to begin.'}</p>
            </header>
            <div class="flowform-grid">
                ${Object.values(FLOWFORM_CATEGORIES).map(category => `
                    <button class="flowform-card" data-flowform-category="${category.key}">
                        <span class="flowform-card-title">${category.name}</span>
                        <span class="flowform-card-count">${journalState.flowform.entries[category.key].length} saved</span>
                        <span class="flowform-card-cta">Capture</span>
                    </button>
                `).join('')}
            </div>
            <div class="flowform-footer">
                <button class="journal-secondary-btn" data-flowform-overview>Review &amp; Save Day</button>
            </div>
        `;

        flowformStatusEl = flowformContainer.querySelector('.flowform-summary');
    }

    function renderFlowformCategory(key) {
        const category = FLOWFORM_CATEGORIES[key];
        if (!category || !flowformContainer) return;

        if (key === 'mood') {
            renderFlowformMood();
            return;
        }

        if (key === 'picture') {
            renderFlowformPicture();
            return;
        }

        const existing = journalState.flowform.entries[key] || [];

        flowformContainer.innerHTML = `
            <div class="flowform-section">
                <button class="flowform-back" data-flowform-back>← Categories</button>
                <h3>${category.name}</h3>
                <p class="flowform-prompt">${category.prompt}</p>
                <textarea id="flowformInput" class="journal-textarea" rows="4" placeholder="Add a short note..."></textarea>
                <div class="journal-action-row">
                    <button class="journal-primary-btn" id="flowformSaveBtn">Save Entry</button>
                </div>
                ${existing.length ? `
                    <div class="flowform-history">
                        <h4>Saved today</h4>
                        <ul>
                            ${existing.map((entry, index) => `
                                <li>
                                    <span>${escapeHtml(entry.text)}</span>
                                    <button class="flowform-delete" data-flowform-delete="${key}" data-index="${index}">Delete</button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        const saveButton = document.getElementById('flowformSaveBtn');
        const input = document.getElementById('flowformInput');
        if (saveButton && input) {
            saveButton.addEventListener('click', () => {
                const text = input.value.trim();
                if (!text) {
                    showFlowformStatus('Write a quick note before saving.');
                    return;
                }
                journalState.flowform.entries[key].push({
                    text,
                    timestamp: new Date().toISOString()
                });
                persistFlowformDraft();
                renderFlowformCategory(key);
                showFlowformStatus(`${category.name} saved.`);
            });
        }
    }

    function renderFlowformMood() {
        flowformContainer.innerHTML = `
            <div class="flowform-section">
                <button class="flowform-back" data-flowform-back>← Categories</button>
                <h3>Mood</h3>
                <p class="flowform-prompt">Tap the mood that fits best. You can add context afterward.</p>
                <div class="mood-grid">
                    ${MOOD_OPTIONS.map(option => `
                        <button class="mood-option" data-mood="${option.name}" data-emoji="${option.emoji}">
                            <span class="mood-emoji">${option.emoji}</span>
                            <span class="mood-name">${option.name}</span>
                        </button>
                    `).join('')}
                </div>
                ${renderMoodHistory()}
            </div>
        `;

        flowformContainer.querySelectorAll('.mood-option').forEach(button => {
            button.addEventListener('click', () => {
                const emoji = button.dataset.emoji;
                const name = button.dataset.mood;
                renderMoodContext(emoji, name);
            });
        });
    }

    function renderMoodHistory() {
        const list = journalState.flowform.entries.mood || [];
        if (!list.length) return '';

        return `
            <div class="flowform-history">
                <h4>Saved moods</h4>
                <ul>
                    ${list.map((entry, index) => `
                        <li>
                            <span>${entry.emoji} ${escapeHtml(entry.text)}${entry.context ? ` — ${escapeHtml(entry.context)}` : ''}</span>
                            <button class="flowform-delete" data-flowform-delete="mood" data-index="${index}">Delete</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    function renderMoodContext(emoji, name) {
        flowformContainer.innerHTML = `
            <div class="flowform-section">
                <button class="flowform-back" data-flowform-back>← Categories</button>
                <h3>${emoji} ${name}</h3>
                <p class="flowform-prompt">Add an optional note about what led to this feeling.</p>
                <textarea id="moodContext" class="journal-textarea" rows="3" placeholder="Optional context..."></textarea>
                <div class="journal-action-row">
                    <button class="journal-secondary-btn" id="moodSkipBtn">Skip &amp; Save</button>
                    <button class="journal-primary-btn" id="moodSaveBtn">Save Mood</button>
                </div>
            </div>
        `;

        const saveBtn = document.getElementById('moodSaveBtn');
        const skipBtn = document.getElementById('moodSkipBtn');
        const contextArea = document.getElementById('moodContext');

        const commitMood = (skip = false) => {
            journalState.flowform.entries.mood.push({
                emoji,
                text: name,
                context: skip ? '' : (contextArea.value || '').trim(),
                timestamp: new Date().toISOString()
            });
            persistFlowformDraft();
            renderFlowformMood();
            showFlowformStatus('Mood saved.');
        };

        if (saveBtn) saveBtn.addEventListener('click', () => commitMood(false));
        if (skipBtn) skipBtn.addEventListener('click', () => commitMood(true));
    }

    function renderFlowformPicture() {
        const existing = journalState.flowform.entries.picture || [];

        flowformContainer.innerHTML = `
            <div class="flowform-section">
                <button class="flowform-back" data-flowform-back>← Categories</button>
                <h3>Picture</h3>
                <p class="flowform-prompt">Add a photo from today (stored locally).</p>
                <div class="picture-uploader">
                    <label class="picture-dropzone" for="flowformImageInput">📸 Tap to choose a photo</label>
                    <input type="file" id="flowformImageInput" accept="image/*" hidden>
                    <div id="flowformImagePreview" class="picture-preview hidden">
                        <img alt="Preview">
                        <button class="journal-secondary-btn" id="flowformChangeImage">Change Photo</button>
                    </div>
                    <textarea id="flowformImageCaption" class="journal-textarea" rows="3" placeholder="Add a caption (optional)"></textarea>
                </div>
                <div class="journal-action-row">
                    <button class="journal-primary-btn" id="flowformImageSave" disabled>Save Photo</button>
                </div>
                ${existing.length ? `
                    <div class="flowform-history">
                        <h4>Saved today</h4>
                        <ul>
                            ${existing.map((entry, index) => `
                                <li>
                                    <span>${escapeHtml(entry.text || 'Photo')}</span>
                                    <button class="flowform-delete" data-flowform-delete="picture" data-index="${index}">Delete</button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        const input = document.getElementById('flowformImageInput');
        const previewWrapper = document.getElementById('flowformImagePreview');
        const previewImage = previewWrapper ? previewWrapper.querySelector('img') : null;
        const changeButton = document.getElementById('flowformChangeImage');
        const caption = document.getElementById('flowformImageCaption');
        const saveButton = document.getElementById('flowformImageSave');

        let imageData = null;

        function resetImage() {
            imageData = null;
            if (previewWrapper) previewWrapper.classList.add('hidden');
            if (saveButton) saveButton.disabled = true;
        }

        if (input) {
            input.addEventListener('change', event => {
                const file = event.target.files && event.target.files[0];
                if (!file) {
                    resetImage();
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    showFlowformStatus('Choose a valid image file.');
                    resetImage();
                    return;
                }

                const reader = new FileReader();
                reader.onload = e => {
                    imageData = e.target?.result || null;
                    if (imageData && previewWrapper && previewImage) {
                        previewImage.src = imageData;
                        previewWrapper.classList.remove('hidden');
                        if (saveButton) saveButton.disabled = false;
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        if (changeButton && input) {
            changeButton.addEventListener('click', () => input.click());
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                if (!imageData) {
                    showFlowformStatus('Select a photo before saving.');
                    return;
                }

                journalState.flowform.entries.picture.push({
                    imageData,
                    text: caption ? caption.value.trim() : '',
                    timestamp: new Date().toISOString()
                });
                persistFlowformDraft();
                renderFlowformPicture();
                showFlowformStatus('Photo saved to today\'s capture.');
            });
        }
    }

    function renderFlowformOverview() {
        if (!flowformContainer) return;
        const entries = journalState.flowform.entries;
        const hasEntries = Object.values(entries).some(arr => arr.length > 0);

        flowformContainer.innerHTML = `
            <div class="flowform-section">
                <button class="flowform-back" data-flowform-back>← Categories</button>
                <h3>Daily Overview</h3>
                ${hasEntries ? renderOverviewContent(entries) : `
                    <p class="flowform-prompt">No captures yet today. Add a note or mood to begin.</p>
                `}
                <div class="journal-action-row">
                    <button class="journal-primary-btn" data-flowform-save ${hasEntries ? '' : 'disabled'}>Save Daily Entry</button>
                </div>
            </div>
        `;
    }

    function renderOverviewContent(entries) {
        return `
            <div class="flowform-overview">
                ${Object.entries(entries).map(([key, list]) => {
                    if (!list.length) return '';
                    if (key === 'picture') {
                        return `
                            <section>
                                <h4>${FLOWFORM_CATEGORIES[key].name}</h4>
                                <div class="overview-gallery">
                                    ${list.map(item => `
                                        <figure>
                                            <img src="${item.imageData}" alt="${escapeHtml(item.text || 'Photo')}">
                                            ${item.text ? `<figcaption>${escapeHtml(item.text)}</figcaption>` : ''}
                                        </figure>
                                    `).join('')}
                                </div>
                            </section>
                        `;
                    }

                    if (key === 'mood') {
                        return `
                            <section>
                                <h4>${FLOWFORM_CATEGORIES[key].name}</h4>
                                <ul class="overview-list">
                                    ${list.map(item => `
                                        <li>${item.emoji} ${escapeHtml(item.text)}${item.context ? ` – ${escapeHtml(item.context)}` : ''}</li>
                                    `).join('')}
                                </ul>
                            </section>
                        `;
                    }

                    return `
                        <section>
                            <h4>${FLOWFORM_CATEGORIES[key].name}</h4>
                            <ul class="overview-list">
                                ${list.map(item => `<li>${escapeHtml(item.text)}</li>`).join('')}
                            </ul>
                        </section>
                    `;
                }).join('')}
            </div>
        `;
    }

    function deleteFlowformEntry(category, index) {
        const entries = journalState.flowform.entries[category];
        if (!entries || index < 0 || index >= entries.length) return;
        entries.splice(index, 1);
        persistFlowformDraft();
        if (category === 'mood') {
            renderFlowformMood();
        } else if (category === 'picture') {
            renderFlowformPicture();
        } else {
            renderFlowformCategory(category);
        }
        showFlowformStatus('Entry removed.');
    }

    function saveFlowformToJournal() {
        const entries = journalState.flowform.entries;
        const hasEntries = Object.values(entries).some(arr => arr.length > 0);
        if (!hasEntries) {
            showFlowformStatus('Capture at least one moment before saving.');
            return;
        }

        const entry = {
            id: String(Date.now()),
            type: 'flowform',
            title: `Flowform Scrapbook – ${formatJournalDate(new Date().toISOString())}`,
            content: JSON.parse(JSON.stringify(journalState.flowform)),
            createdAt: new Date().toISOString()
        };

        journalState.entries.unshift(entry);
        saveJournalEntries();

        localStorage.removeItem(`${FLOWFORM_PREFIX}${journalState.flowformKey}`);
        initializeFlowformState();
        renderFlowformHome();
        showFlowformStatus('Daily Flowform saved to journal.');
    }

    function showFlowformStatus(message) {
        if (!flowformStatusEl) {
            flowformStatusEl = flowformContainer.querySelector('.flowform-summary');
        }
        setStatusMessage(flowformStatusEl, message, 'info', 1800);
    }

    function renderJournalEntriesList() {
        const listEl = document.getElementById('journalEntriesList');
        const emptyState = document.getElementById('journalEmptyState');
        if (!listEl) return;

        const searchValue = (document.getElementById('journalSearchInput')?.value || '').trim().toLowerCase();
        const filterValue = document.getElementById('journalFilterSelect')?.value || 'all';

        let filtered = [...journalState.entries];

        if (filterValue !== 'all') {
            filtered = filtered.filter(entry => entry.type === filterValue);
        }

        if (searchValue) {
            filtered = filtered.filter(entry => {
                const titleMatch = (entry.title || '').toLowerCase().includes(searchValue);
                let contentMatch = false;

                if (entry.type === 'freeform' && entry.content) {
                    contentMatch = entry.content.toLowerCase().includes(searchValue);
                } else if (entry.type === 'roteform') {
                    contentMatch = Object.values(entry.content || {})
                        .some(value => (value || '').toLowerCase().includes(searchValue));
                } else if (entry.type === 'flowform') {
                    contentMatch = Object.values((entry.content && entry.content.entries) || {})
                        .some(list => list.some(item => {
                            if (item.text && item.text.toLowerCase().includes(searchValue)) return true;
                            if (item.context && item.context.toLowerCase().includes(searchValue)) return true;
                            return false;
                        }));
                }

                return titleMatch || contentMatch;
            });
        }

        if (!journalState.entries.length) {
            listEl.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        if (!filtered.length) {
            listEl.innerHTML = `
                <div class="journal-empty-result">
                    <p>No entries match that search.</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = filtered.map(entry => `
            <button class="journal-entry-card" data-entry-id="${entry.id}">
                <div class="entry-card-header">
                    <span class="entry-icon">${JOURNAL_TYPES[entry.type].icon}</span>
                    <span class="entry-type">${JOURNAL_TYPES[entry.type].label}</span>
                    <span class="entry-date">${formatJournalDate(entry.createdAt)}</span>
                </div>
                <h4 class="entry-title">${escapeHtml(entry.title || 'Untitled')}</h4>
                <p class="entry-preview">${escapeHtml(buildEntryPreview(entry))}</p>
            </button>
        `).join('');
    }

    function renderDoneView() {
        if (!journalDoneList) return;

        const todos = getTodosState();
        if (!todos) {
            journalDoneList.innerHTML = `
                <div class="journal-empty-state">
                    <p>Completed tasks will appear here.</p>
                </div>
            `;
            if (journalDoneDateLabel) journalDoneDateLabel.textContent = '';
            return;
        }

        const completed = [];
        Object.entries(todos).forEach(([listName, items]) => {
            items.forEach(item => {
                if (item.completed) {
                    completed.push({
                        id: item.id,
                        content: item.content,
                        completedAt: item.completedAt || item.timestamp,
                        list: listName
                    });
                }
            });
        });

        if (!completed.length) {
            journalDoneList.innerHTML = `
                <div class="journal-empty-state">
                    <p>No completed tasks yet. Once you finish items, they’ll land here automatically.</p>
                </div>
            `;
            if (journalDoneDateLabel) journalDoneDateLabel.textContent = '';
            return;
        }

        const grouped = completed.reduce((acc, item) => {
            const when = item.completedAt || new Date().toISOString();
            const dateKey = (new Date(when)).toISOString().split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(item);
            return acc;
        }, {});

        const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
        if (journalDoneDateLabel && sortedDates.length) {
            journalDoneDateLabel.textContent = `Latest entry: ${formatFullDate(sortedDates[0])}`;
        }

        journalDoneList.innerHTML = sortedDates.map(dateKey => {
            const items = grouped[dateKey].sort((a, b) => {
                const aTime = new Date(a.completedAt || 0).getTime();
                const bTime = new Date(b.completedAt || 0).getTime();
                return bTime - aTime;
            });
            const prettyDate = formatFullDate(dateKey);
            const tasks = items.map(item => `
                <div class="journal-done-item">
                    <div class="journal-done-time">${formatTimeLabel(item.completedAt)}</div>
                    <div class="journal-done-text">${escapeHtml(item.content)}</div>
                    <span class="journal-done-pill">${formatListName(item.list)}</span>
                </div>
            `).join('');

            return `
                <section class="journal-done-section">
                    <header class="journal-done-header">
                        <h4>${prettyDate}</h4>
                        <span class="journal-done-count">${items.length} ${items.length === 1 ? 'task' : 'tasks'}</span>
                    </header>
                    <div class="journal-done-items">${tasks}</div>
                </section>
            `;
        }).join('');
    }

    function buildEntryPreview(entry) {
        if (entry.type === 'freeform') {
            const text = entry.content || '';
            return text.length > 140 ? `${text.slice(0, 140)}…` : text;
        }

        if (entry.type === 'roteform') {
            const firstAnswer = Object.values(entry.content || {})
                .find(value => value && value.trim().length > 0);
            if (!firstAnswer) return 'Tap to read your structured reflection.';
            return firstAnswer.length > 140 ? `${firstAnswer.slice(0, 140)}…` : firstAnswer;
        }

        if (entry.type === 'flowform') {
            const entries = (entry.content && entry.content.entries) || {};
            const summary = Object.entries(entries)
                .filter(([, list]) => list.length > 0)
                .map(([key, list]) => `${FLOWFORM_CATEGORIES[key].name}: ${list.length}`)
                .join(' · ');
            return summary || 'Tap to review the scrapbook.';
        }

        return 'Open entry';
    }

    function openJournalEntry(entryId) {
        const entry = journalState.entries.find(item => item.id === entryId);
        if (!entry) return;

        journalState.activeEntryId = entryId;
        renderJournalDetail(entry);
        showJournalView('detail');
    }

    function renderJournalDetail(entry) {
        if (!journalDetailContent) return;

        const header = `
            <header class="journal-detail-header">
                <div class="journal-detail-meta">
                    <span class="entry-icon">${JOURNAL_TYPES[entry.type].icon}</span>
                    <span>${JOURNAL_TYPES[entry.type].label}</span>
                </div>
                <h3>${escapeHtml(entry.title || 'Untitled')}</h3>
                <p class="journal-detail-date">${formatJournalDate(entry.createdAt)}</p>
            </header>
        `;

        let body = '';

        if (entry.type === 'freeform') {
            body = `
                <div class="journal-detail-body">
                    ${formatMultiline(entry.content || '')}
                </div>
            `;
        } else if (entry.type === 'roteform') {
            body = `
                <div class="journal-detail-body">
                    ${Object.entries(entry.content || {}).map(([key, value], index) => {
                        if (!value) return '';
                        return `
                            <section>
                                <h4>${index + 1}. ${formatRoteformHeading(key)}</h4>
                                <p>${formatMultiline(value)}</p>
                            </section>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (entry.type === 'flowform') {
            const entries = (entry.content && entry.content.entries) || {};
            body = `
                <div class="journal-detail-body">
                    ${Object.entries(entries).map(([key, list]) => {
                        if (!list.length) return '';
                        if (key === 'picture') {
                            return `
                                <section>
                                    <h4>${FLOWFORM_CATEGORIES[key].name}</h4>
                                    <div class="overview-gallery">
                                        ${list.map(item => `
                                            <figure>
                                                <img src="${item.imageData}" alt="${escapeHtml(item.text || 'Photo')}">
                                                ${item.text ? `<figcaption>${escapeHtml(item.text)}</figcaption>` : ''}
                                            </figure>
                                        `).join('')}
                                    </div>
                                </section>
                            `;
                        }

                        if (key === 'mood') {
                            return `
                                <section>
                                    <h4>${FLOWFORM_CATEGORIES[key].name}</h4>
                                    <ul class="overview-list">
                                        ${list.map(item => `
                                            <li>${item.emoji} ${escapeHtml(item.text)}${item.context ? ` – ${escapeHtml(item.context)}` : ''}</li>
                                        `).join('')}
                                    </ul>
                                </section>
                            `;
                        }

                        return `
                            <section>
                                <h4>${FLOWFORM_CATEGORIES[key].name}</h4>
                                <ul class="overview-list">
                                    ${list.map(item => `<li>${escapeHtml(item.text)}</li>`).join('')}
                                </ul>
                            </section>
                        `;
                    }).join('')}
                </div>
            `;
        }

        journalDetailContent.innerHTML = header + body;
    }

    function handleDeleteCurrentEntry() {
        if (!journalState.activeEntryId) return;
        const entry = journalState.entries.find(item => item.id === journalState.activeEntryId);
        if (!entry) return;

        const confirmed = window.confirm(`Delete "${entry.title || 'this entry'}"? This cannot be undone.`);
        if (!confirmed) return;

        journalState.entries = journalState.entries.filter(item => item.id !== journalState.activeEntryId);
        journalState.activeEntryId = null;
        saveJournalEntries();
        showJournalView('entries');
        renderJournalEntriesList();
    }

    function setStatusMessage(element, message, tone = 'info', duration = 2200) {
        if (!element) return;
        element.textContent = message;
        element.classList.remove('status-success', 'status-error', 'status-info');

        const toneClass = tone === 'success' ? 'status-success' : tone === 'error' ? 'status-error' : 'status-info';
        element.classList.add(toneClass);

        if (duration > 0) {
            const token = Symbol('status');
            element.dataset.statusToken = token.toString();
            setTimeout(() => {
                if (element.dataset.statusToken === token.toString()) {
                    element.textContent = '';
                    element.classList.remove('status-success', 'status-error', 'status-info');
                }
            }, duration);
        }
    }

    function formatJournalDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    function formatMultiline(text) {
        if (!text) return '';
        return escapeHtml(text).replace(/\n/g, '<br>');
    }

    function formatRoteformHeading(key) {
        const titles = {
            gratitude: 'Gratitude',
            emotions: 'Emotions',
            values: 'Values Alignment',
            growth: 'Growth',
            connection: 'Connection',
            compassion: 'Self-Compassion',
            story: 'Narrative'
        };
        return titles[key] || key;
    }

    function escapeHtml(text) {
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(text);
        }
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    window.initJournal = initJournal;
    window.handleJournalNavigation = () => {
        if (!journalState.initialized) return;
        handleJournalNavigation(journalState.view || 'home');
    };
})();
