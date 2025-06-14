<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { User, MapLocation, Calendar, Clock } from '@element-plus/icons-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import katex from 'katex'
import hljs from 'highlight.js'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/atom-one-dark.css'

import { copyToClipboard } from '@/utils/clipboard.ts'
import { useCourseStore } from '@/stores/course'
import { useCourseUIStore } from '@/stores/course-ui.ts'

const courseStore = useCourseStore()
const uiStore = useCourseUIStore()

const date = ref('')

const handleVideoLoad = () => {
  courseStore.isVideoLoaded = true
}

const renderLatex = (text: string) => {
  // 处理 LaTeX 代码块 (用 $$ 包裹)
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, { displayMode: true, throwOnError: false })
    } catch (e) {
      console.error('LaTeX error:', e)
      return match
    }
  })

  // 处理行内 LaTeX (用 $ 包裹)
  text = text.replace(/\$(.+?)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, { displayMode: false, throwOnError: false })
    } catch (e) {
      console.error('LaTeX error:', e)
      return match
    }
  })

  return text
}

const renderedSummary = computed(() => {
  if (!courseStore.summary) return ''

  // 先处理 Markdown 内容中的 LaTeX 公式
  const processedText = renderLatex(courseStore.summary)

  // 再将 Markdown 转换为 HTML
  const rawHtml = marked(processedText).toString()

  // 最后使用 DOMPurify 过滤 HTML
  return DOMPurify.sanitize(rawHtml)
})

// 处理代码块高亮
const applyHighlight = () => {
  nextTick(() => {
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })
  })
}

marked.setOptions({
  highlight: function (code: string, language: string) {
    if (language && hljs.getLanguage(language)) {
      try {
        return hljs.highlight(code, { language }).value
      } catch {
        return code
      }
    }
    return hljs.highlightAuto(code).value
  },
  langPrefix: 'hljs language-',
} as never)

watch(renderedSummary, () => {
  if (renderedSummary.value) {
    applyHighlight()
  }
})

onMounted(async () => {
  document.title = '课程回顾'

  try {
    const queryParams = new URLSearchParams(window.location.search)
    const dateParam = queryParams.get('date')
    const courseNameParam = queryParams.get('course')

    if (dateParam) date.value = dateParam
    if (courseNameParam) courseStore.courseName = decodeURIComponent(courseNameParam)

    await courseStore.fetchCourseData(courseStore.courseName, date.value)
    document.title = `${courseStore.courseName} - 课程回顾`
  } catch (error) {
    console.error('Failed to load course data:', error)
  }

  applyHighlight()
})

defineExpose({
  courseName: courseStore.courseName,
  courseTeacher: courseStore.courseTeacher,
  courseLocation: courseStore.courseLocation,
  summaryStatus: courseStore.summaryStatus,
  activeTab: uiStore.activeTab,
  isVideoLoaded: courseStore.isVideoLoaded,
  generateCourseSummary: courseStore.generateCourseSummary,
  switchTab: uiStore.switchTab,
  handleVideoLoad,
})
</script>

<template>
  <div class="mobile-container">
    <div class="video-container">
      <div class="video-wrapper">
        <div class="video-placeholder">
          <t-loading
            v-if="!courseStore.isVideoLoaded && courseStore.courseVideo"
            class="video-loading"
            loading
            theme="circular"
            size="52px"
          />
          <div v-if="!courseStore.courseVideo" class="no-video-message">暂无视频</div>
          <iframe
            v-else
            :src="courseStore.courseVideo"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen
            @load="handleVideoLoad"
          ></iframe>
        </div>
      </div>

      <div class="tab-bar">
        <div class="tab-item" :class="{ active: uiStore.activeTab === 'info' }" @click="uiStore.switchTab('info')">
          <span>课程信息</span>
        </div>
        <div
          class="tab-item"
          :class="{ active: uiStore.activeTab === 'summary' }"
          @click="uiStore.switchTab('summary')"
        >
          <img src="/ai.svg" alt="AI" class="tab-icon" />
          <span>AI智能总结</span>
        </div>
      </div>
    </div>

    <div
      class="content-area"
      :class="{ 'with-button': uiStore.activeTab === 'summary' && courseStore.summaryStatus === '' && courseStore.courseVideo }"
    >
      <div v-if="courseStore.isLoading" class="loading-overlay">
        <div class="loading-content">
          <t-loading loading theme="circular" size="52px" />
          <span class="loading-text">加载中</span>
        </div>
      </div>

      <div v-if="uiStore.activeTab === 'info'" class="tab-content info-content active">
        <h2>{{ courseStore.courseName }}</h2>
        <p class="info-item">
          <el-icon>
            <User />
          </el-icon>
          {{ courseStore.courseTeacher }}
        </p>
        <p class="info-item">
          <el-icon>
            <MapLocation />
          </el-icon>
          {{ courseStore.courseLocation }}
        </p>
        <p class="info-item">
          <el-icon>
            <Calendar />
          </el-icon>
          {{ courseStore.courseDate }}
        </p>
        <p class="info-item">
          <el-icon>
            <Clock />
          </el-icon>
          {{ courseStore.courseTime }}
        </p>
      </div>

      <div v-else-if="uiStore.activeTab === 'summary'" class="tab-content summary-content active">
        <div class="summary-header">
          <h2>AI智能总结</h2>
          <t-button
            variant="text"
            size="small"
            @click="uiStore.toggleFunctionArea"
            class="function-toggle"
            :class="{ expanded: uiStore.isFunctionAreaExpanded }"
          >
            <template #icon>
              <t-icon name="setting" />
            </template>
            工具箱
          </t-button>
        </div>

        <div v-if="courseStore.summary && uiStore.isFunctionAreaExpanded" class="function-area">
          <div class="function-container">
            <t-button
              size="small"
              variant="outline"
              @click="courseStore.generateCourseSummary('regenerate')"
              class="function-btn"
            >
              <template #icon>
                <t-icon name="refresh" />
              </template>
              重新生成
            </t-button>

            <t-button
              size="small"
              variant="outline"
              @click="copyToClipboard(courseStore.summary, uiStore.setCopyStatus)"
              class="function-btn"
            >
              <template #icon>
                <t-icon :name="uiStore.copyStatus ? 'check-circle-filled' : 'file-copy'" />
              </template>
              {{ uiStore.copyStatus ? '已复制' : '复制Markdown' }}
            </t-button>
          </div>
        </div>

        <div v-if="courseStore.summary" class="ai-warning-banner">
          <t-icon name="info-circle" class="warning-icon"></t-icon>
          <span>内容由AI生成，请注意分辨</span>
        </div>

        <p v-if="courseStore.summaryStatus === 'generating'" class="generating-status">
          <t-loading size="small" style="margin-right: 8px" />
          <span>生成中...请稍后查看...</span>
        </p>
        <div v-else-if="courseStore.summary">
          <div class="markdown-content" v-html="renderedSummary"></div>
          <div v-if="courseStore.summaryModel && courseStore.summaryToken" class="summary-meta">
            <div class="meta-item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="transparent"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"
                ></path>
                <path
                  d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"
                ></path>
                <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path>
                <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"></path>
                <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"></path>
                <path d="M3.477 10.896a4 4 0 0 1 .585-.396"></path>
                <path d="M19.938 10.5a4 4 0 0 1 .585.396"></path>
                <path d="M6 18a4 4 0 0 1-1.967-.516"></path>
                <path d="M19.967 17.484A4 4 0 0 1 18 18"></path>
              </svg>
              <span>{{ courseStore.summaryModel }}</span>
            </div>
            <div class="meta-item">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="transparent"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="8" cy="8" r="6"></circle>
                <path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path>
                <path d="M7 6h1v4"></path>
                <path d="m16.71 13.88.7.71-2.82 2.82"></path>
              </svg>
              <span>{{ courseStore.summaryToken }}</span>
            </div>
          </div>
        </div>
        <p v-else>暂无内容</p>
      </div>
    </div>

    <div
      class="bottom-button-container"
      v-if="uiStore.activeTab === 'summary' && courseStore.summaryStatus === '' && courseStore.courseVideo"
    >
      <t-button
        theme="primary"
        size="medium"
        block
        @click="courseStore.generateCourseSummary('new')"
        class="generate-summary-btn"
      >
        生成AI摘要
      </t-button>
    </div>
  </div>
</template>

<style scoped>
.mobile-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--td-text-color-primary, var(--td-font-white-1));
  background-color: var(--td-bg-color-page);
  position: relative;
  user-select: none;
}

.video-container {
  width: 100%;
  transition: all 0.3s ease;
  overflow: hidden;
  background-color: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.video-wrapper {
  width: 100%;
  position: relative;
  padding-bottom: 56.25%;
}

.video-placeholder,
.video-placeholder iframe {
  position: absolute;
  border: none;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

.no-video-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--td-text-color-secondary);
  font-size: 16px;
}

.tab-bar {
  display: flex;
  justify-content: flex-start;
  padding-left: 16px;
  border-top: 1px solid var(--td-border-level-1-color);
  background-color: var(--td-bg-color-container);
  position: relative;
}

.tab-bar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--td-border-level-1-color);
}

.tab-item {
  flex: 0 0 auto;
  text-align: center;
  padding: 12px 12px;
  font-size: 14px;
  position: relative;
  cursor: pointer;
  transition: color 0.2s;
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.tab-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background-color: var(--td-brand-color);
  transition:
    width 0.3s ease,
    left 0.3s ease;
  z-index: 1;
}

.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  vertical-align: middle;
}

.tab-item span {
  transition: transform 0.2s ease;
}

.tab-item.active {
  color: var(--td-brand-color);
  font-weight: 500;
}

.tab-item.active::after {
  width: 60%;
  left: 20%;
}

.tab-item.active span {
  transform: scale(1.05);
}

.tab-item:active {
  background-color: var(--td-bg-color-container-active);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--td-bg-color-page);
  z-index: 100;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  margin-top: 16px;
  color: var(--td-text-color-primary);
  font-size: 18px;
}

.content-area {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  background-color: var(--td-bg-color-container);
  position: relative;
}

.content-area.with-button {
  padding-bottom: 80px;
}

.content-area::-webkit-scrollbar {
  width: 6px;
}

.content-area::-webkit-scrollbar-thumb {
  background-color: var(--td-scrollbar-color);
  border-radius: 2px;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background-color: var(--td-scrollbar-hover-color);
}

.content-area::-webkit-scrollbar-track {
  background-color: var(--td-scroll-track-color);
}

.info-item {
  margin: 0.3rem 0;
  display: flex;
  align-items: center;
}

.info-item .el-icon {
  margin-right: 8px;
}

.tab-content {
  animation: none;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  min-height: calc(100% - 32px);
}

.tab-content.active {
  opacity: 1;
  transform: translateY(0);
}

.bottom-button-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background-color: var(--td-bg-color-container);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-width: 600px;
  margin: 0 auto;
  border-top: 1px solid var(--td-border-level-1-color);
}

.generate-summary-btn {
  border-radius: 4px;
}

.generating-status {
  display: flex;
  align-items: center;
  color: var(--td-brand-color);
  justify-content: center;
  margin: 20px 0;
}

.generating-status span {
  display: inline-block;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.function-toggle {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.function-toggle:hover {
  background-color: var(--td-bg-color-container-hover);
}

.function-toggle .t-icon {
  transition: transform 0.3s ease;
}

.function-toggle.expanded .t-icon {
  transform: rotate(180deg);
}

.function-area {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.function-container {
  display: flex;
  padding: 4px 0;
  gap: 8px;
}

.function-btn {
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.function-btn:hover {
  color: var(--td-brand-color);
  border-color: var(--td-brand-color);
}

.ai-warning-banner {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-top: 8px;
  background-color: var(--td-bg-color-container-hover);
  border-radius: 4px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
  animation: fadeIn 0.3s ease;
}

.warning-icon {
  margin-right: 6px;
  font-size: 14px;
  color: var(--td-warning-color);
}

.summary-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  color: var(--td-text-color-secondary);
  font-size: 10px;
  opacity: 0.85;
  justify-content: flex-end;
}

.meta-item {
  display: flex;
  align-items: center;
  color: #999;
}

.meta-item svg {
  width: 12px;
  height: 12px;
  vertical-align: middle;
  margin-right: 4px;
  stroke: #999;
  fill: none;
}

.meta-item span {
  vertical-align: middle;
  margin-right: 8px;
  line-height: 1;
}

h2 {
  color: var(--td-brand-color);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

p {
  color: var(--td-text-color-secondary, var(--td-font-white-2));
  margin-top: 0.5rem;
}

/* Markdown styles */
.markdown-content {
  color: var(--td-text-color-secondary, var(--td-font-white-2));
  margin-top: 0.5rem;
  user-select: text;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: var(--td-warning-color-8);
  margin: 1rem 0 0.5rem;
}

.markdown-content :deep(h1) {
  font-size: 1.5rem;
}

.markdown-content :deep(h2) {
  font-size: 1.3rem;
}

.markdown-content :deep(p) {
  margin: 0.5rem 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.5rem;
}

.markdown-content :deep(pre) {
  background-color: var(--td-bg-color-page);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5rem 0;
  position: relative;
}

/* Markdown code highlight */
.markdown-content :deep(code.hljs) {
  padding: 0;
  background-color: transparent;
}

.markdown-content :deep(pre code.hljs) {
  display: block;
  font-family: 'Fira Code', Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
}

.markdown-content :deep(:not(pre) > code) {
  font-family: monospace;
  background-color: var(--td-bg-color-page);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.markdown-content :deep(a) {
  color: var(--td-brand-color);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid var(--td-brand-color);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--td-text-color-placeholder);
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid var(--td-border-level-1-color);
  padding: 0.5rem;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px dashed var(--td-border-level-2-color);
  margin-top: 8px;
  margin-bottom: 8px;
  height: 0;
  width: 100%;
}

/* KaTeX styles */
.markdown-content :deep(.katex) {
  font-size: 1.1em;
}

.markdown-content :deep(.katex-display) {
  margin: 1rem 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.5rem 0;
}

.markdown-content :deep(.katex-display > .katex) {
  max-width: 100%;
}

.markdown-content :deep(.katex .base) {
  color: var(--td-text-color-primary);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
