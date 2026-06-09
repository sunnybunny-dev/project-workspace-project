<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface SubTask {
  id: string
  text: string
  isDone: boolean
}

interface Task {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  subtasks: SubTask[]
}

const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus()
}

const tasks = ref<Task[]>([])

onMounted(() => {
  const savedTasks = localStorage.getItem('kanban-tasks')
  if (savedTasks) {
    try {
      const parsed = JSON.parse(savedTasks)
      tasks.value = parsed.map((t: any) => ({
        id: t.id || Date.now().toString(),
        title: t.title || 'Untitled Task',
        status: ['todo', 'in-progress', 'done'].includes(t.status) ? t.status : 'todo',
        priority: t.priority || 'medium',
        subtasks: t.subtasks || []
      }))
    } catch (e) {
      loadDefaults()
    }
  } else {
    loadDefaults()
  }
})

const loadDefaults = () => {
  tasks.value = [
    { 
      id: '1', 
      title: 'Setup Frontend Architecture', 
      status: 'todo', 
      priority: 'high',
      subtasks: []
    },
    { 
      id: '2', 
      title: 'Designing UI Layout', 
      status: 'in-progress', 
      priority: 'medium',
      subtasks: []
    },
    { 
      id: '3', 
      title: 'Install Node & Vue', 
      status: 'done', 
      priority: 'low',
      subtasks: []
    }
  ]
}

watch(tasks, (newTasks) => {
  localStorage.setItem('kanban-tasks', JSON.stringify(newTasks))
}, { deep: true })

const newTaskTitle = ref('')
const newTaskPriority = ref<'low' | 'medium' | 'high'>('medium')

const addTask = () => {
  if (!newTaskTitle.value.trim()) return
  tasks.value.push({
    id: Date.now().toString(),
    title: newTaskTitle.value.trim(),
    status: 'todo',
    priority: newTaskPriority.value,
    subtasks: []
  })
  newTaskTitle.value = ''
  newTaskPriority.value = 'medium'
}

const draggedTaskId = ref<string | null>(null)
const activeDropZone = ref<string | null>(null)

const onDragStart = (taskId: string) => {
  draggedTaskId.value = taskId
}

const onDragOver = (status: 'todo' | 'in-progress' | 'done') => {
  activeDropZone.value = status
}

const onDragLeave = () => {
  activeDropZone.value = null
}

const onDrop = (newStatus: 'todo' | 'in-progress' | 'done') => {
  if (!draggedTaskId.value) return
  const task = tasks.value.find(t => t.id === draggedTaskId.value)
  if (task) {
    task.status = newStatus
  }
  draggedTaskId.value = null
  activeDropZone.value = null
}

const deleteTask = (taskId: string) => {
  tasks.value = tasks.value.filter(task => task.id !== taskId)
}

const editingTaskId = ref<string | null>(null)
const editingTitleValue = ref('')

const startEditing = (task: Task) => {
  editingTaskId.value = task.id
  editingTitleValue.value = task.title
}

const saveEdit = (task: Task) => {
  if (!editingTitleValue.value.trim()) {
    cancelEdit()
    return
  }
  task.title = editingTitleValue.value.trim()
  editingTaskId.value = null
}

const cancelEdit = () => {
  editingTaskId.value = null
}

const addSubTask = (task: Task) => {
  const text = prompt('Enter subtask details:')
  if (!text || !text.trim()) return
  task.subtasks.push({
    id: `sub-${Date.now()}`,
    text: text.trim(),
    isDone: false
  })
}

const deleteSubTask = (task: Task, subTaskId: string) => {
  task.subtasks = task.subtasks.filter(sub => sub.id !== subTaskId)
}

const editingSubTaskId = ref<string | null>(null)
const editingSubTextValue = ref('')

const startEditingSub = (sub: SubTask) => {
  editingSubTaskId.value = sub.id
  editingSubTextValue.value = sub.text
}

const saveSubEdit = (sub: SubTask) => {
  if (!editingSubTextValue.value.trim()) {
    editingSubTaskId.value = null
    return
  }
  sub.text = editingSubTextValue.value.trim()
  editingSubTaskId.value = null
}

const getProgressPercent = (task: Task) => {
  if (!task.subtasks || task.subtasks.length === 0) return 0
  const completed = task.subtasks.filter(s => s.isDone).length
  return Math.round((completed / task.subtasks.length) * 100)
}

const todoTasks = computed(() => tasks.value.filter(t => t.status === 'todo'))
const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in-progress'))
const doneTasks = computed(() => tasks.value.filter(t => t.status === 'done'))
</script>

<template>
  <header class="header-bar">
    <div class="logo">☀️ sunnybunny</div>
    <nav class="nav-links">
      <a href="#" class="active">Workspace</a>
      <a href="https://github.com" target="_blank">GitHub</a>
    </nav>
  </header>

  <div class="kanban-container">
    <header class="board-header">
      <h1>Project Workspace</h1>
    </header>

    <div class="add-task-form">
      <input 
        v-model="newTaskTitle" 
        type="text" 
        placeholder="Type a new task name..." 
        @keyup.enter="addTask"
      />
      <select v-model="newTaskPriority" class="priority-select">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button @click="addTask">Add Task</button>
    </div>

    <div class="board-columns">
      <section 
        class="column" 
        :class="{ 'drop-active': activeDropZone === 'todo' }"
        @dragover.prevent="onDragOver('todo')"
        @dragleave="onDragLeave"
        @drop="onDrop('todo')"
      >
        <div class="column-header-row">
          <h2>To Do</h2>
          <span class="task-counter-badge">{{ todoTasks.length }}</span>
        </div>
        
        <div class="task-list">
          <div v-if="todoTasks.length === 0" class="empty-state-placeholder">
            No pending tasks
          </div>

          <TransitionGroup name="list">
            <div 
              v-for="task in todoTasks" 
              :key="task.id" 
              :class="['task-card', `priority-${task.priority || 'medium'}`]"
              :draggable="editingTaskId !== task.id && editingSubTaskId === null"
              @dragstart="onDragStart(task.id)"
            >
              <div class="task-main-row">
                <input 
                  v-if="editingTaskId === task.id"
                  v-model="editingTitleValue"
                  class="edit-task-input"
                  type="text"
                  @keyup.enter="saveEdit(task)"
                  @keyup.esc="cancelEdit"
                  @blur="saveEdit(task)"
                  v-focus
                />
                <span 
                  v-else 
                  class="task-title" 
                  @dblclick="startEditing(task)"
                  title="Double click to edit task"
                >
                  {{ task.title || 'Untitled Task' }}
                </span>
                <button class="delete-btn" @click.stop="deleteTask(task.id)">&times;</button>
              </div>

              <div v-if="task.subtasks && task.subtasks.length > 0" class="progress-bar-container">
                <div class="progress-bar-fill" :style="{ width: getProgressPercent(task) + '%' }"></div>
              </div>

              <div v-if="task.subtasks && task.subtasks.length > 0" class="subtask-wrapper">
                <div v-for="sub in task.subtasks" :key="sub.id" class="subtask-item">
                  <input type="checkbox" v-model="sub.isDone" :id="sub.id" />
                  
                  <input 
                    v-if="editingSubTaskId === sub.id"
                    v-model="editingSubTextValue"
                    class="edit-subtask-input"
                    type="text"
                    @keyup.enter="saveSubEdit(sub)"
                    @keyup.esc="editingSubTaskId = null"
                    @blur="saveSubEdit(sub)"
                    v-focus
                  />
                  <label 
                    v-else 
                    :class="{ 'strike-through': sub.isDone }" 
                    :for="sub.id"
                    @dblclick.stop="startEditingSub(sub)"
                    title="Double click to edit subtask"
                  >
                    {{ sub.text }}
                  </label>
                  <button class="sub-delete-btn" @click.stop="deleteSubTask(task, sub.id)">&times;</button>
                </div>
              </div>

              <div class="card-footer-actions">
                <button class="add-subtask-btn" @click.stop="addSubTask(task)">+ Subtask</button>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </section>

      <section 
        class="column" 
        :class="{ 'drop-active': activeDropZone === 'in-progress' }"
        @dragover.prevent="onDragOver('in-progress')"
        @dragleave="onDragLeave"
        @drop="onDrop('in-progress')"
      >
        <div class="column-header-row">
          <h2>In Progress</h2>
          <span class="task-counter-badge">{{ inProgressTasks.length }}</span>
        </div>
        
        <div class="task-list">
          <div v-if="inProgressTasks.length === 0" class="empty-state-placeholder">
            No active assignments
          </div>

          <TransitionGroup name="list">
            <div 
              v-for="task in inProgressTasks" 
              :key="task.id" 
              :class="['task-card', `priority-${task.priority || 'medium'}`]"
              :draggable="editingTaskId !== task.id && editingSubTaskId === null"
              @dragstart="onDragStart(task.id)"
            >
              <div class="task-main-row">
                <input 
                  v-if="editingTaskId === task.id"
                  v-model="editingTitleValue"
                  class="edit-task-input"
                  type="text"
                  @keyup.enter="saveEdit(task)"
                  @keyup.esc="cancelEdit"
                  @blur="saveEdit(task)"
                  v-focus
                />
                <span 
                  v-else 
                  class="task-title" 
                  @dblclick="startEditing(task)"
                  title="Double click to edit task"
                >
                  {{ task.title || 'Untitled Task' }}
                </span>
                <button class="delete-btn" @click.stop="deleteTask(task.id)">&times;</button>
              </div>

              <div v-if="task.subtasks && task.subtasks.length > 0" class="progress-bar-container">
                <div class="progress-bar-fill" :style="{ width: getProgressPercent(task) + '%' }"></div>
              </div>

              <div v-if="task.subtasks && task.subtasks.length > 0" class="subtask-wrapper">
                <div v-for="sub in task.subtasks" :key="sub.id" class="subtask-item">
                  <input type="checkbox" v-model="sub.isDone" :id="sub.id" />
                  <input 
                    v-if="editingSubTaskId === sub.id"
                    v-model="editingSubTextValue"
                    class="edit-subtask-input"
                    type="text"
                    @keyup.enter="saveSubEdit(sub)"
                    @keyup.esc="editingSubTaskId = null"
                    @blur="saveSubEdit(sub)"
                    v-focus
                  />
                  <label 
                    v-else 
                    :class="{ 'strike-through': sub.isDone }" 
                    :for="sub.id"
                    @dblclick.stop="startEditingSub(sub)"
                  >
                    {{ sub.text }}
                  </label>
                  <button class="sub-delete-btn" @click.stop="deleteSubTask(task, sub.id)">&times;</button>
                </div>
              </div>

              <div class="card-footer-actions">
                <button class="add-subtask-btn" @click.stop="addSubTask(task)">+ Subtask</button>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </section>

      <section 
        class="column" 
        :class="{ 'drop-active': activeDropZone === 'done' }"
        @dragover.prevent="onDragOver('done')"
        @dragleave="onDragLeave"
        @drop="onDrop('done')"
      >
        <div class="column-header-row">
          <h2>Done</h2>
          <span class="task-counter-badge">{{ doneTasks.length }}</span>
        </div>
        
        <div class="task-list">
          <div v-if="doneTasks.length === 0" class="empty-state-placeholder">
            No finished items
          </div>

          <TransitionGroup name="list">
            <div 
              v-for="task in doneTasks" 
              :key="task.id" 
              :class="['task-card', `priority-${task.priority || 'medium'}`]"
              :draggable="editingTaskId !== task.id && editingSubTaskId === null"
              @dragstart="onDragStart(task.id)"
            >
              <div class="task-main-row">
                <input 
                  v-if="editingTaskId === task.id"
                  v-model="editingTitleValue"
                  class="edit-task-input"
                  type="text"
                  @keyup.enter="saveEdit(task)"
                  @keyup.esc="cancelEdit"
                  @blur="saveEdit(task)"
                  v-focus
                />
                <span 
                  v-else 
                  class="task-title" 
                  @dblclick="startEditing(task)"
                  title="Double click to edit task"
                >
                  {{ task.title || 'Untitled Task' }}
                </span>
                <button class="delete-btn" @click.stop="deleteTask(task.id)">&times;</button>
              </div>

              <div v-if="task.subtasks && task.subtasks.length > 0" class="progress-bar-container">
                <div class="progress-bar-fill" :style="{ width: getProgressPercent(task) + '%' }"></div>
              </div>

              <div v-if="task.subtasks && task.subtasks.length > 0" class="subtask-wrapper">
                <div v-for="sub in task.subtasks" :key="sub.id" class="subtask-item">
                  <input type="checkbox" v-model="sub.isDone" :id="sub.id" />
                  <input 
                    v-if="editingSubTaskId === sub.id"
                    v-model="editingSubTextValue"
                    class="edit-subtask-input"
                    type="text"
                    @keyup.enter="saveSubEdit(sub)"
                    @keyup.esc="editingSubTaskId = null"
                    @blur="saveSubEdit(sub)"
                    v-focus
                  />
                  <label 
                    v-else 
                    :class="{ 'strike-through': sub.isDone }" 
                    :for="sub.id"
                    @dblclick.stop="startEditingSub(sub)"
                  >
                    {{ sub.text }}
                  </label>
                  <button class="sub-delete-btn" @click.stop="deleteSubTask(task, sub.id)">&times;</button>
                </div>
              </div>

              <div class="card-footer-actions">
                <button class="add-subtask-btn" @click.stop="addSubTask(task)">+ Subtask</button>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
body, html {
  margin: 0;
  padding: 0;
  background-color: #0f0b1e;
}
</style>

<style scoped>
/* Glassmorphism Header Bar Layout & Styling */
.header-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1rem 2.5rem;
  box-sizing: border-box;
  z-index: 2000; /* Pushes layout layer over task interaction states */
  
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-family: system-ui, -apple-system, sans-serif;
}

.header-bar .logo {
  color: #f8fafc;
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}

.nav-links a {
  color: rgba(248, 250, 252, 0.6);
  text-decoration: none;
  margin-left: 1.75rem;
  font-size: 0.92rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-links a:hover, 
.nav-links a.active {
  color: #f472b6;
}

.kanban-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #0f0b1e 0%, #2e1045 100%);
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
  /* Shifted padding-top to 6rem to provide clearance for the fixed header */
  padding: 6rem 2rem 3rem 2rem; 
  box-sizing: border-box;
}

.board-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.05em;
  margin: 0 0 2.5rem 0;
  background: linear-gradient(to right, #d946ef, #f472b6);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.add-task-form {
  display: flex;
  gap: 1rem;
  max-width: 650px;
  margin-bottom: 3rem;
}

.add-task-form input {
  flex: 2;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  color: #f8fafc;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
}

.add-task-form input:focus {
  border-color: rgba(244, 114, 182, 0.5);
  background: rgba(255, 255, 255, 0.07);
  box-shadow: 0 0 15px rgba(244, 114, 182, 0.15);
}

.priority-select {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 1rem;
  border-radius: 10px;
  color: #f8fafc;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
}

.priority-select option {
  background: #2e1045;
  color: #f8fafc;
}

.add-task-form button {
  background: linear-gradient(135deg, #f472b6 0%, #a855f7 100%);
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  color: #0f0b1e;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-task-form button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(244, 114, 182, 0.4);
}

.board-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  align-items: start;
}

.column {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.column.drop-active {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(244, 114, 182, 0.3);
}

.column-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.column h2 {
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  color: #94a3b8;
}

.task-counter-badge {
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #f472b6;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 200px;
  position: relative;
}

.empty-state-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 255, 255, 0.08);
  padding: 2rem;
  border-radius: 12px;
  color: #475569;
  font-size: 0.95rem;
  font-style: italic;
  text-align: center;
  user-select: none;
}

.task-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.1rem 1.25rem 0.8rem 1.6rem;
  border-radius: 12px;
  color: #f8fafc;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: grab;
}

.task-card:active {
  cursor: grabbing;
}

.task-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(244, 114, 182, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px 0 rgba(244, 114, 182, 0.1);
}

.task-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  border-radius: 12px 0 0 12px;
}

.priority-high::before {
  background: linear-gradient(to bottom, #ec4899, #d946ef);
}

.priority-medium::before {
  background: linear-gradient(to bottom, #a855f7, #7c3aed);
}

.priority-low::before {
  background: linear-gradient(to bottom, #c084fc, #818cf8);
}

.task-title {
  flex: 1;
  word-break: break-word;
  color: #f8fafc;
  cursor: pointer;
}

.edit-task-input {
  width: 100%;
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #f472b6;
  padding: 4px 8px;
  border-radius: 6px;
  color: #f8fafc;
  font-size: 1rem;
  outline: none;
  box-sizing: border-box;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.1);
}

.subtask-wrapper {
  margin-top: 0.75rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #cbd5e1;
  position: relative;
}

.subtask-item input[type="checkbox"] {
  accent-color: #f472b6;
  cursor: pointer;
  width: 14px;
  height: 14px;
}

.subtask-item label {
  flex: 1;
  cursor: pointer;
  word-break: break-word;
}

.edit-subtask-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #818cf8;
  padding: 2px 6px;
  border-radius: 4px;
  color: #f8fafc;
  font-size: 0.85rem;
  outline: none;
}

.sub-delete-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  opacity: 0.4;
  transition: opacity 0.2s, color 0.2s;
}

.subtask-item:hover .sub-delete-btn {
  opacity: 1;
}

.sub-delete-btn:hover {
  color: #f43f5e;
}

.strike-through {
  text-decoration: line-through;
  color: #64748b;
  opacity: 0.6;
}

.progress-bar-container {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  margin-top: 0.6rem;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #f472b6, #a855f7);
  border-radius: 2px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-footer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.6rem;
}

.add-subtask-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.add-subtask-btn:hover {
  color: #f472b6;
  background: rgba(244, 114, 182, 0.08);
}

.list-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.list-move {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.list-leave-active {
  position: absolute;
  width: 100%;
  z-index: 10;
}
</style>