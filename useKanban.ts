import { ref, computed, watch } from 'vue'

export interface SubTask {
  id: string;
  text: string;
  isDone: boolean;
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  subtasks: SubTask[];
}

export function useKanban() {
  const tasks = ref<Task[]>([])
  const currentUserId = ref<string | null>(null)
  
  const newTaskTitle = ref('')
  const newTaskPriority = ref<'low' | 'medium' | 'high'>('medium')
  const draggedTaskId = ref<string | null>(null)
  const activeDropZone = ref<string | null>(null)
  const editingTaskId = ref<string | null>(null)
  const editingTitleValue = ref('')
  const editingSubTaskId = ref<string | null>(null)
  const editingSubTextValue = ref('')
  const currentlyAddingSubToTaskId = ref<string | null>(null)
  const newSubTaskTextValue = ref('')
  
  const isPrioritySorted = ref(false)
  const currentTheme = ref('space-dark')

  // Load tasks specific to the logged-in profile
  const loadProfileTasks = (userId: string) => {
    currentUserId.value = userId
    const storageKey = `kanban-tasks-${userId}`
    const savedTasks = localStorage.getItem(storageKey)
    
    if (savedTasks) {
      try {
        tasks.value = JSON.parse(savedTasks)
      } catch (e) {
        loadDefaults()
      }
    } else {
      loadDefaults()
    }
    
    if (localStorage.getItem('sb-workspace-theme')) {
      currentTheme.value = localStorage.getItem('sb-workspace-theme') || 'space-dark'
    }
  }

  const loadDefaults = () => {
    tasks.value = [
      { id: '1', title: 'Your Dashboard initialized!', status: 'todo', priority: 'medium', subtasks: [] }
    ]
  }

  watch(tasks, (newTasks) => {
    if (currentUserId.value) {
      localStorage.setItem(`kanban-tasks-${currentUserId.value}`, JSON.stringify(newTasks))
    }
  }, { deep: true })

  const changeTheme = (themeName: string) => {
    currentTheme.value = themeName
    localStorage.setItem('sb-workspace-theme', themeName)
  }

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

  const onDragStart = (taskId: string) => { draggedTaskId.value = taskId }
  const onDragOver = (status: 'todo' | 'in-progress' | 'done') => { activeDropZone.value = status }
  const onDragLeave = () => { activeDropZone.value = null }

  const onDrop = (newStatus: 'todo' | 'in-progress' | 'done') => {
    if (!draggedTaskId.value) return
    const task = tasks.value.find((t: Task) => t.id === draggedTaskId.value)
    if (task) { task.status = newStatus }
    draggedTaskId.value = null
    activeDropZone.value = null
  }

  const deleteTask = (taskId: string) => {
    tasks.value = tasks.value.filter((task: Task) => task.id !== taskId)
  }

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

  const cancelEdit = () => { editingTaskId.value = null }

  const openSubTaskInput = (taskId: string) => {
    currentlyAddingSubToTaskId.value = taskId
    newSubTaskTextValue.value = ''
  }

  const submitSubTask = (task: Task) => {
    if (!newSubTaskTextValue.value.trim()) {
      currentlyAddingSubToTaskId.value = null
      return
    }
    task.subtasks.push({
      id: `sub-${Date.now()}`,
      text: newSubTaskTextValue.value.trim(),
      isDone: false
    })
    currentlyAddingSubToTaskId.value = null
    newSubTaskTextValue.value = ''
  }

  const cancelSubTaskInput = () => { currentlyAddingSubToTaskId.value = null }
  
  const deleteSubTask = (task: Task, subTaskId: string) => {
    task.subtasks = task.subtasks.filter((sub: SubTask) => sub.id !== subTaskId)
  }

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
    const completed = task.subtasks.filter((s: SubTask) => s.isDone).length
    return Math.round((completed / task.subtasks.length) * 100)
  }

  const getPriorityWeight = (priority: 'low' | 'medium' | 'high') => {
    if (priority === 'high') return 3
    if (priority === 'medium') return 2
    return 1
  }

  const todoTasks = computed(() => {
    const list = tasks.value.filter((t: Task) => t.status === 'todo')
    return isPrioritySorted.value 
      ? [...list].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority))
      : list
  })

  const inProgressTasks = computed(() => {
    const list = tasks.value.filter((t: Task) => t.status === 'in-progress')
    return isPrioritySorted.value 
      ? [...list].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority))
      : list
  })

  const doneTasks = computed(() => {
    const list = tasks.value.filter((t: Task) => t.status === 'done')
    return isPrioritySorted.value 
      ? [...list].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority))
      : list
  })

  return {
    tasks,
    newTaskTitle,
    newTaskPriority,
    activeDropZone,
    editingTaskId,
    editingTitleValue,
    editingSubTaskId,
    editingSubTextValue,
    currentlyAddingSubToTaskId,
    newSubTaskTextValue,
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
  }
}
