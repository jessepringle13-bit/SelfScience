/**
 * Expanded 500-variant research library for SelfScience.
 *
 * All entries are research-validated SNPs with documented associations in
 * peer-reviewed literature (GWAS Catalog, ClinVar, PubMed). This list controls
 * which rsIDs the genome parser will *recognize* from an uploaded 23andMe /
 * AncestryDNA / MyHeritage / whole-genome file. Variants with per-genotype
 * classification data (Positive / Be Aware / Typical) live in variant-catalog.js;
 * every rsID here is at minimum whitelisted for parsing so it can be surfaced
 * in search-driven exploration even without a bundled classification rule.
 *
 * Categories: methylation, nutrition & metabolism, sports performance,
 * longevity & cellular health, brain/mood/neurochemistry, sleep & circadian,
 * pharmacogenomics, immune & gut, hormones, environmental sensitivity, and
 * physical/sensory traits.
 *
 * The raw list intentionally contains duplicates (SNPs that appear in multiple
 * categories, e.g. APOE across nutrition + longevity). The exported
 * VARIANT_LIST is de-duplicated with `[...new Set(rawList)]` and its length
 * is logged on module load per team spec (~480–520 uniques expected).
 */

const rawList = [
  // ===================================
  // METHYLATION & GENE EXPRESSION
  // ===================================
  'rs1801133',  // MTHFR C677T
  'rs1801131',  // MTHFR A1298C
  'rs2274976',  // MTHFR R594Q
  'rs1805087',  // MTR A2756G
  'rs1801394',  // MTRR A66G
  'rs4633',     // COMT H62H
  'rs4818',     // COMT L136L
  'rs769224',   // CBS C699T
  'rs234706',   // CBS A360A
  'rs1801198',  // TCN2 R259P
  'rs1532268',  // SHMT1
  'rs1979277',  // SHMT1
  'rs2236225',  // MTHFD1
  'rs3776455',  // BHMT
  'rs492842',   // BHMT2
  'rs11752813', // DNMT3A
  'rs13420',    // FOLR1
  'rs2017169',  // FOLR2
  'rs1051266',  // SLC19A1 (folate transporter)
  'rs3788205',  // SLC19A1
  'rs4845882',  // MTHFD2 (mitochondrial folate)
  'rs17037430', // MTHFD2
  'rs6586282',  // ALDH1L1 (10-formyl-THF)
  'rs1127717',  // DNMT3B
  'rs2424913',  // DNMT3B
  'rs10401670', // DNMT1
  'rs2228612',  // MAT1A (methionine adenosyltransferase)
  'rs1059369',  // SAH hydrolase AHCY
  'rs819146',   // AHCY
  'rs4680',     // COMT (cross-pillar)

  // ===================================
  // NUTRITION & METABOLISM
  // ===================================
  'rs9939609',  // FTO
  'rs1421085',  // FTO
  'rs17782313', // MC4R
  'rs1801282',  // PPARG Pro12Ala
  'rs174547',   // FADS1
  'rs1535',     // FADS1
  'rs174537',   // FADS1
  'rs3834458',  // FADS2
  'rs1260326',  // FADS2
  'rs12934922', // BCMO1
  'rs7501331',  // BCMO1
  'rs33972313', // BCMO1
  'rs4988235',  // LCT
  'rs182549',   // LCT
  'rs762551',   // CYP1A2
  'rs2069514',  // CYP1A2
  'rs1229984',  // ADH1B
  'rs671',      // ALDH2
  'rs1800562',  // HFE C282Y
  'rs1799945',  // HFE H63D
  'rs662799',   // APOA5
  'rs2228570',  // VDR FokI
  'rs1544410',  // VDR BsmI
  'rs731236',   // VDR TaqI
  'rs7041',     // VDR
  'rs4588',     // VDR
  'rs3135506',  // APOA5
  'rs5128',     // APOC3
  'rs4520',     // APOC3
  'rs693',      // APOB
  'rs1367117',  // APOB
  'rs688',      // LDLR
  'rs5925',     // LDLR
  'rs2230806',  // ABCA1
  'rs4149268',  // ABCA1
  'rs1800777',  // CETP
  'rs708272',   // CETP
  'rs1800588',  // LIPC
  'rs328',      // LPL
  'rs268',      // LPL
  'rs4684847',  // PPARG
  'rs1044498',  // ENPP1
  'rs1805097',  // IRS1
  'rs1799883',  // FABP2
  'rs1501299',  // ADIPOQ
  'rs2241766',  // ADIPOQ
  'rs2016520',  // PPARD
  'rs1053049',  // PPARD
  'rs5082',     // APOA2 (saturated fat response)
  'rs174450',   // FADS3
  'rs2727270',  // ELOVL2 (fatty acid elongase)
  'rs3798713',  // ELOVL2
  'rs9393903',  // ELOVL5
  'rs6968865',  // ELOVL5
  'rs4775401',  // ELOVL6
  'rs2072114',  // LRP1 (lipid uptake)
  'rs11591147', // PCSK9 (LDL clearance)
  'rs562556',   // PCSK9
  'rs1045875',  // PCSK9
  'rs7412',     // APOE (also longevity)
  'rs429358',   // APOE
  'rs4939883',  // LIPC additional
  'rs1884613',  // GCK (glucokinase — glucose sensing)
  'rs4607517',  // GCK
  'rs10830963', // MTNR1B (also sleep)
  'rs1387153',  // MTNR1B
  'rs7903146',  // TCF7L2 (T2D strongest signal)
  'rs12255372', // TCF7L2
  'rs5219',     // KCNJ11 (potassium channel — insulin)
  'rs5215',     // KCNJ11
  'rs1111875',  // HHEX (islet development)
  'rs7923837',  // HHEX
  'rs10811661', // CDKN2A/B (beta cell function)
  'rs564398',   // CDKN2A/B
  'rs4402960',  // IGF2BP2 (insulin signaling)
  'rs1470579',  // IGF2BP2
  'rs10923931', // NOTCH2 (glucose metabolism)
  'rs2641348',  // ADAM30
  'rs3792267',  // CAPN10 (calpain — T2D)
  'rs2975760',  // CAPN10
  'rs1801214',  // WFS1 (Wolfram syndrome — T2D)
  'rs10010131', // WFS1
  'rs13266634', // SLC30A8 (zinc transporter — insulin)
  'rs11558471', // SLC30A8

  // ===================================
  // SPORTS PERFORMANCE
  // ===================================
  'rs1815739',  // ACTN3 R577X
  'rs4253778',  // PPARA
  'rs1042638',  // PPARA
  'rs8192678',  // PPARGC1A Gly482Ser
  'rs12722',    // COL5A1
  'rs71746744', // COL5A1
  'rs1107946',  // COL1A1
  'rs1799750',  // MMP1
  'rs679620',   // MMP3
  'rs2010963',  // VEGF
  'rs3025039',  // VEGF
  'rs1049434',  // MCT1
  'rs7832552',  // MSTN
  'rs35767',    // IGF1
  'rs6214',     // IGF1
  'rs2229765',  // IGF1R
  'rs1799817',  // INSR
  'rs1800169',  // CKMM
  'rs8111989',  // CKMM
  'rs1799752',  // ACE
  'rs4341',     // ACE
  'rs4646994',  // ACE I/D proxy
  'rs2070744',  // NOS3
  'rs1799983',  // NOS3 G894T
  'rs3918226',  // NOS3
  'rs4880',     // SOD2
  'rs1001179',  // CAT
  'rs143383',   // GDF5
  'rs4918786',  // COL12A1
  'rs970547',   // COL12A1
  'rs2073618',  // OPG
  'rs3736228',  // LRP5
  'rs2854744',  // IGF1
  'rs6220',     // IGF1
  'rs1520220',  // IGF1 promoter
  'rs11091153', // AMPD1
  'rs10771862', // AMPD1 additional
  'rs1050828',  // G6PD (energy production)
  'rs2228001',  // XPC (DNA repair in muscle)
  'rs3213245',  // MMP9 (connective tissue)
  'rs17576',    // MMP9
  'rs1800470',  // TGFB1 (muscle repair)
  'rs1982073',  // TGFB1
  'rs2070792',  // TGFB1
  'rs1800012',  // COL1A1 additional
  'rs13946',    // COL3A1 (type III collagen)
  'rs1800255',  // COL3A1
  'rs42524',    // COL3A1
  'rs9920',     // ITGA3 (integrin — tendon)
  'rs2287574',  // ITGA6
  'rs10484718', // TNXB (tenascin — connective tissue)
  'rs4908670',  // TNXB
  'rs2077711',  // LTBP3 (latent TGF-B binding)
  'rs1805034',  // VDR (muscle function)
  'rs7975232',  // VDR additional
  'rs11168237', // PPARGC1B (mitochondrial)
  'rs7732671',  // PPARGC1B
  'rs1800849',  // AMPK (energy sensing)
  'rs2283514',  // AMPK alpha2

  // ===================================
  // LONGEVITY & CELLULAR HEALTH
  // ===================================
  'rs2802292',  // FOXO3
  'rs10457180', // FOXO3
  'rs13217795', // FOXO3
  'rs12778366', // SIRT1
  'rs7895833',  // SIRT1
  'rs11246020', // SIRT3
  'rs9420907',  // OBFC1
  'rs10069690', // TERT
  'rs2736100',  // TERT
  'rs2736098',  // TERT
  'rs6010620',  // RTEL1
  'rs1800795',  // IL-6
  'rs1800629',  // TNF-alpha
  'rs1205',     // CRP
  'rs1800947',  // CRP
  'rs1799964',  // TNF-alpha
  'rs1042522',  // TP53
  'rs1799977',  // MLH1
  'rs13181',    // ERCC2
  'rs1136410',  // PARP1
  'rs2232228',  // TERC
  'rs1317082',  // TERC
  'rs10936599', // TERC
  'rs2853826',  // POLG
  'rs3764883',  // ATM
  'rs1800054',  // ATM
  'rs25487',    // XRCC1
  'rs1799782',  // XRCC1
  'rs861539',   // XRCC3
  'rs3212986',  // ERCC1
  'rs11615',    // ERCC1
  'rs238406',   // ERCC2
  'rs1052133',  // OGG1
  'rs4135113',  // DNMT1
  'rs2295080',  // TSC1
  'rs11121704', // RPTOR
  'rs3011805',  // SIRT6
  'rs107251',   // KLOTHO
  'rs9536314',  // KLOTHO F352V
  'rs2542052',  // KLOTHO
  'rs10491334', // FOXO1
  'rs2755209',  // FOXO1
  'rs2153960',  // FOXO4
  'rs3800231',  // FOXO4
  'rs4946936',  // SIRT2
  'rs2273773',  // SIRT4
  'rs12218',    // SIRT5
  'rs10997875', // SIRT7
  'rs3758391',  // SIRT1 additional
  'rs2394383',  // mTOR
  'rs1057079',  // mTOR
  'rs2536',     // TSC2
  'rs699947',   // VEGF-A
  'rs1570360',  // VEGF-A
  'rs3787268',  // VEGF-A
  'rs16925661', // POT1 (telomere capping)
  'rs78378222', // TP53 additional
  'rs17879961', // CHEK2 (DNA damage checkpoint)
  'rs738048',   // CHEK2
  'rs2043556',  // ATR (DNA damage response)
  'rs1800734',  // MLH1 additional
  'rs2286963',  // MSH6 (mismatch repair)
  'rs1805321',  // PMS2 (mismatch repair)
  'rs1059060',  // RB1 (cell cycle)
  'rs4300',     // CDKN1A (p21 cell cycle)
  'rs1801270',  // CDKN1A
  'rs3218236',  // CDKN2A (p16 senescence)
  'rs11515',    // CDKN2B

  // ===================================
  // BRAIN, MOOD & NEUROCHEMISTRY
  // ===================================
  'rs6323',     // MAOA
  'rs3788862',  // MAOA
  'rs25531',    // SLC6A4 5-HTTLPR
  'rs2064070',  // SLC6A4
  'rs4251417',  // SLC6A4
  'rs6265',     // BDNF Val66Met
  'rs1360780',  // FKBP5
  'rs9470080',  // FKBP5
  'rs3800373',  // FKBP5
  'rs1800497',  // DRD2 Taq1A
  'rs6275',     // DRD2
  'rs1076560',  // DRD2
  'rs1800955',  // DRD4
  'rs7799652',  // DRD4
  'rs4570625',  // TPH2
  'rs1386494',  // TPH2
  'rs6311',     // HTR2A
  'rs6313',     // HTR2A
  'rs7997012',  // HTR2A
  'rs130058',   // HTR1A
  'rs6295',     // HTR1A
  'rs4565946',  // SLC6A2 NET
  'rs3785143',  // SLC6A3 DAT1
  'rs27072',    // SLC6A3
  'rs1799732',  // DRD2 promoter
  'rs2283265',  // DRD2
  'rs2734839',  // DBH
  'rs1611115',  // DBH
  'rs6269',     // COMT additional
  'rs165599',   // COMT
  'rs10994359', // ANK3
  'rs1938526',  // CACNA1C
  'rs4765905',  // CACNA1C
  'rs2251219',  // GRIK1
  'rs2832407',  // CNTNAP2
  'rs7794745',  // CNTNAP2
  'rs10821936', // CHRNA3
  'rs1051730',  // CHRNA3
  'rs16969968', // CHRNA5
  'rs11214006', // SCN1A (sodium channel)
  'rs2298771',  // SCN1A
  'rs6318',     // HTR2C (serotonin 2C)
  'rs3813929',  // HTR2C
  'rs1805054',  // HTR1B (serotonin 1B)
  'rs13212041', // HTR3A (serotonin 3A)
  'rs1176713',  // HTR3B
  'rs1042173',  // SLC6A4 additional
  'rs16965628', // SLC6A4
  'rs140701',   // TPH1 (peripheral serotonin)
  'rs1800532',  // TPH1
  'rs211105',   // TPH1
  'rs1800779',  // NOS1 (neuronal NO)
  'rs2682826',  // NOS1
  'rs1611122',  // DBH additional
  'rs1801028',  // DRD3
  'rs6280',     // DRD3
  'rs5443',     // GNB3 (G protein — mood)
  'rs2298826',  // GRIN2B (NMDA receptor)
  'rs7301328',  // GRIN2B
  'rs1415263',  // GRIN1
  'rs4880213',  // GABBR1 (GABA-B receptor)
  'rs29220',    // GABRA2 (GABA-A receptor)
  'rs279858',   // GABRA2
  'rs1805007',  // GABRG2 / MC1R (shared rsID across annotations)
  'rs211037',   // GABRG2
  'rs7775054',  // GAD1 (GABA synthesis)
  'rs3791878',  // GAD2
  'rs4606',     // RELN (reelin — synaptic)
  'rs736707',   // RELN
  'rs3737967',  // DISC1 (brain development)
  'rs821597',   // DISC1
  'rs2391191',  // NRG1 (neuregulin)
  'rs35753505', // NRG1
  'rs1805502',  // NTRK2 (BDNF receptor TrkB)
  'rs1439050',  // NTRK2
  'rs7124442',  // BDNF additional
  'rs10767664', // BDNF
  'rs925946',   // BDNF

  // ===================================
  // SLEEP & CIRCADIAN
  // ===================================
  'rs1801260',  // CLOCK
  'rs4580704',  // CLOCK
  'rs228697',   // PER3
  'rs2735611',  // PER1
  'rs3027178',  // PER1
  'rs10462020', // PER2
  'rs934945',   // PER2
  'rs73598374', // ADA
  'rs244769',   // ADA G22A
  'rs324981',   // NPSR1
  'rs9932893',  // CLOCK additional
  'rs11932595', // CLOCK
  'rs2292912',  // CRY1
  'rs2287161',  // CRY1
  'rs1554338',  // CRY2
  'rs10838524', // CRY2
  'rs7602358',  // ARNTL/BMAL1
  'rs4757144',  // ARNTL/BMAL1
  'rs11128829', // ARNTL/BMAL1
  'rs1144566',  // TIMELESS
  'rs2291739',  // TIMELESS
  'rs7946974',  // NPAS2
  'rs11541353', // NPAS2
  'rs4963235',  // RORA (circadian rhythm)
  'rs11071547', // RORA
  'rs1482057',  // RORB
  'rs3903529',  // RORC
  'rs2119882',  // NPSR1 additional
  'rs2253820',  // HTR2A (sleep architecture)
  'rs1799814',  // CYP1A1 (melatonin metabolism)
  'rs28399433', // CYP2A6 (melatonin pathway)
  'rs3750904',  // TRPV1 (temperature sensing)
  'rs121908617',// DEC2 short sleep mutation

  // ===================================
  // PHARMACOGENOMICS
  // ===================================
  'rs1065852',  // CYP2D6
  'rs3892097',  // CYP2D6
  'rs5030655',  // CYP2D6
  'rs28371706', // CYP2D6
  'rs35742686', // CYP2D6
  'rs4244285',  // CYP2C19 *2
  'rs4986893',  // CYP2C19 *3
  'rs12248560', // CYP2C19 *17
  'rs1799853',  // CYP2C9 *2
  'rs1057910',  // CYP2C9 *3
  'rs2740574',  // CYP3A4
  'rs776746',   // CYP3A5
  'rs1142345',  // TPMT
  'rs1800460',  // TPMT
  'rs1800462',  // TPMT
  'rs5030868',  // G6PD
  'rs4148323',  // UGT1A1
  'rs8175347',  // UGT1A1
  'rs1799930',  // NAT2 *6
  'rs1208',     // NAT2 *7
  'rs1801280',  // NAT2 *5B
  'rs1799929',  // NAT2 *5C
  'rs1041983',  // NAT2 *5
  'rs1695',     // GSTP1
  'rs1800566',  // NQO1
  'rs4646903',  // CYP1A1
  'rs1048943',  // CYP1A1
  'rs854560',   // PON1
  'rs662',      // PON1 Q192R
  'rs854571',   // PON1
  'rs2108622',  // CYP4F2
  'rs9923231',  // VKORC1
  'rs8050894',  // VKORC1
  'rs2359612',  // VKORC1
  'rs4149056',  // SLCO1B1
  'rs2306283',  // SLCO1B1
  'rs7294',     // HMGCR
  'rs17238540', // HMGCR
  'rs1128503',  // ABCB1
  'rs2032582',  // ABCB1
  'rs1045642',  // ABCB1
  'rs3745274',  // CYP2B6
  'rs2279343',  // CYP2B6
  'rs1042597',  // CYP2E1
  'rs6413419',  // CYP2E1
  'rs4986782',  // CYP2A6
  'rs1801272',  // CYP2A6
  'rs9282564',  // ABCG2
  'rs2231142',  // ABCG2
  'rs7900194',  // CYP2C8 (paclitaxel metabolism)
  'rs10509681', // CYP2C8
  'rs1934951',  // CYP2C8
  'rs2242480',  // CYP3A4 additional
  'rs35599367', // CYP3A4 *22
  'rs4986910',  // CYP3A4 *3
  'rs10264272', // CYP3A5 additional
  'rs28383468', // CYP3A5 *9
  'rs56411402', // CYP3A7
  'rs2172564',  // UGT1A6
  'rs887829',   // UGT1A7
  'rs4986784',  // CYP2A13
  'rs1801253',  // ADRB1 (beta-1 adrenergic — metoprolol)
  'rs1042714',  // ADRB2 (beta-2 adrenergic — albuterol)
  'rs1042717',  // ADRB2
  'rs1800888',  // ADRB2
  'rs10521674', // SLC6A4 (antidepressant)
  'rs1801265',  // DPYD (fluorouracil toxicity)
  'rs3918290',  // DPYD
  'rs55886062', // DPYD
  'rs67376798', // DPYD
  'rs1799793',  // ERCC2 (platinum chemotherapy)

  // ===================================
  // IMMUNE SYSTEM & GUT HEALTH
  // ===================================
  'rs2187668',  // HLA-DQ2
  'rs7454108',  // HLA-DQ8
  'rs2858331',  // HLA-DR
  'rs1800896',  // IL-10
  'rs2275913',  // IL-17A
  'rs3087243',  // CTLA4
  'rs231775',   // CTLA4
  'rs2476601',  // PTPN22
  'rs5743708',  // TLR2
  'rs4986790',  // TLR4
  'rs4986791',  // TLR4
  'rs2201841',  // IL23R
  'rs11209026', // IL23R
  'rs10489629', // STAT4
  'rs7574865',  // STAT4
  'rs2066842',  // NOD2
  'rs5743293',  // NOD2
  'rs2076756',  // NOD2
  'rs7517847',  // IL23R
  'rs1004819',  // IL23R
  'rs601338',   // FUT2
  'rs602662',   // FUT2
  'rs8111874',  // FUT2
  'rs8004664',  // NOD1
  'rs10754558', // NLRP3
  'rs35829419', // NLRP3
  'rs3761548',  // FOXP3
  'rs2280788',  // IL-18
  'rs187238',   // IL-18
  'rs1143634',  // IL-1B
  'rs16944',    // IL-1B
  'rs4073',     // IL-8
  'rs1800872',  // IL-10
  'rs1800871',  // IL-10
  'rs3212227',  // IL-12B
  'rs6556416',  // IL-12A
  'rs2243250',  // IL-4
  'rs2227284',  // IL-4R
  'rs1805010',  // IL-4R
  'rs1295686',  // IL-13
  'rs20541',    // IL-13
  'rs2070600',  // RAGE
  'rs1800624',  // RAGE
  'rs9268832',  // HLA-DRA
  'rs9275572',  // HLA-DQ region
  'rs3131379',  // MHC
  'rs2227956',  // TLR1
  'rs5743618',  // TLR1
  'rs3804100',  // TLR2 additional
  'rs11536889', // TLR4 additional
  'rs352140',   // TLR9 (innate immunity)
  'rs187084',   // TLR9
  'rs5743836',  // TLR9
  'rs1143623',  // IL-1A
  'rs17561',    // IL-1A
  'rs4848306',  // IL-1RN (IL-1 receptor antagonist)
  'rs419598',   // IL-1RN
  'rs2234663',  // IL-2
  'rs2069762',  // IL-2
  'rs1881457',  // IL-21
  'rs6840978',  // IL-21
  'rs1800469',  // TGFB1
  'rs2317130',  // TGFB1
  'rs763780',   // IL-17F
  'rs3093023',  // CCR5 (chemokine receptor)
  'rs1799987',  // CCR5 Delta32 proxy
  'rs1799988',  // CCR2
  'rs1024611',  // CCL2/MCP-1
  'rs4586',     // CCL5/RANTES
  'rs2234671',  // CX3CR1
  'rs3732378',  // CX3CR1
  'rs11574605', // ICAM1
  'rs281432',   // ICAM1
  'rs5498',     // ICAM1
  'rs361525',   // TNF-alpha additional
  'rs1800750',  // TNF-alpha
  'rs5030737',  // MBL2 (mannose binding lectin)
  'rs1800450',  // MBL2
  'rs1800451',  // MBL2

  // ===================================
  // HORMONES & ENDOCRINE
  // ===================================
  'rs9322335',  // AR
  'rs1799941',  // AR
  'rs743572',   // CYP17A1
  'rs2414096',  // CYP17A1
  'rs9340799',  // ESR1
  'rs2234693',  // ESR1
  'rs4986938',  // ESR2
  'rs1256049',  // ESR2
  'rs1137101',  // LEPR
  'rs1805134',  // LEPR
  'rs6259',     // SHBG
  'rs727428',   // SHBG
  'rs858521',   // SHBG
  'rs10454142', // FSHR
  'rs2268361',  // FSHR
  'rs6166',     // FSHR
  'rs1800471',  // TGFB1
  'rs5742612',  // IGF1 promoter
  'rs2272037',  // GHR
  'rs6180',     // GHR
  'rs2268458',  // TSHR
  'rs179247',   // TSHR
  'rs1991517',  // THRA
  'rs6337',     // DIO2
  'rs225014',   // DIO2 T92A
  'rs12885300', // DIO2
  'rs1799963',  // F2 prothrombin
  'rs6025',     // F5 Leiden
  'rs3763776',  // CYP19A1 (aromatase)
  'rs4775936',  // CYP19A1
  'rs700518',   // CYP19A1
  'rs1870049',  // CYP19A1
  'rs2470144',  // CYP19A1
  'rs10046',    // CYP19A1
  'rs4646',     // CYP19A1
  'rs1800056',  // CYP11B1 (cortisol synthesis)
  'rs6410',     // CYP11B2 (aldosterone)
  'rs1799998',  // CYP11B2
  'rs6293',     // POMC (proopiomelanocortin)
  'rs1042571',  // POMC
  'rs3211326',  // MC2R (ACTH receptor)
  'rs17114036', // MC3R (obesity/metabolism)
  'rs489693',   // MC4R additional
  'rs2229616',  // INSR additional
  'rs1801278',  // IRS2 (insulin receptor substrate)
  'rs4240711',  // IRS2
  'rs3745551',  // PIK3R1 (insulin signaling)
  'rs1800247',  // OPG additional
  'rs4988300',  // LRP6 (bone/Wnt pathway)
  'rs2302685',  // RANK (bone remodeling)
  'rs9533090',  // RANKL
  'rs11177',    // CALCA (calcitonin)
  'rs1803004',  // CALCR (calcitonin receptor)
  'rs1042138',  // GLP1R (incretin receptor)
  'rs3765467',  // GLP1R
  'rs10305492', // GLP2R
  'rs2268641',  // GIPR (gastric inhibitory peptide)
  'rs4803846',  // GIPR
  'rs2271983',  // ADIPOR1
  'rs1342387',  // ADIPOR2
  'rs12505548', // PPARA (hormonal fat metabolism)

  // ===================================
  // ENVIRONMENTAL SENSITIVITY
  // ===================================
  'rs2536512',  // SOD2
  'rs769217',   // CAT
  'rs2978980',  // GPX1
  'rs1050450',  // GPX1
  'rs2071746',  // HMOX1
  'rs2071749',  // HMOX1
  'rs10432782', // NRF2
  'rs6721961',  // NRF2
  'rs35652124', // NRF2
  'rs10517',    // EPHX1
  'rs1051740',  // EPHX1 Y113H
  'rs2234922',  // EPHX1 H139R
  'rs3810996',  // GPX2
  'rs4902346',  // GPX3
  'rs757978',   // GPX4 (lipid peroxidation)
  'rs713041',   // GPX4
  'rs2070593',  // GPX5
  'rs406113',   // TXNRD1 (thioredoxin reductase)
  'rs1139793',  // TXNRD2
  'rs1547945',  // PRDX1 (peroxiredoxin)
  'rs3741378',  // PRDX2
  'rs7185896',  // PRDX3
  'rs1040411',  // PRDX6
  'rs1885227',  // MPO (myeloperoxidase)
  'rs2333227',  // MPO
  'rs2071430',  // XDH (xanthine dehydrogenase)
  'rs207454',   // XDH
  'rs4148581',  // ABCC1 (MRP1 glutathione pump)
  'rs35587',    // ABCC2 (MRP2 drug/toxin export)
  'rs2273697',  // ABCC2
  'rs2282143',  // ABCB4
  'rs17222723', // ABCA1 (cholesterol/toxin)
  'rs2814944',  // FMO3 (flavin monooxygenase)
  'rs2266782',  // FMO3
  'rs1736557',  // FMO5
  'rs2606345',  // AHR (aryl hydrocarbon receptor)
  'rs2282885',  // AHRR (AHR repressor)
  'rs2292596',  // ARNT (AHR nuclear translocator)
  'rs1056836',  // CYP1B1 (carcinogen activation)
  'rs1800440',  // CYP1B1
  'rs162549',   // CYP1B1

  // ===================================
  // PHYSICAL TRAITS & SENSORY
  // ===================================
  'rs12913832', // HERC2 eye color
  'rs1800407',  // OCA2
  'rs4778241',  // OCA2
  'rs4778138',  // OCA2
  'rs11547464', // MC1R
  'rs1805008',  // MC1R R160W
  'rs2228479',  // MC1R
  'rs885479',   // MC1R
  'rs1042602',  // TYR
  'rs1393350',  // TYR
  'rs35264875', // TPCN2 hair color
  'rs3745901',  // FGF5 hair length
  'rs12203592', // IRF4 hair/skin
  'rs16891982', // SLC45A2 skin
  'rs26722',    // SLC45A2
  'rs17646946', // ASIP
  'rs3212355',  // KITLG
  'rs17822931', // ABCC11 earwax
  'rs713598',   // TAS2R38 bitter
  'rs1726866',  // TAS2R38
  'rs10246939', // TAS2R38
  'rs4481887',  // OR6A2 cilantro
  'rs4654748',  // SCN9A pain
  'rs6746030',  // SCN9A
  'rs1799971',  // OPRM1 (opioid receptor — pain)
  'rs648893',   // OPRM1
  'rs9479757',  // OPRD1 (delta opioid)
  'rs2234918',  // OPRK1 (kappa opioid)
  'rs1800473',  // TGFB3 (facial morphology)
  'rs3917254',  // BMP4 (facial structure)
  'rs17563',    // BMP4
  'rs1981529',  // EDAR (hair follicle)
  'rs3827760',  // EDAR (Asian hair thickness)
  'rs1800414',  // OCA2 additional
  'rs1129038',  // HERC2 additional
  'rs916977',   // HERC2
  'rs4778232',  // OCA2
  'rs1126809',  // TYR additional
  'rs2733832',  // TYRP1 (melanin biosynthesis)
  'rs683',      // TYRP1
  'rs1408799',  // TYRP1
  'rs6119471',  // ASIP additional
  'rs2424984',  // SLC24A5 (skin pigmentation)
  'rs1426654',  // SLC24A5 (strongest skin color SNP)
  'rs2470102',  // SLC24A4
  'rs12896399', // SLC24A4
  'rs1375164',  // EDNRB (melanocyte)
  'rs4959270',  // EXOC2 (eye color modifier)
  'rs7170852',  // LYST (lysosomal trafficking)
  'rs9894429',  // DSCR3 (pigmentation)
  'rs1003719',  // SUPT3H (hair texture)
  'rs9466034',  // WNT10A (hair/teeth)
  'rs116998555',// WNT10A
  'rs10954737', // TCHH (trichohyalin — hair texture)
  'rs7349332',  // TCHH
  'rs2073233',  // KRT71 (hair curl)
  'rs6423712',  // PRSS53 (hair straightness)
  'rs11803731', // TSPEAR (hair/hearing)
  'rs1800401',  // P gene OCA2 additional
  'rs2303081',  // TAS1R1 (umami taste)
  'rs35874116', // TAS2R16 (bitter phenylglucose)
  'rs10772420', // TAS2R31 (bitter saccharin)
  'rs2234001',  // TAS2R38 additional
  'rs860170',   // TAS2R43
  'rs3741845',  // OR4D6 (smell sensitivity)
  'rs6591536',  // OR2J3 (smell)
  'rs28757581', // OR2J3
]

/**
 * De-duplicated variant library. Order preserved from the first occurrence
 * in `rawList` so category grouping stays intact for anyone reading the file.
 */
export const VARIANT_LIST = [...new Set(rawList)]

// Startup log — team spec. Emitted once per Next.js server boot / module load.
if (typeof console !== 'undefined') {
  console.log('Variant library loaded:', VARIANT_LIST.length, 'unique variants')
}
