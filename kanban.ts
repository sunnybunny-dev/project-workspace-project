export interface SubTask {
  id: string
  text: string
  isDone: boolean
}

export interface Task {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  subtasks: SubTask[]
}
export interface User {
  id: string
  username: string
  avatar: string
}