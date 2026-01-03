// start with empty habits
export let habits = [];

// helper to add a habit
export function addHabit(name, emoji, goal) {
  const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
  const newHabit = { id, name, emoji, goal: parseInt(goal), records: [] };
  habits.push(newHabit);
  saveHabits();
  return newHabit;
}

// save to localStorage
export function saveHabits() {
  localStorage.setItem('habitgrid', JSON.stringify(habits));
}

// load from localStorage
export function loadHabits() {
  const saved = JSON.parse(localStorage.getItem('habitgrid')) || [];
  habits.splice(0, habits.length, ...saved); // update in place
}
