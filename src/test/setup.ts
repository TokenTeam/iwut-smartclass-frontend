import { config } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import TDesign from 'tdesign-mobile-vue'

config.global.plugins = [ElementPlus]

config.global.plugins.push(TDesign)

config.global.components = {
  'el-icon': {
    template: '<div class="el-icon"></div>'
  },
  't-icon': {
    template: '<div class="t-icon"></div>'
  },
  't-loading': {
    template: '<div class="t-loading"></div>'
  },
  't-button': {
    template: '<button class="t-button"></button>'
  }
}

export const mockLocation = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: {
      search
    },
    writable: true
  })
}

export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
