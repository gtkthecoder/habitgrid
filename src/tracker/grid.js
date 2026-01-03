import { habits } from './habits.js';
import { DAYS_IN_MONTH } from '../utils/constants.js';

export function renderGrid(updatePercent) {
  const header = document.getElementById('grid-header');
  const body = document.getElementById('grid-body');

  // header
  header.innerHTML = '<th>Habit</th>';
  for (let i = 1; i <= DAYS_IN_MONTH; i++) {
    const th = document.createElement('th');
    th.textContent = i;
    header.appendChild(th);
  }

  // body
  body.innerHTML = '';
  habits.forEach(habit => {
    const tr = document.createElement('tr');
    tr.dataset.habitId = habit.id;

    const tdName = document.createElement('td');
    tdName.textContent = `${habit.emoji} ${habit.name}`;
    tr.appendChild(tdName);

    for (let i = 0; i < DAYS_IN_MONTH; i++) {
      const td = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = habit.records ? habit.records[i] || false : false;
      checkbox.addEventListener('change', () => {
        habit.records[i] = checkbox.checked;
        updatePercent(habit.id, tr);
        localStorage.setItem('habitgrid', JSON.stringify(habits));
      });
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    updatePercent(habit.id, tr);
    body.appendChild(tr);
  });
}
