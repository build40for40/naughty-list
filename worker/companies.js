// Manually checked B Lab directory records. This is a starter registry, not a
// complete directory or a live certification check. Never invent identifiers.
export default [
  {
    id: 'patagonia',
    name: 'Patagonia',
    aliases: ['Patagonia, Inc.', 'Patagonia Inc'],
    identifiers: [{ scheme: 'b_lab', value: 'patagonia-inc' }],
    bCorp: {
      certified: true,
      sourceUrl: 'https://www.bcorporation.net/en-us/find-a-b-corp/company/patagonia-inc/',
      checkedAt: '2026-11-04',
      validUntil: '2026-12-04'
    }
  },
  {
    id: 'tonys-chocolonely',
    name: "Tony's Chocolonely",
    aliases: ['Tonys Chocolonely', 'Tony’s Chocolonely'],
    identifiers: [{ scheme: 'b_lab', value: 'tonys-chocolonely' }],
    bCorp: {
      certified: true,
      sourceUrl: 'https://www.bcorporation.net/en-us/find-a-b-corp/company/tonys-chocolonely/',
      checkedAt: '2026-11-04',
      validUntil: '2026-12-04'
    }
  }
];
