export interface DistrictInfo {
  name: string;
  nepaliName: string;
  province: string;
  headquarters: string;
  cities: string[];
}

export interface CityInfo {
  name: string;
  nepaliName?: string;
  district: string;
  province: string;
  isPopular?: boolean;
}

export const NEPAL_PROVINCES = [
  { id: "koshi", name: "Koshi Province", nepaliName: "कोशी प्रदेश" },
  { id: "madhesh", name: "Madhesh Province", nepaliName: "मधेश प्रदेश" },
  { id: "bagmati", name: "Bagmati Province", nepaliName: "बागमती प्रदेश" },
  { id: "gandaki", name: "Gandaki Province", nepaliName: "गण्डकी प्रदेश" },
  { id: "lumbini", name: "Lumbini Province", nepaliName: "लुम्बिनी प्रदेश" },
  { id: "karnali", name: "Karnali Province", nepaliName: "कर्णाली प्रदेश" },
  { id: "sudurpashchim", name: "Sudurpashchim Province", nepaliName: "सुदूरपश्चिम प्रदेश" },
];

export const NEPAL_DISTRICTS: DistrictInfo[] = [
  // ==========================================
  // KOSHI PROVINCE (14 Districts)
  // ==========================================
  {
    name: "Bhojpur",
    nepaliName: "भोजपुर",
    province: "Koshi",
    headquarters: "Bhojpur",
    cities: ["Bhojpur Bazaar", "Shadananda", "Hatuwagadhi", "Pauwadungma", "Tyamke Maiyum"],
  },
  {
    name: "Dhankuta",
    nepaliName: "धनकुटा",
    province: "Koshi",
    headquarters: "Dhankuta",
    cities: ["Dhankuta Bazaar", "Pakhribas", "Mahalaxmi", "Hile", "Bhedetar", "Chaubise"],
  },
  {
    name: "Ilam",
    nepaliName: "इलाम",
    province: "Koshi",
    headquarters: "Ilam",
    cities: ["Ilam Bazaar", "Suryodaya", "Kanyam", "Pashupatinagar", "Deumai", "Mai", "Mangsebung"],
  },
  {
    name: "Jhapa",
    nepaliName: "झापा",
    province: "Koshi",
    headquarters: "Bhadrapur",
    cities: ["Birtamod", "Damak", "Bhadrapur", "Mechinagar / Kakarbhitta", "Kankai", "Arjundhara", "Shivasatakshi"],
  },
  {
    name: "Khotang",
    nepaliName: "खोटाङ",
    province: "Koshi",
    headquarters: "Diktel",
    cities: ["Diktel", "Halesi Tuwachung", "Rawabesi", "Sakela", "Khotehang"],
  },
  {
    name: "Morang",
    nepaliName: "मोरङ",
    province: "Koshi",
    headquarters: "Biratnagar",
    cities: ["Biratnagar Metro", "Belbari", "Sundarharaicha", "Urlabari", "Pathari Shanischare", "Rangeli", "Ratuwamai"],
  },
  {
    name: "Okhaldhunga",
    nepaliName: "ओखलढुङ्गा",
    province: "Koshi",
    headquarters: "Siddhicharan",
    cities: ["Siddhicharan / Okhaldhunga Bazaar", "Manebhanjyang", "Champadevi", "Khijidemba"],
  },
  {
    name: "Panchthar",
    nepaliName: "पाँचथर",
    province: "Koshi",
    headquarters: "Phidim",
    cities: ["Phidim", "Hilihang", "Falgunanda", "Yangwarak", "Miklajung"],
  },
  {
    name: "Sankhuwasabha",
    nepaliName: "सङ्खुवासभा",
    province: "Koshi",
    headquarters: "Khandbari",
    cities: ["Khandbari", "Chainpur", "Dharmadevi", "Madi", "Panchakhapan", "Makalu"],
  },
  {
    name: "Solukhumbu",
    nepaliName: "सोलुखुम्बु",
    province: "Koshi",
    headquarters: "Salleri",
    cities: ["Namche Bazaar", "Lukla", "Salleri / Dudhkunda", "Khumbu Pasanglhamu", "Phaplu"],
  },
  {
    name: "Sunsari",
    nepaliName: "सुनसरी",
    province: "Koshi",
    headquarters: "Inaruwa",
    cities: ["Dharan Sub-Metro", "Itahari Sub-Metro", "Inaruwa", "Barahachhetra", "Ramdhuni", "Duhabi"],
  },
  {
    name: "Taplejung",
    nepaliName: "ताप्लेजुङ",
    province: "Koshi",
    headquarters: "Phungling",
    cities: ["Phungling", "Pathibhara Area", "Sirijangha", "Mikwakhola", "Maiwakhola"],
  },
  {
    name: "Terhathum",
    nepaliName: "तेह्रथुम",
    province: "Koshi",
    headquarters: "Myanglung",
    cities: ["Myanglung", "Laligurans / Basantapur", "Menchayayem", "Chhathar"],
  },
  {
    name: "Udayapur",
    nepaliName: "उदयपुर",
    province: "Koshi",
    headquarters: "Gaighat",
    cities: ["Gaighat / Triyuga", "Katari", "Chaudandigadhi", "Belaka", "Rautamai"],
  },

  // ==========================================
  // MADHESH PROVINCE (8 Districts)
  // ==========================================
  {
    name: "Saptari",
    nepaliName: "सप्तरी",
    province: "Madhesh",
    headquarters: "Rajbiraj",
    cities: ["Rajbiraj", "Kanchanrup", "Dakneshwari", "Bodebarsain", "Hanumannagar Kankalini", "Shambhunath"],
  },
  {
    name: "Siraha",
    nepaliName: "सिराहा",
    province: "Madhesh",
    headquarters: "Siraha",
    cities: ["Siraha", "Lahan", "Golbazar", "Mirchaiya", "Kalyanpur", "Dhangadhimai", "Sukhipur"],
  },
  {
    name: "Dhanusha",
    nepaliName: "धनुषा",
    province: "Madhesh",
    headquarters: "Janakpur",
    cities: ["Janakpurdham Sub-Metro", "Mithila", "Dhanusadham", "Sabaila", "Ganeshman Charnath", "Shahidnagar", "Dhalkebar"],
  },
  {
    name: "Mahottari",
    nepaliName: "महोत्तरी",
    province: "Madhesh",
    headquarters: "Jaleshwar",
    cities: ["Jaleshwar", "Bardibas", "Gaushala", "Bhangaha", "Loharpatti", "Manara Shiswa"],
  },
  {
    name: "Sarlahi",
    nepaliName: "सर्लाही",
    province: "Madhesh",
    headquarters: "Malangwa",
    cities: ["Malangwa", "Hariwon", "Lalbandi", "Barahathawa", "Ishwarpur", "Bagmati", "Godaita"],
  },
  {
    name: "Rautahat",
    nepaliName: "रौतहट",
    province: "Madhesh",
    headquarters: "Gaur",
    cities: ["Gaur", "Chandrapur", "Garuda", "Brindaban", "Dewahi Gonahi", "Rajpur"],
  },
  {
    name: "Bara",
    nepaliName: "बारा",
    province: "Madhesh",
    headquarters: "Kalaiya",
    cities: ["Kalaiya Sub-Metro", "Jitpursimara Sub-Metro", "Kolhabi", "Nijgadh", "Simroungadh"],
  },
  {
    name: "Parsa",
    nepaliName: "पर्सा",
    province: "Madhesh",
    headquarters: "Birgunj",
    cities: ["Birgunj Metro", "Pokhariya", "Parsagadhi", "Bahudarmai", "Bindabasini"],
  },

  // ==========================================
  // BAGMATI PROVINCE (13 Districts)
  // ==========================================
  {
    name: "Kathmandu",
    nepaliName: "काठमाडौँ",
    province: "Bagmati",
    headquarters: "Kathmandu",
    cities: [
      "Kathmandu Metro",
      "Kirtipur",
      "Budhanilkantha",
      "Chandragiri",
      "Tokha",
      "Tarakeshwar",
      "Gokarneshwar",
      "Nagarjun",
      "Kageshwari-Manohara",
      "Dakshinkali",
      "Shankharapur",
      "Thamel",
      "New Road",
      "Boudha",
    ],
  },
  {
    name: "Lalitpur",
    nepaliName: "ललितपुर",
    province: "Bagmati",
    headquarters: "Patan",
    cities: [
      "Lalitpur Metro (Patan)",
      "Mahalaxmi",
      "Godawari",
      "Jawalakhel",
      "Kupondole",
      "Lubhu",
      "Konjyosom",
      "Bagmati",
    ],
  },
  {
    name: "Bhaktapur",
    nepaliName: "भक्तपुर",
    province: "Bagmati",
    headquarters: "Bhaktapur",
    cities: [
      "Bhaktapur City",
      "Madhyapur Thimi",
      "Suryabinayak",
      "Changunarayan",
      "Nagarkot",
      "Sallaghari",
    ],
  },
  {
    name: "Chitwan",
    nepaliName: "चितवन",
    province: "Bagmati",
    headquarters: "Bharatpur",
    cities: [
      "Bharatpur Metro",
      "Narayangarh",
      "Ratnanagar",
      "Sauraha",
      "Khairahani",
      "Rapti",
      "Kalika",
      "Madi",
    ],
  },
  {
    name: "Kavrepalanchok",
    nepaliName: "काभ्रेपलाञ्चोक",
    province: "Bagmati",
    headquarters: "Dhulikhel",
    cities: [
      "Dhulikhel",
      "Banepa",
      "Panauti",
      "Panchkhal",
      "Namobuddha",
      "Mandandeupur",
    ],
  },
  {
    name: "Makwanpur",
    nepaliName: "मकवानपुर",
    province: "Bagmati",
    headquarters: "Hetauda",
    cities: ["Hetauda Sub-Metro", "Thaha / Daman", "Bhimphedi", "Makawanpurgadhi", "Bakaiya"],
  },
  {
    name: "Nuwakot",
    nepaliName: "नुवाकोट",
    province: "Bagmati",
    headquarters: "Bidur",
    cities: ["Bidur", "Battar", "Belkotgadhi", "Kakani", "Dupcheshwar", "Trishuli"],
  },
  {
    name: "Dhading",
    nepaliName: "धादिङ",
    province: "Bagmati",
    headquarters: "Nilkantha",
    cities: ["Nilkantha / Dhading Besi", "Dhunibesi", "Galchhi", "Gajuri", "Malekhu", "Benighat"],
  },
  {
    name: "Sindhupalchok",
    nepaliName: "सिन्धुपाल्चोक",
    province: "Bagmati",
    headquarters: "Chautara",
    cities: ["Chautara", "Melamchi", "Barhabise", "Helambu", "Tatopani", "Sukute"],
  },
  {
    name: "Dolakha",
    nepaliName: "दोलखा",
    province: "Bagmati",
    headquarters: "Charikot",
    cities: ["Charikot / Bhimeshwar", "Jiri", "Kalinchok", "Sailung", "Baiteshwar"],
  },
  {
    name: "Ramechhap",
    nepaliName: "रामेछाप",
    province: "Bagmati",
    headquarters: "Manthali",
    cities: ["Manthali", "Ramechhap Bazaar", "Gokulganga", "Likhu Tamakoshi", "Sunapati"],
  },
  {
    name: "Sindhuli",
    nepaliName: "सिन्धुली",
    province: "Bagmati",
    headquarters: "Kamalamai",
    cities: ["Kamalamai / Sindhulimadi", "Dudhauli", "Marin", "Hariharpurgadhi", "Golanjor"],
  },
  {
    name: "Rasuwa",
    nepaliName: "रसुवा",
    province: "Bagmati",
    headquarters: "Dhunche",
    cities: ["Dhunche", "Gosaikunda Area", "Syaphrubesi", "Uttargaya", "Kalika"],
  },

  // ==========================================
  // GANDAKI PROVINCE (11 Districts)
  // ==========================================
  {
    name: "Kaski",
    nepaliName: "कास्की",
    province: "Gandaki",
    headquarters: "Pokhara",
    cities: [
      "Pokhara Metro",
      "Lakeside Pokhara",
      "Lekhnath",
      "Sarangkot",
      "Hemja",
      "Annapurna",
      "Machhapuchhre",
      "Rupa",
    ],
  },
  {
    name: "Tanahun",
    nepaliName: "तनहुँ",
    province: "Gandaki",
    headquarters: "Damauli",
    cities: ["Damauli / Vyas", "Shuklagandaki", "Bhanu", "Bhimad", "Bandipur", "Dumre"],
  },
  {
    name: "Gorkha",
    nepaliName: "गोरखा",
    province: "Gandaki",
    headquarters: "Gorkha",
    cities: ["Gorkha Bazaar", "Palungtar", "Manakamana", "Barpak", "Sulikot", "Arughat"],
  },
  {
    name: "Lamjung",
    nepaliName: "लमजुङ",
    province: "Gandaki",
    headquarters: "Besishahar",
    cities: ["Besishahar", "Sundarbazar", "Rainas", "Madhyanepal", "Ghalegaun"],
  },
  {
    name: "Syangja",
    nepaliName: "स्याङ्जा",
    province: "Gandaki",
    headquarters: "Putalibazar",
    cities: ["Putalibazar", "Waling", "Galyang", "Bhirkot", "Chapakot", "Sirkot"],
  },
  {
    name: "Nawalpur",
    nepaliName: "नवलपुर (नवलपरासी पूर्व)",
    province: "Gandaki",
    headquarters: "Kawasoti",
    cities: ["Kawasoti", "Gaidakot", "Devchuli", "Madhyabindu", "Danda"],
  },
  {
    name: "Parbat",
    nepaliName: "पर्वत",
    province: "Gandaki",
    headquarters: "Kushma",
    cities: ["Kushma", "Phalebas", "Jaljala", "Paiyun", "Mahashila"],
  },
  {
    name: "Baglung",
    nepaliName: "बागलुङ",
    province: "Gandaki",
    headquarters: "Baglung",
    cities: ["Baglung Bazaar", "Galkot", "Jaimini", "Dhorpatan", "Burtibang"],
  },
  {
    name: "Myagdi",
    nepaliName: "म्याग्दी",
    province: "Gandaki",
    headquarters: "Beni",
    cities: ["Beni Bazaar", "Ghorepani / Poon Hill", "Tatopani", "Annapurna", "Dhaulagiri", "Malika"],
  },
  {
    name: "Mustang",
    nepaliName: "मुस्ताङ",
    province: "Gandaki",
    headquarters: "Jomsom",
    cities: ["Jomsom", "Lo Manthang", "Muktinath", "Marpha", "Kagbeni", "Thasang"],
  },
  {
    name: "Manang",
    nepaliName: "मनाङ",
    province: "Gandaki",
    headquarters: "Chame",
    cities: ["Chame", "Manang Village", "Tilicho Lake Area", "Nar", "Phu"],
  },

  // ==========================================
  // LUMBINI PROVINCE (12 Districts)
  // ==========================================
  {
    name: "Rupandehi",
    nepaliName: "रुपन्देही",
    province: "Lumbini",
    headquarters: "Siddharthanagar",
    cities: [
      "Butwal Sub-Metro",
      "Siddharthanagar / Bhairahawa",
      "Tilottama",
      "Lumbini Sanskritik",
      "Sainamaina",
      "Devdaha",
    ],
  },
  {
    name: "Banke",
    nepaliName: "बाँके",
    province: "Lumbini",
    headquarters: "Nepalgunj",
    cities: ["Nepalgunj Sub-Metro", "Kohalpur", "Khajura", "Baijanath", "Ranjha"],
  },
  {
    name: "Dang",
    nepaliName: "दाङ",
    province: "Lumbini",
    headquarters: "Ghorahi",
    cities: ["Ghorahi Sub-Metro", "Tulsipur Sub-Metro", "Lamahi", "Bhalubang", "Gadhawa"],
  },
  {
    name: "Kapilvastu",
    nepaliName: "कपिलवस्तु",
    province: "Lumbini",
    headquarters: "Taulihawa",
    cities: ["Kapilvastu / Taulihawa", "Banganga", "Buddhabhumi", "Shivaraj", "Krishnanagar", "Chandrauta"],
  },
  {
    name: "Palpa",
    nepaliName: "पाल्पा",
    province: "Lumbini",
    headquarters: "Tansen",
    cities: ["Tansen", "Rampur", "Rainadevi Chhahara", "Mathagadhi", "Rani Mahal Area"],
  },
  {
    name: "Parasi",
    nepaliName: "परासी (नवलपरासी पश्चिम)",
    province: "Lumbini",
    headquarters: "Ramgram",
    cities: ["Ramgram / Parasi", "Sunwal", "Bardaghat", "Sarawal", "Palhinandan"],
  },
  {
    name: "Bardiya",
    nepaliName: "बर्दिया",
    province: "Lumbini",
    headquarters: "Gulariya",
    cities: ["Gulariya", "Bansgadhi", "Rajapur", "Madhuwan", "Thakurbaba / Bhurigaun", "Barbardiya"],
  },
  {
    name: "Gulmi",
    nepaliName: "गुल्मी",
    province: "Lumbini",
    headquarters: "Tamghas",
    cities: ["Tamghas / Resunga", "Musikot", "Ruru / Ridi", "Satyawati", "Dhurkot"],
  },
  {
    name: "Arghakhanchi",
    nepaliName: "अर्घाखाँची",
    province: "Lumbini",
    headquarters: "Sandhikharka",
    cities: ["Sandhikharka", "Sitaganga", "Bhumikasthan", "Chhatradev", "Panini"],
  },
  {
    name: "Pyuthan",
    nepaliName: "प्युठान",
    province: "Lumbini",
    headquarters: "Pyuthan",
    cities: ["Pyuthan Bazaar", "Swargadwari", "Bijuwar", "Khalanga", "Gaumukhi"],
  },
  {
    name: "Rolpa",
    nepaliName: "रोल्पा",
    province: "Lumbini",
    headquarters: "Liwang",
    cities: ["Liwang / Rolpa", "Sulichaur", "Runtigadhi", "Sunil Smriti", "Thabang"],
  },
  {
    name: "Eastern Rukum",
    nepaliName: "पूर्वी रुकुम",
    province: "Lumbini",
    headquarters: "Rukumkot",
    cities: ["Rukumkot / Sisne", "Putha Uttarganga", "Bhume"],
  },

  // ==========================================
  // KARNALI PROVINCE (10 Districts)
  // ==========================================
  {
    name: "Surkhet",
    nepaliName: "सुर्खेत",
    province: "Karnali",
    headquarters: "Birendranagar",
    cities: ["Birendranagar", "Bheriganga", "Gurbhakot", "Panchapuri", "Lekbeshi", "Chhinchu"],
  },
  {
    name: "Dailekh",
    nepaliName: "दैलेख",
    province: "Karnali",
    headquarters: "Narayan",
    cities: ["Narayan / Dailekh Bazaar", "Dullu", "Chamunda Bindrasaini", "Aathbis"],
  },
  {
    name: "Jumla",
    nepaliName: "जुम्ला",
    province: "Karnali",
    headquarters: "Chandannath",
    cities: ["Chandannath / Khalanga", "Tatopani", "Tila", "Sinja Valley", "Hima"],
  },
  {
    name: "Mugu",
    nepaliName: "मुगु",
    province: "Karnali",
    headquarters: "Gamgadhi",
    cities: ["Gamgadhi / Chhayanath Rara", "Rara Lake Area", "Mugum Karmarong", "Soru"],
  },
  {
    name: "Kalikot",
    nepaliName: "कालिकोट",
    province: "Karnali",
    headquarters: "Manma",
    cities: ["Manma / Khandachakra", "Raskot", "Tilagukha", "Shubhakalika"],
  },
  {
    name: "Jajarkot",
    nepaliName: "जाजरकोट",
    province: "Karnali",
    headquarters: "Khalanga",
    cities: ["Khalanga / Bheri", "Chhedagad", "Nalgad", "Barekot"],
  },
  {
    name: "Salyan",
    nepaliName: "सल्यान",
    province: "Karnali",
    headquarters: "Sharada",
    cities: ["Sharada / Khalanga", "Bagchaur", "Bangad Kupinde", "Srinagar"],
  },
  {
    name: "Western Rukum",
    nepaliName: "पश्चिम रुकुम",
    province: "Karnali",
    headquarters: "Musikot",
    cities: ["Musikot / Khalanga", "Chaurjahari", "Aathbiskot", "Sanibheri"],
  },
  {
    name: "Dolpa",
    nepaliName: "डोल्पा",
    province: "Karnali",
    headquarters: "Dunai",
    cities: ["Dunai / Thuli Bheri", "Tripurasundari", "Shey Phoksundo", "Dolpo Buddha"],
  },
  {
    name: "Humla",
    nepaliName: "हुम्ला",
    province: "Karnali",
    headquarters: "Simikot",
    cities: ["Simikot", "Namkha", "Kharpunath", "Sarkegad", "Hilsa Border"],
  },

  // ==========================================
  // SUDURPASHCHIM PROVINCE (9 Districts)
  // ==========================================
  {
    name: "Kailali",
    nepaliName: "कैलाली",
    province: "Sudurpashchim",
    headquarters: "Dhangadhi",
    cities: [
      "Dhangadhi Sub-Metro",
      "Tikapur",
      "Godawari / Attariya",
      "Lamki Chuha",
      "Ghodaghodi / Sukhad",
      "Bhajani",
    ],
  },
  {
    name: "Kanchanpur",
    nepaliName: "कञ्चनपुर",
    province: "Sudurpashchim",
    headquarters: "Bhimdatta",
    cities: [
      "Bhimdatta / Mahendranagar",
      "Bedkot",
      "Krishnapur",
      "Punarwas",
      "Belauri",
      "Shuklaphanta",
      "Dodhara Chandani",
    ],
  },
  {
    name: "Dadeldhura",
    nepaliName: "डडेल्धुरा",
    province: "Sudurpashchim",
    headquarters: "Amargadhi",
    cities: ["Amargadhi", "Parshuram / Jogbudha", "Navadurga", "Ajaymeru"],
  },
  {
    name: "Doti",
    nepaliName: "डोटी",
    province: "Sudurpashchim",
    headquarters: "Dipayal Silgadhi",
    cities: ["Dipayal Silgadhi", "Shikhar", "Purbichowki", "Khadachakra", "Silgadhi"],
  },
  {
    name: "Achham",
    nepaliName: "अछाम",
    province: "Sudurpashchim",
    headquarters: "Mangalsen",
    cities: ["Mangalsen", "Sanfebagar", "Kamalbazar", "Panchadewal Binayak"],
  },
  {
    name: "Baitadi",
    nepaliName: "बैतडी",
    province: "Sudurpashchim",
    headquarters: "Dasharathchand",
    cities: ["Dasharathchand", "Patan", "Melauli", "Purchaudi", "Gothalapani"],
  },
  {
    name: "Darchula",
    nepaliName: "दार्चुला",
    province: "Sudurpashchim",
    headquarters: "Khalanga",
    cities: ["Khalanga / Mahakali", "Shailyashikhar", "Malikarjun", "Apihimal"],
  },
  {
    name: "Bajhang",
    nepaliName: "बझाङ",
    province: "Sudurpashchim",
    headquarters: "Chainpur",
    cities: ["Chainpur / Jayaprithvi", "Bungal", "Khaptadchhanna", "Thalara"],
  },
  {
    name: "Bajura",
    nepaliName: "बाजुरा",
    province: "Sudurpashchim",
    headquarters: "Martadi",
    cities: ["Martadi / Badimalika", "Budhiganga", "Budhinanda", "Kolti"],
  },
];

// Helper: Get sorted list of district names
export const ALL_DISTRICT_NAMES = NEPAL_DISTRICTS.map((d) => d.name).sort();

// Helper: Top 24 popular urban/hub centers of Nepal for quick 1-click selection
export const POPULAR_CITIES: CityInfo[] = [
  { name: "Kathmandu Metro", nepaliName: "काठमाडौँ महानगर", district: "Kathmandu", province: "Bagmati", isPopular: true },
  { name: "Pokhara Metro", nepaliName: "पोखरा महानगर", district: "Kaski", province: "Gandaki", isPopular: true },
  { name: "Lalitpur Metro (Patan)", nepaliName: "ललितपुर महानगर", district: "Lalitpur", province: "Bagmati", isPopular: true },
  { name: "Bhaktapur City", nepaliName: "भक्तपुर नगर", district: "Bhaktapur", province: "Bagmati", isPopular: true },
  { name: "Bharatpur Metro", nepaliName: "भरतपुर महानगर", district: "Chitwan", province: "Bagmati", isPopular: true },
  { name: "Biratnagar Metro", nepaliName: "विराटनगर महानगर", district: "Morang", province: "Koshi", isPopular: true },
  { name: "Birgunj Metro", nepaliName: "वीरगञ्ज महानगर", district: "Parsa", province: "Madhesh", isPopular: true },
  { name: "Butwal Sub-Metro", nepaliName: "बुटवल उपमहानगर", district: "Rupandehi", province: "Lumbini", isPopular: true },
  { name: "Dharan Sub-Metro", nepaliName: "धरान उपमहानगर", district: "Sunsari", province: "Koshi", isPopular: true },
  { name: "Itahari Sub-Metro", nepaliName: "इटहरी उपमहानगर", district: "Sunsari", province: "Koshi", isPopular: true },
  { name: "Nepalgunj Sub-Metro", nepaliName: "नेपालगञ्ज उपमहानगर", district: "Banke", province: "Lumbini", isPopular: true },
  { name: "Dhangadhi Sub-Metro", nepaliName: "धनगढी उपमहानगर", district: "Kailali", province: "Sudurpashchim", isPopular: true },
  { name: "Hetauda Sub-Metro", nepaliName: "हेटौँडा उपमहानगर", district: "Makwanpur", province: "Bagmati", isPopular: true },
  { name: "Janakpurdham Sub-Metro", nepaliName: "जनकपुरधाम उपमहानगर", district: "Dhanusha", province: "Madhesh", isPopular: true },
  { name: "Birtamod", nepaliName: "बिर्तामोड", district: "Jhapa", province: "Koshi", isPopular: true },
  { name: "Damak", nepaliName: "दमक", district: "Jhapa", province: "Koshi", isPopular: true },
  { name: "Ghorahi Sub-Metro", nepaliName: "घोराही उपमहानगर", district: "Dang", province: "Lumbini", isPopular: true },
  { name: "Tulsipur Sub-Metro", nepaliName: "तुलसीपुर उपमहानगर", district: "Dang", province: "Lumbini", isPopular: true },
  { name: "Siddharthanagar / Bhairahawa", nepaliName: "सिद्धार्थनगर / भैरहवा", district: "Rupandehi", province: "Lumbini", isPopular: true },
  { name: "Birendranagar", nepaliName: "वीरेन्द्रनगर", district: "Surkhet", province: "Karnali", isPopular: true },
  { name: "Bhimdatta / Mahendranagar", nepaliName: "भीमदत्त / महेन्द्रनगर", district: "Kanchanpur", province: "Sudurpashchim", isPopular: true },
  { name: "Banepa", nepaliName: "बनेपा", district: "Kavrepalanchok", province: "Bagmati", isPopular: true },
  { name: "Dhulikhel", nepaliName: "धुलिखेल", district: "Kavrepalanchok", province: "Bagmati", isPopular: true },
  { name: "Sauraha", nepaliName: "सौराह", district: "Chitwan", province: "Bagmati", isPopular: true },
];

// Helper: Get cities for a district
export function getCitiesForDistrict(districtName: string): string[] {
  const match = NEPAL_DISTRICTS.find(
    (d) => d.name.toLowerCase() === districtName.toLowerCase()
  );
  if (!match) return ["All Cities / Center"];
  return ["All Cities / Central Municipality", ...match.cities];
}

// Helper: Find district information
export function getDistrictInfo(districtName: string): DistrictInfo | undefined {
  return NEPAL_DISTRICTS.find(
    (d) => d.name.toLowerCase() === districtName.toLowerCase()
  );
}

// Helper: Find which district a city belongs to
export function findDistrictForCity(cityName: string): { district: string; province: string } | null {
  for (const d of NEPAL_DISTRICTS) {
    if (d.cities.some((c) => c.toLowerCase() === cityName.toLowerCase())) {
      return { district: d.name, province: d.province };
    }
  }
  return null;
}
