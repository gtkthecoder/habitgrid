import { HabitManager } from './tracker/habits.js';
import { GridRenderer } from './tracker/grid.js';
import { MonthManager } from './month.js';
import { DateUtils } from './utils/dates.js';
import { googleAuth } from './auth/google-auth.js';
import { DriveStorage } from './drive/drive-storage.js';
import { EMOJIS } from './utils/constants.js';

class HabitGridApp {
    constructor() {
        this.habitManager = new HabitManager();
        this.monthManager = new MonthManager(
            new Date().getFullYear(),
            new Date().getMonth()
        );
        this.gridRenderer = null;
        this.driveStorage = null;
        this.currentView = 'month';
        this.autoSaveTimeout = null;
        this.initialize();
    }

    async initialize() {
        this.hideLoadingScreen();
        this.setupDateDisplay();
        this.setupEventListeners();
        this.initializeGrid();
        this.renderHabitsSidebar();
        this.setupGoogleAuth();
        
        // Update UI every minute for live time
        setInterval(() => this.updateDateTime(), 60000);
        
        // Check for saved data
        await this.loadSavedData();
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const appWrapper = document.getElementById('app-wrapper');
        
        if (loadingScreen && appWrapper) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    appWrapper.style.display = 'block';
                }, 300);
            }, 500);
        }
    }

    setupDateDisplay() {
        this.updateDateTime();
    }

    updateDateTime() {
        const now = new Date();
        const dateElement = document.getElementById('current-date');
        
        if (dateElement) {
            dateElement.textContent = DateUtils.formatDate(now, 'long');
        }
        
        // Update current month display
        const monthDisplay = document.getElementById('current-month-display');
        if (monthDisplay) {
            const monthSpan = monthDisplay.querySelector('.month');
            const yearSpan = monthDisplay.querySelector('.year');
            
            if (monthSpan && yearSpan) {
                monthSpan.textContent = now.toLocaleDateString('en-US', { month: 'long' });
                yearSpan.textContent = now.getFullYear();
            }
        }
    }

    setupEventListeners() {
        // Month navigation
        document.getElementById('prev-month')?.addEventListener('click', () => {
            this.previousMonth();
        });
        
        document.getElementById('next-month')?.addEventListener('click', () => {
            this.nextMonth();
        });

        // Add habit button
        document.getElementById('add-habit-btn')?.addEventListener('click', () => {
            this.showAddHabitModal();
        });

        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeView(e.target.dataset.view);
            });
        });

        // Export button
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.exportData();
        });

        // Sync button
        document.getElementById('sync-btn')?.addEventListener('click', () => {
            this.manualSync();
        });

        // Modal close buttons
        document.querySelectorAll('.close-modal, .modal-close, #cancel-habit').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAddHabitModal();
            });
        });

        // Save habit button
        document.getElementById('save-habit')?.addEventListener('click', () => {
            this.saveNewHabit();
        });

        // Emoji selection
        this.setupEmojiGrid();

        // Goal range input
        const goalRange = document.getElementById('habit-goal-range');
        const goalInput = document.getElementById('habit-goal');
        
        if (goalRange && goalInput) {
            goalRange.addEventListener('input', (e) => {
                goalInput.value = e.target.value;
            });
            
            goalInput.addEventListener('input', (e) => {
                goalRange.value = e.target.value;
            });
        }

        // Color selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectColor(e.target);
            });
        });

        // Skip login button
        document.getElementById('skip-login')?.addEventListener('click', () => {
            this.skipLogin();
        });
    }

    initializeGrid() {
        const gridContainer = document.querySelector('.spreadsheet-container');
        if (gridContainer) {
            this.gridRenderer = new GridRenderer(
                gridContainer,
                this.habitManager,
                this.monthManager
            );
            this.gridRenderer.render();
        }
    }

    renderHabitsSidebar() {
        const container = document.getElementById('habits-container');
        if (!container) return;

        container.innerHTML = '';
        
        this.habitManager.habits.forEach(habit => {
            const progress = this.habitManager.getHabitProgress(
                habit,
                this.monthManager.year,
                this.monthManager.month
            );
            
            const habitElement = document.createElement('div');
            habitElement.className = 'habit-item';
            habitElement.dataset.habitId = habit.id;
            
            habitElement.innerHTML = `
                <div class="habit-icon" style="background: ${habit.color}20; color: ${habit.color}">
                    ${habit.emoji}
                </div>
                <div class="habit-content">
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                        </div>
                        <span class="habit-percentage">${progress.percentage}%</span>
                    </div>
                </div>
                <button class="habit-delete" data-habit-id="${habit.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add click handler
            habitElement.addEventListener('click', (e) => {
                if (!e.target.closest('.habit-delete')) {
                    this.selectHabit(habit.id);
                }
            });
            
            // Add delete handler
            const deleteBtn = habitElement.querySelector('.habit-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHabit(habit.id);
            });
            
            container.appendChild(habitElement);
        });

        // Show empty state if no habits
        if (this.habitManager.habits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-list-check"></i>
                    <p>No habits yet</p>
                    <button class="btn-text" id="add-first-habit">Add your first habit</button>
                </div>
            `;
            
            document.getElementById('add-first-habit')?.addEventListener('click', () => {
                this.showAddHabitModal();
            });
        }

        this.updateStats();
    }

    showAddHabitModal() {
        const modal = document.getElementById('habit-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('habit-name')?.focus();
        }
    }

    hideAddHabitModal() {
        const modal = document.getElementById('habit-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resetHabitForm();
        }
    }

    resetHabitForm() {
        document.getElementById('habit-name').value = '';
        document.getElementById('habit-emoji').value = '🎯';
        document.getElementById('habit-goal').value = '20';
        document.getElementById('habit-goal-range').value = '20';
        
        // Reset color selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('.color-option').classList.add('selected');
    }

    setupEmojiGrid() {
        const emojiGrid = document.getElementById('emoji-grid');
        if (!emojiGrid) return;

        emojiGrid.innerHTML = EMOJIS.map(emoji => `
            <div class="emoji-option" data-emoji="${emoji}">
                ${emoji}
            </div>
        `).join('');

        // Add click handlers
        emojiGrid.querySelectorAll('.emoji-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectEmoji(e.target);
            });
        });
    }

    selectEmoji(element) {
        document.querySelectorAll('.emoji-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        element.classList.add('selected');
    }

    selectColor(element) {
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        element.classList.add('selected');
    }

    saveNewHabit() {
        const name = document.getElementById('habit-name').value.trim();
        const emoji = document.querySelector('.emoji-option.selected')?.dataset.emoji || '🎯';
        const goal = parseInt(document.getElementById('habit-goal').value);
        const color = document.querySelector('.color-option.selected')?.dataset.color || '#4285F4';
        
        if (!name) {
            alert('Please enter a habit name');
            return;
        }
        
        try {
            const habit = this.habitManager.addHabit(name, emoji, goal, color);
            this.renderHabitsSidebar();
            this.gridRenderer.addHabitToGrid(habit);
            this.hideAddHabitModal();
            this.autoSave();
        } catch (error) {
            alert(error.message);
        }
    }

    deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.habitManager.removeHabit(habitId);
            this.renderHabitsSidebar();
            this.gridRenderer.removeHabitFromGrid(habitId);
            this.autoSave();
        }
    }

    selectHabit(habitId) {
        this.gridRenderer.selectHabit(habitId);
    }

    previousMonth() {
        const monthInfo = this.monthManager.previous();
        this.updateMonthDisplay(monthInfo);
        this.gridRenderer.updateMonth(monthInfo.year, monthInfo.month);
        this.renderHabitsSidebar();
    }

    nextMonth() {
        const monthInfo = this.monthManager.next();
        this.updateMonthDisplay(monthInfo);
        this.gridRenderer.updateMonth(monthInfo.year, monthInfo.month);
        this.renderHabitsSidebar();
    }

    updateMonthDisplay(monthInfo) {
        const display = document.getElementById('current-month-display');
        if (display) {
            const monthSpan = display.querySelector('.month');
            const yearSpan = display.querySelector('.year');
            
            if (monthSpan && yearSpan) {
                monthSpan.textContent = monthInfo.monthName.split(' ')[0];
                yearSpan.textContent = monthInfo.year;
            }
        }
    }

    changeView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // TODO: Implement different views
        console.log('Switching to view:', view);
    }

    updateStats() {
        const overall = this.habitManager.getOverallProgress(
            this.monthManager.year,
            this.monthManager.month
        );
        
        // Update overall progress
        const overallElement = document.getElementById('overall-percentage');
        if (overallElement) {
            overallElement.textContent = `${overall.percentage}%`;
        }
        
        // Update progress bar
        const progressFill = document.getElementById('overall-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${overall.percentage}%`;
        }
        
        // Update last saved time
        this.updateLastSaved();
    }

    updateLastSaved() {
        const lastSaved = document.getElementById('last-saved');
        if (lastSaved) {
            const now = new Date();
            lastSaved.innerHTML = `
                <i class="fas fa-save"></i>
                Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            `;
        }
    }

    async setupGoogleAuth() {
        try {
            await googleAuth.initPromise;
            
            // Listen for auth events
            window.addEventListener('google:login', (e) => {
                console.log('User logged in:', e.detail);
                this.onGoogleLogin(e.detail);
            });
            
            window.addEventListener('google:drive-ready', (e) => {
                console.log('Drive ready:', e.detail);
                this.onDriveReady(e.detail);
            });
            
            window.addEventListener('google:logout', () => {
                this.onGoogleLogout();
            });
            
        } catch (error) {
            console.error('Failed to initialize Google Auth:', error);
        }
    }

    async onGoogleLogin(user) {
        console.log('Google login successful:', user);
        // Login modal will be hidden by auth class
    }

    async onDriveReady({ user, token }) {
        console.log('Drive API ready');
        
        // Initialize Drive storage
        this.driveStorage = new DriveStorage(googleAuth);
        
        try {
            await this.driveStorage.initialize();
            
            // Load data from Drive
            const data = await this.driveStorage.load();
            if (data && data.habits) {
                this.habitManager.importData(data);
                this.renderHabitsSidebar();
                this.gridRenderer.render();
                this.updateStats();
            }
            
            // Start auto-save
            this.driveStorage.startAutoSave(() => {
                return {
                    habits: this.habitManager.habits,
                    version: '1.0.0',
                    lastSynced: new Date().toISOString()
                };
            }, 30000); // Save every 30 seconds
            
        } catch (error) {
            console.error('Failed to initialize Drive storage:', error);
        }
    }

    onGoogleLogout() {
        console.log('User logged out');
        
        // Stop auto-save
        if (this.driveStorage) {
            this.driveStorage.stopAutoSave();
            this.driveStorage = null;
        }
        
        // Show login modal
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'flex';
        }
    }

    async loadSavedData() {
        // Load habits from localStorage
        this.habitManager.loadHabits();
        
        // If we have habits, render them
        if (this.habitManager.habits.length > 0) {
            this.renderHabitsSidebar();
            this.gridRenderer.render();
        }
    }

    autoSave() {
        // Clear existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        // Save to localStorage immediately
        this.habitManager.saveHabits();
        this.updateLastSaved();
        
        // Save to Drive if connected (with debounce)
        this.autoSaveTimeout = setTimeout(async () => {
            if (this.driveStorage && googleAuth.isAuthenticated()) {
                try {
                    await this.driveStorage.save({
                        habits: this.habitManager.habits,
                        version: '1.0.0',
                        lastSynced: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Auto-save to Drive failed:', error);
                }
            }
        }, 1000); // 1 second debounce
    }

    async manualSync() {
        if (!this.driveStorage || !googleAuth.isAuthenticated()) {
            alert('Please sign in with Google to sync with Drive');
            return;
        }
        
        try {
            this.driveStorage.updateSyncStatus('syncing');
            await this.driveStorage.save({
                habits: this.habitManager.habits,
                version: '1.0.0',
                lastSynced: new Date().toISOString()
            });
            alert('Synced successfully with Google Drive!');
        } catch (error) {
            alert('Sync failed. Please try again.');
            console.error('Manual sync failed:', error);
        }
    }

    exportData() {
        const data = this.habitManager.exportData('json');
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `habitgrid-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Data exported successfully!');
    }

    skipLogin() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'none';
        }
        alert('You can always sign in later from the top right corner to save to Google Drive.');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HabitGridApp();
});

// Export for debugging
if (window) {
    window.HabitGridApp = HabitGridApp;
}
