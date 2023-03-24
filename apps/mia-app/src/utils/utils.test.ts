import { it, describe, expect } from 'vitest'

import * as utils from './index'

describe('utils', () => {
  it('extractBotNamePrefix', () => {
    const tests: { in: string; name: string }[] = [
      {
        in: '好的，让我试一下。@dalle 请生成一幅可爱的红色猫娘图片。谢谢！',
        name: 'dalle',
      },
    ]

    for (const test of tests) {
      expect(utils.extractBotNamePrefix(test.in)).toMatchObject({
        name: test.name,
      })
    }
  })
})
