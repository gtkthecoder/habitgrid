import { MAX_HABITS, EMOJIS, STORAGE_KEYS } from '../utils/constants.js';
import { DateUtils } from '../utils/dates.js';

export class HabitManager {
    constructor() {
        this.habits = [];
        this.loadHabits();
    }

    addHabit(name, emoji, goal = 20, color = '#4285F4') {
        if (this.habits.length >= MAX_HABITS) {
            throw new Error(`Maximum ${MAX_HABITS} habits allowed`);
        }

        const habit = {
            id: this.generateId(),
            name: name.trim(),
            emoji: emoji || '🎯',
            goal: Math.min(Math.max(1, goal), 31),
            color,
            records: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.habits.push(habit);
        this.saveHabits();
        return habit;
    }

    removeHabit(id) {
        const index = this.habits.findIndex(h => h.id === id);
        if (index !== -1) {
            this.habits.splice(index, 1);
            this.saveHabits();
            return true;
        }
        return false;
    }

    updateHabit(id, updates) {
        const habit = this.habits.find(h => h.id === id);
        if (habit) {
            Object.assign(habit, updates, { updatedAt: new Date().toISOString() });
            this.saveHabits();
            return habit;
        }
        return null;
    }

    toggleDay(habitId, year, month, day, completed = null) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return null;

        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        
        let record = habit.records.find(r => r.date === dateString);
        
        if (record) {
            record.completed = completed !== null ? completed : !record.completed;
            record.updatedAt = new Date().toISOString();
        } else {
            record = {
                date: dateString,
                completed: completed !== null ? completed : true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            habit.records.push(record);
        }

        habit.updatedAt = new Date().toISOString();
        this.saveHabits();
        return record;
    }

    getHabitProgress(habit, year, month) {
        const daysInMonth = DateUtils.getDaysInMonth(year, month);
        const monthRecords = habit.records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year && 
                   recordDate.getMonth() === month;
        });

        const completed = monthRecords.filter(r => r.completed).length;
        const percentage = Math.min(Math.round((completed / habit.goal) * 100), 100);
        
        return {
            completed,
            goal: habit.goal,
            percentage,
            remaining: Math.max(0, habit.goal - completed),
            daysInMonth,
            streak: DateUtils.getCurrentStreak(monthRecords)
        };
    }

    getOverallProgress(year, month) {
        if (this.habits.length === 0) {
            return { percentage: 0, totalCompleted: 0, totalGoal: 0 };
        }

        let totalCompleted = 0;
        let totalGoal = 0;

        this.habits.forEach(habit => {
            const progress = this.getHabitProgress(habit, year, month);
            totalCompleted += progress.completed;
            totalGoal += habit.goal;
        });

        const percentage = totalGoal > 0 ? Math.round((totalCompleted / totalGoal) * 100) : 0;
        
        return {
            percentage: Math.min(percentage, 100),
            totalCompleted,
            totalGoal,
            averagePerHabit: this.habits.length > 0 ? Math.round(totalCompleted / this.habits.length) : 0
        };
    }

    getTopHabits(year, month, limit = 5) {
        return this.habits
            .map(habit => ({
                ...habit,
                progress: this.getHabitProgress(habit, year, month)
            }))
            .sort((a, b) => b.progress.percentage - a.progress.percentage)
            .slice(0, limit);
    }

    getHabitStreaks() {
        return this.habits.map(habit => ({
            ...habit,
            streak: DateUtils.getCurrentStreak(habit.records),
            lastCompleted: habit.records.length > 0 
                ? new Date(Math.max(...habit.records.map(r => new Date(r.date))))
                : null
        })).sort((a, b) => b.streak - a.streak);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveHabits() {
        try {
            const data = {
                habits: this.habits,
                version: '1.0.0',
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save habits:', error);
            return false;
        }
    }

    loadHabits() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HABITS);
            if (data) {
                const parsed = JSON.parse(data);
                this.habits = parsed.habits || [];
                return true;
            }
        } catch (error) {
            console.error('Failed to load habits:', error);
        }
        this.habits = [];
        return false;
    }

    clearHabits() {
        this.habits = [];
        localStorage.removeItem(STORAGE_KEYS.HABITS);
    }

    exportData(format = 'json') {
        const data = {
            habits: this.habits,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data);
        }

        return data;
    }

    convertToCSV(data) {
        const headers = ['Habit', 'Emoji', 'Goal', 'Completed Days', 'Percentage', 'Created At'];
        const rows = data.habits.map(habit => {
            const progress = this.getHabitProgress(habit, new Date().getFullYear(), new Date().getMonth());
            return [
                `"${habit.name}"`,
                habit.emoji,
                habit.goal,
                progress.completed,
                `${progress.percentage}%`,
                new Date(habit.createdAt).toLocaleDateString()
            ];
        });

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    importData(data) {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (parsed.habits && Array.isArray(parsed.habits)) {
                this.habits = parsed.habits;
                this.saveHabits();
                return true;
            }
        } catch (error) {
            console.error('Failed to import data:', error);
        }
        return false;
    }
}
