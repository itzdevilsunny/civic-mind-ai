// Real Indian city data with coordinates, timezone, districts
// Source: Wikipedia / government data / wikidata lat/lng
export const INDIA_CITIES = [
  // ── MAHARASHTRA ──────────────────────────────────────────
  { value: "mumbai",       label: "Mumbai",          state: "Maharashtra",        lat: 19.0760, lng: 72.8777, tz: "Asia/Kolkata", lang: "mr", districts: ["Andheri","Bandra","Colaba","Dadar","Dharavi","Juhu","Kurla","Worli"] },
  { value: "pune",         label: "Pune",             state: "Maharashtra",        lat: 18.5204, lng: 73.8567, tz: "Asia/Kolkata", lang: "mr", districts: ["Aundh","Baner","Hadapsar","Kothrud","Pimpri","Shivajinagar","Viman Nagar","Wakad"] },
  { value: "nagpur",       label: "Nagpur",           state: "Maharashtra",        lat: 21.1458, lng: 79.0882, tz: "Asia/Kolkata", lang: "mr", districts: ["Civil Lines","Dharampeth","Gandhibagh","Itwari","Kamptee","Laxmi Nagar","Mahal","Sadar"] },
  { value: "nashik",       label: "Nashik",           state: "Maharashtra",        lat: 19.9975, lng: 73.7898, tz: "Asia/Kolkata", lang: "mr", districts: ["Cidco","Deolali","Gangapur Road","Panchvati","Satpur","Thatte Nagar"] },
  { value: "aurangabad",   label: "Chhatrapati Sambhajinagar", state: "Maharashtra", lat: 19.8762, lng: 75.3433, tz: "Asia/Kolkata", lang: "mr", districts: ["Cantonment","Cidco","N-1","N-2","N-3","N-4","N-5","N-6"] },

  // ── DELHI / NCR ──────────────────────────────────────────
  { value: "delhi",        label: "New Delhi",        state: "Delhi",              lat: 28.6139, lng: 77.2090, tz: "Asia/Kolkata", lang: "hi", districts: ["Chandni Chowk","Connaught Place","Dwarka","Karol Bagh","Lajpat Nagar","Rohini","Saket","Vasant Kunj"] },
  { value: "noida",        label: "Noida",            state: "Uttar Pradesh",      lat: 28.5355, lng: 77.3910, tz: "Asia/Kolkata", lang: "hi", districts: ["Sector 15","Sector 18","Sector 62","Sector 125","Greater Noida","Indirapuram","Vaishali"] },
  { value: "gurgaon",      label: "Gurugram",         state: "Haryana",            lat: 28.4595, lng: 77.0266, tz: "Asia/Kolkata", lang: "hi", districts: ["Cyber City","DLF Phase 1","Golf Course Road","Sector 14","Sector 56","South City","Sushant Lok"] },
  { value: "ghaziabad",    label: "Ghaziabad",        state: "Uttar Pradesh",      lat: 28.6692, lng: 77.4538, tz: "Asia/Kolkata", lang: "hi", districts: ["Crossing Republik","Indirapuram","Kaushambi","Raj Nagar","Sahibabad","Vaishali","Vijay Nagar"] },
  { value: "faridabad",    label: "Faridabad",        state: "Haryana",            lat: 28.4089, lng: 77.3178, tz: "Asia/Kolkata", lang: "hi", districts: ["Ballabhgarh","Bata Chowk","NIT","Old Faridabad","Sector 11","Sector 21","Sector 46"] },

  // ── KARNATAKA ──────────────────────────────────────────
  { value: "bengaluru",    label: "Bengaluru",        state: "Karnataka",          lat: 12.9716, lng: 77.5946, tz: "Asia/Kolkata", lang: "kn", districts: ["Basavanagudi","Electronic City","Hebbal","Indiranagar","Koramangala","Malleswaram","Rajajinagar","Whitefield"] },
  { value: "mysuru",       label: "Mysuru",           state: "Karnataka",          lat: 12.2958, lng: 76.6394, tz: "Asia/Kolkata", lang: "kn", districts: ["Chamundi Hill","Gandhi Square","Hebbal","Jai Laxmi Puram","Kuvempunagar","Mysore Palace","Vijayanagar"] },
  { value: "hubli",        label: "Hubli-Dharwad",    state: "Karnataka",          lat: 15.3647, lng: 75.1240, tz: "Asia/Kolkata", lang: "kn", districts: ["Deshpande Nagar","Keshwapur","Lamington","Navanagar","Unkal","Vidyanagar"] },

  // ── TAMIL NADU ──────────────────────────────────────────
  { value: "chennai",      label: "Chennai",          state: "Tamil Nadu",         lat: 13.0827, lng: 80.2707, tz: "Asia/Kolkata", lang: "ta", districts: ["Adyar","Anna Nagar","Egmore","Guindy","Kilpauk","Nungambakkam","Perambur","T.Nagar","Tambaram","Velachery"] },
  { value: "coimbatore",   label: "Coimbatore",       state: "Tamil Nadu",         lat: 11.0168, lng: 76.9558, tz: "Asia/Kolkata", lang: "ta", districts: ["Gandhipuram","Peelamedu","Race Course","RS Puram","Saibaba Colony","Singanallur","Tidel Park"] },
  { value: "madurai",      label: "Madurai",          state: "Tamil Nadu",         lat: 9.9252,  lng: 78.1198, tz: "Asia/Kolkata", lang: "ta", districts: ["Anna Nagar","KK Nagar","Palanganatham","Periyar","Tallakulam","Vandiyur"] },
  { value: "salem",        label: "Salem",            state: "Tamil Nadu",         lat: 11.6643, lng: 78.1460, tz: "Asia/Kolkata", lang: "ta", districts: ["Alagapuram","Fairlands","Hasthampatti","Kondalampatti","Meyyanur","Shanmugapuram"] },
  { value: "tiruchirappalli", label: "Tiruchirappalli", state: "Tamil Nadu",       lat: 10.7905, lng: 78.7047, tz: "Asia/Kolkata", lang: "ta", districts: ["Golden Rock","Karumandapam","Srirangam","Thiruverumbur","Woraiyur"] },

  // ── WEST BENGAL ──────────────────────────────────────────
  { value: "kolkata",      label: "Kolkata",          state: "West Bengal",        lat: 22.5726, lng: 88.3639, tz: "Asia/Kolkata", lang: "bn", districts: ["Ballygunge","Dum Dum","Howrah","Jadavpur","Kalighat","Lake Town","Park Street","Salt Lake","Uttarpara"] },
  { value: "howrah",       label: "Howrah",           state: "West Bengal",        lat: 22.5958, lng: 88.2636, tz: "Asia/Kolkata", lang: "bn", districts: ["Bally","Belur","Bhatpara","Liluah","Malipanchghara","Ramrajatala","Shibpur"] },
  { value: "siliguri",     label: "Siliguri",         state: "West Bengal",        lat: 26.7271, lng: 88.3953, tz: "Asia/Kolkata", lang: "bn", districts: ["Bhaktinagar","Dabgram","Khaprail","Matigara","NJP","Pradhan Nagar","Sevoke"] },

  // ── ANDHRA PRADESH ──────────────────────────────────────
  { value: "visakhapatnam", label: "Visakhapatnam",  state: "Andhra Pradesh",     lat: 17.6868, lng: 83.2185, tz: "Asia/Kolkata", lang: "te", districts: ["Gajuwaka","Gajuwaka","Kommadi","MVP Colony","Rushikonda","Seethammadhara","Simhachalam","Waltair"] },
  { value: "vijayawada",   label: "Vijayawada",       state: "Andhra Pradesh",     lat: 16.5062, lng: 80.6480, tz: "Asia/Kolkata", lang: "te", districts: ["Benz Circle","Eluru Road","Governorpeta","Krishnalanka","Moghalrajpuram","Patamata","Suryaraopet"] },
  { value: "amaravati",    label: "Amaravati",        state: "Andhra Pradesh",     lat: 16.5150, lng: 80.5159, tz: "Asia/Kolkata", lang: "te", districts: ["Amaravati Capital","Mandadam","Rayapudi","Tadikonda","Undavalli","Venkatapalem"] },
  { value: "guntur",       label: "Guntur",           state: "Andhra Pradesh",     lat: 16.3067, lng: 80.4365, tz: "Asia/Kolkata", lang: "te", districts: ["Arundelpet","Brodipet","Kothapet","Lakshmipuram","Nagarampalem","Pattabhipuram"] },

  // ── TELANGANA ──────────────────────────────────────────
  { value: "hyderabad",    label: "Hyderabad",        state: "Telangana",          lat: 17.3850, lng: 78.4867, tz: "Asia/Kolkata", lang: "te", districts: ["Banjara Hills","Charminar","Gachibowli","Hitech City","Jubilee Hills","Kukatpally","LB Nagar","Madhapur","Secunderabad"] },
  { value: "warangal",     label: "Warangal",         state: "Telangana",          lat: 17.9784, lng: 79.5941, tz: "Asia/Kolkata", lang: "te", districts: ["Hanumakonda","Kazipet","Naimnagar","Subedari","Wardhannapet"] },

  // ── GUJARAT ──────────────────────────────────────────
  { value: "ahmedabad",    label: "Ahmedabad",        state: "Gujarat",            lat: 23.0225, lng: 72.5714, tz: "Asia/Kolkata", lang: "gu", districts: ["Ambawadi","Bopal","Chandkheda","Maninagar","Naranpura","Naroda","Paldi","Satellite","Shahibaug","Vastrapur"] },
  { value: "surat",        label: "Surat",            state: "Gujarat",            lat: 21.1702, lng: 72.8311, tz: "Asia/Kolkata", lang: "gu", districts: ["Adajan","Althan","Citylight","Dumas","Katargam","Rander","Udhna","Varachha","Pal"] },
  { value: "vadodara",     label: "Vadodara",         state: "Gujarat",            lat: 22.3072, lng: 73.1812, tz: "Asia/Kolkata", lang: "gu", districts: ["Alkapuri","Chhani","Fatehgunj","Gotri","Harni","Manjalpur","Productivity Road","Waghodia Road"] },
  { value: "rajkot",       label: "Rajkot",           state: "Gujarat",            lat: 22.3039, lng: 70.8022, tz: "Asia/Kolkata", lang: "gu", districts: ["Airport Road","Aji Dam","Bhakti Nagar","Galaxy","Gondal Road","Kalavad Road","Mavdi","Raiya Road"] },
  { value: "gandhinagar",  label: "Gandhinagar",      state: "Gujarat",            lat: 23.2156, lng: 72.6369, tz: "Asia/Kolkata", lang: "gu", districts: ["Infocity","Kudasan","Sector 1","Sector 11","Sector 16","Sector 21","Sector 28","Sector 30"] },

  // ── RAJASTHAN ──────────────────────────────────────────
  { value: "jaipur",       label: "Jaipur",           state: "Rajasthan",          lat: 26.9124, lng: 75.7873, tz: "Asia/Kolkata", lang: "hi", districts: ["Amer","Bapu Nagar","C-Scheme","Civil Lines","Jagatpura","Malviya Nagar","Mansarovar","Vaishali Nagar"] },
  { value: "jodhpur",      label: "Jodhpur",          state: "Rajasthan",          lat: 26.2389, lng: 73.0243, tz: "Asia/Kolkata", lang: "hi", districts: ["Barli","Chopasni Housing Board","Paota","Ratanada","Sardarpura","Shastri Nagar","Umed Hills"] },
  { value: "udaipur",      label: "Udaipur",          state: "Rajasthan",          lat: 24.5854, lng: 73.7125, tz: "Asia/Kolkata", lang: "hi", districts: ["Ambamata","Bhupal Noble's","Fatehpura","Hiranmagri","Pratap Nagar","Sevashram","Sukhadia Circle"] },
  { value: "kota",         label: "Kota",             state: "Rajasthan",          lat: 25.2138, lng: 75.8648, tz: "Asia/Kolkata", lang: "hi", districts: ["Dada Bari","Industrial Area","Jhalawar Road","Mahaveer Nagar","Rawatbhata Road","Talwandi","Vigyan Nagar"] },

  // ── UTTAR PRADESH ──────────────────────────────────────────
  { value: "lucknow",      label: "Lucknow",          state: "Uttar Pradesh",      lat: 26.8467, lng: 80.9462, tz: "Asia/Kolkata", lang: "hi", districts: ["Aliganj","Alambagh","Aminabad","Gomti Nagar","Hazratganj","Indira Nagar","Mahanagar","Vikas Nagar"] },
  { value: "kanpur",       label: "Kanpur",           state: "Uttar Pradesh",      lat: 26.4499, lng: 80.3319, tz: "Asia/Kolkata", lang: "hi", districts: ["Arya Nagar","Civil Lines","Gangaganj","Juhi","Kakadeo","Kidwai Nagar","Swaroop Nagar","Yashoda Nagar"] },
  { value: "agra",         label: "Agra",             state: "Uttar Pradesh",      lat: 27.1767, lng: 78.0081, tz: "Asia/Kolkata", lang: "hi", districts: ["Balkeshwar","Bodla","Civil Lines","Dayal Bagh","Kamla Nagar","Mau","Sadar","Tajganj"] },
  { value: "varanasi",     label: "Varanasi",         state: "Uttar Pradesh",      lat: 25.3176, lng: 82.9739, tz: "Asia/Kolkata", lang: "hi", districts: ["Assi","Bhojubeer","Cantt","Lanka","Nadesar","Pandeypur","Sigra","Sunderpur"] },
  { value: "prayagraj",    label: "Prayagraj",        state: "Uttar Pradesh",      lat: 25.4358, lng: 81.8463, tz: "Asia/Kolkata", lang: "hi", districts: ["Allapur","Alopibagh","Civil Lines","Colonelganj","George Town","Lukerganj","Mutthiganj","Naini","Phaphamau"] },
  { value: "meerut",       label: "Meerut",           state: "Uttar Pradesh",      lat: 28.9845, lng: 77.7064, tz: "Asia/Kolkata", lang: "hi", districts: ["Begum Bridge","Cantonment","Gandhi Nagar","Sadar Bazar","Shastri Nagar","Suraj Kund","Vijay Nagar"] },

  // ── MADHYA PRADESH ──────────────────────────────────────────
  { value: "bhopal",       label: "Bhopal",           state: "Madhya Pradesh",     lat: 23.2599, lng: 77.4126, tz: "Asia/Kolkata", lang: "hi", districts: ["Arera Colony","Berasia Road","BHEL","Govindpura","Habibganj","Kolar Road","MP Nagar","Shivaji Nagar"] },
  { value: "indore",       label: "Indore",           state: "Madhya Pradesh",     lat: 22.7196, lng: 75.8577, tz: "Asia/Kolkata", lang: "hi", districts: ["Banganga","BT Market","Chhatripura","Juni Indore","MG Road","Palasia","Rajendra Nagar","Scheme No. 114","Vijay Nagar"] },
  { value: "jabalpur",     label: "Jabalpur",         state: "Madhya Pradesh",     lat: 23.1815, lng: 79.9864, tz: "Asia/Kolkata", lang: "hi", districts: ["Adhartal","Civil Lines","Gorakhpur","Katni Road","Madan Mahal","Napier Town","Rani Durgavati","Vijay Nagar"] },
  { value: "gwalior",      label: "Gwalior",          state: "Madhya Pradesh",     lat: 26.2183, lng: 78.1828, tz: "Asia/Kolkata", lang: "hi", districts: ["City Center","Gola Ka Mandir","Hazira","Morar","Padav","Phoolbagh","Shivpuri Link Road","Thatipur"] },

  // ── BIHAR ──────────────────────────────────────────
  { value: "patna",        label: "Patna",            state: "Bihar",              lat: 25.5941, lng: 85.1376, tz: "Asia/Kolkata", lang: "hi", districts: ["Bailey Road","Boring Road","Danapur","Frazer Road","Kankarbagh","Patliputra","Rajendra Nagar","Saguna More"] },
  { value: "gaya",         label: "Gaya",             state: "Bihar",              lat: 24.7955, lng: 84.9994, tz: "Asia/Kolkata", lang: "hi", districts: ["Bankebazar","Bodh Gaya","Imamganj","Manpur","Paraiya","Sherghati","Tekari"] },

  // ── PUNJAB & HARYANA ──────────────────────────────────────────
  { value: "chandigarh",   label: "Chandigarh",       state: "Chandigarh UT",      lat: 30.7333, lng: 76.7794, tz: "Asia/Kolkata", lang: "pa", districts: ["Sector 1","Sector 17","Sector 22","Sector 35","Sector 43","Manimajra","Sector 15","Sector 11","Panchkula"] },
  { value: "ludhiana",     label: "Ludhiana",         state: "Punjab",             lat: 30.9010, lng: 75.8573, tz: "Asia/Kolkata", lang: "pa", districts: ["Basti Jodhewal","Daba","Dugri","Field Ganj","Haibowal","Model Town","Pakhowal Road","Sahnewal"] },
  { value: "amritsar",     label: "Amritsar",         state: "Punjab",             lat: 31.6340, lng: 74.8723, tz: "Asia/Kolkata", lang: "pa", districts: ["Golden Temple","Lawrence Road","Majitha Road","Ranjit Avenue","Sultanwind Road","Tarn Taran","Verka"] },
  { value: "ambala",       label: "Ambala",           state: "Haryana",            lat: 30.3752, lng: 76.7821, tz: "Asia/Kolkata", lang: "hi", districts: ["Ambala Cantonment","Ambala City","Balana","Barara","Naraingarh","Saha","Shahzadpur"] },

  // ── ODISHA ──────────────────────────────────────────
  { value: "bhubaneswar",  label: "Bhubaneswar",      state: "Odisha",             lat: 20.2961, lng: 85.8245, tz: "Asia/Kolkata", lang: "or", districts: ["Acharya Vihar","Chandrasekharpur","Infocity","Jayadev Nagar","Khandagiri","Patia","Pokhariput","Sahid Nagar"] },
  { value: "cuttack",      label: "Cuttack",          state: "Odisha",             lat: 20.4625, lng: 85.8828, tz: "Asia/Kolkata", lang: "or", districts: ["Badambadi","Buxi Bazaar","Chauliaganj","Dolamundai","Khan Nagar","Mangalabag","Naya Sarak"] },

  // ── KERALA ──────────────────────────────────────────
  { value: "thiruvananthapuram", label: "Thiruvananthapuram", state: "Kerala",     lat: 8.5241,  lng: 76.9366, tz: "Asia/Kolkata", lang: "ml", districts: ["Kazhakkoottam","Kesavadasapuram","Kowdiar","Palayam","Poojappura","Poonthura","Sreekaryam","Vattiyoorkavu"] },
  { value: "kochi",        label: "Kochi",            state: "Kerala",             lat: 9.9312,  lng: 76.2673, tz: "Asia/Kolkata", lang: "ml", districts: ["Aluva","Edapally","Ernakulam","Fort Kochi","Infopark","Kalamassery","Kakkanad","Mattancherry","Palarivattom"] },
  { value: "kozhikode",    label: "Kozhikode",        state: "Kerala",             lat: 11.2588, lng: 75.7804, tz: "Asia/Kolkata", lang: "ml", districts: ["Chevayur","Elathur","Feroke","Mavoor Road","Medical College","Puthiyara","Ramanattukara","West Hill"] },

  // ── ASSAM ──────────────────────────────────────────
  { value: "guwahati",     label: "Guwahati",         state: "Assam",              lat: 26.1445, lng: 91.7362, tz: "Asia/Kolkata", lang: "as", districts: ["Ambari","Bhangagarh","Chandmari","Christian Basti","Dispur","Fatashil","Paltan Bazar","Ulubari"] },
  { value: "dibrugarh",    label: "Dibrugarh",        state: "Assam",              lat: 27.4728, lng: 94.9120, tz: "Asia/Kolkata", lang: "as", districts: ["AT Road","Barbari","Barbarua","Chabua","Duliajan","Mancotta","Tollygunge"] },

  // ── JHARKHAND ──────────────────────────────────────────
  { value: "ranchi",       label: "Ranchi",           state: "Jharkhand",          lat: 23.3441, lng: 85.3096, tz: "Asia/Kolkata", lang: "hi", districts: ["Bariatu","Birsa Nagar","Doranda","HEC","Kanke","Lalpur","Morabadi","Ratu Road","Tagore Hill"] },

  // ── CHHATTISGARH ──────────────────────────────────────────
  { value: "raipur",       label: "Raipur",           state: "Chhattisgarh",       lat: 21.2514, lng: 81.6296, tz: "Asia/Kolkata", lang: "hi", districts: ["Avanti Vihar","Devendra Nagar","GE Road","Mowa","New Rajendra Nagar","Old Busstand","Ring Road No. 1","Telibandha"] },

  // ── HIMACHAL PRADESH ──────────────────────────────────────────
  { value: "shimla",       label: "Shimla",           state: "Himachal Pradesh",   lat: 31.1048, lng: 77.1734, tz: "Asia/Kolkata", lang: "hi", districts: ["Boileauganj","Chhota Shimla","Jakhu","Kasumpti","Krishnanagar","Lakkar Bazar","Mall Road","Rampur"] },

  // ── UTTARAKHAND ──────────────────────────────────────────
  { value: "dehradun",     label: "Dehradun",         state: "Uttarakhand",        lat: 30.3165, lng: 78.0322, tz: "Asia/Kolkata", lang: "hi", districts: ["Chakrata Road","Clement Town","Dalanwala","Defence Colony","GMS Road","Raipur","Rajpur Road","Sahastradhara"] },

  // ── GOA ──────────────────────────────────────────
  { value: "panaji",       label: "Panaji",           state: "Goa",                lat: 15.4909, lng: 73.8278, tz: "Asia/Kolkata", lang: "kok", districts: ["Altinho","Campal","Caranzalem","Dona Paula","Miramar","Panaji City","Porvorim","Ribandar","St. Inez"] },
  { value: "margao",       label: "Margao",           state: "Goa",                lat: 15.2793, lng: 73.9574, tz: "Asia/Kolkata", lang: "kok", districts: ["Aquem","Fatorda","Gogol","Monte Hill","Nuvem","Navelim","Raia"] },

  // ── NORTH EAST ──────────────────────────────────────────
  { value: "imphal",       label: "Imphal",           state: "Manipur",            lat: 24.8170, lng: 93.9368, tz: "Asia/Kolkata", lang: "mni", districts: ["Checkon","Khwai","Lamphel","Porompat","Singjamei","Thangmeiband","Wangkhei","Yaiskul"] },
  { value: "shillong",     label: "Shillong",         state: "Meghalaya",          lat: 25.5788, lng: 91.8933, tz: "Asia/Kolkata", lang: "hi", districts: ["Barik","Civil Hospital","Dhankheti","Laban","Laitumkhrah","Mawlai","Nongthymmai","Police Bazar","Rynjah"] },
  { value: "agartala",     label: "Agartala",         state: "Tripura",            lat: 23.8315, lng: 91.2868, tz: "Asia/Kolkata", lang: "bn", districts: ["Amtali","Aralia","Barjala","Battala","College Tilla","Indranagar","Matarbari","Ramnagar"] },

  // ── JAMMU & KASHMIR ──────────────────────────────────────────
  { value: "srinagar",     label: "Srinagar",         state: "J&K (UT)",           lat: 34.0837, lng: 74.7973, tz: "Asia/Kolkata", lang: "ks", districts: ["Batamaloo","Bemina","Buchpora","Dal Lake","Hazratbal","Hyderpora","Lal Chowk","Rajbagh","Shivpora"] },
  { value: "jammu",        label: "Jammu",            state: "J&K (UT)",           lat: 32.7266, lng: 74.8570, tz: "Asia/Kolkata", lang: "hi", districts: ["Bakshi Nagar","Bathindi","Gandhi Nagar","Janipur","Karan Nagar","Nanak Nagar","Raghunath Bazar","Trikuta Nagar"] },
];

// Grouped by state for optgroup display
export const CITIES_BY_STATE = INDIA_CITIES.reduce((acc, city) => {
  if (!acc[city.state]) acc[city.state] = [];
  acc[city.state].push(city);
  return acc;
}, {});

// Get city object by value key
export function getCityByValue(value) {
  return INDIA_CITIES.find(c => c.value === value) || INDIA_CITIES.find(c => c.value === "mumbai");
}

// All unique states
export const ALL_STATES = [...new Set(INDIA_CITIES.map(c => c.state))].sort();

export default INDIA_CITIES;
