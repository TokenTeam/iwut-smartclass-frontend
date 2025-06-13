import { post } from '@/utils/request'
import { ref } from 'vue'

interface CourseSummary {
  data: string
  model: string
  token: string
  status: string
}

interface CourseResponse {
  code: number
  msg: string
  data: {
    course_id: number
    sub_id: number
    name: string
    teacher: string
    location: string
    date: string
    time: string
    video: string
    summary: CourseSummary
  }
}

interface CourseData {
  subID: number
  courseName: string
  courseTeacher: string
  courseLocation: string
  courseDate: string
  courseTime: string
  courseVideo: string
  summary: string
  summaryModel: string
  summaryToken: string
  summaryStatus: string
}

export const getCourse = async (
  courseName: string,
  date: string,
  token: string,
): Promise<CourseData | undefined> => {
  const errorMessage = ref('')

  const postData = {
    course_name: courseName,
    date: date,
    token: token,
  }

  try {
    const response = (await post('/getCourse', postData, errorMessage)) as unknown
    if (response && typeof response === 'object' && 'code' in response && 'data' in response) {
      const courseResponse = response as CourseResponse
      if (courseResponse.code === 200 && courseResponse.data) {
        return {
          subID: courseResponse.data.sub_id,
          courseName: courseResponse.data.name,
          courseTeacher: courseResponse.data.teacher,
          courseLocation: courseResponse.data.location,
          courseDate: courseResponse.data.date,
          courseTime: courseResponse.data.time,
          courseVideo: courseResponse.data.video,
          summary: courseResponse.data.summary.data,
          summaryModel: courseResponse.data.summary.model,
          summaryToken: courseResponse.data.summary.token,
          summaryStatus: courseResponse.data.summary.status,
        }
      }
    }
    return undefined
  } catch (error) {
    console.error('Failed to fetch:', error)
    return undefined
  }
}
