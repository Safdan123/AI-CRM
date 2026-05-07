import type { To } from 'react-router-dom'
import { paths } from './paths'

export type FooterLinkItem = { label: string; to: To }

export type FooterColumn = {
  title: string
  links: FooterLinkItem[]
}

/** Footer navigation — wire to real routes as pages exist; placeholders use paths above. */
export const footerColumns: FooterColumn[] = [
  {
    title: 'Business',
    links: [
      { label: 'Browse Offers', to: paths.business.offers },
      { label: 'How to Invest', to: paths.business.invest },
      { label: 'How to Raise Funds', to: paths.business.raiseFunds },
      { label: 'Credit Card', to: paths.business.creditCard },
      { label: 'Mabrook Tokens', to: paths.business.mabrookTokens },
      { label: 'Mabrook Shares', to: paths.business.mabrookShares },
      { label: 'Liquidity', to: paths.business.liquidity },
      { label: 'Benefits', to: paths.business.benefits },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: paths.about },
      { label: 'Contact & Location', to: paths.contact },
      { label: 'Browse Offers', to: paths.business.offers },
      { label: 'How to Invest', to: paths.business.invest },
      { label: 'How to Raise Funds', to: paths.business.raiseFunds },
      { label: 'Credit Card', to: paths.business.creditCard },
      { label: 'Mabrook Tokens', to: paths.business.mabrookTokens },
      { label: 'Mabrook Shares', to: paths.business.mabrookShares },
    ],
  },
  {
    title: 'Documents',
    links: [
      { label: 'Browse Offers', to: paths.business.offers },
      { label: 'How to Invest', to: paths.business.invest },
      { label: 'How to Raise Funds', to: paths.business.raiseFunds },
      { label: 'Credit Card', to: paths.business.creditCard },
      { label: 'Mabrook Tokens', to: paths.business.mabrookTokens },
      { label: 'Mabrook Shares', to: paths.business.mabrookShares },
      { label: 'Liquidity', to: paths.business.liquidity },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Browse Offers', to: paths.business.offers },
      { label: 'How to Invest', to: paths.business.invest },
      { label: 'How to Raise Funds', to: paths.business.raiseFunds },
      { label: 'Credit Card', to: paths.business.creditCard },
      { label: 'Mabrook Tokens', to: paths.business.mabrookTokens },
    ],
  },
]

export const legalLinks: FooterLinkItem[] = [
  { label: 'Legal Agreements', to: paths.legal.agreements },
  { label: 'Privacy Policy', to: paths.legal.privacy },
  { label: 'Complaints', to: paths.legal.complaints },
  { label: 'Customer Vulnerability', to: paths.legal.vulnerability },
  { label: 'Cookie Policy', to: paths.legal.cookies },
]
