export function calculateCompletion(habit, checked) {
  return Math.min(Math.round((checked / habit.goal) * 100), 100);
}
