// Project Manager Dashboard - JavaScript
// Using Vanilla JS with Local Storage

// ==================== Data Management ====================

const STORAGE_KEYS = {
    PROJECTS: 'pm_projects',
    TASKS: 'pm_tasks',
    THEME: 'pm_theme'
};

// Initialize data from Local Storage or use defaults
function getProjects() {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
}

function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

function getTasks() {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

function getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// Generate unique IDs
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== State Management ====================

let projects = getProjects();
let tasks = getTasks();
let currentProjectId = null;
let charts = {};

// ==================== DOM Elements ====================

const elements = {
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    navItems: document.querySelectorAll('.nav-item'),
    
    // Theme
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    
    // Search
    searchInput: document.getElementById('searchInput'),
    tableSearch: document.getElementById('tableSearch'),
    
    // Stats
    totalProjects: document.getElementById('totalProjects'),
    totalTasks: document.getElementById('totalTasks'),
    completedTasks: document.getElementById('completedTasks'),
    pendingTasks: document.getElementById('pendingTasks'),
    
    // Charts
    statusPieChart: document.getElementById('statusPieChart'),
    projectBarChart: document.getElementById('projectBarChart'),
    completionLineChart: document.getElementById('completionLineChart'),
    
    // Quick Actions
    newProjectBtn: document.getElementById('newProjectBtn'),
    newTaskBtn: document.getElementById('newTaskBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    
    // Projects
    projectsList: document.getElementById('projectsList'),
    addProjectBtn: document.getElementById('addProjectBtn'),
    projectModal: document.getElementById('projectModal'),
    projectForm: document.getElementById('projectForm'),
    projectId: document.getElementById('projectId'),
    projectName: document.getElementById('projectName'),
    closeProjectModal: document.getElementById('closeProjectModal'),
    cancelProject: document.getElementById('cancelProject'),
    
    // Tasks
    tasksList: document.getElementById('tasksList'),
    taskFilterStatus: document.getElementById('taskFilterStatus'),
    taskFilterProject: document.getElementById('taskFilterProject'),
    taskModal: document.getElementById('taskModal'),
    taskForm: document.getElementById('taskForm'),
    taskId: document.getElementById('taskId'),
    taskTitle: document.getElementById('taskTitle'),
    taskDescription: document.getElementById('taskDescription'),
    taskProject: document.getElementById('taskProject'),
    taskPriority: document.getElementById('taskPriority'),
    taskStatus: document.getElementById('taskStatus'),
    closeTaskModal: document.getElementById('closeTaskModal'),
    cancelTask: document.getElementById('cancelTask'),
    
    // Table
    tableBody: document.getElementById('tableBody'),
    
    // Analytics
    completionPercentage: document.getElementById('completionPercentage'),
    productivityRate: document.getElementById('productivityRate'),
    tasksToday: document.getElementById('tasksToday'),
    weeklyProgress: document.getElementById('weeklyProgress'),
    
    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteMessage: document.getElementById('deleteMessage'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDelete: document.getElementById('cancelDelete'),
    confirmDelete: document.getElementById('confirmDelete')
};

let deleteCallback = null;

// ==================== Initialization ====================

function init() {
    initTheme();
    initCharts();
    renderAll();
    initEventListeners();
}

// ==================== Theme Management ====================

function initTheme() {
    const theme = getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    saveTheme(newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    elements.themeIcon.className = theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon';
}

// ==================== Charts ====================

function initCharts() {
    // Pie Chart - Tasks by Status
    const statusCtx = elements.statusPieChart.getContext('2d');
    charts.statusPie = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['To Do', 'In Progress', 'Completed'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#64748b', '#3b82f6', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            cutout: '65%'
        }
    });

    // Bar Chart - Tasks per Project
    const projectCtx = elements.projectBarChart.getContext('2d');
    charts.projectBar = new Chart(projectCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Tasks',
                data: [],
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Line Chart - Completion Trend
    const lineCtx = elements.completionLineChart.getContext('2d');
    charts.completionLine = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Completed',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateCharts() {
    const taskStatuses = { todo: 0, inprogress: 0, completed: 0 };
    tasks.forEach(task => {
        if (taskStatuses.hasOwnProperty(task.status)) {
            taskStatuses[task.status]++;
        }
    });

    // Update Pie Chart
    charts.statusPie.data.datasets[0].data = [
        taskStatuses.todo,
        taskStatuses.inprogress,
        taskStatuses.completed
    ];
    charts.statusPie.update();

    // Update Bar Chart - Tasks per Project
    const projectTaskCount = {};
    projects.forEach(project => {
        projectTaskCount[project.name] = tasks.filter(t => t.projectId === project.id).length;
    });

    charts.projectBar.data.labels = Object.keys(projectTaskCount);
    charts.projectBar.data.datasets[0].data = Object.values(projectTaskCount);
    charts.projectBar.update();

    // Update Line Chart - Completion Trend (last 7 days)
    const last7Days = [];
    const completedPerDay = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        completedPerDay.push(tasks.filter(t => 
            t.status === 'completed' && 
            t.updatedAt && t.updatedAt.startsWith(dateStr)
        ).length);
    }

    charts.completionLine.data.labels = last7Days;
    charts.completionLine.data.datasets[0].data = completedPerDay;
    charts.completionLine.update();
}

// ==================== Rendering ====================

function renderAll() {
    renderStats();
    renderProjects();
    renderTasks();
    renderTaskTable();
    renderAnalytics();
    updateCharts();
    updateProjectFilter();
}

function renderStats() {
    elements.totalProjects.textContent = projects.length;
    elements.totalTasks.textContent = tasks.length;
    
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status !== 'completed').length;
    
    elements.completedTasks.textContent = completed;
    elements.pendingTasks.textContent = pending;
}

function renderProjects() {
    if (projects.length === 0) {
        elements.projectsList.innerHTML = `
            <div class="empty-state">
                <i class="ph-bold ph-folder-notch"></i>
                <p>No projects yet. Create one!</p>
            </div>
        `;
        return;
    }

    elements.projectsList.innerHTML = projects.map(project => `
        <div class="project-item ${currentProjectId === project.id ? 'active' : ''}" data-id="${project.id}">
            <div class="project-info">
                <span class="project-name">${escapeHtml(project.name)}</span>
                <span class="project-date">${formatDate(project.createdAt)}</span>
            </div>
            <div class="project-actions">
                <button class="project-action-btn edit" data-id="${project.id}" title="Edit">
                    <i class="ph-bold ph-pencil"></i>
                </button>
                <button class="project-action-btn delete" data-id="${project.id}" title="Delete">
                    <i class="ph-bold ph-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Add click handlers
    elements.projectsList.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.project-action-btn')) {
                selectProject(item.dataset.id);
            }
        });
    });

    elements.projectsList.querySelectorAll('.project-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            editProject(btn.dataset.id);
        });
    });

    elements.projectsList.querySelectorAll('.project-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteProject(btn.dataset.id);
        });
    });
}

function renderTasks() {
    const statusFilter = elements.taskFilterStatus.value;
    const projectFilter = elements.taskFilterProject.value;
    const searchTerm = elements.searchInput.value.toLowerCase();

    let filteredTasks = tasks.filter(task => {
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                            task.description.toLowerCase().includes(searchTerm);
        return matchesStatus && matchesProject && matchesSearch;
    });

    if (filteredTasks.length === 0) {
        elements.tasksList.innerHTML = `
            <div class="empty-state">
                <i class="ph-bold ph-check-square"></i>
                <p>No tasks yet. Create one!</p>
            </div>
        `;
        return;
    }

    elements.tasksList.innerHTML = filteredTasks.map(task => {
        const project = projects.find(p => p.id === task.projectId);
        return `
            <div class="task-item" data-id="${task.id}">
                <div class="task-checkbox ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
                    <i class="ph-bold ph-check"></i>
                </div>
                <div class="task-content">
                    <div class="task-title ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-project">${project ? escapeHtml(project.name) : 'No Project'}</span>
                        <span class="task-priority ${task.priority}">${task.priority}</span>
                        <span class="task-status ${task.status}">${formatStatus(task.status)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="table-action-btn edit" data-id="${task.id}" title="Edit">
                        <i class="ph-bold ph-pencil"></i>
                    </button>
                    <button class="table-action-btn delete" data-id="${task.id}" title="Delete">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add event handlers
    elements.tasksList.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', () => toggleTaskStatus(checkbox.dataset.id));
    });

    elements.tasksList.querySelectorAll('.task-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => editTask(btn.dataset.id));
    });

    elements.tasksList.querySelectorAll('.task-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteTask(btn.dataset.id));
    });
}

function renderTaskTable() {
    const searchTerm = elements.tableSearch.value.toLowerCase();
    
    let filteredTasks = tasks.filter(task => {
        const project = projects.find(p => p.id === task.projectId);
        return task.title.toLowerCase().includes(searchTerm) ||
               (project && project.name.toLowerCase().includes(searchTerm)) ||
               task.status.toLowerCase().includes(searchTerm) ||
               task.priority.toLowerCase().includes(searchTerm);
    });

    if (filteredTasks.length === 0) {
        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="ph-bold ph-table" style="font-size: 2rem; color: var(--text-muted);"></i>
                    <p style="color: var(--text-muted); margin-top: 10px;">No tasks found</p>
                </td>
            </tr>
        `;
        return;
    }

    elements.tableBody.innerHTML = filteredTasks.map(task => {
        const project = projects.find(p => p.id === task.projectId);
        return `
            <tr>
                <td>${escapeHtml(task.title)}</td>
                <td>${project ? escapeHtml(project.name) : '-'}</td>
                <td><span class="task-status ${task.status}">${formatStatus(task.status)}</span></td>
                <td><span class="task-priority ${task.priority}">${task.priority}</span></td>
                <td>${formatDate(task.createdAt)}</td>
                <td>
                    <div class="table-actions-cell">
                        <button class="table-action-btn edit" data-id="${task.id}" title="Edit">
                            <i class="ph-bold ph-pencil"></i>
                        </button>
                        <button class="table-action-btn delete" data-id="${task.id}" title="Delete">
                            <i class="ph-bold ph-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Add event handlers
    elements.tableBody.querySelectorAll('.table-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => editTask(btn.dataset.id));
    });

    elements.tableBody.querySelectorAll('.table-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => deleteTask(btn.dataset.id));
    });
}

function renderAnalytics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'inprogress').length;
    
    // Completion Percentage
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    elements.completionPercentage.textContent = `${completionPercent}%`;
    
    // Productivity Rate (tasks completed in last 7 days / total tasks)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = tasks.filter(t => 
        t.status === 'completed' && 
        t.updatedAt && new Date(t.updatedAt) >= weekAgo
    ).length;
    
    const productivityRate = total > 0 ? Math.round((completedThisWeek / Math.max(total, 1)) * 100) : 0;
    elements.productivityRate.textContent = `${productivityRate}%`;
    
    // Tasks Completed Today
    const today = new Date().toISOString().split('T')[0];
    const tasksCompletedToday = tasks.filter(t => 
        t.status === 'completed' && 
        t.updatedAt && t.updatedAt.startsWith(today)
    ).length;
    elements.tasksToday.textContent = tasksCompletedToday;
    
    // Weekly Progress
    elements.weeklyProgress.textContent = completedThisWeek;
}

function updateProjectFilter() {
    const currentValue = elements.taskFilterProject.value;
    elements.taskFilterProject.innerHTML = `
        <option value="all">All Projects</option>
        ${projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
    `;
    elements.taskFilterProject.value = currentValue;
    
    // Also update task form dropdown
    elements.taskProject.innerHTML = `
        <option value="">Select Project</option>
        ${projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
    `;
}

// ==================== Project Management ====================

function openProjectModal(editId = null) {
    elements.projectModal.classList.add('active');
    if (editId) {
        const project = projects.find(p => p.id === editId);
        if (project) {
            document.getElementById('projectModalTitle').textContent = 'Edit Project';
            elements.projectId.value = project.id;
            elements.projectName.value = project.name;
        }
    } else {
        document.getElementById('projectModalTitle').textContent = 'Add New Project';
        elements.projectForm.reset();
        elements.projectId.value = '';
    }
}

function closeProjectModal() {
    elements.projectModal.classList.remove('active');
    elements.projectForm.reset();
    elements.projectId.value = '';
}

function saveProject(e) {
    e.preventDefault();
    
    const projectId = elements.projectId.value;
    const name = elements.projectName.value.trim();
    
    if (!name) return;
    
    if (projectId) {
        // Edit existing project
        const index = projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            projects[index].name = name;
        }
    } else {
        // Create new project
        const newProject = {
            id: generateId(),
            name: name,
            createdAt: new Date().toISOString()
        };
        projects.push(newProject);
    }
    
    saveProjects(projects);
    closeProjectModal();
    renderAll();
}

function editProject(id) {
    openProjectModal(id);
}

function deleteProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    // Check if project has tasks
    const projectTasks = tasks.filter(t => t.projectId === id);
    if (projectTasks.length > 0) {
        alert(`This project has ${projectTasks.length} task(s). Please delete or reassign them first.`);
        return;
    }
    
    elements.deleteMessage.textContent = `Are you sure you want to delete "${project.name}"?`;
    elements.deleteModal.classList.add('active');
    
    deleteCallback = () => {
        projects = projects.filter(p => p.id !== id);
        saveProjects(projects);
        if (currentProjectId === id) {
            currentProjectId = null;
        }
        renderAll();
        closeDeleteModal();
    };
}

function selectProject(id) {
    currentProjectId = currentProjectId === id ? null : id;
    renderProjects();
    renderTasks();
}

// ==================== Task Management ====================

function openTaskModal(editId = null) {
    updateProjectFilter();
    
    elements.taskModal.classList.add('active');
    if (editId) {
        const task = tasks.find(t => t.id === editId);
        if (task) {
            document.getElementById('taskModalTitle').textContent = 'Edit Task';
            elements.taskId.value = task.id;
            elements.taskTitle.value = task.title;
            elements.taskDescription.value = task.description || '';
            elements.taskProject.value = task.projectId || '';
            elements.taskPriority.value = task.priority;
            elements.taskStatus.value = task.status;
        }
    } else {
        document.getElementById('taskModalTitle').textContent = 'Add New Task';
        elements.taskForm.reset();
        elements.taskId.value = '';
        if (currentProjectId) {
            elements.taskProject.value = currentProjectId;
        }
    }
}

function closeTaskModal() {
    elements.taskModal.classList.remove('active');
    elements.taskForm.reset();
    elements.taskId.value = '';
}

function saveTask(e) {
    e.preventDefault();
    
    const taskId = elements.taskId.value;
    const title = elements.taskTitle.value.trim();
    const description = elements.taskDescription.value.trim();
    const projectId = elements.taskProject.value;
    const priority = elements.taskPriority.value;
    const status = elements.taskStatus.value;
    
    if (!title || !projectId) return;
    
    if (taskId) {
        // Edit existing task
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = {
                ...tasks[index],
                title,
                description,
                projectId,
                priority,
                status,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Create new task
        const newTask = {
            id: generateId(),
            title,
            description,
            projectId,
            priority,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }
    
    saveTasks(tasks);
    closeTaskModal();
    renderAll();
}

function editTask(id) {
    openTaskModal(id);
}

function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    elements.deleteMessage.textContent = `Are you sure you want to delete "${task.title}"?`;
    elements.deleteModal.classList.add('active');
    
    deleteCallback = () => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks(tasks);
        renderAll();
        closeDeleteModal();
    };
}

function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    task.status = task.status === 'completed' ? 'todo' : 'completed';
    task.updatedAt = new Date().toISOString();
    
    saveTasks(tasks);
    renderAll();
}

// ==================== Delete Modal ====================

function closeDeleteModal() {
    elements.deleteModal.classList.remove('active');
    deleteCallback = null;
}

// ==================== Export Data ====================

function exportData() {
    const data = {
        projects: projects,
        tasks: tasks,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-manager-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== Event Listeners ====================

function initEventListeners() {
    // Sidebar toggle
    elements.sidebarToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('collapsed');
    });
    
    elements.mobileMenuToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('active');
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            elements.navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Quick Actions
    elements.newProjectBtn.addEventListener('click', () => openProjectModal());
    elements.newTaskBtn.addEventListener('click', () => openTaskModal());
    elements.exportDataBtn.addEventListener('click', exportData);
    
    // Project Modal
    elements.addProjectBtn.addEventListener('click', () => openProjectModal());
    elements.closeProjectModal.addEventListener('click', closeProjectModal);
    elements.cancelProject.addEventListener('click', closeProjectModal);
    elements.projectForm.addEventListener('submit', saveProject);
    
    // Task Modal
    elements.closeTaskModal.addEventListener('click', closeTaskModal);
    elements.cancelTask.addEventListener('click', closeTaskModal);
    elements.taskForm.addEventListener('submit', saveTask);
    
    // Delete Modal
    elements.closeDeleteModal.addEventListener('click', closeDeleteModal);
    elements.cancelDelete.addEventListener('click', closeDeleteModal);
    elements.confirmDelete.addEventListener('click', () => {
        if (deleteCallback) deleteCallback();
    });
    
    // Filters
    elements.taskFilterStatus.addEventListener('change', renderTasks);
    elements.taskFilterProject.addEventListener('change', renderTasks);
    
    // Search
    elements.searchInput.addEventListener('input', renderTasks);
    elements.tableSearch.addEventListener('input', renderTaskTable);
    
    // Close modals on outside click
    [elements.projectModal, elements.taskModal, elements.deleteModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProjectModal();
            closeTaskModal();
            closeDeleteModal();
        }
    });
}

// ==================== Utility Functions ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function formatStatus(status) {
    const statusMap = {
        'todo': 'To Do',
        'inprogress': 'In Progress',
        'completed': 'Completed'
    };
    return statusMap[status] || status;
}

// ==================== Initialize ====================

document.addEventListener('DOMContentLoaded', init);
