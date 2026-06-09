import { ref } from 'vue'

// Define a structured TypeScript interface for the user profile
interface UserProfile {
  id: string
  username: string
  fullName?: string
  email: string
  avatar?: string
}

export function useAuth() {
  // Core authentication state
  const currentUser = ref<UserProfile | null>(null)
  const authError = ref<string>('')
  const isRegisterMode = ref<boolean>(false)

  // Interactive Form Inputs
  const fullNameInput = ref<string>('')
  const usernameInput = ref<string>('')
  const emailInput = ref<string>('')
  const passwordInput = ref<string>('')

  /**
   * Clears form inputs and error states when switching views
   */
  const resetFormFields = () => {
    fullNameInput.value = ''
    usernameInput.value = ''
    emailInput.value = ''
    passwordInput.value = ''
    authError.value = ''
  }

  /**
   * Handle account registration
   */
  const handleRegister = async () => {
    authError.value = ''
    
    if (!usernameInput.value || !emailInput.value) {
      authError.value = 'Please fill out all required fields.'
      return
    }

    try {
      // Mock network delay for registration pipeline
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Simulate successful account creation and sign the user in directly
      currentUser.value = {
        id: `user_${Date.now()}`,
        username: usernameInput.value.trim().toLowerCase(),
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        avatar: '🌸'
      }

      resetFormFields()
    } catch (err: any) {
      authError.value = err?.message || 'An error occurred during registration.'
    }
  }

  /**
   * Handle user login
   */
  const login = async () => {
    authError.value = ''

    if (!usernameInput.value) {
      authError.value = 'Profile username is required.'
      return
    }

    try {
      // Mock network delay for login environment validation
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Accept any login for local development purposes
      currentUser.value = {
        id: 'user_dev_123',
        username: usernameInput.value.trim(),
        fullName: fullNameInput.value.trim() || 'Sunny Bunny',
        email: emailInput.value.trim() || 'sunnybunny@example.com',
        avatar: '🌸'
      }

      resetFormFields()
    } catch (err: any) {
      authError.value = err?.message || 'Invalid username or password configuration.'
    }
  }

  /**
   * Handle user logout / profile switching
   */
  const logout = () => {
    currentUser.value = null
    resetFormFields()
  }

  // Return ALL properties so they can be successfully destructured by KanbanBoard.vue
  return {
    currentUser,
    authError,
    isRegisterMode,
    fullNameInput,
    usernameInput,
    emailInput,
    passwordInput,
    login,
    handleRegister,
    logout
  }
}