import { HabitManager } from '../tracker/habits.js';
import { Calculations } from '../tracker/calculations.js';
import { DateUtils } from '../utils/dates.js';

export class StatsCharts {
    constructor() {
        this.habitManager = new HabitManager();
        this.charts = {};
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth();
        this.initialize();
    }

    async initialize() {
        await this.renderAllCharts();
        this.setupEventListeners();
    }

    async renderAllCharts() {
        this.renderOverallChart();
        this.renderWeeklyChart();
        this.renderHabitsChart();
        this.renderTopHabits();
        this.renderStreaks();
        this.renderCalendar();
        this.updateStats();
    }

    renderOverallChart() {
        const ctx = document.getElementById('overall-chart');
        if (!ctx) return;

        const overall = Calculations.calculateOverallProgress(
            this.habitManager.habits,
            this.currentYear,
            this.currentMonth
        );

        // Update percentage display
        const percentageElement = document.getElementById('overall-percentage');
        if (percentageElement) {
            percentageElement.textContent = `${overall.percentage}%`;
        }

        if (this.charts.overall) {
            this.charts.overall.destroy();
        }

        this.charts.overall = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [overall.percentage, 100 - overall.percentage],
                    backgroundColor: [
                        '#34A853',
                        '#F1F3F4'
                    ],
                    borderWidth: 0,
                    borderRadius: 10,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed}% complete`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    renderWeeklyChart() {
        const ctx = document.getElementById('weekly-chart');
        if (!ctx) return;

        const weeklyData = Calculations.calculateWeeklyTrends(
            this.habitManager.habits,
            this.currentYear,
            this.currentMonth
        );

        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyData.map(w => `Week ${w.week}`),
                datasets: [{
                    label: 'Completion %',
                    data: weeklyData.map(w => w.completion),
                    backgroundColor: weeklyData.map((w, i) => 
                        `hsl(${120 + (i * 20)}, 70%, 60%)`
                    ),
                    borderColor: weeklyData.map((w, i) => 
                        `hsl(${120 + (i * 20)}, 70%, 40%)`
                    ),
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => `${value}%`
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const week = weeklyData[context.dataIndex];
                                return `${context.parsed.y}% (${week.completed}/${week.total})`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderHabitsChart() {
        const ctx = document.getElementById('habits-chart');
        if (!ctx) return;

        const habits = this.habitManager.habits.slice(0, 10); // Limit to 10 for readability
        const habitData = habits.map(habit => {
            const progress = Calculations.calculateCompletion(
                habit,
                this.currentYear,
                this.currentMonth
            );
            return {
                name: habit.name,
                progress: progress.percentage,
                completed: progress.completed,
                goal: habit.goal,
                color: habit.color
            };
        });

        if (this.charts.habits) {
            this.charts.habits.destroy();
        }

        this.charts.habits = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: habitData.map(h => h.name),
                datasets: [{
                    label: 'Completion %',
                    data: habitData.map(h => h.progress),
                    backgroundColor: habitData.map(h => h.color + '80'),
                    borderColor: habitData.map(h => h.color),
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => `${value}%`
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const habit = habitData[context.dataIndex];
                                return `${context.parsed.x}% (${habit.completed}/${habit.goal} days)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderTopHabits() {
        const container = document.getElementById('top-habits');
        if (!container) return;

        const topHabits = this.habitManager.getTopHabits(
            this.currentYear,
            this.currentMonth,
            5
        );

        container.innerHTML = topHabits.map((habit, index) => `
            <div class="habit-stat-item">
                <div class="habit-stat-name">
                    <span class="habit-rank">${index + 1}</span>
                    <span class="habit-emoji">${habit.emoji}</span>
                    <span class="habit-name">${habit.name}</span>
                </div>
                <div class="habit-stat-percentage">${habit.progress.percentage}%</div>
            </div>
        `).join('');
    }

    renderStreaks() {
        const container = document.getElementById('streaks-list');
        if (!container) return;

        const streaks = this.habitManager.getHabitStreaks()
            .filter(h => h.streak > 0)
            .slice(0, 5);

        container.innerHTML = streaks.map(habit => `
            <div class="streak-item">
                <div class="streak-fire">
                    <i class="fas fa-fire"></i>
                </div>
                <div class="streak-info">
                    <div class="streak-habit">${habit.name}</div>
                    <div class="streak-days">Current streak</div>
                </div>
                <div class="streak-count">${habit.streak}</div>
            </div>
        `).join('');
    }

    renderCalendar() {
        const container = document.getElementById('calendar-grid');
        if (!container) return;

        const daysInMonth = DateUtils.getDaysInMonth(this.currentYear, this.currentMonth);
        const today = new Date();
        const isCurrentMonth = this.currentYear === today.getFullYear() && 
                              this.currentMonth === today.getMonth();

        // Calculate completion for each day
        const dayStats = [];
        for (let day = 1; day <= daysInMonth; day++) {
            let completed = 0;
            let total = this.habitManager.habits.length;
            
            this.habitManager.habits.forEach(habit => {
                const record = habit.records.find(r => {
                    const recordDate = new Date(r.date);
                    return recordDate.getDate() === day &&
                           recordDate.getMonth() === this.currentMonth &&
                           recordDate.getFullYear() === this.currentYear;
                });
                
                if (record && record.completed) {
                    completed++;
                }
            });

            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            let className = 'calendar-day empty';
            
            if (percentage === 100) {
                className = 'calendar-day completed';
            } else if (percentage >= 50) {
                className = 'calendar-day partial';
            } else if (percentage > 0) {
                className = 'calendar-day missed';
            }

            if (isCurrentMonth && day === today.getDate()) {
                className += ' today';
            }

            dayStats.push({
                day,
                percentage,
                className,
                completed,
                total
            });
        }

        container.innerHTML = dayStats.map(stat => `
            <div class="${stat.className}" 
                 data-tooltip="${stat.day}: ${stat.percentage}% (${stat.completed}/${stat.total})">
                ${stat.day}
            </div>
        `).join('');
    }

    updateStats() {
        const overall = Calculations.calculateOverallProgress(
            this.habitManager.habits,
            this.currentYear,
            this.currentMonth
        );

        const bestDay = Calculations.calculateBestDay(
            this.habitManager.habits,
            this.currentYear,
            this.currentMonth
        );

        const motivation = Calculations.calculateMotivationScore(
            this.habitManager.habits,
            this.currentYear,
            this.currentMonth
        );

        // Update stat elements
        const totalHabits = document.getElementById('total-habits');
        const bestDayElement = document.getElementById('best-day');
        const consistency = document.getElementById('consistency');

        if (totalHabits) {
            totalHabits.textContent = this.habitManager.habits.length;
        }

        if (bestDayElement) {
            bestDayElement.textContent = bestDay.day > 0 
                ? `Day ${bestDay.day} (${bestDay.percentage}%)`
                : 'N/A';
        }

        if (consistency) {
            consistency.textContent = `${motivation.breakdown.consistency}%`;
        }

        // Update period display
        const periodElement = document.getElementById('stats-period');
        if (periodElement) {
            periodElement.textContent = DateUtils.formatDate(
                new Date(this.currentYear, this.currentMonth, 1),
                'month-year'
            );
        }
    }

    setupEventListeners() {
        // Time range selector
        const timeRange = document.getElementById('time-range');
        if (timeRange) {
            timeRange.addEventListener('change', (e) => {
                this.handleTimeRangeChange(e.target.value);
            });
        }

        // Month navigation for calendar
        document.addEventListener('stats:month-changed', (e) => {
            this.currentYear = e.detail.year;
            this.currentMonth = e.detail.month;
            this.renderAllCharts();
        });
    }

    handleTimeRangeChange(range) {
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth();

        switch (range) {
            case 'week':
                // Show last 7 days
                break;
            case 'month':
                // Current month (default)
                break;
            case 'year':
                // Show yearly overview
                break;
        }

        this.currentYear = year;
        this.currentMonth = month;
        this.renderAllCharts();
    }

    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const stats = new StatsCharts();
    
    // Listen for habit changes
    window.addEventListener('habits:updated', () => {
        stats.renderAllCharts();
    });
});
