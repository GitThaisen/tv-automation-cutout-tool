import { assert, refute } from '@sinonjs/referee'
import deepFreeze from 'deep-freeze-es6'

import { get, set, write } from './config.js'

describe('Config module', () => {
	beforeEach(() => {
		write({})
	})

	describe('get/set', () => {
		it('should handle a root level property', () => {
			const path = 'lol'
			const expected = 'some value'

			set(path, expected)
			const actual = get(path)

			assert.equals(actual, expected)
		})

		it('should handle a sublevel property', () => {
			const path = 'lol.hehe'
			const expected = 'some other value'

			set(path, expected)
			const actual = get(path)

			assert.equals(actual, expected)
		})

		it('should preserve existing values for properties that are already objects', () => {
			const existingConfig = { lol: { hehe: 'an existing value' } }
			const expectedPreserved = existingConfig.lol.hehe
			const path = 'lol.haha'
			const expected = 'yet another value'

			write(existingConfig)
			set(path, expected)
			const actual = get(path)
			const preserved = get('lol.hehe')

			assert.equals(actual, expected)
			refute.isUndefined(preserved)
			assert.equals(preserved, expectedPreserved)
		})
	})

	describe('write', () => {
		it('should clone the value so that changes to the config does not change the original input', () => {
			const existingConfig = { lol: { hehe: 'an existing value' } }
			deepFreeze(existingConfig)

			write(existingConfig)
			set('lol.haha', 'a value by any other value')

			assert(true, 'Test did not throw an error.')
		})
	})
})
