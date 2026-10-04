import { describe, expect, it } from 'vitest'
import { apiErrorMessage } from '~/lib/apiErrors'

describe('safe BFF business-error feedback', () => {
  it('unwraps the H3 boolean error marker instead of rendering it', () => {
    expect(apiErrorMessage({ data: { error: true, data: { error: 'Fixture conflict' } } }, 'Fallback')).toBe('Fixture conflict')
  })
  it('handles direct backend and response-wrapped business errors', () => {
    expect(apiErrorMessage({ data: { error: 'Fixture denied' } }, 'Fallback')).toBe('Fixture denied')
    expect(apiErrorMessage({ response: { _data: { error: true, data: { error: 'Fixture conflict' } } } }, 'Fallback')).toBe('Fixture conflict')
  })
  it('handles backend ProblemDetails detail', () => {
    expect(apiErrorMessage({ data: { detail: 'Fixture validation' } }, 'Fallback')).toBe('Fixture validation')
  })
  it.each([null, undefined, { message: 'Internal diagnostic' }, { data: { error: true } }, { data: { error: '' } }, { data: { error: {} } }])(
    'uses the safe fallback for non-message shapes', error => {
      expect(apiErrorMessage(error, 'Fallback')).toBe('Fallback')
    },
  )
})
