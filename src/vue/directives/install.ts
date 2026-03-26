import type { App } from 'vue'
import { vRequired } from './vRequired'
import { vMinlength } from './vMinlength'
import { vMaxlength } from './vMaxlength'
import { vPattern } from './vPattern'
import { vMin } from './vMin'
import { vMax } from './vMax'
import { vType } from './vType'
import { vMessages } from './vMessages'
import { vMessage } from './vMessage'
import { vSubmit } from './vSubmit'
import { vFormGroup } from './vFormGroup'

export const VValidationPlugin = {
  install(app: App) {
    app.directive('required', vRequired)
    app.directive('minlength', vMinlength)
    app.directive('maxlength', vMaxlength)
    app.directive('pattern', vPattern)
    app.directive('min', vMin)
    app.directive('max', vMax)
    app.directive('type', vType)
    app.directive('messages', vMessages)
    app.directive('message', vMessage)
    app.directive('submit', vSubmit)
    app.directive('form-group', vFormGroup)
  }
}

export {
  vRequired,
  vMinlength,
  vMaxlength,
  vPattern,
  vMin,
  vMax,
  vType,
  vMessages,
  vMessage,
  vSubmit,
  vFormGroup,
}
