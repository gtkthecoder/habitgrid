import { habits, addHabit, loadHabits } from './tracker/habits.js';
import { DAYS_IN_MONTH } from './utils/constants.js';
import { renderGrid } from './tracker/grid.js';

// DOM elements
const habitsList = document.getElementById('habits-list');
const addButton = document.getElementById('add-habit');

// load saved habits
loadHabits();
renderAll();

// add habit button
addButton.addEventListener('click', () => {
  const name = prompt("Enter habit name:");
  if(!name) return;
  const emoji = prompt("Enter emoji (optional):") || "✅";
  const goal = prompt("Enter monthly goal (days):") || "30";
  addHabit(name, emoji, goal);
  renderAll();
});

// update percent for a habit row
function updatePercent(habitId, row) {
  const checkboxes = row.querySelectorAll('input[type="checkbox"]');
  const checked = Array.from(checkboxes).filter(c => c.checked).length;
  const habit = habits.find(h => h.id === habitId);
  let percentTd = row.querySelector('.percent');
  if(!percentTd){
    percentTd = document.createElement('td');
    percentTd.className = 'percent';
    row.appendChild(percentTd);
  }
  percentTd.textContent = `${Math.min(Math.round((checked / habit.goal) * 100),100)}%`;
  localStorage.setItem('habitgrid', JSON.stringify(habits));
}

// render habits column + grid
function renderAll() {
  // list
  habitsList.innerHTML = '';
  habits.forEach(habit => {
    const li = document.createElement('li');
    li.dataset.habitId = habit.id;
    li.innerHTML = `<span class="emoji">${habit.emoji}</span> <span class="name">${habit.name}</span> <span class="goal">Goal: ${habit.goal}</span> <span class="percent">0%</span>`;
    habitsList.appendChild(li);
  });

  // grid
  renderGrid(updatePercent);
}
