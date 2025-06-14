import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCourse } from '@/api/getCourse'
import { generateSummary } from '@/api/generateSummary'
import { getToken, getLocalToken } from '@/api/rpc'
import type { CourseData } from '@/api/getCourse'

export const useCourseStore = defineStore('course', () => {
  const courseName = ref('')
  const courseTeacher = ref('')
  const courseLocation = ref('')
  const courseDate = ref('')
  const courseTime = ref('')
  const courseVideo = ref('')
  const subID = ref()
  const summary = ref('')
  const summaryModel = ref('')
  const summaryToken = ref('')
  const summaryStatus = ref('')

  const isLoading = ref(true)
  const isVideoLoaded = ref(false)

  const fetchCourseData = async (name: string, date: string) => {
    try {
      let token = await getLocalToken()
      let courseData: CourseData | undefined

      try {
        courseData = await getCourse(name, date, token)
        if (!courseData) {
          token = await getToken()
          courseData = await getCourse(name, date, token)
        }
      } catch {
        token = await getToken()
        try {
          courseData = await getCourse(name, date, token)
        } catch (innerError) {
          console.error('Failed to get course data even with new token:', innerError)
        }
      }

      if (courseData) {
        updateCourseData(courseData)
      }

      isLoading.value = false
    } catch (error) {
      console.error('Failed to load course data:', error)
    }
  }

  const updateCourseData = (data: CourseData) => {
    subID.value = data.subID
    courseTeacher.value = data.courseTeacher
    courseLocation.value = data.courseLocation
    courseDate.value = data.courseDate
    courseTime.value = data.courseTime
    courseVideo.value = data.courseVideo
    summary.value = data.summary
    summaryModel.value = data.summaryModel
    summaryToken.value = data.summaryToken
    summaryStatus.value = data.summaryStatus
  }
  
  const generateCourseSummary = async (task: string) => {
    try {
      const token = await getLocalToken()
      const result = await generateSummary(subID.value, token, task)
      summaryStatus.value = 'generating'
      console.log('Generating summary, SubID:', subID.value)
      if (result) {
        summaryStatus.value = result.summaryStatus
      }
    } catch (error) {
      console.error('Failed to generate summary:', error)
    }
  }

  return {
    courseName,
    courseTeacher,
    courseLocation,
    courseDate,
    courseTime,
    courseVideo,
    subID,
    summary,
    summaryModel,
    summaryToken,
    summaryStatus,
    isLoading,
    isVideoLoaded,

    fetchCourseData,
    generateCourseSummary,
    updateCourseData
  }
})
