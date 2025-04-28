<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { User, MapLocation, Calendar, Clock } from '@element-plus/icons-vue'
import { getCourse } from '@/api/getCourse'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import katex from 'katex'
import 'katex/dist/katex.min.css'

import { generateSummary } from '@/api/generateSummary.ts'
import { getToken, getLocalToken } from '@/api/rpc.ts'

const activeTab = ref('info')
const isLoading = ref(true)
const isVideoLoaded = ref(false)

const date = ref('')
const token = ref('')
const subID = ref()
const courseName = ref('')
const courseTeacher = ref('')
const courseLocation = ref('')
const courseDate = ref('')
const courseTime = ref('')
const courseVideo = ref('')
const summary = ref('')
const summaryStatus = ref('')

const switchTab = (tab: string) => {
  activeTab.value = tab
}

const handleVideoLoad = () => {
  isVideoLoaded.value = true
}

const generateCourseSummary = async (task: string) => {
  try {
    const result = await generateSummary(subID.value, token.value, task)
    summaryStatus.value = 'generating'
    console.log('Generating summary, SubID:', subID.value)
    if (result) {
      summaryStatus.value = result.summaryStatus
    }
  } catch (error) {
    console.error('Failed to generate summary:', error)
  }
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
  if (!summary.value) return ''

  // 先处理 Markdown 内容中的 LaTeX 公式
  const processedText = renderLatex(summary.value)

  // 再将 Markdown 转换为 HTML
  const rawHtml = marked(processedText).toString()

  // 最后使用 DOMPurify 过滤 HTML
  return DOMPurify.sanitize(rawHtml)
})

onMounted(async () => {
  document.title = '课程回顾'

  try {
    const queryParams = new URLSearchParams(window.location.search)
    const dateParam = queryParams.get('date')
    const courseNameParam = queryParams.get('course')

    if (dateParam) date.value = dateParam
    if (courseNameParam) courseName.value = decodeURIComponent(courseNameParam)

    token.value = await getLocalToken()
    let courseData

    try {
      courseData = await getCourse(courseName.value, date.value, token.value)
      if (!courseData) {
        token.value = await getToken()
        courseData = await getCourse(courseName.value, date.value, token.value)
      }
    } catch {
      token.value = await getToken()
      try {
        courseData = await getCourse(courseName.value, date.value, token.value)
      } catch (innerError) {
        console.error('Failed to get course data even with new token:', innerError)
      }
    }

    console.log(courseData)
    if (courseData) {
      subID.value = courseData.subID
      courseTeacher.value = courseData.courseTeacher
      courseLocation.value = courseData.courseLocation
      courseDate.value = courseData.courseDate
      courseTime.value = courseData.courseTime
      courseVideo.value = courseData.courseVideo
      summary.value = courseData.summary
      summaryStatus.value = courseData.summaryStatus
    }

    isLoading.value = false
    document.title = `${courseName.value} - 课程回顾`
  } catch (error) {
    console.error('Failed to load course data:', error)
  }
})
</script>

<template>
  <div class="mobile-container">
    <div class="video-container">
      <div class="video-wrapper">
        <div class="video-placeholder">
          <t-loading
            v-if="!isVideoLoaded && courseVideo"
            class="video-loading"
            loading
            theme="circular"
            size="52px"
          />
          <div v-if="!courseVideo" class="no-video-message">暂无视频</div>
          <iframe
            v-else
            :src="courseVideo"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen
            @load="handleVideoLoad"
          ></iframe>
        </div>
      </div>

      <div class="tab-bar">
        <div class="tab-item" :class="{ active: activeTab === 'info' }" @click="switchTab('info')">
          <span>课程信息</span>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'summary' }"
          @click="switchTab('summary')"
        >
          <img src="/ai.svg" alt="AI" class="tab-icon" />
          <span>AI智能总结</span>
        </div>
      </div>
    </div>

    <div
      class="content-area"
      :class="{ 'with-button': activeTab === 'summary' && summaryStatus === '' && courseVideo }"
    >
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <t-loading loading theme="circular" size="52px" />
          <span class="loading-text">加载中</span>
        </div>
      </div>

      <div v-if="activeTab === 'info'" class="tab-content info-content active">
        <h2>{{ courseName }}</h2>
        <p class="info-item">
          <el-icon><User /></el-icon>
          {{ courseTeacher }}
        </p>
        <p class="info-item">
          <el-icon><MapLocation /></el-icon>
          {{ courseLocation }}
        </p>
        <p class="info-item">
          <el-icon><Calendar /></el-icon>
          {{ courseDate }}
        </p>
        <p class="info-item">
          <el-icon><Clock /></el-icon>
          {{ courseTime }}
        </p>
      </div>

      <div v-else-if="activeTab === 'summary'" class="tab-content summary-content active">
        <h2>AI智能总结</h2>
        <div v-if="summary" class="functional-area">
          <div class="divider top-divider"></div>
          <div class="regenerate-container">
            <t-button
              size="small"
              variant="outline"
              @click="generateCourseSummary('regenerate')"
              class="regenerate-btn"
            >
              <template #icon>
                <t-icon name="refresh" />
              </template>
              重新生成
            </t-button>
          </div>
          <div class="divider bottom-divider"></div>
        </div>
        <p v-if="summaryStatus === 'generating'" class="generating-status">
          <t-loading size="small" style="margin-right: 8px" />
          <span>生成中...请稍后查看...</span>
        </p>
        <div v-else-if="summary" class="markdown-content" v-html="renderedSummary"></div>
        <p v-else>暂无内容</p>
      </div>
    </div>

    <div
      class="bottom-button-container"
      v-if="activeTab === 'summary' && summaryStatus === '' && courseVideo"
    >
      <t-button
        theme="primary"
        size="medium"
        block
        @click="generateCourseSummary('new')"
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

.functional-area {
  margin: 20px 0;
  padding: 16px 0;
  position: relative;
}

.divider {
  border-top: 1px dashed var(--td-border-level-2-color);
  position: absolute;
  left: 0;
  right: 0;
}

.top-divider {
  top: 0;
}

.bottom-divider {
  bottom: 0;
}

.regenerate-container {
  display: flex;
  padding: 4px 0;
}

.regenerate-btn {
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.regenerate-btn:hover {
  color: var(--td-brand-color);
  border-color: var(--td-brand-color);
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

.markdown-content {
  color: var(--td-text-color-secondary, var(--td-font-white-2));
  margin-top: 0.5rem;
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
}

.markdown-content :deep(code) {
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

/* KaTeX specific styles */
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
