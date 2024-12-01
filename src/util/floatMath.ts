import { Decimal } from 'decimal.js'

export const divide = (a: number, b: number): number => new Decimal(a).div(b).toNumber()

export const multiply = (a: number, b: number): number => new Decimal(a).mul(b).toNumber()

export const subtract = (a: number, b: number): number => new Decimal(a).sub(b).toNumber()

export const add = (a: number, b: number): number => new Decimal(a).add(b).toNumber()
