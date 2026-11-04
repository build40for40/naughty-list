// Card 157 draft v0.4: the UK legal entity whose statutory filings stand for
// each card 159 retailer in the Santa Score report card. Matched by name on
// 4 November 2026 against the filings themselves, so each company number is the
// one the company reported to gov.uk. `payGap` is the entity in the gender pay gap
// service and `payments` the one in the payment practices service; usually the same.
// null means no UK filing entity was found, so the report card is empty.
// Review every match before sign-off; `note` records judgement calls.
export default {
  1: { entity: "AMAZON UK SERVICES LTD.", payGap: "03223028", payments: "03223028" },  // Amazon
  2: { entity: "EBAY (UK) LIMITED", payGap: "03726028", payments: "03726028" },  // eBay
  3: { entity: "ARGOS LIMITED", payGap: "01081551", payments: "01081551" },  // Argos
  4: { payGap: null, payments: null, note: "No UK filing entity found." },  // Temu
  5: { payGap: null, payments: null, note: "No UK filing entity found." },  // Etsy
  6: { payGap: null, payments: null, note: "No UK filing entity found." },  // Shein
  7: { payGap: null, payments: null, note: "No UK filing entity found." },  // AliExpress
  8: { payGap: null, payments: null, note: "No UK filing entity found." },  // Vinted
  9: { entity: "DEPOP LIMITED", payGap: "08316342", payments: "08316342" },  // Depop
  10: { entity: "SHOP DIRECT HOME SHOPPING LIMITED", payGap: "04663281", payments: "04663281" },  // Very
  11: { entity: "JOHN LEWIS PLC", payGap: "00233462", payments: "00233462" },  // John Lewis
  12: { entity: "MARKS AND SPENCER P.L.C.", payGap: "00214436", payments: "00214436" },  // Marks & Spencer
  13: { entity: "NEXT RETAIL LIMITED", payGap: "04521150", payments: "04521150" },  // Next
  14: { entity: "BOOHOO.COM UK LIMITED", payGap: "05723154", payments: "05723154", note: "via Boohoo (Debenhams Group); owner link" },  // Debenhams
  15: { entity: "SELFRIDGES RETAIL LIMITED", payGap: "00097117", payments: "00097117" },  // Selfridges
  16: { entity: "HARRODS LIMITED", payGap: "00030209", payments: "00030209" },  // Harrods
  17: { entity: "LIBERTY RETAIL LIMITED", payGap: "00042342", payments: "00042342" },  // Liberty
  18: { entity: "FORTNUM & MASON PUBLIC LIMITED COMPANY", payGap: "00084909", payments: "00084909" },  // Fortnum & Mason
  19: { payGap: null, payments: null, note: "No UK filing entity found." },  // Notonthehighstreet
  20: { entity: "TJX UK", payGap: "03094828", payments: "03094828" },  // TK Maxx
  21: { entity: "WOWCHER LIMITED", payGap: "04264984", payments: "04264984" },  // Wowcher
  22: { entity: "TESCO STORES LIMITED", payGap: "00519500", payments: "00519500" },  // Tesco
  23: { entity: "SAINSBURY'S SUPERMARKETS LTD", payGap: "03261722", payments: "03261722" },  // Sainsbury's
  24: { entity: "ASDA STORES LIMITED", payGap: "00464777", payments: "00464777" },  // Asda (incl. George)
  25: { entity: "WM MORRISON SUPERMARKETS LIMITED", payGap: "00358949", payments: "00358949" },  // Morrisons
  26: { entity: "ALDI STORES LIMITED", payGap: "02321869", payments: "02321869" },  // Aldi
  27: { entity: "LIDL GREAT BRITAIN LIMITED", payGap: "02816429", payments: "02816429" },  // Lidl
  28: { entity: "WAITROSE LIMITED", payGap: "00233462", payments: "00099405", note: "GPG reported by John Lewis plc" },  // Waitrose
  29: { entity: "CO-OPERATIVE GROUP LIMITED", payGap: "IP00525R", payments: "IP00525R", note: "society: no payment-practices duty" },  // Co-op
  30: { entity: "ICELAND FOODS LIMITED", payGap: "01107406", payments: "01107406" },  // Iceland
  31: { entity: "OCADO RETAIL LIMITED", payGap: "03875000", payments: "03875000" },  // Ocado
  32: { entity: "PRIMARK STORES LIMITED", payGap: "00453448", payments: "00453448" },  // Primark
  33: { entity: "H&M HENNES & MAURITZ UK LIMITED", payGap: "01413450", payments: "01413450" },  // H&M
  34: { entity: "ITX UK LIMITED", payGap: "02245999", payments: "02245999", note: "ITX UK (all Inditex brands)" },  // Zara
  35: { entity: "UNIQLO EUROPE LTD", payGap: "04845064", payments: "04845064" },  // Uniqlo
  36: { entity: "ASOS.COM LIMITED", payGap: "03584121", payments: "03584121" },  // ASOS
  37: { entity: "BOOHOO.COM UK LIMITED", payGap: "05723154", payments: "05723154" },  // Boohoo
  38: { entity: "PRETTYLITTLETHING.COM LIMITED", payGap: "07352417", payments: "07352417" },  // PrettyLittleThing
  39: { entity: "RIVER ISLAND CLOTHING CO. LIMITED", payGap: "00636095", payments: "00636095" },  // River Island
  40: { entity: "NEW LOOK RETAILERS LIMITED", payGap: "01618428", payments: "01618428" },  // New Look
  41: { entity: "MNG-MANGO U.K. LIMITED", payGap: "03358140", payments: "03358140" },  // Mango
  42: { entity: "JD SPORTS FASHION PLC", payGap: "01888425", payments: "01888425" },  // JD Sports
  43: { entity: "SPORTSDIRECT.COM RETAIL LIMITED", payGap: "03406347", payments: "03406347" },  // Sports Direct
  44: { entity: "NIKE RETAIL UK", payGap: "BR003350", payments: "BR003350", note: "UK branch" },  // Nike
  45: { entity: "ADIDAS (U.K.) LIMITED", payGap: "01075951", payments: "01075951" },  // Adidas
  46: { entity: "MATALAN RETAIL LTD.", payGap: "02103564", payments: "02103564" },  // Matalan
  47: { entity: "FAT FACE LIMITED", payGap: "02954734", payments: "02954734" },  // FatFace
  48: { entity: "WHITE STUFF LIMITED", payGap: "02319237", payments: "02319237" },  // White Stuff
  49: { payGap: null, payments: null, note: "owned by Next since 2022" },  // Joules
  50: { entity: "SCHUH LIMITED", payGap: "SC125327", payments: "SC125327" },  // Schuh
  51: { entity: "C. & J. CLARK INTERNATIONAL LIMITED", payGap: "00141015", payments: "00141015" },  // Clarks
  52: { entity: "THE FLANNELS GROUP LIMITED", payGap: "02318510", payments: "02318510" },  // Flannels
  53: { payGap: null, payments: null, note: "No UK filing entity found." },  // Zalando
  54: { payGap: null, payments: null, note: "No UK filing entity found." },  // Patagonia
  55: { entity: "BOOTS UK LIMITED", payGap: "07073438", payments: "00928555", note: "GPG via Boots Management Services 07073438" },  // Boots
  56: { entity: "SUPERDRUG STORES PLC", payGap: "00807043", payments: "00807043" },  // Superdrug
  57: { entity: "THG BEAUTY LIMITED", payGap: "13400467", payments: "13400467", note: "THG Beauty" },  // Lookfantastic
  58: { payGap: null, payments: null, note: "owned by THG" },  // Cult Beauty
  59: { entity: "SPACE NK LIMITED", payGap: "02773985", payments: "02773985" },  // Space NK
  60: { entity: "THE BODY SHOP INTERNATIONAL LIMITED", payGap: "15859787", payments: "15859787" },  // The Body Shop
  61: { entity: "LUSH RETAIL LIMITED", payGap: "03084750", payments: "03084750" },  // Lush
  62: { entity: "HOLLAND & BARRETT RETAIL LIMITED", payGap: "02758955", payments: "02758955" },  // Holland & Barrett
  63: { entity: "FEELUNIQUE INTERNATIONAL LIMITED", payGap: "07883226", payments: "07883226", note: "Feelunique International" },  // Sephora
  64: { entity: "CHARLOTTE TILBURY BEAUTY LIMITED", payGap: "08037372", payments: "08037372" },  // Charlotte Tilbury
  65: { entity: "CURRYS GROUP LIMITED", payGap: "00504877", payments: "00504877" },  // Currys
  66: { entity: "AO RETAIL LIMITED", payGap: "03914998", payments: "03914998" },  // AO
  67: { entity: "APPLE RETAIL UK LIMITED", payGap: "04996702", payments: "04996702", note: "Apple Retail UK" },  // Apple
  68: { entity: "SAMSUNG ELECTRONICS (UK) LIMITED", payGap: "03086621", payments: "03086621" },  // Samsung
  69: { entity: "GAME RETAIL LIMITED", payGap: "07837246", payments: "07837246" },  // GAME
  70: { entity: "SONY INTERACTIVE ENTERTAINMENT EUROPE LIMITED", payGap: "03277793", payments: "03277793" },  // PlayStation Store (Sony)
  71: { payGap: null, payments: null, note: "No UK filing entity found." },  // Nintendo
  72: { entity: "MICROSOFT LIMITED", payGap: "01624297", payments: "01624297" },  // Xbox (Microsoft)
  73: { entity: "SMYTHS TOYS UK LIMITED", payGap: "06051517", payments: "06051517" },  // Smyths Toys
  74: { entity: "THE ENTERTAINER (AMERSHAM) LIMITED", payGap: "02057757", payments: "02057757" },  // The Entertainer
  75: { entity: "LEGO COMPANY LIMITED", payGap: "00368236", payments: "00368236" },  // LEGO
  76: { entity: "WATERSTONES BOOKSELLERS LIMITED", payGap: "00610095", payments: "00610095" },  // Waterstones
  77: { entity: "TG JONES RETAIL HOLDINGS LIMITED", payGap: "00471941", payments: "00471941", note: "high street now TG Jones" },  // WHSmith
  78: { entity: "THE WORKS STORES LIMITED", payGap: "06557400", payments: "06557400" },  // The Works
  79: { entity: "HOBBYCRAFT TRADING LIMITED", payGap: "00806269", payments: "00806269" },  // Hobbycraft
  80: { entity: "MOONPIG.COM LIMITED", payGap: "03852652", payments: "03852652" },  // Moonpig
  81: { entity: "SPORTSWIFT LIMITED", payGap: "03493972", payments: "03493972", note: "Sportswift Ltd" },  // Card Factory
  82: { entity: "HOTEL CHOCOLAT LIMITED", payGap: "02805730", payments: "02805730" },  // Hotel Chocolat
  83: { payGap: null, payments: null, note: "No UK filing entity found." },  // Tony's Chocolonely
  84: { entity: "PANDORA JEWELLERY UK LIMITED", payGap: "06654012", payments: "06654012" },  // Pandora
  85: { entity: "PETS AT HOME LTD", payGap: "01822577", payments: "01822577" },  // Pets at Home
  86: { entity: "IKEA LIMITED", payGap: "01986283", payments: "01986283" },  // IKEA
  87: { entity: "B&Q LIMITED", payGap: "00973387", payments: "00973387" },  // B&Q
  88: { entity: "WICKES BUILDING SUPPLIES LIMITED", payGap: "01840419", payments: "01840419" },  // Wickes
  89: { entity: "SCREWFIX DIRECT LIMITED", payGap: "03006378", payments: "03006378" },  // Screwfix
  90: { entity: "DUNELM (SOFT FURNISHINGS) LTD", payGap: "02129238", payments: "02129238" },  // Dunelm
  91: { entity: "WAYFAIR (UK) LIMITED", payGap: "06776852", payments: "06776852" },  // Wayfair
  92: { entity: "CDS (SUPERSTORES INTERNATIONAL) LIMITED", payGap: "02699203", payments: "02699203", note: "CDS (Superstores International)" },  // The Range
  93: { entity: "B & M RETAIL LIMITED", payGap: "01357507", payments: "01357507" },  // B&M
  94: { entity: "T. J. MORRIS LIMITED", payGap: "01505036", payments: "01505036", note: "T. J. Morris" },  // Home Bargains
  95: { payGap: null, payments: null, note: "brand bought by The Range owner 2025" },  // Homebase
  96: { entity: "LAKELAND LIMITED", payGap: "00809688", payments: "00809688" },  // Lakeland
  97: { payGap: null, payments: null, note: "No UK filing entity found." },  // Simba
  98: { entity: "HALFORDS LIMITED", payGap: "00103161", payments: "04457314", note: "PP filed by Halfords Group plc 04457314" },  // Halfords
  99: { entity: "POUNDLAND LIMITED", payGap: "02495645", payments: "02495645" },  // Poundland
  100: { entity: "COSTCO WHOLESALE UK LIMITED", payGap: "02635489", payments: "02635489" },  // Costco
};
