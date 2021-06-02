const csyPages = require('..')

// TODO: Implement module test
test('csy-pages', () => {
  expect(csyPages('w')).toBe('w@zce.me')
  expect(csyPages('w', { host: 'wedn.net' })).toBe('w@wedn.net')
  expect(() => csyPages(100)).toThrow('Expected a string, got number')
})
