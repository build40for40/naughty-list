// Elf Cam badge mode: turns an assessment API response into what the badge shows.
// This file never returns 'naughty'. That state waits for the scoring work, and
// missing, ambiguous or stale evidence is always shown as unidentified.
(function (root) {
  const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  function formatDate(iso) {
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const time = Date.parse(`${iso}T00:00:00Z`);
    return Number.isNaN(time) ? null : DATE.format(time);
  }

  function safeUrl(url) {
    return typeof url === 'string' && url.startsWith('https://') ? url : null;
  }

  const UNKNOWN_LINES = {
    unreachable: "Can't reach the North Pole right now. No verdict.",
    not_listed: "This store isn't on the list yet. No verdict, naughty or nice.",
    stale: 'Our evidence is out of date. No verdict until the elves recheck.',
    no_evidence: 'No current evidence either way. No verdict.'
  };

  function unknown(reason, subject, bCorp) {
    return {
      verdict: 'unknown',
      reason,
      subject: subject ?? null,
      label: 'Unidentified',
      headline: 'Subject unidentified',
      line: UNKNOWN_LINES[reason],
      evidence: UNKNOWN_LINES[reason],
      sourceName: bCorp?.source?.name ?? null,
      sourceUrl: safeUrl(bCorp?.source?.url),
      checked: formatDate(bCorp?.checkedAt)
    };
  }

  // Returns null when badge mode does not apply (a multi-brand store).
  function badgeState(result) {
    if (!result) return unknown('unreachable');
    const { match, company } = result;
    const bCorp = result.criteria?.bCorp;
    if (match?.status !== 'matched' || !company) return unknown('not_listed');
    if (match.storeType !== 'single_brand') return null;
    if (bCorp?.status === 'verified' && bCorp.certified === true) {
      const checked = formatDate(bCorp.checkedAt);
      const sourceName = bCorp.source?.name ?? 'B Lab';
      return {
        verdict: 'nice',
        reason: null,
        subject: company.name,
        label: 'Nice ✓',
        headline: 'Nice ✓ Subject cleared',
        line: ['Certified B Corp', sourceName, checked && `checked ${checked}`].filter(Boolean).join(' · '),
        evidence: 'Certified B Corp',
        sourceName,
        sourceUrl: safeUrl(bCorp.source?.url),
        checked
      };
    }
    return unknown(bCorp?.reason === 'stale_evidence' ? 'stale' : 'no_evidence', company.name, bCorp);
  }

  root.NaughtyListVerdict = { badgeState, formatDate };
})(globalThis);
