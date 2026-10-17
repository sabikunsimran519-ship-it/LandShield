 (() => {
  // Requests use this frontend origin; server.js proxies /api to the backend.
  const API_BASE_URL = '';
  const API = {
    lands: () => `${API_BASE_URL}/api/lands`,
    land: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}`,
    risk: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/risk`,
    documents: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/documents`,
    mutationHistory: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/mutation-history`,
    analysis: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/ai-analysis`,
    location: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/location`,
    whatIf: (id, scenario = {}) => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/what-if${Object.keys(scenario).length ? `?${new URLSearchParams(scenario)}` : ''}`,
    report: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/report`
  };

  const $ = id => document.getElementById(id);
  const state = { lands: [], land: null, risk: null, documents: null, mutationHistory: null, analysis: null, location: null, report: null, score: null, landId: null, loadToken: 0, map: null, mapLayers: null, mapLayerControl: null, mapStreetLayer: null, mapSatelliteLayer: null, mapActive: false, mapTilesUnavailable: false, mapStreetTilesUnavailable: false, language: 'bn', simulation: null };
  const DICTIONARY = Object.freeze({ bn: {
    'Workspace':'কর্মক্ষেত্র','Demo portfolio':'ডেমো জমির তালিকা','Overview':'সারসংক্ষেপ','Land map':'জমির মানচিত্র','Risk analysis':'ঝুঁকি বিশ্লেষণ','Mutation history':'মিউটেশনের ইতিহাস','Documents':'কাগজপত্র যাচাই','Digital twin':'জমির নমুনা মডেল','What-if simulator':'বিকল্প পরিস্থিতি','Final report':'চূড়ান্ত প্রতিবেদন','Need a hand?':'সহায়তা দরকার?','Visit our help center':'সহায়তা দেখুন','Account':'অ্যাকাউন্ট','Land analyst':'জমি বিশ্লেষক','Language':'ভাষা','Open dashboard navigation':'মেনু খুলুন','Notifications':'বার্তা',
    'LAND PORTFOLIO':'জমির তালিকা','DHAKA, BANGLADESH':'ঢাকা, বাংলাদেশ','Land intelligence,':'জমির তথ্য,','at a glance.':'এক নজরে।','A clearer view of your land, its risks, and what to do next.':'জমির তথ্য, ঝুঁকি এবং পরবর্তী করণীয় সহজভাবে দেখুন।','Refresh data':'তথ্য হালনাগাদ করুন','Demo Screening — Synthetic Data':'ডেমো যাচাই — কৃত্রিম তথ্য','This prototype uses synthetic/demo data and does not provide official government verification or legal advice. Independent verification is required before any land transaction.':'এই নমুনায় কৃত্রিম/ডেমো তথ্য ব্যবহার করা হয়েছে। এটি সরকারি যাচাই বা আইনি পরামর্শ নয়। জমি কেনার আগে অনুমোদিত সূত্রে নিজে যাচাই করুন।',
    'Find a land record':'জমির তথ্য খুঁজুন','Enter a land reference ID or choose one from the suggestions.':'জমির রেফারেন্স নম্বর লিখুন অথবা তালিকা থেকে বেছে নিন।','LAND REFERENCE ID':'জমির রেফারেন্স নম্বর','e.g., DEMO-001':'যেমন, DEMO-001','Search land':'জমি খুঁজুন','Loading available land references…':'জমির নম্বর আনা হচ্ছে…','CURRENT LAND PARCEL':'নির্বাচিত জমি','Choose land parcel':'জমি নির্বাচন করুন','Fetching location…':'অবস্থান আনা হচ্ছে…','Loading synthetic demo record':'ডেমো তথ্য আনা হচ্ছে','PARCEL ID':'জমির পরিচিতি নম্বর','Demo data · screening only':'ডেমো তথ্য · প্রাথমিক যাচাই',
    'BEFORE YOU BUY':'কেনার আগে যাচাই করুন','Land check at a glance':'জমির প্রাথমিক যাচাই','A simple summary of the available record. This screening cannot guarantee that a purchase is safe.':'পাওয়া তথ্যের সহজ সারাংশ। এই যাচাই জমি কেনা নিরাপদ—এ নিশ্চয়তা দেয় না।','SCREENING OUTCOME':'যাচাইয়ের ফল','Waiting for land data':'জমির তথ্যের অপেক্ষায়','RISK SCORE (INDICATOR)':'ঝুঁকির সূচক','The summary will appear after land data loads.':'জমির তথ্য এলে সারাংশ দেখা যাবে।','Key warning':'গুরুত্বপূর্ণ সতর্কতা','Checking the recorded risk indicators...':'ঝুঁকির তথ্য যাচাই হচ্ছে…','What to do next':'এখন কী করবেন','Load a land record to see suggested next steps.':'পরামর্শ দেখতে জমির তথ্য নির্বাচন করুন।','View details / বিস্তারিত দেখুন':'বিস্তারিত দেখুন / View details','HIGH RISK - DO NOT PROCEED UNTIL VERIFIED':'উচ্চ ঝুঁকি — যাচাই না হওয়া পর্যন্ত এগোবেন না','FURTHER VERIFICATION REQUIRED':'আরও যাচাই প্রয়োজন','LOW-RISK SCREENING RESULT':'কম ঝুঁকির প্রাথমিক ফল','MEDIUM':'মাঝারি ঝুঁকি','LOW':'কম ঝুঁকি','HIGH':'বেশি ঝুঁকি','Risk score will appear when data loads.':'তথ্য এলে ঝুঁকির সূচক দেখা যাবে।','Final assessment loads from the risk engine.':'যাচাইয়ের ফল ঝুঁকি বিশ্লেষণ থেকে আসবে।',
    'LANDSHIELD RISK SCORE':'LANDSHIELD ঝুঁকির সূচক','DOCUMENT SCREENING':'কাগজপত্রের প্রাথমিক যাচাই','ACTIVE DISPUTES':'চলমান বিরোধ','SCREENING RESULT':'যাচাইয়ের ফল','View full assessment':'সম্পূর্ণ যাচাই দেখুন','Review screening':'যাচাই দেখুন','Checking recorded fields…':'নথিভুক্ত তথ্য দেখা হচ্ছে…','Checking dispute records…':'বিরোধের তথ্য দেখা হচ্ছে…','View screening details':'যাচাইয়ের বিস্তারিত দেখুন','DEMO GEOSPATIAL VIEW':'ডেমো মানচিত্র','Demo map / approximate location':'ডেমো মানচিত্র / আনুমানিক অবস্থান','Expand map':'মানচিত্র বড় করুন','Collapse map':'মানচিত্র ছোট করুন','Map showing approximate demo coordinates':'ডেমো জমির আনুমানিক অবস্থান','Illustrative land map preview':'জমির নমুনা মানচিত্র','ILLUSTRATIVE PARCEL':'নমুনা জমির সীমানা','Loading approximate demo location…':'জমির আনুমানিক অবস্থান আনা হচ্ছে…','Waiting for location API…':'অবস্থানের তথ্যের অপেক্ষায়…','Illustrative demo boundary only · not cadastral':'নমুনা সীমানা; সরকারি নকশা নয়','DEMO MAP / APPROXIMATE LOCATION':'ডেমো মানচিত্র / আনুমানিক অবস্থান','View parcel details':'জমির তথ্য দেখুন',
    'PROPERTY MODEL':'জমির নমুনা মডেল','3D land digital twin':'জমির ত্রিমাত্রিক নমুনা মডেল','Drag to rotate · Scroll to zoom':'ঘোরাতে টানুন · বড়/ছোট করতে স্ক্রল করুন','DEMO TERRAIN VIEW':'ডেমো ভূমিরূপ','ELEVATION RANGE':'উচ্চতার সীমা','Flat demo terrain':'সমতল ডেমো ভূমি','LAND AREA':'জমির আয়তন','LAND TYPE':'জমির ধরন','BOUNDARY':'সীমানা','Demo visualization only; not surveyed elevation data.':'শুধু ডেমো দৃশ্য; জরিপ করা উচ্চতার তথ্য নয়।',
    'RISK ENGINE':'ঝুঁকি বিশ্লেষণ','Risk breakdown':'ঝুঁকির বিস্তারিত','Five signals that shape your land’s risk score.':'পাঁচটি বিষয়ের ভিত্তিতে ঝুঁকির সূচক তৈরি হয়েছে।','OVERALL SCORE':'মোট ঝুঁকির সূচক','Loading risk categories from backend…':'ঝুঁকির বিভাগ আনা হচ্ছে…','Dispute status is being checked':'বিরোধের তথ্য যাচাই হচ্ছে','Active disputes may change the final screening decision.':'চলমান বিরোধ থাকলে যাচাইয়ের ফল বদলাতে পারে।','CHECKING':'যাচাই হচ্ছে','OWNERSHIP RECORD SCREENING':'মালিকানা-সংক্রান্ত তথ্য যাচাই','Mutation History':'মিউটেশনের ইতিহাস','Review the recorded sequence and current mutation status before purchase.':'কেনার আগে মিউটেশনের ধারাবাহিকতা ও বর্তমান অবস্থা দেখুন।','LOADING':'আনা হচ্ছে','Loading mutation history from the backend…':'মিউটেশনের ইতিহাস আনা হচ্ছে…','Loading mutation events…':'মিউটেশনের তথ্য আনা হচ্ছে…','Demo history is for screening only; verify ownership and mutation records with official sources.':'এই ডেমো ইতিহাস শুধু প্রাথমিক যাচাইয়ের জন্য। সরকারি সূত্রে মালিকানা ও মিউটেশন যাচাই করুন।',
    'Recorded field checks':'নথিভুক্ত তথ্যের যাচাই','SCREENING':'প্রাথমিক যাচাই','Checking recorded land fields…':'নথিভুক্ত জমির তথ্য যাচাই হচ্ছে…','View screening checks':'যাচাইয়ের তথ্য দেখুন','AI-STYLE LAND RISK ANALYSIS':'নিয়মভিত্তিক ঝুঁকি বিশ্লেষণ','Analyst’s brief':'ঝুঁকির সারাংশ','RULE-BASED SCREENING':'নিয়মভিত্তিক যাচাই','Generating analysis from land records…':'জমির তথ্য থেকে বিশ্লেষণ তৈরি হচ্ছে…','System recommendation':'পরবর্তী করণীয়','Recommendation will appear with analysis.':'বিশ্লেষণের পর করণীয় দেখা যাবে।','PLAN WITH CONFIDENCE':'তথ্য জেনে সিদ্ধান্ত নিন','What-if risk simulator':'বিকল্প পরিস্থিতিতে ঝুঁকি','Hypothetical scores come from the risk API; stored land data stays unchanged.':'সম্ভাব্য পরিস্থিতির সূচক API থেকে আসে; জমির তথ্য বদলায় না।','SCENARIO':'পরিস্থিতি','Current condition':'বর্তমান অবস্থা','Dispute resolved':'বিরোধ মিটেছে','Mutation complete':'মিউটেশন সম্পন্ন','Both completed':'দুটিই সম্পন্ন','Simulate impact':'ফল হিসাব করুন','Choose a scenario to calculate its risk score':'ঝুঁকি দেখতে একটি পরিস্থিতি বেছে নিন','Results load from the backend What-If API.':'ফল What-if API থেকে আসবে।',
    'PORTABLE SUMMARY':'সংরক্ষণযোগ্য সারাংশ','Final land report':'জমির চূড়ান্ত প্রতিবেদন','Refresh report':'প্রতিবেদন হালনাগাদ করুন','Print / Save PDF':'প্রিন্ট / PDF সংরক্ষণ','Loading consolidated report from backend…':'প্রতিবেদন আনা হচ্ছে…','© 2026 LandShield':'© ২০২৬ LandShield','Land decisions, made clearer.':'জমির সিদ্ধান্ত আরও সহজ হোক।','Data provided by your connected risk engine':'তথ্য সংযুক্ত ঝুঁকি বিশ্লেষণ থেকে এসেছে।','Land record checks':'জমির নথি যাচাই','Close document details':'নথির বিস্তারিত বন্ধ করুন',
    'DEMO / APPROXIMATE':'ডেমো / আনুমানিক','DEMO / SYNTHETIC DATA':'ডেমো / কৃত্রিম তথ্য','DEMO':'ডেমো','SYNTHETIC DEMO DATA':'কৃত্রিম ডেমো তথ্য','SYNTHETIC DATA':'কৃত্রিম তথ্য','SYNTHETIC':'কৃত্রিম','APPROXIMATE':'আনুমানিক','UNVERIFIED':'যাচাই হয়নি','NOT AVAILABLE':'পাওয়া যায়নি','SCREENING ONLY':'শুধু প্রাথমিক যাচাই','SCREENING PASSED':'প্রাথমিক যাচাই সম্পন্ন','SCREENING FAILED':'প্রাথমিক যাচাইয়ে সমস্যা','PARTIAL - FURTHER VERIFICATION REQUIRED':'আংশিক — আরও যাচাই প্রয়োজন','PASS':'মিলেছে','FAIL':'মেলেনি','REVIEW':'পর্যালোচনা দরকার','PENDING':'অপেক্ষমাণ','ACTIVE':'চলমান','CLEAR':'সমস্যার তথ্য নেই','UNKNOWN':'অজানা','CURRENT':'বর্তমান','RECORDED':'নথিভুক্ত','NOT CHECKED':'যাচাই হয়নি','UNAVAILABLE':'পাওয়া যায়নি','Khatian':'খতিয়ান','Khatian number':'খতিয়ান নম্বর','Dag':'দাগ','Dag number':'দাগ নম্বর','Mutation':'মিউটেশন','Acquisition':'অধিগ্রহণ','Dispute':'বিরোধ','Ownership':'মালিকানা','Documents':'কাগজপত্র','Khas':'খাস জমি','Land area':'জমির আয়তন','Land information':'জমির তথ্য','Coordinates':'স্থানাঙ্ক','Boundary':'সীমানা','Terrain':'ভূমিরূপ','Risk categories':'ঝুঁকির বিভাগ','Document screening':'কাগজপত্রের প্রাথমিক যাচাই','What-if scenarios':'বিকল্প পরিস্থিতি','Analysis & recommendation':'বিশ্লেষণ ও পরামর্শ','Final recommendation':'চূড়ান্ত পরামর্শ','Decision-support screening only.':'শুধু সিদ্ধান্তে সহায়ক প্রাথমিক যাচাই।','Verify with official sources.':'সরকারি সূত্রে যাচাই করুন।','not an official government record.':'এটি সরকারি নথি নয়।',
    'Owner or mutation information indicates a conflict or is missing.':'মালিকানা বা মিউটেশনের তথ্য অনুপস্থিত বা বিরোধপূর্ণ।','Mutation is not complete; ownership requires verification.':'মিউটেশন সম্পন্ন হয়নি; মালিকানা যাচাই করা দরকার।','Mutation is recorded as complete; verify ownership with official records.':'মিউটেশন সম্পন্ন বলে নথিভুক্ত; সরকারি নথিতে মালিকানা যাচাই করুন।','Mutation status is unclear; verify ownership with official records.':'মিউটেশনের অবস্থা স্পষ্ট নয়; সরকারি নথিতে মালিকানা যাচাই করুন।','Active or pending dispute indicator detected.':'চলমান বা অমীমাংসিত বিরোধের তথ্য পাওয়া গেছে।','A previous dispute is recorded; confirm its resolution.':'আগের বিরোধের তথ্য আছে; মিটেছে কি না যাচাই করুন।','No dispute indicator is recorded.':'বিরোধের তথ্য নথিভুক্ত নেই।','Dispute status is unclear; verify with official records.':'বিরোধের অবস্থা স্পষ্ট নয়; সরকারি নথিতে যাচাই করুন।','Government acquisition indicator detected.':'সরকারি অধিগ্রহণের তথ্য পাওয়া গেছে।','Potential acquisition indicator requires verification.':'সম্ভাব্য অধিগ্রহণের তথ্য যাচাই করা দরকার।','No acquisition indicator is recorded.':'অধিগ্রহণের তথ্য নথিভুক্ত নেই।','Acquisition status is unclear; verify with official records.':'অধিগ্রহণের অবস্থা স্পষ্ট নয়; সরকারি নথিতে যাচাই করুন।','Khas land indicator detected.':'খাস জমির তথ্য পাওয়া গেছে।','No khas land indicator is recorded.':'খাস জমির তথ্য নথিভুক্ত নেই।','Khas land status is unclear; verify with official records.':'খাস জমির অবস্থা স্পষ্ট নয়; সরকারি নথিতে যাচাই করুন।','Khatian, dag and land area are recorded; document authenticity has not been verified.':'খতিয়ান, দাগ ও জমির আয়তন নথিভুক্ত আছে; কাগজের সত্যতা যাচাই করা হয়নি।','Khatian information is recorded.':'খতিয়ানের তথ্য নথিভুক্ত আছে।','Dag information is recorded.':'দাগের তথ্য নথিভুক্ত আছে।','Land area is recorded and greater than zero.':'জমির আয়তন নথিভুক্ত আছে।','Owner name and completed mutation status are recorded; confirm with official records.':'মালিকের নাম ও মিউটেশন সম্পন্ন বলে নথিভুক্ত; সরকারি নথিতে যাচাই করুন।','Mutation is not recorded as complete; further verification is required.':'মিউটেশন সম্পন্ন বলে নথিভুক্ত নেই; আরও যাচাই দরকার।','Screening only - official/legal document verification is still required.':'শুধু প্রাথমিক যাচাই — সরকারি/আইনি নথি যাচাই এখনও দরকার।','Decision-support screening only; this is not legal advice or official government verification.':'এটি সিদ্ধান্তে সহায়ক প্রাথমিক যাচাই; আইনি পরামর্শ বা সরকারি যাচাই নয়।','Independent verification is required before any land transaction.':'জমি কেনাবেচার আগে নিজে অনুমোদিত সূত্রে যাচাই করুন।','Mutation review marked pending, matching the current demo status.':'ডেমো রেকর্ডে মিউটেশন পর্যালোচনা অপেক্ষমাণ।','Synthetic demo record created. This is not a real deed or ownership transfer.':'কৃত্রিম ডেমো রেকর্ড তৈরি হয়েছে; এটি প্রকৃত দলিল বা মালিকানা হস্তান্তর নয়।','Demo timeline only. Confirm mutation and ownership history with official records before purchase.':'শুধু ডেমো সময়রেখা। কেনার আগে সরকারি নথিতে মিউটেশন ও মালিকানা যাচাই করুন।','This coordinate is for demonstration only and does not represent an official land parcel location.':'এই স্থানাঙ্ক শুধু ডেমোর জন্য; এটি সরকারি জমির অবস্থান নয়।','Illustrative demo boundary only. This is not an official or verified parcel boundary.':'শুধু নমুনা সীমানা; এটি সরকারি বা যাচাইকৃত জমির সীমানা নয়।','Demo terrain data for visualization only. It is not surveyed elevation data.':'শুধু দৃশ্যায়নের জন্য ডেমো ভূমির তথ্য; এটি জরিপের তথ্য নয়।',
    'Verify ownership and mutation records before proceeding.':'এগোনোর আগে মালিকানা ও মিউটেশনের নথি যাচাই করুন।','Independently verify the current dispute status and its resolution before purchase.':'কেনার আগে বিরোধের বর্তমান অবস্থা ও নিষ্পত্তি স্বাধীনভাবে যাচাই করুন।','Confirm the recorded dispute status with the appropriate authority.':'সংশ্লিষ্ট কর্তৃপক্ষের কাছে বিরোধের তথ্য যাচাই করুন।','Check the original khatian, dag and related land records.':'মূল খতিয়ান, দাগ ও সংশ্লিষ্ট জমির নথি দেখুন।','Verify whether any acquisition notice or project affects the land.':'জমিটি অধিগ্রহণের নোটিশ বা প্রকল্পের আওতায় আছে কি না যাচাই করুন।','Verify land classification and khas status in official records.':'সরকারি নথিতে জমির শ্রেণি ও খাস অবস্থা যাচাই করুন.','Do not proceed until the dispute status is independently verified and resolved.':'বিরোধের অবস্থা স্বাধীনভাবে যাচাই ও নিষ্পত্তি না হওয়া পর্যন্ত এগোবেন না।','Do not proceed until the major risk indicators have been verified and resolved.':'গুরুত্বপূর্ণ ঝুঁকির তথ্য যাচাই ও নিষ্পত্তি না হওয়া পর্যন্ত এগোবেন না।','Further verification is recommended before making a purchase decision.':'কেনার সিদ্ধান্তের আগে আরও যাচাই করুন।','Proceed only after normal document and ownership verification.':'কাগজপত্র ও মালিকানা যাচাইয়ের পরেই সিদ্ধান্ত নিন।','No major indicators in stored fields; verify with official records.':'নথিভুক্ত তথ্যে বড় ঝুঁকির ইঙ্গিত নেই; তবু সরকারি নথিতে যাচাই করুন।','No coordinates are recorded for this land.':'এই জমির স্থানাঙ্ক নথিভুক্ত নেই।','These coordinates have not been verified as an official land parcel location.':'এই স্থানাঙ্ক সরকারি জমির অবস্থান হিসেবে যাচাই করা হয়নি।','Hypothetical risk score is unchanged.':'সম্ভাব্য পরিস্থিতিতেও ঝুঁকির সূচক অপরিবর্তিত।','This simulation does not change stored land data or confirm that a condition has changed.':'এই হিসাব জমির নথি বদলায় না বা বাস্তবে কোনো পরিবর্তন নিশ্চিত করে না।','Hypothetical scenario examples. These do not change stored land data.':'সম্ভাব্য পরিস্থিতির উদাহরণ; এতে জমির নথি বদলায় না।','This prototype uses synthetic/demo data and does not provide official government verification or legal advice. Independent verification is required before any land transaction.':'এই নমুনায় কৃত্রিম/ডেমো তথ্য ব্যবহার করা হয়েছে। এটি সরকারি যাচাই বা আইনি পরামর্শ নয়। জমি কেনার আগে অনুমোদিত সূত্রে নিজে যাচাই করুন।'
  } });
  const EXTRA_TRANSLATIONS = Object.freeze({
    'View details':'বিস্তারিত দেখুন','BEFORE YOU BUY':'কেনার আগে যাচাই করুন','Land check at a glance':'জমির প্রাথমিক যাচাই','A simple summary of the available record. This screening cannot guarantee that a purchase is safe.':'পাওয়া তথ্যের সহজ সারাংশ। এই যাচাই জমি কেনা নিরাপদ—এ নিশ্চয়তা দেয় না।','SCREENING OUTCOME':'যাচাইয়ের ফল','RISK SCORE (INDICATOR)':'ঝুঁকির সূচক','The summary will appear after land data loads.':'জমির তথ্য এলে সারাংশ দেখা যাবে।','Key warning':'গুরুত্বপূর্ণ সতর্কতা','Critical warning':'জরুরি সতর্কতা','Checking the recorded risk indicators…':'ঝুঁকির তথ্য যাচাই হচ্ছে…','What to do next':'এখন কী করবেন','Load a land record to see suggested next steps.':'পরামর্শ দেখতে জমির তথ্য নির্বাচন করুন।','The record shows some information that needs checking. Do not treat this score as a guarantee that the land is safe.':'নথিতে কিছু তথ্য আরও যাচাই করা দরকার। এই সূচক জমি নিরাপদ হওয়ার নিশ্চয়তা নয়।','No major warning appears in the available fields. This does not guarantee the land is safe; verify official records.':'পাওয়া তথ্যে বড় সতর্কতা নেই। তবু জমি নিরাপদ—এ নিশ্চয়তা নয়; সরকারি নথি যাচাই করুন।','A high-risk indicator appears in the recorded land data. Verify the information before making a purchase decision.':'নথিভুক্ত তথ্যে উচ্চ ঝুঁকির ইঙ্গিত আছে। কেনার সিদ্ধান্তের আগে তথ্য যাচাই করুন।','The overall score is':'মোট ঝুঁকির সূচক','but the critical':'তবে গুরুতর','category triggers a HIGH screening result. Do not proceed until the information is verified.':'বিভাগের ঝুঁকির কারণে ফল উচ্চ ঝুঁকি। তথ্য যাচাই না হওয়া পর্যন্ত এগোবেন না।','Ownership':'মালিকানা','Documents':'কাগজপত্র','Dispute':'বিরোধ','Acquisition':'সরকারি অধিগ্রহণ','Khas':'খাস জমি','PENDING':'অপেক্ষমাণ','ACTIVE':'চলমান','RESOLVED':'নিষ্পত্তি হয়েছে','complete':'সম্পন্ন','pending':'অপেক্ষমাণ','unknown':'অজানা','no':'না','yes':'হ্যাঁ','SYSTEM RECOMMENDATION':'পরবর্তী করণীয়','SCREENING PASSED':'প্রাথমিক যাচাই সম্পন্ন','SCREENING FAILED':'প্রাথমিক যাচাইয়ে সমস্যা','FURTHER VERIFICATION REQUIRED':'আরও যাচাই প্রয়োজন','LOW-RISK SCREENING RESULT':'কম ঝুঁকির প্রাথমিক ফল','This screening cannot guarantee that a purchase is safe.':'এই যাচাই জমি কেনা নিরাপদ—এ নিশ্চয়তা দেয় না।','How to understand this result':'এই ফলের অর্থ','Check official records before buying':'কেনার আগে সরকারি নথি যাচাই করুন','Land reference ID':'জমির রেফারেন্স নম্বর','Search land':'জমি খুঁজুন','Current':'বর্তমান','Scenario':'পরিস্থিতি','Risk breakdown':'ঝুঁকির বিস্তারিত','Recorded field checks':'নথিভুক্ত তথ্যের যাচাই','Land information':'জমির তথ্য','Mutation history':'মিউটেশনের ইতিহাস','Final land report':'জমির চূড়ান্ত প্রতিবেদন','Print / Save PDF':'প্রিন্ট / PDF সংরক্ষণ'
  });
  const TERM_TRANSLATIONS = Object.freeze({
    'Simple land terms':'জমির সহজ কিছু শব্দ','A record showing land ownership and holdings.':'জমির মালিকানা ও হিসাবের রেকর্ড।','A plot or parcel number within a mouza.':'মৌজার ভেতরে জমির নির্দিষ্ট দাগ বা প্লট নম্বর।','The process of updating land ownership details after a transfer.':'মালিকানা বদলের পর জমির রেকর্ডে নতুন তথ্য যোগ করার প্রক্রিয়া।','Land taken by government for a public purpose under applicable law.':'প্রযোজ্য আইন অনুযায়ী জনস্বার্থে সরকারের জমি নেওয়ার প্রক্রিয়া।','A disagreement about land ownership, boundaries, or rights.':'জমির মালিকানা, সীমানা বা অধিকার নিয়ে মতবিরোধ।','A screening indicator based on recorded information. It cannot guarantee that land is safe to buy.':'নথিভুক্ত তথ্যের ভিত্তিতে ঝুঁকির সূচক। এটি জমি কেনা নিরাপদ—এ নিশ্চয়তা দেয় না।'
  });
  const API_TRANSLATIONS = Object.freeze({
    'Mutation is not complete; ownership requires verification.':'মিউটেশন সম্পন্ন হয়নি; মালিকানা যাচাই করা দরকার।',
    'Active or pending dispute indicator detected.':'চলমান বা নিষ্পত্তি না হওয়া বিরোধের ইঙ্গিত পাওয়া গেছে।',
    'Document information or mutation status requires further verification.':'কাগজপত্রের তথ্য বা মিউটেশনের অবস্থা আরও যাচাই করা দরকার।',
    'Khatian, dag and land area are recorded; document authenticity has not been verified.':'খতিয়ান, দাগ ও জমির পরিমাণ নথিভুক্ত আছে; কাগজপত্রের সত্যতা যাচাই করা হয়নি।',
    'Mutation is not recorded as complete; further verification is required.':'মিউটেশন সম্পন্ন বলে নথিতে নেই; আরও যাচাই প্রয়োজন।',
    'Mutation is not recorded as complete; further verification is required':'মিউটেশন সম্পন্ন বলে নথিতে নেই; আরও যাচাই প্রয়োজন',
    'Mutation is not complete; ownership requires verification. Active or pending dispute indicator detected.':'মিউটেশন সম্পন্ন হয়নি; মালিকানা যাচাই করা দরকার। চলমান বা নিষ্পত্তি না হওয়া বিরোধের ইঙ্গিত পাওয়া গেছে।',
    'Document screening requires further verification.':'কাগজপত্রের প্রাথমিক যাচাইয়ে আরও যাচাই প্রয়োজন।',
    'Do not proceed until the dispute status is independently verified and resolved.':'বিরোধের অবস্থা নিজে যাচাই করে নিষ্পত্তি না হওয়া পর্যন্ত এগোবেন না।',
    'Hypothetical risk score is unchanged. This simulation does not change stored land data or confirm that a condition has changed.':'এই সম্ভাব্য পরিস্থিতিতে ঝুঁকির সূচক বদলায়নি। এই হিসাব জমির নথি বদলায় না বা বাস্তবে কোনো পরিবর্তন নিশ্চিত করে না।',
    'Hypothetical scenario examples. These do not change stored land data.':'সম্ভাব্য পরিস্থিতির উদাহরণ। এতে জমির নথি বদলায় না।',
    'Synthetic demo record created. This is not a real deed or ownership transfer.':'কৃত্রিম ডেমো রেকর্ড তৈরি করা হয়েছে। এটি আসল দলিল বা মালিকানা হস্তান্তর নয়।',
    'Synthetic demo mutation review marked pending, matching the current demo status.':'ডেমো তথ্য অনুযায়ী ২০২৪ সালে মিউটেশন যাচাই চলমান হিসেবে দেখানো হয়েছে; এটি বর্তমান ডেমো অবস্থার সঙ্গে মেলে।',
    'Demo timeline only. Confirm mutation and ownership history with official records before purchase.':'এটি শুধু ডেমো সময়রেখা। কেনার আগে সরকারি নথিতে মিউটেশন ও মালিকানার ইতিহাস যাচাই করুন।',
    'Demo Screening — Synthetic Data. This prototype uses synthetic/demo data and does not provide official government verification or legal advice. Independent verification is required before any land transaction.':'ডেমো যাচাই — কৃত্রিম তথ্য। এই নমুনায় কৃত্রিম/ডেমো তথ্য ব্যবহার করা হয়েছে; এটি সরকারি যাচাই বা আইনি পরামর্শ নয়। জমি কেনাবেচার আগে নিজে যাচাই করুন।',
    'LandShield provides decision-support screening only. It is not legal advice and does not replace official government or legal verification.':'LandShield শুধু সিদ্ধান্ত নিতে সহায়ক প্রাথমিক যাচাই দেয়। এটি আইনি পরামর্শ নয় এবং সরকারি বা আইনগত যাচাইয়ের বিকল্পও নয়।',
    'Decision-support screening only; this is not legal advice or official government verification.':'এটি শুধু সিদ্ধান্তে সহায়ক প্রাথমিক যাচাই; আইনি পরামর্শ বা সরকারি যাচাই নয়।',
    'Screening only - official/legal document verification is still required.':'শুধু প্রাথমিক যাচাই—সরকারি/আইনগতভাবে কাগজপত্র যাচাই এখনও প্রয়োজন।',
    'This coordinate is for demonstration only and does not represent an official land parcel location.':'এই স্থানাঙ্ক শুধু প্রদর্শনের জন্য; এটি সরকারি জমির অবস্থান নয়।',
    'Illustrative demo boundary only. This is not an official or verified parcel boundary.':'এটি শুধু নমুনা সীমানা; সরকারি বা যাচাইকৃত জমির সীমানা নয়।',
    'Demo terrain data for visualization only. It is not surveyed elevation data.':'এটি শুধু দৃশ্যায়নের জন্য ডেমো ভূমির তথ্য; জরিপ করা উচ্চতার তথ্য নয়।',
    'RULE-BASED AI-STYLE SCREENING':'নিয়মভিত্তিক প্রাথমিক বিশ্লেষণ',
    'RULE-BASED SCREENING':'নিয়মভিত্তিক যাচাই',
    'PARTIAL - FURTHER VERIFICATION REQUIRED':'আংশিক — আরও যাচাই প্রয়োজন',
    'DO NOT PROCEED UNTIL VERIFIED':'যাচাই না হওয়া পর্যন্ত এগোবেন না',
    'DO NOT PROCEED':'এগোবেন না',
    'SCREENING PASSED':'প্রাথমিক যাচাই সম্পন্ন',
    'SYNTHETIC DEMO DATA':'কৃত্রিম ডেমো তথ্য',
    'SCREENING DATA':'প্রাথমিক যাচাইয়ের তথ্য',
    'Land area':'জমির পরিমাণ','Owner':'মালিক','Location':'অবস্থান','Current mutation status':'মিউটেশনের বর্তমান অবস্থা',
    'Acquisition':'অধিগ্রহণ','Dispute':'বিরোধ','Khas status':'খাস জমির অবস্থা','Risk categories':'ঝুঁকির বিভাগ',
    'Document screening':'কাগজপত্রের প্রাথমিক যাচাই','Analysis & recommendation':'বিশ্লেষণ ও পরামর্শ',
    'What-if scenarios':'সম্ভাব্য পরিস্থিতি','Coordinates':'স্থানাঙ্ক','Boundary':'সীমানা','Terrain':'ভূমির ধরন',
    'Current status:':'বর্তমান অবস্থা:','Source:':'তথ্যসূত্র:','Date not provided':'তারিখ দেওয়া নেই',
    'No description provided.':'কোনো বিবরণ দেওয়া হয়নি।','No mutation history events are available.':'মিউটেশনের ইতিহাসের তথ্য পাওয়া যায়নি।',
    'Current condition':'বর্তমান অবস্থা','If dispute is resolved':'বিরোধ নিষ্পত্তি হলে','If mutation is completed':'মিউটেশন সম্পন্ন হলে',
    'If dispute is resolved and mutation is completed':'বিরোধ নিষ্পত্তি ও মিউটেশন সম্পন্ন হলে',
    'System recommendation':'করণীয় পরামর্শ','Key risks:':'প্রধান ঝুঁকি:','PASS':'পাস','REVIEW':'যাচাই প্রয়োজন','PENDING':'চলমান','RECORDED':'নথিভুক্ত','Active':'চলমান','Pending':'চলমান','Clear':'নেই','active':'চলমান','pending':'চলমান','clear':'নেই','no':'নেই',
    'OWNERSHIP':'মালিকানা','DEMO / APPROXIMATE':'ডেমো / আনুমানিক','DEMO / APPROXIMATE LOCATION':'ডেমো / আনুমানিক অবস্থান',
    'Verification result':'যাচাইয়ের ফল','SCREENING ONLY':'শুধু প্রাথমিক যাচাই','LAND ID':'জমির পরিচিতি নম্বর','RISK SCORE':'ঝুঁকির সূচক','SCREENING':'প্রাথমিক যাচাই'
    ,'Khatian':'খতিয়ান','Dag':'দাগ','Mutation':'নামজারি','Acquisition':'অধিগ্রহণ','Dispute':'জমি-সংক্রান্ত বিরোধ','Risk score':'ঝুঁকির সূচক'
    ,'LandShield screening data':'LandShield-এর প্রাথমিক যাচাইয়ের তথ্য'
    ,'Overall screening risk is ':'প্রাথমিক যাচাইয়ে ঝুঁকির মাত্রা '
    ,'medium':'মাঝারি','high':'উচ্চ','low':'কম'
    ,'Demo Record Created':'ডেমো রেকর্ড তৈরি','Mutation Review':'নামজারি পর্যালোচনা'
    ,'Enter a land reference ID, such as DEMO-001, to search.':'খুঁজতে জমির রেফারেন্স নম্বর লিখুন, যেমন DEMO-001।'
    ,'No matching land reference found':'এই নম্বরের কোনো জমির তথ্য পাওয়া যায়নি'
    ,'Check the ID or choose a suggestion from the available records.':'নম্বরটি দেখুন অথবা তালিকা থেকে একটি বেছে নিন।'
    ,'Showing dashboard information for':'এই জমির তথ্য দেখানো হচ্ছে:'
    ,'land references available. Search by ID or choose a suggestion.':'টি জমির তথ্য পাওয়া গেছে। নম্বর লিখে খুঁজুন বা তালিকা থেকে বেছে নিন।'
    ,'Document information unavailable.':'কাগজপত্রের তথ্য পাওয়া যায়নি।'
  });
  const SIMULATOR_TRANSLATIONS = Object.freeze({
    'land reference available. Search by ID or choose a suggestion.':'টি জমির তথ্য পাওয়া গেছে। নম্বর লিখে খুঁজুন বা তালিকা থেকে বেছে নিন।',
    'land references available. Search by ID or choose a suggestion.':'টি জমির তথ্য পাওয়া গেছে। নম্বর লিখে খুঁজুন বা তালিকা থেকে বেছে নিন।',
    ', but a critical ':'; তবে গুরুতর ',
    ' category score of ':' বিভাগে ',
    ' triggers the HIGH RISK screening outcome. Verify the information before deciding to buy.':' থাকায় যাচাইয়ের ফল উচ্চ ঝুঁকি। কেনার আগে তথ্য যাচাই করুন।',
    'Hypothetical risk decreases by ':'সম্ভাব্য হিসাবে ঝুঁকির সূচক কমেছে ',
    'Dispute status: active to resolved.':'বিরোধের অবস্থা: চলমান থেকে নিষ্পত্তি হয়েছে।',
    'Mutation status: pending to complete.':'নামজারির অবস্থা: অপেক্ষমাণ থেকে সম্পন্ন হয়েছে।',
    ' points lower':'পয়েন্ট কম',
    ' points higher':'পয়েন্ট বেশি',
    'score comparison unavailable':'স্কোরের তুলনা করা যাচ্ছে না',
    'no score change':'স্কোরের কোনো পরিবর্তন নেই',
    'points.':'পয়েন্টে।',
    'This scenario is hypothetical; stored land records are unchanged.':'এটি সম্ভাব্য পরিস্থিতির হিসাব; জমির নথি অপরিবর্তিত থাকে।',
    'See how a possible change could affect the score. The land record will not change.':'কোনো পরিবর্তন হলে ঝুঁকির সূচক কেমন হতে পারে তা দেখুন। এতে জমির নথি বদলাবে না।',
    'Choose a scenario to see a possible score change. The land record will not change.':'সম্ভাব্য পরিবর্তনের ফল দেখতে একটি পরিস্থিতি বেছে নিন। এতে জমির নথি বদলাবে না।',
    'Simulator API unavailable':'সিমুলেটরের তথ্য পাওয়া যাচ্ছে না',
    'Check the What-If endpoint and try again.':'সিমুলেটর API চালু আছে কি না দেখে আবার চেষ্টা করুন।',
    'Choose a scenario to calculate its risk score':'ঝুঁকির সূচক দেখতে একটি পরিস্থিতি বেছে নিন',
    'Results load from the backend What-If API.':'ফলাফল ব্যাকএন্ডের What-If API থেকে আসবে।',
    'Select a land parcel first.':'আগে একটি জমি বেছে নিন।',
    'contributors':'অবদানকারীরা'
  });
  const UI_TRANSLATIONS = Object.freeze({
    'An illustrative layout to help picture the plot and nearby access.':'\u099C\u09AE\u09BF\u09B0 \u09A8\u0995\u09B6\u09BE \u0993 \u09AA\u09BE\u09B6\u09C7\u09B0 \u09AF\u09BE\u09A4\u09BE\u09AF\u09BC\u09BE\u09A4 \u09AC\u09C1\u099D\u09A4\u09C7 \u098F\u0995\u099F\u09BF \u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 \u099A\u09BF\u09A4\u09CD\u09B0\u0964','ILLUSTRATIVE NEIGHBORHOOD · NOT A SURVEY':'\u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 \u098F\u09B2\u09BE\u0995\u09BE · \u099C\u09B0\u09BF\u09AA \u09A8\u09AF\u09BC','3D view controls':'3D \u09A6\u09C3\u09B6\u09CD\u09AF\u09C7\u09B0 \u09A8\u09BF\u09AF\u09BC\u09A8\u09CD\u09A4\u09CD\u09B0\u09A3','Rotate left':'\u09AC\u09BE\u09AE\u09A6\u09BF\u0995\u09C7 \u0998\u09CB\u09B0\u09BE\u09A8','Zoom out':'\u099B\u09CB\u099F \u0995\u09B0\u09C1\u09A8','Reset view':'\u09AA\u09C1\u09A8\u09B0\u09BE\u09AF\u09BC \u09A6\u09C7\u0996\u09BE\u09A8','Zoom in':'\u09AC\u09A1\u09BC \u0995\u09B0\u09C1\u09A8','Rotate right':'\u09A1\u09BE\u09A8\u09A6\u09BF\u0995\u09C7 \u0998\u09CB\u09B0\u09BE\u09A8','Illustrative 3D neighborhood around the selected demo plot':'\u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u09A1\u09C7\u09AE\u09CB \u099C\u09AE\u09BF\u09B0 \u0986\u09B6\u09AA\u09BE\u09B6\u09C7\u09B0 \u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 3D \u099A\u09BF\u09A4\u09CD\u09B0','ILLUSTRATIVE ROAD · WIDTH NOT PROVIDED':'\u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 \u09B0\u09BE\u09B8\u09CD\u09A4\u09BE · \u09AA\u09CD\u09B0\u09B8\u09CD\u09A5 \u09A6\u09C7\u0993\u09AF\u09BC\u09BE \u09A8\u09C7\u0987','SELECTED PLOT · APPROXIMATE DEMO OUTLINE':'\u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u099C\u09AE\u09BF · \u0986\u09A8\u09C1\u09AE\u09BE\u09A8\u09BF\u0995 \u09A1\u09C7\u09AE\u09CB \u09B8\u09C0\u09AE\u09BE\u09A8\u09BE','PROPOSED HOUSE · ILLUSTRATIVE PLACEMENT':'\u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09BE\u09AC\u09BF\u09A4 \u09AC\u09BE\u09A1\u09BC\u09BF · \u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8','ILLUSTRATIVE ACCESS POINT':'\u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 \u09AA\u09CD\u09B0\u09AC\u09C7\u09B6\u09AA\u09A5','Visualization layers':'\u099A\u09BF\u09A4\u09CD\u09B0\u09C7\u09B0 \u09B8\u09CD\u09A4\u09B0','Land boundary':'\u099C\u09AE\u09BF\u09B0 \u09B8\u09C0\u09AE\u09BE\u09A8\u09BE','Roads / access':'\u09B0\u09BE\u09B8\u09CD\u09A4\u09BE / \u09AF\u09BE\u09A4\u09BE\u09AF\u09BC\u09BE\u09A4','Nearby buildings':'\u09AA\u09BE\u09B6\u09C7\u09B0 \u09AC\u09BE\u09A1\u09BC\u09BF','Proposed house':'\u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09BE\u09AC\u09BF\u09A4 \u09AC\u09BE\u09A1\u09BC\u09BF','Trees / green areas':'\u0997\u09BE\u099B / \u09B8\u09AC\u09C1\u099C \u098F\u09B2\u09BE\u0995\u09BE','RECORDED LAND AREA':'\u09A8\u09A5\u09BF\u09A4\u09C7 \u09A5\u09BE\u0995\u09BE \u099C\u09AE\u09BF\u09B0 \u0986\u09AF\u09BC\u09A4\u09A8','ROAD ACCESS IN RECORD':'\u09A8\u09A5\u09BF\u09A4\u09C7 \u09B0\u09BE\u09B8\u09CD\u09A4\u09BE\u09B0 \u09A4\u09A5\u09CD\u09AF','Not provided':'\u09A4\u09A5\u09CD\u09AF \u09A6\u09C7\u0993\u09AF\u09BC\u09BE \u09A8\u09C7\u0987','Not provided by record':'\u09A8\u09A5\u09BF\u09A4\u09C7 \u098F\u0987 \u09A4\u09A5\u09CD\u09AF \u09A8\u09C7\u0987','HOUSE FOOTPRINT':'\u09AC\u09BE\u09A1\u09BC\u09BF\u09B0 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B0 \u09AE\u09BE\u09AA','Illustrative only · dimensions unavailable':'\u09B6\u09C1\u09A7\u09C1 \u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 · \u09AE\u09BE\u09AA \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF','LAND TYPE':'\u099C\u09AE\u09BF\u09B0 \u09A7\u09B0\u09A8','BOUNDARY STATUS':'\u09B8\u09C0\u09AE\u09BE\u09A8\u09BE\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE','ELEVATION':'\u0989\u099A\u09CD\u099A\u09A4\u09BE','The neighborhood, road, trees, neighboring structures, and house placement are illustrative; no boundary, road width, or building dimensions have been verified.':'\u098F\u09B2\u09BE\u0995\u09BE, \u09B0\u09BE\u09B8\u09CD\u09A4\u09BE, \u0997\u09BE\u099B, \u09AA\u09BE\u09B6\u09C7\u09B0 \u09AD\u09AC\u09A8 \u0993 \u09AC\u09BE\u09A1\u09BC\u09BF\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995; \u09B8\u09C0\u09AE\u09BE\u09A8\u09BE, \u09B0\u09BE\u09B8\u09CD\u09A4\u09BE\u09B0 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A5 \u09AC\u09BE \u09AD\u09AC\u09A8\u09C7\u09B0 \u09AE\u09BE\u09AA \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09A8\u09BF.','An approximate boundary is returned for this demo record; this illustration is not drawn to scale.':'\u098F\u0987 \u09A1\u09C7\u09AE\u09CB \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF\u09C7 \u0986\u09A8\u09C1\u09AE\u09BE\u09A8\u09BF\u0995 \u09B8\u09C0\u09AE\u09BE\u09A8\u09BE \u0986\u099B\u09C7; \u098F\u0987 \u099A\u09BF\u09A4\u09CD\u09B0 \u09AE\u09BE\u09AA \u0985\u09A8\u09C1\u09AF\u09BE\u09AF\u09BC\u09C0 \u0986\u0981\u0995\u09BE \u09A8\u09AF\u09BC.','No boundary was returned for this record; the visible plot is illustrative.':'\u098F\u0987 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09B8\u09C0\u09AE\u09BE\u09A8\u09BE \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF; \u09A6\u09C3\u09B6\u09CD\u09AF\u09AE\u09BE\u09A8 \u099C\u09AE\u09BF \u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995.','Terrain data:':'\u09AD\u09C2\u09AA\u09CD\u09B0\u0995\u09C3\u09A4\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF: ',
    'Dashboard':'\u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1','Land Verification':'\u099C\u09AE\u09BF \u09AF\u09BE\u099A\u09BE\u0987','Land Intelligence':'\u099C\u09AE\u09BF\u09B0 \u09AC\u09BF\u09B6\u09CD\u09B2\u09C7\u09B7\u09A3','Reports & History':'\u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F \u0993 \u0987\u09A4\u09BF\u09B9\u09BE\u09B8',
    'Provide your land information':'\u0986\u09AA\u09A8\u09BE\u09B0 \u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u09A6\u09BF\u09A8','Map':'\u09AE\u09CD\u09AF\u09BE\u09AA','Risk Analysis':'\u099D\u09C1\u0981\u0995\u09BF \u09AC\u09BF\u09B6\u09CD\u09B2\u09C7\u09B7\u09A3','Mutation & Reports':'\u09AE\u09BF\u0989\u099F\u09C7\u09B6\u09A8 \u0993 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F','Report':'\u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F','Check Your Land':'\u0986\u09AA\u09A8\u09BE\u09B0 \u099C\u09AE\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8','SEPARATE LAND DETAILS':'\u09AA\u09C3\u09A5\u0995 \u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF','Enter the land details you want to review.':'\u09AF\u09C7 \u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09A4\u09C7 \u099A\u09BE\u09A8, \u09B8\u09C7\u0997\u09C1\u09B2\u09CB \u09A6\u09BF\u09A8\u0964','This form is separate from the demo-record search. The current prototype can only screen DEMO-001 and DEMO-002 by reference ID.':'\u098F\u0987 \u09AB\u09B0\u09AE\u099F\u09BF \u09A1\u09C7\u09AE\u09CB \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u0996\u09CB\u0981\u099C \u09A5\u09C7\u0995\u09C7 \u0986\u09B2\u09BE\u09A6\u09BE\u0964 \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09A8\u09AE\u09C1\u09A8\u09BE\u099F\u09BF \u09B6\u09C1\u09A7\u09C1 DEMO-001 \u0993 DEMO-002 \u09B0\u09C7\u09AB\u09BE\u09B0\u09C7\u09A8\u09CD\u09B8 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AA\u09CD\u09B0\u09BE\u09A5\u09AE\u09BF\u0995 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u0964','District':'\u099C\u09C7\u09B2\u09BE','Upazila':'\u0989\u09AA\u099C\u09C7\u09B2\u09BE','Mouza':'\u09AE\u09CC\u099C\u09BE','Dag Number':'\u09A6\u09BE\u0997 \u09A8\u09AE\u09CD\u09AC\u09B0','Khatian Number':'\u0996\u09A4\u09BF\u09AF\u09BC\u09BE\u09A8 \u09A8\u09AE\u09CD\u09AC\u09B0','Land Area':'\u099C\u09AE\u09BF\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3','Area Unit':'\u0986\u09AF\u09BC\u09A4\u09A8\u09C7\u09B0 \u098F\u0995\u0995','Land Type':'\u099C\u09AE\u09BF\u09B0 \u09A7\u09B0\u09A8','Select an area unit':'\u0986\u09AF\u09BC\u09A4\u09A8\u09C7\u09B0 \u098F\u0995\u0995 \u09AC\u09C7\u099B\u09C7 \u09A8\u09BF\u09A8','Select a land type':'\u099C\u09AE\u09BF\u09B0 \u09A7\u09B0\u09A8 \u09AC\u09C7\u099B\u09C7 \u09A8\u09BF\u09A8','Decimal':'\u09B6\u09A4\u09BE\u0982\u09B6','Katha':'\u0995\u09BE\u09A0\u09BE','Bigha':'\u09AC\u09BF\u0998\u09BE','Acre':'\u098F\u0995\u09B0','Hectare':'\u09B9\u09C7\u0995\u09CD\u099F\u09B0','Square feet':'\u09AC\u09B0\u09CD\u0997\u09AB\u09C1\u099F','Agricultural':'\u0995\u09C3\u09B7\u09BF\u099C\u09AE\u09BF','Residential':'\u09AC\u09BE\u09B8\u09BE\u09AC\u09BE\u09A1\u09BC\u09BF\u09B0 \u099C\u09AE\u09BF','Commercial':'\u09AC\u09BE\u09A3\u09BF\u099C\u09CD\u09AF\u09BF\u0995 \u099C\u09AE\u09BF','Industrial':'\u09B6\u09BF\u09B2\u09CD\u09AA\u099C\u09AE\u09BF','Other':'\u0985\u09A8\u09CD\u09AF','Submit land details':'\u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u09A6\u09BE\u0996\u09BF\u09B2 \u0995\u09B0\u09C1\u09A8','Back to Dashboard':'\u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1\u09C7 \u09AB\u09BF\u09B0\u09C7 \u09AF\u09BE\u09A8','Your details were not sent or verified. This prototype currently supports DEMO-001 and DEMO-002 through reference search only; it cannot retrieve official ownership, mutation, map, or risk information for these entered details.':'\u0986\u09AA\u09A8\u09BE\u09B0 \u09A4\u09A5\u09CD\u09AF \u0995\u09CB\u09A5\u09BE\u0993 \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09AC\u09BE \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09A8\u09BF\u0964 \u098F\u0987 \u09A8\u09AE\u09C1\u09A8\u09BE\u099F\u09BF \u09B6\u09C1\u09A7\u09C1 \u09B0\u09C7\u09AB\u09BE\u09B0\u09C7\u09A8\u09CD\u09B8 \u0996\u09CB\u0981\u099C\u09C7 DEMO-001 \u0993 DEMO-002 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C7; \u098F\u0987 \u09A4\u09A5\u09CD\u09AF \u09A5\u09C7\u0995\u09C7 \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE, \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF, \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0 \u09AC\u09BE \u099D\u09C1\u0981\u0995\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE\u0964',
    'Land records could not be loaded. Check that the backend is running and try again.':'\u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u0986\u09A8\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u09AC\u09CD\u09AF\u09BE\u0995\u098F\u09A8\u09CD\u09A1 \u099A\u09BE\u09B2\u09C1 \u0986\u099B\u09C7 \u0995\u09BF \u09A8\u09BE \u09A6\u09C7\u0996\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964','Land data could not be loaded. Check the backend connection and retry.':'\u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u0986\u09A8\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u09AC\u09CD\u09AF\u09BE\u0995\u098F\u09A8\u09CD\u09A1 \u09B8\u0982\u09AF\u09CB\u0997 \u09AF\u09BE\u099A\u09BE\u09AF\u09BC \u0995\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964','Map tiles are unavailable. Showing the illustrative demo preview.':'\u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0\u09C7\u09B0 \u09AD\u09BF\u09A4\u09CD\u09A4\u09BF \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u09A8\u09AE\u09C1\u09A8\u09BE \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0 \u09A6\u09C7\u0996\u09BE\u09A8\u09CB \u09B9\u099A\u09CD\u099B\u09C7\u0964',
    'Next step':'\u09AA\u09B0\u09AC\u09B0\u09CD\u09A4\u09C0 \u0995\u09B0\u09A3\u09C0\u09DF','Scores are out of 100; changes are points, not percentages. The land record is not changed.':'\u09B8\u09CD\u0995\u09CB\u09B0 100-\u098F\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7; \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u09AA\u09DF\u09C7\u09A8\u09CD\u099F\u09C7 \u09A6\u09C7\u0996\u09BE\u09A8\u09CB \u09B9\u09DF, \u09B6\u09A4\u0995\u09B0\u09BE\u09DF \u09A8\u09DF\u0964 \u099C\u09AE\u09BF\u09B0 \u09A8\u09A5\u09BF \u09AC\u09A6\u09B2\u09BE\u09A8\u09CB \u09B9\u09DF \u09A8\u09BE\u0964',
    'Land Information':'\u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF','Risk Check':'\u099D\u09C1\u0981\u0995\u09BF \u09AF\u09BE\u099A\u09BE\u0987','Documents':'\u0995\u09BE\u0997\u099C\u09AA\u09A4\u09CD\u09B0','Services':'\u09B8\u09C7\u09AC\u09BE\u09B8\u09AE\u09C2\u09B9','Search a land reference.':'\u099C\u09AE\u09BF\u09B0 \u09B0\u09C7\u09AB\u09BE\u09B0\u09C7\u09A8\u09CD\u09B8 \u0996\u09C1\u0981\u099C\u09C1\u09A8\u0964','Review the screening result.':'\u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7\u09B0 \u09AB\u09B2 \u09A6\u09C7\u0996\u09C1\u09A8\u0964','Review document screening.':'\u0995\u09BE\u0997\u099C\u09AA\u09A4\u09CD\u09B0\u09C7\u09B0 \u09AF\u09BE\u099A\u09BE\u0987 \u09A6\u09C7\u0996\u09C1\u09A8\u0964','Current land screening':'\u099C\u09AE\u09BF\u09B0 \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09AF\u09BE\u099A\u09BE\u0987','RISK SUMMARY':'\u099D\u09C1\u0981\u0995\u09BF\u09B0 \u09B8\u09BE\u09B0\u09BE\u0982\u09B6','RISK SCORE':'\u099D\u09C1\u0981\u0995\u09BF\u09B0 \u09B8\u09C2\u099A\u0995','Main reason':'\u09AE\u09C2\u09B2 \u0995\u09BE\u09B0\u09A3','The score and screening result will appear when the land data loads.':'\u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u098F\u09B2\u09C7 \u099D\u09C1\u0981\u0995\u09BF\u09B0 \u09B8\u09C2\u099A\u0995 \u0993 \u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7\u09B0 \u09AB\u09B2 \u09A6\u09C7\u0996\u09BE \u09AF\u09BE\u09AC\u09C7\u0964','View risk details':'\u099D\u09C1\u0981\u0995\u09BF\u09B0 \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09A6\u09C7\u0996\u09C1\u09A8','Demo Data':'\u09A1\u09C7\u09AE\u09CB \u09A4\u09A5\u09CD\u09AF','Synthetic Demo Owner 002':'\u09A8\u09AE\u09C1\u09A8\u09BE \u09AE\u09BE\u09B2\u09BF\u0995 002','Synthetic Mouza 002':'\u09A8\u09AE\u09C1\u09A8\u09BE \u09AE\u09CC\u099C\u09BE 002','Synthetic demo timeline. Confirm the mutation record through authorized sources.':'\u09A8\u09AE\u09C1\u09A8\u09BE \u09B8\u09AE\u09DF\u09B0\u09C7\u0996\u09BE\u0964 \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 \u09B8\u09C2\u09A4\u09CD\u09B0\u09C7 \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'LandShield — Land Intelligence':'LandShield — জমির তথ্য',
    'Check before you':'জমি কেনার আগে',
    'buy land.':'যাচাই করুন',
    'Understand land information, possible risks, and what to do next.':'জমির তথ্য, সম্ভাব্য ঝুঁকি ও পরবর্তী করণীয় বুঝুন।',
    'LANDSHIELD SERVICES':'LandShield-এর সেবাসমূহ',
    'What would you like to check?':'কোন তথ্য যাচাই করতে চান?',
    'Choose a topic to go to its existing dashboard section.':'নিচের বিষয় বেছে নিয়ে বিস্তারিত দেখুন।',
    'Find land information':'জমির তথ্য খুঁজুন',
    'Search for a demo land reference.':'ডেমো জমির রেফারেন্স নম্বর খুঁজুন।',
    'Check land risk':'জমির ঝুঁকি যাচাই',
    'See the score, screening result, and warnings.':'ঝুঁকির সূচক, যাচাইয়ের ফল ও সতর্কতা দেখুন।',
    'Ownership and mutation':'মালিকানা ও নামজারি',
    'Review the available ownership timeline.':'পাওয়া মালিকানা-সংক্রান্ত সময়রেখা দেখুন।',
    'Document screening':'কাগজপত্রের প্রাথমিক যাচাই',
    'Check recorded fields and review items.':'নথিভুক্ত তথ্য ও পর্যালোচনার বিষয় দেখুন।',
    'Land map':'জমির মানচিত্র',
    'View the approximate demo location.':'ডেমো জমির আনুমানিক অবস্থান দেখুন।',
    'Digital land model':'জমির নমুনা মডেল',
    'Explore the illustrative 3D model.':'জমির ধারণামূলক 3D মডেল দেখুন।',
    'What-if simulator':'বিকল্প পরিস্থিতির সিমুলেটর',
    'Compare possible risk scenarios.':'সম্ভাব্য ঝুঁকির পরিস্থিতিগুলো তুলনা করুন।',
    'Final report':'চূড়ান্ত প্রতিবেদন',
    'Review, refresh, or print the summary.':'সারাংশ দেখুন, হালনাগাদ করুন বা প্রিন্ট করুন।',
    'Calculate result':'ফল হিসাব করুন',
    'Selected scenario:':'নির্বাচিত পরিস্থিতি:',
    'Result calculated':'ফল হিসাব করা হয়েছে',
    'Calculating scenario with the risk engine…':'ঝুঁকি বিশ্লেষণ দিয়ে হিসাব করা হচ্ছে…',
    'Select a land record before calculating.':'হিসাবের আগে একটি জমির তথ্য নির্বাচন করুন।',
    'Choose a scenario, then calculate the result.':'একটি পরিস্থিতি বেছে নিয়ে ফল হিসাব করুন।',
    'The previous result was cleared. Calculate again to see this scenario.':'আগের ফল সরানো হয়েছে। এই পরিস্থিতির ফল দেখতে আবার হিসাব করুন।',
    'Current score':'বর্তমান ঝুঁকির সূচক',
    'Scenario score':'পরিস্থিতির ঝুঁকির সূচক',
    'Risk category':'ঝুঁকির মাত্রা',
    'Screening outcome':'যাচাইয়ের ফল',
    'Not provided by the What-If API.':'What-If API-তে এই তথ্য নেই।',
    'Could not calculate this scenario.':'এই পরিস্থিতির হিসাব করা যায়নি।',
    'A calculated risk score was not returned.':'হিসাব করা ঝুঁকির সূচক পাওয়া যায়নি।',
    'Hypothetical result:':'সম্ভাব্য ফল:',
    'Scenario changed. Calculate again to see this result.':'পরিস্থিতি বদলেছে। ফল দেখতে আবার হিসাব করুন।',
    'LAND INTELLIGENCE':'জমি সংক্রান্ত তথ্য',
    'WORKSPACE':'কাজের জায়গা',
    'Demo screening disclaimer':'ডেমো যাচাইয়ের ঘোষণা',
    'Land overview metrics':'জমির সংক্ষিপ্ত তথ্য',
    'Zoom in':'মানচিত্র বড় করুন',
    'Zoom out':'মানচিত্র ছোট করুন',
    'Center on parcel':'জমির অবস্থানে যান',
    'Interactive conceptual land model':'জমির ধারণামূলক নমুনা মডেল',
    'Loading lands…':'জমির তথ্য আনা হচ্ছে…',
    'Loading':'তথ্য আসছে',
    'checks':'যাচাই',
    'reported':'নথিভুক্ত',
    'See risk factors':'ঝুঁকির কারণ দেখুন',
    'Checking…':'যাচাই হচ্ছে…',
    'Location not supplied by API':'অবস্থানের তথ্য পাওয়া যায়নি',
    'Land parcel details from registry':'জমির রেকর্ডের তথ্য',
    'Assessment from risk engine':'ঝুঁকি বিশ্লেষণের ফল',
    'NO RECORDS':'কোনো নথি নেই',
    'UNAVAILABLE':'তথ্য পাওয়া যায়নি',
    'UNKNOWN':'অজানা',
    'ASSESSED':'যাচাই করা হয়েছে',
    'CURRENT':'বর্তমান',
    'Date not provided':'তারিখ দেওয়া নেই',
    'Status not provided':'অবস্থা উল্লেখ নেই',
    'No description was provided by the backend.':'এই তথ্যের কোনো বিবরণ পাওয়া যায়নি।',
    'No description provided.':'কোনো বিবরণ পাওয়া যায়নি।',
    'No mutation history events are available for this land.':'এই জমির নামজারির ইতিহাস পাওয়া যায়নি।',
    'Map library unavailable. Showing an illustrative preview.':'মানচিত্র দেখানোর সুবিধা পাওয়া যায়নি। নমুনা মানচিত্র দেখানো হচ্ছে।',
    'No coordinates returned. Showing an illustrative preview.':'অবস্থানের স্থানাঙ্ক পাওয়া যায়নি। নমুনা মানচিত্র দেখানো হচ্ছে।',
    'Expand map':'মানচিত্র বড় করুন',
    'Collapse map':'মানচিত্র ছোট করুন',
    'Flat':'সমতল',
    'Residential':'বসতভিটা',
    'Owner':'মালিক',
    'Location':'অবস্থান',
    'Demo Owner':'ডেমো মালিক',
    'Demo Mouza':'ডেমো মৌজা',
    'Dhaka':'ঢাকা',
    'Savar':'সাভার'
  });
  const DIGITAL_TWIN_TRANSLATIONS = Object.freeze({
    'Reset':'\u09AB\u09C7\u09B0\u09BE\u09A8','Approximate boundary returned · stylized illustration':'\u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u0986\u09A8\u09C1\u09AE\u09BE\u09A8\u09BF\u0995 \u09B8\u09C0\u09AE\u09BE\u09A8\u09BE · \u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 \u099A\u09BF\u09A4\u09CD\u09B0','Illustrative plot layout · no boundary returned':'\u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 \u099C\u09AE\u09BF\u09B0 \u09A8\u0995\u09B6\u09BE · \u09B8\u09C0\u09AE\u09BE\u09A8\u09BE\u09B0 \u09A4\u09A5\u09CD\u09AF \u09A8\u09C7\u0987','An approximate boundary is returned for this demo record; its shape is shown schematically and is not to scale.':'\u098F\u0987 \u09A1\u09C7\u09AE\u09CB \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u0986\u09A8\u09C1\u09AE\u09BE\u09A8\u09BF\u0995 \u09B8\u09C0\u09AE\u09BE\u09A8\u09BE \u0986\u099B\u09C7; \u09A4\u09BE\u09B0 \u0986\u0995\u09C3\u09A4\u09BF \u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995 \u098F\u09AC\u0982 \u09AE\u09BE\u09AA \u0985\u09A8\u09C1\u09AF\u09BE\u09AF\u09BC\u09C0 \u09A8\u09AF\u09BC.','No boundary was returned for this record; the visible plot is illustrative.':'\u098F\u0987 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7\u09B0 \u09B8\u09C0\u09AE\u09BE\u09A8\u09BE \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF; \u09A6\u09C3\u09B6\u09CD\u09AF\u09AE\u09BE\u09A8 \u099C\u09AE\u09BF \u09A7\u09BE\u09B0\u09A3\u09BE\u09AE\u09C2\u09B2\u0995.'
  });
  const MAP_TRANSLATIONS = Object.freeze({
    'Selected land record has no coordinates; the map cannot be centered without coordinates.':'\u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u099C\u09AE\u09BF\u09B0 \u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u0999\u09CD\u0995 \u09A8\u09C7\u0987; \u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u0999\u09CD\u0995 \u099B\u09BE\u09A1\u09BC\u09BE \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0\u09C7 \u099C\u09AE\u09BF \u09A6\u09C7\u0996\u09BE\u09A8\u09CB \u09AF\u09BE\u09AF\u09BC \u09A8\u09BE.','Leaflet could not be loaded. A geographic map is unavailable.':'Leaflet \u09B2\u09CB\u09A1 \u09B9\u09AF\u09BC\u09A8\u09BF; \u09AD\u09CC\u0997\u09CB\u09B2\u09BF\u0995 \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0 \u09A6\u09C7\u0996\u09BE\u09AF\u09BC \u09A8\u09BE.','Satellite imagery tiles failed. The street map remains available.':'\u09B8\u09CD\u09AF\u09BE\u099F\u09C7\u09B2\u09BE\u0987\u099F \u099B\u09AC\u09BF \u09B2\u09CB\u09A1 \u09B9\u09AF\u09BC\u09A8\u09BF; \u09B0\u09BE\u09B8\u09CD\u09A4\u09BE\u09B0 \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09BE \u09AF\u09BE\u09AC\u09C7.','Street map tiles could not load. Check the network connection and retry.':'\u09B0\u09BE\u09B8\u09CD\u09A4\u09BE\u09B0 \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0 \u09B2\u09CB\u09A1 \u09B9\u09AF\u09BC\u09A8\u09BF; \u09A8\u09C7\u099F\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u0995 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8.'
  });
  const CHECK_LAND_TRANSLATIONS = Object.freeze({
    'Enter your land details for a preliminary prototype screening.':'\u09AA\u09CD\u09B0\u09CB\u099F\u09CB\u099F\u09BE\u0987\u09AA\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u09A5\u09AE\u09BF\u0995 \u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u09A6\u09BF\u09A8\u0964',
    'Prototype screening only':'\u09B6\u09C1\u09A7\u09C1 \u09A8\u09AE\u09C1\u09A8\u09BE \u09AF\u09BE\u099A\u09BE\u0987',
    'Details entered here are not sent to official land records and are not officially verified. This prototype currently screens only DEMO-001 and DEMO-002 through reference ID search.':'\u098F\u0996\u09BE\u09A8\u09C7 \u09A6\u09C7\u0993\u09DF\u09BE \u09A4\u09A5\u09CD\u09AF \u0995\u09CB\u09A8\u09CB \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09AD\u09C2\u09AE\u09BF \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09DF \u09A8\u09BE \u098F\u09AC\u0982 \u09B8\u09B0\u0995\u09BE\u09B0\u09BF\u09AD\u09BE\u09AC\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09B9\u09DF \u09A8\u09BE\u0964 \u098F\u0987 \u09AA\u09CD\u09B0\u09CB\u099F\u09CB\u099F\u09BE\u0987\u09AA \u09B6\u09C1\u09A7\u09C1 DEMO-001 \u0993 DEMO-002 \u09B0\u09C7\u09AB\u09BE\u09B0\u09C7\u09A8\u09CD\u09B8 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09DF\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C7\u0964',
    'Land Records':'\u099C\u09AE\u09BF\u09B0 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1',
    'Land Details':'\u099C\u09AE\u09BF\u09B0 \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09A4\u09A5\u09CD\u09AF',
    'Enter district name':'\u099C\u09C7\u09B2\u09BE\u09B0 \u09A8\u09BE\u09AE \u09B2\u09BF\u0996\u09C1\u09A8',
    'Enter upazila name':'\u0989\u09AA\u099C\u09C7\u09B2\u09BE\u09B0 \u09A8\u09BE\u09AE \u09B2\u09BF\u0996\u09C1\u09A8',
    'Enter mouza name':'\u09AE\u09CC\u099C\u09BE\u09B0 \u09A8\u09BE\u09AE \u09B2\u09BF\u0996\u09C1\u09A8',
    'Enter dag number':'\u09A6\u09BE\u0997 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09B2\u09BF\u0996\u09C1\u09A8',
    'Enter khatian number':'\u0996\u09A4\u09BF\u09DF\u09BE\u09A8 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09B2\u09BF\u0996\u09C1\u09A8',
    'e.g., 12.5':'\u09AF\u09C7\u09AE\u09A8, \u09E7\u09E8.\u09EB',
    '* All fields are required':'* \u09B8\u09AC \u09A4\u09A5\u09CD\u09AF \u09AA\u09C2\u09B0\u09A3 \u0995\u09B0\u09C1\u09A8'
  });
  const RISK_ACTION_TRANSLATIONS = Object.freeze({
    'Ownership':'\u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE', 'Mutation':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF', 'Document Verification':'\u0995\u09BE\u0997\u099C\u09AA\u09A4\u09CD\u09B0 \u09AF\u09BE\u099A\u09BE\u0987', 'Dispute':'\u09AC\u09BF\u09B0\u09CB\u09A7', 'Khas Land':'\u0996\u09BE\u09B8 \u099C\u09AE\u09BF', 'Acquisition':'\u0985\u09A7\u09BF\u0997\u09CD\u09B0\u09B9\u09A3',
    'View Actions':'\u0995\u09B0\u09A3\u09C0\u09DF \u09A6\u09C7\u0996\u09C1\u09A8', 'What this means':'\u098F\u09B0 \u09AE\u09BE\u09A8\u09C7', 'Steps you can take':'\u0986\u09AA\u09A8\u09BF \u09AF\u09BE \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8', 'Who to contact':'\u0995\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AF\u09CB\u0997\u09BE\u09AF\u09CB\u0997 \u0995\u09B0\u09AC\u09C7\u09A8', 'Documents you may need':'\u09AF\u09C7 \u0995\u09BE\u0997\u099C\u09AA\u09A4\u09CD\u09B0 \u09B2\u09BE\u0997\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7',
    'General prototype guidance only — not official legal advice.':'\u098F\u0997\u09C1\u09B2\u09CB \u09AA\u09CD\u09B0\u09CB\u099F\u09CB\u099F\u09BE\u0987\u09AA\u09C7\u09B0 \u09B8\u09BE\u09A7\u09BE\u09B0\u09A3 \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6; \u0986\u0987\u09A8\u09BF \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6 \u09AC\u09BE \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6 \u09A8\u09DF\u0964',
    'Mutation status in selected land record: ':'\u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u099C\u09AE\u09BF\u09B0 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE: ',
    '. The risk API did not return a separate mutation score.':'. \u099D\u09C1\u0981\u0995\u09BF\u09B0 API \u09A5\u09C7\u0995\u09C7 \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0986\u09B2\u09BE\u09A6\u09BE \u09B8\u09CD\u0995\u09CB\u09B0 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF.',
    'No separate mutation risk score was returned.':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0986\u09B2\u09BE\u09A6\u09BE \u099D\u09C1\u0981\u0995\u09BF\u09B0 \u09B8\u09CD\u0995\u09CB\u09B0 \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u09DF\u09A8\u09BF\u0964',
    'No result for this category was returned by the risk API.':'\u099D\u09C1\u0981\u0995\u09BF\u09B0 API \u098F\u0987 \u09AC\u09BF\u09AD\u09BE\u0997\u09C7\u09B0 \u0995\u09CB\u09A8\u09CB \u09AB\u09B2 \u09A6\u09C7\u09DF\u09A8\u09BF\u0964',
    'Current record:':'\u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1:',
    'No acquisition indicator is recorded.':'\u0985\u09A7\u09BF\u0997\u09CD\u09B0\u09B9\u09A3\u09C7\u09B0 \u0995\u09CB\u09A8\u09CB \u09B8\u09C2\u099A\u0995 \u09A8\u09A5\u09BF\u09A4\u09C7 \u09A8\u09C7\u0987\u0964',
    'Active or pending dispute indicator detected.':'\u09B8\u0995\u09CD\u09B0\u09BF\u09DF \u09AC\u09BE \u099A\u09B2\u09AE\u09BE\u09A8 \u09AC\u09BF\u09B0\u09CB\u09A7\u09C7\u09B0 \u09B8\u09C2\u099A\u0995 \u09AA\u09BE\u0993\u09DF\u09BE \u0997\u09C7\u099B\u09C7\u0964',
    'Khatian, dag and land area are recorded; document authenticity has not been verified.':'\u0996\u09A4\u09BF\u09DF\u09BE\u09A8, \u09A6\u09BE\u0997 \u0993 \u099C\u09AE\u09BF\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u09A8\u09A5\u09BF\u09A4\u09C7 \u0986\u099B\u09C7; \u0995\u09BE\u0997\u099C\u09C7\u09B0 \u0986\u09B8\u09B2\u09BF\u09DF\u09BE\u09A4 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09B9\u09DF\u09A8\u09BF\u0964',
    'No khas land indicator is recorded.':'\u0996\u09BE\u09B8 \u099C\u09AE\u09BF\u09B0 \u0995\u09CB\u09A8\u09CB \u09B8\u09C2\u099A\u0995 \u09A8\u09A5\u09BF\u09A4\u09C7 \u09A8\u09C7\u0987\u0964',
    'Mutation is not complete; ownership requires verification.':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B9\u09DF\u09A8\u09BF; \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09A6\u09B0\u0995\u09BE\u09B0\u0964',
    'Mutation is recorded as complete; verify ownership with official records.':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09AC\u09B2\u09C7 \u09A8\u09A5\u09BF\u09A4\u09C7 \u0986\u099B\u09C7; \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'No dispute indicator is recorded.':'\u09AC\u09BF\u09B0\u09CB\u09A7\u09C7\u09B0 \u0995\u09CB\u09A8\u09CB \u09B8\u09C2\u099A\u0995 \u09A8\u09A5\u09BF\u09A4\u09C7 \u09A8\u09C7\u0987\u0964',
    'Assessment from risk engine':'\u099D\u09C1\u0981\u0995\u09BF \u09AC\u09BF\u09B6\u09CD\u09B2\u09C7\u09B7\u09A3\u09C7\u09B0 \u09AB\u09B2',
    'Review the available category information with an independent land professional.':'\u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AD\u09C2\u09AE\u09BF \u09AA\u09C7\u09B6\u09BE\u099C\u09C0\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AA\u09BE\u0993\u09DF\u09BE \u09A4\u09A5\u09CD\u09AF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'Compare this information with the original land papers.':'\u098F\u0987 \u09A4\u09A5\u09CD\u09AF \u09AE\u09C2\u09B2 \u099C\u09AE\u09BF\u09B0 \u0995\u09BE\u0997\u099C\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09BF\u09B2\u09BF\u09DF\u09C7 \u09A6\u09C7\u0996\u09C1\u09A8\u0964',
    'Ask an independent land professional to review any unclear item before paying.':'\u0995\u09CB\u09A8\u09CB \u09A4\u09A5\u09CD\u09AF \u09AC\u09C1\u099D\u09A4\u09C7 \u0985\u09B8\u09C1\u09AC\u09BF\u09A7\u09BE \u09B9\u09B2\u09C7 \u099F\u09BE\u0995\u09BE \u09A6\u09C7\u0993\u09DF\u09BE\u09B0 \u0986\u0997\u09C7 \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AD\u09C2\u09AE\u09BF \u09AA\u09C7\u09B6\u09BE\u099C\u09C0\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09C1\u09A8\u0964',
    'Relevant land-record office or an independent land professional.':'\u09B8\u0982\u09B6\u09CD\u09B2\u09BF\u09B7\u09CD\u099F \u09AD\u09C2\u09AE\u09BF \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u0985\u09AB\u09BF\u09B8 \u09AC\u09BE \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AD\u09C2\u09AE\u09BF \u09AA\u09C7\u09B6\u09BE\u099C\u09C0\u0964',
    'Deed, khatian, mutation papers, and any documents related to this item.':'\u09A6\u09B2\u09BF\u09B2, \u0996\u09A4\u09BF\u09DF\u09BE\u09A8, \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0995\u09BE\u0997\u099C \u098F\u09AC\u0982 \u098F\u0987 \u09AC\u09BF\u09B7\u09DF\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09B8\u0982\u09B6\u09CD\u09B2\u09BF\u09B7\u09CD\u099F \u0985\u09A8\u09CD\u09AF \u0995\u09BE\u0997\u099C\u0964',
    'pending':'\u099A\u09B2\u09AE\u09BE\u09A8', 'completed':'\u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8', 'clear':'\u09AA\u09B0\u09BF\u09B7\u09CD\u0995\u09BE\u09B0', 'no':'\u09A8\u09C7\u0987', 'active':'\u09B8\u0995\u09CD\u09B0\u09BF\u09DF',
    'Low Risk':'\u0995\u09AE \u099D\u09C1\u0981\u0995\u09BF', 'Medium Risk':'\u09AE\u09BE\u099D\u09BE\u09B0\u09BF \u099D\u09C1\u0981\u0995\u09BF', 'High Risk':'\u09AC\u09C7\u09B6\u09BF \u099D\u09C1\u0981\u0995\u09BF', 'Not Provided':'\u09A4\u09A5\u09CD\u09AF \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u09DF\u09A8\u09BF',
    'LOW RISK':'\u0995\u09AE \u099D\u09C1\u0981\u0995\u09BF', 'MEDIUM RISK':'\u09AE\u09BE\u099D\u09BE\u09B0\u09BF \u099D\u09C1\u0981\u0995\u09BF', 'HIGH RISK':'\u09AC\u09C7\u09B6\u09BF \u099D\u09C1\u0981\u0995\u09BF',
    'Active dispute detected':'\u099C\u09AE\u09BF \u09A8\u09BF\u09DF\u09C7 \u099A\u09B2\u09AE\u09BE\u09A8 \u09AC\u09BF\u09B0\u09CB\u09A7',
    'Resolve and verify the dispute before proceeding.':'\u099C\u09AE\u09BF\u099F\u09BF \u09A8\u09BF\u09DF\u09C7 \u09AC\u09BF\u09B0\u09CB\u09A7\u09C7\u09B0 \u0987\u0999\u09CD\u0997\u09BF\u09A4 \u09AA\u09BE\u0993\u09DF\u09BE \u0997\u09C7\u099B\u09C7\u0964 \u0995\u09C7\u09A8\u09BE\u09B0 \u0986\u0997\u09C7 \u09AC\u09BF\u09B0\u09CB\u09A7\u09C7\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'Verification Required':'\u09AF\u09BE\u099A\u09BE\u0987 \u099C\u09B0\u09C1\u09B0\u09BF',
    'Mutation Pending':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u099A\u09B2\u09AE\u09BE\u09A8', 'Mutation Completed':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8',
    'Previous owner':'\u0986\u0997\u09C7\u09B0 \u09AE\u09BE\u09B2\u09BF\u0995', 'New owner':'\u09A8\u09A4\u09C1\u09A8 \u09AE\u09BE\u09B2\u09BF\u0995', 'Ownership transfer event':'\u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u0998\u099F\u09A8\u09BE', 'Mutation status':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE',
    'Illustrative':'\u0989\u09A6\u09BE\u09B9\u09B0\u09A3\u09AE\u09BE\u09A4\u09CD\u09B0', 'Recorded':'\u09A8\u09A5\u09BF\u09AD\u09C1\u0995\u09CD\u09A4', 'Ownership record':'\u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B0\u09C7\u0995\u09B0\u09CD\u09A1', 'Ownership transfer':'\u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0',
    'Expand to view details':'\u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09A6\u09C7\u0996\u09A4\u09C7 \u0996\u09C1\u09B2\u09C1\u09A8', 'Collapse details':'\u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09A4\u09A5\u09CD\u09AF \u09AC\u09A8\u09CD\u09A7 \u0995\u09B0\u09C1\u09A8',
    'Land Classification':'\u099C\u09AE\u09BF\u09B0 \u09B6\u09CD\u09B0\u09C7\u09A3\u09BF', 'Recorded Owner':'\u09A8\u09A5\u09BF\u09AD\u09C1\u0995\u09CD\u09A4 \u09AE\u09BE\u09B2\u09BF\u0995', 'Record Information':'\u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF', 'Record source':'\u09A4\u09A5\u09CD\u09AF\u09B8\u09C2\u09A4\u09CD\u09B0',
    '5.00 decimal':'5.00 \u09B6\u09A4\u09BE\u0982\u09B6',
    'Sample Mouza':'\u09A8\u09AE\u09C1\u09A8\u09BE \u09AE\u09CC\u099C\u09BE', 'Previous Owner':'\u0986\u0997\u09C7\u09B0 \u09AE\u09BE\u09B2\u09BF\u0995', 'Mutation Status':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE',
    'Illustrative sample details only; badges reflect screening data and do not mean official verification.':'\u09B6\u09C1\u09A7\u09C1 \u09A8\u09AE\u09C1\u09A8\u09BE \u09A4\u09A5\u09CD\u09AF; \u09AC\u09CD\u09AF\u09BE\u099C\u0997\u09C1\u09B2\u09CB \u09AA\u09CD\u09B0\u09BE\u09A5\u09AE\u09BF\u0995 \u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u09A6\u09C7\u0996\u09BE\u09DF; \u098F\u0997\u09C1\u09B2\u09CB \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u09A8\u09DF\u0964',
    'Fictional sample value; not officially verified.':'\u0995\u09BE\u09B2\u09CD\u09AA\u09A8\u09BF\u0995 \u09A8\u09AE\u09C1\u09A8\u09BE \u09A4\u09A5\u09CD\u09AF; \u09B8\u09B0\u0995\u09BE\u09B0\u09BF\u09AD\u09BE\u09AC\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u09B9\u09DF\u09A8\u09BF\u0964',
    'Fictional prototype sample; not officially verified.':'\u09AA\u09CD\u09B0\u09CB\u099F\u09CB\u099F\u09BE\u0987\u09AA\u09C7\u09B0 \u0995\u09BE\u09B2\u09CD\u09AA\u09A8\u09BF\u0995 \u09A8\u09AE\u09C1\u09A8\u09BE; \u09B8\u09B0\u0995\u09BE\u09B0\u09BF\u09AD\u09BE\u09AC\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u09B9\u09DF\u09A8\u09BF\u0964',
    'Pending review':'\u09AA\u09B0\u09CD\u09AF\u09BE\u09B2\u09CB\u099A\u09A8\u09BE\u09A7\u09C0\u09A8', 'Confirm the mutation status and compare the ownership papers with an independent land professional before purchase.':'\u0995\u09C7\u09A8\u09BE\u09B0 \u0986\u0997\u09C7 \u09AE\u09BF\u0989\u099F\u09C7\u09B6\u09A8\u09C7\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8 \u098F\u09AC\u0982 \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AD\u09C2\u09AE\u09BF \u09AA\u09C7\u09B6\u09BE\u099C\u09C0\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE\u09B0 \u0995\u09BE\u0997\u099C \u09AE\u09BF\u09B2\u09BF\u09DF\u09C7 \u09A6\u09C7\u0996\u09C1\u09A8\u0964',
    'Shown as an initial land ownership record.':'\u099C\u09AE\u09BF\u09B0 \u09AA\u09CD\u09B0\u09BE\u09A5\u09AE\u09BF\u0995 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09A6\u09C7\u0996\u09BE\u09A8\u09CB \u09B9\u09AC\u09C7\u0964',
    'An ownership transfer event shown as an example.':'\u0989\u09A6\u09BE\u09B9\u09B0\u09A3 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u098F\u0995\u099F\u09BF \u0998\u099F\u09A8\u09BE \u09A6\u09C7\u0996\u09BE\u09A8\u09CB \u09B9\u09AC\u09C7\u0964',
    'Mutation status shown as under review.':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u09AA\u09B0\u09CD\u09AF\u09BE\u09B2\u09CB\u099A\u09A8\u09BE\u09A7\u09C0\u09A8 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09A6\u09C7\u0996\u09BE\u09A8\u09CB \u09B9\u09AC\u09C7\u0964',
    'Fictional DEMO-001 timeline shown for prototype display only; it is not verified API or land history.':'DEMO-001\u098f\u09b0 \u098f\u0987 \u09b8\u09ae\u09df\u09b0\u09c7\u0996\u09be \u09aa\u09cd\u09b0\u09cb\u099f\u09cb\u099f\u09be\u0987\u09aa\u09c7\u09b0 \u0995\u09be\u09b2\u09cd\u09aa\u09a8\u09bf\u0995 \u09a8\u09ae\u09c1\u09a8\u09be; \u098f\u099f\u09bf API \u09ac\u09be \u099c\u09ae\u09bf\u09b0 \u09af\u09be\u099a\u09be\u0987\u0995\u09c3\u09a4 \u0987\u09a4\u09bf\u09b9\u09be\u09b8 \u09a8\u09df\u0964',
    'Illustrative Owner A (placeholder)':'\u09A8\u09AE\u09C1\u09A8\u09BE \u09AE\u09BE\u09B2\u09BF\u0995 A (\u0989\u09A6\u09BE\u09B9\u09B0\u09A3\u09AE\u09BE\u09A4\u09CD\u09B0)', 'Illustrative Owner B (placeholder)':'\u09A8\u09AE\u09C1\u09A8\u09BE \u09AE\u09BE\u09B2\u09BF\u0995 B (\u0989\u09A6\u09BE\u09B9\u09B0\u09A3\u09AE\u09BE\u09A4\u09CD\u09B0)', 'Not provided by API':'\u098F\u09AA\u0986\u0987\u09A4\u09C7 \u09A8\u09C7\u0987', 'Not recorded':'\u09A8\u09A5\u09BF\u09A4 \u09A8\u09C7\u0987', 'No ownership transfer event returned':'\u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u0995\u09CB\u09A8\u09CB \u0998\u099F\u09A8\u09BE \u098F\u09AA\u0986\u0987\u09A4\u09C7 \u09A8\u09C7\u0987',
    'Record created':'\u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09A4\u09C8\u09B0\u09BF', 'Mutation review':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u09AA\u09B0\u09CD\u09AF\u09BE\u09B2\u09CB\u099A\u09A8\u09BE', 'Mutation status recorded':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u09A8\u09A5\u09BF\u09AD\u09C1\u0995\u09CD\u09A4',
    'A record entry was created.':'\u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u098F\u0995\u099F\u09BF \u098F\u09A8\u09CD\u099F\u09CD\u09B0\u09BF \u09A4\u09C8\u09B0\u09BF \u09B9\u09DF\u09C7\u099B\u09C7\u0964',
    'Mutation review status: pending.':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u09AA\u09B0\u09CD\u09AF\u09BE\u09B2\u09CB\u099A\u09A8\u09BE\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE: \u099A\u09B2\u09AE\u09BE\u09A8\u0964',
    'Mutation status was recorded as completed.':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09A8\u09A5\u09BF\u09AD\u09C1\u0995\u09CD\u09A4 \u09B9\u09DF\u09C7\u099B\u09C7\u0964',
    'Mutation status in this record: ':'\u098F\u0987 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE: ', 'The API provides no previous or new owner names.':'API-\u09A4\u09C7 \u0986\u0997\u09C7\u09B0 \u09AC\u09BE \u09A8\u09A4\u09C1\u09A8 \u09AE\u09BE\u09B2\u09BF\u0995\u09C7\u09B0 \u09A8\u09BE\u09AE \u09A8\u09C7\u0987\u0964', 'No ownership transfer event was returned by the API.':'API \u09A5\u09C7\u0995\u09C7 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u0995\u09CB\u09A8\u09CB \u0998\u099F\u09A8\u09BE \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964',
    'This synthetic timeline is for prototype display only. Owner names are illustrative placeholders; no ownership transfer event was returned.':'\u098F\u0987 \u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE \u09B8\u09AE\u09DF\u09B0\u09C7\u0996\u09BE \u09B6\u09C1\u09A7\u09C1 \u09AA\u09CD\u09B0\u09CB\u099F\u09CB\u099F\u09BE\u0987\u09AA\u09C7 \u09A6\u09C7\u0996\u09BE\u09A8\u09CB\u09B0 \u099C\u09A8\u09CD\u09AF\u0964 \u09AE\u09BE\u09B2\u09BF\u0995\u09C7\u09B0 \u09A8\u09BE\u09AE\u0997\u09C1\u09B2\u09CB \u0989\u09A6\u09BE\u09B9\u09B0\u09A3\u09AE\u09BE\u09A4\u09CD\u09B0; API-\u09A4\u09C7 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u0998\u099F\u09A8\u09BE \u09A8\u09C7\u0987\u0964',
    'Previous mutation status is inconsistent with this history. Please verify the record.':'\u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u0987\u09A4\u09BF\u09B9\u09BE\u09B8\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09BF\u09B2\u099B\u09C7 \u09A8\u09BE; \u09A8\u09A5\u09BF\u099F\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'Mutation is pending in the selected record. Review the timeline events and status badges below.':'\u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u099A\u09B2\u09AE\u09BE\u09A8 \u0986\u099B\u09C7\u0964 \u09A8\u09BF\u099A\u09C7\u09B0 \u09B8\u09AE\u09DF\u09B0\u09C7\u0996\u09BE \u0993 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09B0 \u099A\u09BF\u09B9\u09CD\u09A8\u0997\u09C1\u09B2\u09CB \u09A6\u09C7\u0996\u09C1\u09A8\u0964',
    'Mutation is recorded as completed in the selected record. Review the timeline events below.':'\u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09A8\u09A5\u09BF\u09AD\u09C1\u0995\u09CD\u09A4 \u0986\u099B\u09C7\u0964 \u09A8\u09BF\u099A\u09C7\u09B0 \u09B8\u09AE\u09DF\u09B0\u09C7\u0996\u09BE \u09A6\u09C7\u0996\u09C1\u09A8\u0964',
    'Record entry created; the API returned no ownership transfer details.':'\u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u098F\u0995\u099F\u09BF \u098F\u09A8\u09CD\u099F\u09CD\u09B0\u09BF \u09A4\u09C8\u09B0\u09BF \u09B9\u09DF\u09C7\u099B\u09C7; API-\u09A4\u09C7 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u09A8\u09C7\u0987\u0964',
    'Synthetic timeline shown for prototype screening only.':'\u09AA\u09CD\u09B0\u09CB\u099F\u09CB\u099F\u09BE\u0987\u09AA \u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE \u09B8\u09AE\u09DF\u09B0\u09C7\u0996\u09BE \u09A6\u09C7\u0996\u09BE\u09A8\u09CB \u09B9\u099A\u09CD\u099B\u09C7\u0964',
    'The timeline shows only information returned by the API; missing owner or transfer details are not inferred.':'\u09B8\u09AE\u09DF\u09B0\u09C7\u0996\u09BE\u09DF \u09B6\u09C1\u09A7\u09C1 API \u09A5\u09C7\u0995\u09C7 \u09AA\u09BE\u0993\u09DF\u09BE \u09A4\u09A5\u09CD\u09AF \u09A6\u09C7\u0996\u09BE\u09A8\u09CB \u09B9\u09DF; \u09AE\u09BE\u09B2\u09BF\u0995 \u09AC\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u0985\u09A8\u09C1\u09AA\u09B8\u09CD\u09A5\u09BF\u09A4 \u09A4\u09A5\u09CD\u09AF \u0985\u09A8\u09C1\u09AE\u09BE\u09A8 \u0995\u09B0\u09BE \u09B9\u09DF\u09A8\u09BF\u0964',
    'This timeline is a prototype screening aid. Confirm ownership and mutation details with authorized sources.':'\u098F\u0987 \u09B8\u09AE\u09DF\u09B0\u09C7\u0996\u09BE \u09AA\u09CD\u09B0\u09CB\u099F\u09CB\u099F\u09BE\u0987\u09AA\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u09A5\u09AE\u09BF\u0995 \u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7\u09B0 \u09B8\u09B9\u09BE\u09DF\u0995\u0964 \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 \u09B8\u09C2\u09A4\u09CD\u09B0\u09C7 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u0993 \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'Compare the seller and land details across the deed, khatian, and selected record.':'\u09A6\u09B2\u09BF\u09B2, \u0996\u09A4\u09BF\u09DF\u09BE\u09A8 \u0993 \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u09C7 \u09AC\u09BF\u0995\u09CD\u09B0\u09C7\u09A4\u09BE \u0993 \u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AE\u09BF\u09B2\u09BF\u09DF\u09C7 \u09A6\u09C7\u0996\u09C1\u09A8\u0964',
    'Ask for earlier ownership papers and have any mismatch reviewed before paying.':'\u0986\u0997\u09C7\u09B0 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE\u09B0 \u0995\u09BE\u0997\u099C \u099A\u09BE\u0987\u09A8; \u09A4\u09A5\u09CD\u09AF\u09C7 \u09AE\u09BF\u09B2 \u09A8\u09BE \u09A5\u09BE\u0995\u09B2\u09C7 \u099F\u09BE\u0995\u09BE \u09A6\u09C7\u0993\u09DF\u09BE\u09B0 \u0986\u0997\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE\u09A8\u0964',
    'Check the mutation order and latest khatian against the status shown here.':'\u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0986\u09A6\u09C7\u09B6 \u0993 \u09B8\u09B0\u09CD\u09AC\u09B6\u09C7\u09B7 \u0996\u09A4\u09BF\u09DF\u09BE\u09A8\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u098F\u0996\u09BE\u09A8\u09C7\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u09AE\u09BF\u09B2\u09BF\u09DF\u09C7 \u09A6\u09C7\u0996\u09C1\u09A8\u0964',
    'If it is pending, ask for the application status; do not treat it as complete.':'\u09AE\u09BE\u09AE\u09B2\u09BE\u099F\u09BF \u099A\u09B2\u09AE\u09BE\u09A8 \u09B9\u09B2\u09C7 \u0986\u09AC\u09C7\u09A6\u09A8\u09C7\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u099C\u09BE\u09A8\u09C1\u09A8; \u098F\u099F\u09BF\u0995\u09C7 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09AC\u09B2\u09C7 \u09A7\u09B0\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964',
    'Check names, mouza, dag, and khatian details on the original or certified papers.':'\u09AE\u09C2\u09B2 \u09AC\u09BE \u09B8\u09A4\u09CD\u09AF\u09BE\u09AF\u09BC\u09BF\u09A4 \u0995\u09BE\u0997\u099C\u09C7 \u09A8\u09BE\u09AE, \u09AE\u09CC\u099C\u09BE, \u09A6\u09BE\u0997 \u0993 \u0996\u09A4\u09BF\u09DF\u09BE\u09A8\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AE\u09BF\u09B2\u09BF\u09DF\u09C7 \u09A6\u09C7\u0996\u09C1\u09A8\u0964',
    'Ask the relevant record office or an independent land professional about unclear items.':'\u09AF\u09C7 \u09A4\u09A5\u09CD\u09AF \u09AC\u09C1\u099D\u09A4\u09C7 \u0985\u09B8\u09C1\u09AC\u09BF\u09A7\u09BE, \u09B8\u0982\u09B6\u09CD\u09B2\u09BF\u09B7\u09CD\u099F \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u0985\u09AB\u09BF\u09B8 \u09AC\u09BE \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AD\u09C2\u09AE\u09BF \u09AA\u09C7\u09B6\u09BE\u099C\u09C0\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09C1\u09A8\u0964',
    'Ask for the case reference and latest order; get a qualified lawyer to review it before paying or signing.':'\u09AE\u09BE\u09AE\u09B2\u09BE\u09B0 \u09A8\u09AE\u09CD\u09AC\u09B0 \u0993 \u09B8\u09B0\u09CD\u09AC\u09B6\u09C7\u09B7 \u0986\u09A6\u09C7\u09B6 \u099A\u09BE\u0987\u09A8; \u099F\u09BE\u0995\u09BE \u09A6\u09C7\u0993\u09DF\u09BE \u09AC\u09BE \u09B8\u0987\u09A8 \u0995\u09B0\u09BE\u09B0 \u0986\u0997\u09C7 \u09AF\u09CB\u0997\u09CD\u09AF \u0986\u0987\u09A8\u099C\u09C0\u09AC\u09C0\u0995\u09C7 \u09A6\u09BF\u09DF\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE\u09A8\u0964',
    'Do not proceed with a purchase until the dispute and its effect are understood.':'\u09AC\u09BF\u09B0\u09CB\u09A7 \u0993 \u099C\u09AE\u09BF\u09B0 \u0989\u09AA\u09B0 \u098F\u09B0 \u09AA\u09CD\u09B0\u09AD\u09BE\u09AC \u09AC\u09C1\u099D\u09C7 \u09A8\u09BE \u09A8\u09BF\u09DF\u09C7 \u0995\u09C7\u09A8\u09BE\u09B0 \u09A6\u09BF\u0995\u09C7 \u098F\u0997\u09CB\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964',
    'Do not rely on possession or a verbal promise as proof of private title.':'\u09A6\u0996\u09B2 \u09AC\u09BE \u09AE\u09C1\u0996\u09C7\u09B0 \u0995\u09A5\u09BE\u0995\u09C7 \u09AC\u09C7\u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u09AE\u09BE\u09A3 \u09AE\u09A8\u09C7 \u0995\u09B0\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964',
    'Confirm the land classification from records and seek independent advice if needed.':'\u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09A5\u09C7\u0995\u09C7 \u099C\u09AE\u09BF\u09B0 \u09B6\u09CD\u09B0\u09C7\u09A3\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8; \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u09C7 \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6 \u09A8\u09BF\u09A8\u0964',
    'Check whether a notice or award exists and confirm its current stage.':'\u0995\u09CB\u09A8\u09CB \u09A8\u09CB\u099F\u09BF\u09B6 \u09AC\u09BE \u0995\u09CD\u09B7\u09A4\u09BF\u09AA\u09C2\u09B0\u09A3\u09C7\u09B0 \u0986\u09A6\u09C7\u09B6 \u0986\u099B\u09C7 \u0995\u09BF \u09A8\u09BE \u0993 \u09AC\u09BF\u09B7\u09DF\u099F\u09BF \u0995\u09CB\u09A8 \u09AA\u09B0\u09CD\u09AF\u09BE\u09DF\u09C7 \u0986\u099B\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'Ask the acquiring authority or a qualified lawyer how the notice affects this plot.':'\u09A8\u09CB\u099F\u09BF\u09B6\u099F\u09BF \u099C\u09AE\u09BF\u09A4\u09C7 \u0995\u09C0 \u09AA\u09CD\u09B0\u09AD\u09BE\u09AC \u09AB\u09C7\u09B2\u09AC\u09C7 \u09A4\u09BE \u09B8\u0982\u0997\u09CD\u09B0\u09B9\u0995\u09BE\u09B0\u09C0 \u0995\u09B0\u09CD\u09A4\u09C3\u09AA\u0995\u09CD\u09B7 \u09AC\u09BE \u0986\u0987\u09A8\u099C\u09C0\u09AC\u09C0\u09B0 \u0995\u09BE\u099B\u09C7 \u099C\u09BE\u09A8\u09C1\u09A8\u0964',
    'Upazila Land Office / AC Land; consider an independent land lawyer.':'\u0989\u09AA\u099C\u09C7\u09B2\u09BE \u09AD\u09C2\u09AE\u09BF \u0985\u09AB\u09BF\u09B8 / \u098F\u09B8\u09BF \u09B2\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1; \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u09C7 \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AD\u09C2\u09AE\u09BF \u0986\u0987\u09A8\u099C\u09C0\u09AC\u09C0\u09B0 \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6 \u09A8\u09BF\u09A8\u0964',
    'Relevant record office or Sub-Registrar; consider an independent land lawyer.':'\u09B8\u0982\u09B6\u09CD\u09B2\u09BF\u09B7\u09CD\u099F \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u0985\u09AB\u09BF\u09B8 \u09AC\u09BE \u09B8\u09BE\u09AC-\u09B0\u09C7\u099C\u09BF\u09B8\u09CD\u099F\u09CD\u09B0\u09BE\u09B0; \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u09C7 \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AD\u09C2\u09AE\u09BF \u0986\u0987\u09A8\u099C\u09C0\u09AC\u09C0\u09B0 \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6 \u09A8\u09BF\u09A8\u0964',
    'A qualified land lawyer and the court or authority named in the case papers.':'\u09AF\u09CB\u0997\u09CD\u09AF \u09AD\u09C2\u09AE\u09BF \u0986\u0987\u09A8\u099C\u09C0\u09AC\u09C0 \u098F\u09AC\u0982 \u09AE\u09BE\u09AE\u09B2\u09BE\u09B0 \u0995\u09BE\u0997\u099C\u09C7 \u0989\u09B2\u09CD\u09B2\u09C7\u0996\u09BF\u09A4 \u0986\u09A6\u09BE\u09B2\u09A4 \u09AC\u09BE \u0995\u09B0\u09CD\u09A4\u09C3\u09AA\u0995\u09CD\u09B7\u0964',
    'Upazila Land Office / AC Land; get independent advice for unclear records.':'\u0989\u09AA\u099C\u09C7\u09B2\u09BE \u09AD\u09C2\u09AE\u09BF \u0985\u09AB\u09BF\u09B8 / \u098F\u09B8\u09BF \u09B2\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1; \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09AC\u09C1\u099D\u09A4\u09C7 \u0985\u09B8\u09C1\u09AC\u09BF\u09A7\u09BE \u09B9\u09B2\u09C7 \u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6 \u09A8\u09BF\u09A8\u0964',
    'Acquiring authority or AC Land; seek legal advice if a notice affects the plot.':'\u09B8\u0982\u0997\u09CD\u09B0\u09B9\u0995\u09BE\u09B0\u09C0 \u0995\u09B0\u09CD\u09A4\u09C3\u09AA\u0995\u09CD\u09B7 \u09AC\u09BE \u098F\u09B8\u09BF \u09B2\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1; \u09A8\u09CB\u099F\u09BF\u09B6 \u099C\u09AE\u09BF\u0995\u09C7 \u09AA\u09CD\u09B0\u09AD\u09BE\u09AC\u09BF\u09A4 \u0995\u09B0\u09B2\u09C7 \u0986\u0987\u09A8\u09BF \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6 \u09A8\u09BF\u09A8\u0964',
    'Mutation updates the land record after an ownership change. The status shown here comes from the selected demo record.':'\u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8\u09C7\u09B0 \u09AA\u09B0 \u099C\u09AE\u09BF\u09B0 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09B9\u09BE\u09B2\u09A8\u09BE\u0997\u09BE\u09A6 \u0995\u09B0\u09BE\u0995\u09C7 \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF \u09AC\u09B2\u09BE \u09B9\u09DF\u0964 \u098F\u0996\u09BE\u09A8\u09C7\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u09A1\u09C7\u09AE\u09CB \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09A5\u09C7\u0995\u09C7 \u0986\u09B8\u09C7\u0964',
    'Check that the seller and land details match across the available records.':'\u09AA\u09BE\u0993\u09DF\u09BE \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u0997\u09C1\u09B2\u09CB\u09A4\u09C7 \u09AC\u09BF\u0995\u09CD\u09B0\u09C7\u09A4\u09BE \u0993 \u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AE\u09BF\u09B2\u099B\u09C7 \u0995\u09BF \u09A8\u09BE \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'This screening can point to items to review; it does not confirm that a document is genuine.':'\u098F\u0987 \u09AA\u09CD\u09B0\u09BE\u09A5\u09AE\u09BF\u0995 \u09AF\u09BE\u099A\u09BE\u0987 \u09AF\u09C7 \u0995\u09BE\u0997\u099C\u09AA\u09A4\u09CD\u09B0 \u09A6\u09C7\u0996\u09BE \u09A6\u09B0\u0995\u09BE\u09B0 \u09A4\u09BE \u099C\u09BE\u09A8\u09BE\u09DF; \u0995\u09BE\u0997\u099C \u0986\u09B8\u09B2 \u0995\u09BF \u09A8\u09BE \u098F\u099F\u09BF \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09C7 \u09A8\u09BE\u0964',
    'A dispute warning means a possible case or disagreement needs careful review; confirm the details independently.':'\u09AC\u09BF\u09B0\u09CB\u09A7\u09C7\u09B0 \u09B8\u09A4\u09B0\u09CD\u0995\u09AC\u09BE\u09B0\u09CD\u09A4\u09BE \u09AE\u09BE\u09AE\u09B2\u09BE \u09AC\u09BE \u09AE\u09A4\u09AC\u09BF\u09B0\u09CB\u09A7\u09C7\u09B0 \u0987\u0999\u09CD\u0997\u09BF\u09A4 \u09A6\u09BF\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7; \u09A4\u09A5\u09CD\u09AF \u09A8\u09BF\u099C\u09C7 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'Khas land is recorded as government land; confirm the land classification from records.':'\u0996\u09BE\u09B8 \u099C\u09AE\u09BF \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u099C\u09AE\u09BF \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u09A8\u09A5\u09BF\u09AD\u09C1\u0995\u09CD\u09A4; \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09A5\u09C7\u0995\u09C7 \u099C\u09AE\u09BF\u09B0 \u09B6\u09CD\u09B0\u09C7\u09A3\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'An acquisition warning may relate to land being acquired for a public purpose; verify whether it applies to this plot.':'\u0985\u09A7\u09BF\u0997\u09CD\u09B0\u09B9\u09A3\u09C7\u09B0 \u09B8\u09A4\u09B0\u09CD\u0995\u09AC\u09BE\u09B0\u09CD\u09A4\u09BE \u099C\u09A8\u09B8\u09BE\u09A7\u09BE\u09B0\u09A3\u09C7\u09B0 \u0995\u09BE\u099C\u09C7 \u099C\u09AE\u09BF \u0985\u09A7\u09BF\u0997\u09CD\u09B0\u09B9\u09A3\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09B9\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7; \u098F\u099F\u09BF \u098F\u0987 \u099C\u09AE\u09BF\u09A4\u09C7 \u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u0995\u09BF \u09A8\u09BE \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'Review the available category information with an independent land professional.':'\u09B8\u09CD\u09AC\u09BE\u09A7\u09C0\u09A8 \u09AD\u09C2\u09AE\u09BF \u09AA\u09C7\u09B6\u09BE\u099C\u09C0\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AA\u09BE\u0993\u09DF\u09BE \u09A4\u09A5\u09CD\u09AF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C1\u09A8\u0964',
    'Deed, khatian, mutation order or application, and land-tax receipt.':'\u09A6\u09B2\u09BF\u09B2, \u0996\u09A4\u09BF\u09DF\u09BE\u09A8, \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u0986\u09A6\u09C7\u09B6 \u09AC\u09BE \u0986\u09AC\u09C7\u09A6\u09A8, \u099C\u09AE\u09BF\u09B0 \u0996\u09BE\u099C\u09A8\u09BE\u09B0 \u09B0\u09B6\u09BF\u09A6\u0964',
    'Original or certified deed, khatian, mutation record, tax receipt, and papers flagged by screening.':'\u09AE\u09C2\u09B2 \u09AC\u09BE \u09B8\u09A4\u09CD\u09AF\u09BE\u09AF\u09BC\u09BF\u09A4 \u09A6\u09B2\u09BF\u09B2, \u0996\u09A4\u09BF\u09DF\u09BE\u09A8, \u09A8\u09BE\u09AE\u099C\u09BE\u09B0\u09BF\u09B0 \u09A8\u09A5\u09BF, \u0996\u09BE\u099C\u09A8\u09BE\u09B0 \u09B0\u09B6\u09BF\u09A6 \u098F\u09AC\u0982 \u09AF\u09C7 \u0995\u09BE\u0997\u099C \u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7 \u09A6\u09C7\u0996\u09BE\u09B0 \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6 \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964',
    'Case papers, latest court or authority order, deed, khatian, and notices.':'\u09AE\u09BE\u09AE\u09B2\u09BE\u09B0 \u0995\u09BE\u0997\u099C, \u09B8\u09B0\u09CD\u09AC\u09B6\u09C7\u09B7 \u0986\u09A6\u09BE\u09B2\u09A4 \u09AC\u09BE \u0995\u09B0\u09CD\u09A4\u09C3\u09AA\u0995\u09CD\u09B7\u09C7\u09B0 \u0986\u09A6\u09C7\u09B6, \u09A6\u09B2\u09BF\u09B2, \u0996\u09A4\u09BF\u09DF\u09BE\u09A8 \u0993 \u09A8\u09CB\u099F\u09BF\u09B6\u0964',
    'Khatian, deed or lease/allotment order if applicable, and land-tax record.':'\u0996\u09A4\u09BF\u09DF\u09BE\u09A8, \u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u09B9\u09B2\u09C7 \u09A6\u09B2\u09BF\u09B2 \u09AC\u09BE \u09B2\u09BF\u099C/\u09AC\u09B0\u09BE\u09A6\u09CD\u09A6\u09C7\u09B0 \u0986\u09A6\u09C7\u09B6, \u0996\u09BE\u099C\u09A8\u09BE\u09B0 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1\u0964',
    'Notice or award, plot record, deed, khatian, and compensation papers if applicable.':'\u09A8\u09CB\u099F\u09BF\u09B6 \u09AC\u09BE \u0995\u09CD\u09B7\u09A4\u09BF\u09AA\u09C2\u09B0\u09A3\u09C7\u09B0 \u0986\u09A6\u09C7\u09B6, \u099C\u09AE\u09BF\u09B0 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1, \u09A6\u09B2\u09BF\u09B2, \u0996\u09A4\u09BF\u09DF\u09BE\u09A8 \u098F\u09AC\u0982 \u09AA\u09CD\u09B0\u09AF\u09CB\u099C\u09CD\u09AF \u09B9\u09B2\u09C7 \u0995\u09CD\u09B7\u09A4\u09BF\u09AA\u09C2\u09B0\u09A3\u09C7\u09B0 \u0995\u09BE\u0997\u099C\u0964'
  });
  const MAP_INFO_TRANSLATIONS = Object.freeze({
    'DEMO LAND INFORMATION':'\u09A1\u09C7\u09AE\u09CB \u099C\u09AE\u09BF\u09B0 \u09A4\u09A5\u09CD\u09AF','Land and access details':'\u099C\u09AE\u09BF \u0993 \u09AF\u09BE\u09A4\u09BE\u09AF\u09BC\u09BE\u09A4\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF','Synthetic demo record':'\u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE \u09A1\u09C7\u09AE\u09CB \u09B0\u09C7\u0995\u09B0\u09CD\u09A1',
    'Land type':'\u099C\u09AE\u09BF\u09B0 \u09A7\u09B0\u09A8','Land area':'\u099C\u09AE\u09BF\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3','Boundary':'\u09B8\u09C0\u09AE\u09BE\u09A8\u09BE','Road condition':'\u09B0\u09BE\u09B8\u09CD\u09A4\u09BE\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE','Road width':'\u09B0\u09BE\u09B8\u09CD\u09A4\u09BE\u09B0 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A5','Surroundings':'\u0986\u09B6\u09AA\u09BE\u09B6\u09C7\u09B0 \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6','Information unavailable':'\u09A4\u09A5\u09CD\u09AF \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF','unit not provided':'\u098F\u0995\u0995 \u09A6\u09C7\u0993\u09AF\u09BC\u09BE \u09B9\u09AF\u09BC\u09A8\u09BF',
    'BUILDING POSSIBILITY':'\u09AC\u09BE\u09A1\u09BC\u09BF \u09A8\u09BF\u09B0\u09CD\u09AE\u09BE\u09A3\u09C7\u09B0 \u09B8\u09AE\u09CD\u09AD\u09BE\u09AC\u09A8\u09BE','House construction possibility':'\u09AC\u09BE\u09A1\u09BC\u09BF \u09A8\u09BF\u09B0\u09CD\u09AE\u09BE\u09A3\u09C7\u09B0 \u09B8\u09AE\u09CD\u09AD\u09BE\u09AC\u09A8\u09BE','Potential building height':'\u09B8\u09AE\u09CD\u09AD\u09BE\u09AC\u09CD\u09AF \u09AD\u09AC\u09A8\u09C7\u09B0 \u0989\u099A\u09CD\u099A\u09A4\u09BE','Not specified':'\u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F \u09A4\u09A5\u09CD\u09AF \u09A8\u09C7\u0987','Number of floors':'\u09A4\u09B2\u09BE\u09B0 \u09B8\u0982\u0996\u09CD\u09AF\u09BE','Cannot be determined without checking approved plans and authority rules.':'\u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 \u09A8\u0995\u09B6\u09BE \u0993 \u0995\u09B0\u09CD\u09A4\u09C3\u09AA\u0995\u09CD\u09B7\u09C7\u09B0 \u09A8\u09BF\u09AF\u09BC\u09AE \u09AF\u09BE\u099A\u09BE\u0987 \u099B\u09BE\u09A1\u09BC\u09BE \u09A8\u09BF\u09B0\u09CD\u09A7\u09BE\u09B0\u09A3 \u0995\u09B0\u09BE \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE','What to check before construction':'\u09A8\u09BF\u09B0\u09CD\u09AE\u09BE\u09A3\u09C7\u09B0 \u0986\u0997\u09C7 \u09AF\u09BE \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09AC\u09C7\u09A8','Land use and zoning':'\u099C\u09AE\u09BF\u09B0 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0993 \u099C\u09CB\u09A8\u09BF\u0982','Road width and site access':'\u09B0\u09BE\u09B8\u09CD\u09A4\u09BE\u09B0 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A5 \u0993 \u09AA\u09CD\u09B0\u09AC\u09C7\u09B6\u09AA\u09A5','Building height and setback rules':'\u09AD\u09AC\u09A8\u09C7\u09B0 \u0989\u099A\u09CD\u099A\u09A4\u09BE \u0993 \u09B8\u09C7\u099F\u09AC\u09CD\u09AF\u09BE\u0995 \u09A8\u09BF\u09AF\u09BC\u09AE','Required building approval':'\u09AA\u09CD\u09B0\u09AF\u09BC\u09CB\u099C\u09A8\u09C0\u09AF\u09BC \u09AD\u09AC\u09A8 \u09A8\u09BF\u09B0\u09CD\u09AE\u09BE\u09A3\u09C7\u09B0 \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09A8',
    'Map and construction details are not provided by the selected land record. Demo values are synthetic; this is not official verification.':'\u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u099C\u09AE\u09BF\u09B0 \u09A8\u09A5\u09BF\u09A4\u09C7 \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0 \u0993 \u09A8\u09BF\u09B0\u09CD\u09AE\u09BE\u09A3\u09B8\u0982\u0995\u09CD\u09B0\u09BE\u09A8\u09CD\u09A4 \u09A4\u09A5\u09CD\u09AF \u09A8\u09C7\u0987\u0964 \u09A1\u09C7\u09AE\u09CB \u09A4\u09A5\u09CD\u09AF \u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE; \u098F\u099F\u09BF \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u09A8\u09AF\u09BC\u0964','Details are from the selected synthetic record; badges show field screening only, not official document verification.':'\u09A4\u09A5\u09CD\u09AF \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09BF\u09A4 \u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09A5\u09C7\u0995\u09C7; \u09AC\u09CD\u09AF\u09BE\u099C \u09B6\u09C1\u09A7\u09C1 \u09A4\u09A5\u09CD\u09AF \u09AF\u09BE\u099A\u09BE\u0987\u0995 \u09A6\u09C7\u0996\u09BE\u09AF\u09BC, \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09A8\u09A5\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u09A8\u09AF\u09BC\u0964','Record Scope':'\u09A4\u09A5\u09CD\u09AF \u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7\u09B0 \u09B8\u09C0\u09AE\u09BE','Stored field screening only; not official verification.':'\u09A8\u09A5\u09BF\u09AD\u09C1\u0995\u09CD\u09A4 \u09A4\u09A5\u09CD\u09AF\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u09A5\u09AE\u09BF\u0995 \u09AF\u09BE\u099A\u09BE\u0987; \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u09A8\u09AF\u09BC.','This synthetic timeline includes only events returned by the API. Owner names and ownership-transfer details are unavailable.':'\u098F\u0987 \u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE \u09B8\u09AE\u09DF\u09B0\u09C7\u0996\u09BE\u09DF \u09B6\u09C1\u09A7\u09C1 API-\u09A4\u09C7 \u09AB\u09BF\u09B0\u09C7 \u0986\u09B8\u09BE \u0998\u099F\u09A8\u09BE\u0997\u09C1\u09B2\u09CB \u0986\u099B\u09C7\u0964 \u09AE\u09BE\u09B2\u09BF\u0995\u09C7\u09B0 \u09A8\u09BE\u09AE \u0993 \u09AE\u09BE\u09B2\u09BF\u0995\u09BE\u09A8\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF.','The timeline shows only information returned by the API; missing owner or transfer details are unavailable.':'\u09B8\u09AE\u09DF\u09B0\u09C7\u0996\u09BE\u09DF \u09B6\u09C1\u09A7\u09C1 API-\u09A4\u09C7 \u09AB\u09BF\u09B0\u09C7 \u0986\u09B8\u09BE \u09A4\u09A5\u09CD\u09AF \u09A6\u09C7\u0996\u09BE\u09A8\u09CB \u09B9\u09DF; \u09AE\u09BE\u09B2\u09BF\u0995 \u09AC\u09BE \u09B9\u09B8\u09CD\u09A4\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u0985\u09A8\u09C7\u0995 \u09A4\u09A5\u09CD\u09AF \u098F\u0996\u09BE\u09A8\u09C7 \u09A8\u09C7\u0987.'
  });
  const translationEntries = Object.entries({ ...DICTIONARY.bn, ...EXTRA_TRANSLATIONS, ...TERM_TRANSLATIONS, ...API_TRANSLATIONS, ...SIMULATOR_TRANSLATIONS, ...UI_TRANSLATIONS, ...MAP_INFO_TRANSLATIONS, ...DIGITAL_TWIN_TRANSLATIONS, ...MAP_TRANSLATIONS, ...CHECK_LAND_TRANSLATIONS, ...RISK_ACTION_TRANSLATIONS }).sort((a, b) => b[0].length - a[0].length);
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function translateText(value) {
    if (state.language !== 'bn') return String(value ?? '');
    return translationEntries.reduce((text, [english, bangla]) => {
      const leftBoundary = /^[A-Za-z0-9]$/.test(english[0]) ? '\\b' : '';
      const lastCharacter = english[english.length - 1];
      const rightBoundary = /^[A-Za-z0-9]$/.test(lastCharacter) ? '\\b' : '';
      return text.replace(new RegExp(`${leftBoundary}${escapeRegExp(english)}${rightBoundary}`, 'g'), bangla);
    }, String(value ?? ''));
  }
  function applyTranslations(root = document.documentElement) {
    const walker = document.createTreeWalker(root, 4);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('[data-no-translate="true"]')) continue;
      const original = originalTextNodes.has(node) ? originalTextNodes.get(node) : node.nodeValue;
      if (!originalTextNodes.has(node)) originalTextNodes.set(node, original);
      node.nodeValue = translateText(original);
    }
    root.querySelectorAll('[aria-label], [title], [placeholder]').forEach(el => {
      const attrs = ['aria-label', 'title', 'placeholder'];
      let saved = originalAttributes.get(el);
      if (!saved) { saved = {}; originalAttributes.set(el, saved); }
      attrs.forEach(name => {
        if (!el.hasAttribute(name)) return;
        const current = el.getAttribute(name);
        if (!saved[name] || current !== saved[name].rendered) saved[name] = { original: current, rendered: current };
        const translated = translateText(saved[name].original);
        if (translated !== current) el.setAttribute(name, translated);
        saved[name].rendered = translated;
      });
    });
  }
  function setLanguage(language) {
    state.language = language === 'bn' ? 'bn' : 'en';
    try { localStorage.setItem('landshield-language', state.language); } catch (_) { /* Keep the selected language for this page when storage is unavailable. */ }
    document.documentElement.lang = state.language;
    $('languageEnglish').setAttribute('aria-pressed', String(state.language === 'en'));
    $('languageBangla').setAttribute('aria-pressed', String(state.language === 'bn'));
    $('detailsSummary').querySelector('span').textContent = state.language === 'bn' ? 'বিস্তারিত দেখুন' : 'View details';
    renderDate();
    applyTranslations();
    renderCitizenSummary();
    if (state.report) renderReport();
    if (state.land && state.location) renderMap(state.land, state.location);
    refreshMapLayerControl();
    setTheme(document.documentElement.dataset.theme);
    applyTranslations();
  }
  function refreshMapLayerControl() {
    if (!state.map || !state.mapStreetLayer || !state.mapSatelliteLayer) return;
    state.mapLayerControl?.remove();
    state.mapLayerControl = L.control.layers(
      { [state.language === 'bn' ? 'রাস্তার মানচিত্র' : 'Street map']: state.mapStreetLayer },
      { [state.language === 'bn' ? 'স্যাটেলাইট ছবি' : 'Satellite imagery']: state.mapSatelliteLayer },
      { collapsed: true }
    ).addTo(state.map);
  }
  function setTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    const toggle = $('themeToggle');
    toggle.setAttribute('aria-pressed', String(isDark));
    const label = isDark
      ? (state.language === 'bn' ? 'লাইট মোড চালু করুন' : 'Switch to light mode')
      : (state.language === 'bn' ? 'ডার্ক মোড চালু করুন' : 'Switch to dark mode');
    toggle.setAttribute('aria-label', label);
    toggle.querySelector('.theme-toggle-label').textContent = isDark
      ? (state.language === 'bn' ? 'লাইট মোড' : 'Light mode')
      : (state.language === 'bn' ? 'ডার্ক মোড' : 'Dark mode');
    try { localStorage.setItem('landshield-theme', isDark ? 'dark' : 'light'); } catch (_) { /* Storage may be unavailable in private browsing. */ }
  }
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pick = (obj, paths, fallback = undefined) => {
    for (const path of paths) {
      const value = path.split('.').reduce((part, key) => part == null ? undefined : part[key], obj);
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
  };
  const asArray = value => Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : [];
  const numeric = value => { const number = Number(String(value ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(number) ? number : null; };
  const first = (...values) => values.find(value => value !== undefined && value !== null && value !== '');
  const titleCase = value => String(value ?? '').replace(/[_-]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  const riskLevelLabel = value => ({ LOW: 'Low Risk', MEDIUM: 'Medium Risk', HIGH: 'High Risk' }[String(value ?? '').trim().toUpperCase()] || titleCase(value));
  const landReference = (land, index = 0) => typeof land === 'string'
    ? land
    : first(land?.land_id, land?.parcel_id, land?.reference_id, land?.code, land?.slug, land?.id, index === 0 ? 'DEMO-001' : null);
  function setLandReferenceMessage(message, isError = false) {
    const el = $('landReferenceMessage');
    el.textContent = message;
    el.classList.toggle('error-text', isError);
    applyTranslations();
  }

  async function request(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }
  function unwrap(data, keys) {
    for (const key of keys) if (data && data[key] !== undefined) return data[key];
    return data;
  }
  function toast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    applyTranslations();
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 3000);
  }
  function renderDate() {
    $('todayDate').textContent = new Intl.DateTimeFormat(state.language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' }).format(new Date()).toUpperCase();
    applyTranslations();
  }
  function fail(message) {
    $('riskScoreSmall').innerHTML = '—<small>/100</small>';
    $('aiAnalysis').innerHTML = `<span class="error-text">${escapeHtml(message)}. Check that the backend is running and allows this page’s origin.</span>`;
    $('riskCategories').innerHTML = '<div class="loading-row error-text">Risk data unavailable. Retry when the API is reachable.</div>';
    $('documentsList').innerHTML = '<div class="loading-row error-text">Document data unavailable.</div>';
    $('mutationCurrentStatus').textContent = 'API ERROR';
    $('mutationCurrentStatus').classList.remove('warn');
    $('mutationExplainer').textContent = 'Mutation history could not be loaded. Retry when the backend is available.';
    $('mutationTimeline').innerHTML = '<li class="loading-row error-text">Mutation history unavailable.</li>';
    $('mapLoading').textContent = 'Location data unavailable. Retry when the API is reachable.';
    $('mapAccuracy').innerHTML = '<i></i> LOCATION UNAVAILABLE';
    $('reportContent').innerHTML = `<p class="error-text">${escapeHtml(message)}. Consolidated report unavailable.</p>`;
    $('verifiedChip').textContent = 'API ERROR';
    $('disputeAlert').innerHTML = '<span class="alert-symbol">!</span><div><b>Risk screening unavailable</b><p>Connect to the backend to see active dispute status.</p></div><span class="alert-state">API ERROR</span>';
    $('citizenOutcome').textContent = 'Screening unavailable';
    $('citizenOutcome').dataset.screeningHigh = 'false';
    $('citizenRiskScore').textContent = '—';
    $('citizenRiskLevel').textContent = '—';
    $('citizenRiskLevel').dataset.riskLevel = 'UNAVAILABLE';
    $('citizenRiskRing').dataset.riskLevel = 'UNAVAILABLE';
    $('citizenRiskRing').style.setProperty('--risk-progress', '0');
    $('citizenRiskRing').closest('.citizen-score').dataset.scoreBand = 'UNAVAILABLE';
    $('citizenRiskLevel').dataset.scoreBand = 'UNAVAILABLE';
    $('citizenRiskRing').closest('.citizen-summary').dataset.scoreBand = 'UNAVAILABLE';
    $('citizenSummaryExplanation').textContent = message;
    $('citizenWarningTitle').textContent = 'Information unavailable';
    $('citizenWarningText').textContent = 'The risk service could not be reached. Try again when the backend is running.';
    applyTranslations();
  }

  async function loadLands() {
    const data = await request(API.lands());
    const lands = asArray(unwrap(data, ['lands', 'data', 'results']));
    const select = $('landSelect');
    if (!lands.length) throw new Error('The lands endpoint returned no parcels');
    state.lands = lands;
    $('landReferenceOptions').innerHTML = lands.map((land, index) => {
      const reference = landReference(land, index);
      const detail = [land?.owner_name, land?.mouza, land?.upazila, land?.district].filter(Boolean).join(', ');
      return `<option value="${escapeHtml(reference)}"${detail ? ` label="${escapeHtml(detail)}"` : ''}></option>`;
    }).join('');
    $('landReferenceInput').disabled = false;
    $('landReferenceSubmit').disabled = false;
    setLandReferenceMessage(`${lands.length} land reference${lands.length === 1 ? '' : 's'} available. Search by ID or choose a suggestion.`);
    select.innerHTML = lands.map((land, index) => {
      const id = landReference(land, index);
      const name = first(land.name, land.title, land.location, land.address, land.owner_name, id);
      return `<option value="${escapeHtml(id)}">${escapeHtml(name)} · ${escapeHtml(id)}</option>`;
    }).join('');
    return select.value;
  }

  async function searchLandReference(event) {
    event.preventDefault();
    const input = $('landReferenceInput');
    const query = input.value.trim();
    input.removeAttribute('aria-invalid');
    if (!query) {
      input.setAttribute('aria-invalid', 'true');
      setLandReferenceMessage('Enter a land reference ID, such as DEMO-001, to search.', true);
      input.focus();
      return;
    }
    const matchIndex = state.lands.findIndex((land, index) => String(landReference(land, index)).toLocaleLowerCase() === query.toLocaleLowerCase());
    if (matchIndex < 0) {
      input.setAttribute('aria-invalid', 'true');
      setLandReferenceMessage(`No matching land reference found for “${query}”. Check the ID or choose a suggestion from the available records.`, true);
      input.focus();
      return;
    }

    const reference = String(landReference(state.lands[matchIndex], matchIndex));
    input.value = reference;
    $('landSelect').value = reference;
    $('landReferenceSubmit').disabled = true;
    setLandReferenceMessage(`Loading land record ${reference}…`);
    try {
      await loadLand(reference);
      setLandReferenceMessage(`Showing dashboard information for ${reference}.`);
    } catch (error) {
      fail(error.message || 'Unable to load this land record');
      setLandReferenceMessage(`Could not load ${reference}. Check the backend connection and try again.`, true);
      toast(error.message || 'Unable to connect to the backend');
    } finally {
      $('landReferenceSubmit').disabled = !state.lands.length;
    }
  }

  async function loadLand(id) {
    const token = ++state.loadToken;
    $('simulationResult').innerHTML = '<span class="result-spark">✳</span><div><b>Choose a scenario to calculate its risk score</b><p>Choose a scenario to see a possible score change. The land record will not change.</p></div>';
    $('simulationResult').classList.remove('active', 'is-error', 'is-stale');
    $('simulationResult').dataset.state = 'idle';
    $('mutationCurrentStatus').textContent = 'LOADING';
    $('mutationCurrentStatus').classList.remove('warn');
    $('mutationExplainer').textContent = 'Loading mutation history from the backend…';
    $('mutationTimeline').innerHTML = '<li class="loading-row">Loading mutation events…</li>';
    const results = await Promise.allSettled([request(API.land(id)), request(API.risk(id)), request(API.documents(id)), request(API.mutationHistory(id)), request(API.analysis(id)), request(API.location(id)), request(API.report(id))]);
    if (token !== state.loadToken) return;
    const errors = results.filter(result => result.status === 'rejected');
    state.land = results[0].status === 'fulfilled' ? unwrap(results[0].value, ['land', 'data']) : null;
    state.risk = results[1].status === 'fulfilled' ? unwrap(results[1].value, ['risk', 'data']) : null;
    state.documents = results[2].status === 'fulfilled' ? unwrap(results[2].value, ['documents', 'verification', 'data']) : null;
    state.mutationHistory = results[3].status === 'fulfilled' ? unwrap(results[3].value, ['mutation_history', 'data']) : null;
    state.analysis = results[4].status === 'fulfilled' ? unwrap(results[4].value, ['analysis', 'result', 'data']) : null;
    state.location = results[5].status === 'fulfilled' ? unwrap(results[5].value, ['location_data', 'data']) : null;
    state.report = results[6].status === 'fulfilled' ? unwrap(results[6].value, ['report', 'data']) : null;
    state.landId = id;
    if (errors.length && !state.land && !state.risk && !state.documents && !state.mutationHistory && !state.analysis && !state.location && !state.report) {
      const error = errors[0].reason; throw new Error(error.message || 'The API could not be reached');
    }
    renderLand(id); renderRisk(); renderDocuments(); renderMutationHistory(); renderAnalysis();
    renderReport();
    renderCitizenSummary();
    applyTranslations();
    if (errors.length) toast(`${errors.length} endpoint${errors.length > 1 ? 's' : ''} could not be loaded; available data is shown.`);
  }

  function projectIllustrativeBoundary(boundary) {
    let source = boundary;
    if (typeof source === 'string') {
      try { source = JSON.parse(source); } catch (_) { return null; }
    }
    if (source?.type === 'Feature') source = source.geometry;
    let ring = source?.type === 'Polygon' ? source.coordinates?.[0]
      : source?.type === 'MultiPolygon' ? source.coordinates?.[0]?.[0] : null;
    if (!Array.isArray(ring)) return null;
    const points = ring.filter(point => Array.isArray(point) && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1])))
      .map(point => [Number(point[0]), Number(point[1])]);
    if (points.length > 3 && points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1]) points.pop();
    if (points.length < 3) return null;
    const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    if (maxX === minX || maxY === minY) return null;
    const projected = points.map(([x, y]) => {
      const u = (x - minX) / (maxX - minX), v = (y - minY) / (maxY - minY);
      return [280 + 164 * u + 168 * v, 255 - 90 * u + 103 * v];
    });
    const pathData = values => `${values.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')} Z`;
    const center = projected.reduce((sum, [x, y]) => [sum[0] + x / projected.length, sum[1] + y / projected.length], [0, 0]);
    const inset = projected.map(([x, y]) => [center[0] + (x - center[0]) * 0.91, center[1] + (y - center[1]) * 0.91]);
    return { outline: pathData(projected), inset: pathData(inset) };
  }

  function renderLand(id) {
    const land = state.land || {};
    const locationData = state.location || {};
    const location = locationData.location || {};
    const reference = first(land.land_id, land.parcel_id, id);
    const isDemo001 = String(reference).toUpperCase() === 'DEMO-001';
    $('landReferenceInput').value = reference;
    if ([...$('landSelect').options].some(option => option.value === String(reference))) $('landSelect').value = String(reference);
    $('parcelId').textContent = first(land.parcel_id, land.land_id, land.id, id);
    $('landLocation').textContent = first([location.mouza || land.mouza, location.upazila || land.upazila, location.district || land.district].filter(Boolean).join(', '), land.location, land.address, land.area_name, land.district, 'Location not supplied by API');
    $('landMeta').textContent = [land.owner_name ? `Owner: ${land.owner_name}` : null, land.khatian_no ? `Khatian ${land.khatian_no}` : null, land.dag_no ? `Dag ${land.dag_no}` : null, location.accuracy].filter(Boolean).join(' · ') || 'Land parcel details from registry';
    const size = first(land.land_size, land.area, land.land_area, land.size);
    const unit = first(land.area_unit, land.land_size_unit, land.unit);
    $('landArea').textContent = size === undefined ? 'Information unavailable' : `${size}${unit ? ` ${unit}` : ' (unit not provided)'}`;
    $('landType').textContent = titleCase(first(land.land_type, land.type, land.category, 'Information unavailable'));
    $('boundaryStatus').textContent = titleCase(first(locationData.boundary_accuracy, land.boundary_status, land.boundary, land.survey_status, 'Information unavailable'));
    const elevation = locationData.terrain?.elevation_range_m;
    $('elevationValue').textContent = elevation ? `${elevation.min}–${elevation.max} m` : first(land.elevation ? `${land.elevation} m` : null, land.elevation_meters ? `${land.elevation_meters} m` : null, 'Not provided');
    $('elevationMeta').textContent = $('elevationValue').textContent;
    $('terrainAccuracy').textContent = first(locationData.terrain?.source, location.accuracy, 'DEMO / APPROXIMATE');
    $('terrainType').textContent = first(locationData.terrain?.surface_type, 'Terrain data unavailable');
    $('terrainNote').textContent = first(locationData.terrain_note, 'Demo visualization only; not surveyed elevation data.');
    const roadAccess = first(locationData.road_access, location.road_access, land.road_access, land.access_road);
    $('twinRoadAccess').textContent = roadAccess === undefined ? 'Information unavailable' : String(roadAccess);
    const roadWidth = first(locationData.road_width, location.road_width, land.road_width, land.access_road_width);
    $('twinRoadWidth').textContent = roadWidth === undefined ? 'Information unavailable' : String(roadWidth);
    const surroundings = first(locationData.surroundings, locationData.environment, location.neighborhood, land.surroundings);
    $('twinEnvironment').textContent = surroundings === undefined ? 'Information unavailable' : String(surroundings);
    $('twinFootprint').textContent = first(locationData.building_possibility, land.building_possibility, 'Information unavailable');
    $('twinBuildingHeight').textContent = first(locationData.building_height, land.building_height, 'Not specified');
    $('twinFloorCount').textContent = first(locationData.permitted_floors, land.permitted_floors, 'Cannot be determined without checking approved plans and authority rules.');
    $('twinSampleNote').textContent = 'Map and construction details are not provided by the selected land record. Demo values are synthetic; this is not official verification.';
    $('twinSampleBadge').textContent = 'Synthetic demo record';
    const scene = $('twinScene');
    const projectedBoundary = projectIllustrativeBoundary(locationData.boundary_geojson || land.boundary_geojson || land.geojson || land.geometry);
    const hasApproximateBoundary = Boolean(projectedBoundary);
    scene.dataset.boundaryAvailable = String(hasApproximateBoundary);
    if (projectedBoundary) {
      scene.querySelector('#twinPlotShape').setAttribute('d', projectedBoundary.outline);
      scene.querySelector('#twinPlotInner').setAttribute('d', projectedBoundary.inset);
    } else {
      scene.querySelector('#twinPlotShape').setAttribute('d', 'm280 255 160-90 174 93-166 95z');
      scene.querySelector('#twinPlotInner').setAttribute('d', 'm295 255 145-81 158 84-150 83z');
    }
    scene.querySelector('#twinPlotLabel').textContent = hasApproximateBoundary
      ? 'Approximate boundary returned · stylized illustration'
      : 'Illustrative plot layout · no boundary returned';
    $('twinBoundaryNote').textContent = hasApproximateBoundary
      ? 'An approximate boundary is returned for this demo record; its shape is shown schematically and is not to scale.'
      : 'No boundary was returned for this record; the visible plot is illustrative.';
    renderMap(land, locationData);
  }

  function renderMap(land, locationData) {
    const location = locationData.location || {};
    const latitude = Number(location.latitude), longitude = Number(location.longitude);
    const hasCoordinates = location.latitude !== null && location.latitude !== undefined && location.longitude !== null && location.longitude !== undefined && Number.isFinite(latitude) && Number.isFinite(longitude);
    const geometry = locationData.boundary_geojson || land.boundary_geojson || land.geojson || land.geometry;
    const note = first(locationData.boundary_note, locationData.map_note, 'Coordinates and boundary are approximate demo data.');
    state.mapActive = Boolean(window.L && hasCoordinates);
    $('mapAccuracy').innerHTML = `<i></i> ${escapeHtml(first(location.accuracy, 'LOCATION STATUS UNKNOWN'))} · ${escapeHtml(first(locationData.boundary_accuracy, location.accuracy, 'BOUNDARY UNVERIFIED'))}`;
    $('mapLoading').textContent = note;
    $('mapLoading').style.display = 'none';
    if (!state.mapActive) {
      $('realMap').style.display = 'none';
      $('mapFallback').style.display = 'grid';
      zoom = 1;
      if (mapSvg) mapSvg.style.transform = '';
      $('mapFallback').textContent = !hasCoordinates
        ? 'Selected land record has no coordinates; the map cannot be centered without coordinates.'
        : 'Leaflet could not be loaded. A geographic map is unavailable.';
      applyTranslations($('mapFallback'));
      return;
    }
    $('mapFallback').style.display = 'none';
    $('realMap').style.display = 'block';
    const mapShell = $('mapShell');
    const mapIsVisible = mapShell.getClientRects().length > 0 && mapShell.clientWidth > 0 && mapShell.clientHeight > 0;
    if (!mapIsVisible) return;
    if (!state.map) {
      state.map = L.map('realMap', { zoomControl: false, scrollWheelZoom: true });
      const streetLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      state.mapStreetLayer = streetLayer;
      const satelliteLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9">Esri World Imagery</a> — Sources: Esri, DigitalGlobe, GeoEye, i-cubed, USDA FSA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community'
      });
      state.mapSatelliteLayer = satelliteLayer;
      streetLayer.on('tileerror', () => {
        state.mapStreetTilesUnavailable = true;
        $('mapLoading').textContent = 'Street map tiles could not load. Check the network connection and retry.';
        $('mapLoading').style.display = 'block';
        applyTranslations($('mapLoading'));
      });
      satelliteLayer.on('tileerror', () => {
        state.mapTilesUnavailable = true;
        $('mapLoading').textContent = 'Satellite imagery tiles failed. The street map remains available.';
        $('mapLoading').style.display = 'block';
        applyTranslations($('mapLoading'));
      });
      streetLayer.addTo(state.map);
      refreshMapLayerControl();
      state.mapLayers = L.featureGroup().addTo(state.map);
    }
    if (state.mapStreetTilesUnavailable) {
      $('mapLoading').textContent = 'Street map tiles could not load. Check the network connection and retry.';
      $('mapLoading').style.display = 'block';
      applyTranslations($('mapLoading'));
    } else if (state.mapTilesUnavailable) {
      $('mapLoading').textContent = 'Satellite imagery tiles failed. The street map remains available.';
      $('mapLoading').style.display = 'block';
      applyTranslations($('mapLoading'));
    }
    state.mapLayers.clearLayers();
    L.marker([latitude, longitude]).bindPopup(`${escapeHtml($('parcelId').textContent)} · ${escapeHtml(state.language === 'bn' ? 'যাচাই না করা আনুমানিক স্থানাঙ্ক' : first(location.accuracy, 'Unverified coordinates'))}`).addTo(state.mapLayers);
    if (geometry) {
      try {
        const boundary = L.geoJSON(geometry, { style: { color: '#28784d', weight: 3, fillColor: '#68a977', fillOpacity: 0.25, dashArray: '6 4' } });
        boundary.addTo(state.mapLayers);
      } catch { toast('Boundary data could not be rendered; showing coordinates only.'); }
    }
    const bounds = state.mapLayers.getBounds();
    if (bounds.isValid()) state.map.fitBounds(bounds.pad(0.5), { maxZoom: 18 });
    else state.map.setView([latitude, longitude], 17);
    setTimeout(() => state.map.invalidateSize(), 0);
  }

  const riskActionGuidance = Object.freeze({
    ownership: {
      meaning: 'Check that the seller and land details match across the available records.',
      steps: ['Compare the seller and land details across the deed, khatian, and selected record.', 'Ask for earlier ownership papers and have any mismatch reviewed before paying.'],
      contact: 'Upazila Land Office / AC Land; consider an independent land lawyer.',
      documents: 'Deed, khatian, mutation order or application, and land-tax receipt.'
    },
    mutation: {
      meaning: 'Mutation updates the land record after an ownership change. The status shown here comes from the selected demo record.',
      steps: ['Check the mutation order and latest khatian against the status shown here.', 'If it is pending, ask for the application status; do not treat it as complete.'],
      contact: 'Upazila Land Office / AC Land; consider an independent land lawyer.',
      documents: 'Deed, khatian, mutation order or application, and land-tax receipt.'
    },
    documents: {
      meaning: 'This screening can point to items to review; it does not confirm that a document is genuine.',
      steps: ['Check names, mouza, dag, and khatian details on the original or certified papers.', 'Ask the relevant record office or an independent land professional about unclear items.'],
      contact: 'Relevant record office or Sub-Registrar; consider an independent land lawyer.',
      documents: 'Original or certified deed, khatian, mutation record, tax receipt, and papers flagged by screening.'
    },
    dispute: {
      meaning: 'A dispute warning means a possible case or disagreement needs careful review; confirm the details independently.',
      steps: ['Ask for the case reference and latest order; get a qualified lawyer to review it before paying or signing.', 'Do not proceed with a purchase until the dispute and its effect are understood.'],
      contact: 'A qualified land lawyer and the court or authority named in the case papers.',
      documents: 'Case papers, latest court or authority order, deed, khatian, and notices.'
    },
    khas: {
      meaning: 'Khas land is recorded as government land; confirm the land classification from records.',
      steps: ['Do not rely on possession or a verbal promise as proof of private title.', 'Confirm the land classification from records and seek independent advice if needed.'],
      contact: 'Upazila Land Office / AC Land; get independent advice for unclear records.',
      documents: 'Khatian, deed or lease/allotment order if applicable, and land-tax record.'
    },
    acquisition: {
      meaning: 'An acquisition warning may relate to land being acquired for a public purpose; verify whether it applies to this plot.',
      steps: ['Check whether a notice or award exists and confirm its current stage.', 'Ask the acquiring authority or a qualified lawyer how the notice affects this plot.'],
      contact: 'Acquiring authority or AC Land; seek legal advice if a notice affects the plot.',
      documents: 'Notice or award, plot record, deed, khatian, and compensation papers if applicable.'
    }
  });
  function riskCategoryKey(value) {
    const key = String(value || '').toLowerCase().replace(/[^a-z]/g, '');
    if (key.includes('ownership') || key.includes('owner')) return 'ownership';
    if (key.includes('mutation')) return 'mutation';
    if (key.includes('document') || key.includes('verification')) return 'documents';
    if (key.includes('dispute') || key.includes('case')) return 'dispute';
    if (key.includes('khas')) return 'khas';
    if (key.includes('acquisition') || key.includes('acquire')) return 'acquisition';
    return key || 'other';
  }
  function renderRiskActionContent(category, description) {
    const guidance = riskActionGuidance[category] || {
      meaning: 'Review the available category information with an independent land professional.',
      steps: ['Compare this information with the original land papers.', 'Ask an independent land professional to review any unclear item before paying.'],
      contact: 'Relevant land-record office or an independent land professional.',
      documents: 'Deed, khatian, mutation papers, and any documents related to this item.'
    };
    const meaning = guidance.meaning;
    return `<div class="risk-action-content"><b>${escapeHtml('What this means')}</b><p>${escapeHtml(meaning)}</p>${description ? `<p class="risk-action-finding"><b>${escapeHtml('Current record:')}</b> ${escapeHtml(description)}</p>` : ''}<b>${escapeHtml('Steps you can take')}</b><ol>${guidance.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol><b>${escapeHtml('Who to contact')}</b><p>${escapeHtml(guidance.contact)}</p><b>${escapeHtml('Documents you may need')}</b><p>${escapeHtml(guidance.documents)}</p></div>`;
  }

  function renderRisk() {
    const risk = state.risk || {};
    const score = numeric(first(risk.score, risk.risk_score, risk.overall_score, risk.total_score, risk.risk?.score));
    state.score = score;
    const level = String(first(risk.level, risk.risk_level, risk.rating, risk.risk?.level, score === null ? 'Unavailable' : score <= 30 ? 'LOW' : score <= 60 ? 'MEDIUM' : 'HIGH')).toUpperCase();
    $('riskScoreSmall').innerHTML = `${score === null ? '—' : escapeHtml(score)}<small>/100</small>`;
    const rawCategories = first(risk.categories, risk.factors, risk.breakdown, risk.risk_categories, []);
    const categories = Array.isArray(rawCategories) ? rawCategories : Object.entries(rawCategories || {}).map(([name, value]) => ({ name, ...value }));
    const normalizedCategories = categories.map(category => typeof category === 'string' ? { name: category } : category);
    const requiredRiskCategories = ['ownership', 'documents', 'dispute', 'khas', 'acquisition'];
    requiredRiskCategories.forEach(categoryKey => {
      if (normalizedCategories.some(category => riskCategoryKey(first(category.name, category.category, category.title)) === categoryKey)) return;
      if (categoryKey === 'mutation' && state.land?.mutation_status) {
        const mutationStatus = String(state.land.mutation_status);
        normalizedCategories.push({ name: 'Mutation', status: mutationStatus, explanation: `Mutation status in selected land record: ${mutationStatus}. The risk API did not return a separate mutation score.`, informational: true });
      } else {
        normalizedCategories.push({ name: categoryKey, status: 'NOT PROVIDED', explanation: 'No result for this category was returned by the risk API.', informational: true });
      }
    });
    $('riskCategories').innerHTML = normalizedCategories.length ? normalizedCategories.map((category, index) => {
      const name = first(category.name, category.category, category.title, `Risk factor ${index + 1}`);
      const categoryKey = riskCategoryKey(name);
      const displayName = categoryKey === 'documents' ? 'Document Verification' : categoryKey === 'khas' ? 'Khas Land' : categoryKey === 'acquisition' ? 'Acquisition' : categoryKey === 'ownership' ? 'Ownership' : categoryKey === 'mutation' ? 'Mutation' : categoryKey === 'dispute' ? 'Dispute' : titleCase(name);
      const rawValue = first(category.score, category.risk_score, category.value, category.rating);
      const rawScore = rawValue === undefined ? null : numeric(rawValue);
      const percent = rawScore === null ? 0 : Math.max(0, Math.min(100, rawScore));
      const description = first(category.explanation, category.description, category.status, category.details, category.informational ? '' : 'Assessment from risk engine');
      const priority = first(category.level, category.risk_level, category.severity, category.priority);
      const color = rawScore === null ? 'var(--ui-muted)' : percent >= 70 ? '#cf7a60' : percent >= 40 ? '#d5a25c' : '#75a675';
      const actionId = `risk-actions-${index}`;
      const headingMetric = rawScore === null ? escapeHtml(titleCase(first(category.status, 'STATUS UNAVAILABLE'))) : `${escapeHtml(rawScore)}/100`;
      return `<article class="risk-category" tabindex="0" aria-expanded="false" data-risk-category="${escapeHtml(categoryKey)}"><div class="risk-cat-heading"><b>${escapeHtml(displayName)}</b><span style="color:${color}">${headingMetric}</span></div>${priority ? `<small class="risk-category-priority">${escapeHtml(riskLevelLabel(priority))}</small>` : ''}${rawScore === null ? '' : `<div class="risk-track"><span style="width:${percent}%;background:${color}"></span></div>`}<p title="${escapeHtml(description)}">${escapeHtml(description || 'No separate mutation risk score was returned.')}</p><button type="button" class="risk-action-toggle" aria-expanded="false" aria-controls="${actionId}">View Actions <span aria-hidden="true">⌄</span></button><div class="risk-action-panel" id="${actionId}" aria-hidden="true" inert>${renderRiskActionContent(categoryKey, description)}</div></article>`;
    }).join('') : '<div class="loading-row">Risk categories are not included in this API response.</div>';
    const disputeCategory = first(risk.categories?.dispute, risk.dispute, {});
    const disputeStatus = String(first(disputeCategory.status, '')).toLowerCase();
    const disputes = first(risk.active_disputes, risk.disputes, risk.dispute_count, risk.dispute?.count, risk.flags?.active_disputes);
    const disputeCount = disputes === undefined || disputes === null ? null : Array.isArray(disputes) ? disputes.length : numeric(disputes);
    const hasDispute = disputeCount !== null ? disputeCount > 0 : Boolean(first(risk.has_active_dispute, risk.active_dispute, risk.dispute?.active, ['yes', 'active', 'disputed', 'pending'].includes(disputeStatus), false));
    const screening = first(risk.final_screening_result, risk.screening_result, risk.final_result, risk.recommendation, risk.screening?.result);
    const screeningText = String(screening || (hasDispute ? 'HIGH RISK - DO NOT PROCEED UNTIL VERIFIED' : `${level} RISK`));
    const criticalCategory = ['dispute', 'acquisition', 'khas'].find(name => numeric(risk.categories?.[name]?.score) >= 90);
    const criticalScore = criticalCategory ? numeric(risk.categories[criticalCategory].score) : null;
    $('disputeAlert').innerHTML = hasDispute
      ? `<span class="alert-symbol">!</span><div><b>${escapeHtml(first(risk.dispute_title, 'Active dispute detected'))}</b><p>${escapeHtml(first(risk.dispute_summary, risk.dispute_details, 'Resolve and verify the dispute before proceeding.'))}</p></div><span class="alert-state">Verification Required</span>`
      : `<span class="alert-symbol">✓</span><div><b>${disputeCount === 0 ? 'No active dispute reported' : 'Dispute status not provided'}</b><p>${escapeHtml(first(risk.dispute_summary, 'See the risk engine response for the latest status.'))}</p></div><span class="alert-state">${disputeCount === 0 ? 'CLEAR' : 'UNKNOWN'}</span>`;
  }

  function setRiskCardExpanded(card, expanded) {
    const panel = card.querySelector('.risk-action-panel');
    if (!panel) return;
    card.setAttribute('aria-expanded', String(expanded));
    panel.setAttribute('aria-hidden', String(!expanded));
    if (expanded) panel.removeAttribute('inert');
    else panel.setAttribute('inert', '');
    card.querySelectorAll('.risk-action-toggle').forEach(button => button.setAttribute('aria-expanded', String(expanded)));
  }

  function toggleRiskCard(card) {
    const expanded = card.getAttribute('aria-expanded') === 'true';
    $('riskCategories').querySelectorAll('.risk-category[aria-expanded="true"]').forEach(openCard => {
      if (openCard !== card) setRiskCardExpanded(openCard, false);
    });
    setRiskCardExpanded(card, !expanded);
  }

  function renderCitizenSummary() {
    const risk = state.risk || {};
    const score = numeric(first(risk.overall_score, risk.score, risk.risk_score));
    const level = String(first(risk.risk_level, risk.level, score === null ? 'Unavailable' : score <= 30 ? 'LOW' : score <= 60 ? 'MEDIUM' : 'HIGH')).toUpperCase();
    const screening = String(first(risk.screening_result, risk.final_screening_result, risk.final_result, 'SCREENING UNAVAILABLE'));
    const criticalCategory = ['dispute', 'acquisition', 'khas'].find(name => numeric(risk.categories?.[name]?.score) >= 90);
    const criticalScore = criticalCategory ? numeric(risk.categories[criticalCategory].score) : null;
    const formatScore = value => String(value).replace(/[0-9]/g, digit => state.language === 'bn' ? '০১২৩৪৫৬৭৮৯'[Number(digit)] : digit);
    $('citizenOutcome').textContent = screening;
    $('citizenOutcome').dataset.screeningHigh = String(screening.toUpperCase().startsWith('HIGH RISK'));
    const ringLevel = ['LOW', 'MEDIUM', 'HIGH'].includes(level) ? level : 'UNAVAILABLE';
    const scoreBand = score === null ? 'UNAVAILABLE' : score <= 30 ? 'LOW' : score <= 60 ? 'MEDIUM' : 'HIGH';
    const ring = $('citizenRiskRing');
    ring.dataset.riskLevel = ringLevel;
    ring.style.setProperty('--risk-progress', String(score === null ? 0 : Math.max(0, Math.min(100, score))));
    ring.closest('.citizen-score').dataset.scoreBand = scoreBand;
    $('citizenRiskLevel').dataset.scoreBand = scoreBand;
    ring.closest('.citizen-summary').dataset.scoreBand = scoreBand;
    $('citizenRiskScore').textContent = score === null ? '—' : formatScore(score);
    $('citizenRiskLevel').textContent = riskLevelLabel(level);
    $('citizenRiskLevel').dataset.riskLevel = ringLevel;
    if (score === null) {
      $('citizenSummaryExplanation').textContent = state.language === 'bn' ? 'জমির তথ্য পাওয়া গেলে সহজ ভাষায় সারাংশ দেখানো হবে।' : 'A plain-language summary will appear when land data loads.';
    } else if (screening.toUpperCase().startsWith('HIGH RISK') && criticalCategory && level !== 'HIGH') {
      $('citizenSummaryExplanation').textContent = state.language === 'bn'
        ? `মোট ঝুঁকির সূচক ${formatScore(score)}/100 (${translateText(level)}), তবে ${translateText(titleCase(criticalCategory))} বিভাগে ${formatScore(criticalScore)}/100 গুরুতর ঝুঁকি আছে। তাই যাচাইয়ের ফল উচ্চ ঝুঁকি। তথ্য যাচাই না হওয়া পর্যন্ত কেনার সিদ্ধান্ত নেবেন না।`
        : `The overall score is ${score}/100 (${level}), but the critical ${titleCase(criticalCategory)} category is ${criticalScore}/100. This raises the screening outcome to HIGH RISK. Verify the information before deciding to buy.`;
    } else if (screening.toUpperCase().startsWith('HIGH RISK')) {
      $('citizenSummaryExplanation').textContent = state.language === 'bn' ? 'নথিভুক্ত তথ্যে গুরুতর ঝুঁকির ইঙ্গিত আছে। কেনার সিদ্ধান্তের আগে সরকারি সূত্রে যাচাই করুন।' : 'A serious risk indicator appears in the recorded information. Verify it with official sources before deciding to buy.';
    } else if (level === 'MEDIUM' || screening.toUpperCase().includes('VERIFICATION')) {
      $('citizenSummaryExplanation').textContent = state.language === 'bn' ? 'কিছু তথ্য আরও যাচাই করা দরকার। এই সূচক জমি কেনা নিরাপদ—এ নিশ্চয়তা দেয় না।' : 'Some information needs further checking. This score does not guarantee that the land is safe to buy.';
    } else {
      $('citizenSummaryExplanation').textContent = state.language === 'bn' ? 'পাওয়া তথ্যে বড় ঝুঁকির ইঙ্গিত নেই। তবু কেনার আগে সরকারি নথি যাচাই করুন।' : 'No major warning appears in the available fields. Still verify official records before buying.';
    }
    const warning = criticalCategory ? risk.categories[criticalCategory].explanation : first(asArray(risk.main_risks)[0], risk.explanation, 'No risk details were returned by the screening API.');
    $('citizenWarningTitle').textContent = criticalCategory ? 'Critical warning' : 'Key warning';
    $('citizenWarningText').textContent = translateText(warning);
    const actions = asArray(first(state.analysis?.recommended_actions, state.analysis?.recommendations, []));
    $('citizenNextAction').textContent = translateText(first(actions[0], state.analysis?.recommendation, 'Verify ownership and official records before buying.'));

  }

  function renderDocuments() {
    const response = state.documents || {};
    const checks = response.checks && typeof response.checks === 'object' ? Object.entries(response.checks).map(([name, check]) => ({ name, ...check })) : [];
    const list = asArray(first(response.documents, response.items, response.records, response.verified_documents, checks.length ? checks : null, Array.isArray(response) ? response : []));
    const statusCount = list.filter(doc => /verified|valid|pass|authentic/i.test(String(first(doc.status, doc.verification_status, doc.result, '')))).length;
    $('verifiedChip').textContent = list.length ? `${statusCount} CHECKS PASS` : titleCase(first(response.status, 'NO RECORDS'));
    const land = state.land || {};
    const unavailable = 'Information unavailable';
    const recordValue = value => value === undefined || value === null || value === '' ? unavailable : String(value);
    const size = first(land.land_size, land.area, land.land_area, land.size);
    const unit = first(land.area_unit, land.land_size_unit, land.unit);
    const landArea = size === undefined ? unavailable : `${size}${unit ? ` ${unit}` : ' (unit not provided)'}`;
    const locationRows = [['District', recordValue(land.district)], ['Upazila', recordValue(land.upazila)], ['Mouza', recordValue(land.mouza)]];
    const recordDetails = {
      dag: [...locationRows, ['Dag Number', recordValue(land.dag_no)], ['Land Type', recordValue(first(land.land_type, land.type, land.category))]],
      khatian: [['Khatian Number', recordValue(land.khatian_no)], ['Recorded Owner', recordValue(land.owner_name)], ...locationRows, ['Record Scope', 'Stored field screening only; not official verification.']],
      land_area: [['Land Area', landArea], ['Area Unit', recordValue(unit)], ['Land Classification', recordValue(first(land.land_type, land.type, land.category))], ...locationRows],
      ownership: [['Recorded Owner', recordValue(land.owner_name)], ['Previous Owner', unavailable], ['Mutation Status', recordValue(land.mutation_status)]]
    };
    const documentRows = list.length ? list.slice(0, 4).map((doc, index) => {
      const name = typeof doc === 'string' ? doc : first(doc.name, doc.document_name, doc.title, doc.type, `Document ${index + 1}`);
      const status = typeof doc === 'string' ? '' : String(first(doc.status, doc.verification_status, doc.result, 'Not checked'));
      const details = typeof doc === 'string' ? 'Verification record' : first(doc.message, doc.owner, doc.issued_by, doc.details, doc.reference, doc.date, 'Verification record');
      const valid = /verified|valid|pass/i.test(status);
      const rowKey = String(first(doc.name, doc.document_name, doc.title, doc.type, name)).toLowerCase().replace(/[^a-z]/g, '');
      const sampleKey = rowKey === 'dag' ? 'dag' : rowKey === 'khatian' ? 'khatian' : rowKey === 'landarea' ? 'land_area' : rowKey === 'ownership' || rowKey === 'mutation' ? 'ownership' : null;
      const sample = recordDetails[sampleKey];
      const displayName = sampleKey === 'land_area' ? 'Land Area' : sampleKey === 'ownership' ? 'Mutation' : titleCase(name);
      if (!sample) return `<div class="document-row"><div class="document-icon">&#x25A4;</div><div><b>${escapeHtml(displayName)}</b><small>${escapeHtml(details)}</small></div><span class="doc-status ${valid ? '' : 'warn'}">${escapeHtml(titleCase(status || 'RECORDED'))}</span></div>`;
      const detailsId = `document-sample-details-${sampleKey}`;
      const detailRows = sample.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><b ${/Owner/.test(label) ? 'data-no-translate="true"' : ''}>${escapeHtml(value)}</b></div>`).join('');
      const nextSteps = sampleKey === 'ownership' ? `<p class="document-next-steps"><b>Recommended next steps</b><span>${escapeHtml('Confirm the mutation status and compare the ownership papers with an independent land professional before purchase.')}</span></p>` : '';
      return `<article class="document-row document-row-expandable"><button class="document-row-trigger" type="button" aria-expanded="false" aria-controls="${detailsId}"><span class="document-icon" aria-hidden="true">&#x25A4;</span><span class="document-row-summary"><b>${escapeHtml(displayName)}</b><small>${escapeHtml(details)}</small></span><span class="doc-status ${valid ? '' : 'warn'}">${escapeHtml(titleCase(status || 'RECORDED'))}</span><span class="document-row-arrow" aria-hidden="true">&#x2304;</span></button><div class="document-row-details" id="${detailsId}" aria-hidden="true" inert><div class="document-row-details-inner"><div class="document-detail-grid">${detailRows}</div>${nextSteps}</div></div></article>`;
    }).join('') : `<div class="loading-row">${escapeHtml(first(response.message, 'No document records returned by the verification API.'))}</div>`;
    $('documentsList').innerHTML = `${list.length ? '<p class="document-sample-note">Details are from the selected synthetic record; badges show field screening only, not official document verification.</p>' : ''}${documentRows}`;
  }
  function renderMutationHistory() {
    const data = state.mutationHistory;
    if (!data) {
      $('mutationCurrentStatus').textContent = 'UNAVAILABLE';
      $('mutationExplainer').textContent = 'The history endpoint did not return data for this parcel.';
      $('mutationTimeline').innerHTML = '<li class="loading-row error-text">Mutation history unavailable. Try refreshing the land data.</li>';
      $('mutationWarning').textContent = 'This screening could not retrieve a mutation timeline. Verify the record with official sources before purchase.';
      return;
    }
    const current = first(data.current_status, state.land?.mutation_status, 'unknown');
    const currentKey = String(current).toLowerCase();
    const currentLabel = currentKey === 'pending' ? 'Mutation Pending' : currentKey === 'completed' ? 'Mutation Completed' : `Mutation ${titleCase(current)}`;
    const events = asArray(first(data.history, data.events, []));
    $('mutationCurrentStatus').textContent = currentLabel;
    $('mutationCurrentStatus').classList.toggle('warn', /pending|conflict|rejected|unknown/i.test(String(current)) || data.status_consistent === false);
    $('mutationExplainer').textContent = currentKey === 'pending'
      ? 'Mutation is pending in the selected record. Review the timeline events and status badges below.'
      : currentKey === 'completed'
        ? 'Mutation is recorded as completed in the selected record. Review the timeline events below.'
        : `Mutation status in this record: ${titleCase(current)}.`;
    const isSynthetic = data.is_synthetic === true || /synthetic|demo/i.test(String(data.source || '')) || events.some(event => event.is_synthetic === true);
    const ownerName = (...values) => {
      const value = first(...values);
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (value && typeof value === 'object') return first(value.name, value.full_name, value.display_name, null);
      return null;
    };
    const ordered = events.slice().sort((a, b) => String(first(a.event_date, a.date, a.year, '')).localeCompare(String(first(b.event_date, b.date, b.year, ''))));
    $('mutationTimeline').innerHTML = ordered.length ? ordered.map((event, index) => {
      const when = first(event.event_date, event.date, event.year, 'Date not provided');
      const eventType = String(first(event.event_type, event.type, 'Mutation event'));
      const eventKey = eventType.toUpperCase().replace(/[^A-Z]/g, '');
      const title = first(event.title, eventKey === 'DEMORECORDCREATED' ? 'Record created'
        : eventKey === 'MUTATIONREVIEW' ? 'Mutation review'
          : eventKey === 'DEMOMUTATIONSTATUSRECORDED' ? 'Mutation status recorded' : titleCase(eventType));
      const status = titleCase(first(event.status, 'Status not provided'));
      const previousOwner = ownerName(event.previous_owner_name, event.from_owner_name, event.previous_owner, event.from_owner);
      const newOwner = ownerName(event.new_owner_name, event.to_owner_name, event.new_owner, event.to_owner);
      const previousValue = previousOwner || 'Information unavailable';
      const newValue = newOwner || 'Information unavailable';
      const transferRecorded = event.is_ownership_transfer === true || /ownership.*transfer|transfer.*ownership|conveyance/i.test(eventType);
      const transferText = transferRecorded ? title : 'Information unavailable';
      const description = first(event.description, 'No description was provided by the backend.');
      const icon = eventKey.includes('TRANSFER') ? '&#x21C4;' : eventKey.includes('MUTATION') ? '&#x21BB;' : '&#x25CF;';
      const eventKind = eventKey.includes('TRANSFER') ? 'transfer' : eventKey.includes('MUTATION') ? 'review' : 'record';
      const detailsId = `mutation-event-details-${index}`;
      return `<li class="mutation-event mutation-event-${eventKind}"><span class="mutation-marker" aria-hidden="true">${icon}</span><article class="mutation-event-card" data-event-kind="${eventKind}"><button class="mutation-event-toggle" type="button" aria-expanded="false" aria-controls="${detailsId}"><time>${escapeHtml(when)}</time><span class="mutation-event-title">${escapeHtml(title)}</span><span class="mutation-toggle-icon" aria-hidden="true">⌄</span></button><div class="mutation-event-details" id="${detailsId}" aria-hidden="true" inert><div class="mutation-event-details-inner"><div class="mutation-event-head"><span class="doc-status ${/pending|review|conflict|rejected/i.test(status) ? 'warn' : ''}">${escapeHtml(status)}</span></div><div class="mutation-owner-grid"><div><span>Previous owner</span><b ${previousOwner ? 'data-no-translate="true"' : ''}>${escapeHtml(previousValue)}</b></div><div><span>New owner</span><b ${newOwner ? 'data-no-translate="true"' : ''}>${escapeHtml(newValue)}</b></div></div><div class="mutation-transfer-row"><span>Ownership transfer event</span><b>${escapeHtml(transferText)}</b></div><p>${escapeHtml(description)}</p></div></div></article></li>`;
    }).join('') : `<li class="loading-row">${escapeHtml(first(data.message, 'No mutation history events are available for this land.'))}</li>`;
    const hasOwnerNames = events.some(event => ownerName(event.previous_owner_name, event.from_owner_name, event.previous_owner, event.from_owner, event.new_owner_name, event.to_owner_name, event.new_owner, event.to_owner));
    const hasTransferEvent = events.some(event => event.is_ownership_transfer === true || /ownership.*transfer|transfer.*ownership|conveyance/i.test(String(first(event.event_type, event.type, ''))));
    $('mutationWarning').textContent = isSynthetic
      ? 'This synthetic timeline includes only events returned by the API. Owner names and ownership-transfer details are unavailable.'
      : (!hasOwnerNames || !hasTransferEvent
        ? 'The timeline shows only information returned by the API; missing owner or transfer details are unavailable.'
        : 'This timeline is a prototype screening aid. Confirm ownership and mutation details with authorized sources.');
    if (data.status_consistent === false) $('mutationWarning').textContent += ' Previous mutation status is inconsistent with this history. Please verify the record.';
  }
  function renderAnalysis() {
    const analysis = state.analysis || {};
    const paragraphs = first(analysis.analysis, analysis.summary, analysis.assessment, analysis.risk_analysis, analysis.narrative, analysis.explanation);
    const recommendation = first(analysis.recommendation, analysis.recommended_action, analysis.recommended_actions, analysis.next_steps, analysis.action);
    const text = Array.isArray(paragraphs) ? paragraphs.join(' ') : paragraphs;
    const risks = asArray(analysis.key_risks);
    const method = first(analysis.analysis_type, 'LAND RISK ANALYSIS');
    $('analysisMethod').textContent = String(method).replace(/[_-]+/g, ' ').toUpperCase();
    const disclaimer = first(analysis.disclaimer, 'Screening result only; confirm details with official land records.');
    $('aiAnalysis').innerHTML = `${text ? `<p>${escapeHtml(text)}</p>${risks.length ? `<p><strong>Key risks:</strong> ${escapeHtml(risks.join(' · '))}</p>` : ''}` : '<p>Analysis text was not included in the API response.</p>'}<p class="analysis-disclaimer">${escapeHtml(disclaimer)}</p>`;
    $('recommendation').innerHTML = `<span>✦</span><div><b>System recommendation</b><p>${escapeHtml(Array.isArray(recommendation) ? recommendation.join(' · ') : first(recommendation, 'No recommendation was returned by the analysis API.'))}</p></div>`;
  }

  function renderReport() {
    const report = state.report;
    if (!report) {
      $('reportContent').innerHTML = '<p class="loading-row">The report endpoint is unavailable. Refresh after the backend is updated.</p>';
      applyTranslations();
      return;
    }
    const land = report.land_information || {};
    const risk = report.risk || {};
    const categories = risk.categories && typeof risk.categories === 'object' ? Object.entries(risk.categories) : [];
    const docs = report.document_verification || {};
    const checks = docs.checks && typeof docs.checks === 'object' ? Object.entries(docs.checks) : [];
    const analysis = report.ai_analysis || {};
    const scenarios = asArray(report.what_if?.examples);
    const mutationHistory = report.mutation_history || {};
    const mutationEvents = asArray(mutationHistory.history);
    const recommendation = report.final_recommendation || {};
    const reportScore = numeric(first(risk.overall_score, risk.score, risk.risk_score));
    const reportLevel = String(first(risk.risk_level, risk.level, '')).toUpperCase();
    const reportScreening = String(first(recommendation.decision, risk.screening_result, '')).toUpperCase();
    const criticalCategory = ['dispute', 'acquisition', 'khas'].find(name => numeric(risk.categories?.[name]?.score) >= 90);
    const criticalScore = criticalCategory ? numeric(risk.categories[criticalCategory].score) : null;
    const criticalExplanation = (reportScreening.startsWith('HIGH RISK') || reportScreening.startsWith('DO NOT PROCEED')) && reportLevel !== 'HIGH' && reportScore !== null && criticalCategory
      ? `The overall score is ${reportScore}/100 (${reportLevel}), but a critical ${titleCase(criticalCategory)} category score of ${criticalScore}/100 triggers the HIGH RISK screening outcome. Verify the information before deciding to buy.`
      : '';
    const location = report.location || state.location?.location || {};
    const terrain = state.location?.terrain || {};
    const infoRows = [
      ['Owner', land.owner_name], ['Location', [land.mouza, land.upazila, land.district].filter(Boolean).join(', ')],
      ['Khatian', land.khatian_no], ['Dag', land.dag_no], ['Land area', land.land_size === null || land.land_size === undefined ? null : `${land.land_size} (unit not provided)`],
      ['Current mutation status', first(mutationHistory.current_status, land.mutation_status)], ['Dispute', land.dispute_status],
      ['Acquisition', land.acquisition_status], ['Khas status', land.khas_status]
    ].filter(([, value]) => value !== null && value !== undefined && value !== '');
    const mutationHistoryWarning = mutationHistory.is_synthetic
      ? 'Synthetic demo timeline. Confirm the mutation record through authorized sources.'
      : first(mutationHistory.warning, 'Mutation history is a screening indicator and is not an official government record.');
    const mutationTimeline = mutationEvents.length
      ? `<ol class="report-mutation-timeline">${mutationEvents.map(event => `<li><time>${escapeHtml(first(event.year, event.event_date, event.date, 'Date not provided'))}</time><b>${escapeHtml(titleCase(first(event.event_type, event.type, 'Mutation event')))} · ${escapeHtml(titleCase(first(event.status, 'Status not provided')))}</b><span>${escapeHtml(first(event.description, 'No description provided.'))}</span></li>`).join('')}</ol>`
      : `<p class="report-small">${escapeHtml(first(mutationHistory.message, 'No mutation history events are available.'))}</p>`;
    $('reportContent').innerHTML = `
      <div class="report-summary"><div><span>LAND ID</span><b>${escapeHtml(first(report.public_land_id, report.land_id, '—'))}</b></div><div><span>RISK SCORE</span><b>${escapeHtml(risk.overall_score ?? '—')}/100 · ${escapeHtml(first(risk.risk_level, '—'))}</b></div><div><span>SCREENING</span><b>${escapeHtml(first(recommendation.decision, risk.screening_result, '—'))}</b></div></div>
      ${criticalExplanation ? `<p class="report-critical-note">${escapeHtml(criticalExplanation)}</p>` : ''}
      <div class="report-columns">
        <section><h3>Land information</h3><dl class="report-fields">${infoRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(titleCase(value))}</dd></div>`).join('') || '<p>Land information unavailable.</p>'}</dl><p class="report-small">Coordinates: ${escapeHtml(location.latitude ?? '—')}, ${escapeHtml(location.longitude ?? '—')} · ${escapeHtml(first(location.accuracy, 'Unverified'))}</p><p class="report-small">Boundary: ${escapeHtml(first(state.location?.boundary_accuracy, 'Not provided'))} · ${escapeHtml(first(state.location?.boundary_note, report.map_note, 'Boundary not verified.'))}</p><p class="report-small">Terrain: ${escapeHtml(first(terrain.surface_type, 'Not provided'))} · ${escapeHtml(terrain.elevation_range_m ? `${terrain.elevation_range_m.min}–${terrain.elevation_range_m.max} m` : 'Elevation not provided')} · ${escapeHtml(first(terrain.source, state.location?.terrain_note, 'Unverified'))}</p></section>
        <section><h3>Mutation history · ${escapeHtml(first(mutationHistory.source, 'SCREENING DATA'))}</h3><p class="report-mutation-current"><b>Current status:</b> ${escapeHtml(titleCase(first(mutationHistory.current_status, land.mutation_status, 'unknown')))}</p>${mutationTimeline}<p class="report-small report-mutation-warning">${escapeHtml(mutationHistoryWarning)}</p></section>
        <section><h3>Risk categories</h3>${categories.map(([name, value]) => `<div class="report-risk"><span>${escapeHtml(titleCase(name))}</span><b>${escapeHtml(value.score)}/100 · ${escapeHtml(value.status)}</b></div>`).join('') || '<p>Risk categories unavailable.</p>'}</section>
        <section><h3>Document screening · ${escapeHtml(first(docs.verification_status, 'UNAVAILABLE'))}</h3>${checks.map(([name, value]) => `<div class="report-risk"><span>${escapeHtml(first(value.document_name, titleCase(name)))}</span><b>${escapeHtml(value.status)}</b><small>${escapeHtml([first(value.details, value.message, ''), value.source ? `Source: ${value.source}` : '', value.verification_type || ''].filter(Boolean).join(' · '))}</small></div>`).join('') || '<p>Document checks unavailable.</p>'}<p class="report-small">${escapeHtml(first(docs.message, 'Screening only. Confirm document authenticity with official records.'))}</p></section>
        <section><h3>Analysis & recommendation</h3><p>${escapeHtml(first(analysis.summary, 'Analysis unavailable.'))}</p><p><b>${escapeHtml(first(recommendation.reason, analysis.recommendation, ''))}</b></p><ul>${asArray(first(recommendation.priority_actions, analysis.recommended_actions, [])).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        <section><h3>What-if scenarios</h3>${scenarios.map(item => `<div class="report-risk"><span>${escapeHtml(item.scenario)}</span><b>${escapeHtml(item.overall_score)}/100 · ${escapeHtml(item.risk_level)}</b></div>`).join('') || '<p>Scenario results unavailable.</p>'}<p class="report-small">${escapeHtml(first(report.what_if?.description, 'Hypothetical scenarios only.'))}</p></section>
      </div><p class="report-disclaimer">${escapeHtml(state.language === 'bn' ? 'LandShield \u098F\u0995\u099F\u09BF \u09B8\u09BF\u09A6\u09CD\u09A7\u09BE\u09A8\u09CD\u09A4-\u09B8\u09B9\u09BE\u09DF\u0995 \u09AA\u09CD\u09B0\u09BE\u09A5\u09AE\u09BF\u0995 \u09AF\u09BE\u099A\u09BE\u0987\u09DF\u09C7\u09B0 \u09A8\u09AE\u09C1\u09A8\u09BE; \u098F\u099F\u09BF \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u09AC\u09BE \u0986\u0987\u09A8\u09BF \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6 \u09A8\u09DF\u0964' : 'LandShield is a decision-support screening prototype using synthetic demo data. It is not official government verification or legal advice.')}</p>`;
    applyTranslations($('reportContent'));
  }

  const simulatorScenarioLabels = Object.freeze({
    current: 'Current condition',
    dispute: 'Dispute resolved',
    mutation: 'Mutation complete',
    both: 'Both completed'
  });
  function showSimulatorMessage(title, message, status = 'active') {
    const result = $('simulationResult');
    result.classList.add('active');
    result.classList.toggle('is-error', status === 'error');
    result.classList.toggle('is-stale', status === 'stale');
    result.dataset.state = status;
    result.innerHTML = `<span class="result-spark" aria-hidden="true">${status === 'error' ? '!' : status === 'loading' ? '…' : '✳'}</span><div class="simulation-output"><b>${escapeHtml(title)}</b><p>${escapeHtml(message)}</p></div>`;
    applyTranslations(result);
  }
  function selectedScenarioLabel(selection) {
    return translateText(simulatorScenarioLabels[selection] || 'Choose a scenario, then calculate the result.');
  }
  async function simulateSelectedScenario() {
    const id = state.landId;
    const select = $('simulationStep');
    const selection = select.value;
    const scenarioName = simulatorScenarioLabels[selection];
    const scenarios = {
      current: {},
      dispute: { dispute: 'resolved' },
      mutation: { mutation: 'complete' },
      both: { dispute: 'resolved', mutation: 'complete' }
    };
    const scenario = scenarios[selection];
    const button = $('simulateButton');
    if (!id) {
      showSimulatorMessage('Could not calculate this scenario.', 'Select a land record before calculating.', 'error');
      return;
    }
    if (!scenarioName || scenario === undefined) {
      showSimulatorMessage('Could not calculate this scenario.', 'Choose a scenario, then calculate the result.', 'error');
      return;
    }
    button.disabled = true;
    select.disabled = true;
    button.querySelector('span').textContent = '…';
    showSimulatorMessage(`Calculating scenario with the risk engine… ${scenarioName}`, 'The previous result was cleared. Calculate again to see this scenario.', 'loading');
    try {
      const result = await request(API.whatIf(id, scenario));
      const current = result.current || {};
      const simulated = result.simulated || {};
      const currentScore = numeric(current.overall_score);
      const scenarioScore = numeric(simulated.overall_score);
      if (scenarioScore === null) throw new Error('A calculated risk score was not returned.');
      const delta = currentScore === null ? null : scenarioScore - currentScore;
      const changeText = delta === null ? 'score comparison unavailable' : delta < 0 ? `${Math.abs(delta)} points lower` : delta > 0 ? `${delta} points higher` : 'no score change';
      const currentLevel = first(current.risk_level, current.level, 'Unavailable');
      const scenarioLevel = first(simulated.risk_level, simulated.level, 'Unavailable');
      const screeningOutcome = first(simulated.screening_result, simulated.screening_outcome, simulated.final_recommendation?.decision, result.screening_result, result.screening_outcome);
      const screeningText = screeningOutcome || 'Not provided by the What-If API.';
      const resultElement = $('simulationResult');
      resultElement.classList.add('active');
      resultElement.classList.remove('is-error', 'is-stale');
      resultElement.dataset.state = 'calculated';
      resultElement.innerHTML = `<span class="result-spark" aria-hidden="true">✓</span><div class="simulation-output"><div class="simulation-output-heading"><div><span class="simulation-state-label">Result calculated</span><b>Selected scenario: ${escapeHtml(scenarioName)}</b></div><span class="scenario-delta">${escapeHtml(changeText)}</span></div><div class="simulation-comparison"><div class="simulation-score-card"><span>Current score</span><strong>${escapeHtml(currentScore ?? '—')}/100</strong><em class="risk-badge">${escapeHtml(currentLevel)}</em></div><div class="simulation-score-card scenario-score-card"><span>Scenario score</span><strong>${escapeHtml(scenarioScore)}/100</strong><em class="risk-badge">${escapeHtml(scenarioLevel)}</em></div></div><div class="simulation-screening"><span>Screening outcome</span><b>${escapeHtml(screeningText)}</b></div><p class="simulation-outcome-note">${escapeHtml(first(result.explanation, 'Hypothetical result:'))} ${escapeHtml(asArray(result.changes).join(' '))}</p></div>`;
      applyTranslations(resultElement);
    } catch (error) {
      showSimulatorMessage(`Could not calculate this scenario: ${scenarioName}`, error.message || 'Check the What-If endpoint and try again.', 'error');
    } finally {
      button.disabled = false;
      select.disabled = false;
      button.querySelector('span').textContent = '→';
    }
  }

  async function refresh() {
    const button = $('refreshButton'); button.disabled = true; button.querySelector('span').textContent = '…';
    try {
      let id = $('landSelect').value;
      if (!state.lands.length) id = await loadLands();
      await loadLand(id);
    } catch (error) {
      fail(error.message || 'Unable to load land data');
      setLandReferenceMessage(state.lands.length ? 'Land data could not be loaded. Check the backend connection and retry.' : 'Land records could not be loaded. Check that the backend is running and try again.', true);
      toast(error.message || 'Unable to connect to the backend');
    }
    finally { button.disabled = false; button.querySelector('span').textContent = '↻'; }
  }

  async function refreshReport() {
    if (!state.landId) return toast('Select a land parcel first.');
    $('refreshReport').disabled = true;
    try {
      state.report = await request(API.report(state.landId));
      renderReport();
      toast('Final report updated from backend.');
    } catch (error) {
      $('reportContent').innerHTML = `<p class="error-text">${escapeHtml(error.message)}. Report endpoint unavailable.</p>`;
      toast('Could not refresh the report.');
    } finally { $('refreshReport').disabled = false; }
  }

  function setupTwinControls() {
    const scene = $('twinScene');
    const panel = scene.closest('.twin-panel');
    const model = scene.querySelector('.twin-model');
    let rotation = 0, zoom = 1, dragX = null, startRotation = rotation;
    const paint = () => { model.style.transform = `perspective(1200px) rotateZ(${rotation}deg) scale(${zoom})`; };
    scene.addEventListener('pointerdown', event => {
      if (event.target.closest('.twin-toolbar, .twin-legend, button, input, label')) return;
      dragX = event.clientX; startRotation = rotation; scene.setPointerCapture(event.pointerId); scene.classList.add('dragging');
    });
    scene.addEventListener('pointermove', event => {
      if (dragX === null) return;
      rotation = startRotation + (event.clientX - dragX) * 0.7; paint();
    });
    const endDrag = () => { dragX = null; scene.classList.remove('dragging'); };
    scene.addEventListener('pointerup', endDrag);
    scene.addEventListener('pointercancel', endDrag);
    scene.addEventListener('wheel', event => {
      event.preventDefault(); zoom = Math.max(0.72, Math.min(1.45, zoom + (event.deltaY < 0 ? 0.06 : -0.06))); paint();
    }, { passive: false });
    scene.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { rotation += event.key === 'ArrowLeft' ? -8 : 8; paint(); event.preventDefault(); }
      if (event.key === '+' || event.key === '=') { zoom = Math.min(1.45, zoom + 0.08); paint(); }
      if (event.key === '-') { zoom = Math.max(0.72, zoom - 0.08); paint(); }
    });
    panel.querySelectorAll('[data-twin-action]').forEach(button => button.addEventListener('click', () => {
      switch (button.dataset.twinAction) {
        case 'rotate-left': rotation -= 15; break;
        case 'rotate-right': rotation += 15; break;
        case 'zoom-in': zoom = Math.min(1.45, zoom + 0.12); break;
        case 'zoom-out': zoom = Math.max(0.72, zoom - 0.12); break;
        case 'reset': rotation = 0; zoom = 1; break;
      }
      paint();
    }));
    panel.querySelectorAll('[data-twin-toggle]').forEach(toggle => toggle.addEventListener('change', () => {
      scene.querySelectorAll(`[data-twin-layer="${toggle.dataset.twinToggle}"]`).forEach(layer => { layer.style.display = toggle.checked ? '' : 'none'; });
    }));
  }

  function activateView(view, target = null) {
    const validViews = new Set(['dashboard', 'verification', 'intelligence', 'reports', 'check-land']);
    if (!validViews.has(view)) return;
    document.querySelectorAll('[data-view-panel]').forEach(panel => {
      panel.hidden = panel.dataset.viewPanel !== view;
    });
    const advancedDetails = $('advancedDetails');
    if (view === 'dashboard' || view === 'check-land') advancedDetails.open = false;
    else advancedDetails.open = true;
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      const active = item.dataset.viewTarget === view;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    document.querySelectorAll('.mobile-nav-parent').forEach(item => {
      const active = item.dataset.viewTarget === view;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    document.querySelectorAll('.nav-subitem').forEach(item => {
      const active = Boolean(target?.id && item.getAttribute('href') === `#${target.id}`);
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    });
    if (view === 'intelligence' && state.land && state.location) {
      requestAnimationFrame(() => {
        renderMap(state.land, state.location);
        if (state.mapActive && state.map) setTimeout(() => state.map.invalidateSize(), 80);
      });
    }
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  $('refreshButton').addEventListener('click', refresh);
  $('documentsList').addEventListener('click', event => {
    const toggle = event.target.closest('.document-row-trigger');
    if (!toggle) return;
    const details = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!details) return;
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    details.setAttribute('aria-hidden', String(expanded));
    if (expanded) details.setAttribute('inert', '');
    else details.removeAttribute('inert');
  });
  $('mutationTimeline').addEventListener('click', event => {
    const toggle = event.target.closest('.mutation-event-toggle');
    if (!toggle) return;
    const details = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!details) return;
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    details.setAttribute('aria-hidden', String(expanded));
    if (expanded) details.setAttribute('inert', '');
    else details.removeAttribute('inert');
  });
  $('riskCategories').addEventListener('click', event => {
    const card = event.target.closest('.risk-category');
    if (!card || event.target.closest('.risk-action-panel')) return;
    toggleRiskCard(card);
  });
  $('riskCategories').addEventListener('keydown', event => {
    const card = event.target.closest('.risk-category');
    if (!card || event.target !== card || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    toggleRiskCard(card);
  });
  $('languageEnglish').addEventListener('click', () => setLanguage('en'));
  $('languageBangla').addEventListener('click', () => setLanguage('bn'));
  $('themeToggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('simulationStep').addEventListener('change', event => {
    const label = simulatorScenarioLabels[event.target.value];
    const wasCalculated = $('simulationResult').dataset.state === 'calculated';
    showSimulatorMessage(label ? `Selected scenario: ${label}` : 'Choose a scenario, then calculate the result.', wasCalculated ? 'Scenario changed. Calculate again to see this result.' : 'Choose a scenario, then calculate the result.', wasCalculated ? 'stale' : 'idle');
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    const href = link.getAttribute('href');
    const target = document.querySelector(href);
    const view = link.dataset.viewTarget || target?.closest('[data-view-panel]')?.dataset.viewPanel
      || (href === '#overview' ? 'dashboard' : null);
    if (view) activateView(view, href === '#overview' ? null : target);
  }));
  $('landReferenceForm').addEventListener('submit', searchLandReference);
  $('checkLandForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const message = $('checkLandMessage');
    message.hidden = false;
    message.textContent = 'Your details were not sent or verified. This prototype currently supports DEMO-001 and DEMO-002 through reference search only; it cannot retrieve official ownership, mutation, map, or risk information for these entered details.';
    applyTranslations(message);
  });
  $('landSelect').addEventListener('change', event => {
    $('landReferenceInput').value = event.target.value;
    $('landReferenceInput').removeAttribute('aria-invalid');
    setLandReferenceMessage(`Loading land record ${event.target.value}…`);
    loadLand(event.target.value).then(() => setLandReferenceMessage(`Showing dashboard information for ${event.target.value}.`)).catch(error => { fail(error.message); setLandReferenceMessage(`Could not load ${event.target.value}. Check the backend connection and try again.`, true); toast(error.message); });
  });
  $('simulateButton').addEventListener('click', simulateSelectedScenario);
  $('refreshReport').addEventListener('click', refreshReport);
  $('printReport').addEventListener('click', () => { document.body.classList.add('printing-report'); window.print(); });
  window.addEventListener('afterprint', () => document.body.classList.remove('printing-report'));
  $('mapExpand').addEventListener('click', () => {
    $('mapShell').classList.toggle('expanded');
    $('mapExpand').textContent = $('mapShell').classList.contains('expanded') ? '⛶ Collapse map' : '⛶ Expand map';
    applyTranslations($('mapExpand'));
    if (state.mapActive && state.map) setTimeout(() => state.map.invalidateSize(), 80);
  });
  let zoom = 1; const mapSvg = document.querySelector('.map-svg');
  $('zoomIn').addEventListener('click', () => { if (state.mapActive && state.map) state.map.zoomIn(); else { zoom = Math.min(1.65, zoom + .12); if (mapSvg) mapSvg.style.transform = `scale(${zoom})`; } });
  $('zoomOut').addEventListener('click', () => { if (state.mapActive && state.map) state.map.zoomOut(); else { zoom = Math.max(.8, zoom - .12); if (mapSvg) mapSvg.style.transform = `scale(${zoom})`; } });
  $('locateMap').addEventListener('click', () => {
    const loc = state.location?.location || {};
    if (state.mapActive && state.map && loc.latitude !== null && loc.latitude !== undefined && loc.longitude !== null && loc.longitude !== undefined && Number.isFinite(Number(loc.latitude)) && Number.isFinite(Number(loc.longitude))) state.map.setView([Number(loc.latitude), Number(loc.longitude)], 17);
    else { zoom = 1; if (mapSvg) mapSvg.style.transform = ''; }
  });
  $('mapDetails').addEventListener('click', () => activateView('verification', $('land-details')));
  $('allDocuments').addEventListener('click', () => {
    const response = state.documents || {};
    const checks = response.checks && typeof response.checks === 'object'
      ? Object.entries(response.checks).map(([name, value]) => ({ name, ...value })) : [];
    const records = asArray(first(response.documents, response.items, response.records, checks.length ? checks : null, Array.isArray(response) ? response : []));
    $('documentsDialogNote').textContent = first(response.message, response.verification_status, 'No document screening details were returned by the API.');
    $('documentsDialogBody').innerHTML = records.length ? records.map(record => {
      const name = typeof record === 'string' ? record : first(record.name, record.document_name, record.title, record.type, 'Land record check');
      const status = typeof record === 'string' ? 'RECORDED' : first(record.status, record.verification_status, record.result, 'NOT CHECKED');
      const detail = typeof record === 'string' ? 'Record returned by the backend.' : first(record.message, record.details, record.reference, 'No additional detail provided.');
      const good = /pass|verified|valid/i.test(String(status));
      return `<article class="dialog-record"><div><b>${escapeHtml(titleCase(name))}</b><p>${escapeHtml(detail)}</p></div><span class="doc-status ${good ? '' : 'warn'}">${escapeHtml(titleCase(status))}</span></article>`;
    }).join('') : '<p class="loading-row">No document checks are available for this land.</p>';
    const warnings = asArray(response.warnings);
    $('documentsDialogWarning').textContent = warnings.length ? `Follow-up: ${warnings.join(' ')}` : (response.screening_only ? 'Screening only. This does not verify official document authenticity.' : 'Confirm these results against official land records.');
    applyTranslations();
    $('documentsDialog').showModal();
  });
  $('closeDocumentsDialog').addEventListener('click', () => $('documentsDialog').close());
  $('documentsDialog').addEventListener('click', event => { if (event.target === $('documentsDialog')) $('documentsDialog').close(); });
  setupTwinControls();
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('landshield-theme') === 'dark' ? 'dark' : 'light'; } catch (_) { /* Keep the light theme when storage is unavailable. */ }
  setTheme(savedTheme);
  let savedLanguage = 'bn';
  try {
    const languagePreference = localStorage.getItem('landshield-language');
    if (languagePreference === 'bn' || languagePreference === 'en') savedLanguage = languagePreference;
  } catch (_) { /* Bengali is the default when language storage is unavailable. */ }
  setLanguage(savedLanguage);
  refresh();
})();
