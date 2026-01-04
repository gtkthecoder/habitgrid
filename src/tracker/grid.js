import { DateUtils } from '../utils/dates.js';
import { HabitManager } from './habits.js';

export class GridRenderer {
    constructor(container, habitManager, monthManager) {
        this.container = container;
        this.habitManager = habitManager;
        this.monthManager = monthManager;
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth();
        this.selectedHabit = null;
    }

    render() {
        this.renderHeader();
        this.renderBody();
        this.updateStats();
    }

    renderHeader() {
        const header = this.container.querySelector('#days-header');
        if (!header) return;

        header.innerHTML = '';
        const monthInfo = this.monthManager.getInfo();
        
        monthInfo.days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'day-header';
            dayElement.dataset.day = day.day;
            
            if (day.isToday) {
                dayElement.classList.add('today');
            }
            if (day.isWeekend) {
                dayElement.classList.add('weekend');
            }
            
            dayElement.innerHTML = `
                <span class="day-number">${day.day}</span>
                <span class="day-name">${day.dayOfWeek}</span>
            `;
            
            dayElement.addEventListener('click', () => {
                this.toggleAllHabitsForDay(day.day);
            });
            
            header.appendChild(dayElement);
        });
    }

    renderBody() {
        const body = this.container.querySelector('#grid-body');
        if (!body) return;

        body.innerHTML = '';
        const monthInfo = this.monthManager.getInfo();
        
        this.habitManager.habits.forEach((habit, index) => {
            const row = this.createHabitRow(habit, index, monthInfo);
            body.appendChild(row);
        });

        if (this.habitManager.habits.length === 0) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'empty-grid-message';
            emptyRow.innerHTML = `
                <div class="empty-content">
                    <i class="fas fa-table-cells-large"></i>
                    <h3>No habits yet</h3>
                    <p>Click "New Habit" to add your first habit</p>
                </div>
            `;
            body.appendChild(emptyRow);
        }
    }

    createHabitRow(habit, index, monthInfo) {
        const row = document.createElement('div');
        row.className = 'habit-row';
        row.dataset.habitId = habit.id;
        
        const progress = this.habitManager.getHabitProgress(habit, this.currentYear, this.currentMonth);
        
        // Row info section
        const rowInfo = document.createElement('div');
        rowInfo.className = 'row-info';
        rowInfo.innerHTML = `
            <div class="habit-cell">
                <div class="habit-icon" style="background: ${habit.color}20; color: ${habit.color}">
                    ${habit.emoji}
                </div>
                <div class="habit-details">
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-goal">Goal: ${habit.goal} days</div>
                </div>
            </div>
            <div class="goal-cell">${habit.goal}</div>
            <div class="progress-cell">${progress.percentage}%</div>
        `;
        
        // Days cells section
        const daysCells = document.createElement('div');
        daysCells.className = 'days-cells';
        
        monthInfo.days.forEach(day => {
            const cell = this.createDayCell(habit, day);
            daysCells.appendChild(cell);
        });
        
        row.appendChild(rowInfo);
        row.appendChild(daysCells);
        
        // Add click handler for row selection
        row.addEventListener('click', (e) => {
            if (!e.target.closest('.day-cell')) {
                this.selectHabit(habit.id);
            }
        });
        
        return row;
    }

    createDayCell(habit, dayInfo) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.dataset.day = dayInfo.day;
        cell.dataset.habitId = habit.id;
        
        const record = habit.records.find(r => {
            const recordDate = new Date(r.date);
            return recordDate.getDate() === dayInfo.day &&
                   recordDate.getMonth() === this.currentMonth &&
                   recordDate.getFullYear() === this.currentYear;
        });
        
        const isCompleted = record && record.completed;
        
        if (isCompleted) {
            cell.classList.add('checked');
        } else if (dayInfo.isPast && !dayInfo.isToday) {
            cell.classList.add('missed');
        }
        
        if (dayInfo.isFuture) {
            cell.classList.add('future');
        }
        
        if (dayInfo.isToday) {
            cell.classList.add('today');
        }
        
        cell.innerHTML = `
            <div class="checkbox">
                ${isCompleted ? '✓' : ''}
            </div>
        `;
        
        if (!dayInfo.isFuture) {
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDay(habit.id, dayInfo.day);
            });
        }
        
        return cell;
    }

    toggleDay(habitId, day) {
        const habit = this.habitManager.habits.find(h => h.id === habitId);
        if (!habit) return;
        
        const record = this.habitManager.toggleDay(habitId, this.currentYear, this.currentMonth, day);
        
        if (record) {
            this.updateCell(habitId, day, record.completed);
            this.updateHabitProgress(habitId);
            this.updateStats();
        }
    }

    toggleAllHabitsForDay(day) {
        const dayInfo = this.monthManager.days.find(d => d.day === day);
        if (dayInfo.isFuture) return;
        
        const anyCompleted = this.habitManager.habits.some(habit => {
            const record = habit.records.find(r => {
                const recordDate = new Date(r.date);
                return recordDate.getDate() === day &&
                       recordDate.getMonth() === this.currentMonth &&
                       recordDate.getFullYear() === this.currentYear;
            });
            return record && record.completed;
        });
        
        this.habitManager.habits.forEach(habit => {
            this.habitManager.toggleDay(habit.id, this.currentYear, this.currentMonth, day, !anyCompleted);
        });
        
        this.render();
    }

    updateCell(habitId, day, completed) {
        const cell = this.container.querySelector(`.day-cell[data-habit-id="${habitId}"][data-day="${day}"]`);
        if (cell) {
            cell.classList.toggle('checked', completed);
            cell.classList.toggle('missed', !completed && !cell.classList.contains('future'));
            
            const checkbox = cell.querySelector('.checkbox');
            if (checkbox) {
                checkbox.textContent = completed ? '✓' : '';
            }
        }
    }

    updateHabitProgress(habitId) {
        const habit = this.habitManager.habits.find(h => h.id === habitId);
        if (!habit) return;
        
        const progress = this.habitManager.getHabitProgress(habit, this.currentYear, this.currentMonth);
        const progressCell = this.container.querySelector(`.habit-row[data-habit-id="${habitId}"] .progress-cell`);
        
        if (progressCell) {
            progressCell.textContent = `${progress.percentage}%`;
            
            // Update progress bar in sidebar if exists
            const sidebarProgress = document.querySelector(`.habit-item[data-habit-id="${habitId}"] .progress-fill`);
            if (sidebarProgress) {
                sidebarProgress.style.width = `${progress.percentage}%`;
            }
            
            const sidebarPercentage = document.querySelector(`.habit-item[data-habit-id="${habitId}"] .habit-percentage`);
            if (sidebarPercentage) {
                sidebarPercentage.textContent = `${progress.percentage}%`;
            }
        }
    }

    updateStats() {
        const overallProgress = this.habitManager.getOverallProgress(this.currentYear, this.currentMonth);
        
        // Update overall progress bar
        const progressFill = document.getElementById('overall-progress-fill');
        const overallPercentage = document.getElementById('overall-percentage');
        
        if (progressFill) {
            progressFill.style.width = `${overallProgress.percentage}%`;
        }
        
        if (overallPercentage) {
            overallPercentage.textContent = `${overallProgress.percentage}%`;
        }
        
        // Update stats in sidebar
        const activeCount = document.getElementById('active-count');
        const completedCount = document.getElementById('completed-count');
        const streakCount = document.getElementById('streak-count');
        
        if (activeCount) {
            activeCount.textContent = this.habitManager.habits.length;
        }
        
        if (completedCount) {
            completedCount.textContent = `${overallProgress.percentage}%`;
        }
        
        if (streakCount) {
            const streaks = this.habitManager.getHabitStreaks();
            const maxStreak = streaks.length > 0 ? Math.max(...streaks.map(s => s.streak)) : 0;
            streakCount.textContent = maxStreak;
        }
    }

    selectHabit(habitId) {
        if (this.selectedHabit === habitId) {
            this.selectedHabit = null;
        } else {
            this.selectedHabit = habitId;
        }
        
        // Update UI selection
        document.querySelectorAll('.habit-row').forEach(row => {
            row.classList.toggle('selected', row.dataset.habitId === this.selectedHabit);
        });
        
        document.querySelectorAll('.habit-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.habitId === this.selectedHabit);
        });
    }

    updateMonth(year, month) {
        this.currentYear = year;
        this.currentMonth = month;
        this.render();
    }

    addHabitToGrid(habit) {
        const body = this.container.querySelector('#grid-body');
        if (!body) return;
        
        const monthInfo = this.monthManager.getInfo();
        const row = this.createHabitRow(habit, this.habitManager.habits.length - 1, monthInfo);
        
        // Remove empty message if it exists
        const emptyMessage = body.querySelector('.empty-grid-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
        
        body.appendChild(row);
        this.updateStats();
    }

    removeHabitFromGrid(habitId) {
        const row = this.container.querySelector(`.habit-row[data-habit-id="${habitId}"]`);
        if (row) {
            row.remove();
        }
        
        // Show empty message if no habits left
        if (this.habitManager.habits.length === 0) {
            this.renderBody();
        }
        
        this.updateStats();
    }
}
