import { DateUtils } from '../utils/dates.js';

export class Calculations {
    static calculateCompletion(habit, year, month) {
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
            streak: this.calculateStreak(monthRecords),
            consistency: this.calculateConsistency(monthRecords, year, month)
        };
    }

    static calculateStreak(records) {
        if (!records || records.length === 0) return 0;
        
        const sortedRecords = [...records]
            .filter(r => r.completed)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedRecords.length === 0) return 0;
        
        let streak = 1;
        let lastDate = new Date(sortedRecords[0].date);
        
        for (let i = 1; i < sortedRecords.length; i++) {
            const currentDate = new Date(sortedRecords[i].date);
            const diffDays = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                streak++;
                lastDate = currentDate;
            } else {
                break;
            }
        }
        
        return streak;
    }

    static calculateConsistency(records, year, month) {
        const daysInMonth = DateUtils.getDaysInMonth(year, month);
        const completedDays = records.filter(r => r.completed).length;
        
        return Math.round((completedDays / daysInMonth) * 100);
    }

    static calculateOverallProgress(habits, year, month) {
        if (habits.length === 0) {
            return { percentage: 0, totalCompleted: 0, totalGoal: 0 };
        }

        let totalCompleted = 0;
        let totalGoal = 0;
        let weightedSum = 0;

        habits.forEach(habit => {
            const progress = this.calculateCompletion(habit, year, month);
            totalCompleted += progress.completed;
            totalGoal += habit.goal;
            weightedSum += progress.percentage;
        });

        const percentage = totalGoal > 0 ? Math.round((totalCompleted / totalGoal) * 100) : 0;
        const averagePercentage = habits.length > 0 ? Math.round(weightedSum / habits.length) : 0;
        
        return {
            percentage: Math.min(percentage, 100),
            averagePercentage,
            totalCompleted,
            totalGoal,
            habitsCompleted: habits.filter(habit => {
                const progress = this.calculateCompletion(habit, year, month);
                return progress.percentage >= 100;
            }).length,
            totalHabits: habits.length
        };
    }

    static calculateWeeklyTrends(habits, year, month) {
        const weeks = [];
        const daysInMonth = DateUtils.getDaysInMonth(year, month);
        
        for (let week = 0; week < 5; week++) {
            let weekCompleted = 0;
            let weekTotal = 0;
            
            for (let day = week * 7 + 1; day <= Math.min((week + 1) * 7, daysInMonth); day++) {
                habits.forEach(habit => {
                    const record = habit.records.find(r => {
                        const recordDate = new Date(r.date);
                        return recordDate.getDate() === day &&
                               recordDate.getMonth() === month &&
                               recordDate.getFullYear() === year;
                    });
                    
                    weekTotal++;
                    if (record && record.completed) {
                        weekCompleted++;
                    }
                });
            }
            
            weeks.push({
                week: week + 1,
                completion: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0,
                completed: weekCompleted,
                total: weekTotal
            });
        }
        
        return weeks;
    }

    static calculateBestDay(habits, year, month) {
        const daysInMonth = DateUtils.getDaysInMonth(year, month);
        const dayStats = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            let dayCompleted = 0;
            
            habits.forEach(habit => {
                const record = habit.records.find(r => {
                    const recordDate = new Date(r.date);
                    return recordDate.getDate() === day &&
                           recordDate.getMonth() === month &&
                           recordDate.getFullYear() === year;
                });
                
                if (record && record.completed) {
                    dayCompleted++;
                }
            });
            
            dayStats.push({
                day,
                completed: dayCompleted,
                percentage: Math.round((dayCompleted / habits.length) * 100)
            });
        }
        
        const bestDay = dayStats.reduce((best, current) => 
            current.completed > best.completed ? current : best, 
            { day: 0, completed: 0, percentage: 0 }
        );
        
        return bestDay;
    }

    static calculateHabitFrequency(habits, year, month) {
        const frequency = {
            daily: 0,
            '3-4 times/week': 0,
            '1-2 times/week': 0,
            'few times/month': 0
        };
        
        habits.forEach(habit => {
            const progress = this.calculateCompletion(habit, year, month);
            const averagePerWeek = progress.completed / 4.3; // Approximate weeks in month
            
            if (averagePerWeek >= 6) frequency.daily++;
            else if (averagePerWeek >= 3.5) frequency['3-4 times/week']++;
            else if (averagePerWeek >= 1.5) frequency['1-2 times/week']++;
            else frequency['few times/month']++;
        });
        
        return frequency;
    }

    static calculateProjectedCompletion(habits, year, month) {
        const today = new Date();
        const currentDay = today.getDate();
        const daysInMonth = DateUtils.getDaysInMonth(year, month);
        const daysRemaining = daysInMonth - currentDay + 1;
        
        let projectedCompleted = 0;
        let projectedGoal = 0;
        
        habits.forEach(habit => {
            const progress = this.calculateCompletion(habit, year, month);
            const dailyAverage = progress.completed / currentDay;
            const projectedMonth = progress.completed + (dailyAverage * daysRemaining);
            
            projectedCompleted += projectedMonth;
            projectedGoal += habit.goal;
        });
        
        const projectedPercentage = projectedGoal > 0 
            ? Math.min(Math.round((projectedCompleted / projectedGoal) * 100), 100)
            : 0;
        
        return {
            projectedPercentage,
            projectedCompleted: Math.round(projectedCompleted),
            projectedGoal,
            daysRemaining,
            onTrack: projectedPercentage >= 100
        };
    }

    static calculateMotivationScore(habits, year, month) {
        const overall = this.calculateOverallProgress(habits, year, month);
        const streaks = habits.map(habit => 
            this.calculateStreak(habit.records.filter(r => {
                const recordDate = new Date(r.date);
                return recordDate.getFullYear() === year && 
                       recordDate.getMonth() === month;
            }))
        );
        
        const avgStreak = streaks.length > 0 
            ? streaks.reduce((a, b) => a + b, 0) / streaks.length 
            : 0;
        
        const consistency = habits.map(habit => 
            this.calculateConsistency(
                habit.records.filter(r => {
                    const recordDate = new Date(r.date);
                    return recordDate.getFullYear() === year && 
                           recordDate.getMonth() === month;
                }),
                year,
                month
            )
        );
        
        const avgConsistency = consistency.length > 0 
            ? consistency.reduce((a, b) => a + b, 0) / consistency.length 
            : 0;
        
        // Weighted score: 50% completion, 30% consistency, 20% streaks
        const score = Math.round(
            (overall.percentage * 0.5) + 
            (avgConsistency * 0.3) + 
            (avgStreak * 0.2)
        );
        
        return {
            score: Math.min(score, 100),
            level: score >= 80 ? 'Excellent' :
                   score >= 60 ? 'Good' :
                   score >= 40 ? 'Fair' : 'Needs Improvement',
            breakdown: {
                completion: overall.percentage,
                consistency: Math.round(avgConsistency),
                averageStreak: Math.round(avgStreak)
            }
        };
    }
}
