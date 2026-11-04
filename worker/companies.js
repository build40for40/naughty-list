// Manually checked B Lab directory records. This is a starter registry, not a
// complete directory or a live certification check. Never invent identifiers.
export default [
  {
    id: 'patagonia',
    name: 'Patagonia',
    aliases: ['Patagonia, Inc.', 'Patagonia Inc'],
    domains: ['patagonia.com', 'www.patagonia.com'],
    domainEvidence: {
      sourceUrl: 'https://www.bcorporation.net/en-us/find-a-b-corp/company/patagonia-inc/',
      checkedAt: '2026-11-04'
    },
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
    domains: ['tonyschocolonely.com', 'www.tonyschocolonely.com'],
    domainEvidence: {
      sourceUrl: 'https://www.bcorporation.net/en-us/find-a-b-corp/company/tonys-chocolonely/',
      checkedAt: '2026-11-04'
    },
    identifiers: [{ scheme: 'b_lab', value: 'tonys-chocolonely' }],
    bCorp: {
      certified: true,
      sourceUrl: 'https://www.bcorporation.net/en-us/find-a-b-corp/company/tonys-chocolonely/',
      checkedAt: '2026-11-04',
      validUntil: '2026-12-04'
    }
  },
  {
    // Hand-checked absence: searched the B Lab directory for "H&M", "H&M Group"
    // and "Hennes & Mauritz" on 2026-11-04; no H&M listing. No b_lab identifier exists.
    id: 'hm',
    name: 'H&M',
    aliases: ['H & M', 'H&M Group', 'H & M Hennes & Mauritz AB', 'Hennes & Mauritz'],
    domains: ['www2.hm.com', 'www.hm.com'],
    domainEvidence: {
      sourceUrl: 'https://hmgroup.com/brands/',
      checkedAt: '2026-11-04'
    },
    identifiers: [],
    bCorp: {
      certified: false,
      sourceUrl: 'https://www.bcorporation.net/en-us/find-a-b-corp/?query=H%26M',
      checkedAt: '2026-11-04',
      validUntil: '2026-12-04'
    }
  }
];
