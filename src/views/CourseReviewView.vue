<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { User, MapLocation, Calendar, Clock } from '@element-plus/icons-vue'
import { getCourse } from '@/api/getCourse'
import { generateSummary } from '@/api/generateSummary.ts'

const activeTab = ref('info')
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

const generateCourseSummary = async () => {
  try {
    const result = await generateSummary(subID.value)
    summaryStatus.value = 'generating'
    console.log('Generating summary, SubID:', subID.value)
    if (result) {
      summaryStatus.value = result.summaryStatus
    }
  } catch (error) {
    console.error('Failed to generate summary:', error)
  }
}

onMounted(async () => {
  try {
    const queryParams = new URLSearchParams(window.location.search)
    const dateParam = queryParams.get('date')
    const tokenParam = queryParams.get('token')
    const courseNameParam = queryParams.get('courseName')

    if (dateParam) date.value = dateParam
    if (tokenParam) token.value = tokenParam
    if (courseNameParam) courseName.value = decodeURIComponent(courseNameParam)

    const courseData = await getCourse(courseName.value, date.value, token.value)
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
          <div v-if="!courseVideo" class="no-video-message">
            暂无视频
          </div>
          <iframe
            v-else
            :src="courseVideo"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            @load="handleVideoLoad"
          ></iframe>
        </div>
      </div>

      <div class="tab-bar">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'info' }"
          @click="switchTab('info')"
        >
          <span>信息</span>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'summary' }"
          @click="switchTab('summary')"
        >
          <span>摘要</span>
        </div>
      </div>
    </div>

    <div class="content-area" :class="{ 'with-button': activeTab === 'summary' && summaryStatus === '' && courseVideo }">
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
        <h2>AI摘要</h2>
        <p v-if="summaryStatus === 'generating'" class="generating-status">
          <t-loading size="small" style="margin-right: 8px" />
          <span>生成中...请稍后查看...</span>
        </p>
        <p v-else-if="summary">{{ summary }}</p>
        <p v-else>暂无摘要</p>
      </div>
    </div>

    <div class="bottom-button-container" v-if="activeTab === 'summary' && summaryStatus === '' && courseVideo">
      <t-button
        theme="primary"
        size="medium"
        block
        @click="generateCourseSummary"
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--td-bg-color-container);
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
  padding: 12px 24px;
  font-size: 14px;
  position: relative;
  cursor: pointer;
  transition: color 0.2s;
  margin-right: 8px;
}

.tab-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background-color: var(--td-brand-color);
  transition: width 0.3s ease, left 0.3s ease;
  z-index: 1;
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

.content-area {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  background-color: var(--td-bg-color-container);
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
  transition: opacity 0.3s ease, transform 0.3s ease;
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

h2 {
  color: var(--td-brand-color);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

p {
  color: var(--td-text-color-secondary, var(--td-font-white-2));
  margin-top: 0.5rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
