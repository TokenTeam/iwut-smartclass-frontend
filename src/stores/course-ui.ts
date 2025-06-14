import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCourseUIStore = defineStore('ui', () => {
  const activeTab = ref('info')
  const isFunctionAreaExpanded = ref(false)
  const copyStatus = ref(false)

  const switchTab = (tab: string) => {
    activeTab.value = tab
  }

  const toggleFunctionArea = () => {
    isFunctionAreaExpanded.value = !isFunctionAreaExpanded.value
  }

  const setCopyStatus = (status: boolean) => {
    copyStatus.value = status
  }

  return {
    activeTab,
    isFunctionAreaExpanded,
    copyStatus,

    switchTab,
    toggleFunctionArea,
    setCopyStatus,
  }
})
