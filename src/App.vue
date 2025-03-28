<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'

function syncThemeWithSystem() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
    document.documentElement.setAttribute('theme-mode', e.matches ? 'dark' : 'light')
  }
  updateTheme(mediaQuery)
  mediaQuery.addEventListener('change', updateTheme)
  return () => mediaQuery.removeEventListener('change', updateTheme)
}

onMounted(() => {
  const cleanup = syncThemeWithSystem()
  onUnmounted(cleanup)
})
</script>

<template>
  <RouterView />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: var(--td-bg-color-page);
  color: var(--td-text-color-primary);
}

#app {
  background-color: var(--td-bg-color-page);
}
</style>
