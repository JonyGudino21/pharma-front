import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // El menu laterañ iniai abierto en el desktop
  const sidebarCollapsed = ref(false)

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // NOTA: El modo oscuro ya lo maneja internamente

  return {
    sidebarCollapsed,
    toggleSidebar,
  }
})