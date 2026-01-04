import { MONTHS, DAYS_OF_WEEK } from './constants.js';

export class DateUtils {
    static getCurrentMonth() {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth(), // 0-indexed
            monthName: MONTHS[now.getMonth()],
            daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        };
    }

    static getMonthInfo(year, month) {
        return {
            year,
            month,
            monthName: MONTHS[month],
            daysInMonth: new Date(year, month + 1, 0).getDate(),
            firstDay: new Date(year, month, 1).getDay(),
            lastDay: new Date(year, month + 1, 0).getDay()
        };
    }

    static getNextMonth(currentYear, currentMonth) {
        if (currentMonth === 11) {
            return { year: currentYear + 1, month: 0 };
        }
        return { year: currentYear, month: currentMonth + 1 };
    }

    static getPrevMonth(currentYear, currentMonth) {
        if (currentMonth === 0) {
            return { year: currentYear - 1, month: 11 };
        }
        return { year: currentYear, month: currentMonth - 1 };
    }

    static getToday() {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate()
        };
    }

    static isToday(year, month, day) {
        const today = this.getToday();
        return year === today.year && 
               month === today.month && 
               day === today.day;
    }

    static isPast(year, month, day) {
        const today = this.getToday();
        if (year < today.year) return true;
        if (year === today.year && month < today.month) return true;
        if (year === today.year && month === today.month && day < today.day) return true;
        return false;
    }

    static isFuture(year, month, day) {
        const today = this.getToday();
        if (year > today.year) return true;
        if (year === today.year && month > today.month) return true;
        if (year === today.year && month === today.month && day > today.day) return true;
        return false;
    }

    static formatDate(date, format = 'short') {
        const d = new Date(date);
        
        if (format === 'short') {
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
        
        if (format === 'long') {
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        if (format === 'month-year') {
            return d.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
        }
        
        return d.toISOString().split('T')[0];
    }

    static getDayOfWeek(year, month, day) {
        const date = new Date(year, month, day);
        return DAYS_OF_WEEK[date.getDay()];
    }

    static isWeekend(year, month, day) {
        const dayOfWeek = new Date(year, month, day).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }

    static getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
        const week1 = new Date(d.getFullYear(), 0, 4);
        return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    }

    static getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    static generateMonthDays(year, month) {
        const daysInMonth = this.getDaysInMonth(year, month);
        const days = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                day,
                dayOfWeek: this.getDayOfWeek(year, month, day),
                isWeekend: this.isWeekend(year, month, day),
                isToday: this.isToday(year, month, day),
                isPast: this.isPast(year, month, day),
                isFuture: this.isFuture(year, month, day),
                date: new Date(year, month, day)
            });
        }
        
        return days;
    }

    static getCurrentStreak(records) {
        if (!records || records.length === 0) return 0;
        
        const sortedRecords = [...records].sort((a, b) => b.date - a.date);
        let streak = 0;
        let currentDate = new Date();
        
        for (const record of sortedRecords) {
            const recordDate = new Date(record.date);
            if (this.isConsecutiveDay(recordDate, currentDate)) {
                streak++;
                currentDate = recordDate;
            } else {
                break;
            }
        }
        
        return streak;
    }

    static isConsecutiveDay(date1, date2) {
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 1;
    }

    static formatRelativeTime(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
        return `${Math.floor(diffDays / 365)}y ago`;
    }
}
