import { useCallback, useMemo } from 'react'
import { Dictionary } from 'ramda'
import { Result, ParsedRaw, ParsedLog, Base, PostError } from '../types'
import { times, div, ceil, floor } from '../utils/math'
import fcd from '../api/fcd'
import useFCD from '../api/useFCD'

export const config = { headers: { 'Content-Type': 'application/json' } }
export const useCalcFee = (denom: string) => {
  const url = '/v1/txs/gas_prices'
  const { data } = useFCD<Dictionary<string>>({ url })
  const amount = data?.[denom] ?? '0'

  const calcFee = useCallback(
    (gas: string) => {
      return ceil(times(gas, amount))
    },
    [amount]
  )

  const calcGas = useCallback(
    (fee: string) => {
      return floor(div(fee, amount))
    },
    [amount]
  )

  const calc = useMemo(
    () => ({ gasPrice: { amount, denom }, fee: calcFee, gas: calcGas }),
    [amount, calcFee, calcGas, denom]
  )

  return data ? calc : undefined
}

/* base */
type Latest = { block: { header: { chain_id: string } } }
type Account = Result<{ value: AccountValue | BaseAccountValue }>
type BaseAccountValue = { BaseVestingAccount: { BaseAccount: AccountValue } }
export const getBase = async (from: string): Promise<Base> => {
  const { data: latest } = await fcd.get<Latest>('/blocks/latest')
  const { chain_id } = latest.block.header

  const { data: account } = await fcd.get<Account>(`/auth/accounts/${from}`)
  const { account_number, sequence } = getValue(account)

  return {
    from,
    chain_id,
    account_number: String(account_number),
    sequence: String(sequence),
  }
}

type AccountValue = { account_number: string; sequence: string }
const getValue = ({ result: { value } }: Account): AccountValue =>
  'BaseVestingAccount' in value ? value.BaseVestingAccount.BaseAccount : value

/* error */
export const parseError = (
  e: PostError,
  defaultMessage: string = ''
): string => {
  try {
    if ('response' in e) {
      // API Error
      const { data } = e.response!

      if ('message' in data) {
        return data.message!
      } else if ('error' in data) {
        const { error } = data
        return typeof error === 'string'
          ? checkError(error!)
          : getMessage(error!)
      }
    }

    console.error(e)
    return defaultMessage
  } catch (e) {
    console.error(e)
    return defaultMessage
  }
}

export const checkError = (raw?: string): string => {
  if (!raw) {
    return ''
  } else {
    try {
      const parsed: ParsedRaw = JSON.parse(raw)
      return getMessage(parsed)
    } catch {
      return raw
    }
  }
}

const getMessage = (parsed: ParsedRaw): string => {
  if (Array.isArray(parsed)) {
    const { log } = parsed.find(({ success }) => !success) ?? {}
    const { message = '' }: ParsedLog = log ? JSON.parse(log) : {}
    return message
  } else if (typeof parsed === 'object') {
    const { message = '' } = parsed
    return message
  }

  return ''
}

export const stringify = (object: object): string | undefined => {
  const string = JSON.stringify(compact(object))
  return string === '{}' ? undefined : string
}

const compact = (object: object): object =>
  Object.entries(object).reduce(
    (acc, [key, value]) => Object.assign({}, acc, value && { [key]: value }),
    {}
  )
