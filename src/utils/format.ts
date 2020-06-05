import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'
import { Coin, DisplayCoin } from '../types'
import currencies from './currencies.json'

interface Config {
  integer?: boolean
}

export const decimal = (number: string = '0', p: number = 6): string =>
  new BigNumber(number).decimalPlaces(p, BigNumber.ROUND_DOWN).toFormat(p)

export const decimalN = (number: string = '0', p: number = 6): number =>
  new BigNumber(number).decimalPlaces(p, BigNumber.ROUND_DOWN).toNumber()

export const amount = (amount: string, config?: Config): string => {
  const number = new BigNumber(amount || 0).div(1e6) // amount can be ''
  return decimal(number.toString(), config?.integer ? 0 : 6)
}

export const amountN = (amount: string, config?: Config): number => {
  const number = new BigNumber(amount || 0).div(1e6) // amount can be ''
  return decimalN(number.toString(), config?.integer ? 0 : 6)
}

export const denom = (denom: string): string => {
  const invalid = !denom || !denom.startsWith('u')
  const unit = denom.slice(1).toUpperCase()
  return invalid
    ? ''
    : unit === 'LUNA'
    ? 'Luna'
    : currencies.includes(unit)
    ? unit.slice(0, 2) + 'T'
    : unit
}

export const display = (coin: Coin, config?: Config): DisplayCoin => {
  const value = amount(coin.amount, config)
  const unit = denom(coin.denom)
  return { value, unit }
}

export const coin = (coin: Coin, config?: Config): string => {
  const { value, unit } = display(coin, config)
  return [value, unit].join(' ')
}

export const toAmount = (input: string): string => {
  const number = new BigNumber(input ?? 0).times(1e6)
  return input ? number.decimalPlaces(0, BigNumber.ROUND_DOWN).toString() : '0'
}

export const toInput = (amount: string): string => {
  const number = new BigNumber(amount ?? 0).div(1e6)
  return amount ? number.decimalPlaces(6, BigNumber.ROUND_DOWN).toString() : '0'
}

export const date = (
  param: string | Date,
  config: { toLocale?: boolean; short?: boolean } = {}
): string => {
  const dt =
    typeof param === 'string'
      ? DateTime.fromISO(param)
      : DateTime.fromJSDate(param)

  const formatted = config.short
    ? dt.setLocale('en').toLocaleString(DateTime.DATE_MED)
    : config.toLocale
    ? dt.setLocale('en').toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)
    : dt.toFormat('yyyy.MM.dd HH:mm:ss')

  return param
    ? formatted + (!config.short ? ` (${dt.offsetNameShort || 'Local'})` : '')
    : ''
}

export const truncate = (address: string = '', [h, t]: number[]) => {
  const head = address.slice(0, h)
  const tail = address.slice(-1 * t, address.length)
  return !address
    ? ''
    : address.length > h + t
    ? [head, tail].join('...')
    : address
}
