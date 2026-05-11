// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { createApp, ref, nextTick } from 'vue'
import { useValidation } from '../vue'

describe('useValidation', () => {
  it('reactively validates values', async () => {
    const value = ref('')
    const { isValid, errors } = useValidation(value, ['required'])

    await nextTick()
    expect(isValid.value).toBe(false)
    expect(errors.value.length).toBe(1)

    value.value = 'ok'
    await nextTick()

    expect(isValid.value).toBe(true)
    expect(errors.value.length).toBe(0)
  })

  it('re-validates on every subsequent ref change, not just on mount', async () => {
    const value = ref('')
    const { isValid } = useValidation(value, [{ rule: 'min', params: { length: 3 } }])

    expect(isValid.value).toBe(false)

    value.value = 'abc'
    await nextTick()
    expect(isValid.value).toBe(true)

    value.value = 'xy'
    await nextTick()
    expect(isValid.value).toBe(false)

    value.value = 'longer string'
    await nextTick()
    expect(isValid.value).toBe(true)
  })

  it('works with object-form rules (rule + params)', async () => {
    const value = ref('ab')
    const { isValid, errors } = useValidation(value, [
      { rule: 'min', params: { length: 3 }, message: 'too short' },
    ])

    await nextTick()
    expect(isValid.value).toBe(false)
    expect(errors.value).toEqual(['too short'])

    value.value = 'abcd'
    await nextTick()
    expect(isValid.value).toBe(true)
    expect(errors.value).toEqual([])
  })

  it('manual validate() agrees with reactive watch', async () => {
    const value = ref('')
    const v = useValidation(value, [{ rule: 'min', params: { length: 3 } }])

    value.value = 'abc'
    await nextTick()
    const reactiveResult = v.isValid.value

    const manualResult = v.validate(value.value)

    expect(reactiveResult).toBe(true)
    expect(manualResult).toBe(true)
  })

  it('reactively re-validates when v-model updates the ref inside a mounted component', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    let api: ReturnType<typeof useValidation>
    let value: ReturnType<typeof ref<string>>

    const app = createApp({
      setup() {
        value = ref('')
        api = useValidation(value, [{ rule: 'min', params: { length: 3 } }])
        return { value, api }
      },
      template: `<input v-model="value" />`,
    })
    app.mount(container)

    const input = container.querySelector('input')!

    input.value = 'abc'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    expect(api!.isValid.value).toBe(true)

    input.value = 'ab'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    expect(api!.isValid.value).toBe(false)

    input.value = 'longer'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    expect(api!.isValid.value).toBe(true)

    app.unmount()
    container.remove()
  })
})
