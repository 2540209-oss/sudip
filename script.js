// Initialize tasks from localStorage
let tasks = JSON.parse(localStorage.getItem('smartPlannerTasks')) || [];

// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskCards = document.getElementById('taskCards');
const calendarEl = document.getElementById('calendar');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    showSection('dashboard');
    renderTasks();
});

// Task Form Submission
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const description = document.getElementById('taskDescription').value.trim();
    
    if (!title || !date || !time) return alert('Please fill all required fields');
    
    const task = {
        id: Date.now(),
        title,
        date,
        time,
        description,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    tasks.push(task);
    saveTasks();
    renderTasks();
    clearForm();
});

// Clear Form
function clearForm() {
    taskForm.reset();
}

// Save Tasks to localStorage
function saveTasks() {
    localStorage.setItem('smartPlannerTasks', JSON.stringify(tasks));
}

// Render Tasks
function renderTasks(filter = 'all') {
    taskCards.innerHTML = '';
    
    const filteredTasks = filterTasks(filter);
    
    filteredTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card ${task.status}`;
        card.draggable = true;
        card.innerHTML = `
            <h3>${task.title}</h3>
            <p><strong>Date:</strong> ${task.date} <strong>Time:</strong> ${task.time}</p>
            <p>${task.description}</p>
            <div class="task-actions">
                <button class="edit-btn" onclick="editTask(${task.id})"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
                <button class="complete-btn" onclick="toggleComplete(${task.id})">
                    <i class="fas ${task.status === 'completed' ? 'fa-check' : 'fa-check-double'}"></i>
                </button>
            </div>
        `;
        
        // Drag and Drop
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            const newTaskId = task.id;
            swapTasks(taskId, newTaskId);
        });
        
        taskCards.appendChild(card);
    });
    
    // Update calendar
    initCalendar();
}

// Filter Tasks
function filterTasks(filter) {
    switch(filter) {
        case 'completed':
            return tasks.filter(t => t.status === 'completed');
        case 'pending':
            return tasks.filter(t => t.status === 'pending');
        case 'upcoming':
            return tasks.filter(t => {
                const taskDate = new Date(t.date);
                const today = new Date();
                return taskDate > today;
            });
        default:
            return tasks;
    }
}

// Edit Task
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDate').value = task.date;
    document.getElementById('taskTime').value = task.time;
    document.getElementById('taskDescription').value = task.description;
    
    deleteTask(id);
}

// Delete Task
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// Toggle Complete Status
function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    saveTasks();
    renderTasks();
}

// Swap Tasks (for drag-and-drop)
function swapTasks(id1, id2) {
    const task1 = tasks.find(t => t.id === parseInt(id1));
    const task2 = tasks.find(t => t.id === parseInt(id2));
    
    if (task1 && task2) {
        const temp = { ...task1 };
        task1.date = task2.date;
        task2.date = temp.date;
        saveTasks();
        renderTasks();
    }
}

// Calendar View
function initCalendar() {
    const calendar = new Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: tasks.map(task => ({
            title: task.title,
            start: `${task.date}T${task.time}`,
            allDay: false,
            extendedProps: { taskId: task.id },
            description: task.description,
            status: task.status
        })),
        dateClick: function(info) {
            document.getElementById('taskDate').value = info.dateStr;
        },
        eventClick: function(info) {
            const taskId = info.event.extendedProps.taskId;
            editTask(taskId);
        },
        editable: true,
        eventDrop: function(info) {
            const taskId = info.event.extendedProps.taskId;
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
                task.date = info.event.start.toISOString().split('T')[0];
                task.time = info.event.start.toTimeString().split(' ')[0];
                saveTasks();
                renderTasks();
            }
        },
        eventContent: function(arg) {
            const task = tasks.find(t => t.id === arg.event.extendedProps.taskId);
            if (!task) return '';
            
            const container = document.createElement('div');
            container.className = 'calendar-event';
            container.innerHTML = `
                <div class="event-title">${arg.event.title}</div>
                <div class="event-time">${task.time}</div>
                <div class="event-description">${task.description || 'No description'}</div>
                <div class="event-status ${task.status}">${task.status}</div>
            `;
            return { domNodes: [container] };
        }
    });
    calendar.render();
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Section Switching
function showSection(section) {
    document.querySelectorAll('.main-content > section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    if (section === 'dashboard') {
        document.getElementById('dashboardSection').style.display = 'block';
        renderTasks();
    } else if (section === 'calendar') {
        document.getElementById('calendarView').style.display = 'block';
        initCalendar(); // Initialize calendar when switching to calendar view
    } else if (section === 'settings') {
        document.getElementById('settingsSection').style.display = 'block';
        loadSettings();
    }
}