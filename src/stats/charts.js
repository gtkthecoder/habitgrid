// placeholder for stats charts
export function renderStats() {
  const topList = document.getElementById('top-habits');
  if (!topList) return;

  topList.innerHTML = '<li>Charts placeholder: will show top habits and completion</li>';
}

renderStats();
