import { post } from '@/utils/request'
import { ref } from 'vue'

interface CourseSummary {
  data: string
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
  courseName: string
  courseTeacher: string
  courseLocation: string
  courseDate: string
  courseTime: string
  courseVideo: string
  summary: string
}

export const getCourse = async (courseName: string, date:string, token: string): Promise<CourseData | undefined> => {
  const errorMessage = ref('')

  const postData = {
    "course_name": courseName,
    "date": date,
    "token": token
  }

  try {
    const response = await post('/getCourse', postData, errorMessage) as unknown
    if (response && typeof response === 'object' && 'code' in response && 'data' in response) {
      const courseResponse = response as CourseResponse
      if (courseResponse.code === 200 && courseResponse.data) {
        return {
          courseName: courseResponse.data.name,
          courseTeacher: courseResponse.data.teacher,
          courseLocation: courseResponse.data.location,
          courseDate: courseResponse.data.date,
          courseTime: courseResponse.data.time,
          courseVideo: courseResponse.data.video,
          summary: courseResponse.data.summary.data
        }
      }
    }
    return undefined
  } catch (error) {
    console.error('Failed to fetch course data:', error)
    return undefined
  }
}
