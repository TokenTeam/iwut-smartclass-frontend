import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCourse } from '@/api/getCourse.ts'
import { post } from '@/utils/request.ts'

vi.mock('@/utils/request', () => ({
  post: vi.fn(),
}))

describe('getCourse API', () => {
  const mockCourseName = '测试课程'
  const mockDate = '2024-03-20'
  const mockToken = 'test-token'

  const mockSuccessResponse = {
    code: 200,
    msg: 'success',
    data: {
      course_id: 1,
      sub_id: 101,
      name: '测试课程',
      teacher: '测试老师',
      location: '测试教室',
      date: '2024-03-20',
      time: '14:00-16:00',
      video: 'http://example.com/video.mp4',
      summary: {
        data: '课程总结',
        model: 'gpt-3.5',
        token: '19999',
        status: 'finished',
      },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully fetch course data', async () => {
    vi.mocked(post).mockResolvedValue(mockSuccessResponse)

    const result = await getCourse(mockCourseName, mockDate, mockToken)

    expect(post).toHaveBeenCalledWith(
      '/getCourse',
      {
        course_name: mockCourseName,
        date: mockDate,
        token: mockToken,
      },
      expect.any(Object),
    )

    expect(result).toEqual({
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
    })
  })

  it('should return undefined when API returns non-200 code', async () => {
    vi.mocked(post).mockResolvedValue({
      code: 400,
      msg: 'error',
      data: null,
    })

    const result = await getCourse(mockCourseName, mockDate, mockToken)

    expect(result).toBeUndefined()
  })

  it('should return undefined when API call fails', async () => {
    vi.mocked(post).mockRejectedValue(new Error('Network error'))

    const result = await getCourse(mockCourseName, mockDate, mockToken)

    expect(result).toBeUndefined()
  })

  it('should return undefined when response format is invalid', async () => {
    vi.mocked(post).mockResolvedValue({
      invalid: 'response',
    })

    const result = await getCourse(mockCourseName, mockDate, mockToken)

    expect(result).toBeUndefined()
  })
})
