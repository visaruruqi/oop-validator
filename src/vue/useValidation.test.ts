import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
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
})
