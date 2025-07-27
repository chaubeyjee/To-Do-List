// GSAP Timeline for animations
const tl = gsap.timeline();

// DOM elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const bulkActions = document.getElementById('bulkActions');
const completeAllBtn = document.getElementById('completeAllBtn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

// Application state
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let taskIdCounter = Date.now();

// Initialize the application
function init() {
    renderTasks();
    updateStats();
    updateProgress();
    setupEventListeners();
    
    // Initial animations
    gsap.from('.header', { duration: 1, y: -50, opacity: 0, ease: 'power3.out' });
    gsap.from('.input-section', { duration: 1, y: 30, opacity: 0, ease: 'power3.out', delay: 0.2 });
    gsap.from('.filters', { duration: 1, y: 30, opacity: 0, ease: 'power3.out', delay: 0.4 });
    gsap.from('.tasks-container', { duration: 1, y: 30, opacity: 0, ease: 'power3.out', delay: 0.6 });
}

// Event listeners setup
function setupEventListeners() {
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
    
    completeAllBtn.addEventListener('click', completeAllTasks);
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // Input animations
    taskInput.addEventListener('focus', () => {
        gsap.to(taskInput, { duration: 0.3, scale: 1.02, ease: 'power2.out' });
    });
    
    taskInput.addEventListener('blur', () => {
        gsap.to(taskInput, { duration: 0.3, scale: 1, ease: 'power2.out' });
    });
    
    // Button hover animations
    addBtn.addEventListener('mouseenter', () => {
        gsap.to(addBtn, { duration: 0.3, y: -2, scale: 1.05, ease: 'power2.out' });
    });
    
    addBtn.addEventListener('mouseleave', () => {
        gsap.to(addBtn, { duration: 0.3, y: 0, scale: 1, ease: 'power2.out' });
    });
}

// Add new task
function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        // Shake animation for empty input
        gsap.to(taskInput, { duration: 0.1, x: -5, yoyo: true, repeat: 5, ease: 'power2.inOut' });
        return;
    }
    
    const task = {
        id: taskIdCounter++,
        text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    saveTasks();
    
    // Clear input with animation
    gsap.to(taskInput, { duration: 0.3, scale: 0.95, ease: 'power2.out' })
        .then(() => {
            taskInput.value = '';
            gsap.to(taskInput, { duration: 0.3, scale: 1, ease: 'power2.out' });
        });
    
    // Add button success animation
    gsap.to(addBtn, { 
        duration: 0.2, 
        scale: 0.9, 
        ease: 'power2.out',
        onComplete: () => {
            gsap.to(addBtn, { duration: 0.3, scale: 1, ease: 'bounce.out' });
        }
    });
    
    renderTasks();
    updateStats();
    updateProgress();
}

// Delete task
function deleteTask(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    
    // Animate removal
    gsap.to(taskElement, {
        duration: 0.5,
        x: 300,
        opacity: 0,
        scale: 0.8,
        ease: 'power2.in',
        onComplete: () => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
            updateProgress();
        }
    });
}

// Toggle task completion
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    const checkbox = taskElement.querySelector('.task-checkbox');
    const text = taskElement.querySelector('.task-text');
    
    task.completed = !task.completed;
    
    if (task.completed) {
        // Completion animation
        gsap.timeline()
            .to(checkbox, { duration: 0.2, scale: 1.3, ease: 'power2.out' })
            .to(checkbox, { duration: 0.3, scale: 1, ease: 'bounce.out' }, '-=0.1')
            .to(text, { duration: 0.5, opacity: 0.7, ease: 'power2.out' }, '-=0.3')
            .set(taskElement, { className: taskElement.className + ' completed' })
            .fromTo(taskElement, 
                { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                { duration: 0.5, backgroundColor: 'rgba(67, 233, 123, 0.2)', ease: 'power2.out' }
            );
    } else {
        // Uncomplete animation
        gsap.timeline()
            .to(checkbox, { duration: 0.2, scale: 1.1, ease: 'power2.out' })
            .to(checkbox, { duration: 0.3, scale: 1, ease: 'bounce.out' }, '-=0.1')
            .to(text, { duration: 0.3, opacity: 1, ease: 'power2.out' }, '-=0.3')
            .set(taskElement, { className: taskElement.className.replace(' completed', '') })
            .to(taskElement, { duration: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.1)', ease: 'power2.out' });
    }
    
    saveTasks();
    updateStats();
    updateProgress();
}

// Edit task
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    const textElement = taskElement.querySelector('.task-text');
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;
    input.maxLength = 100;
    
    // Replace text with input
    textElement.style.display = 'none';
    taskElement.insertBefore(input, textElement.nextSibling);
    
    // Focus and select all text
    input.focus();
    input.select();
    
    // Animation
    gsap.fromTo(input, 
        { opacity: 0, scale: 0.9 },
        { duration: 0.3, opacity: 1, scale: 1, ease: 'power2.out' }
    );
    
    // Save on enter or blur
    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== task.text) {
            task.text = newText;
            saveTasks();
        }
        
        // Animate back to text
        gsap.to(input, {
            duration: 0.3,
            opacity: 0,
            scale: 0.9,
            ease: 'power2.in',
            onComplete: () => {
                input.remove();
                textElement.textContent = task.text;
                textElement.style.display = 'block';
                gsap.fromTo(textElement,
                    { opacity: 0, scale: 0.9 },
                    { duration: 0.3, opacity: 1, scale: 1, ease: 'power2.out' }
                );
            }
        });
    };
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEdit();
    });
    
    input.addEventListener('blur', saveEdit);
}

// Set filter
function setFilter(filter) {
    currentFilter = filter;
    
    // Update active filter button
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
            
            // Animation for active button
            gsap.timeline()
                .to(btn, { duration: 0.2, scale: 0.95, ease: 'power2.out' })
                .to(btn, { duration: 0.3, scale: 1, ease: 'bounce.out' });
        }
    });
    
    renderTasks();
}

// Complete all tasks
function completeAllTasks() {
    const incompleteTasks = tasks.filter(task => !task.completed);
    if (incompleteTasks.length === 0) return;
    
    // Animate button
    gsap.to(completeAllBtn, { duration: 0.2, scale: 0.95, ease: 'power2.out' })
        .then(() => {
            gsap.to(completeAllBtn, { duration: 0.3, scale: 1, ease: 'bounce.out' });
        });
    
    // Complete all tasks
    tasks.forEach(task => task.completed = true);
    saveTasks();
    renderTasks();
    updateStats();
    updateProgress();
}

// Clear completed tasks
function clearCompletedTasks() {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) return;
    
    // Animate button
    gsap.to(clearCompletedBtn, { duration: 0.2, scale: 0.95, ease: 'power2.out' })
        .then(() => {
            gsap.to(clearCompletedBtn, { duration: 0.3, scale: 1, ease: 'bounce.out' });
        });
    
    // Animate completed tasks removal
    const completedElements = document.querySelectorAll('.task-item.completed');
    
    gsap.to(completedElements, {
        duration: 0.5,
        x: 300,
        opacity: 0,
        scale: 0.8,
        stagger: 0.1,
        ease: 'power2.in',
        onComplete: () => {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            updateStats();
            updateProgress();
        }
    });
}

// Render tasks
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
        bulkActions.style.display = 'none';
        
        // Animate empty state
        gsap.fromTo(emptyState,
            { opacity: 0, y: 20 },
            { duration: 0.5, opacity: 1, y: 0, ease: 'power2.out' }
        );
    } else {
        emptyState.style.display = 'none';
        bulkActions.style.display = 'flex';
        
        filteredTasks.forEach((task, index) => {
            const taskElement = createTaskElement(task);
            tasksList.appendChild(taskElement);
            
            // Staggered animation for tasks
            gsap.fromTo(taskElement,
                { opacity: 0, x: 50, scale: 0.9 },
                { 
                    duration: 0.5, 
                    opacity: 1, 
                    x: 0, 
                    scale: 1, 
                    ease: 'power2.out',
                    delay: index * 0.1
                }
            );
        });
    }
}

// Create task element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskDiv.setAttribute('data-task-id', task.id);
    
    taskDiv.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">
            ${task.completed ? '<i class="fas fa-check"></i>' : ''}
        </div>
        <span class="task-text" ondblclick="editTask(${task.id})">${task.text}</span>
        <div class="task-actions">
            <button class="task-action-btn edit-btn" onclick="editTask(${task.id})" title="Edit task">
                <i class="fas fa-edit"></i>
            </button>
            <button class="task-action-btn delete-btn" onclick="deleteTask(${task.id})" title="Delete task">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add hover animations
    taskDiv.addEventListener('mouseenter', () => {
        gsap.to(taskDiv, { duration: 0.3, y: -2, ease: 'power2.out' });
        gsap.to(taskDiv.querySelector('.task-actions'), { duration: 0.3, opacity: 1, ease: 'power2.out' });
    });
    
    taskDiv.addEventListener('mouseleave', () => {
        gsap.to(taskDiv, { duration: 0.3, y: 0, ease: 'power2.out' });
        if (window.innerWidth > 768) {
            gsap.to(taskDiv.querySelector('.task-actions'), { duration: 0.3, opacity: 0, ease: 'power2.out' });
        }
    });
    
    return taskDiv;
}

// Get filtered tasks
function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    // Animate number changes
    animateCounter(totalTasksEl, total);
    animateCounter(completedTasksEl, completed);
    animateCounter(pendingTasksEl, pending);
    
    // Update bulk actions visibility
    if (total > 0) {
        completeAllBtn.style.display = pending > 0 ? 'flex' : 'none';
        clearCompletedBtn.style.display = completed > 0 ? 'flex' : 'none';
    }
}

// Animate counter
function animateCounter(element, target) {
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;
    
    gsap.to({ value: current }, {
        duration: 0.5,
        value: target,
        ease: 'power2.out',
        onUpdate: function() {
            element.textContent = Math.round(this.targets()[0].value);
        }
    });
}

// Update progress bar
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    gsap.to(progressFill, {
        duration: 0.8,
        width: `${percentage}%`,
        ease: 'power2.out'
    });
    
    gsap.to({ value: parseInt(progressText.textContent) || 0 }, {
        duration: 0.8,
        value: percentage,
        ease: 'power2.out',
        onUpdate: function() {
            progressText.textContent = `${Math.round(this.targets()[0].value)}% Complete`;
        }
    });
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Global functions for onclick handlers
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.editTask = editTask;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add some interactive background effects
function createFloatingParticles() {
    const particles = [];
    const numParticles = 20;
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            z-index: -1;
        `;
        document.body.appendChild(particle);
        particles.push(particle);
        
        // Random initial position
        gsap.set(particle, {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: Math.random() * 0.5 + 0.5
        });
        
        // Floating animation
        gsap.to(particle, {
            duration: Math.random() * 10 + 10,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            repeat: -1,
            yoyo: true,
            ease: 'none'
        });
        
        // Opacity animation
        gsap.to(particle, {
            duration: Math.random() * 3 + 2,
            opacity: Math.random() * 0.5 + 0.2,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut'
        });
    }
}

// Create floating particles after initialization
setTimeout(createFloatingParticles, 1000);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addTask();
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
        taskInput.value = '';
        taskInput.blur();
    }
});

// Add some fun interactions
let konami = [];
const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', (e) => {
    konami.push(e.code);
    if (konami.length > konamiCode.length) {
        konami.shift();
    }
    
    if (konami.join(',') === konamiCode.join(',')) {
        // Easter egg: Rainbow animation
        const elements = document.querySelectorAll('.task-item, .filter-btn, .add-btn');
        gsap.to(elements, {
            duration: 2,
            backgroundColor: 'hsl(+=360, 70%, 50%)',
            repeat: 3,
            yoyo: true,
            stagger: 0.1,
            ease: 'power2.inOut'
        });
        konami = [];
    }
});