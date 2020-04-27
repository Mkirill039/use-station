import { useTranslation } from 'react-i18next'
import { Dictionary } from 'ramda'
import { VotesPage, VotesData, VoteItem } from '../types'
import { gt, sum, toNumber } from '../utils'
import useFinder from '../hooks/useFinder'
import useFCD from '../api/useFCD'
import { getVoter } from '../pages/governance/helpers'

/** tabs */
export const useVoteOptions = (
  count: Dictionary<number>
): { key: string; label: string }[] => {
  const { Yes, No, NoWithVeto, Abstain } = count
  const total = toNumber(sum([Yes, No, NoWithVeto, Abstain]))
  const { t } = useTranslation()

  return [
    {
      key: '',
      label: `${t('Common:All')} (${total})`
    },
    {
      key: 'Yes',
      label: `${t('Page:Governance:Yes')} (${Yes})`
    },
    {
      key: 'No',
      label: `${t('Page:Governance:No')} (${No})`
    },
    {
      key: 'NoWithVeto',
      label: `${t('Page:Governance:NoWithVeto')} (${NoWithVeto})`
    },
    {
      key: 'Abstain',
      label: `${t('Page:Governance:Abstain')} (${Abstain})`
    }
  ]
}

interface Params {
  id: string
  option: string
  page: number
}

export default ({ id, option, page }: Params): VotesPage => {
  const { t } = useTranslation()
  const getLink = useFinder()

  /* api */
  const url = `/v1/gov/proposals/${id}/votes`
  const params = { option, page }
  const response = useFCD<VotesData>({ url, params })

  /* render */
  const render = ({ totalCnt, page, limit, votes }: VotesData) =>
    Object.assign(
      {
        pagination: {
          totalCnt: Number(totalCnt),
          page: Number(page),
          limit: Number(limit)
        }
      },
      !gt(totalCnt, 0)
        ? {
            card: {
              content: t('Page:Governance:No votes yet')
            }
          }
        : {
            table: {
              headings: {
                voter: t('Page:Governance:Voter'),
                answer: t('Page:Governance:Answer'),
                hash: t('Common:Tx:Tx')
              },
              contents: votes.map(({ voter, answer, txhash }: VoteItem) => ({
                voter: getVoter(voter, getLink),
                answer: t('Page:Governance:' + answer),
                hash: {
                  link: getLink?.({ q: 'tx', v: txhash }) ?? '',
                  text: txhash
                }
              }))
            }
          }
    )

  return Object.assign(
    { title: '' },
    response,
    response.data && { ui: render(response.data) }
  )
}
