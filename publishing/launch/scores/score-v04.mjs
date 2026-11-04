// One-off: compute Santa Score v0.4 for the 100 card-159 retailers using the deployed scoring
// code, the gov.uk report card, and the sourced incident records from the card 159 research.
import { readFileSync, writeFileSync } from 'node:fs';
import { santaScore, METHOD_VERSION } from './worker/scoring.js';
const card = JSON.parse(readFileSync('./data/santa-scorecard.json', 'utf8'));
const v3 = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const NMW20='https://www.gov.uk/government/news/over-500-companies-named-for-not-paying-minimum-wage', NMW21='https://www.gov.uk/government/news/over-74-million-put-back-in-working-peoples-pockets-by-employers', NMW22='https://www.gov.uk/government/news/6-million-repaid-to-workers-as-government-cracks-down-on-employers-underpaying-their-staff', NMW24='https://www.gov.uk/government/news/short-changing-staff-isnt-a-shortcut-to-success-nearly-660-employers-announced-as-failing-to-pay-the-minimum-wage';
const nmw=(id,date,url,gbp,why)=>({id,sourceId:'uk-minimum-wage',outcome:'government_naming',publishedAt:date,sourceUrl:url,facts:{underpaymentGBP:gbp},why});
const ev=(id,src,outcome,date,url,why)=>({id,sourceId:src,outcome,eventDate:date,sourceUrl:url,why});
const bcorp=(id,url)=>({id,sourceId:'b-lab',outcome:'certified',facts:{certified:true},freshness:'fresh',refreshDueAt:'2026-12-04',sourceUrl:url,why:'Certified B Corp, checked with B Lab'});
const CMAG='https://www.gov.uk/cma-cases/asos-boohoo-and-asda-greenwashing-investigation';
const R={
 'Patagonia':[bcorp('bl-pat','https://www.bcorporation.net/en-us/find-a-b-corp/company/patagonia-inc/')],
 "Tony's Chocolonely":[bcorp('bl-tony','https://www.bcorporation.net/en-us/find-a-b-corp/company/tonys-chocolonely/')],
 'FatFace':[bcorp('bl-ff','https://www.bcorporation.net/en-us/find-a-b-corp/company/fat-face-limited/')],
 'B&Q':[nmw('n-bq','2026-09-03',NMW24,456934.72,'Named for underpaying the minimum wage (£456,935), Sep 2026')],
 'Tesco':[nmw('n-tesco','2026-09-03',NMW24,227.84,'Named for underpaying the minimum wage (£228), Sep 2026')],
 'Harrods':[nmw('n-harrods','2024-02-20',NMW20,775.04,'Named for underpaying the minimum wage (£775), Feb 2024')],
 'Morrisons':[nmw('n-morr','2024-02-20',NMW20,59130.85,'Named for underpaying the minimum wage (£59,131), Feb 2024'),ev('c-morr','council','guilty_plea_and_fine','2026-05-08','https://www.torfaen.gov.uk/en/news/morrisons-fined-750000-over-hygiene-failings','Fined £737,000 for food hygiene offences, May 2026')],
 'Aldi':[ev('c-aldi','council','guilty_plea_and_fine','2024-11-29','https://www.walthamforest.gov.uk/stories/aldi-pleads-guilty-hygiene-breach-following-waltham-forest-investigation','Pleaded guilty to a pest-control hygiene breach, fined, Nov 2024')],
 'Lidl':[nmw('n-lidl','2025-05-29',NMW21,286437.18,'Named for underpaying the minimum wage (£286,437), May 2025')],
 'Iceland':[nmw('n-ice','2025-10-17',NMW22,1709.93,'Named for underpaying the minimum wage (£1,710), Oct 2025')],
 'River Island':[nmw('n-ri','2024-02-20',NMW20,57841.14,'Named for underpaying the minimum wage (£57,841), Feb 2024')],
 'Currys':[nmw('n-cur','2024-02-20',NMW20,122801.34,'Named for underpaying the minimum wage (£122,801), Feb 2024')],
 'GAME':[nmw('n-game','2024-02-20',NMW20,58475.54,'Named for underpaying the minimum wage (£58,476), Feb 2024')],
 'Holland & Barrett':[nmw('n-hb','2025-10-17',NMW22,153079.29,'Named for underpaying the minimum wage (£153,079), Oct 2025')],
 'Wickes':[nmw('n-wick','2024-02-20',NMW20,17186.64,'Named for underpaying the minimum wage (£17,187), Feb 2024')],
 'The Range':[nmw('n-range','2025-05-29',NMW21,89158.47,'Named for underpaying the minimum wage (£89,158), May 2025')],
 'Homebase':[nmw('n-hbase','2024-02-20',NMW20,2178.98,'Named for underpaying the minimum wage (£2,179), Feb 2024')],
 'Halfords':[nmw('n-half','2025-05-29',NMW21,179300.73,'Named for underpaying the minimum wage (£179,301), May 2025')],
 'Wayfair':[ev('c-way','uk-cma','fine','2026-10-12','https://www.gov.uk/cma-cases/wayfair-consumer-protection-enforcement-case','Fined £4.8m by the CMA over misleading sales countdowns, Oct 2026')],
 'Wowcher':[ev('u-wow','uk-cma','undertakings','2024-07-15','https://www.gov.uk/cma-cases/wowcher-group-consumer-protection-case','Promised the CMA to change urgency claims, Jul 2024')],
 'Asda (incl. George)':[ev('u-asda','uk-cma','undertakings','2024-03-27',CMAG,'Promised the CMA to change green claims (George), Mar 2024')],
 'ASOS':[ev('u-asos','uk-cma','undertakings','2024-03-27',CMAG,'Promised the CMA to change green claims, Mar 2024')],
 'Boohoo':[ev('u-boo','uk-cma','undertakings','2024-03-27',CMAG,'Promised the CMA to change green claims, Mar 2024')],
 'Debenhams':[ev('u-deb','uk-cma','undertakings','2024-03-27',CMAG,"Covered by Boohoo's promise to the CMA on green claims, Mar 2024")],
 'Simba':[ev('u-sim','uk-cma','revised_undertakings','2026-09-22','https://www.gov.uk/cma-cases/simba-sleep-limited-consumer-protection-case','Promised the CMA to change discount claims, Sep 2026')],
};
const MEASURE={pay_gap:'Median gender pay gap',late_invoices:'Supplier invoices paid late'};
const out=v3.shops.map(s=>{
  const evd=R[s.name]??[];
  const sc=santaScore(evd,{asOf:'2026-11-04',scorecard:card.shops[String(s.n)]??null,thresholds:card.thresholds});
  const why=[...sc.giftRecords.map(g=>({type:'gift',why:g.record.why,url:g.record.sourceUrl})),
    ...sc.counted.map(c=>({type:c.kind==='proven'?'coal':'warning',why:c.record.why,url:c.record.sourceUrl})),
    ...sc.reportCard.map(i=>({type:i.points>0?'gift':i.points<0?'coal':'card',why:`${MEASURE[i.measure]} ${i.value}% (${i.points>0?'+':''}${i.points})`,url:i.filing.sourceUrl})),
    ...sc.history.filter(h=>h.reason==='below_threshold').map(h=>({type:'shown',why:h.record.why+' (under £1,000, not counted)',url:h.record.sourceUrl}))];
  return {n:s.n,name:s.name,site:s.site,aisle:s.aisle,total:sc.total,verdict:sc.verdict,warningShown:sc.warningShown,why};
});
const order={nice:0,watch_list:1,not_enough_evidence:2,naughty:3};
out.sort((a,b)=>order[a.verdict]-order[b.verdict]||(b.total??-99)-(a.total??-99)||a.name.localeCompare(b.name));
out.forEach((s,i)=>s.rank=i+1);
writeFileSync(process.argv[3],JSON.stringify({method:METHOD_VERSION,asOf:'2026-11-04',thresholds:card.thresholds,shops:out},null,1));
const c={};out.forEach(s=>c[s.verdict]=(c[s.verdict]||0)+1);console.log(METHOD_VERSION,c);
console.log(out.filter(s=>s.verdict!=='not_enough_evidence').map(s=>`${s.rank}. ${s.name} ${s.total} ${s.verdict}`).join('\n'));
