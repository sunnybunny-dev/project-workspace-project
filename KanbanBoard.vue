<script setup lang="ts">
import { watch } from 'vue'
import { useAuth } from './useAuth'
import { useKanban } from './useKanban'

const { 
  currentUser, 
  usernameInput, 
  passwordInput, 
  emailInput,
  fullNameInput,
  authError, 
  isRegisterMode,
  login, 
  handleRegister,
  logout 
} = useAuth()

function toggleMode() {
  isRegisterMode.value = !isRegisterMode.value
  authError.value = ''
  usernameInput.value = ''
  passwordInput.value = ''
  emailInput.value = ''
  fullNameInput.value = ''
}

const {
  newTaskTitle,
  newTaskPriority,
  activeDropZone,
  editingTaskId,
  editingTitleValue,
  editingSubTaskId,
  editingSubTextValue,
  currentlyAddingSubToTaskId,
  newSubTaskTextValue,
  tasks,
  todoTasks,
  inProgressTasks,
  doneTasks,
  loadProfileTasks,
  addTask,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  deleteTask,
  startEditing,
  saveEdit,
  cancelEdit,
  openSubTaskInput,
  submitSubTask,
  cancelSubTaskInput,
  deleteSubTask,
  startEditingSub,
  saveSubEdit,
  getProgressPercent,
  currentTheme,
  changeTheme,
  isPrioritySorted
} = useKanban()

watch(currentUser, (newUser) => {
  if (newUser) {
    loadProfileTasks(newUser.id)
  }
}, { immediate: true })
</script>

<template>
  <div class="app-wrapper">

    <!-- =====================================================
         VIEW A: Authentication Screen (Logged Out)
         ===================================================== -->
    <div v-if="!currentUser" class="auth-container">
      <div class="split-auth-card">

        <!-- Left: Graphic / Bridge Panel -->
        <div class="auth-graphic-side">
          <div class="graphic-content">
            <h2 v-if="isRegisterMode">Already have an account?</h2>
            <h2 v-else>New to the workspace?</h2>

            <p v-if="isRegisterMode">Access your board profiles instantly by signing into your dashboard environment.</p>
            <p v-else>Create a custom profile layout to manage tasks and visual themes seamlessly.</p>

            <button @click="toggleMode" class="btn-toggle-mode">
              {{ isRegisterMode ? 'Sign In Instead' : 'Register / Sign Up' }}
            </button>
          </div>
        </div>

        <!-- Right: Form Panel -->
        <div class="form-box">
          <div class="auth-brand-header">
            <span class="logo-emoji">🌸</span>
            <h2>OrchidTask</h2>
          </div>

          <!-- Mode 1: Register -->
          <div v-if="isRegisterMode" class="form-content">
            <h3>Register Now</h3>
            <p class="subtitle">Set up a workspace profile to get started.</p>

            <form @submit.prevent="handleRegister" class="auth-form">
              <div class="input-group">
                <label>FULL NAME</label>
                <input v-model="fullNameInput" type="text" placeholder="e.g. Sunny Bunny" />
              </div>
              <div class="input-group">
                <label>PROFILE USERNAME *</label>
                <input v-model="usernameInput" type="text" placeholder="Choose a username" required />
              </div>
              <div class="input-group">
                <label>EMAIL ADDRESS *</label>
                <input v-model="emailInput" type="email" placeholder="name@example.com" required />
              </div>
              <div class="input-group">
                <label>PASSWORD</label>
                <input v-model="passwordInput" type="password" placeholder="••••••••" autocomplete="new-password" />
              </div>
              <p v-if="authError" class="error-msg">⚠️ {{ authError }}</p>
              <button type="submit" class="btn-submit">Create Account</button>
            </form>
          </div>

          <!-- Mode 2: Login -->
          <div v-else class="form-content">
            <h3>Welcome Back</h3>
            <p class="subtitle">Sign in directly to access your dashboards.</p>

            <form @submit.prevent="login" class="auth-form">
              <div class="input-group">
                <label>PROFILE USERNAME</label>
                <input v-model="usernameInput" type="text" placeholder="e.g. sunnybunny" required autocomplete="username" />
              </div>
              <div class="input-group">
                <label>PASSWORD</label>
                <input v-model="passwordInput" type="password" placeholder="••••••••" autocomplete="current-password" />
              </div>
              <p v-if="authError" class="error-msg">⚠️ {{ authError }}</p>
              <button type="submit" class="btn-submit">Enter Workspace</button>
            </form>
          </div>

        </div><!-- end .form-box -->
      </div><!-- end .split-auth-card -->
    </div><!-- end .auth-container -->

    <!-- =====================================================
         VIEW B: Kanban Dashboard (Logged In)
         ===================================================== -->
    <div v-else :class="['theme-wrapper', currentTheme]">

      <!-- Global Navigation Bar -->
      <header class="app-navbar">
        <div class="nav-brand">
          <span class="brand-icon">🌸</span>
          <span class="brand-text">OrchidTask</span>
        </div>

        <nav class="nav-links">
          <a href="#" class="active">Workspace</a>

          <div class="theme-picker">
            <label>Theme:</label>
            <select :value="currentTheme" @change="changeTheme(($event.target as HTMLSelectElement).value)">
              <option value="space-dark">🌌 Space Dark</option>
              <option value="cyber-magenta">🔮 Cyber Magenta</option>
              <option value="sunny-light">☀️ Sunny Light</option>
              <option value="mint-fresh">🌿 Mint Fresh</option>
            </select>
          </div>

          <a href="#" @click.prevent="logout" class="logout-link">Switch Profile (Logout)</a>
        </nav>
      </header>

      <!-- Core Kanban Workspace -->
      <main class="kanban-container">
        <header class="board-header">
          <h1>{{ currentUser.username }}'s Project Board</h1>
        </header>

        <!-- Task Creator Bar -->
        <section class="task-creator">
          <input
            v-model="newTaskTitle"
            type="text"
            placeholder="Type a new task name..."
            @keyup.enter="addTask"
          />
          <select v-model="newTaskPriority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button @click="addTask" class="btn-add">Add Task</button>

          <button
            @click="isPrioritySorted = !isPrioritySorted"
            :class="['btn-sort-toggle', { active: isPrioritySorted }]"
            type="button"
          >
            {{ isPrioritySorted ? '⚡ Sorted by Priority' : '⏳ Sort by Priority' }}
          </button>
        </section>

        <!-- Triple-Column Kanban Grid -->
        <div class="kanban-grid">

          <!-- COLUMN 1: TO DO -->
          <div
            class="column"
            :class="{ 'drag-over': activeDropZone === 'todo' }"
            @dragover.prevent="onDragOver('todo')"
            @dragleave="onDragLeave"
            @drop="onDrop('todo')"
          >
            <div class="column-header">
              <h2>TO DO</h2>
              <span class="badge">{{ todoTasks.length }}</span>
            </div>
            <div class="cards-list">
              <div
                v-for="task in todoTasks"
                :key="task.id"
                class="task-card"
                :class="`priority-${task.priority}`"
                draggable="true"
                @dragstart="onDragStart(task.id)"
              >
                <div class="card-main-row">
                  <div v-if="editingTaskId === task.id" class="edit-box">
                    <input v-model="editingTitleValue" @keyup.enter="saveEdit(task)" type="text" />
                    <button @click="saveEdit(task)">💾</button>
                  </div>
                  <p v-else @click="startEditing(task)" class="task-title">{{ task.title }}</p>
                  <button @click="deleteTask(task.id)" class="btn-delete">×</button>
                </div>
                <div class="subtasks-container">
                  <div v-for="sub in task.subtasks" :key="sub.id" class="subtask-item">
                    <input type="checkbox" v-model="sub.isDone" />
                    <div v-if="editingSubTaskId === sub.id" class="sub-edit-box">
                      <input v-model="editingSubTextValue" @keyup.enter="saveSubEdit(sub)" type="text" />
                    </div>
                    <span v-else @click="startEditingSub(sub)" :class="{ done: sub.isDone }">{{ sub.text }}</span>
                    <button @click="deleteSubTask(task, sub.id)" class="btn-sub-delete">×</button>
                  </div>
                  <div v-if="task.subtasks.length > 0" class="progress-bar-wrapper">
                    <div class="progress-bar" :style="{ width: getProgressPercent(task) + '%' }"></div>
                    <span class="progress-text">{{ getProgressPercent(task) }}%</span>
                  </div>
                  <div v-if="currentlyAddingSubToTaskId === task.id" class="subtask-input-row">
                    <input v-model="newSubTaskTextValue" placeholder="Add subtask..." @keyup.enter="submitSubTask(task)" type="text" />
                    <button @click="submitSubTask(task)">Add</button>
                    <button @click="cancelSubTaskInput" class="cancel">Cancel</button>
                  </div>
                  <button v-else @click="openSubTaskInput(task.id)" class="btn-trigger-sub">+ Subtask</button>
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMN 2: IN PROGRESS -->
          <div
            class="column"
            :class="{ 'drag-over': activeDropZone === 'in-progress' }"
            @dragover.prevent="onDragOver('in-progress')"
            @dragleave="onDragLeave"
            @drop="onDrop('in-progress')"
          >
            <div class="column-header">
              <h2>IN PROGRESS</h2>
              <span class="badge">{{ inProgressTasks.length }}</span>
            </div>
            <div class="cards-list">
              <div
                v-for="task in inProgressTasks"
                :key="task.id"
                class="task-card"
                :class="`priority-${task.priority}`"
                draggable="true"
                @dragstart="onDragStart(task.id)"
              >
                <div class="card-main-row">
                  <div v-if="editingTaskId === task.id" class="edit-box">
                    <input v-model="editingTitleValue" @keyup.enter="saveEdit(task)" type="text" />
                    <button @click="saveEdit(task)">💾</button>
                  </div>
                  <p v-else @click="startEditing(task)" class="task-title">{{ task.title }}</p>
                  <button @click="deleteTask(task.id)" class="btn-delete">×</button>
                </div>
                <div class="subtasks-container">
                  <div v-for="sub in task.subtasks" :key="sub.id" class="subtask-item">
                    <input type="checkbox" v-model="sub.isDone" />
                    <div v-if="editingSubTaskId === sub.id" class="sub-edit-box">
                      <input v-model="editingSubTextValue" @keyup.enter="saveSubEdit(sub)" type="text" />
                    </div>
                    <span v-else @click="startEditingSub(sub)" :class="{ done: sub.isDone }">{{ sub.text }}</span>
                    <button @click="deleteSubTask(task, sub.id)" class="btn-sub-delete">×</button>
                  </div>
                  <div v-if="task.subtasks.length > 0" class="progress-bar-wrapper">
                    <div class="progress-bar" :style="{ width: getProgressPercent(task) + '%' }"></div>
                    <span class="progress-text">{{ getProgressPercent(task) }}%</span>
                  </div>
                  <div v-if="currentlyAddingSubToTaskId === task.id" class="subtask-input-row">
                    <input v-model="newSubTaskTextValue" placeholder="Add subtask..." @keyup.enter="submitSubTask(task)" type="text" />
                    <button @click="submitSubTask(task)">Add</button>
                    <button @click="cancelSubTaskInput" class="cancel">Cancel</button>
                  </div>
                  <button v-else @click="openSubTaskInput(task.id)" class="btn-trigger-sub">+ Subtask</button>
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMN 3: DONE -->
          <div
            class="column"
            :class="{ 'drag-over': activeDropZone === 'done' }"
            @dragover.prevent="onDragOver('done')"
            @dragleave="onDragLeave"
            @drop="onDrop('done')"
          >
            <div class="column-header">
              <h2>DONE</h2>
              <span class="badge">{{ doneTasks.length }}</span>
            </div>
            <div class="cards-list">
              <div
                v-for="task in doneTasks"
                :key="task.id"
                class="task-card"
                :class="`priority-${task.priority}`"
                draggable="true"
                @dragstart="onDragStart(task.id)"
              >
                <div class="card-main-row">
                  <div v-if="editingTaskId === task.id" class="edit-box">
                    <input v-model="editingTitleValue" @keyup.enter="saveEdit(task)" type="text" />
                    <button @click="saveEdit(task)">💾</button>
                  </div>
                  <p v-else @click="startEditing(task)" class="task-title">{{ task.title }}</p>
                  <button @click="deleteTask(task.id)" class="btn-delete">×</button>
                </div>
                <div class="subtasks-container">
                  <div v-for="sub in task.subtasks" :key="sub.id" class="subtask-item">
                    <input type="checkbox" v-model="sub.isDone" />
                    <div v-if="editingSubTaskId === sub.id" class="sub-edit-box">
                      <input v-model="editingSubTextValue" @keyup.enter="saveSubEdit(sub)" type="text" />
                    </div>
                    <span v-else @click="startEditingSub(sub)" :class="{ done: sub.isDone }">{{ sub.text }}</span>
                    <button @click="deleteSubTask(task, sub.id)" class="btn-sub-delete">×</button>
                  </div>
                  <div v-if="task.subtasks.length > 0" class="progress-bar-wrapper">
                    <div class="progress-bar" :style="{ width: getProgressPercent(task) + '%' }"></div>
                    <span class="progress-text">{{ getProgressPercent(task) }}%</span>
                  </div>
                  <div v-if="currentlyAddingSubToTaskId === task.id" class="subtask-input-row">
                    <input v-model="newSubTaskTextValue" placeholder="Add subtask..." @keyup.enter="submitSubTask(task)" type="text" />
                    <button @click="submitSubTask(task)">Add</button>
                    <button @click="cancelSubTaskInput" class="cancel">Cancel</button>
                  </div>
                  <button v-else @click="openSubTaskInput(task.id)" class="btn-trigger-sub">+ Subtask</button>
                </div>
              </div>
            </div>
          </div>

        </div><!-- end .kanban-grid -->
      </main>
    </div><!-- end .theme-wrapper -->

  </div><!-- end .app-wrapper -->
</template>

<style scoped>
.icon {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1); 
  vertical-align: middle;
  margin-right: 8px;
}

.sunny-light .icon {
  filter: brightness(0) invert(0);
}

*, body, h1, h2, h3, .nav-links, .board-header, .column-title, .task-card, button, select, input {
  font-family: 'Outfit', sans-serif !important;
}

.column {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 20px;
  min-height: 500px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.column-title {
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.nav-links, .theme-picker, .logout-link {
  font-weight: 400;
}

.task-card {
  font-family: 'Outfit', sans-serif;
  font-weight: 300;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  cursor: grab;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.06);
}

/* ==========================================================================
   THEME CORES
   ========================================================================== */
.space-dark {
  --bg-gradient: linear-gradient(135deg, #0f0b1e 0%, #2e1045 100%);
  --text-main: #ffffff;
  --text-sub: #94a3b8;
  --card-bg: rgba(255, 255, 255, 0.03);
  --card-border: rgba(255, 255, 255, 0.07);
  --accent-color: #f472b6;
  --panel-shadow: rgba(0, 0, 0, 0.5);
}

.cyber-magenta {
  --bg-gradient: linear-gradient(135deg, #16001a 0%, #4c0527 100%);
  --text-main: #fff1f2;
  --text-sub: #fecdd3;
  --card-bg: rgba(255, 255, 255, 0.04);
  --card-border: rgba(244, 63, 94, 0.2);
  --accent-color: #f43f5e;
  --panel-shadow: rgba(22, 0, 26, 0.6);
}

.sunny-light {
  --bg-gradient: linear-gradient(135deg, #fef9c3 0%, #ffedd5 100%);
  --text-main: #1e293b;
  --text-sub: #475569;
  --card-bg: rgba(255, 255, 255, 0.45);
  --card-border: rgba(0, 0, 0, 0.06);
  --accent-color: #ea580c;
  --panel-shadow: rgba(120, 50, 0, 0.08);
}

.mint-fresh {
  --bg-gradient: linear-gradient(135deg, #042f22 0%, #064e3b 100%);
  --text-main: #f0fdf4;
  --text-sub: #a7f3d0;
  --card-bg: rgba(255, 255, 255, 0.03);
  --card-border: rgba(16, 185, 129, 0.15);
  --accent-color: #10b981;
  --panel-shadow: rgba(2, 20, 15, 0.6);
}

.theme-wrapper {
  min-height: 100vh;
  width: 100%;
  background: var(--bg-gradient);
  color: var(--text-main);
  transition: background 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), color 0.4s ease;
  display: flex;
  flex-direction: column;
}

/* ==========================================================================
   AUTHENTICATION STYLES
   ========================================================================== */
.auth-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0e0a1a 0%, #1c092c 100%);
  padding: 24px;
  box-sizing: border-box;
}

.split-auth-card {
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 28px;
  width: 100%;
  max-width: 900px;
  min-height: 580px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.form-box { 
  position: absolute; 
  right: 0; 
  width: 50%;
  height: 100%; 
  background: #fff; 
  display: flex; 
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #333; 
  text-align: center; 
  padding: 40px; 
  z-index: 1;
  box-sizing: border-box;
  transition: .6s ease-in-out 1.2s, visibility 0s 1s;
}

.auth-brand-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.auth-brand-header h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #333;
  margin: 0;
}

.form-content {
  width: 100%;
  max-width: 320px;
}

.form-content h3 {
  font-size: 1.8rem;
  color: #111;
  margin: 0 0 4px 0;
  font-weight: 700;
}

.subtitle {
  color: #64748b;
  font-size: 0.88rem;
  margin-bottom: 24px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
}

.input-group input {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
  color: #333;
  font-size: 0.92rem;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.input-group input:focus {
  border-color: #6c5ce7;
  background: rgba(0, 0, 0, 0.02);
}

.error-msg {
  color: #ef4444;
  font-size: 0.82rem;
  margin: 0;
  font-weight: 500;
}

.btn-submit {
  background: linear-gradient(90deg, #e84393, #6c5ce7);
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 6px;
}

.btn-submit:hover { opacity: 0.92; }

.auth-graphic-side {
  position: absolute;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(135deg, #e84393 0%, #6c5ce7 100%);
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.auth-graphic-side::before {
  content: '';
  position: absolute;
  inset: 15px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(5px);
  pointer-events: none;
}

.graphic-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #fff;
  max-width: 320px;
}

.graphic-content h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.graphic-content p {
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.85;
  margin-bottom: 24px;
}

.btn-toggle-mode {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: background 0.2s, transform 0.2s;
  backdrop-filter: blur(5px);
}

.btn-toggle-mode:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

/* ==========================================================================
   DASHBOARD STYLES
   ========================================================================== */
.app-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 40px;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon { font-size: 1.3rem; }
.brand-text {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: -0.3px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-links a {
  color: var(--text-sub);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-links a.active { color: #f472b6; }
.nav-links a:hover { color: var(--text-main); }

.theme-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-sub);
}

.theme-picker select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-main);
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  outline: none;
  font-weight: 500;
}

.theme-picker select option {
  background: #18142c;
  color: #fff;
}

.kanban-container {
  flex: 1;
  padding: 40px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.board-header h1 {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -0.75px;
  margin: 0 0 30px 0;
  color: #f472b6;
}

.task-creator {
  display: flex;
  gap: 12px;
  margin-bottom: 35px;
  max-width: 800px;
}

.task-creator input {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 12px 16px;
  color: var(--text-main);
  outline: none;
}

.task-creator select {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--card-border);
  color: var(--text-main);
  border-radius: 10px;
  padding: 0 16px;
  outline: none;
}

.task-creator select option {
  background-color: #1a162b;
  color: #ffffff;
}

.btn-add {
  background: linear-gradient(135deg, #f472b6 0%, #c084fc 100%);
  color: #000;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  padding: 0 24px;
  cursor: pointer;
}

.btn-sort-toggle {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--card-border);
  color: var(--text-sub);
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 10px;
  padding: 0 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.btn-sort-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  border-color: var(--text-sub);
}

.btn-sort-toggle.active {
  background: var(--accent-color);
  color: #000;
  font-weight: 700;
  border-color: transparent;
  box-shadow: 0 0 15px rgba(244, 114, 182, 0.25);
}

.kanban-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  align-items: start;
}

.column {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  padding: 20px;
  min-height: 500px;
  transition: background 0.2s ease, transform 0.2s ease;
  box-shadow: 0 10px 30px var(--panel-shadow);
}

.column.drag-over {
  background: rgba(255, 255, 255, 0.07);
  transform: scale(1.01);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.column-header h2 {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-sub);
  margin: 0;
}

.badge {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.task-card {
  font-family: 'Outfit', sans-serif;
  font-weight: 300;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  cursor: grab;
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.task-card:active { cursor: grabbing; }
.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 16px;
  bottom: 16px;
  width: 4px;
  border-radius: 0 4px 4px 0;
}
.priority-high::before { background-color: #ef4444; }
.priority-medium::before { background-color: #3b82f6; }
.priority-low::before { background-color: #10b981; }

.card-main-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-left: 8px;
}

.task-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
  flex: 1;
}

.btn-delete {
  background: transparent;
  border: none;
  color: var(--text-sub);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.btn-delete:hover { color: #f87171; }

.subtasks-container {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  margin-left: 8px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.subtask-item span.done {
  text-decoration: line-through;
  color: var(--text-sub);
  opacity: 0.6;
}

.btn-sub-delete {
  background: transparent;
  border: none;
  color: transparent;
  cursor: pointer;
  margin-left: auto;
  font-size: 0.8rem;
}
.subtask-item:hover .btn-sub-delete { color: var(--text-sub); }

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.progress-bar {
  height: 4px;
  background: var(--accent-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.7rem;
  color: var(--text-sub);
  font-weight: 600;
}

.subtask-input-row {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.subtask-input-row input {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 4px 8px;
  color: #fff;
  font-size: 0.8rem;
}

.btn-trigger-sub {
  background: transparent;
  border: none;
  color: var(--text-sub);
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0;
  margin-top: 4px;
}
.btn-trigger-sub:hover { color: var(--accent-color); }

.edit-box, .sub-edit-box { display: flex; gap: 4px; flex: 1; }
.edit-box input, .sub-edit-box input {
  flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 4px; padding: 2px 6px;
}
/* Ensure the container fills the screen width, not more */
.kanban-grid {
  display: grid;
  grid-template-columns: 1fr; /* 1 column on mobile */
  gap: 15px;
  width: 100%;
  max-width: 100%; /* Prevents horizontal overflow */
  padding: 10px;
  box-sizing: border-box; /* Crucial: ensures padding doesn't push width out */
}

/* Tablet and Desktop: 3 columns */
@media (min-width: 768px) {
  .kanban-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
