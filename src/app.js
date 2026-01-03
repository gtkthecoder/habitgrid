// Basic habit list + grid rendering
const habits = [
  { id: 'wake_6am', name: 'Wake up at 6AM', emoji: '⏰', goal: 30 },
  { id: 'no_snooze', name: 'No Snoozing', emoji: '🚫', goal: 25 },
  { id: 'drink_water', name: 'Drink 3L Water', emoji: '💧', goal: 30 },
];

const DAYS_IN_MONTH = 31;

function renderHabits() {
  const list = document.getElementById('habits-list');
  list.innerHTML = '';
  habits.forEach(habit => {
    const li = document.createElement('li');
    li.dataset.habitId = habit.id;
    li.innerHTML = `
      <span class="emoji">${habit.emoji}</span>
      <span class="name">${habit.name}</span>
      <span class="goal">Goal: ${habit.goal}</span>
      <span class="percent">0%</span>
    `;
    list.appendChild(li);
  });
}

function renderGrid() {
  const header = document.getElementById('grid-header');
  const body = document.getElementById('grid-body');

  // Header: Dates
  header.innerHTML = '<th>Habit</th>';
  for(let d=1; d<=DAYS_IN_MONTH; d++){
    const th = document.createElement('th');
    th.textContent = d;
    header.appendChild(th);
  }

  // Rows
  body.innerHTML = '';
  habits.forEach(habit => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${habit.emoji} ${habit.name}</td>`;
    for(let d=1; d<=DAYS_IN_MONTH; d++){
      const td = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.addEventListener('change', () => updatePercent(habit.id, tr));
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    body.appendChild(tr);
  });
}

function updatePercent(habitId, row) {
  const checkboxes = row.querySelectorAll('input[type="checkbox"]');
  const checked = Array.from(checkboxes).filter(c => c.checked).length;
  const habit = habits.find(h => h.id === habitId);
  const percentSpan = row.querySelector('.percent');
  if(percentSpan){
    percentSpan.textContent = `${Math.round((checked/habit.goal)*100)}%`;
  }
}

renderHabits();
renderGrid();
