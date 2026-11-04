(() => {
  const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
  const normalizePosition = value => positions.includes(value) ? value : 'bottom-right';
  const settings = value => ({ enabled: value?.enabled !== false, position: normalizePosition(value?.position) });
  const hostname = value => {
    if (typeof value !== 'string') return null;
    const host = value.trim().toLowerCase().replace(/\.$/, '');
    const labels = host.split('.');
    return host.length <= 253 && labels.length > 1 && !/^\d+$/.test(labels.at(-1)) &&
      labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ? host : null;
  };

  function purchaseControls(document) {
    return [...document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]')].slice(0, 400).filter(element => {
      if (element.disabled || element.getAttribute('aria-disabled') === 'true' || element.closest('[hidden], [aria-hidden="true"]')) return false;
      const label = `${element.getAttribute('aria-label') ?? ''} ${element.textContent ?? ''} ${element.value ?? ''}`.trim();
      if (!/\b(add\s+to\s+(cart|basket|bag)|buy\s+(now|it\s+now)|pre[ -]?order|purchase\s+now)\b/i.test(label)) return false;
      for (let node = element; node?.nodeType === 1; node = node.parentElement) {
        const style = document.defaultView?.getComputedStyle(node);
        if (style?.display === 'none' || style?.visibility === 'hidden') return false;
      }
      return !element.matches(':disabled');
    });
  }

  function shoppingSignals(document) {
    let product = false;
    let offer = false;
    let price = false;
    let visited = 0;
    const hasType = (value, type) => [value].flat().some(item => typeof item === 'string' && item.split(/[\/#]/).at(-1) === type);
    const amount = value => typeof value === 'number' ? Number.isFinite(value) && value >= 0
      : typeof value === 'string' && /\d/.test(value) && value.length < 80;
    const visit = (value, depth = 0) => {
      if (!value || typeof value !== 'object' || depth > 12 || ++visited > 3000) return;
      if (Array.isArray(value)) { for (const item of value) visit(item, depth + 1); return; }
      if (hasType(value['@type'], 'Product')) product = true;
      if (hasType(value['@type'], 'Offer') || hasType(value['@type'], 'AggregateOffer')) {
        if (amount(value.price ?? value.lowPrice ?? value.priceSpecification?.price)) offer = price = true;
      }
      if (value.offers && hasType(value['@type'], 'Product')) {
        for (const item of [value.offers].flat()) {
          if (item && amount(item.price ?? item.lowPrice)) offer = price = true;
        }
      }
      for (const item of Object.values(value)) visit(item, depth + 1);
    };
    for (const script of [...document.querySelectorAll('script[type="application/ld+json"]')].slice(0, 20)) {
      if (script.textContent.length > 250000) continue;
      try { visit(JSON.parse(script.textContent)); } catch { /* A broken block must not break shopping. */ }
    }
    product ||= Boolean(document.querySelector('[itemtype$="/Product"], [itemtype$="#Product"], meta[property="og:type"][content="product"]'));
    for (const element of [...document.querySelectorAll('[itemprop="price"], meta[property="product:price:amount"], meta[property="og:price:amount"], [data-price], .price, [class*="product-price"]')].slice(0, 100)) {
      if (amount(element.getAttribute('content') ?? element.getAttribute('data-price') ?? element.textContent?.trim())) price = true;
    }
    const purchaseControl = purchaseControls(document).length > 0;
    // Product markup appears in reviews/articles too. Require a priced offer and
    // an actionable purchase control; never transmit the extracted contents.
    return { product, offer, price, purchaseControl, candidate: purchaseControl && price && (product || offer) };
  }

  function viewModel(assessment) {
    const relevance = assessment?.relevance;
    const company = assessment?.company;
    const allowed = relevance?.eligibleForVerdict === true && relevance?.category === 'brand_shop' && company;
    const verdict = allowed && ['nice', 'naughty'].includes(assessment?.scoring?.verdict) ? assessment.scoring.verdict : null;
    const category = relevance?.category ?? 'unknown';
    if (verdict) return { tone: verdict, title: verdict === 'nice' ? 'On the nice list' : 'On the naughty list', message: `Business assessment for ${company.name}.` };
    if (category === 'marketplace' || category === 'retailer') return {
      tone: 'neutral', title: category === 'marketplace' ? 'Marketplace' : 'Retailer',
      message: 'This website does not identify the brand or seller of this product. No product verdict is available.'
    };
    if (category === 'unrelated') return { tone: 'neutral', title: 'No shopping assessment', message: 'This domain is outside the reviewed shopping coverage.' };
    if (company && allowed) return { tone: 'neutral', title: 'Not enough evidence for a verdict', message: `Reviewed business match: ${company.name}. Naughty or nice scoring is still being agreed.` };
    return { tone: 'neutral', title: 'Not enough evidence', message: 'We could not safely match this website to a reviewed brand shop. Unknown does not mean naughty.' };
  }

  globalThis.NaughtyList = { positions, normalizePosition, settings, hostname, purchaseControls, shoppingSignals, viewModel };
})();
