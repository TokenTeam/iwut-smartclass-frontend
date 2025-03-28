/**
 * Gets a configuration value from environment variables
 * @param key The configuration key
 * @param defaultValue The default value if not found
 * @returns The configuration value
 */
const getConfigValue = (key: string, defaultValue?: string): string => {
  return import.meta.env[key] || defaultValue || ''
}

interface Config {
  api: {
    baseUrl: string
    timeout: number
  }
}

const isDev = import.meta.env.MODE === 'development'

const config: Config = {
  api: {
    baseUrl: isDev ? '/api' : getConfigValue('VITE_API_BASE_URL', ''),
    timeout: parseInt(getConfigValue('VITE_API_TIMEOUT', '10000'), 10)
  }
}

export default config
