/**
 * Copies the provided text to clipboard
 * @param text The text to copy to clipboard
 * @param onStatusChange Optional callback to handle copy status changes
 * @returns Promise that resolves when copy operation completes
 */
export const copyToClipboard = async (text: string, onStatusChange?: (status: boolean) => void) => {
  if (!text) {
    console.warn('Nothing to copy')
    return false
  }

  try {
    // 使用 Clipboard API
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      onStatusChange?.(true)
      console.log('Copied to clipboard using Clipboard API')
      setTimeout(() => onStatusChange?.(false), 2000)
      return true
    }

    // 对于不支持 Clipboard API 的浏览器
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '0'
    textArea.style.top = '0'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const success = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (success) {
      onStatusChange?.(true)
      console.log('Copied to clipboard using execCommand')
      setTimeout(() => onStatusChange?.(false), 2000)
      return true
    } else {
      throw new Error('execCommand copy operation failed')
    }
  } catch (e) {
    console.error('Copy operation failed:', e)
    alert('复制失败，请检查剪贴板权限')
    return false
  }
}
