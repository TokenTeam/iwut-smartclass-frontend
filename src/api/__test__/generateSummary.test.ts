import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSummary } from '@/api/generateSummary.ts'
import { post } from '@/utils/request.ts'

vi.mock('@/utils/request', () => ({
  post: vi.fn(),
}))

describe('generateSummary API', () => {
  const mockSubID = 101
  const mockToken = 'test-token'
  const mockTask = 'generate_summary'

  const mockSuccessResponse = {
    code: 200,
    msg: 'success',
    data: {
      sub_id: 101,
      summary_status: 'processing',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully generate summary', async () => {
    vi.mocked(post).mockResolvedValue(mockSuccessResponse)

    const result = await generateSummary(mockSubID, mockToken, mockTask)

    expect(post).toHaveBeenCalledWith(
      '/generateSummary',
      {
        sub_id: mockSubID,
        token: mockToken,
        task: mockTask,
      },
      expect.any(Object),
    )

    expect(result).toEqual({
      subID: 101,
      summaryStatus: 'processing',
    })
  })

  it('should return undefined when API returns non-200 code', async () => {
    vi.mocked(post).mockResolvedValue({
      code: 400,
      msg: 'error',
      data: null,
    })

    const result = await generateSummary(mockSubID, mockToken, mockTask)

    expect(result).toBeUndefined()
  })

  it('should return undefined when API call fails', async () => {
    vi.mocked(post).mockRejectedValue(new Error('Network error'))

    const result = await generateSummary(mockSubID, mockToken, mockTask)

    expect(result).toBeUndefined()
  })

  it('should return undefined when response format is invalid', async () => {
    vi.mocked(post).mockResolvedValue({
      invalid: 'response',
    })

    const result = await generateSummary(mockSubID, mockToken, mockTask)

    expect(result).toBeUndefined()
  })
})
