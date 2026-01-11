class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.currentFilter = 'all';
    this.editingId = null;
    this.originalText = '';  // New: Store original for cancel
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.getElementById('addBtn').addEventListener('click', () => this.addTask());
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
      if(e.key === 'Enter') this.addTask();
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
    });
    document.getElementById('clearCompleted').addEventListener('click', () => this.clearCompleted());
    document.getElementById('taskInput').addEventListener('input', () => this.toggleAddButton());
  }

  addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if(!text) return;
    const task = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.tasks.unshift(task);
    input.value = '';
    this.saveTasks();
    this.render();
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if(task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
    }
  }

  editTask(id, newText) {
    const task = this.tasks.find(t => t.id === id);
    if(task && newText.trim()) {
      task.text = newText.trim();
      this.finishEdit();  // Clear state after save
      this.saveTasks();
      this.render();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
    this.render();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    this.render();
  }

  clearCompleted() {
    this.tasks = this.tasks.filter(task => !task.completed);
    this.saveTasks();
    this.render();
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  getFilteredTasks() {
    switch(this.currentFilter) {
      case 'active': return this.tasks.filter(task => !task.completed);
      case 'completed': return this.tasks.filter(task => task.completed);
      default: return this.tasks;
    }
  }

  toggleAddButton() {
    const input = document.getElementById('taskInput');
    const btn = document.getElementById('addBtn');
    btn.disabled = !input.value.trim();
    btn.style.opacity = input.value.trim() ? '1' : '0.5';
  }

  // New: Start edit mode
  startEdit(id) {
    this.editingId = id;
    const task = this.tasks.find(t => t.id === id);
    this.originalText = task.text;  // Backup for cancel
    this.render();
    // Focus and select text in input
    const input = document.querySelector(`[data-task-id="${id}"] .task-input`);
    if (input) {
      input.focus();
      input.select();
    }
  }

  // New: Finish editing (called by Done)
  finishEdit() {
    this.editingId = null;
    this.originalText = '';
  }

  // New: Cancel editing
  cancelEdit(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task && this.originalText) {
      task.text = this.originalText;  // Restore original
    }
    this.finishEdit();
    this.render();
  }

  handleDoneClick(id, btnEl) {
  // Find the closest task item and its input
  const taskItem = btnEl.closest('.task-item');
  const input = taskItem.querySelector('.task-input');
  if (input) {
    this.editTask(id, input.value);
  }
}


  render() {
    const taskList = document.getElementById('taskList');
    const filteredTasks = this.getFilteredTasks();
    if (filteredTasks.length === 0) {
      taskList.innerHTML = '<div class="empty-state">No tasks yet! Add one above. ??</div>';
    } else {
      taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${this.editingId === task.id ? 'editing' : ''}" data-id="${task.id}">
          <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''} onchange="app.toggleTask(${task.id})">
          ${this.editingId === task.id ? 
            `<input type="text" class="task-input" data-task-id="${task.id}" value="${task.text}" onkeypress="if(event.key==='Enter') app.editTask(${task.id}, this.value)">` :
            `<span class="task-text" ondblclick="app.startEdit(${task.id})">${task.text}</span>`
          }
          <div class="task-actions">
            ${this.editingId === task.id ? 
              `
                
              <button class="btn btn-save" onclick="app.handleDoneClick(${task.id}, this)">Done</button>
              <button class="btn btn-cancel" onclick="app.cancelEdit(${task.id})">Cancel</button>
              ` :
              `
                <button class="btn btn-edit" onclick="app.startEdit(${task.id})">Edit</button>
                <button class="btn btn-danger" onclick="app.deleteTask(${task.id})">Delete</button>
              `
            }
          </div>
        </div>
      `).join('');
    }
    this.updateStats();
    this.toggleAddButton();
  }

  updateStats() {
    const total = this.tasks.length;
    const active = this.tasks.filter(t => !t.completed).length;
    const completed = total - active;

    document.getElementById('totalTasks').textContent = `Tasks: ${total}`;
    document.getElementById('activeTasks').textContent = `Active: ${active}`;
    document.getElementById('completedTasks').textContent = `Completed: ${completed}`;
  }
}
const app = new TodoApp();
