import { describe, expect, it } from 'vitest'
import { parseRosterText } from './ocr'

describe('parseRosterText', () => {
  it('recognizes catalog champions and nearby progression values', () => {
    const result = parseRosterText(`
      CHAMPIONS 12 / 89
      Jon Snow
      Lvl 68 211420
      Tyrion Lannister
      Lvl 62 174230
    `)

    expect(result.map((champion) => champion.name)).toEqual(['Jon Snow', 'Tyrion Lannister'])
    expect(result[0]).toMatchObject({ level: 68, power: 211420 })
    expect(result[1]).toMatchObject({ level: 62, power: 174230 })
  })

  it('tolerates a small OCR error in a champion name', () => {
    const result = parseRosterText('Oberyn Marte11\n58 151870')
    expect(result[0]).toMatchObject({ name: 'Oberyn Martell', level: 58, power: 151870 })
  })

  it('does not create duplicate champions', () => {
    expect(parseRosterText('Arya Stark\nArya Stark\n51 119840')).toHaveLength(1)
  })
})
