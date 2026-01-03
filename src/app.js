import { habits, addHabit, loadHabits } from './tracker/habits.js';
import { DAYS_IN_MONTH } from './utils/constants.js';

// grab DOM
const habitsList = document.getElementById('habits-list');
const addButton = document.getElementById('add-habit');
const gridHeader = document.getElementById('grid-header');
const gridBody = document.getElementById('grid-body');

// load habits
loadHabits();
renderAll();

// add habit event
addButton.addEventListener('click', () => {
  const name = prompt("Habit Name:");
  if(!name) return;
  const emoji = prompt("Emoji (optional):") || "✅";
  const goal = prompt("Monthly Goal (days):") || "30";
  addHabit(name, emoji, goal);
  renderAll();
});

// update percentages
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

// render habits column and grid
function renderAll() {
  // habits list
  habitsList.innerHTML = '';
  habits.forEach(habit => {
    const li = document.createElement('li');
    li.dataset.habitId = habit.id;
    li.innerHTML = `<span class="emoji">${habit.emoji}</span> <span class="name">${habit.name}</span> <span class="goal">Goal: ${habit.goal}</span> <span class="percent">0%</span>`;
    habitsList.appendChild(li);
  });

  // grid header
  gridHeader.innerHTML = '<th>Habit</th>';
  for(let i=1;i<=DAYS_IN_MONTH;i++){
    const th = document.createElement('th');
    th.textContent = i;
    gridHeader.appendChild(th);
  }

  // grid body
  gridBody.innerHTML = '';
  habits.forEach(habit => {
    const tr = document.createElement('tr');
    tr.dataset.habitId = habit.id;
    const tdName = document.createElement('td');
    tdName.textContent = `${habit.emoji} ${habit.name}`;
    tr.appendChild(tdName);

    for(let i=1;i<=DAYS_IN_MONTH;i++){
      const td = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = habit.records[i-1] || false;
      checkbox.addEventListener('change', () => {
        habit.records[i-1] = checkbox.checked;
        updatePercent(habit.id, tr);
      });
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    updatePercent(habit.id, tr);
    gridBody.appendChild(tr);
  });
}
