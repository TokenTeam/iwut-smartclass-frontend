import { post } from '@/utils/request'
import { ref } from 'vue'

interface SummaryResponse {
  code: number
  msg: string
  data: {
    sub_id: number
    summary_status: string
  }
}

interface SummaryData {
  subID: number
  summaryStatus: string
}

export const generateSummary = async (subID: number, token: string, task: string): Promise<SummaryData | undefined> => {
  const errorMessage = ref('')

  const postData = {
    "sub_id": subID,
    "token": token,
    "task": task,
  }

  try {
    const response = (await post('/generateSummary', postData, errorMessage)) as unknown
    if (response && typeof response === 'object' && 'code' in response && 'data' in response) {
      const courseResponse = response as SummaryResponse
      if (courseResponse.code === 200 && courseResponse.data) {
        return {
          subID: courseResponse.data.sub_id,
          summaryStatus: courseResponse.data.summary_status,
        }
      }
    }
    return undefined
  } catch (error) {
    console.error('Failed to fetch:', error)
    return undefined
  }
}
