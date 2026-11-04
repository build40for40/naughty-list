# Santa's rules v0.3 (card 157): gift +1 (current B Corp), warning -1 (CMA undertaking/commitments),
# coal -2 (proven: conviction/guilty plea, fine, regulator order, NMW naming). Window: events since 4 Nov 2023.
# Repeats in the window: base total x2 for each incident after the first. Naughty <= -2; Nice >= 0 with a record;
# otherwise Not enough evidence (no records, or a single warning: total -1).
import json,re
NMW20='https://www.gov.uk/government/news/over-500-companies-named-for-not-paying-minimum-wage'
NMW21='https://www.gov.uk/government/news/over-74-million-put-back-in-working-peoples-pockets-by-employers'
NMW22='https://www.gov.uk/government/news/6-million-repaid-to-workers-as-government-cracks-down-on-employers-underpaying-their-staff'
NMW24='https://www.gov.uk/government/news/short-changing-staff-isnt-a-shortcut-to-success-nearly-660-employers-announced-as-failing-to-pay-the-minimum-wage'
CMAG='https://www.gov.uk/cma-cases/asos-boohoo-and-asda-greenwashing-investigation'
G=lambda why,url:('gift',why,url); W=lambda why,url:('warning',why,url); C=lambda why,url:('coal',why,url)
EV={
 'Patagonia':[G('Certified B Corp, checked 4 Nov 2026','https://www.bcorporation.net/en-us/find-a-b-corp/company/patagonia-inc/')],
 "Tony's Chocolonely":[G('Certified B Corp, checked 4 Nov 2026','https://www.bcorporation.net/en-us/find-a-b-corp/company/tonys-chocolonely/')],
 'FatFace':[G('Certified B Corp (B Lab directory)','https://www.bcorporation.net/en-us/find-a-b-corp/company/fat-face-limited/')],
 'B&Q':[C('Named for underpaying the minimum wage, Sep 2026',NMW24)],
 'Tesco':[C('Named for underpaying the minimum wage, Sep 2026',NMW24)],
 'Harrods':[C('Named for underpaying the minimum wage, Feb 2024',NMW20)],
 'Morrisons':[C('Named for underpaying the minimum wage, Feb 2024',NMW20),C('Fined £737,000 for food hygiene offences, May 2026','https://www.torfaen.gov.uk/en/news/morrisons-fined-750000-over-hygiene-failings')],
 'Aldi':[C('Pleaded guilty to a pest-control hygiene breach, fined, Nov 2024','https://www.walthamforest.gov.uk/stories/aldi-pleads-guilty-hygiene-breach-following-waltham-forest-investigation')],
 'Lidl':[C('Named for underpaying the minimum wage, May 2025',NMW21)],
 'Iceland':[C('Named for underpaying the minimum wage, Oct 2025',NMW22)],
 'River Island':[C('Named for underpaying the minimum wage, Feb 2024',NMW20)],
 'Currys':[C('Named for underpaying the minimum wage, Feb 2024',NMW20)],
 'GAME':[C('Named for underpaying the minimum wage, Feb 2024',NMW20)],
 'Holland & Barrett':[C('Named for underpaying the minimum wage, Oct 2025',NMW22)],
 'Wickes':[C('Named for underpaying the minimum wage, Feb 2024',NMW20)],
 'The Range':[C('Named for underpaying the minimum wage, May 2025',NMW21)],
 'Homebase':[C('Named for underpaying the minimum wage, Feb 2024',NMW20)],
 'Halfords':[C('Named for underpaying the minimum wage, May 2025',NMW21)],
 'Wayfair':[C('Fined £4.8m by the CMA over misleading sales countdowns, Oct 2026','https://www.gov.uk/cma-cases/wayfair-consumer-protection-enforcement-case')],
 'Wowcher':[W('Promised the CMA to change urgency claims, Jul 2024','https://www.gov.uk/cma-cases/wowcher-group-consumer-protection-case')],
 'Asda (incl. George)':[W('Promised the CMA to change green claims (George), Mar 2024',CMAG)],
 'ASOS':[W('Promised the CMA to change green claims, Mar 2024',CMAG)],
 'Boohoo':[W('Promised the CMA to change green claims, Mar 2024',CMAG)],
 'Debenhams':[W("Covered by Boohoo's promise to the CMA on green claims, Mar 2024",CMAG)],
 'Simba':[W('Promised the CMA to change discount claims, Sep 2026','https://www.gov.uk/cma-cases/simba-sleep-limited-consumer-protection-case')],
}
src=open('../site/top100.md').read(); shops=[]
for line in src.split('\n'):
    m=re.match(r"\*\*(.+)\*\*$",line.strip())
    if m: cat=m.group(1); continue
    m=re.match(r"\| (\d+) \| ([^|]+) \| ([^|]+) \|",line)
    if m: shops.append({'n':int(m.group(1)),'name':m.group(2).strip(),'site':m.group(3).strip(),'aisle':cat})
VAL={'gift':1,'warning':-1,'coal':-2}
for s in shops:
    ev=EV.get(s['name'],[]); bad=[e for e in ev if e[0]!='gift']
    base=sum(VAL[e[0]] for e in ev); neg=sum(VAL[e[0]] for e in bad); pos=base-neg
    total=pos+neg*(2**max(0,len(bad)-1)) if bad else base
    v='Not enough evidence' if not ev or total==-1 else ('Naughty' if total<=-2 else 'Nice')
    s.update(total=total if ev else None, verdict=v, why=[{'type':e[0],'why':e[1],'url':e[2]} for e in ev])
order={'Nice':0,'Not enough evidence':1,'Naughty':2}
ranked=sorted(shops,key=lambda s:(order[s['verdict']],-(s['total'] if s['total'] is not None else 0) if s['verdict']!='Not enough evidence' else (0 if s['total'] is None else 1),s['name'].lower()))
for i,s in enumerate(ranked,1): s['rank']=i
json.dump({'method':'santa-v0.3-draft','scored':'2026-11-04','shops':ranked},open('santa-scores-v0.3.json','w'),indent=1,ensure_ascii=False)
from collections import Counter; print(Counter(s['verdict'] for s in shops), len(shops))
print([ (s['rank'],s['name'],s['total'],s['verdict']) for s in ranked if s['verdict']!='Not enough evidence' or s['total']])
