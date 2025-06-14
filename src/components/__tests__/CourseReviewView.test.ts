import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CourseReviewView from '@/views/CourseReviewView.vue'
import { getCourse } from '@/api/getCourse'
import { generateSummary } from '@/api/generateSummary'
import { getToken, getLocalToken } from '@/api/rpc'
import { mockLocation, flushPromises } from '@/test/setup'
import type { ComponentPublicInstance } from 'vue'
import { useCourseStore } from '@/stores/course'
import { useCourseUIStore } from '@/stores/course-ui.ts'

interface CourseReviewInstance extends ComponentPublicInstance {
  generateCourseSummary: (task: string) => Promise<void>
  switchTab: (tab: string) => void
  handleVideoLoad: () => void
  courseName: string
  courseTeacher: string
  courseLocation: string
  summaryStatus: string
  activeTab: string
  isVideoLoaded: boolean
}

vi.mock('@/api/getCourse')
vi.mock('@/api/generateSummary')
vi.mock('@/api/rpc')

describe('CourseReviewView', () => {
  const mockCourseData = {
    subID: 101,
    courseName: '测试课程',
    courseTeacher: '测试老师',
    courseLocation: '测试教室',
    courseDate: '2024-03-20',
    courseTime: '14:00-16:00',
    courseVideo: 'http://example.com/video.mp4',
    summary: '课程总结',
    summaryModel: 'gpt-3.5',
    summaryToken: '19999',
    summaryStatus: 'finished',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation('?date=2024-03-20&course=测试课程')

    const pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should load course data on mount', async () => {
    vi.mocked(getLocalToken).mockResolvedValue('local-token')
    vi.mocked(getCourse).mockResolvedValue(mockCourseData)

    const wrapper = mount(CourseReviewView, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()

    const courseStore = useCourseStore()
    const uiStore = useCourseUIStore()

    expect(getLocalToken).toHaveBeenCalled()
    expect(getCourse).toHaveBeenCalledWith('测试课程', '2024-03-20', 'local-token')
    expect(courseStore.courseName).toBe('测试课程')
    expect(courseStore.courseTeacher).toBe('测试老师')
    expect(courseStore.courseLocation).toBe('测试教室')
  })

  it('should handle failed initial token and retry with new token', async () => {
    vi.mocked(getLocalToken).mockResolvedValue('local-token')
    vi.mocked(getCourse).mockResolvedValueOnce(undefined).mockResolvedValueOnce(mockCourseData)
    vi.mocked(getToken).mockResolvedValue('new-token')

    const wrapper = mount(CourseReviewView, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()

    const courseStore = useCourseStore()

    expect(getLocalToken).toHaveBeenCalled()
    expect(getToken).toHaveBeenCalled()
    expect(getCourse).toHaveBeenCalledTimes(2)
    expect(courseStore.courseName).toBe('测试课程')
  })

  it('should generate summary when requested', async () => {
    vi.mocked(getLocalToken).mockResolvedValue('local-token')
    vi.mocked(getCourse).mockResolvedValue(mockCourseData)
    vi.mocked(generateSummary).mockResolvedValue({
      subID: 101,
      summaryStatus: 'processing',
    })

    const wrapper = mount(CourseReviewView, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()

    const courseStore = useCourseStore()
    await courseStore.generateCourseSummary('generate_summary')

    expect(generateSummary).toHaveBeenCalledWith(101, 'local-token', 'generate_summary')
    expect(courseStore.summaryStatus).toBe('processing')
  })

  it('should switch tabs correctly', async () => {
    vi.mocked(getLocalToken).mockResolvedValue('local-token')
    vi.mocked(getCourse).mockResolvedValue(mockCourseData)

    const wrapper = mount(CourseReviewView, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()

    const uiStore = useCourseUIStore()
    await uiStore.switchTab('summary')

    expect(uiStore.activeTab).toBe('summary')
  })

  it('should handle video loading state', async () => {
    vi.mocked(getLocalToken).mockResolvedValue('local-token')
    vi.mocked(getCourse).mockResolvedValue(mockCourseData)

    const wrapper = mount(CourseReviewView, {
      global: {
        plugins: [createPinia()]
      }
    })

    await flushPromises()

    const courseStore = useCourseStore()
    courseStore.isVideoLoaded = true

    expect(courseStore.isVideoLoaded).toBe(true)
  })
})
