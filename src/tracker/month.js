import { DateUtils } from './utils/dates.js';

export class MonthManager {
    constructor(year, month) {
        this.year = year;
        this.month = month;
        this.days = [];
        this.updateDays();
    }

    updateDays() {
        this.days = DateUtils.generateMonthDays(this.year, this.month);
    }

    next() {
        const next = DateUtils.getNextMonth(this.year, this.month);
        this.year = next.year;
        this.month = next.month;
        this.updateDays();
        return this.getInfo();
    }

    previous() {
        const prev = DateUtils.getPrevMonth(this.year, this.month);
        this.year = prev.year;
        this.month = prev.month;
        this.updateDays();
        return this.getInfo();
    }

    setMonth(year, month) {
        this.year = year;
        this.month = month;
        this.updateDays();
        return this.getInfo();
    }

    getInfo() {
        return {
            year: this.year,
            month: this.month,
            monthName: DateUtils.formatDate(new Date(this.year, this.month, 1), 'month-year'),
            days: this.days,
            daysInMonth: this.days.length,
            today: DateUtils.getToday()
        };
    }

    getDayStatus(year, month, day) {
        const date = new Date(year, month, day);
        const today = new Date();
        
        if (date > today) return 'future';
        if (date < today) return 'past';
        return 'today';
    }

    isCurrentMonth() {
        const today = DateUtils.getToday();
        return this.year === today.year && this.month === today.month;
    }

    getWeekRanges() {
        const weeks = [];
        let currentWeek = [];
        
        for (const day of this.days) {
            if (day.dayOfWeek === 'Sun' && currentWeek.length > 0) {
                weeks.push([...currentWeek]);
                currentWeek = [];
            }
            currentWeek.push(day);
        }
        
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }
        
        return weeks;
    }

    getWeekCompletion(habits) {
        const weeks = this.getWeekRanges();
        return weeks.map((week, weekIndex) => {
            let totalPossible = 0;
            let totalCompleted = 0;
            
            week.forEach(day => {
                habits.forEach(habit => {
                    totalPossible++;
                    const record = habit.records.find(r => 
                        new Date(r.date).getDate() === day.day &&
                        new Date(r.date).getMonth() === this.month &&
                        new Date(r.date).getFullYear() === this.year
                    );
                    if (record && record.completed) {
                        totalCompleted++;
                    }
                });
            });
            
            return {
                week: weekIndex + 1,
                startDate: week[0].date,
                endDate: week[week.length - 1].date,
                completion: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
                totalCompleted,
                totalPossible
            };
        });
    }
}
