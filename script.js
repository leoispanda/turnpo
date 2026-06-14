const ACTIVE_PROFILE_KEY = "turnpo:active-profile";
const THEME_KEY = "turnpo:theme";
const LOCAL_PREFIX = "turnpo:profile:";
const COLLAPSED_YEARS_PREFIX = "turnpo:collapsed-years:";
const COLLAPSED_YEARS_DEFAULT_PREFIX = "turnpo:collapsed-years-default:";
const STATUSES = ["published", "hidden", "deleted"];
const LEGAL_NOTICE_VERSION = "0.2";
const SITE_URL = "https://www.turnpo.com";
const BRAND_ASSETS = {
  logo: `${SITE_URL}/assets/icons/icon-512.png`,
  socialImage: `${SITE_URL}/assets/turnpo-og-image.png`,
  favicon: `${SITE_URL}/assets/icons/favicon-48.png`
};
const HOME_SEO = {
  title: "Turnpo - Life Profiles People Can Truly Understand",
  description: "Turnpo helps people turn life moments into warm, searchable personal profiles that are easy for others and AI tools to understand.",
  image: BRAND_ASSETS.socialImage,
  imageAlt: "Turnpo logo - turning points shaping who you become",
  imageWidth: "1200",
  imageHeight: "630"
};
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const MONTH_ALIASES = MONTH_NAMES.reduce((aliases, month, index) => {
  aliases[month.toLowerCase()] = index + 1;
  aliases[month.slice(0, 3).toLowerCase()] = index + 1;
  return aliases;
}, { sept: 9 });
const MONTH_NAME_PATTERN = Object.keys(MONTH_ALIASES)
  .sort((a, b) => b.length - a.length)
  .join("|");
const CITY_OPTIONS = [
  "Amsterdam",
  "Beijing",
  "Berlin",
  "Brussels",
  "Dublin",
  "Eindhoven",
  "London",
  "Munich",
  "New York",
  "Paris",
  "San Francisco",
  "Shanghai",
  "Shenzhen",
  "Singapore",
  "Taipei",
  "Tokyo",
  "Veldhoven"
];
const TRAVEL_PLACES = [
  { id: "amsterdam", label: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041, type: "city", tokens: ["amsterdam"] },
  { id: "eindhoven", label: "Eindhoven", country: "Netherlands", lat: 51.4416, lng: 5.4697, type: "city", tokens: ["eindhoven", "veldhoven", "north brabant"] },
  { id: "maastricht", label: "Maastricht", country: "Netherlands", lat: 50.8514, lng: 5.691, type: "city", tokens: ["maastricht"] },
  { id: "the-hague", label: "The Hague", country: "Netherlands", lat: 52.0705, lng: 4.3007, type: "city", tokens: ["the hague", "den haag"] },
  { id: "netherlands", label: "Netherlands", country: "Netherlands", lat: 52.1326, lng: 5.2913, type: "country", tokens: ["netherlands", "holland", "dutch"] },
  { id: "shanghai", label: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, type: "city", tokens: ["shanghai", "上海"] },
  { id: "harbin", label: "Harbin", country: "China", lat: 45.8038, lng: 126.5349, type: "city", tokens: ["harbin", "哈尔滨"] },
  { id: "beijing", label: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, type: "city", tokens: ["beijing", "北京"] },
  { id: "shenzhen", label: "Shenzhen", country: "China", lat: 22.5431, lng: 114.0579, type: "city", tokens: ["shenzhen", "深圳"] },
  { id: "chengdu", label: "Chengdu", country: "China", lat: 30.5728, lng: 104.0668, type: "city", tokens: ["chengdu", "成都"] },
  { id: "xian", label: "Xi'an", country: "China", lat: 34.3416, lng: 108.9398, type: "city", tokens: ["xian", "xi'an", "西安"] },
  { id: "hailar", label: "Hailar", country: "China", lat: 49.2116, lng: 119.7658, type: "city", tokens: ["hailar", "海拉尔"] },
  { id: "sanya", label: "Sanya", country: "China", lat: 18.2528, lng: 109.5119, type: "city", tokens: ["sanya", "三亚"] },
  { id: "haikou", label: "Haikou", country: "China", lat: 20.044, lng: 110.1999, type: "city", tokens: ["haikou", "海口"] },
  { id: "wuxi", label: "Wuxi", country: "China", lat: 31.4912, lng: 120.3119, type: "city", tokens: ["wuxi", "无锡"] },
  { id: "hangzhou", label: "Hangzhou", country: "China", lat: 30.2741, lng: 120.1551, type: "city", tokens: ["hangzhou", "杭州"] },
  { id: "suzhou", label: "Suzhou", country: "China", lat: 31.2989, lng: 120.5853, type: "city", tokens: ["suzhou", "苏州"] },
  { id: "dalian", label: "Dalian", country: "China", lat: 38.914, lng: 121.6147, type: "city", tokens: ["dalian", "大连"] },
  { id: "china", label: "China", country: "China", lat: 35.8617, lng: 104.1954, type: "country", tokens: ["china", "中国"] },
  { id: "london", label: "London", country: "United Kingdom", lat: 51.5072, lng: -0.1276, type: "city", tokens: ["london"] },
  { id: "paris", label: "Paris", country: "France", lat: 48.8566, lng: 2.3522, type: "city", tokens: ["paris"] },
  { id: "lyon", label: "Lyon", country: "France", lat: 45.764, lng: 4.8357, type: "city", tokens: ["lyon"] },
  { id: "grenoble", label: "Grenoble", country: "France", lat: 45.1885, lng: 5.7245, type: "city", tokens: ["grenoble"] },
  { id: "berlin", label: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, type: "city", tokens: ["berlin"] },
  { id: "munich", label: "Munich", country: "Germany", lat: 48.1351, lng: 11.582, type: "city", tokens: ["munich"] },
  { id: "dresden", label: "Dresden", country: "Germany", lat: 51.0504, lng: 13.7373, type: "city", tokens: ["dresden"] },
  { id: "dusseldorf", label: "Düsseldorf", country: "Germany", lat: 51.2277, lng: 6.7735, type: "city", tokens: ["dusseldorf", "düsseldorf"] },
  { id: "germany", label: "Germany", country: "Germany", lat: 51.1657, lng: 10.4515, type: "country", tokens: ["germany", "german", "rhine"] },
  { id: "brussels", label: "Brussels", country: "Belgium", lat: 50.8476, lng: 4.3572, type: "city", tokens: ["brussels"] },
  { id: "dublin", label: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603, type: "city", tokens: ["dublin"] },
  { id: "prague", label: "Prague", country: "Czechia", lat: 50.0755, lng: 14.4378, type: "city", tokens: ["prague"] },
  { id: "malaga", label: "Málaga", country: "Spain", lat: 36.7213, lng: -4.4214, type: "city", tokens: ["malaga", "málaga"] },
  { id: "bern", label: "Bern", country: "Switzerland", lat: 46.948, lng: 7.4474, type: "city", tokens: ["bern", "berne"] },
  { id: "geneva", label: "Geneva", country: "Switzerland", lat: 46.2044, lng: 6.1432, type: "city", tokens: ["geneva"] },
  { id: "new-york", label: "New York", country: "United States", lat: 40.7128, lng: -74.006, type: "city", tokens: ["new york", "nyc"] },
  { id: "san-francisco", label: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194, type: "city", tokens: ["san francisco", "bay area"] },
  { id: "bangkok", label: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, type: "city", tokens: ["bangkok"] },
  { id: "phuket", label: "Phuket", country: "Thailand", lat: 7.8804, lng: 98.3923, type: "city", tokens: ["phuket"] },
  { id: "singapore", label: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, type: "city", tokens: ["singapore"] },
  { id: "taipei", label: "Taipei", country: "Taiwan", lat: 25.033, lng: 121.5654, type: "city", tokens: ["taipei", "台北"] },
  { id: "seoul", label: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, type: "city", tokens: ["seoul", "서울"] },
  { id: "jeju", label: "Jeju", country: "South Korea", lat: 33.4996, lng: 126.5312, type: "city", tokens: ["jeju", "jeju island", "제주"] },
  { id: "tokyo", label: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, type: "city", tokens: ["tokyo", "東京", "东京"] }
];
const LIFE_ATLAS_MAJOR_CITY_IDS = new Set(["harbin", "shanghai", "eindhoven", "amsterdam", "maastricht"]);
const LIFE_ATLAS_VISITED_CITY_IDS = new Set([
  "bangkok", "phuket", "taipei", "seoul", "jeju", "malaga", "lyon", "grenoble", "chengdu", "xian", "hailar",
  "sanya", "haikou", "wuxi", "hangzhou", "suzhou", "dalian", "dusseldorf", "the-hague", "bern", "brussels", "geneva"
]);
const LIFE_ATLAS_DEFAULT_CITY_IDS = [...LIFE_ATLAS_MAJOR_CITY_IDS, ...LIFE_ATLAS_VISITED_CITY_IDS];
const LIFE_ATLAS_DEFAULT_CITY_CATEGORIES = new Map([
  ...[...LIFE_ATLAS_MAJOR_CITY_IDS].map((id) => [id, "major"]),
  ...[...LIFE_ATLAS_VISITED_CITY_IDS].map((id) => [id, "visited"])
]);
const LIFE_ATLAS_DEFAULT_PROFILE_USERNAMES = new Set(["leo", "cindy"]);
const LIFE_ATLAS_EARTH_IMAGE = "/assets/life-atlas-earth.jpg";
const LIFE_ATLAS_THREE_URL = "https://unpkg.com/three@0.160.0/build/three.module.js";
const LIFE_ATLAS_EARTH_TEXTURE = "/assets/earth-blue-marble-texture.jpg";
const LIFE_ATLAS_NIGHT_TEXTURE = "/assets/earth-night-lights-texture.png";
const CONTENT_CATEGORY = {
  story: "life",
  work: "work"
};
const CONTENT_TYPE = {
  life: "story",
  work: "work"
};
const CATEGORY_LABELS = {
  all: "All",
  life: "Life",
  work: "Work"
};
const KNOWN_WORK_LINKS = {
  "work-turnpo": "https://www.turnpo.com",
  "work-mapkai": "https://www.mapkai.com",
  "work-mapkai-pdc": "https://www.mapkai.com/pdc",
  "work-dishkai": "https://www.dishkai.com"
};
const PROJECT_WORK_IDS = new Set(Object.keys(KNOWN_WORK_LINKS));

const seedProfiles = {
  leo: {
    id: "profile-leo",
    status: "published",
    seedVersion: "linkedin-export-2026-06-04",
    publicState: {
      hiddenStoryIds: [],
      deletedStoryIds: [],
      hiddenWorkIds: [],
      deletedWorkIds: [],
      collapsedYears: ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2012", "2008"]
    },
    username: "leo",
    displayName: "Leo Yang",
    oneLineIntro: "L&KM Solution Designer @ ASML | Co-creator of MapKAI | Exploring knowledge, systems, and reflection in the AI era",
    currentChapter: "Exploring AI-native knowledge mapping, reflection, learning systems, and practical decision workflows through MapKAI and public experiments.",
    location: "Eindhoven, Netherlands",
    avatar: "/assets/leo-profile.png",
    avatarPositionY: 8,
    links: [
      { label: "Turnpo", url: "https://www.turnpo.com/u/leo" },
      { label: "MapKAI", url: "https://www.mapkai.com" },
      { label: "MapKAI PDC", url: "https://www.mapkai.com/pdc" }
    ],
    values: ["clarity","learning by doing","human agency","reflection","knowledge into performance"],
    themes: ["Artificial Intelligence (AI)","Start-up Leadership","Presentations","Learning","Knowledge Management","International Project Management","Presentation","project","Technical Training","Presentation Skills","Equipment Maintenance","International Project Experience","Technical Learning"],
    lifeStories:     [
          {
                "id": "linkedin-profile-summary",
                "year": "2026",
                "date": "LinkedIn profile",
                "title": "LinkedIn profile summary",
                "location": "Eindhoven, North Brabant, Netherlands",
                "image": "",
                "publicSummary": "I work at the intersection of learning, knowledge, performance, and AI in a high-tech environment.As an L&KM Solution Designer at ASML Academy, I focus on translating complex technical and organizational challenges into scalable learning, knowledge-sharing, a…",
                "fullText": "I work at the intersection of learning, knowledge, performance, and AI in a high-tech environment.As an L&KM Solution Designer at ASML Academy, I focus on translating complex technical and organizational challenges into scalable learning, knowledge-sharing, and capability-building solutions.My work sits between people, systems, and performance: helping experts make knowledge easier to access, easier to understand, and easier to apply in real work.I’m particularly interested in: • how people learn in advanced engineering environments• how organizations turn knowledge into performance• how AI can support learning, reflection, and decision-making• how small design choices create long-term capability impactOutside my formal role, I explore AI-native approaches to knowledge mapping, personal reflection, and decision systems through projects such as MapKAI.Based in Eindhoven.Always happy to exchange ideas on learning, technology, AI, knowledge management, and organizational development.",
                "sourceUrl": "https://www.linkedin.com/in/leo-yang-eindhoven",
                "tags": [
                      "profile",
                      "LinkedIn",
                      "AI"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-skills",
                "year": "2026",
                "date": "LinkedIn skills",
                "title": "LinkedIn skills",
                "location": "",
                "image": "",
                "publicSummary": "Artificial Intelligence (AI), Start-up Leadership, Presentations, Learning, Knowledge Management, International Project Management, Presentation, project, Technical Training, Presentation Skills, Equipment Maintenance, International Project Experience, Technical Learning",
                "fullText": "- Artificial Intelligence (AI)\n- Start-up Leadership\n- Presentations\n- Learning\n- Knowledge Management\n- International Project Management\n- Presentation\n- project\n- Technical Training\n- Presentation Skills\n- Equipment Maintenance\n- International Project Experience\n- Technical Learning",
                "sourceUrl": "https://www.linkedin.com/in/leo-yang-eindhoven",
                "tags": [
                      "skills",
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-position-mapkai-co-creator",
                "year": "2026",
                "date": "May 2026 - Present",
                "title": "Co-creator at MapKAI",
                "location": "Eindhoven",
                "image": "",
                "publicSummary": "MapKAI is an early-stage exploration of knowledge mapping, AI-assisted reflection, and new forms of AI-native governance. Together with Li (Cindy) Xin, I am building MapKAI to explore how AI can help people and small teams move from scattered ideas toward cle…",
                "fullText": "MapKAI is an early-stage exploration of knowledge mapping, AI-assisted reflection, and new forms of AI-native governance. Together with Li (Cindy) Xin, I am building MapKAI to explore how AI can help people and small teams move from scattered ideas toward clearer knowledge structures, better self-understanding, and more intentional decisions. I did not come from a traditional programming background. I only started learning basic Python concepts through Coursera at the beginning of this year. Most of MapKAI has grown from ideas, questions, product thinking, and AI-assisted exploration. For me, this is part of the larger experiment: What becomes possible when people with ideas, curiosity, and domain experience can build and test new directions with the help of AI? We are using MapKAI as a space to explore what company governance, product thinking, and decision-making could look like in the AI era. Current focus areas:  • Knowledge mapping • AI-assisted reflection • AI-native decision systems • Learning path design • Exploration systems • Personal and team thinking structures  MapKAI is not only about finding answers faster. It is about exploring how AI can help us see what we know, how we think, how we decide, and where we may want to go next.  Co-created with Li (Cindy) Xin.",
                "sourceUrl": "https://www.linkedin.com/in/leo-yang-eindhoven",
                "tags": [
                      "MapKAI",
                      "experience"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-position-asml-l-km-solution-designer",
                "year": "2023",
                "date": "Jul 2023 - Present",
                "title": "L&KM Solution Designer at ASML",
                "location": "Eindhoven",
                "image": "",
                "publicSummary": "· XT260 Learning Lead, owning key deliverables. · Led learning deployment across 6 countries and 13 locations. · Enabled 200+ trainees and local trainers. · Led QEW improvement; GTC CIP board member. · Project Lead for Re-use Project and schedule conversion.",
                "fullText": "·         XT260 Learning Lead, owning key deliverables. ·         Led learning deployment across 6 countries and 13 locations. ·         Enabled 200+ trainees and local trainers. ·         Led QEW improvement; GTC CIP board member. ·         Project Lead for Re-use Project and schedule conversion.",
                "sourceUrl": "https://www.linkedin.com/in/leo-yang-eindhoven",
                "tags": [
                      "ASML",
                      "experience"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-position-asml-technical-instructor-developer",
                "year": "2018",
                "date": "Aug 2018 - Jul 2023",
                "title": "Technical Instructor/Developer at ASML",
                "location": "中国 上海",
                "image": "",
                "publicSummary": "• Technical training delivery: 10 different courses, 110 Sessions, more than 500 trainees • Project Management: 4 major projects successfully closed and received 10 “Thankyou” awards for outstanding contributions • Board member: China Service Crane committee…",
                "fullText": "•\tTechnical training delivery: 10 different courses, 110 Sessions, more than 500 trainees •\tProject Management: 4 major projects successfully closed and received 10 “Thankyou” awards for outstanding contributions •\tBoard member: China Service Crane committee •\t2022 China President award",
                "sourceUrl": "https://www.linkedin.com/in/leo-yang-eindhoven",
                "tags": [
                      "ASML",
                      "experience"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-position-lectra-hardware-solution-specialist",
                "year": "2018",
                "date": "May 2018 - Jul 2018",
                "title": "Hardware Solution Specialist at Lectra",
                "location": "上海",
                "image": "",
                "publicSummary": "--Deliver training to customers --Provide hardware solution to customers",
                "fullText": "--Deliver training to customers  --Provide hardware solution to customers",
                "sourceUrl": "https://www.linkedin.com/in/leo-yang-eindhoven",
                "tags": [
                      "Lectra",
                      "experience"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-position-aecc-commercial-aircraft-engine-co-ltd-electrical-engineer",
                "year": "2012",
                "date": "Aug 2012 - Apr 2018",
                "title": "Electrical Engineer at AECC COMMERCIAL AIRCRAFT ENGINE CO., LTD",
                "location": "Harbin, Heilongjiang, China",
                "image": "",
                "publicSummary": "• Successfully completed multiple international equipment move-in projects • Equipment installation, commissioning, and maintenance • Transferred external technical training into internal programs",
                "fullText": "•\tSuccessfully completed multiple international equipment move-in projects •\tEquipment installation, commissioning, and maintenance •\tTransferred external technical training into internal programs",
                "sourceUrl": "https://www.linkedin.com/in/leo-yang-eindhoven",
                "tags": [
                      "AECC COMMERCIAL AIRCRAFT ENGINE CO., LTD",
                      "experience"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-education-yanshan-university",
                "year": "2008",
                "date": "2008 - 2012",
                "title": "Bachelor’s Degree at Yanshan University",
                "location": "",
                "image": "",
                "publicSummary": "Outstanding Graduate",
                "fullText": "Outstanding Graduate",
                "sourceUrl": "https://www.linkedin.com/in/leo-yang-eindhoven",
                "tags": [
                      "education",
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2026-05-25-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a74647675737258",
                "year": "2026",
                "date": "May 2026",
                "title": "Many people are curious about AI agents right now",
                "location": "",
                "image": "",
                "publicSummary": "https://www.mapkai.com/pdc Many people are curious about AI agents right now. Not only what they can do, but how they reason, interact, challenge each other, and support better thinking. As one of the people building Ma…",
                "fullText": "https://www.mapkai.com/pdc\nMany people are curious about AI agents right now.\nNot only what they can do, but how they reason, interact, challenge each other, and support better thinking.\nAs one of the people building MapKAI, I wanted to share a more personal note.\nRecently, many of our friends have asked us about AI agents and what it feels like to actually work with them. That is one of the reasons why we felt it was important to open the PDC demo to more people.\n\nYou can simply experience how a structured council discussion works.\nBecause the real experience requires large language model compute, we are currently keeping access limited for cost reasons. If you would like to try it, please reach out to us for an access code.\n\nBehind this demo, we designed an interaction flow that first opens up the thinking, then challenges different perspectives, gradually narrows the discussion, and finally produces a clear summary.\nWhat I personally find most interesting is how the 9 partners interact with one another. Even a small question can become surprisingly fun and insightful when different perspectives start to challenge, support, and refine each other.\nFor this demo, we chose a topic that many teams will recognize:\n\n“Should a team move fast with small experiments to learn quickly, or slow down and plan more carefully to avoid costly mistakes?”\n\nI hope you will enjoy exploring it — and maybe also get a better feeling for how AI agents can work as thinking partners, not just as a single-answer tool.",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7464767573725835264",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2026-05-16-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a74614852660300",
                "year": "2026",
                "date": "May 2026",
                "title": "www.mapkai.com Together with my co-creator Li (Cindy) Xin, we started MapKAI as our first AI project try-out",
                "location": "",
                "image": "",
                "publicSummary": "www.mapkai.com Together with my co-creator Li (Cindy) Xin, we started MapKAI as our first AI project try-out. With limited time and resources, we wanted to explore what is possible when ideas, learning, marketing, and A…",
                "fullText": "www.mapkai.com\nTogether with my co-creator Li (Cindy) Xin, we started MapKAI  as our first AI project try-out.\nWith limited time and resources, we wanted to explore what is possible when ideas, learning, marketing, and AI come together.\nIn a very short time, Cindy helped make the project’s message clearer, sharper, and much more effective.\nIt is a real privilege to have a senior marketing professional by my side, helping shape the story, the message, and the direction of this project.\nMapKAI is still early, but this experiment has already shown us something important:\nAI can help us move faster, but good direction still comes from clear thinking, honest feedback, and people who believe in the vision.\n\nMapKAI #AI #VibeCoding #GenerativeAI #KnowledgeManagement #LearningInnovation #FutureOfLearning Li (Cindy) Xin",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7461485266030034944",
                "tags": [
                      "AI",
                      "VibeCoding",
                      "GenerativeAI"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2026-05-14-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7460766622472052",
                "year": "2026",
                "date": "May 2026",
                "title": "➡️ www.mapkai",
                "location": "",
                "image": "",
                "publicSummary": "➡️ www.mapkai.com I honestly didn’t expect to feel slightly uncomfortable reading reflections generated by a website that Li (Cindy) Xin and I built together. What started as a knowledge exploration project slowly becam…",
                "fullText": "➡️ www.mapkai.com\nI honestly didn’t expect to feel slightly uncomfortable reading reflections generated by a website that Li (Cindy) Xin and I built together.\nWhat started as a knowledge exploration project slowly became something else: a tool for observing thinking patterns, blind spots, and recurring behaviors.\nThe strange part is:  the reflections are usually not dramatic.\nThey just quietly describe patterns that already existed somewhere in the background. And somehow, that feels more unsettling.\nStill very early. But I’d genuinely love more people to try it and tell me what they feel after using it.\n\nMapKAI #coding #ai #reflection #learning #knowledge Li (Cindy) Xin #vibecoding #MapyourKnowledgewithAI #agent #LLM #lifelonglearning",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7460766622472052736",
                "tags": [
                      "coding",
                      "ai",
                      "reflection"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2025-12-11-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7404947212792713",
                "year": "2025",
                "date": "December 2025",
                "title": "Life experience +1",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2025-12-11-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7404947212792713.jpg",
                "publicSummary": "Life experience +1! 🏅 Yesterday, I had the chance to stand on the stage in our studio and present the achievements and success. As the moment approached, nervousness turned into energy, and I truly enjoyed every second…",
                "fullText": "Life experience +1! 🏅\nYesterday, I had the chance to stand on the stage in our studio and present the achievements and success. As the moment approached, nervousness turned into energy, and I truly enjoyed every second of it.\nI feel so lucky to always have great colleagues and leaders who support, encourage, and guide me.\nWishing everyone a wonderful Sinterklaas, Christmas, and New Year holiday.\nLet’s keep moving together in 2026! 🌞🌞🌞 ⛱️\n#lifeexperence #careerachievement #personalgrowth #2025 #2026",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7404947212792713219",
                "tags": [
                      "lifeexperence",
                      "careerachievement",
                      "personalgrowth"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2025-11-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7396096287131209",
                "year": "2025",
                "date": "November 2025",
                "title": "People from different ages and backgrounds see happiness in different ways",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2025-11-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7396096287131209.jpg",
                "publicSummary": "People from different ages and backgrounds see happiness in different ways. It’s important to know what happiness means to you, and what others expect from you. I learned this at #TedxEindhoven. I also saw how hidden bi…",
                "fullText": "People from different ages and backgrounds see happiness in different ways. It’s important to know what happiness means to you, and what others expect from you. I learned this at #TedxEindhoven. I also saw how hidden biases affect us and why we should notice and stop them. It was a great experience!",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7396096287131209728",
                "tags": [
                      "TedxEindhoven"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2025-10-12-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7383080744035962",
                "year": "2025",
                "date": "October 2025",
                "title": "I did it! I improved my 2025 ASML quarter marathon time by 10 minutes compared to 2024",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2025-10-12-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7383080744035962.jpg",
                "publicSummary": "I did it! I improved my 2025 ASML quarter marathon time by 10 minutes compared to 2024. Training made the race easier, and I’m excited for next year!ASML #ASMLMarathonEindhoven",
                "fullText": "I did it!\nI improved my 2025 ASML quarter marathon time by 10 minutes compared to 2024. Training made the race easier, and I’m excited for next year!ASML #ASMLMarathonEindhoven",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7383080744035962880",
                "tags": [
                      "ASMLMarathonEindhoven"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2025-10-07-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7381261947993817",
                "year": "2025",
                "date": "October 2025",
                "title": "It was a great honor to be invited on stage for a podcast to share my work and life experiences",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2025-10-07-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7381261947993817.jpg",
                "publicSummary": "It was a great honor to be invited on stage for a podcast to share my work and life experiences. Before the video recording, I felt a bit nervous and apprehensive, but everything went smoothly and I truly enjoyed the co…",
                "fullText": "It was a great honor to be invited on stage for a podcast to share my work and life experiences.\nBefore the video recording, I felt a bit nervous and apprehensive, but everything went smoothly and I truly enjoyed the conversation.\nLooking forward to seeing the final podcast soon!",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7381261947993817088",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-12-15-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a72740217971199",
                "year": "2024",
                "date": "December 2024",
                "title": "Recently I completed a 3 month drawing course and felt very satisfied with the experience",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-12-15-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a72740217971199.jpg",
                "publicSummary": "Recently I completed a 3 month drawing course and felt very satisfied with the experience. The most wonderful moment in my life comes from continuously breaking existing boundaries and making new progress. Looking forwa…",
                "fullText": "Recently I completed a 3 month drawing course and felt very satisfied with the experience. The most wonderful moment in my life comes from continuously breaking existing boundaries and making new progress.\nLooking forward to the 2025, wishing new challenges would come and keep improving to be a better myself.",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7274021797119905792",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-11-18-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a72643594358949",
                "year": "2024",
                "date": "November 2024",
                "title": "Imagine a skateboard shoe striking a hammer, making a football roll to hit a book clip in the next group’s setup",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-11-18-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a72643594358949.jpg",
                "publicSummary": "Imagine a skateboard shoe striking a hammer, making a football roll to hit a book clip in the next group’s setup. That’s exactly what we did today in a Rube Goldberg machine challenge at the ASML Academy team event, usi…",
                "fullText": "Imagine a skateboard shoe striking a hammer, making a football roll to hit a book clip in the next group’s setup. That’s exactly what we did today in a Rube Goldberg machine challenge at the ASML Academy team event, using only recycled materials.\n\nThis was my life first time ever participating in something like this, and it was an unforgettable experience. The random team assignments made it easy to connect with people from other colleges I don’t usually work with. Our team of four brainstormed, divided tasks, and brought our ideas together to make the chain reaction work.\n\nWhat amazed me most was how people from such diverse backgrounds—whether technical, non-technical, people development, or project management—approached the challenge in their own unique way. Each person brought something special to the table, and together we created something both creative and functional.\n\nThis experience reminded me of the power of collaboration and creativity, and I can’t wait for more opportunities to work with others, learn,create something new, and make impact together!!\n#ASML #academy #teamwork #rubegoldbergmachine #innovation #creativity #firsttime",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7264359435894976515",
                "tags": [
                      "ASML",
                      "academy",
                      "teamwork"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-11-07-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7260394722353983",
                "year": "2024",
                "date": "November 2024",
                "title": "🎓 Today, I had the honor of celebrating the graduation event for the PM Foundation Training",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-11-07-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7260394722353983.jpg",
                "publicSummary": "🎓 Today, I had the honor of celebrating the graduation event for the PM Foundation Training! It was an unforgettable moment, made even more special by the presence of my manager, whose support truly inspired and encour…",
                "fullText": "🎓 Today, I had the honor of celebrating the graduation event for the PM Foundation Training! It was an unforgettable moment, made even more special by the presence of my manager, whose support truly inspired and encouraged me.\n\nIt was also a wonderful chance to reconnect with my classmates after three months apart. Seeing how each of us is applying our skills in our own roles was both inspiring and motivating.\n\nI’m excited to carry these skills forward and continue growing with my team. Here’s to new challenges ahead! 🌟\n#ASML #projectmanagement #academy #graduation",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7260394722353983488",
                "tags": [
                      "ASML",
                      "projectmanagement",
                      "academy"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-10-13-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7251179098029330",
                "year": "2024",
                "date": "October 2024",
                "title": "I completed my first quarter marathon at the 2024 ASML Marathon Eindhoven",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-10-13-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7251179098029330.jpg",
                "publicSummary": "I completed my first quarter marathon at the 2024 ASML Marathon Eindhoven! By studying the theory to manage my heart rate and pace, I was able to finish comfortably. While my speed wasn’t the fastest, I still achieved a…",
                "fullText": "I completed my first quarter marathon at the 2024 ASML Marathon Eindhoven!\nBy studying the theory to manage my heart rate and pace, I was able to finish comfortably.\nWhile my speed wasn’t the fastest, I still achieved a personal best. I’m embracing every challenge with positivity and determination—next time, I’ll aim to run even better! It’s all about the process and persistence, and I’m excited for the next race to push my limits even further!",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7251179098029330433",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-10-11-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7250476091092398",
                "year": "2024",
                "date": "October 2024",
                "title": "The ASML Global Training Center in Shanghai has finally opened a new position",
                "location": "",
                "image": "",
                "publicSummary": "The ASML Global Training Center in Shanghai has finally opened a new position! The team offers an incredible atmosphere, with a strong emphasis on mutual support, personal growth, and development. If you’re looking to j…",
                "fullText": "The ASML Global Training Center in Shanghai has finally opened a new position!\nThe team offers an incredible atmosphere, with a strong emphasis on mutual support, personal growth, and development.\nIf you’re looking to join a dynamic and supportive team, don’t miss this opportunity!",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7250476091092398080",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-09-19-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7242564041519304",
                "year": "2024",
                "date": "September 2024",
                "title": "Just back from a business trip to Dublin, Ireland, I’ve gained a deeper appreciation for this vibran",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-09-19-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7242564041519304.jpg",
                "publicSummary": "Just back from a business trip to Dublin, Ireland, I’ve gained a deeper appreciation for this vibrant, friendly, and peaceful city. The people here seem to embrace life with warmth and positivity, as if each day flows b…",
                "fullText": "Just back from a business trip to Dublin, Ireland, I’ve gained a deeper appreciation for this vibrant, friendly, and peaceful city. The people here seem to embrace life with warmth and positivity, as if each day flows by with a smile.\n\nASML has a presence all around the world, bringing together passionate, intelligent, and creative individuals. It’s these people who shape the company, and I’m grateful to ASML for fostering such an incredible team.\n\nRecently, I’ve gained new insight into driving results. It’s important to stay focused on the goal and not get too caught up in the challenges and obstacles along the way. There are always solutions, and when you look back after achieving success, many of those difficulties will turn into some of the most memorable and valuable experiences.\n\nKeep pushing forward! I’m energized and excited to return to Eindhoven, ready to bring even more value to the team.",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7242564041519304705",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-09-14-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7240732554654289",
                "year": "2024",
                "date": "September 2024",
                "title": "My first-ever experience with drawing left me with many thoughts: Learning anything is a process of",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-09-14-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7240732554654289.jpg",
                "publicSummary": "My first-ever experience with drawing left me with many thoughts: Learning anything is a process of going from not knowing to knowing, and that process itself is the essence of learning. A good teacher can make this jou…",
                "fullText": "My first-ever experience with drawing left me with many thoughts:\nLearning anything is a process of going from not knowing to knowing, and that process itself is the essence of learning.\nA good teacher can make this journey smoother, clearer, and faster, helping students reach their desired level more quickly and efficiently. #learning #drawing #lifetime",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7240732554654289921",
                "tags": [
                      "learning",
                      "drawing",
                      "lifetime"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-08-25-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a72335196372026",
                "year": "2024",
                "date": "August 2024",
                "title": "My wife, whom I deeply admire, is about to return to campus to pursue a master’s degree in Business",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-08-25-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a72335196372026.jpg",
                "publicSummary": "My wife, whom I deeply admire, is about to return to campus to pursue a master’s degree in Business Management at the University of Amsterdam. With over ten years of experience in communications and marketing at multina…",
                "fullText": "My wife, whom I deeply admire, is about to return to campus to pursue a master’s degree in Business Management at the University of Amsterdam.\nWith over ten years of experience in communications and marketing at multinational companies in Europe and the U.S., she made the difficult decision to move to the Netherlands with me, even if it meant sacrificing some career growth.\nDespite the challenges, she remains unwavering in her belief that ‘every problem has a solution’ and continues to move forward with courage.\nHer decision has greatly inspired me and motivated me to keep learning and growing in my own career. I also plan to learn from her theoretical knowledge, combining it with my practical experience to further enhance my professional skills. Together, through our shared learning and experiences, we will continue to grow and broaden our horizons.",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7233519637202677760",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-08-21-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a72319856747472",
                "year": "2024",
                "date": "August 2024",
                "title": "Dresden is a city full of energy and creative minds",
                "location": "",
                "image": "",
                "publicSummary": "Dresden is a city full of energy and creative minds. I love this city and hope the semiconductor industry continues to thrive and grow stronger here.",
                "fullText": "Dresden is a city full of energy and creative minds. I love this city and hope the semiconductor industry continues to thrive and grow stronger here.",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7231985674747277312",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-07-30-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7224157728368173",
                "year": "2024",
                "date": "July 2024",
                "title": "Embedding Project Management Skills into Daily Life: A Case Study of Buying and Renovating an Apartm",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-07-30-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7224157728368173.jpg",
                "publicSummary": "Embedding Project Management Skills into Daily Life: A Case Study of Buying and Renovating an Apartment Project Background Between April and July 2024, I bought an apartment and managed its renovation, applying project…",
                "fullText": "Embedding Project Management Skills into Daily Life: A Case Study of Buying and Renovating an Apartment\n\nProject Background\nBetween April and July 2024, I bought an apartment and managed its renovation, applying project management skills to everyday tasks. Below is a summary of the key steps and the integration of these techniques.\n\nKey Steps\n\n1. Viewing Properties and Deciding to Buy\n   - April 14: Returned from Prague and arranged viewings for 7 properties.\n   - April 15: Viewed the first property.\n   - April 18: Decided to proceed and contacted the seller’s agent.\n   - April 19: Agreed on the offer terms.\n\n2. Preparing and Submitting Purchase Offer\n   - April 20: Drafted and finalized the offer.\n   - April 22: Signed the offer.\n\n3. Financing and Mortgage Arrangements\n   - April 24: Consulted with a mortgage advisor.\n   - April 27-29: Purchased furniture and measured the apartment.\n   - April 30: Submitted the valuation report for mortgage.\n   - May 1: Submitted additional documents and confirmed services.\n   - May 2: Mortgage approved.\n   - May 3: Finalized the mortgage.\n\n4. Signing Contracts and Arranging Utilities\n   - May 4: Selected an energy provider.\n   - May 16: Completed the property transfer.\n\n5. Renovation and Decoration\n   - May 18: Started renovation.\n   - May 28: Completed painting and flooring.\n   - May 30: Moved in.\n   - July 31: Finished all renovations and furniture installation.\n\nProject Management practices\n\n1. Project Planning\n   - Needs Analysis: Defined location, budget, and property requirements.\n   - Scheduling: Planned viewings and tasks efficiently.\n\n2. Effective Communication and Stakeholder Management\n   - Communication: Coordinated with the real estate agent, mortgage advisor, and suppliers.\n   - Verification: Ensured timely confirmation of details.\n\n3. Progress Control\n   - Milestones: Monitored key milestones and adjusted plans as needed.\n\n4. Risk Management\n   - Assessment: Identified risks and developed strategies.\n   - Mortgage Control: Managed risks with professional advice.\n   - Renovation Management: Oversaw tasks to ensure quality and adherence to deadlines.\n\n5. Quality Control\n   - Management: Personally handled renovation to ensure standards.\n   - Adjustments: Made improvements based on feedback.\n\n6. Financial Management\n   - Budget: Created and managed a detailed budget.\n   - Cost Optimization: Compared quotes to select cost-effective options.\n\nSummary\nThe process of buying and renovating an apartment demonstrated how project management skills can be applied to everyday tasks. Through careful planning, effective communication, and problem-solving, I successfully navigated the complexities of the project. This experience enhanced my skills and showed how these techniques lead to successful outcomes in daily life.",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7224157728368173056",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-06-11-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7206367710522343",
                "year": "2024",
                "date": "June 2024",
                "title": "Today marked the end of a two-day training session at Koningshof",
                "location": "",
                "image": "",
                "publicSummary": "Today marked the end of a two-day training session at Koningshof. Unlike my previous experiences with technical training, this session focused more on non-technical aspects. The interactive activities and tasks made the…",
                "fullText": "Today marked the end of a two-day training session at Koningshof. Unlike my previous experiences with technical training, this session focused more on non-technical aspects. The interactive activities and tasks made the learning experience enjoyable and I acquired many practical skills.\n\nSpecifically, I learned about effective communication, team collaboration, and time management, risk management. The training included various interactive formats such as group discussions, role-playing, and case studies, making the learning process engaging and dynamic.\n\nOne of the most surprising and uplifting moments came at the end of the course with a gratitude circle. We formed a circle and each person could only thank one individual. I was honored to receive gratitude from two people, which deeply encouraged and inspired me. This experience emphasized the importance of maintaining a positive, proactive, and supportive attitude in my future work.\n\nThis training made me realize the importance of integrating more interactive elements into technical training. This approach not only stimulates participants' interest but also enhances their engagement and learning outcomes. Moving forward, I plan to use more interactive elements in my technical training sessions, such as practical project exercises and team-based tasks, to improve participants' hands-on skills.\n\nAdditionally, I had the opportunity to meet a diverse group of talented individuals. Interacting with them deepened my appreciation for the importance of teamwork. Everyone brought unique perspectives and experiences to the table, and through collaboration, we learned from each other's strengths.\n\nThis course has been incredibly inspiring and has highlighted the significance of incorporating more interactive environments into technical training. I look forward to applying these insights in my future work. Moreover, I aim to continuously improve my training methods and enhance their effectiveness by implementing the valuable lessons I learned during this session.",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7206367710522343424",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-05-10-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7194633124830498",
                "year": "2024",
                "date": "May 2024",
                "title": "This week, I participated in a two-day offsite training at Koningshof focusing on PM foundation",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-05-10-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7194633124830498.jpg",
                "publicSummary": "This week, I participated in a two-day offsite training at Koningshof focusing on PM foundation. Unlike previous technical trainings, this one explored non-technical aspects. I had the privilege of meeting over a dozen…",
                "fullText": "This week, I participated in a two-day offsite training at Koningshof focusing on PM foundation. Unlike previous technical trainings, this one explored non-technical aspects. I had the privilege of meeting over a dozen fascinating and experienced ASML project-related individuals, immersing myself in their enthusiastic atmosphere and witnessing their commitment to continuous improvement and exploration. Collaborating with my group, I acquired numerous useful tips and techniques, eagerly looking forward to our next encounter.",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7194633124830498818",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-04-25-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7189133287779414",
                "year": "2024",
                "date": "April 2024",
                "title": "Time flies, it's an unforgettable experience to have the chance learning from Peter and Christophe",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-04-25-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7189133287779414.jpg",
                "publicSummary": "Time flies, it's an unforgettable experience to have the chance learning from Peter and Christophe. Peter's remarkable insights into the semiconductor industry and Christophe's positive, proactive energy left a lasting…",
                "fullText": "Time flies, it's an unforgettable experience to have the chance learning from Peter and Christophe.\nPeter's remarkable insights into the semiconductor industry and Christophe's positive, proactive energy left a lasting impression.\nNow, bidding farewell to Peter and Martin and welcoming Christophe as the new CEO of such a outstanding company, ASML.\nI have full confidence that he will continue to lead ASML to new heights and achieve extraordinary milestones.\n#ASML #Eindhoven #semiconductor",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7189133287779414017",
                "tags": [
                      "ASML",
                      "Eindhoven",
                      "semiconductor"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-03-29-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a71795098069431",
                "year": "2024",
                "date": "March 2024",
                "title": "While traveling with my wife Cindy Xin on the public holiday of Good Friday, we luckily met Dutch Pr",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-03-29-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a71795098069431.jpg",
                "publicSummary": "While traveling with my wife Cindy Xin on the public holiday of Good Friday, we luckily met Dutch Prime Minister Mark Rutte in the street, who had just returned from China. #Netherlands",
                "fullText": "While traveling with my wife Cindy Xin  on the public holiday of Good Friday, we luckily met Dutch Prime Minister Mark Rutte in the street, who had just returned from China. #Netherlands",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7179509806943105024",
                "tags": [
                      "Netherlands"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-03-16-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a71748271423613",
                "year": "2024",
                "date": "March 2024",
                "title": "Just landed in Amsterdam from an intensive business trip, which resulted in a lot of unforgettable memories",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2024-03-16-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a71748271423613.jpg",
                "publicSummary": "Just landed in Amsterdam from an intensive business trip, which resulted in a lot of unforgettable memories. 28 days, 8 cities, 30,000 kilometers, 11 sessions, met 100+ super smart, passionate, and proactive individuals…",
                "fullText": "Just landed in Amsterdam from an intensive business trip, which resulted in a lot of unforgettable memories.\n\n28 days, 8 cities, 30,000 kilometers, 11 sessions, met 100+ super smart, passionate, and proactive individuals.\n\nIt's a great success for me to have managed such a unique and complex journey on short notice.\n\nAt ASML, we never stop investing in our people. We train to empower the future and make impact together.\n#ASML #ASMLacademy #learning",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7174827142361317378",
                "tags": [
                      "ASML",
                      "ASMLacademy",
                      "learning"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2024-02-02-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a71591077840583",
                "year": "2024",
                "date": "February 2024",
                "title": "We change the world one nanometer at a time",
                "location": "",
                "image": "",
                "publicSummary": "We change the world one nanometer at a time",
                "fullText": "We change the world one nanometer at a time",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7159107784058310656",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2023-07-03-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7081531068587147",
                "year": "2023",
                "date": "July 2023",
                "title": "Let's collaborate together in ASML academy and make impact together",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2023-07-03-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7081531068587147.jpg",
                "publicSummary": "Let's collaborate together in ASML academy and make impact together. We train to empower the future! #ASML",
                "fullText": "Let's collaborate together in ASML academy and make impact together. We train to empower the future! #ASML",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7081531068587147264",
                "tags": [
                      "ASML"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2023-04-01-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7047959977218428",
                "year": "2023",
                "date": "April 2023",
                "title": "New skill to be developed",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2023-04-01-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7047959977218428.jpg",
                "publicSummary": "New skill to be developed. First task completed: Take a picture for my desktop. #Shanghai #photography #travel",
                "fullText": "New skill to be developed.\nFirst task completed: Take a picture for my desktop. #Shanghai #photography #travel",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7047959977218428928",
                "tags": [
                      "Shanghai",
                      "photography",
                      "travel"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2023-03-30-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7047090537333469",
                "year": "2023",
                "date": "March 2023",
                "title": "LinkedIn share",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2023-03-30-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7047087745655074.jpg",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7047090537333469184",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7047090537333469184",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2023-03-30-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7047087745655074",
                "year": "2023",
                "date": "March 2023",
                "title": "Great to meet our CEO Peter in training center",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2023-03-30-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7047087745655074.jpg",
                "publicSummary": "Great to meet our CEO Peter in training center. #ASML #TCCN",
                "fullText": "Great to meet our CEO Peter in training center.  #ASML #TCCN",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7047087745655074816",
                "tags": [
                      "ASML",
                      "TCCN"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2023-03-10-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7039944213647511",
                "year": "2023",
                "date": "March 2023",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7039944213647511553",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7039944213647511553",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2023-02-17-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a70322884599689",
                "year": "2023",
                "date": "February 2023",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7032288459968970752",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7032288459968970752",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2023-01-12-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7019169923843203",
                "year": "2023",
                "date": "January 2023",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7019169923843203072",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7019169923843203072",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2023-01-05-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7016608752208408",
                "year": "2023",
                "date": "January 2023",
                "title": "Beautiful winter in Harbin",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2023-01-05-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7016608752208408.jpg",
                "publicSummary": "Beautiful winter in Harbin. Be careful when driving on the snow. #Harbin ice and Snow festival",
                "fullText": "Beautiful winter in Harbin. Be careful when driving on the snow.\n\n#Harbin ice and Snow festival",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7016608752208408577",
                "tags": [
                      "Harbin"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-12-29-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7014219619104174",
                "year": "2022",
                "date": "December 2022",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7014219619104174080",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7014219619104174080",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-12-18-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7010137158271320",
                "year": "2022",
                "date": "December 2022",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7010137158271320064",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7010137158271320064",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-12-09-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7006882314269986",
                "year": "2022",
                "date": "December 2022",
                "title": "Really excited to meet new friends in TCCN",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2022-12-09-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7006882314269986.jpg",
                "publicSummary": "Really excited to meet new friends in TCCN. Irfan Ali #TCCN",
                "fullText": "Really excited to meet new friends in TCCN.  Irfan Ali #TCCN",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7006882314269986816",
                "tags": [
                      "TCCN"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-11-08-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6995767154457391",
                "year": "2022",
                "date": "November 2022",
                "title": "ASML is really a great place to collaborate with each other, we care each other and respect everyone in the team",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2022-11-08-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6995767154457391.jpg",
                "publicSummary": "ASML is really a great place to collaborate with each other, we care each other and respect everyone in the team. #respect #team #ASML #TCCN",
                "fullText": "ASML is really a great place to collaborate with each other, we care each other and respect everyone in the team. #respect  #team #ASML #TCCN",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6995767154457391106",
                "tags": [
                      "respect",
                      "team",
                      "ASML"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-10-28-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6991783132324622",
                "year": "2022",
                "date": "October 2022",
                "title": "Work hard, play hard",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2022-10-28-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6991783132324622.jpg",
                "publicSummary": "Work hard, play hard. It's great to meet such interesting people at ASML. #ASML",
                "fullText": "Work hard, play hard. It's great to meet such interesting people at ASML. #ASML",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6991783132324622336",
                "tags": [
                      "ASML"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-09-03-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6971820889805910",
                "year": "2022",
                "date": "September 2022",
                "title": "we are hiring",
                "location": "",
                "image": "",
                "publicSummary": "we are hiring #hiring",
                "fullText": "we are hiring #hiring",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6971820889805910016",
                "tags": [
                      "hiring"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-06-28-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6947402368577634",
                "year": "2022",
                "date": "June 2022",
                "title": "We are hiring, welcome to our team, great people and great atmosphere",
                "location": "",
                "image": "",
                "publicSummary": "We are hiring, welcome to our team, great people and great atmosphere! You will enjoy your time in Shanghai with delicious food and great view. #hiring #job #people #job If you are passionate to pursue learning and know…",
                "fullText": "We are hiring, welcome to our team, great people and great atmosphere!\n\nYou will enjoy your time in Shanghai with delicious food and great view.\n #hiring #job #people #job\n\nIf you are passionate to pursue learning and knowledge management career in the technical field, ASML Global Training Center can be an ideal platform for you to shine. Check out this position on ASML job board.\n\nCheck out this job at ASML: https://lnkd.in/eCEyJVzc",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6947402368577634304",
                "tags": [
                      "hiring",
                      "job",
                      "people"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-03-09-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a69073221027775",
                "year": "2022",
                "date": "March 2022",
                "title": "Embrace the challenge",
                "location": "",
                "image": "",
                "publicSummary": "Embrace the challenge!",
                "fullText": "Embrace the challenge!",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A6907322102777552896",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-02-06-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6895975403115159",
                "year": "2022",
                "date": "February 2022",
                "title": "I'll share this with",
                "location": "",
                "image": "",
                "publicSummary": "I'll share this with",
                "fullText": "I'll share this with",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6895975403115159553",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-01-19-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6889441772087472",
                "year": "2022",
                "date": "January 2022",
                "title": "Join us. TCCN is a great team, let's work together and explore the world",
                "location": "",
                "image": "",
                "publicSummary": "Join us. TCCN is a great team, let's work together and explore the world! Check out this job at ASML: https://lnkd.in/gXjtUen8",
                "fullText": "Join us.\nTCCN is a great team, let's work together and explore the world!\n\nCheck out this job at ASML: https://lnkd.in/gXjtUen8",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6889441772087472128",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2022-01-12-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6886853069347401",
                "year": "2022",
                "date": "January 2022",
                "title": "Great experience to work in TCCN",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2022-01-12-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6886853069347401.jpg",
                "publicSummary": "Great experience to work in TCCN! Happy new year , let's embrace the future!",
                "fullText": "Great experience to work in TCCN!\nHappy new year , let's embrace the future!",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6886853069347401728",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-12-20-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6878508783551819",
                "year": "2021",
                "date": "December 2021",
                "title": "join us",
                "location": "",
                "image": "",
                "publicSummary": "join us",
                "fullText": "join us",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6878508783551819776",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-12-20-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6878507718798393",
                "year": "2021",
                "date": "December 2021",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6878507718798393344",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6878507718798393344",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-12-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6877438313553383",
                "year": "2021",
                "date": "December 2021",
                "title": "Explaining what we do at ASML is not always easy, but our colleagues are always up for a challenge",
                "location": "",
                "image": "",
                "publicSummary": "Explaining what we do at ASML is not always easy, but our colleagues are always up for a challenge. In this video you’ll hear what you should know about us. Discover more at https://lnkd.in/gf8mK2Ed #lifeatasml #BePartO…",
                "fullText": "Explaining what we do at ASML is not always easy, but our colleagues are always up for a challenge. In this video you’ll hear what you should know about us.\n\nDiscover more at https://lnkd.in/gf8mK2Ed\n\n#lifeatasml #BePartOfProgress",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877438313553383424",
                "tags": [
                      "lifeatasml",
                      "BePartOfProgress"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-12-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6877438076961079",
                "year": "2021",
                "date": "December 2021",
                "title": "LinkedIn update",
                "location": "",
                "image": "",
                "publicSummary": "https://www.asml.com/en/careers/find-your-job/3/2/7/bdm-req32799?ppc",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877438076961079296",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-12-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6877437677596221",
                "year": "2021",
                "date": "December 2021",
                "title": "High-powered lasers, extreme ultraviolet light and temperatures hotter than the sun",
                "location": "",
                "image": "",
                "publicSummary": "High-powered lasers, extreme ultraviolet light and temperatures hotter than the sun? All in a day’s work here at ASML. Discover what’s that like at https://lnkd.in/gnwpqBHz #lifeatasml #BePartOfProgress",
                "fullText": "High-powered lasers, extreme ultraviolet light and temperatures hotter than the sun? All in a day’s work here at ASML. Discover what’s that like at https://lnkd.in/gnwpqBHz\n\n#lifeatasml #BePartOfProgress",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877437677596221440",
                "tags": [
                      "lifeatasml",
                      "BePartOfProgress"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-12-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6877437415779373",
                "year": "2021",
                "date": "December 2021",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877437415779373056",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877437415779373056",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-12-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6877436539555737",
                "year": "2021",
                "date": "December 2021",
                "title": "Van Gogh’s story is one of ambition, perseverance and trusting yourself in the face of criticism",
                "location": "",
                "image": "",
                "publicSummary": "Van Gogh’s story is one of ambition, perseverance and trusting yourself in the face of criticism. It’s a story we recognize at ASML – not giving up, embracing challenges and being confident in our own abilities. Want to…",
                "fullText": "Van Gogh’s story is one of ambition, perseverance and trusting yourself in the face of criticism. It’s a story we recognize at ASML – not giving up, embracing challenges and being confident in our own abilities.\n\nWant to be part of a team that’s driven to succeed? Discover more https://lnkd.in/gnwpqBHz\n\n#lifeatasml #BePartOfProgress",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877436539555737601",
                "tags": [
                      "lifeatasml",
                      "BePartOfProgress"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-12-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6877436291093557",
                "year": "2021",
                "date": "December 2021",
                "title": "Want to know something pretty cool",
                "location": "",
                "image": "",
                "publicSummary": "Want to know something pretty cool? I have over 29,999 colleagues around the world! In this article three of my colleagues – Han-Jun, Burcu and Oksana – share what it’s like to be part of ASML right now. (hint: it’s pre…",
                "fullText": "Want to know something pretty cool? I have over 29,999 colleagues around the world! In this article three of my colleagues – Han-Jun, Burcu and Oksana – share what it’s like to be part of ASML right now. (hint: it’s pretty exciting!)\n\n#lifeatasml #BePartOfProgress\n\nhttps://lnkd.in/gDWgQEeV",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877436291093557249",
                "tags": [
                      "lifeatasml",
                      "BePartOfProgress"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-12-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6877435990441644",
                "year": "2021",
                "date": "December 2021",
                "title": "Thanks to emerging digital technology, there’s never been a better time to start a career in the semiconductor industry",
                "location": "",
                "image": "",
                "publicSummary": "Thanks to emerging digital technology, there’s never been a better time to start a career in the semiconductor industry. Check what the future looks like working at ASML. Find out what is like to work on incredible tech…",
                "fullText": "Thanks to emerging digital technology, there’s never been a better time to start a career in the semiconductor industry. Check what the future looks like working at ASML.\n\nFind out what is like to work on incredible technology at https://lnkd.in/gbDgKf_6\n\n#lifeatasml",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877435990441644032",
                "tags": [
                      "lifeatasml"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-10-16-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6854989964510412",
                "year": "2021",
                "date": "October 2021",
                "title": "Hi my friends, if you are interested in this position, please contact me",
                "location": "",
                "image": "",
                "publicSummary": "Hi my friends, if you are interested in this position, please contact me. | Changing the world one nanometer at a time ASML",
                "fullText": "Hi my friends, if you are interested in this position, please contact me.\n| Changing the world one nanometer at a time ASML",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6854989964510412800",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-10-16-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6854988292681801",
                "year": "2021",
                "date": "October 2021",
                "title": "Hi my friends, if you are interested in this position, please contact me",
                "location": "",
                "image": "",
                "publicSummary": "Hi my friends, if you are interested in this position, please contact me. | Changing the world one nanometer at a time ASML",
                "fullText": "Hi my friends, if you are interested in this position, please contact me.\n| Changing the world one nanometer at a time ASML",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6854988292681801728",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-08-11-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6831061564305612",
                "year": "2021",
                "date": "August 2021",
                "title": "我已加入 ，可以帮忙内推ASML的职位，点击链接查看正在热招的职位，欢迎找我内推： 如果你也愿意帮忙内推，欢迎加入我们",
                "location": "",
                "image": "",
                "publicSummary": "我已加入 #职场内推联盟 ，可以帮忙内推ASML的职位，点击链接查看正在热招的职位，欢迎找我内推：https://lnkd.in/gYWfu5u 如果你也愿意帮忙内推，欢迎加入我们。举手之劳，为公司推荐贤才，帮求职者实现职业生涯的跨越",
                "fullText": "我已加入 #职场内推联盟 ，可以帮忙内推ASML的职位，点击链接查看正在热招的职位，欢迎找我内推：https://lnkd.in/gYWfu5u 如果你也愿意帮忙内推，欢迎加入我们。举手之劳，为公司推荐贤才，帮求职者实现职业生涯的跨越",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6831061564305612800",
                "tags": [
                      "职场内推联盟"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-07-29-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a68264266763402",
                "year": "2021",
                "date": "July 2021",
                "title": "Today I worked as a volunteer technical instructor in ASML AR booth in Shanghai",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2021-07-29-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a68264266763402.jpg",
                "publicSummary": "Today I worked as a volunteer technical instructor in ASML AR booth in Shanghai. Which means I Will deliver a different training to some non-ASML experience people. Very excited and happy to be a member of TCCN (Trainin…",
                "fullText": "Today I worked as a volunteer technical instructor in ASML AR booth in Shanghai. Which means I Will deliver a different training to some non-ASML experience people. Very excited and happy to be a member of TCCN (Training Center China ), Provided me different kinds of challenges.\nAlso I met Sander in the lobby area, and maybe it's the last time we met this year.",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A6826426676340244481",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-07-28-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6825955598295814",
                "year": "2021",
                "date": "July 2021",
                "title": "Proud to be a member of TCCN",
                "location": "",
                "image": "",
                "publicSummary": "Proud to be a member of TCCN! I will be there tomorrow morning! Welcome all of my friends to visit this AR booth!",
                "fullText": "Proud to be a member of TCCN!\nI will be there tomorrow morning! Welcome all of my friends to visit this AR booth!",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6825955598295814144",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-07-23-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a68241875030425",
                "year": "2021",
                "date": "July 2021",
                "title": "After the conference in Henan province, my wife is going back to Shanghai, but the big rain hit the",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2021-07-23-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a68241875030425.jpg",
                "publicSummary": "After the conference in Henan province, my wife is going back to Shanghai, but the big rain hit the city of Zhengzhou, traffic was Disabled and flood suddenly happened. Yesterday my wife finally went back home. Until th…",
                "fullText": "After the conference in Henan province, my wife is going back to Shanghai, but the big rain hit the city of Zhengzhou, traffic was Disabled and flood suddenly happened.\nYesterday my wife finally went back home. Until this morning, all her workmates went to their home too.\nHope everything goes well, no flood, no Typhoon, no epidemic. Wish everyone enjoys their life and have a happy day!",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A6824187503042543616",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-07-22-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6823920887327289",
                "year": "2021",
                "date": "July 2021",
                "title": "我已加入 ，可以帮忙内推ASML的职位，点击链接查看正在热招的职位，欢迎找我内推： 如果你也愿意帮忙内推，欢迎加入我们",
                "location": "",
                "image": "",
                "publicSummary": "我已加入 #职场内推联盟 ，可以帮忙内推ASML的职位，点击链接查看正在热招的职位，欢迎找我内推：https://lnkd.in/gYWfu5u 如果你也愿意帮忙内推，欢迎加入我们。举手之劳，为公司推荐贤才，帮求职者实现职业生涯的跨越",
                "fullText": "我已加入 #职场内推联盟 ，可以帮忙内推ASML的职位，点击链接查看正在热招的职位，欢迎找我内推：https://lnkd.in/gYWfu5u 如果你也愿意帮忙内推，欢迎加入我们。举手之劳，为公司推荐贤才，帮求职者实现职业生涯的跨越",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6823920887327289344",
                "tags": [
                      "职场内推联盟"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-07-18-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a68224397138997",
                "year": "2021",
                "date": "July 2021",
                "title": "Sander, who hired me 3 years ago, is going back to his hometown soon, I want to say something that he really worth it",
                "location": "",
                "image": "/assets/profile-media/leo/linkedin-2021-07-18-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a68224397138997.jpg",
                "publicSummary": "Sander, who hired me 3 years ago, is going back to his hometown soon, I want to say something that he really worth it. It's Great to work with you, during the last few years, I learned a lot from you, Still remember tha…",
                "fullText": "Sander, who hired me 3 years ago, is going back to his hometown soon, I want to say something that he really worth it.\nIt's Great to work with you, during the last few years, I learned a lot from you, Still remember that there were a lot of problems in my daily work. I am really nervous to deliver my first training in ASML. You recognize my hands-on skills and show your trust and courage. That made me relax and start to deliver training.\nAlso, I faced some other operation problems during work. There were so many other things need to be done, and I couldn't manage my time with training delivery and daily operations. So you taught me how to make it easier, how to work with complexity, how to balance stakeholders, also you taught me how to make the presentation clear and Impressive. I learned a lot non-working related knowledge from you, especially I love drinking beers now.\nI really appreciate working with you! Hope everything goes well for you and your family!",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A6822439713899737088",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-07-15-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6821332432382521",
                "year": "2021",
                "date": "July 2021",
                "title": "我已加入 ，可以帮忙内推ASML的Global Training Center Technical Instructor： 感兴趣的话，快来联系我吧！ 加入职场内推联盟，成为内推人：",
                "location": "",
                "image": "",
                "publicSummary": "我已加入 #职场内推联盟 ，可以帮忙内推ASML的Global Training Center Technical Instructor：https://lnkd.in/gBaYwqc 感兴趣的话，快来联系我吧！ 加入职场内推联盟，成为内推人：https://lnkd.in/gqkqakh #GlobalTrainingCenterTechnicalInstructor",
                "fullText": "我已加入 #职场内推联盟 ，可以帮忙内推ASML的Global Training Center Technical Instructor：https://lnkd.in/gBaYwqc 感兴趣的话，快来联系我吧！\n\n加入职场内推联盟，成为内推人：https://lnkd.in/gqkqakh\n\n#GlobalTrainingCenterTechnicalInstructor",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6821332432382521344",
                "tags": [
                      "职场内推联盟",
                      "GlobalTrainingCenterTechnicalInstructor"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2021-07-15-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6821332370277441",
                "year": "2021",
                "date": "July 2021",
                "title": "我已加入 ，可以帮忙内推ASML的职位，点击链接查看正在热招的职位，欢迎找我内推： 如果你也愿意帮忙内推，欢迎加入我们",
                "location": "",
                "image": "",
                "publicSummary": "我已加入 #职场内推联盟 ，可以帮忙内推ASML的职位，点击链接查看正在热招的职位，欢迎找我内推：https://lnkd.in/gYWfu5u 如果你也愿意帮忙内推，欢迎加入我们。举手之劳，为公司推荐贤才，帮求职者实现职业生涯的跨越",
                "fullText": "我已加入 #职场内推联盟 ，可以帮忙内推ASML的职位，点击链接查看正在热招的职位，欢迎找我内推：https://lnkd.in/gYWfu5u 如果你也愿意帮忙内推，欢迎加入我们。举手之劳，为公司推荐贤才，帮求职者实现职业生涯的跨越",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6821332370277441536",
                "tags": [
                      "职场内推联盟"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2020-10-14-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6721936994672492",
                "year": "2020",
                "date": "October 2020",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6721936994672492544",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6721936994672492544",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2020-01-12-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6622030487718285",
                "year": "2020",
                "date": "January 2020",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6622030487718285313",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6622030487718285313",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          },
          {
                "id": "linkedin-post-2019-08-14-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6567250240880074",
                "year": "2019",
                "date": "August 2019",
                "title": "LinkedIn share",
                "location": "",
                "image": "",
                "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6567250240880074752",
                "fullText": "",
                "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6567250240880074752",
                "tags": [
                      "LinkedIn"
                ],
                "status": "published",
                "userApproved": true
          }
    ],
    aiWorks: [
      {
        id: "work-dishkai",
        title: "dishkai",
        type: "AI dish web product",
        publicSummary: "A web for dish",
        whyMade: "To explore a focused AI product experience around dishes.",
        toolsUsed: ["AI-assisted product design", "web prototyping"],
        humanRole: "Product idea, direction, and curation.",
        aiRole: "Assisted with product shaping and implementation.",
        result: "An early public AI product experiment for dish-related use cases.",
        link: "https://www.dishkai.com",
        tags: ["AI product", "dish", "web"],
        status: "published",
        userApproved: true
      },
      {
        id: "work-turnpo",
        title: "Turnpo",
        type: "Personal story profile platform",
        publicSummary: "A shareable personal story and AI work profile for the AI era.",
        whyMade: "To help people explain what shaped them beyond job titles.",
        toolsUsed: ["HTML/CSS/JS", "Cloudflare Pages", "AI-assisted product design"],
        humanRole: "Product direction, story curation, privacy rules, taste.",
        aiRole: "Drafting, structure, code assistance, scenario exploration.",
        result: "A searchable founder prototype with published-only AI profile generation.",
        link: "https://www.turnpo.com",
        tags: ["identity", "AI profile", "privacy"],
        status: "published",
        userApproved: true
      },
      {
        id: "work-mapkai",
        title: "MapKAI",
        type: "AI knowledge mapping concept",
        publicSummary: "An AI project exploring how people and small teams can move from scattered ideas toward clearer knowledge structures and more intentional decisions.",
        whyMade: "To test what becomes possible when curiosity, learning, product thinking, and AI-assisted exploration come together.",
        toolsUsed: ["AI prototyping", "knowledge mapping", "product thinking", "learning path design"],
        humanRole: "Co-creation, problem framing, product direction, learning perspective, and public storytelling.",
        aiRole: "Idea expansion, interface exploration, reflection generation, and structured discussion support.",
        result: "A live early-stage product direction around AI-assisted reflection, knowledge mapping, and decision systems.",
        link: "https://www.mapkai.com",
        tags: ["knowledge", "reflection", "AI agents"],
        status: "published",
        userApproved: true
      },
      {
        id: "work-mapkai-pdc",
        title: "MapKAI PDC",
        type: "AI partner discussion council demo",
        publicSummary: "A public demo where 9 AI partners explore a question through opening, challenging, narrowing, and summarizing a structured discussion.",
        whyMade: "To help people experience AI agents as thinking partners instead of single-answer tools.",
        toolsUsed: ["LLMs", "AI agents", "structured discussion design", "MapKAI"],
        humanRole: "Designed the interaction flow, chose the demo topic, framed the experience, and wrote the public explanation.",
        aiRole: "Simulates multiple perspectives that challenge, support, and refine the discussion.",
        result: "A clearer public demonstration of how AI agents can support reflection and decision-making.",
        link: "https://www.mapkai.com/pdc",
        tags: ["AI agents", "decision support", "reflection"],
        status: "published",
        userApproved: true
      }
    ]
  },
  cindy: {
      "id": "profile-cindy",
      "status": "published",
      "seedVersion": "linkedin-export-2026-06-09",
      "publicState": {
          "hiddenStoryIds": [],
          "deletedStoryIds": [],
          "hiddenWorkIds": [],
          "deletedWorkIds": [],
          "collapsedYears": [
              "2025",
              "2024",
              "2023",
              "2022",
              "2021",
              "2020",
              "2019",
              "2018",
              "2012",
              "2008"
          ]
      },
      "username": "cindy",
      "displayName": "Li (Cindy) Xin",
      "oneLineIntro": "Digital business strategist focused on AI transformation, stakeholder alignment, data-informed marketing, and operational excellence.",
      "currentChapter": "Building MapKAI while completing an MSc in Business Administration, connecting digital transformation, AI-assisted product building, UX writing, knowledge structure, and data-informed operational excellence.",
      "location": "Eindhoven, North Brabant, Netherlands",
      "avatar": "/assets/profile-media/cindy/linkedin-2026-04-27-profile-photo-01.jpg",
      "avatarPositionY": 30,
      "links": [
          {
              "label": "Turnpo",
              "url": "https://www.turnpo.com/u/cindy"
          },
          {
              "label": "MapKAI",
              "url": "https://www.mapkai.com"
          },
          {
              "label": "MiniGrowLab",
              "url": "https://www.minigrowlab.com"
          }
      ],
      "values": [
          "hands-on learning",
          "digital transformation",
          "strategic storytelling",
          "stakeholder alignment",
          "data-informed decision-making",
          "cross-cultural communication"
      ],
      "themes": [
          "Vibe Coding",
          "Lean Six Sigma",
          "AI Agents",
          "AI-Assisted Web Development",
          "Learning Design",
          "Generative AI for Web Developers",
          "Digital Product Development",
          "Product Thinking",
          "Artificial Intelligence for Design",
          "User Experience Writing",
          "Web Development",
          "Digital Transformation",
          "Artificial Intelligence (AI)",
          "DMAIC",
          "AI-Enhanced Operational Excellence",
          "Trade Shows",
          "Cross-Cultural Communication Skills",
          "Organizational Effectiveness"
      ],
      "lifeStories": [
          {
              "id": "linkedin-profile-summary",
              "year": "2026",
              "date": "LinkedIn profile",
              "title": "Digital business strategy and AI transformation profile",
              "location": "Eindhoven, North Brabant, Netherlands",
              "image": "/assets/profile-media/cindy/linkedin-2026-05-19-photo-01.jpg",
              "publicSummary": "A digital business and communication strategist with 10+ years of experience across integrated marketing, digital transformation, stakeholder alignment, and AI-assisted product exploration.",
              "fullText": "Cindy is a digital business and communication strategist with more than 10 years of experience across integrated marketing, global communication, B2B digital transformation, and stakeholder management. Her work connects data-driven insight with clear storytelling, helping teams translate digital performance, market context, and business goals into practical communication and transformation plans. At AkzoNobel, Struers, and AMETEK, she contributed to global and regional initiatives across digital media, brand visibility, lead generation, campaign optimization, and cross-functional alignment. More recently, she co-created MapKAI, an AI-assisted knowledge mapping website, bringing hands-on experience in product thinking, UX writing, knowledge structuring, and AI-assisted development. Her current focus is on using digital transformation and AI to support clearer thinking, stronger organizational alignment, and measurable business outcomes.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "profile",
                  "LinkedIn",
                  "AI"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2026-05-19-photo-01.jpg",
                  "/assets/profile-media/cindy/linkedin-2026-04-27-photo-02.jpg",
                  "/assets/profile-media/cindy/linkedin-2026-04-27-profile-background-01.jpg",
                  "/assets/profile-media/cindy/linkedin-2026-04-27-profile-background-02.jpg",
                  "/assets/profile-media/cindy/linkedin-2026-04-27-photo-03.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-08-06-document-image-01.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-07-18-photo-04.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-07-17-article-cover-photo-01.png",
                  "/assets/profile-media/cindy/linkedin-2024-06-22-photo-05.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-10-article-inline-photo-01.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-10-article-cover-photo-02.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-03-06-document-image-02.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-02-03-document-image-03.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-02-01-document-image-04.jpg",
                  "/assets/profile-media/cindy/linkedin-2023-07-06-profile-background-03.jpg",
                  "/assets/profile-media/cindy/linkedin-2023-07-06-profile-background-04.jpg"
              ]
          },
          {
              "id": "linkedin-skills",
              "year": "2026",
              "date": "LinkedIn skills",
              "title": "Core skills across AI, digital transformation, marketing, and operations",
              "location": "",
              "image": "",
              "publicSummary": "A skill set spanning AI-assisted building, digital transformation, product thinking, UX writing, Lean Six Sigma, B2B marketing, brand strategy, stakeholder management, and cross-cultural communication.",
              "fullText": "Cindy's skill set sits at the intersection of digital strategy, marketing communication, organizational improvement, and AI-assisted product work.\n\nAI and product: Vibe Coding, AI Agents, AI-Assisted Web Development, Generative AI for Web Developers, Artificial Intelligence for Design, Product Thinking, Digital Product Development, UX Writing, Web Development, and Learning Design.\n\nTransformation and operations: Digital Transformation, Lean Six Sigma, DMAIC, AI-Enhanced Operational Excellence, Organizational Effectiveness, Operational Planning, Project Management, and Stakeholder Management.\n\nMarketing and communication: B2B Marketing Strategy, Integrated Marketing, Digital Marketing, Brand Strategy, Public Relations, Localization, Presentation Skills, Trade Shows, Communication, Cross-Cultural Communication, Intelligence Analysis, and Public Administration.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "skills",
                  "LinkedIn"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-position-mapkai-co-creator-and-builder",
              "year": "2026",
              "date": "May 2026 - May 2026",
              "title": "Co-creator and Builder at MapKAI",
              "location": "Netherlands",
              "image": "",
              "publicSummary": "Co-created MapKAI, an AI-assisted knowledge mapping product that helps people turn fragmented knowledge into clearer learning paths, reflection, and direction.",
              "fullText": "Cindy co-created and built MapKAI, an AI-assisted knowledge mapping website designed to help people turn fragmented knowledge into clearer learning paths and meaningful self-reflection. Rather than defining or testing users, MapKAI helps them see what they know, what they are still exploring, and where they may want to go next. Cindy led concept development, knowledge structure, UX writing, quiz flow design, and website iteration from concept to launch. She also helped create and test the MapKAI Partner Decision Council, an AI agent committee with distinct roles for challenging assumptions, improving discussion quality, and supporting structured decision-making. This work gave her hands-on experience in AI-assisted learning design, product exploration, decision systems, and practical AI tool use.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "experience",
                  "MapKAI",
                  "AI",
                  "Learning"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-position-akzonobel-digital-media-communication",
              "year": "2024",
              "date": "September 2024 - January 2025",
              "title": "Digital Media Communication at AkzoNobel",
              "location": "Amsterdam",
              "image": "",
              "publicSummary": "Contributed to AkzoNobel global communications initiatives including Color of the Year 2025, Paint the Future, and McLaren Formula 1 partnership storytelling.",
              "fullText": "At AkzoNobel Global Communications, Cindy contributed to global brand and digital communication initiatives including Color of the Year 2025, Paint the Future, and McLaren Formula 1 partnership storytelling. Her work supported integrated digital media execution across channels, aligning content, campaign objectives, audience engagement, and brand visibility. She translated digital performance data into actionable insights for campaign optimization and stakeholder decision-making, while balancing creative storytelling with measurable communication outcomes.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "experience",
                  "AI",
                  "AkzoNobel"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-position-struers-your-metallographic-specialist-digital-marketing",
              "year": "2022",
              "date": "February 2022 - August 2022",
              "title": "Digital Marketing Lead at Struers China",
              "location": "Shanghai, China",
              "image": "",
              "publicSummary": "Led Struers China's integrated marketing and B2B digital transformation agenda, building a more scalable, data-informed, multi-channel marketing engine.",
              "fullText": "At Struers China, Cindy led the local marketing function and owned the end-to-end integrated marketing and B2B digital transformation agenda, partnering closely with the Country Manager and headquarters leadership in Denmark. She helped move marketing from fragmented, activity-based execution toward a more scalable, data-driven, and integrated operating model. Her work included translating global priorities into local digital strategy, building a multi-channel ecosystem across website, LinkedIn, WeChat, mini-programs, webinars, live streaming, and marketing automation, and strengthening lead generation, demand creation, and customer engagement. She established governance, workflows, and performance management frameworks that improved visibility, accountability, and data-informed decision-making. She also acted as a bridge across marketing, sales, and HQ, using customer interaction data, campaign performance, competitor insight, and keyword analysis to support commercial and strategic decisions. Tools included CRM, Power BI, Adobe, email A/B testing, e-commerce, paid search, and marketing automation.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "experience",
                  "AI",
                  "Digital Transformation",
                  "Marketing",
                  "Leadership"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-position-ametek-marketing-communication",
              "year": "2018",
              "date": "July 2018 - January 2022",
              "title": "Marketing Communications at AMETEK",
              "location": "Shanghai, China",
              "image": "",
              "publicSummary": "Built and optimized online and offline marketing programs for high-tech B2B markets, supporting brand visibility, lead generation, and product adoption.",
              "fullText": "At AMETEK, Cindy created and optimized integrated marketing campaigns across online and offline channels to increase brand visibility, lead generation, and product adoption in high-tech B2B markets. She initiated and scaled digital transformation initiatives, including a live streaming studio and the COE Go Digital strategy, helping accelerate digital engagement and strengthen internal capabilities. She led cross-business-unit collaboration and brand alliances, supported market intelligence and competitive analysis, managed budgets, agencies, and vendors, and worked closely with sales teams to translate market insight into business decisions. Her role connected headquarters strategy with local execution, supporting organizational alignment and growth objectives. Systems and tools included Salesforce CRM, ERP, Act-On, GoToWebinar, bidding analysis, WeChat, and email marketing.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "experience",
                  "AI",
                  "Digital Transformation",
                  "Marketing",
                  "AMETEK"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-position-local-administrative-office-public-communication-staff",
              "year": "2012",
              "date": "November 2012 - April 2018",
              "title": "Public Communication Staff in Local Administration",
              "location": "Harbin",
              "image": "",
              "publicSummary": "Developed public communication strategies, media relations, public engagement, and cross-stakeholder coordination for large-scale civic initiatives.",
              "fullText": "In local administration, Cindy worked on public communication strategies, media relations, public engagement, and cross-stakeholder coordination. She supported large-scale public initiatives including the National Civilized City Initiative and public legal education outreach programs, building early experience in structured communication, public-facing messaging, and coordination across multiple groups.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "experience"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-education-university-of-amsterdam-amsterdam-business-school-msc-in-business-administration",
              "year": "2025",
              "date": "February 2025 - June 2026",
              "title": "MSc in Business Administration at University of Amsterdam",
              "location": "",
              "image": "",
              "publicSummary": "Master's study at the University of Amsterdam, Amsterdam Business School, focused on business administration, digital transformation, and organization design.",
              "fullText": "Cindy is pursuing an MSc in Business Administration at the University of Amsterdam, Amsterdam Business School. The program connects her prior experience in multinational marketing and digital transformation with deeper study in business strategy, organization design, digital transformation, and future-proof organizational capability.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "education",
                  "LinkedIn"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-education-university-of-amsterdam-amsterdam-business-school-pre-master",
              "year": "2024",
              "date": "August 2024 - February 2025",
              "title": "Pre-master at University of Amsterdam",
              "location": "",
              "image": "",
              "publicSummary": "Completed the pre-master pathway at University of Amsterdam, preparing for graduate study in business administration.",
              "fullText": "Cindy completed the pre-master pathway at the University of Amsterdam, Amsterdam Business School, preparing for her MSc in Business Administration. This transition marked a return to academic study after years of professional experience and helped her connect practical business work with more structured academic frameworks.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "education",
                  "LinkedIn"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-education-harbin-university-of-commerce-bachelor-of-commerce",
              "year": "2008",
              "date": "2008 - 2012",
              "title": "Bachelor of Commerce at Harbin University of Commerce",
              "location": "",
              "image": "",
              "publicSummary": "Bachelor of Commerce from Harbin University of Commerce, completed with Outstanding Graduate Scholarship recognition.",
              "fullText": "Cindy earned a Bachelor of Commerce from Harbin University of Commerce and received Outstanding Graduate Scholarship recognition. This foundation supported her later work across public communication, B2B marketing, digital transformation, and international business contexts.",
              "sourceUrl": "https://www.linkedin.com/in/cindy-xin",
              "tags": [
                  "education",
                  "LinkedIn"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2026-06-02-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7467582918698090499",
              "year": "2026",
              "date": "June 2026",
              "title": "Responsible AI as organizational capability",
              "location": "",
              "image": "",
              "publicSummary": "Reflected on the shift from individual AI use to responsible organizational capability, and the leadership discipline needed to guide that transition well.",
              "fullText": "Cindy reflected on how AI adoption is already emerging from individual use, while the harder challenge is helping organizations guide it responsibly and turn it into a real capability. The post connected AI transformation with leadership integrity, responsible decision-making, and the need to move beyond hype toward thoughtful organizational practice.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7467582918698090499",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2026-05-16-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7461513532157710336",
              "year": "2026",
              "date": "May 2026",
              "title": "MapKAI launch reflection",
              "location": "",
              "image": "",
              "publicSummary": "Shared an early MapKAI launch reflection after creating an AI-assisted animation and seeing 400+ organic visits within two days of launch.",
              "fullText": "After launching MapKAI, Cindy explored how AI-assisted building could turn an idea into a more visual and accessible story. With limited time and AI credits, she created a short animation to communicate the core idea: AI should not only help people find answers, but also help them see their knowledge, reflect on themselves, and identify their next direction. Two days after launch, MapKAI had already received more than 400 organic visits. The milestone reinforced her belief that ideas can now move from imagination to reality much faster, especially when curiosity, learning by doing, and AI-assisted execution come together.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7461513532157710336",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "MapKAI",
                  "AI",
                  "Learning"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2026-05-08-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7458502113170694145",
              "year": "2026",
              "date": "May 2026",
              "title": "First AI-assisted website launch",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2026-05-08-feed-photo-01.gif",
              "publicSummary": "Launched MiniGrowLab, her first AI-assisted website, moving from prompting and GitHub iteration to domain setup and a live public site.",
              "fullText": "Cindy launched MiniGrowLab as her first AI-assisted website project, taking the idea from prompting and code iteration through GitHub to buying and connecting a domain. The project became a practical lesson in building rather than waiting to feel fully ready. It showed her how curiosity becomes meaningful only when paired with action, and how AI coding tools can help a non-traditional builder move from observing technology to creating with it. MiniGrowLab became a hands-on milestone in her AI-assisted web development journey.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7458502113170694145",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "Learning"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2026-05-08-feed-photo-01.gif"
              ]
          },
          {
              "id": "linkedin-post-2026-04-27-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7454503252844478465",
              "year": "2026",
              "date": "April 2026",
              "title": "Lean Six Sigma Green Belt milestone",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2026-04-27-feed-photo-02.jpg",
              "publicSummary": "Earned a Lean Six Sigma Green Belt with a 9.5/10 score, strengthening her practical approach to process improvement, DMAIC, and critical questioning.",
              "fullText": "Cindy earned her Lean Six Sigma Green Belt with a 9.5/10 score, adding a practical operational excellence framework to her digital transformation and business strategy experience. The learning process helped her explore process improvement, DMAIC thinking, and critical questioning more deeply. It also connected naturally with her MSc work at the University of Amsterdam and her interest in AI-enhanced operational excellence: using structured methods, better data, and clearer thinking to improve how organizations work.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7454503252844478465",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "Learning",
                  "University of Amsterdam"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2026-04-27-feed-photo-02.jpg"
              ]
          },
          {
              "id": "linkedin-post-2025-11-23-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7398453458804244483",
              "year": "2025",
              "date": "November 2025",
              "title": "University of Amsterdam learning milestone",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2025-11-23-feed-photo-03.jpg",
              "publicSummary": "Served as student representative for a University of Amsterdam course on future-proof organizations, connecting organization design theory with multinational experience.",
              "fullText": "Cindy served as the student representative for the University of Amsterdam course Designing Future-Proof Organisations, sharing her learning experience with prospective students and answering their questions. A highlight was meeting and co-presenting with Jeroen van Bree, author of Organization Design: Frameworks, Principles, and Approaches, whose work shaped the course. The experience helped Cindy connect organization design theory with her past work across multinational companies, headquarters and subsidiary contexts, and Asian and Western business cultures. She completed the course with a 9/10 score and saw it as one of the most meaningful parts of her academic journey.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7398453458804244483",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "University of Amsterdam"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2025-11-23-feed-photo-03.jpg",
                  "/assets/profile-media/cindy/linkedin-2025-11-23-feed-photo-04.jpg"
              ]
          },
          {
              "id": "linkedin-post-2025-10-08-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7381740700570161152",
              "year": "2025",
              "date": "October 2025",
              "title": "Leadership and growth reflection",
              "location": "",
              "image": "",
              "publicSummary": "Reflected on leadership as a choice to create influence, with emphasis on vision, authentic communication, self-awareness, and lifelong learning.",
              "fullText": "After an empowering session on leadership and growth, Cindy reflected on the idea that leadership is not only a position, but a choice to be influential. The discussion deepened her thinking about vision, influence, authentic communication, self-awareness, and lifelong learning. It also reinforced a recurring pattern in her development: seeking meaningful connections with people who broaden perspective and encourage continued growth.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7381740700570161152",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "Learning",
                  "Leadership"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2025-05-22-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7331376250516619268",
              "year": "2025",
              "date": "May 2025",
              "title": "Digital transformation classroom reflection",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2025-05-22-feed-photo-05.jpg",
              "publicSummary": "Connected classroom learning with digital transformation practice, drawing on AkzoNobel guest insights while refining a transformation plan assignment.",
              "fullText": "Cindy reflected on how strong lectures can do more than transfer information: they can broaden perspective, create curiosity, and change how someone thinks. Guest speakers from AkzoNobel helped her connect classroom frameworks with real digital transformation practice while she was refining a final presentation on a transformation plan. The experience became a bridge between her academic work at the University of Amsterdam, her practical communication background, and her growing interest in leading digital transformation with both structure and creativity.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7331376250516619268",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "AkzoNobel",
                  "Digital Transformation",
                  "Learning"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2025-05-22-feed-photo-05.jpg"
              ]
          },
          {
              "id": "linkedin-post-2024-12-04-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7270106030749937664",
              "year": "2024",
              "date": "December 2024",
              "title": "VR yacht coatings simulator at AkzoNobel",
              "location": "",
              "image": "",
              "publicSummary": "Explored a VR spray gun simulator for yacht coatings, seeing how immersive technology can make technical training more engaging and practical.",
              "fullText": "Cindy tried a VR spray gun simulator for yacht coatings and reflected on how immersive technology can make technical work feel more intuitive, engaging, and game-like. The experience showed how innovation can support real-world applications, especially when precision, training, and hands-on learning matter. It also connected with her broader interest in digital transformation: using technology not just for novelty, but to improve learning, engagement, and business capability.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7270106030749937664",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AkzoNobel"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2024-11-14-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7262863140143386624",
              "year": "2024",
              "date": "November 2024",
              "title": "Night Watch preservation reflection",
              "location": "",
              "image": "",
              "publicSummary": "Reflected on the preservation of Rembrandt's Night Watch and the role of collaboration between cultural institutions and AkzoNobel.",
              "fullText": "Cindy reflected on the preservation of Rembrandt's Night Watch at the Rijksmuseum and the role of collaboration between cultural institutions and AkzoNobel. Having visited the museum several times, she connected the visible restoration process with a broader appreciation for long-term stewardship, technical care, and the protection of shared cultural memory.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7262863140143386624",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "AkzoNobel"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2024-10-13-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7251238114680090627",
              "year": "2024",
              "date": "October 2024",
              "title": "Eindhoven marathon milestone",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-10-13-feed-photo-06.jpg",
              "publicSummary": "Completed her first Eindhoven marathon event, turning a new physical challenge into a lesson about preparation, confidence, and enjoying the process.",
              "fullText": "Cindy completed her first Eindhoven marathon event, running 10.55 kilometers after previously never going beyond 5 kilometers in regular exercise. The experience became a personal milestone in trying something unfamiliar with preparation and courage. By applying running techniques, monitoring heart rate and stride length, and staying present through the process, she discovered that long-distance running could feel manageable and even enjoyable. The milestone reinforced a broader theme in her story: growth often begins with the decision to try.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7251238114680090627",
              "link": "",
              "tags": [
                  "LinkedIn"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2024-10-13-feed-photo-06.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-10-13-feed-photo-07.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-10-13-feed-photo-08.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-10-13-feed-photo-09.jpg"
              ]
          },
          {
              "id": "linkedin-post-2024-09-19-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7242600718430351360",
              "year": "2024",
              "date": "September 2024",
              "title": "AkzoNobel Color of the Year 2025 campaign",
              "location": "",
              "image": "",
              "publicSummary": "Shared AkzoNobel's 2025 Color of the Year campaign, highlighting True Joy as a bright expression of optimism and brand storytelling.",
              "fullText": "Cindy shared AkzoNobel's 2025 Color of the Year campaign, centered on True Joy, a bright yellow shade designed to bring optimism and energy into everyday spaces. The post reflected her involvement in digital communication and brand storytelling around color, emotion, and audience engagement.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7242600718430351360",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "AkzoNobel"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2024-09-11-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7239525809571401728",
              "year": "2024",
              "date": "September 2024",
              "title": "True Joy campaign highlight",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-09-11-feed-photo-10.jpg",
              "publicSummary": "Highlighted True Joy, AkzoNobel's Color of the Year 2025, as a sunny yellow campaign built around optimism, pride, and emotional connection.",
              "fullText": "Cindy highlighted True Joy, AkzoNobel's Color of the Year 2025, as a sunny yellow shade created to bring optimism, pride, and vivid color into homes and public imagination. The post captured her interest in how brand communication uses color, emotion, and simple storytelling to connect with audiences.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7239525809571401728",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "AkzoNobel"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2024-09-11-feed-photo-10.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-09-11-feed-photo-11.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-09-11-feed-photo-12.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-09-11-feed-photo-13.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-09-11-feed-photo-14.jpg"
              ]
          },
          {
              "id": "linkedin-post-2024-09-07-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7238144658365710338",
              "year": "2024",
              "date": "September 2024",
              "title": "Heritage protection and shared memory",
              "location": "",
              "image": "",
              "publicSummary": "Reflected on heritage protection as more than preserving architecture: it is also about protecting shared memory across past and future.",
              "fullText": "Cindy reflected on an AkzoNobel heritage protection story, seeing preservation as more than maintaining architecture. For her, what is being protected is also humanity's shared memory across past and future. The post connected brand purpose, cultural stewardship, and the emotional meaning behind technical work.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7238144658365710338",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "AkzoNobel"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2024-09-02-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7236449358278270976",
              "year": "2024",
              "date": "September 2024",
              "title": "Starting AkzoNobel while studying at UvA",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-09-02-feed-photo-15.jpg",
              "publicSummary": "Started a Digital Media internship at AkzoNobel while beginning graduate study, combining professional growth with a new academic chapter.",
              "fullText": "Cindy began her Digital Media internship at AkzoNobel in September 2024, joining a vibrant global communication environment while also starting her master's journey at the University of Amsterdam. Balancing study and internship brought a new challenge, but also a strong opportunity for growth. The milestone allowed her to continue advancing in digital media and communication while gaining a broader perspective on global business, transformation, and professional development.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7236449358278270976",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "AkzoNobel"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2024-09-02-feed-photo-15.jpg"
              ]
          },
          {
              "id": "linkedin-post-2024-08-30-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7235367872787591169",
              "year": "2024",
              "date": "August 2024",
              "title": "Starting the University of Amsterdam chapter",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-08-30-feed-photo-16.jpg",
              "publicSummary": "Began her journey at University of Amsterdam, returning to academia after years of professional experience and relocating into a new international context.",
              "fullText": "Cindy officially began her journey at the University of Amsterdam, Amsterdam Business School, marking a new chapter of study, relocation, and international growth. After years of professional experience, returning to academia required courage and intention. Moving to the Netherlands meant living, working, and studying in Europe while immersing herself in a diverse environment with broader perspectives. The master's program brought together professionals from different industries, nationalities, and sectors, creating a learning environment where her past work experience could connect with new academic insight.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7235367872787591169",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "Learning",
                  "University of Amsterdam"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2024-08-30-feed-photo-16.jpg"
              ]
          },
          {
              "id": "linkedin-post-2024-08-06-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7226556050521362433",
              "year": "2024",
              "date": "August 2024",
              "title": "Agile Project Management certification",
              "location": "",
              "image": "",
              "publicSummary": "Completed Google's Agile Project Management certification, adding structured project delivery methods to her digital transformation toolkit.",
              "fullText": "Cindy completed Google's Agile Project Management certification, strengthening her understanding of structured project delivery, iteration, collaboration, and adaptive planning. The certification complements her work across digital transformation, marketing operations, and cross-functional stakeholder management.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7226556050521362433",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2024-07-19-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7219977627648864257",
              "year": "2024",
              "date": "July 2024",
              "title": "Lifelong learning and growth mindset",
              "location": "",
              "image": "",
              "publicSummary": "Reflected on choosing a growth mindset in times of change and using online learning to support continuous professional development.",
              "fullText": "Cindy reflected on the choice between viewing change with apprehension and approaching it with a growth mindset and a commitment to lifelong learning. She connected this idea with her own Coursera learning journey, seeing online learning as a practical way to keep building capability, confidence, and professional direction.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7219977627648864257",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "Learning"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2024-07-18-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7219645435441750016",
              "year": "2024",
              "date": "July 2024",
              "title": "AI in marketing meetup reflection",
              "location": "",
              "image": "",
              "publicSummary": "Reflected on how AI can support marketing insight and personalization, while still requiring balance with human expertise and other technologies.",
              "fullText": "After an AI and marketing meetup, Cindy reflected on how AI integration can help businesses understand consumer needs, identify market trends, and improve customer experience through more personalized recommendations and services. At the same time, she emphasized the importance of balancing AI's strengths with other technologies and human expertise. The reflection fits her broader view that AI is most useful when applied thoughtfully, with clear business context and practical judgment.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7219645435441750016",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "Marketing"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2024-06-27-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7212086172020322306",
              "year": "2024",
              "date": "June 2024",
              "title": "Struers team and relocation reflection",
              "location": "",
              "image": "",
              "publicSummary": "Celebrated the Struers marketing team and reflected on relocation as a new beginning shaped by change, perspective, and following her own direction.",
              "fullText": "Cindy celebrated a successful Struers marketing conversion and reflected warmly on a team defined by passion, collaboration, open-mindedness, and continuous contribution. Looking back on that chapter, she connected the experience with her relocation and gap year, seeing the transition not as an endpoint but as a new beginning. The post captured a personal philosophy that runs through her story: life is a journey, changing locations can expand perspective, and seeing life from multiple angles is a gift.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7212086172020322306",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "Marketing",
                  "Struers"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2024-05-30-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7202060738725654528",
              "year": "2024",
              "date": "May 2024",
              "title": "GM Eindhoven technology and networking day",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-05-30-feed-photo-17.jpg",
              "publicSummary": "Joined GM Eindhoven for technology trends, roundtable discussion, business networking, and fresh perspective on branding and emerging innovation.",
              "fullText": "Cindy attended GM Eindhoven and gained insight into emerging technology trends through introductions, roundtable discussion, presentations, and business networking. The event also gave her a chance to discuss branding, marketing strategy, and social networking with people in the local innovation ecosystem. For Cindy, the day broadened her perspective, connected her with like-minded people, and opened up new possibilities in Eindhoven's technology and business environment.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7202060738725654528",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "Marketing"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2024-05-30-feed-photo-17.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-30-feed-photo-18.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-30-feed-photo-19.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-30-feed-photo-20.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-30-feed-photo-21.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-30-feed-photo-22.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-30-feed-photo-23.jpg"
              ]
          },
          {
              "id": "linkedin-post-2024-05-10-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7194658616170139648",
              "year": "2024",
              "date": "May 2024",
              "title": "Germany road trip and Eindhoven newcomer reflection",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-24.jpg",
              "publicSummary": "Turned an Eindhoven newcomer walking tour into a wider European exploration, reflecting on cultural discovery, connection, and the courage of first steps.",
              "fullText": "After joining a walking tour for newcomers in Eindhoven, Cindy met people from different backgrounds and received travel suggestions from a German friend. That conversation became the beginning of a spring road trip through Germany, including moments by the Rhine River and time in Dresden surrounded by striking architecture and history. The experience helped her feel more connected to Europe as a new environment and reminded her that exploration often begins with one small step. She also appreciated local newcomer initiatives that help internationals understand their surroundings and build meaningful connections.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7194658616170139648",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-24.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-25.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-26.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-27.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-28.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-29.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-30.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-31.jpg"
              ]
          },
          {
              "id": "linkedin-post-2024-04-19-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7186995505376243713",
              "year": "2024",
              "date": "April 2024",
              "title": "Technology and art reflection",
              "location": "",
              "image": "",
              "publicSummary": "A short reflection on technology as something that can also carry aesthetic, emotional, and artistic value.",
              "fullText": "Cindy reflected briefly on the idea that technology is not only functional, but can also be artistic. The post fits her broader interest in the space where technology, communication, emotion, and design meet.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7186995505376243713",
              "link": "",
              "tags": [
                  "LinkedIn"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2024-03-29-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7179591085466218496",
              "year": "2024",
              "date": "March 2024",
              "title": "Meeting Mark Rutte and reflecting on communication",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-03-29-feed-photo-32.jpg",
              "publicSummary": "Met Dutch Prime Minister Mark Rutte by chance during a city walk and connected the moment with deeper reflections on trust, communication, and marketing.",
              "fullText": "During a relaxed Good Friday city walk, Cindy unexpectedly met Dutch Prime Minister Mark Rutte. The moment became more than a coincidence: it prompted her to reflect on communication, marketing strategy, public presence, and the business impact of human connection. Even during a career break, she found herself drawing ideas from daily life, travel, and memorable encounters. Looking back on her work experience, she saw again that strong marketing and communication are not only about promoting products or services, but about understanding people, building trust, and creating emotional connection with an audience.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7179591085466218496",
              "link": "",
              "tags": [
                  "LinkedIn",
                  "AI",
                  "Marketing",
                  "Learning"
              ],
              "status": "published",
              "userApproved": true,
              "images": [
                  "/assets/profile-media/cindy/linkedin-2024-03-29-feed-photo-32.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-03-29-feed-photo-33.jpg",
                  "/assets/profile-media/cindy/linkedin-2024-03-29-feed-photo-34.jpg"
              ]
          },
          {
              "id": "linkedin-post-2024-02-01-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a7158799258018615297",
              "year": "2024",
              "date": "February 2024",
              "title": "Coursera learning milestone",
              "location": "",
              "image": "",
              "publicSummary": "Marked a Coursera learning milestone as part of a broader habit of expanding expertise, perspective, and personal growth through continuous learning.",
              "fullText": "Cindy marked a Coursera learning milestone and described it as part of a rewarding journey to expand her expertise and perspective. The post reflects a consistent theme in her profile: keep learning, keep growing, and use structured learning as a platform for both personal and professional development.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7158799258018615297",
              "link": "https://coursera.org/share/88e15e3916a90904685feb679261f807",
              "tags": [
                  "LinkedIn",
                  "Learning"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2023-09-12-https-www-linkedin-com-feed-update-urn-3ali-3augcpost-3a7107355450777448448",
              "year": "2023",
              "date": "September 2023",
              "title": "Emerging markets webinar interest",
              "location": "",
              "image": "",
              "publicSummary": "Registered interest in a live session on emerging markets, reflecting ongoing attention to global business context and market dynamics.",
              "fullText": "Cindy showed interest in a live session on emerging markets, signaling her ongoing attention to global business context, market dynamics, and the way external conditions shape strategy and decision-making.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3AugcPost%3A7107355450777448448",
              "link": "",
              "tags": [
                  "LinkedIn"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "linkedin-post-2021-12-17-https-www-linkedin-com-feed-update-urn-3ali-3ashare-3a6877632610282078208",
              "year": "2021",
              "date": "December 2021",
              "title": "Archived LinkedIn share",
              "location": "",
              "image": "",
              "publicSummary": "Archived LinkedIn share from December 2021. The original source link is preserved for future review.",
              "fullText": "This archived LinkedIn share is preserved with its source link, but the original imported export did not include additional text content. It remains in the timeline as a placeholder for Cindy to review, edit, or remove later.",
              "sourceUrl": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877632610282078208",
              "link": "",
              "tags": [
                  "LinkedIn"
              ],
              "status": "published",
              "userApproved": true
          }
      ],
      "aiWorks": [
          {
              "id": "work-cindy-mapkai",
              "title": "MapKAI",
              "type": "AI-assisted knowledge mapping and reflection product",
              "publicSummary": "An AI-assisted knowledge mapping product that helps people turn scattered knowledge into clearer self-understanding, learning paths, and next-step decisions.",
              "whyMade": "To explore how AI can support knowledge structuring, personal reflection, learning path design, and more intentional decision-making for individuals and small teams.",
              "toolsUsed": [
                  "AI-assisted development",
                  "UX writing",
                  "knowledge structure design",
                  "quiz flow design",
                  "web iteration",
                  "AI agent workflow design"
              ],
              "humanRole": "Co-created the concept, shaped the knowledge structure, wrote UX content, designed quiz flows, tested user-facing reflection patterns, and helped iterate the website from concept to launch.",
              "aiRole": "Supported product exploration, information structure, implementation assistance, copy iteration, reflection prompt design, and early AI agent committee experimentation.",
              "result": "A launched public website, an early Partner Decision Council demo, and a practical learning lab for AI-assisted reflection, knowledge mapping, and structured decision-making.",
              "link": "https://www.mapkai.com",
              "tags": [
                  "AI",
                  "knowledge mapping",
                  "UX writing",
                  "product thinking"
              ],
              "status": "published",
              "userApproved": true
          },
          {
              "id": "work-cindy-minigrowlab",
              "title": "MiniGrowLab",
              "type": "AI-assisted web project",
              "publicSummary": "Cindy's first AI-assisted website, built from idea and prompting through GitHub iteration, Cloudflare deployment, and live domain launch.",
              "whyMade": "To turn a personal idea into a real web experience while learning how AI coding tools, version control, deployment, and domain setup work in practice.",
              "toolsUsed": [
                  "OpenAI Codex",
                  "GitHub",
                  "Cloudflare",
                  "AI-assisted web development"
              ],
              "humanRole": "Shaped the concept and writing, prompted the AI coding agent, reviewed and curated outputs, pushed code through GitHub, connected the domain, and learned the full path from idea to public website.",
              "aiRole": "Assisted with code generation, implementation details, troubleshooting, page iteration, and turning abstract direction into working web components.",
              "result": "A live first AI-assisted website experiment at minigrowlab.com and a concrete starting point for learning by building with AI.",
              "link": "https://www.minigrowlab.com",
              "tags": [
                  "AI-assisted web development",
                  "vibe coding",
                  "learning by doing"
              ],
              "status": "published",
              "userApproved": true
          }
      ]
  }
};

let profiles = loadProfiles();
let activeUsername = "leo";
let ownerMode = false;
let editingRef = null;
let activeEditorType = "story";
let pendingOwnerEmail = "";
let authCodeRequested = false;
let registrationCodeRequested = false;
let ownerSessionProfile = "";
let userSessionRole = "";
let userSessionEmail = "";
let userSessionScopes = [];
let ownerTimelineView = "published";
let activeCategoryFilter = "all";
let onlineDraftAvailable = false;
let onlinePublishedAvailable = false;
let onlineSyncInFlight = false;
let lastOnlineSavedAt = "";
let lastOnlinePublishedAt = "";
let lastAiImportDrafts = [];
let publishConfirmationResolver = null;
let lifeAtlasGlobeState = null;
let lifeAtlasThreeModulePromise = null;
let lifeAtlasFocusPlaceId = "";

const $ = (selector) => document.querySelector(selector);
const body = document.body;

function storedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme = storedTheme()) {
  const isLight = theme === "light";
  body.classList.toggle("theme-light", isLight);
  body.classList.toggle("theme-dark", !isLight);
  document.documentElement.style.colorScheme = isLight ? "light" : "dark";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isLight ? "#f7f9fc" : "#d7b46a");

  const themeToggle = $("#themeToggle");
  const themeToggleLabel = $("#themeToggleLabel");
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    themeToggle.title = isLight ? "Switch to dark theme" : "Switch to light theme";
  }
  if (themeToggleLabel) themeToggleLabel.textContent = isLight ? "Dark" : "Light";
}

function toggleTheme() {
  const nextTheme = body.classList.contains("theme-light") ? "dark" : "light";
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch {
    // Theme selection is a preference only; keep the UI usable if storage is unavailable.
  }
  applyTheme(nextTheme);
}

function clone(value) {
  return structuredClone(value);
}

function localKey(username) {
  return `${LOCAL_PREFIX}${username}`;
}

function savedProfile(username) {
  try {
    const saved = JSON.parse(localStorage.getItem(localKey(username)));
    if (!saved) return null;
    return normalizeProfile(saved, { localDraft: true });
  } catch {
    return null;
  }
}

function loadProfiles() {
  const next = clone(seedProfiles);
  Object.keys(next).forEach((username) => {
    next[username] = normalizeProfile(next[username]);
  });
  return next;
}

function loadPublicProfile(username) {
  if (seedProfiles[username]) {
    profiles[username] = normalizeProfile(clone(seedProfiles[username]));
  } else if (!profiles[username]) {
    profiles[username] = starterProfile({ username, displayName: username });
  }
}

function loadOwnerProfile(username) {
  profiles[username] = savedProfile(username)
    || (seedProfiles[username] ? normalizeProfile(clone(seedProfiles[username])) : profiles[username])
    || starterProfile({ username, displayName: username });
}

function normalizeProfile(profile, options = {}) {
  const seedStoryById = new Map((seedProfiles[profile.username]?.lifeStories || []).map((story) => [story.id, story]));
  const normalizedLifeStories = (profile.lifeStories || [])
    .map((item) => normalizeContent(markLocalDraftChange(item, seedStoryById.get(item.id), options), item.category === "work" ? "work" : "story"));
  const projectStories = normalizedLifeStories.filter((item) => isProjectWork(item));
  const lifeStories = normalizedLifeStories.filter((item) => !isProjectWork(item));
  const timelineIds = new Set(lifeStories.map((item) => item.id));
  const aiWorks = [...(profile.aiWorks || []), ...projectStories]
    .map((item) => normalizeContent(item, "work"))
    .filter((item, index, items) => !timelineIds.has(item.id) && items.findIndex((candidate) => candidate.id === item.id) === index);
  const normalized = {
    ...profile,
    status: profile.status === "published" ? "published" : "hidden",
    avatarPositionY: Number.isFinite(Number(profile.avatarPositionY)) ? Math.min(100, Math.max(0, Number(profile.avatarPositionY))) : 24,
    lifeStories,
    aiWorks,
    values: profile.values || [],
    themes: profile.themes || [],
    travelPlaces: normalizeTravelPlaces(profile.travelPlaces),
    links: profile.links || []
  };
  ensurePublicState(normalized);
  applyPublicState(normalized);
  return normalized;
}

function travelPlaceById(id = "") {
  return TRAVEL_PLACES.find((place) => place.id === String(id));
}

function normalizeLifeAtlasCategory(value = "") {
  return value === "major" ? "major" : "visited";
}

function travelPlaceEntryId(entry) {
  return typeof entry === "string" ? entry : entry?.id || "";
}

function travelPlaceEntryCategory(entry, fallback = "visited") {
  if (!entry || typeof entry !== "object") return normalizeLifeAtlasCategory(fallback);
  return normalizeLifeAtlasCategory(entry.category || entry.atlasCategory || fallback);
}

function withTravelPlaceCategory(entry, category = "visited") {
  const normalizedCategory = normalizeLifeAtlasCategory(category);
  if (typeof entry === "string") return { id: entry, category: normalizedCategory };
  return { ...entry, category: normalizedCategory };
}

function upsertTravelPlaceEntry(entries, entry) {
  const normalizedEntry = normalizeTravelPlaces([entry])[0];
  const entryId = travelPlaceEntryId(normalizedEntry);
  if (!entryId) return normalizeTravelPlaces(entries);
  return normalizeTravelPlaces([
    ...normalizeTravelPlaces(entries).filter((candidate) => travelPlaceEntryId(candidate) !== entryId),
    normalizedEntry
  ]);
}

function normalizeTravelPlaces(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.map((entry) => {
    if (typeof entry === "string") return travelPlaceById(entry)?.id || "";
    if (!entry || typeof entry !== "object") return "";
    const builtIn = travelPlaceById(entry.id);
    if (builtIn) return { id: builtIn.id, category: travelPlaceEntryCategory(entry) };
    const label = String(entry.label || "").trim();
    const country = String(entry.country || "").trim();
    const lat = Number(entry.lat);
    const lng = Number(entry.lng);
    const id = normalizeUsername(entry.id || `${label}-${country}`);
    if (!id || !label || !country || !Number.isFinite(lat) || !Number.isFinite(lng)) return "";
    return {
      id,
      label,
      country,
      lat: Math.min(90, Math.max(-90, lat)),
      lng: Math.min(180, Math.max(-180, lng)),
      type: "city",
      category: travelPlaceEntryCategory(entry),
      manual: true
    };
  }).filter((entry) => {
    const id = travelPlaceEntryId(entry);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normalizeContent(item, type) {
  const now = new Date().toISOString();
  const existingImages = Array.isArray(item.images) ? item.images : [];
  const images = [...new Set([...existingImages, item.image].filter(Boolean))];
  const rawStatus = item.status === "draft" ? "hidden" : item.status;
  const status = STATUSES.includes(rawStatus) ? rawStatus : "hidden";
  const category = inferContentCategory(item, type);
  const link = String(item.link || "").trim() || (category === "work" ? KNOWN_WORK_LINKS[item.id] || "" : "");
  return {
    ...item,
    id: item.id || `${type}-${crypto.randomUUID()}`,
    category,
    link,
    status,
    userApproved: status === "published" ? item.userApproved === true : false,
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
    publishedAt: item.publishedAt || (status === "published" ? now : ""),
    unpublishedAt: item.unpublishedAt || "",
    deletedAt: item.deletedAt || "",
    image: images[0] || "",
    images
  };
}

function normalizeIdList(value) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function isProjectWork(item) {
  return PROJECT_WORK_IDS.has(item?.id);
}

function markLocalDraftChange(item, seedItem, options = {}) {
  if (!options.localDraft || !seedItem || item.ownerEdited || item.ownerReviewed) return item;
  const changed = ["title", "year", "date", "location", "publicSummary", "fullText", "status", "link"]
    .some((key) => String(item[key] || "") !== String(seedItem[key] || ""));
  const tagsChanged = JSON.stringify(item.tags || []) !== JSON.stringify(seedItem.tags || []);
  const imagesChanged = JSON.stringify(item.images || []) !== JSON.stringify(seedItem.images || []);
  return changed || tagsChanged || imagesChanged ? { ...item, ownerEdited: true } : item;
}

function inferContentCategory(item, type) {
  if (item.category === "life" || item.category === "work") return item.category;
  if (type === "work") return "work";
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  if (String(item.id || "").startsWith("linkedin-position-") || tags.includes("experience")) return "work";
  return "life";
}

function categoryForType(type) {
  return CONTENT_CATEGORY[type] || type || "life";
}

function typeForContent(item) {
  return CONTENT_TYPE[item?.category] || "story";
}

function findContentEntry(type, id) {
  if (!id) return null;
  const category = categoryForType(type);
  const profile = currentProfile();
  if (category === "work") {
    const projectIndex = profile.aiWorks.findIndex((item) => item.id === id);
    if (projectIndex >= 0) return { collection: profile.aiWorks, item: profile.aiWorks[projectIndex], index: projectIndex };
    const timelineIndex = profile.lifeStories.findIndex((item) => item.id === id && item.category === "work");
    if (timelineIndex >= 0) return { collection: profile.lifeStories, item: profile.lifeStories[timelineIndex], index: timelineIndex };
    return null;
  }
  const storyIndex = profile.lifeStories.findIndex((item) => item.id === id && item.category !== "work");
  return storyIndex >= 0 ? { collection: profile.lifeStories, item: profile.lifeStories[storyIndex], index: storyIndex } : null;
}

function contentCollection(type = "story", id = "") {
  const category = categoryForType(type);
  if (category === "work") return findContentEntry(type, id)?.collection || currentProfile().aiWorks;
  return currentProfile().lifeStories;
}

function contentStateKeys(typeOrCategory) {
  const category = categoryForType(typeOrCategory);
  return category === "work"
    ? { hiddenKey: "hiddenWorkIds", deletedKey: "deletedWorkIds" }
    : { hiddenKey: "hiddenStoryIds", deletedKey: "deletedStoryIds" };
}

function applyContentState(collection, hiddenIds = [], deletedIds = []) {
  const hidden = new Set(normalizeIdList(hiddenIds));
  const deleted = new Set(normalizeIdList(deletedIds));
  collection.forEach((item) => {
    if (deleted.has(item.id)) {
      item.previousStatus = item.previousStatus || (hidden.has(item.id) ? "hidden" : item.status);
      item.status = "deleted";
      item.userApproved = false;
      item.deletedAt = item.deletedAt || new Date().toISOString();
      return;
    }
    if (hidden.has(item.id)) {
      item.status = "hidden";
      item.userApproved = false;
      item.unpublishedAt = item.unpublishedAt || new Date().toISOString();
    }
  });
}

function applyPublicState(profile) {
  const state = profile.publicState || {};
  applyContentState(profile.lifeStories.filter((item) => item.category !== "work"), state.hiddenStoryIds, state.deletedStoryIds);
  applyContentState(profile.lifeStories.filter((item) => item.category === "work"), state.hiddenWorkIds, state.deletedWorkIds);
  applyContentState(profile.aiWorks, state.hiddenWorkIds, state.deletedWorkIds);
}

function ensurePublicState(profile = currentProfile()) {
  profile.publicState = profile.publicState || {};
  ["hiddenStoryIds", "deletedStoryIds", "hiddenWorkIds", "deletedWorkIds", "collapsedYears"].forEach((key) => {
    profile.publicState[key] = normalizeIdList(profile.publicState[key]);
  });
  return profile.publicState;
}

function syncPublicStateForItem(profile, type, item) {
  const state = ensurePublicState(profile);
  const { hiddenKey, deletedKey } = contentStateKeys(item?.category || type);
  ["hiddenStoryIds", "deletedStoryIds", "hiddenWorkIds", "deletedWorkIds"].forEach((key) => {
    state[key] = normalizeIdList(state[key]).filter((id) => id !== item.id);
  });
  state[hiddenKey] = normalizeIdList(state[hiddenKey]).filter((id) => id !== item.id);
  state[deletedKey] = normalizeIdList(state[deletedKey]).filter((id) => id !== item.id);
  if (item.status === "hidden") state[hiddenKey].push(item.id);
  if (item.status === "deleted") state[deletedKey].push(item.id);
}

function syncPublicStateFromContent(profile = currentProfile()) {
  const state = ensurePublicState(profile);
  state.hiddenStoryIds = [];
  state.deletedStoryIds = [];
  state.hiddenWorkIds = [];
  state.deletedWorkIds = [];
  profile.lifeStories.forEach((item) => syncPublicStateForItem(profile, typeForContent(item), item));
  profile.aiWorks.forEach((item) => syncPublicStateForItem(profile, "work", item));
}

function saveActiveProfile() {
  localStorage.setItem(localKey(activeUsername), JSON.stringify(profiles[activeUsername]));
}

async function profileApi(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Profile sync is not available.");
  return data;
}

async function loadPublishedProfileOnline(username = activeUsername) {
  try {
    const data = await profileApi(`/api/profiles/${encodeURIComponent(username)}`);
    if (!data.profile) return false;
    profiles[username] = normalizeProfile(data.profile, { remote: true });
    onlinePublishedAvailable = true;
    lastOnlinePublishedAt = data.publishedAt || data.updatedAt || "";
    if (!ownerMode && activeUsername === username && body.classList.contains("profile-open")) renderProfile();
    return true;
  } catch {
    onlinePublishedAvailable = false;
    return false;
  }
}

async function loadDraftProfileOnline(username = activeUsername) {
  if (!ownerMode) return false;
  try {
    const data = await profileApi(`/api/profiles/${encodeURIComponent(username)}/draft`);
    if (!data.profile) return false;
    profiles[username] = normalizeProfile(data.profile, { remote: true, localDraft: true });
    saveActiveProfile();
    onlineDraftAvailable = true;
    lastOnlineSavedAt = data.savedAt || data.updatedAt || "";
    if (activeUsername === username && body.classList.contains("profile-open")) renderProfile();
    return true;
  } catch {
    onlineDraftAvailable = false;
    return false;
  }
}

async function saveProfileDraftOnline({ quiet = false } = {}) {
  if (!ownerMode || !ownerSessionProfile) return false;
  onlineSyncInFlight = true;
  if (!quiet) setOwnerSaveStatus("Saving online draft...");
  try {
    const data = await profileApi(`/api/profiles/${encodeURIComponent(activeUsername)}/draft`, {
      method: "PUT",
      body: { profile: currentProfile() }
    });
    onlineDraftAvailable = true;
    lastOnlineSavedAt = data.savedAt || new Date().toISOString();
    onlineSyncInFlight = false;
    if (!quiet) setOwnerSaveStatus(`Saved online draft ${formatTime(lastOnlineSavedAt)}. Not published online yet.`);
    renderPersistenceStatus();
    return true;
  } catch (error) {
    onlineSyncInFlight = false;
    if (!quiet) setOwnerSaveStatus(`Saved locally, but online draft failed: ${error.message}`);
    return false;
  }
}

async function publishProfileOnline({ quiet = false } = {}) {
  if (!ownerMode || !ownerSessionProfile) return false;
  onlineSyncInFlight = true;
  if (!quiet) setOwnerSaveStatus("Publishing online profile...");
  try {
    const data = await profileApi(`/api/profiles/${encodeURIComponent(activeUsername)}/publish`, {
      method: "POST",
      body: { profile: currentProfile() }
    });
    onlineDraftAvailable = true;
    onlinePublishedAvailable = true;
    lastOnlinePublishedAt = data.publishedAt || new Date().toISOString();
    onlineSyncInFlight = false;
    setOwnerSaveStatus(`Published online ${formatTime(lastOnlinePublishedAt)}. Other devices can now see published content.`);
    renderPersistenceStatus();
    return true;
  } catch (error) {
    onlineSyncInFlight = false;
    if (!quiet) setOwnerSaveStatus(`Saved locally, but online publish failed: ${error.message}`);
    return false;
  }
}

function hasLocalDraft(username = activeUsername) {
  return Boolean(localStorage.getItem(localKey(username)));
}

function formatTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function setOwnerSaveStatus(message) {
  if (ownerMode) $("#ownerSaveStatus").textContent = message;
}

function markContentFormDirty() {
  if (ownerMode && $("#contentDrawer").classList.contains("open")) {
    setOwnerSaveStatus("Unsaved form edits. Click Save content to write them to current profile data and local draft.");
  }
}

function markProfileFormDirty() {
  if (ownerMode && $("#profileDrawer").classList.contains("open")) {
    setOwnerSaveStatus("Unsaved profile edits. Click Save profile to write them to current profile data and local draft.");
  }
}

function renderPersistenceStatus() {
  if (ownerMode) {
    const onlineState = onlinePublishedAvailable
      ? `Online published${lastOnlinePublishedAt ? ` ${formatTime(lastOnlinePublishedAt)}` : ""}`
      : onlineDraftAvailable
        ? `Online draft${lastOnlineSavedAt ? ` ${formatTime(lastOnlineSavedAt)}` : ""}`
        : "No online draft loaded";
    $("#dataModeStatus").textContent = `Owner mode: editing current profile data. ${onlineState}. Local draft remains as fallback.`;
    if (!$("#ownerSaveStatus").textContent) {
      setOwnerSaveStatus(hasLocalDraft() ? "Local draft loaded from this browser. Use Save for online draft or Publish online for public." : "Public seed loaded. Use Save for online draft or Publish online for public.");
    }
    return;
  }
  $("#dataModeStatus").textContent = onlinePublishedAvailable
    ? `Viewing online published version${lastOnlinePublishedAt ? ` from ${formatTime(lastOnlinePublishedAt)}` : ""}`
    : "Viewing bundled public version";
  $("#ownerSaveStatus").textContent = "";
}

function saveCurrentProfileState() {
  saveActiveProfile();
  const now = new Date();
  setOwnerSaveStatus(`Saved local draft ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Saving online draft...`);
  saveProfileDraftOnline({ quiet: false });
}

function currentProfile() {
  return profiles[activeUsername] || profiles.leo;
}

function isPublished(item) {
  return item.status === "published" && item.userApproved === true;
}

function isPublicContent(profile, item, hiddenKey, deletedKey) {
  const state = profile.publicState || {};
  const hiddenIds = new Set(normalizeIdList(state[hiddenKey]));
  const deletedIds = new Set(normalizeIdList(state[deletedKey]));
  if (!isPublished(item) || hiddenIds.has(item.id) || deletedIds.has(item.id)) return false;
  return true;
}

function isLowValueImportedStory(story) {
  if (story.ownerEdited || story.ownerReviewed) return false;
  const title = String(story.title || "").trim();
  const summary = String(story.publicSummary || "").trim();
  const fullText = String(story.fullText || "").trim();
  const combined = `${title} ${summary} ${fullText}`;
  return /^LinkedIn (share|update)$/i.test(title)
    || isSourceOnlyText(title)
    || isSourceOnlyText(summary)
    || /\b(join us|we are hiring|hiring|job|career|careers|position|contact me|discover more|find out|want to be part|welcome all|visit this ar booth|colleagues around the world|semiconductor industry|changing the world one nanometer|BePartOfProgress|lifeatasml)\b/i.test(combined)
    || /职场内推联盟|内推|职位|热招|求职者/.test(combined);
}

function isPublicStoryContent(profile, story) {
  return isPublicContent(profile, story, "hiddenStoryIds", "deletedStoryIds")
    && !isLowValueImportedStory(story);
}

function isPublicProfile(profile) {
  return profile.status === "published";
}

function publishedProfiles() {
  return Object.values(profiles).filter(isPublicProfile);
}

function publicStories(profile = currentProfile()) {
  return profile.lifeStories
    .filter((story) => story.category !== "work")
    .filter((story) => isPublicStoryContent(profile, story))
    .sort(compareTimelineItems);
}

function publicTimelineWorks(profile = currentProfile()) {
  return profile.lifeStories
    .filter((work) => work.category === "work")
    .filter((work) => isPublicContent(profile, work, "hiddenWorkIds", "deletedWorkIds"))
    .sort(compareTimelineItems);
}

function publicWorks(profile = currentProfile()) {
  return profile.aiWorks
    .filter((work) => isPublicContent(profile, work, "hiddenWorkIds", "deletedWorkIds"))
    .sort(compareTimelineItems);
}

function publicWorkLinks(profile = currentProfile()) {
  return publicWorks(profile)
    .filter((work) => work.link)
    .map((work) => ({ label: work.title, url: work.link }));
}

function publicTimelineItems(profile = currentProfile()) {
  return [...publicStories(profile), ...publicTimelineWorks(profile)]
    .sort(compareTimelineItems);
}

function normalizePlaceText(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function placeMatchesText(place, text) {
  const normalizedText = normalizePlaceText(text);
  if (!normalizedText) return false;
  return place.tokens.some((token) => {
    const normalizedToken = normalizePlaceText(token);
    if (!normalizedToken) return false;
    if (/^[\p{Script=Han}]+$/u.test(token)) return normalizedText.includes(normalizedToken);
    return new RegExp(`(^|\\s)${normalizedToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`, "i").test(normalizedText);
  });
}

function travelSourceItems(profile = currentProfile()) {
  const items = ownerMode ? [...profile.lifeStories, ...profile.aiWorks] : [...publicTimelineItems(profile), ...publicWorks(profile)];
  return [
    { title: "Current base", location: profile.location, publicSummary: profile.currentChapter },
    ...items
  ];
}

function manualTravelPlaces(profile = currentProfile()) {
  const normalizedEntries = normalizeTravelPlaces(profile.travelPlaces);
  const defaultIds = LIFE_ATLAS_DEFAULT_PROFILE_USERNAMES.has(profile.username)
    ? new Set(LIFE_ATLAS_DEFAULT_CITY_IDS)
    : new Set();
  const places = normalizedEntries.map((entry) => {
    const entryId = travelPlaceEntryId(entry);
    const place = typeof entry === "string" ? travelPlaceById(entry) : travelPlaceById(entryId) || entry;
    if (!place) return null;
    const defaultCategory = LIFE_ATLAS_DEFAULT_CITY_CATEGORIES.get(place.id) || "visited";
    return {
      ...place,
      atlasCategory: travelPlaceEntryCategory(entry, defaultCategory),
      atlasDefault: defaultIds.has(place.id),
      manual: !defaultIds.has(place.id)
    };
  }).filter(Boolean);
  const selectedIds = new Set(places.map((place) => place.id));
  defaultIds.forEach((placeId) => {
    if (selectedIds.has(placeId)) return;
    const place = travelPlaceById(placeId);
    if (place) {
      places.push({
        ...place,
        atlasCategory: LIFE_ATLAS_DEFAULT_CITY_CATEGORIES.get(placeId) || "visited",
        atlasDefault: true,
        manual: false
      });
    }
  });
  return places;
}

function lifeAtlasCityCategory(place) {
  return normalizeLifeAtlasCategory(place?.atlasCategory || place?.category);
}

function visitedPlaces(profile = currentProfile()) {
  const matches = new Map();
  travelSourceItems(profile).forEach((item) => {
    const source = [
      item.location,
      item.title,
      item.publicSummary,
      ownerMode ? item.fullText : ""
    ].filter(Boolean).join(" ");
    TRAVEL_PLACES.forEach((place) => {
      if (!placeMatchesText(place, source)) return;
      const existing = matches.get(place.id) || { ...place, count: 0, examples: [] };
      existing.count += 1;
      if (item.title && existing.examples.length < 2) existing.examples.push(item.title);
      matches.set(place.id, existing);
    });
  });
  manualTravelPlaces(profile).forEach((place) => {
    const existing = matches.get(place.id) || { ...place, count: 0, examples: [] };
    existing.count = Math.max(existing.count, 1);
    existing.manual = existing.manual || place.manual;
    existing.atlasDefault = existing.atlasDefault || place.atlasDefault;
    existing.atlasCategory = place.atlasCategory || existing.atlasCategory;
    matches.set(place.id, existing);
  });
  const places = [...matches.values()];
  const cityCountries = new Set(places.filter((place) => place.type === "city").map((place) => place.country));
  return places
    .filter((place) => place.type !== "country" || !cityCountries.has(place.country))
    .map((place) => ({ ...place, atlasCategory: place.type === "city" ? lifeAtlasCityCategory(place) : "country" }))
    .sort((a, b) => {
      const categoryRank = { major: 0, visited: 1, country: 2 };
      return (categoryRank[a.atlasCategory] ?? 3) - (categoryRank[b.atlasCategory] ?? 3)
        || b.count - a.count
        || a.label.localeCompare(b.label);
    });
}

function travelPlaceFromInput(value = "") {
  const raw = String(value).trim();
  if (!raw) return null;
  const byId = travelPlaceById(raw);
  if (byId?.type === "city") return byId.id;
  const normalized = normalizePlaceText(raw);
  const builtIn = TRAVEL_PLACES.find((place) => {
    const names = [place.id, place.label, `${place.label} ${place.country}`, `${place.label}, ${place.country}`, ...place.tokens];
    return names.some((name) => normalizePlaceText(name) === normalized);
  });
  if (builtIn?.type === "city") return builtIn.id;

  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 4) {
    const lat = Number(parts[2]);
    const lng = Number(parts[3]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return normalizeTravelPlaces([{
        id: `${parts[0]}-${parts[1]}`,
        label: parts[0],
        country: parts[1],
        lat,
        lng
      }])[0] || null;
    }
  }
  return null;
}

function hasLifeAtlasCoordinates(place) {
  return place?.type === "city" && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng));
}

function lifeAtlasPoint(place) {
  if (!hasLifeAtlasCoordinates(place)) return null;
  const x = 50 + Number(place.lng) * 0.22;
  const y = 52 - Number(place.lat) * 0.44;
  return {
    x: Math.min(88, Math.max(12, x)),
    y: Math.min(82, Math.max(12, y))
  };
}

function supportsLifeAtlasWebGL(canvas) {
  try {
    return Boolean(canvas && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch (error) {
    return false;
  }
}

function loadLifeAtlasThree() {
  if (!lifeAtlasThreeModulePromise) {
    lifeAtlasThreeModulePromise = import(LIFE_ATLAS_THREE_URL);
  }
  return lifeAtlasThreeModulePromise;
}

function disposeLifeAtlasGlobe() {
  if (!lifeAtlasGlobeState) return;
  const state = lifeAtlasGlobeState;
  state.disposed = true;
  state.observer?.disconnect();
  state.resizeObserver?.disconnect();
  if (state.frameId) cancelAnimationFrame(state.frameId);
  if (state.canvas) {
    if (state.onPointerMove) state.canvas.removeEventListener("pointermove", state.onPointerMove);
    if (state.onPointerLeave) state.canvas.removeEventListener("pointerleave", state.onPointerLeave);
    if (state.onPointerClick) state.canvas.removeEventListener("click", state.onPointerClick);
  }
  if (state.onWindowResize) window.removeEventListener("resize", state.onWindowResize);
  state.scene?.traverse((node) => {
    node.geometry?.dispose?.();
    if (Array.isArray(node.material)) {
      node.material.forEach((material) => material.dispose?.());
    } else {
      node.material?.dispose?.();
    }
  });
  state.textures?.forEach((texture) => texture.dispose?.());
  state.renderer?.dispose?.();
  state.mapEl?.classList.remove("is-loading-3d", "is-3d-ready", "is-3d-fallback");
  if (state.canvas) {
    state.canvas.style.opacity = "";
    state.canvas.style.pointerEvents = "";
  }
  const fallback = state.mapEl?.querySelector(".life-atlas-static-fallback");
  if (fallback) {
    fallback.style.opacity = "";
    fallback.style.pointerEvents = "";
  }
  lifeAtlasGlobeState = null;
}

function setLifeAtlasGlobeActive(placeId, active) {
  const point = lifeAtlasGlobeState?.points?.get(placeId);
  if (!point) return;
  const isMajor = point.category === "major";
  point.core.material.color.set(active ? 0xffefd1 : (isMajor ? 0xffdfa1 : 0xd9c18c));
  point.core.scale.setScalar(active ? (isMajor ? 1.18 : 1.32) : 1);
  point.glow.material.opacity = active ? (isMajor ? 0.42 : 0.12) : (isMajor ? 0.32 : 0);
  point.glow.scale.setScalar(active ? 1.16 : 1);
  if (point.label) point.label.material.opacity = isMajor ? (active ? 0.96 : 0.82) : (active ? 0.88 : 0);
  point.hit.scale.setScalar(active ? 1.18 : 1);
  lifeAtlasGlobeState.requestRender?.();
}

function latLngToGlobeVector(THREE, lat, lng, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createLifeAtlasSignalTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const glow = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, "rgba(255, 246, 214, 0.92)");
  glow.addColorStop(0.18, "rgba(255, 216, 146, 0.5)");
  glow.addColorStop(0.44, "rgba(255, 179, 91, 0.12)");
  glow.addColorStop(1, "rgba(255, 179, 91, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLifeAtlasLabelTexture(THREE, label) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 72;
  const context = canvas.getContext("2d");
  context.font = "600 24px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const text = String(label || "").slice(0, 18);
  context.shadowColor = "rgba(0, 0, 0, 0.72)";
  context.shadowBlur = 10;
  context.fillStyle = "rgba(255, 242, 214, 0.92)";
  context.fillText(text, 128, 36);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function lifeAtlasRotationYForPlace(THREE, place, baseRotation, radius) {
  if (!hasLifeAtlasCoordinates(place)) return baseRotation.y;
  const vector = latLngToGlobeVector(THREE, place.lat, place.lng, radius);
  let bestY = baseRotation.y;
  let bestScore = -Infinity;
  for (let step = 0; step < 180; step += 1) {
    const y = -Math.PI + (step / 179) * Math.PI * 2;
    const projected = vector.clone().applyEuler(new THREE.Euler(baseRotation.x, y, baseRotation.z));
    const score = projected.z - Math.abs(projected.x) * 0.58 - Math.abs(projected.y) * 0.08;
    if (score > bestScore) {
      bestScore = score;
      bestY = y;
    }
  }
  return bestY;
}

function createLifeAtlasAtmosphereTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const haze = context.createRadialGradient(128, 128, 18, 128, 128, 128);
  haze.addColorStop(0, "rgba(70, 170, 255, 0.02)");
  haze.addColorStop(0.52, "rgba(70, 170, 255, 0.08)");
  haze.addColorStop(0.78, "rgba(88, 194, 255, 0.16)");
  haze.addColorStop(1, "rgba(88, 194, 255, 0)");
  context.fillStyle = haze;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function queueLifeAtlasGlobe(places, focusPlaceId = "") {
  disposeLifeAtlasGlobe();
  const mapEl = $("#travelMapCanvas").querySelector(".life-atlas-map");
  const canvas = mapEl?.querySelector(".life-atlas-globe-canvas");
  if (!mapEl || !canvas || !places.length || !supportsLifeAtlasWebGL(canvas)) {
    mapEl?.classList.add("is-3d-fallback");
    return;
  }

  const state = { mapEl, canvas, disposed: false, focusPlaceId };
  lifeAtlasGlobeState = state;
  const start = () => {
    if (state.started) return;
    state.started = true;
    state.observer?.disconnect();
    initLifeAtlasGlobe(state, places).catch(() => {
      if (lifeAtlasGlobeState === state) {
        state.mapEl.classList.remove("is-loading-3d", "is-3d-ready");
        state.mapEl.classList.add("is-3d-fallback");
      }
    });
  };

  if ("IntersectionObserver" in window) {
    state.observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) start();
    }, { rootMargin: "160px" });
    state.observer.observe(mapEl);
  } else {
    window.setTimeout(start, 0);
  }
  window.setTimeout(start, 0);
}

async function initLifeAtlasGlobe(state, places) {
  state.mapEl.classList.add("is-loading-3d");
  const THREE = await loadLifeAtlasThree();
  if (state.disposed || lifeAtlasGlobeState !== state) return;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const renderer = new THREE.WebGLRenderer({
    canvas: state.canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.25));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.06, 7.2);

  const radius = 1.72;
  const baseRotation = { x: 0.55, y: 1.08, z: -0.12 };
  const focusPlace = places.find((place) => place.id === state.focusPlaceId);
  const globe = new THREE.Group();
  globe.position.set(0.05, -0.04, 0);
  globe.rotation.set(
    baseRotation.x,
    focusPlace ? lifeAtlasRotationYForPlace(THREE, focusPlace, baseRotation, radius) : baseRotation.y,
    baseRotation.z
  );
  scene.add(globe);

  scene.add(new THREE.AmbientLight(0x7fa9d8, 0.28));
  const sun = new THREE.DirectionalLight(0xffefd6, 2.9);
  sun.position.set(3.7, 2.5, 4.4);
  scene.add(sun);
  const blueRim = new THREE.PointLight(0x48b8ff, 1.55, 8);
  blueRim.position.set(-2.6, -0.6, 2.4);
  scene.add(blueRim);
  const horizonFill = new THREE.PointLight(0x9fd8ff, 0.6, 7);
  horizonFill.position.set(0.2, 1.7, 3.2);
  scene.add(horizonFill);

  const loader = new THREE.TextureLoader();
  const [earthTexture, nightTexture] = await Promise.all([
    new Promise((resolve) => loader.load(LIFE_ATLAS_EARTH_TEXTURE, resolve, undefined, () => resolve(null))),
    new Promise((resolve) => loader.load(LIFE_ATLAS_NIGHT_TEXTURE, resolve, undefined, () => resolve(null)))
  ]);
  if (state.disposed || lifeAtlasGlobeState !== state) {
    earthTexture?.dispose?.();
    nightTexture?.dispose?.();
    return;
  }
  [earthTexture, nightTexture].filter(Boolean).forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 16);
  });

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 144, 80),
    new THREE.MeshStandardMaterial({
      color: 0xf0f7ff,
      map: earthTexture,
      emissive: 0x0b203a,
      emissiveMap: nightTexture,
      emissiveIntensity: 0.38,
      roughness: 0.72,
      metalness: 0.02
    })
  );
  globe.add(earth);

  if (nightTexture) {
    const nightLights = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.006, 144, 80),
      new THREE.MeshBasicMaterial({
        map: nightTexture,
        color: 0xffc47a,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    globe.add(nightLights);
  }

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.026, 144, 80),
    new THREE.MeshBasicMaterial({
      color: 0x79cfff,
      transparent: true,
      opacity: 0.026,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  globe.add(atmosphere);

  const atmosphereTexture = createLifeAtlasAtmosphereTexture(THREE);
  const atmosphericHaze = new THREE.Sprite(new THREE.SpriteMaterial({
      map: atmosphereTexture,
      color: 0x80cfff,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    }));
  atmosphericHaze.scale.set(radius * 2.18, radius * 2.18, 1);
  atmosphericHaze.renderOrder = -1;
  globe.add(atmosphericHaze);

  const signalTexture = createLifeAtlasSignalTexture(THREE);
  const labelTextures = [];
  const hitMeshes = [];
  const points = new Map();
  places.forEach((place) => {
    const category = lifeAtlasCityCategory(place);
    const isMajor = category === "major";
    const pointPosition = latLngToGlobeVector(THREE, place.lat, place.lng, radius * 1.036);
    const pointGroup = new THREE.Group();
    pointGroup.position.copy(pointPosition);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(isMajor ? 0.026 : 0.012, 16, 10),
      new THREE.MeshBasicMaterial({ color: isMajor ? 0xffdfa1 : 0xd9c18c })
    );
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: signalTexture,
      color: isMajor ? 0xffcb86 : 0xd7c29a,
      transparent: true,
      opacity: isMajor ? 0.32 : 0,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    glow.scale.set(isMajor ? 0.2 : 0.06, isMajor ? 0.2 : 0.06, isMajor ? 0.2 : 0.06);
    const labelTexture = createLifeAtlasLabelTexture(THREE, place.label);
    labelTextures.push(labelTexture);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
      opacity: isMajor ? 0.82 : 0,
      depthTest: true,
      depthWrite: false
    }));
    label.position.set(0, isMajor ? 0.105 : 0.075, 0);
    label.scale.set(isMajor ? 0.38 : 0.32, isMajor ? 0.105 : 0.09, 1);
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 12, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.userData.placeId = place.id;
    pointGroup.add(glow, core, label, hit);
    globe.add(pointGroup);
    hitMeshes.push(hit);
    points.set(place.id, { core, glow, label, hit, group: pointGroup, category });
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredPlaceId = "";

  const render = () => renderer.render(scene, camera);
  const pickPlace = (event) => {
    const rect = state.canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(hitMeshes, false)[0]?.object?.userData?.placeId || "";
  };
  const activateFromPointer = (event) => {
    const nextPlaceId = pickPlace(event);
    if (nextPlaceId === hoveredPlaceId) return;
    if (hoveredPlaceId) setActiveTravelPlace(hoveredPlaceId, false);
    hoveredPlaceId = nextPlaceId;
    if (hoveredPlaceId) setActiveTravelPlace(hoveredPlaceId, true);
  };
  const clearPointer = () => {
    if (hoveredPlaceId) setActiveTravelPlace(hoveredPlaceId, false);
    hoveredPlaceId = "";
  };

  const resize = () => {
    const width = Math.max(1, state.mapEl.clientWidth);
    const height = Math.max(1, state.mapEl.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };

  const animate = () => {
    if (state.disposed) return;
    if (!reducedMotion) globe.rotation.y += 0.00062;
    render();
    state.frameId = requestAnimationFrame(animate);
  };

  Object.assign(state, {
    renderer,
    scene,
    camera,
    points,
    textures: [earthTexture, nightTexture, signalTexture, atmosphereTexture, ...labelTextures].filter(Boolean),
    onPointerMove: activateFromPointer,
    onPointerLeave: clearPointer,
    onPointerClick: activateFromPointer,
    requestRender: render
  });

  state.canvas.addEventListener("pointermove", activateFromPointer);
  state.canvas.addEventListener("pointerleave", clearPointer);
  state.canvas.addEventListener("click", activateFromPointer);
  if ("ResizeObserver" in window) {
    state.resizeObserver = new ResizeObserver(resize);
    state.resizeObserver.observe(state.mapEl);
  } else {
    state.onWindowResize = resize;
    window.addEventListener("resize", resize);
  }
  resize();
  state.mapEl.classList.remove("is-loading-3d", "is-3d-fallback");
  state.mapEl.classList.add("is-3d-ready");
  state.canvas.style.opacity = "1";
  state.canvas.style.pointerEvents = "auto";
  const fallback = state.mapEl.querySelector(".life-atlas-static-fallback");
  if (fallback) {
    fallback.style.opacity = "0";
    fallback.style.pointerEvents = "none";
  }
  animate();
}

function setActiveTravelPlace(placeId, active) {
  $("#travelMap").querySelectorAll(".life-atlas-marker, .travel-place-card").forEach((node) => {
    if (node.dataset.placeId === placeId) node.classList.toggle("is-active", active);
  });
  setLifeAtlasGlobeActive(placeId, active);
}

function renderTravelMap() {
  const places = visitedPlaces();
  $("#travelMap").hidden = !places.length && !ownerMode;
  if (!places.length && !ownerMode) {
    disposeLifeAtlasGlobe();
    $("#travelMapCanvas").innerHTML = "";
    $("#travelPlaceList").innerHTML = "";
    return;
  }
  const markerPlaces = places.filter((place) => place.type === "city");
  const signalPlaces = markerPlaces.filter((place) => hasLifeAtlasCoordinates(place));
  $("#travelMapSummary").textContent = "Every new place leaves a quiet signal in us - through its people, culture, rhythm, food, language, and ways of living.";
  $("#travelMapCanvas").innerHTML = `
    <div class="life-atlas-map" role="img" aria-label="Rotating Life Atlas Earth globe with warm signals for places that shaped perspective">
      <canvas class="life-atlas-globe-canvas" aria-hidden="true"></canvas>
      <div class="life-atlas-static-fallback">
        <img class="life-atlas-image" src="${LIFE_ATLAS_EARTH_IMAGE}" alt="" aria-hidden="true" loading="lazy" />
        <div class="life-atlas-vignette" aria-hidden="true"></div>
        <div class="life-atlas-marker-layer">
          ${signalPlaces.map((place) => {
          const point = lifeAtlasPoint(place);
          const category = lifeAtlasCityCategory(place);
          return `
            <span class="life-atlas-marker is-${escapeHtml(category)}" data-place-id="${escapeHtml(place.id)}" tabindex="0" aria-label="${escapeHtml(`${place.label}, ${place.country}, ${category === "major" ? "major life chapter" : "visited city"}`)}" style="--x:${point.x.toFixed(2)}%; --y:${point.y.toFixed(2)}%; --delay:${Math.min(place.count, 8) * 80}ms">
              <span class="life-atlas-marker-label" aria-hidden="true">${escapeHtml(place.label)}</span>
              <span class="sr-only">${escapeHtml(`${place.label}, ${place.country}`)}</span>
            </span>`;
        }).join("")}
        </div>
      </div>
    </div>`;
  const addForm = ownerMode ? `
    <form class="travel-place-add owner-only" id="travelPlaceAddForm">
      <select id="travelPlaceInput" aria-label="Add city to Life Atlas">
        <option value="">Add city</option>
        ${TRAVEL_PLACES.filter((place) => place.type === "city").map((place) => `<option value="${escapeHtml(place.id)}">${escapeHtml(`${place.label}, ${place.country}`)}</option>`).join("")}
      </select>
      <button type="submit" aria-label="Add city">+</button>
      <div class="travel-place-category" role="radiogroup" aria-label="City marker level">
        <label>
          <input type="radio" name="travelPlaceCategory" value="visited" checked>
          <span>Visited</span>
        </label>
        <label>
          <input type="radio" name="travelPlaceCategory" value="major">
          <span>Life chapter</span>
        </label>
      </div>
      <small id="travelPlaceAddNote"></small>
    </form>
  ` : "";
  $("#travelPlaceList").innerHTML = `
    ${addForm}
    <div class="travel-place-cards">
      ${places.map((place) => {
        const category = lifeAtlasCityCategory(place);
        return `
    <article class="travel-place-card is-${escapeHtml(place.atlasCategory || "trace")}${place.manual ? " is-manual" : ""}" data-place-id="${escapeHtml(place.id)}" tabindex="0">
      <span class="travel-place-dot" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(place.label)}</strong>
        <small>${escapeHtml(place.country)} · ${category === "major" ? "life chapter" : place.type === "city" ? "visited city" : place.manual && place.count <= 1 ? "added place" : `${place.count} quiet trace${place.count === 1 ? "" : "s"}`}</small>
      </div>
      <div class="travel-place-actions">
        ${ownerMode && place.type === "city" ? `
          <div class="travel-place-tier-control owner-only" role="group" aria-label="${escapeHtml(`Marker level for ${place.label}`)}">
            <button class="${category === "visited" ? "is-selected" : ""}" type="button" data-place-category="${escapeHtml(place.id)}" data-category="visited" aria-pressed="${category === "visited" ? "true" : "false"}">Visit</button>
            <button class="${category === "major" ? "is-selected" : ""}" type="button" data-place-category="${escapeHtml(place.id)}" data-category="major" aria-pressed="${category === "major" ? "true" : "false"}">Life</button>
          </div>
        ` : ""}
        ${ownerMode && place.manual ? `<button class="travel-place-remove owner-only" type="button" data-remove-place="${escapeHtml(place.id)}" aria-label="Remove ${escapeHtml(place.label)}">×</button>` : ""}
      </div>
    </article>
  `;
      }).join("")}
    </div>`;
  $("#travelPlaceAddForm")?.addEventListener("submit", addTravelPlace);
  $("#travelPlaceList").querySelectorAll("[data-place-category]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      updateTravelPlaceCategory(button.dataset.placeCategory, button.dataset.category);
    });
  });
  $("#travelPlaceList").querySelectorAll("[data-remove-place]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      removeTravelPlace(button.dataset.removePlace);
    });
  });
  $("#travelMap").querySelectorAll("[data-place-id]").forEach((node) => {
    node.addEventListener("mouseenter", () => setActiveTravelPlace(node.dataset.placeId, true));
    node.addEventListener("mouseleave", () => setActiveTravelPlace(node.dataset.placeId, false));
    node.addEventListener("focus", () => setActiveTravelPlace(node.dataset.placeId, true));
    node.addEventListener("blur", () => setActiveTravelPlace(node.dataset.placeId, false));
    node.addEventListener("focusin", () => setActiveTravelPlace(node.dataset.placeId, true));
    node.addEventListener("focusout", () => setActiveTravelPlace(node.dataset.placeId, false));
    node.addEventListener("click", () => setActiveTravelPlace(node.dataset.placeId, true));
  });
  queueLifeAtlasGlobe(signalPlaces, lifeAtlasFocusPlaceId);
  lifeAtlasFocusPlaceId = "";
}

function addTravelPlace(event) {
  event.preventDefault();
  const input = $("#travelPlaceInput");
  const note = $("#travelPlaceAddNote");
  const category = normalizeLifeAtlasCategory(document.querySelector("input[name='travelPlaceCategory']:checked")?.value);
  const entry = travelPlaceFromInput(input?.value || "");
  if (!entry) {
    if (note) note.textContent = "Choose a city from the list.";
    return;
  }
  const profile = currentProfile();
  const addedPlaceId = typeof entry === "string" ? entry : entry.id;
  lifeAtlasFocusPlaceId = addedPlaceId || "";
  profile.travelPlaces = upsertTravelPlaceEntry(profile.travelPlaces, withTravelPlaceCategory(entry, category));
  saveActiveProfile();
  renderProfile();
  if (addedPlaceId) {
    window.setTimeout(() => setActiveTravelPlace(addedPlaceId, true), 120);
    window.setTimeout(() => setActiveTravelPlace(addedPlaceId, true), 900);
  }
  setOwnerSaveStatus("City added to Life Atlas. Saving online draft...");
  saveProfileDraftOnline({ quiet: true }).then(() => setOwnerSaveStatus("Life Atlas city saved to online draft."));
}

function updateTravelPlaceCategory(placeId = "", category = "visited") {
  const profile = currentProfile();
  const existing = normalizeTravelPlaces(profile.travelPlaces).find((entry) => travelPlaceEntryId(entry) === placeId);
  const builtIn = travelPlaceById(placeId);
  if (!existing && !builtIn) return;
  lifeAtlasFocusPlaceId = placeId;
  profile.travelPlaces = upsertTravelPlaceEntry(profile.travelPlaces, withTravelPlaceCategory(existing || placeId, category));
  saveActiveProfile();
  renderProfile();
  window.setTimeout(() => setActiveTravelPlace(placeId, true), 120);
  setOwnerSaveStatus("City marker level updated. Saving online draft...");
  saveProfileDraftOnline({ quiet: true }).then(() => setOwnerSaveStatus("Life Atlas marker level saved to online draft."));
}

function removeTravelPlace(placeId = "") {
  const profile = currentProfile();
  profile.travelPlaces = normalizeTravelPlaces(profile.travelPlaces).filter((entry) => travelPlaceEntryId(entry) !== placeId);
  saveActiveProfile();
  renderProfile();
  setOwnerSaveStatus("City removed from Life Atlas. Saving online draft...");
  saveProfileDraftOnline({ quiet: true }).then(() => setOwnerSaveStatus("Life Atlas city removal saved to online draft."));
}

function categoryMatchesFilter(item, filter = activeCategoryFilter) {
  return filter === "all" || (item.category || "life") === filter;
}

function timelineStories(profile = currentProfile()) {
  const items = ownerMode ? profile.lifeStories : publicTimelineItems(profile);
  return items
    .filter((item) => categoryMatchesFilter(item))
    .filter((story) => story.status === ownerTimelineView)
    .sort(compareTimelineItems);
}

function ownerStoryCounts(profile = currentProfile()) {
  return profile.lifeStories.filter((item) => categoryMatchesFilter(item)).reduce((counts, story) => ({
    ...counts,
    [story.status]: (counts[story.status] || 0) + 1
  }), { published: 0, hidden: 0, deleted: 0 });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function parseList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeUsername(value = "") {
  return String(value)
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function starterProfile({ username, displayName, email = "" }) {
  return normalizeProfile({
    id: `profile-${username}`,
    status: "published",
    seedVersion: "local-starter",
    username,
    displayName,
    ownerEmail: email,
    oneLineIntro: `${displayName} is building a Turnpo profile in the AI era.`,
    currentChapter: "Shaping a public profile through turning points, meaningful work, and owner-approved stories.",
    location: "",
    avatar: "/assets/turnpo-logo-full.png",
    avatarPositionY: 24,
    links: [],
    values: [],
    themes: [],
    travelPlaces: [],
    lifeStories: [],
    aiWorks: [],
    publicState: {
      hiddenStoryIds: [],
      deletedStoryIds: [],
      hiddenWorkIds: [],
      deletedWorkIds: [],
      collapsedYears: []
    }
  });
}

function absoluteUrl(value = "") {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function yearSortValue(year) {
  const value = Number(year || 0);
  return Number.isFinite(value) ? value : -Infinity;
}

function monthSortValue(month = "") {
  return MONTH_ALIASES[String(month || "").trim().toLowerCase()] || 0;
}

function collectTimelineDateParts(item = {}) {
  const parts = [];
  const addPart = (year, month, day = 0) => {
    const parsedYear = yearSortValue(year);
    const parsedMonth = Number(month) || monthSortValue(month);
    const parsedDay = Number(day) || 0;
    if (!Number.isFinite(parsedYear) || !parsedMonth) return;
    parts.push({ year: parsedYear, month: parsedMonth, day: parsedDay });
  };
  const dateText = String(item.date || "");
  const searchText = [dateText, item.id, item.sourceUrl].filter(Boolean).join(" ");
  const isoDatePattern = /\b(19\d{2}|20\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/g;
  const monthDayYearPattern = new RegExp(`\\b(${MONTH_NAME_PATTERN})\\s+([0-2]?\\d|3[01]),?\\s+(19\\d{2}|20\\d{2})\\b`, "gi");
  const monthYearPattern = new RegExp(`\\b(${MONTH_NAME_PATTERN})\\s+(19\\d{2}|20\\d{2})\\b`, "gi");

  for (const match of searchText.matchAll(isoDatePattern)) {
    addPart(match[1], match[2], match[3]);
  }
  for (const match of dateText.matchAll(monthDayYearPattern)) {
    addPart(match[3], match[1], match[2]);
  }
  for (const match of dateText.matchAll(monthYearPattern)) {
    addPart(match[2], match[1]);
  }

  return parts;
}

function timelineSortParts(item = {}) {
  const itemYear = yearSortValue(item.year);
  const parts = collectTimelineDateParts(item);
  const matchingPart = parts.find((part) => part.year === itemYear) || parts[0];
  if (matchingPart) return matchingPart;

  const dateMonthMatch = String(item.date || "").match(new RegExp(`\\b(${MONTH_NAME_PATTERN})\\b`, "i"));
  return {
    year: itemYear,
    month: dateMonthMatch ? monthSortValue(dateMonthMatch[1]) : 0,
    day: 0
  };
}

function compareTimelineItems(a = {}, b = {}) {
  const aParts = timelineSortParts(a);
  const bParts = timelineSortParts(b);
  return bParts.year - aParts.year
    || bParts.month - aParts.month
    || bParts.day - aParts.day;
}

function setSeoMeta({
  title,
  description,
  url,
  image = HOME_SEO.image,
  imageAlt = HOME_SEO.imageAlt,
  imageWidth = HOME_SEO.imageWidth,
  imageHeight = HOME_SEO.imageHeight,
  type = "website",
  robots = "index, follow"
}) {
  document.title = title;
  $("#metaDescription").setAttribute("content", description);
  $("#robotsMeta").setAttribute("content", robots);
  $("#canonicalLink").setAttribute("href", url);
  $("#ogType").setAttribute("content", type);
  $("#ogTitle").setAttribute("content", title);
  $("#ogDescription").setAttribute("content", description);
  $("#ogUrl").setAttribute("content", url);
  $("#ogImage").setAttribute("content", absoluteUrl(image));
  $("#ogImageAlt").setAttribute("content", imageAlt);
  $("#ogImageWidth").setAttribute("content", imageWidth);
  $("#ogImageHeight").setAttribute("content", imageHeight);
  $("#twitterTitle").setAttribute("content", title);
  $("#twitterDescription").setAttribute("content", description);
  $("#twitterImage").setAttribute("content", absoluteUrl(image));
}

function renderHomeJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Turnpo",
        url: `${SITE_URL}/`,
        description: HOME_SEO.description
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Turnpo",
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: BRAND_ASSETS.logo,
          width: 512,
          height: 512
        },
        image: BRAND_ASSETS.socialImage,
        description: "Turnpo is a community for warm, real, owner-defined life profiles built from turning points, values, and meaningful work."
      }
    ]
  };
  $("#jsonLd").textContent = JSON.stringify(graph, null, 2);
}

function setRoute(route) {
  if (route === "home") {
    body.classList.remove("profile-open");
    body.classList.remove("admin-open");
    $("#entryView").hidden = false;
    $("#adminView").hidden = true;
    document.querySelectorAll(".profile-content").forEach((node) => { node.hidden = true; });
    history.pushState(null, "", "/");
    setSeoMeta({
      title: HOME_SEO.title,
      description: HOME_SEO.description,
      url: `${SITE_URL}/`,
      image: HOME_SEO.image,
      type: "website"
    });
    renderHomeJsonLd();
    renderHome();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  if (route === "admin") {
    body.classList.remove("profile-open");
    body.classList.add("admin-open");
    body.classList.toggle("owner-session", Boolean(ownerSessionProfile));
    $("#entryView").hidden = true;
    $("#adminView").hidden = false;
    document.querySelectorAll(".profile-content").forEach((node) => { node.hidden = true; });
    history.pushState(null, "", "/admin");
    setSeoMeta({
      title: "Admin Dashboard | Turnpo",
      description: "Read-only Turnpo account statistics and moderation dashboard.",
      url: `${SITE_URL}/admin`,
      image: HOME_SEO.image,
      type: "website",
      robots: "noindex, nofollow"
    });
    $("#jsonLd").textContent = "{}";
    renderAdminDashboard();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  const normalizedRoute = normalizeUsername(route);
  activeUsername = normalizedRoute && (profiles[normalizedRoute] || !seedProfiles[normalizedRoute])
    ? normalizedRoute
    : "leo";
  if (!ownerMode) loadPublicProfile(activeUsername);
  localStorage.setItem(ACTIVE_PROFILE_KEY, activeUsername);
  body.classList.add("profile-open");
  body.classList.remove("admin-open");
  $("#entryView").hidden = true;
  $("#adminView").hidden = true;
  document.querySelectorAll(".profile-content").forEach((node) => { node.hidden = false; });
  history.pushState(null, "", `/u/${activeUsername}`);
  renderProfile();
  if (ownerMode) loadDraftProfileOnline(activeUsername);
  else loadPublishedProfileOnline(activeUsername);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function routeFromLocation() {
  if (location.pathname === "/admin") return "admin";
  const pathMatch = location.pathname.match(/^\/u\/([^/]+)/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);
  const hashMatch = location.hash.match(/^#\/u\/([^/]+)/);
  if (hashMatch) return decodeURIComponent(hashMatch[1]);
  if (location.hash === "#leo") return "leo";
  return "home";
}

function profileSearchText(profile) {
  return [
    profile.displayName,
    profile.username,
    profile.oneLineIntro,
    profile.currentChapter,
    profile.location,
    ...profile.values,
    ...profile.themes,
    ...manualTravelPlaces(profile).flatMap((place) => [place.label, place.country]),
    ...publicStories(profile).flatMap((story) => [story.title, story.location, publicStorySummary(story)]),
    ...publicTimelineWorks(profile).flatMap((work) => [work.title, work.location, work.publicSummary, ...(work.tags || [])]),
    ...publicWorks(profile).flatMap((work) => [work.title, work.type, work.publicSummary, ...(work.tags || []), ...(work.toolsUsed || [])])
  ].join(" ").toLowerCase();
}

function searchProfiles(query = "") {
  const normalized = query.trim().toLowerCase();
  const all = publishedProfiles();
  if (!normalized) return all;
  return all.filter((profile) => profileSearchText(profile).includes(normalized));
}

function renderHome(query = "") {
  const normalizedQuery = query.trim();
  const results = normalizedQuery ? searchProfiles(normalizedQuery) : [];
  $("#searchResults").innerHTML = !normalizedQuery ? "" : results.length ? results.map((profile) => `
    <button class="person-result" type="button" data-profile="${profile.username}">
      <img src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.displayName)}" />
      <span>
        <strong>${escapeHtml(profile.displayName)}</strong>
        <small>@${escapeHtml(profile.username)} · ${escapeHtml(profile.location)} · ${escapeHtml(profile.themes.slice(0, 3).join(", "))}</small>
      </span>
    </button>
  `).join("") : `<p class="empty-result">No published Turnpo profile matched that search</p>`;

  $("#exampleProfiles").innerHTML = [
    ["Real story", "Meet someone through the moments that changed their direction"],
    ["AI-readable context", "A structured profile designed for AI tools to read, copy, and understand"],
    ["Beyond the resume", "The story behind the title, career path, and work"]
  ].map(([title, summary]) => `
    <article class="mini-profile-card">
      <span class="mini-profile-icon" aria-hidden="true"></span>
      <h3>${title}</h3>
      <p>${summary}</p>
    </article>
  `).join("");
}

function renderProfile() {
  const profile = currentProfile();
  const profileUrl = `${SITE_URL}/u/${profile.username}`;
  const profileTitle = `${profile.displayName} - Turning Point Profile | Turnpo`;
  const profileDescription = `${profile.oneLineIntro} Explore the turning points, values, and public work ${profile.displayName} has chosen to share.`;
  setSeoMeta({
    title: profileTitle,
    description: profileDescription,
    url: profileUrl,
    image: profile.avatar || HOME_SEO.image,
    imageAlt: `${profile.displayName} profile portrait on Turnpo`,
    imageWidth: "1024",
    imageHeight: "1536",
    type: "profile"
  });
  $("#profileName").textContent = profile.displayName;
  $("#profileUsername").textContent = `@${profile.username}`;
  $("#profileIntro").textContent = profile.oneLineIntro;
  $("#profileChapter").textContent = profile.currentChapter;
  $("#profileLocation").textContent = profile.location;
  $("#profileAvatar").src = profile.avatar;
  $("#profileAvatar").alt = `${profile.displayName} portrait`;
  $("#profileAvatar").style.setProperty("--avatar-y", `${profile.avatarPositionY}%`);
  renderPersistenceStatus();
  $("#profileLinks").innerHTML = publicWorkLinks(profile).map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`).join("");
  const aiProfile = generateAiProfile(profile);
  $("#aiMarkdown").value = aiProfile;
  $("#publicAiMarkdown").value = aiProfile;
  $("#publicAiPreview").textContent = buildPublicAiPreview(profile);
  renderTravelMap();
  renderTimeline();
  renderWorkProjects();
  renderJsonLd(profile);
}

function buildPublicAiPreview(profile) {
  const highlightedEvents = publicTimelineItems(profile)
    .slice(0, 3)
    .map((story) => `- ${story.year}: ${story.title}`);
  const works = publicWorks(profile).slice(0, 2).map((work) => work.title);
  return [
    `# ${profile.displayName}`,
    `@${profile.username} | ${profile.location}`,
    "",
    `> ${profile.oneLineIntro}`,
    "",
    "## Timeline",
    ...(highlightedEvents.length ? highlightedEvents : ["- Public milestones available in profile"]),
    "",
    `Projects: ${works.length ? works.join(" / ") : "curated projects"}`
  ].join("\n");
}

async function adminApi(path) {
  const response = await fetch(path, { credentials: "same-origin" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Admin access is not available.");
  return data;
}

async function renderAdminDashboard() {
  if (!$("#adminView") || $("#adminView").hidden) return;
  const error = $("#adminError");
  const accessPanel = $("#adminAccess");
  const metrics = $("#adminMetrics");
  const usersTable = $("#adminUsers");
  error.hidden = true;
  error.textContent = "";
  accessPanel.innerHTML = "";
  metrics.innerHTML = `<div class="admin-metric"><span>Status</span><strong>Loading</strong></div>`;
  usersTable.innerHTML = "";
  try {
    const [summary, usersData] = await Promise.all([
      adminApi("/api/admin/summary"),
      adminApi("/api/admin/users")
    ]);
    renderAdminAccess(summary.viewer || usersData.viewer || {});
    const metricRows = [
      ["Total accounts", summary.totalAccounts],
      ["New today", summary.newAccountsToday],
      ["New this week", summary.newAccountsThisWeek],
      ["Published profiles", summary.publishedProfilesCount],
      ["Draft/private profiles", summary.draftPrivateProfilesCount],
      ["Disabled/deleted", summary.disabledDeletedAccounts]
    ];
    metrics.innerHTML = metricRows.map(([label, value]) => `
      <div class="admin-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value ?? 0))}</strong></div>
    `).join("");
    const users = Array.isArray(usersData.users) ? usersData.users : [];
    usersTable.innerHTML = users.length ? users.map((user) => `
      <tr>
        <td>${escapeHtml(shortId(user.id))}</td>
        <td>${escapeHtml(user.email || "")}</td>
        <td><strong>@${escapeHtml(user.username || "")}</strong></td>
        <td>${escapeHtml(user.displayName || "")}</td>
        <td>${escapeHtml(formatDateTime(user.createdAt))}</td>
        <td>${escapeHtml(formatDateTime(user.lastLoginAt))}</td>
        <td>${user.publicProfileUrl ? `<a href="${escapeHtml(user.publicProfileUrl)}" target="_blank" rel="noopener">Open</a>` : ""}</td>
        <td>${escapeHtml(user.profileVisibility || "")}</td>
        <td>${escapeHtml(user.roleLabel || user.role || "User")}</td>
        <td>${escapeHtml(scopeSummary(user.managementAreas || user.scopes || []))}</td>
      </tr>
    `).join("") : `<tr><td colspan="10">No user records yet. Accounts will appear after login or registration.</td></tr>`;
  } catch (adminError) {
    accessPanel.innerHTML = "";
    metrics.innerHTML = "";
    error.hidden = false;
    error.textContent = hasAdminAccess()
      ? adminError.message
      : `${adminError.message} Log in with an admin account to view this dashboard.`;
  }
}

function renderAdminAccess(viewer = {}) {
  const accessPanel = $("#adminAccess");
  if (!accessPanel) return;
  const areas = Array.isArray(viewer.managementAreas) ? viewer.managementAreas : [];
  const scopes = Array.isArray(viewer.scopes) ? viewer.scopes : [];
  accessPanel.innerHTML = `
    <div>
      <span>Current role</span>
      <strong>${escapeHtml(viewer.label || viewer.role || "Admin")}</strong>
      <small>${viewer.readOnly === false ? "Write actions enabled" : "Read-only management"}</small>
    </div>
    <div>
      <span>Management scope</span>
      <ul>
        ${(areas.length ? areas : ["Admin dashboard access"]).map((area) => `<li>${escapeHtml(area)}</li>`).join("")}
      </ul>
    </div>
    <div>
      <span>Server scopes</span>
      <small>${escapeHtml(scopes.length ? scopes.join(" · ") : "admin:read")}</small>
    </div>
  `;
}

function scopeSummary(values = []) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];
  if (!list.length) return "Own profile";
  return list.slice(0, 2).join(" / ") + (list.length > 2 ? ` +${list.length - 2}` : "");
}

function hasAdminAccess() {
  return userSessionScopes.includes("admin:read") || userSessionRole === "admin";
}

function shortId(value = "") {
  return String(value || "").slice(0, 10);
}

function formatDateTime(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function groupedStories(profile = currentProfile()) {
  return timelineStories(profile).reduce((groups, story) => {
    const year = story.year || "Undated";
    if (!groups[year]) groups[year] = [];
    groups[year].push(story);
    return groups;
  }, {});
}

function collapsedYearsKey(username = activeUsername) {
  return `${COLLAPSED_YEARS_PREFIX}${username}`;
}

function collapsedYearsDefaultKey(username = activeUsername) {
  return `${COLLAPSED_YEARS_DEFAULT_PREFIX}${username}`;
}

function loadCollapsedYears() {
  try {
    return new Set(JSON.parse(localStorage.getItem(collapsedYearsKey()) || "[]"));
  } catch {
    return new Set();
  }
}

function saveCollapsedYears(collapsedYears) {
  localStorage.setItem(collapsedYearsKey(), JSON.stringify([...collapsedYears]));
}

function defaultCollapsedYears(years) {
  const stateYears = normalizeIdList(currentProfile().publicState?.collapsedYears);
  return new Set(stateYears.length ? stateYears : years.slice(1));
}

function syncDefaultCollapsedYears(years) {
  if (ownerMode) return loadCollapsedYears();
  const defaults = defaultCollapsedYears(years);
  const signature = JSON.stringify([...defaults]);
  if (localStorage.getItem(collapsedYearsDefaultKey()) !== signature) {
    saveCollapsedYears(defaults);
    localStorage.setItem(collapsedYearsDefaultKey(), signature);
    return defaults;
  }
  return loadCollapsedYears();
}

function setTimelineYearCollapsed(year, collapsed) {
  const collapsedYears = loadCollapsedYears();
  if (collapsed) collapsedYears.add(year);
  else collapsedYears.delete(year);
  saveCollapsedYears(collapsedYears);
  renderTimeline();
}

function setAllTimelineYearsCollapsed(collapsed) {
  const years = Object.keys(groupedStories()).sort((a, b) => yearSortValue(b) - yearSortValue(a));
  saveCollapsedYears(collapsed ? new Set(years) : new Set());
  renderTimeline();
}

function statusPill(item) {
  const labels = { published: "visible", hidden: "hidden", deleted: "deleted" };
  return ownerMode ? `<span class="visibility-pill status-${escapeHtml(item.status)}">${escapeHtml(labels[item.status] || item.status)}</span>` : "";
}

function isSourceOnlyText(value = "") {
  const text = String(value).trim();
  if (!text) return false;
  return /^https?:\/\/(www\.)?linkedin\.com\/\S+$/i.test(text)
    || /^https?:\/\/lnkd\.in\/\S+$/i.test(text)
    || /^https?:\/\/\S+$/i.test(text);
}

function publicStorySummary(story) {
  return isSourceOnlyText(story.publicSummary) ? "" : story.publicSummary;
}

function renderOwnerContentControls() {
  if (!ownerMode) return;
  const counts = ownerStoryCounts();
  document.querySelectorAll("[data-owner-view]").forEach((button) => {
    const view = button.dataset.ownerView;
    button.classList.toggle("active", view === ownerTimelineView);
    button.textContent = `${view === "published" ? "Visible" : view[0].toUpperCase() + view.slice(1)} ${counts[view] || 0}`;
  });
  $("#emptyDeleted").hidden = ownerTimelineView !== "deleted" || !counts.deleted;
}

function renderCategoryControls() {
  document.querySelectorAll("[data-category-filter]").forEach((button) => {
    const filter = button.dataset.categoryFilter;
    button.classList.toggle("active", filter === activeCategoryFilter);
    button.setAttribute("aria-pressed", String(filter === activeCategoryFilter));
  });
}

function storyActions(story) {
  if (!ownerMode) return "";
  if (story.status === "deleted") {
    return `${statusPill(story)}<button class="small-action" type="button" data-restore-type="story" data-restore-id="${escapeHtml(story.id)}">Restore</button><button class="small-action danger-action" type="button" data-permanent-delete-type="story" data-permanent-delete-id="${escapeHtml(story.id)}">Delete forever</button><button class="small-action" type="button" data-edit-type="story" data-edit-id="${escapeHtml(story.id)}">Edit</button>`;
  }
  const toggleAction = story.status === "published"
    ? `<button class="small-action" type="button" data-hide-type="story" data-hide-id="${escapeHtml(story.id)}">Hide</button>`
    : `<button class="small-action" type="button" data-publish-type="story" data-publish-id="${escapeHtml(story.id)}">Publish</button>`;
  return `${statusPill(story)}${toggleAction}<button class="small-action danger-action" type="button" data-delete-type="story" data-delete-id="${escapeHtml(story.id)}">Delete</button><button class="small-action" type="button" data-edit-type="story" data-edit-id="${escapeHtml(story.id)}">Edit</button>`;
}

function workActions(work) {
  if (!ownerMode) return "";
  if (work.status === "deleted") {
    return `${statusPill(work)}<button class="small-action" type="button" data-restore-type="work" data-restore-id="${escapeHtml(work.id)}">Restore</button><button class="small-action danger-action" type="button" data-permanent-delete-type="work" data-permanent-delete-id="${escapeHtml(work.id)}">Delete forever</button><button class="small-action" type="button" data-edit-type="work" data-edit-id="${escapeHtml(work.id)}">Edit</button>`;
  }
  const toggleAction = work.status === "published"
    ? `<button class="small-action" type="button" data-hide-type="work" data-hide-id="${escapeHtml(work.id)}">Hide</button>`
    : `<button class="small-action" type="button" data-publish-type="work" data-publish-id="${escapeHtml(work.id)}">Publish</button>`;
  return `${statusPill(work)}${toggleAction}<button class="small-action danger-action" type="button" data-delete-type="work" data-delete-id="${escapeHtml(work.id)}">Delete</button><button class="small-action" type="button" data-edit-type="work" data-edit-id="${escapeHtml(work.id)}">Edit</button>`;
}

function imageValueType(value) {
  if (!value) return "";
  if (value.startsWith("data:image/")) return "Uploaded image";
  if (value.startsWith("/api/profiles/") && value.includes("/media/")) return "Online media image";
  if (value.startsWith("/assets/")) return "Saved site image";
  return "Linked image";
}

function storyImagesFromValue(value = "") {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value ? [value] : [];
  }
}

function renderImageUpload(value = []) {
  const images = Array.isArray(value) ? value.filter(Boolean) : storyImagesFromValue(value);
  $("#contentImage").value = JSON.stringify(images);
  const preview = $("#contentImagePreview");
  const title = $("#contentImageTitle");
  const hint = $("#contentImageHint");
  const removeButton = $("#removeContentImage");
  const gallery = $("#contentImageGallery");
  const cover = images[0] || "";
  preview.innerHTML = cover ? `<img src="${escapeHtml(cover)}" alt="" />` : "";
  preview.classList.toggle("has-image", Boolean(cover));
  title.textContent = cover ? `${images.length} image${images.length === 1 ? "" : "s"} selected` : "Drop, paste, or choose images";
  hint.textContent = cover ? "The first image is the cover. Drop, paste, or choose more images to add them." : "The first image becomes the cover. Other images appear after opening the story.";
  removeButton.hidden = !images.length;
  gallery.innerHTML = images.map((image, index) => `
    <div class="image-thumb ${index === 0 ? "is-cover" : ""}">
      <img src="${escapeHtml(image)}" alt="" />
      <span>${index === 0 ? "Cover" : `Photo ${index + 1}`}</span>
      <button class="small-action" type="button" data-remove-image="${index}">Remove</button>
    </div>
  `).join("");
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    image.src = url;
  });
}

async function optimizeImageFile(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const image = await fileToImage(file);
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function uploadImageToOnlineMedia(file) {
  const dataUrl = await optimizeImageFile(file);
  if (!ownerMode || !ownerSessionProfile) return { url: dataUrl, online: false };
  try {
    const data = await profileApi(`/api/profiles/${encodeURIComponent(activeUsername)}/uploads`, {
      method: "POST",
      body: {
        filename: file.name || "",
        contentType: "image/jpeg",
        dataUrl
      }
    });
    if (!data.url) throw new Error("Upload did not return an image URL.");
    return { url: data.url, online: true };
  } catch (error) {
    return { url: dataUrl, online: false, error };
  }
}

async function uploadImageFiles(files) {
  const uploaded = await Promise.all(files.map((file) => uploadImageToOnlineMedia(file)));
  return {
    urls: uploaded.map((item) => item.url).filter(Boolean),
    onlineCount: uploaded.filter((item) => item.online).length,
    fallbackError: uploaded.find((item) => item.error)?.error
  };
}

async function useImageFiles(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) return;
  try {
    $("#contentStatusNote").textContent = imageFiles.length === 1 ? "Uploading image..." : "Uploading images...";
    const result = await uploadImageFiles(imageFiles);
    renderImageUpload([...storyImagesFromValue($("#contentImage").value), ...result.urls]);
    $("#contentStatusNote").textContent = imageUploadStatusMessage(result, "Images ready. Remember to save content.");
  } catch (error) {
    $("#contentStatusNote").textContent = error.message;
  }
}

async function addImageFilesToStory(storyId, files) {
  if (!ownerMode || !storyId) return;
  const card = document.querySelector(`[data-content-id="${CSS.escape(storyId)}"]`);
  const story = findContent(card?.dataset.contentType || "story", storyId);
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!story || !imageFiles.length) return;
  try {
    card?.classList.add("is-uploading");
    const currentImages = story.images?.length ? story.images : (story.image ? [story.image] : []);
    const result = await uploadImageFiles(imageFiles);
    const nextImages = [...currentImages, ...result.urls];
    story.images = nextImages;
    story.image = nextImages[0] || "";
    story.updatedAt = new Date().toISOString();
    saveActiveProfile();
    renderProfile();
    setOwnerSaveStatus(imageUploadStatusMessage(result, "Images saved to current profile data and local draft."));
    saveProfileDraftOnline({ quiet: true });
  } catch (error) {
    card?.classList.remove("is-uploading");
    openEditor(card?.dataset.contentType || "story", storyId);
    $("#contentStatusNote").textContent = error.message;
  }
}

function imageUploadStatusMessage(result, successMessage) {
  if (!result.urls.length) return result.fallbackError?.message || "Image upload failed.";
  if (result.onlineCount === result.urls.length) return `${successMessage} Stored in online media storage.`;
  if (result.onlineCount > 0) return `${successMessage} Some images used local fallback because online media storage was not available.`;
  return `${successMessage} Local image fallback was used because online media storage was not available.`;
}

function imageFileFromPaste(event) {
  return [...(event.clipboardData?.items || [])]
    .find((item) => item.kind === "file" && item.type.startsWith("image/"))
    ?.getAsFile();
}

function dragHasFiles(event) {
  return [...(event.dataTransfer?.types || [])].includes("Files");
}

function renderPublicPhotoButton(image, alt, imageClass = "") {
  const classAttr = imageClass ? ` class="${escapeHtml(imageClass)}"` : "";
  return `<button class="event-photo-button" type="button" data-photo-preview="true" data-photo-alt="${escapeHtml(alt)}" aria-label="Open ${escapeHtml(alt)}">
    <img${classAttr} src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy" />
  </button>`;
}

function renderTimeline() {
  renderCategoryControls();
  renderOwnerContentControls();
  const groups = groupedStories();
  const years = Object.keys(groups).sort((a, b) => yearSortValue(b) - yearSortValue(a));
  const collapsedYears = syncDefaultCollapsedYears(years);
  $("#yearFilters").innerHTML = years.map((year) => `<button type="button" data-year="${year}">${year}</button>`).join("");
  const viewLabel = ownerMode ? ownerTimelineView : "published";
  $("#timelineList").innerHTML = years.length ? years.map((year) => `
    <article class="year-block ${collapsedYears.has(year) ? "is-collapsed" : ""}" id="timeline-year-${escapeHtml(year)}" tabindex="-1" data-year-block="${escapeHtml(year)}">
      <div class="year-label">${escapeHtml(year)}</div>
      <button class="year-title" type="button" data-toggle-year="${escapeHtml(year)}" aria-expanded="${collapsedYears.has(year) ? "false" : "true"}" aria-controls="timeline-events-${escapeHtml(year)}">
        <span class="year-caret" aria-hidden="true"></span>
        <strong>${escapeHtml(year)}</strong>
        <span>${groups[year].length} ${viewLabel === "published" ? "visible" : viewLabel} item${groups[year].length === 1 ? "" : "s"}</span>
      </button>
      <div class="event-stack" id="timeline-events-${escapeHtml(year)}">
        ${groups[year].map((story) => {
          const itemType = typeForContent(story);
          const category = story.category || "life";
          const categoryLabel = CATEGORY_LABELS[category] || "Life";
          const storyImages = story.images?.length ? story.images : (story.image ? [story.image] : []);
          const coverImage = storyImages[0] || "";
          const extraImages = storyImages.slice(1);
          const coverAlt = story.title;
          const summary = ownerMode ? story.publicSummary : publicStorySummary(story);
          return `
          <article class="event-card ${coverImage ? "has-media" : "no-media"} ${story.status !== "published" ? "private-card" : ""} status-${escapeHtml(story.status)}" data-content-id="${escapeHtml(story.id)}" data-content-type="${escapeHtml(itemType)}">
            <div class="event-media">${coverImage ? (ownerMode ? `<img class="event-main-image" src="${escapeHtml(coverImage)}" alt="${escapeHtml(coverAlt)}" />` : renderPublicPhotoButton(coverImage, coverAlt, "event-main-image")) : `<div class="empty-media" aria-label="No image yet"></div>`}</div>
            <div>
              <div class="event-card-head">
                <div class="event-date">${escapeHtml([categoryLabel, story.date, story.location].filter(Boolean).join(" - "))}</div>
                <div class="event-actions owner-only">${itemType === "work" ? workActions(story) : storyActions(story)}</div>
              </div>
              <h3>${escapeHtml(story.title)}</h3>
              ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
              ${extraImages.length ? `<details class="event-gallery"><summary>View ${extraImages.length} more photo${extraImages.length === 1 ? "" : "s"}</summary><div>${extraImages.map((image, index) => {
                const photoAlt = `${story.title} photo ${index + 2}`;
                return ownerMode ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(photoAlt)}" loading="lazy" />` : renderPublicPhotoButton(image, photoAlt);
              }).join("")}</div></details>` : ""}
              ${story.link ? `<a class="source-link" href="${escapeHtml(story.link)}" target="_blank" rel="noopener">Open link</a>` : ""}
              ${story.tags?.length ? `<div class="tag-row">${story.tags.slice(0, 3).map((tag) => `<span class="timeline-tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
            </div>
          </article>
        `; }).join("")}
      </div>
    </article>
  `).join("") : `<p class="empty-result">No ${activeCategoryFilter === "all" ? "" : `${CATEGORY_LABELS[activeCategoryFilter]} `}${ownerMode ? (ownerTimelineView === "published" ? "visible" : ownerTimelineView) : "published"} items yet</p>`;
}

function renderWorkProjects() {
  const projects = ownerMode ? currentProfile().aiWorks : publicWorks();
  $("#ai-works").hidden = !ownerMode && !projects.length;
  $("#aiWorksList").innerHTML = projects.length ? projects.map((work) => `
    <article class="work-card ${work.status !== "published" ? "private-card" : ""}">
      <div class="work-card-head">
        <div><h3>${escapeHtml(work.title)}</h3></div>
        ${ownerMode ? `<div class="event-actions">${workActions(work)}</div>` : ""}
      </div>
      <p>${escapeHtml(work.publicSummary)}</p>
      ${work.link ? `<a class="work-link-action" href="${escapeHtml(work.link)}" target="_blank" rel="noopener">Open link</a>` : ""}
    </article>
  `).join("") : `<p class="empty-result">No Work / Projects yet</p>`;
}

function generateAiProfile(profile) {
  const stories = publicTimelineItems(profile);
  const works = publicWorks(profile);
  const workLinks = publicWorkLinks(profile);
  return `# ${profile.displayName}

Username: @${profile.username}
Location: ${profile.location}

## One-line summary
${profile.oneLineIntro}

## Current chapter
${profile.currentChapter}

## Values and themes
${[...profile.values, ...profile.themes].map((item) => `- ${item}`).join("\n")}

## Public timeline highlights
${stories.length ? stories.map((story) => `- ${story.year}: ${story.title} (${story.location || "location not specified"})${publicStorySummary(story) ? ` - ${publicStorySummary(story)}` : ""}`).join("\n") : "- No published stories yet"}

## Public work
${works.length ? works.map((work) => `- ${work.year || "Undated"}: ${work.title}${work.location ? ` (${work.location})` : ""} - ${work.publicSummary}${work.link ? ` [Open link](${work.link})` : ""}`).join("\n") : "- No published work yet"}

## Public links
${workLinks.length ? workLinks.map((link) => `- [${link.label}](${link.url})`).join("\n") : "- No public links yet"}

## Suggested questions for AI-assisted review
- What shaped this person beyond their job title?
- What are they building in the AI era?
- Which values and themes appear across their public stories?

Only published and user-approved Turnpo content is included in this AI-readable profile.`;
}

function renderJsonLd(profile) {
  const profileUrl = `${SITE_URL}/u/${profile.username}`;
  const stories = publicTimelineItems(profile);
  const works = publicWorks(profile);
  const workLinks = publicWorkLinks(profile);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${profileUrl}#profile-page`,
        url: profileUrl,
        name: `${profile.displayName} on Turnpo`,
        description: `${profile.oneLineIntro} Turnpo profiles are owner-defined life profiles built from public turning points, values, and meaningful work.`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": `${profileUrl}#person` }
      },
      {
        "@type": "Person",
        "@id": `${profileUrl}#person`,
        name: profile.displayName,
        alternateName: `@${profile.username}`,
        url: profileUrl,
        image: absoluteUrl(profile.avatar),
        description: profile.oneLineIntro,
        homeLocation: profile.location ? { "@type": "Place", name: profile.location } : undefined,
        knowsAbout: [...profile.values, ...profile.themes],
        sameAs: workLinks.map((link) => link.url),
        subjectOf: [
          ...stories.map((story) => ({
            "@type": "CreativeWork",
            name: story.title,
            dateCreated: String(story.year),
            description: publicStorySummary(story) || undefined,
            image: absoluteUrl(story.image || story.images?.[0] || "")
          })),
          ...works.map((work) => ({
            "@type": "CreativeWork",
            name: work.title,
            description: work.publicSummary,
            url: work.link || undefined
          }))
        ]
      }
    ]
  };
  $("#jsonLd").textContent = JSON.stringify(graph, null, 2);
}

function setOwnerMode(enabled) {
  ownerMode = enabled;
  ownerTimelineView = "published";
  if (enabled) loadOwnerProfile(activeUsername);
  else loadPublicProfile(activeUsername);
  body.classList.toggle("owner-mode", enabled);
  if (body.classList.contains("profile-open")) renderProfile();
  else renderHome($("#personSearch").value);
  if (enabled) loadDraftProfileOnline(activeUsername);
  else loadPublishedProfileOnline(activeUsername);
}

function setUserSessionState(session = {}) {
  userSessionRole = session.role || "";
  userSessionEmail = session.email || "";
  userSessionScopes = Array.isArray(session.scopes) ? session.scopes : [];
  const sessionProfile = session.profile || ownerSessionProfile || "";
  body.classList.toggle("authenticated", Boolean(session.authenticated || userSessionEmail));
  body.classList.toggle("owner-session", Boolean(sessionProfile));
  body.classList.toggle("admin-session", hasAdminAccess());
}

function enterOwnerMode(profileUsername = ownerSessionProfile || activeUsername) {
  if (profileUsername && !profiles[profileUsername]) {
    profiles[profileUsername] = starterProfile({ username: profileUsername, displayName: profileUsername });
  }
  if (profiles[profileUsername]) activeUsername = profileUsername;
  if (profileUsername) {
    ownerSessionProfile = profileUsername;
    body.classList.add("owner-session");
  }
  setOwnerMode(true);
  setRoute(activeUsername);
}

function defaultStoryDate() {
  const today = new Date();
  return {
    year: String(today.getFullYear()),
    month: MONTH_NAMES[today.getMonth()]
  };
}

function parseStoryDate(item) {
  const fallback = defaultStoryDate();
  const year = String(item?.year || "").trim() || fallback.year;
  const date = String(item?.date || "").trim();
  const month = MONTH_NAMES.find((monthName) => new RegExp(`\\b${monthName}\\b`, "i").test(date)) || fallback.month;
  return { year, month };
}

function storyDateValue(year, month) {
  if (!year || !month) return "";
  return `${month} ${year}`;
}

function renderContentDateOptions() {
  const yearSelect = $("#contentYear");
  const monthSelect = $("#contentMonth");
  if (!yearSelect || !monthSelect) return;
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = "";
  for (let year = currentYear + 1; year >= 1990; year -= 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  }
  monthSelect.innerHTML = MONTH_NAMES.map((month) => `<option value="${month}">${month}</option>`).join("");
  const fallback = defaultStoryDate();
  yearSelect.value = fallback.year;
  monthSelect.value = fallback.month;
}

function renderLocationOptions() {
  const list = $("#locationOptions");
  if (!list) return;
  const profileCities = currentProfile().lifeStories.map((story) => String(story.location || "").trim()).filter(Boolean);
  const atlasCities = TRAVEL_PLACES.filter((place) => place.type === "city").map((place) => place.label);
  const cities = [...new Set([...CITY_OPTIONS, ...atlasCities, ...profileCities])].sort((a, b) => a.localeCompare(b));
  list.innerHTML = cities.map((city) => `<option value="${escapeHtml(city)}"></option>`).join("");
}

function openEditor(type, id = "") {
  if (!ownerMode) {
    setAuthDrawer(true);
    return;
  }
  activeEditorType = type;
  editingRef = id ? { type, id } : null;
  const item = id ? findContent(type, id) : null;
  const categoryLabel = type === "work" ? "Work" : "Life";
  $("#contentModeLabel").textContent = item ? `Edit ${categoryLabel}` : `New ${categoryLabel}`;
  $("#contentFormTitle").textContent = item ? "Update content" : `Add ${categoryLabel}`;
  $("#contentType").value = type;
  $("#contentTitle").value = item?.title || "";
  const storyDate = parseStoryDate(item);
  $("#contentYear").value = storyDate.year;
  $("#contentMonth").value = storyDate.month;
  $("#contentLocation").value = item?.location || "";
  renderLocationOptions();
  renderImageUpload(item?.images || (item?.image ? [item.image] : []));
  $("#contentStatus").value = item?.status || "hidden";
  $("#contentSummary").value = item?.publicSummary || "";
  $("#contentWhy").value = item?.whyItMatters || item?.whyMade || "";
  $("#contentTags").value = (item?.tags || []).join(", ");
  $("#workType").value = item?.type || "";
  $("#workTools").value = (item?.toolsUsed || []).join(", ");
  $("#humanRole").value = item?.humanRole || "";
  $("#aiRole").value = item?.aiRole || "";
  $("#workResult").value = item?.result || "";
  $("#workLink").value = item?.link || "";
  $("#deleteContent").hidden = !item;
  $("#contentStatusNote").textContent = "";
  $("#contentDrawer").classList.add("open");
  $("#contentDrawer").setAttribute("aria-hidden", "false");
  toggleWorkFields(type);
}

function closeEditor() {
  $("#contentDrawer").classList.remove("open");
  $("#contentDrawer").setAttribute("aria-hidden", "true");
  editingRef = null;
}

function formatProfileLinks(links = []) {
  return links.map((link) => `${link.label || ""} | ${link.url || ""}`).join("\n");
}

function parseProfileLinks(value = "") {
  return value.split("\n").map((line) => {
    const [label, ...urlParts] = line.split("|");
    return {
      label: label.trim(),
      url: urlParts.join("|").trim()
    };
  }).filter((link) => link.label && link.url);
}

function openProfileEditor() {
  if (!ownerMode) {
    setAuthDrawer(true);
    return;
  }
  const profile = currentProfile();
  $("#profileEditName").value = profile.displayName || "";
  $("#profileEditUsername").value = profile.username || "";
  $("#profileEditIntro").value = profile.oneLineIntro || "";
  $("#profileEditChapter").value = profile.currentChapter || "";
  $("#profileEditLocation").value = profile.location || "";
  $("#profileEditAvatar").value = profile.avatar || "";
  $("#profileEditAvatarY").value = profile.avatarPositionY ?? 24;
  $("#profileEditLinks").value = formatProfileLinks(profile.links);
  $("#profileStatusNote").textContent = "";
  renderLocationOptions();
  $("#profileDrawer").classList.add("open");
  $("#profileDrawer").setAttribute("aria-hidden", "false");
}

function closeProfileEditor() {
  $("#profileDrawer").classList.remove("open");
  $("#profileDrawer").setAttribute("aria-hidden", "true");
}

function saveProfileText(event) {
  event.preventDefault();
  const profile = currentProfile();
  const nextUsername = profile.username;
  const nextProfile = normalizeProfile({
    ...profile,
    username: nextUsername,
    displayName: $("#profileEditName").value.trim(),
    oneLineIntro: $("#profileEditIntro").value.trim(),
    currentChapter: $("#profileEditChapter").value.trim(),
    location: $("#profileEditLocation").value.trim(),
    avatar: $("#profileEditAvatar").value.trim() || profile.avatar,
    avatarPositionY: Number($("#profileEditAvatarY").value),
    links: parseProfileLinks($("#profileEditLinks").value)
  });
  if (!nextProfile.displayName || !nextProfile.username || !nextProfile.oneLineIntro || !nextProfile.currentChapter) {
    $("#profileStatusNote").textContent = "Name, username, headline, and current chapter are required.";
    return;
  }
  const previousUsername = activeUsername;
  if (nextProfile.username !== previousUsername && profiles[nextProfile.username]) {
    $("#profileStatusNote").textContent = "That username already exists.";
    return;
  }
  delete profiles[previousUsername];
  profiles[nextProfile.username] = nextProfile;
  activeUsername = nextProfile.username;
  localStorage.removeItem(localKey(previousUsername));
  saveActiveProfile();
  localStorage.setItem(ACTIVE_PROFILE_KEY, activeUsername);
  closeProfileEditor();
  renderProfile();
  setOwnerSaveStatus("Profile text saved to current profile data and local draft. Saving online draft...");
  saveProfileDraftOnline({ quiet: false });
}

function toggleWorkFields(type) {
  document.querySelectorAll(".work-only").forEach((node) => { node.hidden = true; });
  document.querySelectorAll(".story-only").forEach((node) => { node.hidden = false; });
}

function findContent(type, id) {
  return findContentEntry(type, id)?.item || null;
}

async function upsertContent(event) {
  event.preventDefault();
  const type = $("#contentType").value;
  const status = $("#contentStatus").value;
  const wantsPublish = status === "published";
  const now = new Date().toISOString();
  const existingItem = editingRef ? findContent(editingRef.type, editingRef.id) : null;
  const base = normalizeContent({
    ...(existingItem || {}),
    id: editingRef?.id || `${type}-${crypto.randomUUID()}`,
    category: CONTENT_CATEGORY[type],
    title: $("#contentTitle").value.trim(),
    year: $("#contentYear").value.trim(),
    date: storyDateValue($("#contentYear").value.trim(), $("#contentMonth").value.trim()),
    location: $("#contentLocation").value.trim(),
    image: storyImagesFromValue($("#contentImage").value)[0] || "",
    images: storyImagesFromValue($("#contentImage").value),
    link: $("#workLink").value.trim(),
    publicSummary: $("#contentSummary").value.trim(),
    type: type === "work" ? $("#workType").value.trim() : "",
    whyMade: type === "work" ? $("#contentWhy").value.trim() : "",
    whyItMatters: type === "work" ? $("#contentWhy").value.trim() : "",
    toolsUsed: type === "work" ? parseList($("#workTools").value) : [],
    humanRole: type === "work" ? $("#humanRole").value.trim() : "",
    aiRole: type === "work" ? $("#aiRole").value.trim() : "",
    result: type === "work" ? $("#workResult").value.trim() : "",
    tags: parseList($("#contentTags").value),
    ownerEdited: true,
    ownerEditedAt: now,
    status,
    userApproved: wantsPublish,
    updatedAt: now,
    publishedAt: wantsPublish ? now : "",
    unpublishedAt: status === "hidden" ? now : "",
    deletedAt: status === "deleted" ? now : ""
  }, type);
  if (!base.title || !base.publicSummary) {
    $("#contentStatusNote").textContent = "Title and details are required.";
    return;
  }
  if (wantsPublish && !(await requestPublishConfirmation())) {
    $("#contentStatusNote").textContent = "Publication cancelled. Choose Hidden to save without publishing.";
    return;
  }
  const collection = contentCollection(type, existingItem?.id || "");
  const existingIndex = collection.findIndex((item) => item.id === base.id);
  const nextItem = { ...base };
  if (existingIndex >= 0) collection[existingIndex] = nextItem;
  else collection.unshift(nextItem);
  syncPublicStateForItem(currentProfile(), type, nextItem);
  saveActiveProfile();
  renderProfile();
  closeEditor();
  setOwnerSaveStatus("Content saved to current profile data and local draft. Saving online draft...");
  saveProfileDraftOnline({ quiet: true }).then(() => {
    if (nextItem.status === "published") publishProfileOnline({ quiet: false });
    else setOwnerSaveStatus("Content saved to online draft. Use Publish online when ready for other devices.");
  });
}

function deleteCurrentContent() {
  if (!editingRef) return;
  deleteContentById(editingRef.type, editingRef.id);
  closeEditor();
}

function deleteContentById(type, id) {
  const item = findContent(type, id);
  if (item) {
    item.previousStatus = item.status === "deleted" ? item.previousStatus || "hidden" : item.status;
    item.status = "deleted";
    item.userApproved = false;
    item.deletedAt = new Date().toISOString();
    item.updatedAt = item.deletedAt;
    syncPublicStateForItem(currentProfile(), type, item);
  }
  saveActiveProfile();
  renderProfile();
  setOwnerSaveStatus("Content moved to deleted state. Updating online draft and published profile...");
  saveProfileDraftOnline({ quiet: true }).then(() => publishProfileOnline({ quiet: false }));
}

async function setContentStatus(type, id, status) {
  const item = findContent(type, id);
  if (!item || !STATUSES.includes(status)) return;
  if (status === "published" && !(await requestPublishConfirmation())) return;
  const now = new Date().toISOString();
  item.status = status;
  item.userApproved = status === "published";
  item.ownerReviewed = true;
  item.ownerReviewedAt = now;
  item.updatedAt = now;
  if (status === "published") item.publishedAt = now;
  if (status === "hidden") item.unpublishedAt = now;
  if (status !== "deleted") item.deletedAt = "";
  syncPublicStateForItem(currentProfile(), type, item);
  saveActiveProfile();
  renderProfile();
  setOwnerSaveStatus("Content status saved locally. Updating online draft and published profile...");
  saveProfileDraftOnline({ quiet: true }).then(() => publishProfileOnline({ quiet: false }));
}

function restoreContentById(type, id) {
  const item = findContent(type, id);
  if (!item || item.status !== "deleted") return;
  const restoreStatus = item.previousStatus === "published" ? "published" : "hidden";
  delete item.previousStatus;
  setContentStatus(type, id, restoreStatus);
}

function permanentlyDeleteContentById(type, id) {
  const entry = findContentEntry(type, id);
  if (entry) entry.collection.splice(entry.index, 1);
  syncPublicStateFromContent();
  saveActiveProfile();
  renderProfile();
  setOwnerSaveStatus("Content permanently removed locally. Updating online draft and published profile...");
  saveProfileDraftOnline({ quiet: true }).then(() => publishProfileOnline({ quiet: false }));
}

function emptyDeletedStories() {
  currentProfile().lifeStories = currentProfile().lifeStories.filter((story) => story.status !== "deleted");
  syncPublicStateFromContent();
  saveActiveProfile();
  renderProfile();
  setOwnerSaveStatus("Deleted stories cleared locally. Updating online draft and published profile...");
  saveProfileDraftOnline({ quiet: true }).then(() => publishProfileOnline({ quiet: false }));
}

function setAuthDrawer(open) {
  $("#authDrawer").classList.toggle("open", open);
  $("#authDrawer").setAttribute("aria-hidden", String(!open));
  if (open && !authCodeRequested) $("#ownerEmail").focus();
}

function setRegistrationDrawer(open) {
  $("#registrationDrawer").classList.toggle("open", open);
  $("#registrationDrawer").setAttribute("aria-hidden", String(!open));
  if (!open) resetRegistrationForm();
  if (open) $("#registerName").focus();
}

function setAiImportDrawer(open) {
  $("#aiImportDrawer").classList.toggle("open", open);
  $("#aiImportDrawer").setAttribute("aria-hidden", String(!open));
  if (open) $("#aiImportSource").focus();
}

function openImageLightbox(src, alt = "Turnpo photo") {
  $("#imageLightboxPhoto").src = src;
  $("#imageLightboxPhoto").alt = alt;
  $("#imageLightboxCaption").textContent = alt;
  $("#imageLightbox").classList.add("open");
  $("#imageLightbox").setAttribute("aria-hidden", "false");
  $("#closeImageLightbox").focus();
}

function closeImageLightbox() {
  $("#imageLightbox").classList.remove("open");
  $("#imageLightbox").setAttribute("aria-hidden", "true");
  $("#imageLightboxPhoto").removeAttribute("src");
  $("#imageLightboxCaption").textContent = "";
}

function closePublishConfirmation(confirmed = false) {
  $("#publishConfirmation").classList.remove("open");
  $("#publishConfirmation").setAttribute("aria-hidden", "true");
  $("#publishConfirmationConsent").checked = false;
  $("#publishConfirmationNote").textContent = "";
  const resolver = publishConfirmationResolver;
  publishConfirmationResolver = null;
  if (resolver) resolver(confirmed);
}

function requestPublishConfirmation() {
  if (publishConfirmationResolver) closePublishConfirmation(false);
  $("#publishConfirmation").classList.add("open");
  $("#publishConfirmation").setAttribute("aria-hidden", "false");
  $("#publishConfirmationConsent").focus();
  return new Promise((resolve) => {
    publishConfirmationResolver = resolve;
  });
}

function recordPublicationAcknowledgement() {
  const profile = currentProfile();
  profile.publicationAcknowledgement = {
    version: LEGAL_NOTICE_VERSION,
    acceptedAt: new Date().toISOString()
  };
  saveActiveProfile();
}

async function authRequest(path, payload) {
  const response = await fetch(path, {
    method: payload ? "POST" : "GET",
    headers: payload ? { "content-type": "application/json" } : {},
    credentials: "same-origin",
    body: payload ? JSON.stringify(payload) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Turnpo auth is not available yet.");
  return data;
}

async function registerProfile(event) {
  event.preventDefault();
  const name = $("#registerName").value.trim();
  const email = $("#registerEmail").value.trim().toLowerCase();
  if (!name || !email) {
    $("#registrationNote").textContent = "Enter your name and email to create your page.";
    return;
  }
  const acknowledgements = {
    publicProfile: $("#registerPublicProfileConsent").checked,
    thirdPartyRisk: $("#registerThirdPartyRiskConsent").checked,
    contentResponsibility: $("#registerContentResponsibilityConsent").checked,
    sensitiveContent: $("#registerSensitiveContentConsent").checked,
    aiReview: $("#registerAiReviewConsent").checked,
    legalTerms: $("#registerLegalConsent").checked
  };
  if (!Object.values(acknowledgements).every(Boolean)) {
    $("#registrationNote").textContent = "Accept every required public-profile acknowledgement before registering.";
    return;
  }
  const code = $("#registerCode").value.trim();
  if (registrationCodeRequested && !code) {
    $("#registrationNote").textContent = "Enter the 6-digit code from your email.";
    return;
  }
  $("#registrationSubmit").disabled = true;
  $("#registrationNote").textContent = registrationCodeRequested ? "Verifying code and creating your Turnpo page..." : "Sending a registration code...";
  try {
    const data = await authRequest("/api/auth/register", { name, email, code: registrationCodeRequested ? code : "", acknowledgements });
    if (data.verificationRequired) {
      registrationCodeRequested = true;
      $("#registerCodeRow").hidden = false;
      $("#registerName").readOnly = true;
      $("#registerEmail").readOnly = true;
      $("#registrationSubmit").textContent = "Verify code and create profile";
      $("#registrationNote").textContent = "Check your email for a 6-digit registration code. Codes expire after 20 minutes.";
      $("#registerCode").focus();
      return;
    }
	    const username = data.profile;
	    profiles[username] = normalizeProfile(data.profileData || starterProfile({ username, displayName: name, email }));
	    activeUsername = username;
	    ownerSessionProfile = username;
	    setUserSessionState({ authenticated: true, email, profile: username, role: data.role || "user", scopes: data.scopes || [] });
	    saveActiveProfile();
    localStorage.setItem(ACTIVE_PROFILE_KEY, username);
    setRegistrationDrawer(false);
    resetRegistrationForm();
    $("#registrationForm").reset();
    enterOwnerMode(username);
    setOwnerSaveStatus("Profile created. Add life stories, AI works, or use AI text import for text-only drafts. Images can be updated manually.");
  } catch (error) {
    $("#registrationNote").textContent = error.message;
  } finally {
    $("#registrationSubmit").disabled = false;
  }
}

function resetRegistrationForm() {
  registrationCodeRequested = false;
  $("#registerCodeRow").hidden = true;
  $("#registerCode").value = "";
  $("#registerName").readOnly = false;
  $("#registerEmail").readOnly = false;
  $("#registrationSubmit").textContent = "Create public profile";
}

function meaningfulSourceLines(source = "") {
  return source
    .split(/\n+/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.length > 24)
    .filter((line) => !/^https?:\/\//i.test(line))
    .slice(0, 8);
}

function pickDraftYear(source = "") {
  const years = source.match(/\b(20\d{2}|19\d{2})\b/g) || [];
  return years.length ? years[years.length - 1] : String(new Date().getFullYear());
}

function pickDraftMonth(source = "") {
  const englishMonth = MONTH_NAMES.find((month) => new RegExp(`\\b${month}\\b`, "i").test(source));
  if (englishMonth) return englishMonth;
  const numericMatch = source.match(/(?:^|[^\d])(1[0-2]|0?[1-9])\s*(?:月|月份|month\b)/i);
  return numericMatch ? MONTH_NAMES[Number(numericMatch[1]) - 1] : defaultStoryDate().month;
}

function pickDraftTitle(source = "") {
  const lines = meaningfulSourceLines(source);
  const first = lines[0] || source.trim();
  const sentence = first.split(/[.!?。！？]/).find((item) => item.trim().length > 10) || first;
  return sentence.trim().slice(0, 88).replace(/[,;:，；：]$/, "") || "Personal turning point";
}

function keywordSummary(source = "") {
  const keywords = [
    ["AI", /\bAI\b|artificial intelligence|LLM|agent|automation/i],
    ["learning", /learning|training|academy|course|education|knowledge/i],
    ["product", /product|website|platform|prototype|launch|build|built/i],
    ["leadership", /lead|managed|coordinated|stakeholder|team|strategy/i],
    ["reflection", /reflection|growth|values|self|mindset|turning point/i],
    ["communication", /marketing|story|communication|presentation|content/i]
  ];
  return keywords.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
}

function generateAiImportDraft(source = "", profileLocation = "") {
  const lines = meaningfulSourceLines(source);
  const keywords = keywordSummary(source);
  const title = pickDraftTitle(source);
  const year = pickDraftYear(source);
  const month = pickDraftMonth(source);
  const location = profileLocation || "Unknown";
  const wordCount = source.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = [...source.trim().replace(/\s+/g, "")].length;
  const summarySource = lines.slice(0, 3).join(" ");
  const summary = summarySource
    ? summarySource.slice(0, 520)
    : source.trim().replace(/\s+/g, " ").slice(0, 520);
  const tags = [...new Set(["AI draft", ...keywords])].slice(0, 6);
  const analysis = [
    `${wordCount} words / ${characterCount} characters`,
    `${lines.length} useful source lines`,
    keywords.length ? `themes: ${keywords.join(", ")}` : "themes: personal experience"
  ].join(" · ");
  const publicSummary = summary || "A personal experience draft generated from pasted source text.";
  const whyItMatters = keywords.length
    ? `This experience appears connected to ${keywords.join(", ")} and may be useful as a turning point after review.`
    : "This experience may describe a meaningful turning point after the owner reviews and refines it.";
  const copyText = [
    `Title: ${title}`,
    `Year: ${year}`,
    `Month: ${month}`,
    `Location: ${location}`,
    "Type: Life",
    `Summary: ${publicSummary}`,
    `Why it matters: ${whyItMatters}`,
    `Tags: ${tags.join(", ")}`,
    "Images: User updates images manually after reviewing this text draft.",
    "",
    "Review note: This is a text-only draft. Keep it hidden until the profile owner edits, adds any images manually, approves, and chooses to publish it."
  ].join("\n");

  return {
    title,
    year,
    month,
    location,
    publicSummary,
    whyItMatters,
    tags,
    analysis,
    copyText
  };
}

function renderAiImportDrafts(drafts) {
  lastAiImportDrafts = drafts;
  const provider = drafts[0]?.provider;
  const model = drafts[0]?.model;
  const count = drafts.length;
  $("#aiImportOutput").hidden = false;
  $("#useLocalAiImportFallback").hidden = true;
  $("#aiImportAnalysis").textContent = count === 1
    ? drafts[0].analysis
    : `${count} separate Life drafts detected. ${drafts.map((draft, index) => `${index + 1}. ${draft.title}`).join(" · ")}`;
  $("#aiImportDraft").value = drafts
    .map((draft, index) => count > 1 ? `DRAFT ${index + 1} OF ${count}\n${draft.copyText}` : draft.copyText)
    .join("\n\n------------------------------\n\n");
  $("#addAiImportLife").textContent = count > 1 ? `Add ${count} hidden Life drafts` : "Add as hidden Life";
  $("#aiImportNote").textContent = provider === "openai"
    ? `${count} text ${count === 1 ? "draft" : "drafts"} generated with ${model || "OpenAI"}. Review before adding. Images are added manually.`
    : "A local fallback draft was generated. Review it before adding. Images are added manually.";
}

async function requestAiImportDraft(source) {
  const response = await fetch("/api/ai/import-profile", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sourceText: source,
      profileName: currentProfile().displayName || "",
      profileLocation: currentProfile().location || "",
      username: currentProfile().username || ""
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "AI import is not available.");
  const drafts = Array.isArray(data.drafts) ? data.drafts : (data.draft ? [data.draft] : []);
  if (!drafts.length) throw new Error("AI did not return any drafts.");
  return drafts.map((draft) => ({
    ...draft,
    provider: data.provider,
    model: data.model
  }));
}

async function prepareAiImport(event) {
  event.preventDefault();
  const source = $("#aiImportSource").value.trim();
  if (!$("#aiImportSafetyConsent").checked) {
    $("#aiImportNote").textContent = "Confirm the AI import safety and review acknowledgement before submitting source text.";
    return;
  }
  if (!source) {
    $("#aiImportNote").textContent = "Paste CV text, LinkedIn text, a written profile, or personal notes first.";
    return;
  }
  $("#aiImportOutput").hidden = true;
  $("#useLocalAiImportFallback").hidden = true;
  $("#aiImportSubmit").disabled = true;
  $("#aiImportNote").textContent = "Calling AI to generate a text-only Turnpo document...";
  try {
    renderAiImportDrafts(await requestAiImportDraft(source));
  } catch (error) {
    lastAiImportDrafts = [];
    $("#useLocalAiImportFallback").hidden = false;
    $("#aiImportNote").textContent = `AI API failed: ${error.message} You can retry, or use the local fallback draft.`;
  } finally {
    $("#aiImportSubmit").disabled = false;
  }
}

function useLocalAiImportFallback() {
  const source = $("#aiImportSource").value.trim();
  if (!source) {
    $("#aiImportNote").textContent = "Paste source text before using local fallback.";
    return;
  }
  const fallbackDraft = generateAiImportDraft(source, currentProfile().location || "");
  fallbackDraft.provider = "local";
  renderAiImportDrafts([fallbackDraft]);
}

async function copyAiImportDraft() {
  const draft = $("#aiImportDraft").value.trim();
  if (!draft) {
    $("#aiImportNote").textContent = "Generate a text document before copying.";
    return;
  }
  try {
    await navigator.clipboard.writeText(draft);
    $("#aiImportNote").textContent = "Generated text document copied.";
  } catch {
    $("#aiImportDraft").focus();
    $("#aiImportDraft").select();
    document.execCommand("copy");
    $("#aiImportNote").textContent = "Generated text document selected and copied.";
  }
}

function addAiImportLifeDraft() {
  if (!ownerMode) {
    $("#aiImportNote").textContent = "Enter owner mode before adding draft content.";
    return;
  }
  if (!lastAiImportDrafts.length) {
    $("#aiImportNote").textContent = "Generate a text document before adding it.";
    return;
  }
  const now = new Date().toISOString();
  const items = lastAiImportDrafts.map((draft) => normalizeContent({
    id: `story-ai-import-${crypto.randomUUID()}`,
    category: "life",
    title: draft.title,
    year: draft.year,
    date: storyDateValue(draft.year, draft.month || defaultStoryDate().month),
    location: draft.location || currentProfile().location || "",
    publicSummary: draft.publicSummary,
    whyItMatters: draft.whyItMatters,
    tags: draft.tags,
    status: "hidden",
    userApproved: false,
    ownerEdited: true,
    ownerEditedAt: now,
    updatedAt: now
  }, "story"));
  currentProfile().lifeStories.unshift(...items);
  items.forEach((item) => syncPublicStateForItem(currentProfile(), "story", item));
  saveActiveProfile();
  renderProfile();
  $("#aiImportNote").textContent = `Added ${items.length} hidden text-only Life ${items.length === 1 ? "draft" : "drafts"}. Review, edit, and add images manually before publishing.`;
  saveProfileDraftOnline({ quiet: true });
}

function resetAuthForm(message = "Enter your Turnpo account email. If the account exists, Turnpo will send a one-time code.") {
  authCodeRequested = false;
  pendingOwnerEmail = "";
  $("#ownerCodeRow").hidden = true;
  $("#ownerCode").value = "";
  $("#authSubmit").textContent = "Send login code";
  $("#authNote").textContent = message;
}

async function requestLoginCode() {
  const email = $("#ownerEmail").value.trim().toLowerCase();
  if (!email) {
    $("#authNote").textContent = "Enter your account email first.";
    return;
  }
  $("#authSubmit").disabled = true;
  $("#authNote").textContent = "Sending a one-time login code...";
  try {
    await authRequest("/api/auth/request-code", { email });
    pendingOwnerEmail = email;
    authCodeRequested = true;
    $("#ownerCodeRow").hidden = false;
    $("#authSubmit").textContent = "Verify code";
    $("#authNote").textContent = "If this account exists, a 6-digit code has been sent. Codes expire after 10 minutes.";
    $("#ownerCode").focus();
  } catch (error) {
    $("#authNote").textContent = error.message;
  } finally {
    $("#authSubmit").disabled = false;
  }
}

async function verifyLoginCode() {
  const code = $("#ownerCode").value.trim();
  if (!pendingOwnerEmail || !code) {
    $("#authNote").textContent = "Enter the 6-digit code from your email.";
    return;
  }
  $("#authSubmit").disabled = true;
  $("#authNote").textContent = "Verifying code...";
  try {
    const session = await authRequest("/api/auth/verify-code", { email: pendingOwnerEmail, code });
    if (session.profile) ownerSessionProfile = session.profile;
    setUserSessionState({ authenticated: true, email: pendingOwnerEmail, profile: session.profile || ownerSessionProfile, role: session.role || "user", scopes: session.scopes || [] });
    enterOwnerMode(ownerSessionProfile);
    setAuthDrawer(false);
    resetAuthForm("Owner mode is active.");
  } catch (error) {
    $("#authNote").textContent = error.message;
  } finally {
    $("#authSubmit").disabled = false;
  }
}

async function checkOwnerSession() {
  try {
    const session = await authRequest("/api/auth/session");
    if (session.authenticated && session.profile) {
      ownerSessionProfile = session.profile;
      setUserSessionState(session);
      if (!profiles[ownerSessionProfile]) {
        profiles[ownerSessionProfile] = starterProfile({
          username: ownerSessionProfile,
          displayName: ownerSessionProfile,
          email: session.email || ""
        });
	      }
	      if (routeFromLocation() === "admin") renderAdminDashboard();
	    } else {
	      ownerSessionProfile = "";
	      setUserSessionState({});
	    }
  } catch {
    ownerSessionProfile = "";
    setUserSessionState({});
    setOwnerMode(false);
  }
}

async function logoutOwner() {
  const confirmed = window.confirm("Exit owner mode? Please confirm that your saved and published content uses information and media you have the right to share. Published content may be copied, indexed, cached, analyzed, or used with external AI tools.");
  if (!confirmed) return;
  try {
    await authRequest("/api/auth/logout", {});
  } catch {
    // Local static previews may not have the auth function available yet.
  }
  ownerSessionProfile = "";
  setUserSessionState({});
  setOwnerMode(false);
  resetAuthForm("You have exited owner mode.");
}

async function copyProfileMarkdown({ button, markdown, status, readyMessage, copiedMessage, copiedHtml = "Copied" }) {
  const original = button.innerHTML;
  let copied = false;
  try {
    await navigator.clipboard.writeText(markdown.value);
    copied = true;
  } catch {
    const fallbackCopySource = document.createElement("textarea");
    fallbackCopySource.value = markdown.value;
    fallbackCopySource.setAttribute("readonly", "");
    fallbackCopySource.style.position = "fixed";
    fallbackCopySource.style.left = "-9999px";
    fallbackCopySource.style.top = "0";
    document.body.appendChild(fallbackCopySource);
    fallbackCopySource.focus();
    fallbackCopySource.select();
    copied = document.execCommand("copy");
    fallbackCopySource.remove();
  }
  if (copied) {
    button.classList.add("is-copied");
    button.innerHTML = copiedHtml;
    status.textContent = copiedMessage;
  } else {
    button.innerHTML = "Copy failed";
    status.textContent = "Copy failed. Select the text and copy manually.";
  }
  setTimeout(() => {
    button.classList.remove("is-copied");
    button.innerHTML = original;
    status.textContent = readyMessage;
  }, 2400);
}

async function copyAiProfile() {
  await copyProfileMarkdown({
    button: $("#copyMd"),
    markdown: $("#aiMarkdown"),
    status: $("#copyStatus"),
    readyMessage: "Ready to copy into any AI chat",
    copiedMessage: "Copied published-only AI Profile Markdown"
  });
}

async function copyPublicAiProfile() {
  const copiedIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;
  await copyProfileMarkdown({
    button: $("#copyPublicMd"),
    markdown: $("#publicAiMarkdown"),
    status: $("#publicCopyStatus"),
    readyMessage: "A compact context card for any AI chat.",
    copiedMessage: "Copied AI-readable profile",
    copiedHtml: copiedIcon
  });
}

function exportProfile() {
  const blob = new Blob([JSON.stringify({ profile: currentProfile(), exportedAt: new Date().toISOString(), note: "Local prototype export. Do not treat this as backend storage." }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `turnpo-${activeUsername}-local-profile.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function resetActiveProfile() {
  localStorage.removeItem(localKey(activeUsername));
  if (ownerMode) loadOwnerProfile(activeUsername);
  else loadPublicProfile(activeUsername);
  renderProfile();
  $("#ownerSaveStatus").textContent = "Local draft reset. Viewing public seed.";
}

$("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  renderHome($("#personSearch").value);
});

$("#searchResults").addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile]");
  if (button) setRoute(button.dataset.profile);
});

$("#exampleProfiles").addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile]");
  if (button) setRoute(button.dataset.profile);
});

$("#yearFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-year]");
  if (!button) return;
  const target = document.getElementById(`timeline-year-${button.dataset.year}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.focus({ preventScroll: true });
});

$("#expandTimeline").addEventListener("click", () => setAllTimelineYearsCollapsed(false));
$("#collapseTimeline").addEventListener("click", () => setAllTimelineYearsCollapsed(true));
$("#ownerContentView").addEventListener("click", (event) => {
  const button = event.target.closest("[data-owner-view]");
  if (!button) return;
  ownerTimelineView = button.dataset.ownerView;
  renderProfile();
});
$("#categoryFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category-filter]");
  if (!button) return;
  activeCategoryFilter = button.dataset.categoryFilter;
  renderProfile();
});
$("#emptyDeleted").addEventListener("click", () => {
  if (confirm("Permanently clear all deleted stories? This cannot be undone.")) emptyDeletedStories();
});

document.addEventListener("click", (event) => {
  const hideButton = event.target.closest("[data-hide-id]");
  if (hideButton) {
    setContentStatus(hideButton.dataset.hideType, hideButton.dataset.hideId, "hidden");
    return;
  }
  const publishButton = event.target.closest("[data-publish-id]");
  if (publishButton) {
    setContentStatus(publishButton.dataset.publishType, publishButton.dataset.publishId, "published");
    return;
  }
  const restoreButton = event.target.closest("[data-restore-id]");
  if (restoreButton) {
    restoreContentById(restoreButton.dataset.restoreType, restoreButton.dataset.restoreId);
    return;
  }
  const permanentDeleteButton = event.target.closest("[data-permanent-delete-id]");
  if (permanentDeleteButton) {
    if (confirm("Permanently delete this item? This cannot be undone.")) {
      permanentlyDeleteContentById(permanentDeleteButton.dataset.permanentDeleteType, permanentDeleteButton.dataset.permanentDeleteId);
    }
    return;
  }
  const deleteButton = event.target.closest("[data-delete-id]");
  if (deleteButton) {
    deleteContentById(deleteButton.dataset.deleteType, deleteButton.dataset.deleteId);
    return;
  }
  const editButton = event.target.closest("[data-edit-id]");
  if (editButton) openEditor(editButton.dataset.editType, editButton.dataset.editId);
});

$("#timelineList").addEventListener("click", (event) => {
  const photoButton = event.target.closest("[data-photo-preview]");
  if (photoButton) {
    event.preventDefault();
    const image = photoButton.querySelector("img");
    if (image?.currentSrc || image?.src) openImageLightbox(image.currentSrc || image.src, photoButton.dataset.photoAlt || image.alt || "Turnpo photo");
    return;
  }
  const yearToggle = event.target.closest("[data-toggle-year]");
  if (yearToggle) {
    const yearBlock = yearToggle.closest("[data-year-block]");
    setTimelineYearCollapsed(yearToggle.dataset.toggleYear, !yearBlock.classList.contains("is-collapsed"));
    return;
  }
  if (!ownerMode || event.target.closest("button, a, input, textarea, select, details, summary")) return;
  const storyCard = event.target.closest("[data-content-id]");
  openEditor(storyCard?.dataset.contentType || "story", storyCard ? storyCard.dataset.contentId : "");
});

$("#timelineList").addEventListener("dragover", (event) => {
  if (!ownerMode || !dragHasFiles(event)) return;
  const storyCard = event.target.closest("[data-content-id]");
  if (!storyCard) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  document.querySelectorAll(".event-card.is-drop-target").forEach((card) => {
    if (card !== storyCard) card.classList.remove("is-drop-target");
  });
  storyCard.classList.add("is-drop-target");
});

$("#timelineList").addEventListener("dragleave", (event) => {
  const storyCard = event.target.closest("[data-content-id]");
  if (!storyCard || storyCard.contains(event.relatedTarget)) return;
  storyCard.classList.remove("is-drop-target");
});

$("#timelineList").addEventListener("drop", (event) => {
  if (!ownerMode || !event.dataTransfer?.files?.length) return;
  const storyCard = event.target.closest("[data-content-id]");
  if (!storyCard) return;
  event.preventDefault();
  document.querySelectorAll(".event-card.is-drop-target").forEach((card) => card.classList.remove("is-drop-target"));
  addImageFilesToStory(storyCard.dataset.contentId, event.dataTransfer.files);
});

document.querySelectorAll(".toggle-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    $("#timelineList").classList.toggle("horizontal", button.dataset.view === "horizontal");
    $("#timelineList").classList.toggle("vertical", button.dataset.view !== "horizontal");
  });
});

$(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  setRoute("home");
});

$("#openStory").addEventListener("click", () => openEditor("story"));
$("#openWork").addEventListener("click", () => openEditor("work"));
$("#openProjectWork").addEventListener("click", () => openEditor("work"));
$("#openProfileEditor").addEventListener("click", openProfileEditor);
$("#editHeroProfile").addEventListener("click", openProfileEditor);
$("#editPortraitProfile").addEventListener("click", openProfileEditor);
$("#closeContent").addEventListener("click", closeEditor);
$("#closeBackdrop").addEventListener("click", closeEditor);
$("#closeProfileEditor").addEventListener("click", closeProfileEditor);
$("#closeProfileBackdrop").addEventListener("click", closeProfileEditor);
$("#contentType").addEventListener("change", (event) => toggleWorkFields(event.target.value));
$("#contentForm").addEventListener("submit", upsertContent);
$("#contentForm").addEventListener("input", markContentFormDirty);
$("#contentForm").addEventListener("change", markContentFormDirty);
$("#profileForm").addEventListener("submit", saveProfileText);
$("#profileForm").addEventListener("input", markProfileFormDirty);
$("#profileForm").addEventListener("change", markProfileFormDirty);
$("#profileEditAvatarY").addEventListener("input", (event) => {
  $("#profileAvatar").style.setProperty("--avatar-y", `${event.target.value}%`);
});
$("#deleteContent").addEventListener("click", deleteCurrentContent);
$("#chooseContentImage").addEventListener("click", () => $("#contentImageFile").click());
$("#contentImageFile").addEventListener("change", (event) => {
  if (event.target.files?.length) useImageFiles(event.target.files);
  event.target.value = "";
});
$("#removeContentImage").addEventListener("click", () => {
  renderImageUpload([]);
  $("#contentStatusNote").textContent = "Images removed. Remember to save content.";
});
$("#contentImageGallery").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-image]");
  if (!button) return;
  const images = storyImagesFromValue($("#contentImage").value);
  images.splice(Number(button.dataset.removeImage), 1);
  renderImageUpload(images);
  $("#contentStatusNote").textContent = "Image removed. Remember to save content.";
});
$("#contentImageDropzone").addEventListener("click", () => $("#contentImageFile").click());
$("#contentImageDropzone").addEventListener("dragover", (event) => {
  event.preventDefault();
  $("#contentImageDropzone").classList.add("is-dragging");
});
$("#contentImageDropzone").addEventListener("dragleave", () => {
  $("#contentImageDropzone").classList.remove("is-dragging");
});
$("#contentImageDropzone").addEventListener("drop", (event) => {
  event.preventDefault();
  $("#contentImageDropzone").classList.remove("is-dragging");
  if (event.dataTransfer?.files?.length) useImageFiles(event.dataTransfer.files);
});
$("#contentImageDropzone").addEventListener("paste", (event) => {
  const file = imageFileFromPaste(event);
  if (!file) return;
  event.preventDefault();
  useImageFiles([file]);
});
$("#contentForm").addEventListener("paste", (event) => {
  const file = imageFileFromPaste(event);
  if (!file) return;
  event.preventDefault();
  useImageFiles([file]);
});
$("#homeOwnerLogin").addEventListener("click", () => {
  if (ownerSessionProfile) enterOwnerMode(ownerSessionProfile);
  else setAuthDrawer(true);
});
$("#openLogin").addEventListener("click", () => {
  if (ownerSessionProfile) enterOwnerMode(ownerSessionProfile);
  else setAuthDrawer(true);
});
$("#openOwnerProfile").addEventListener("click", () => {
  if (ownerSessionProfile) enterOwnerMode(ownerSessionProfile);
  else setAuthDrawer(true);
});
$("#openAdminOwnerProfile").addEventListener("click", () => {
  if (ownerSessionProfile) enterOwnerMode(ownerSessionProfile);
  else setAuthDrawer(true);
});
$("#openAdminDashboard").addEventListener("click", () => setRoute("admin"));
$("#refreshAdminDashboard").addEventListener("click", renderAdminDashboard);
$("#themeToggle").addEventListener("click", toggleTheme);
$("#openRegistration").addEventListener("click", () => setRegistrationDrawer(true));
$("#openAiImport").addEventListener("click", () => setAiImportDrawer(true));
$("#ownerLogout").addEventListener("click", logoutOwner);
$("#backToSearch").addEventListener("click", () => setRoute("home"));
$("#closeAuth").addEventListener("click", () => setAuthDrawer(false));
$("#authBackdrop").addEventListener("click", () => setAuthDrawer(false));
$("#closeRegistration").addEventListener("click", () => setRegistrationDrawer(false));
$("#registrationBackdrop").addEventListener("click", () => setRegistrationDrawer(false));
$("#closeAiImport").addEventListener("click", () => setAiImportDrawer(false));
$("#aiImportBackdrop").addEventListener("click", () => setAiImportDrawer(false));
$("#closeImageLightbox").addEventListener("click", closeImageLightbox);
$("#imageLightboxBackdrop").addEventListener("click", closeImageLightbox);
$("#saveProfileState").addEventListener("click", saveCurrentProfileState);
$("#publishProfileOnline").addEventListener("click", async () => {
  if (!(await requestPublishConfirmation())) return;
  saveActiveProfile();
  publishProfileOnline({ quiet: false });
});
$("#closePublishConfirmation").addEventListener("click", () => closePublishConfirmation(false));
$("#cancelPublishConfirmation").addEventListener("click", () => closePublishConfirmation(false));
$("#publishConfirmationBackdrop").addEventListener("click", () => closePublishConfirmation(false));
$("#publishConfirmationForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!$("#publishConfirmationConsent").checked) {
    $("#publishConfirmationNote").textContent = "Review and check the public publication acknowledgement to continue.";
    return;
  }
  recordPublicationAcknowledgement();
  closePublishConfirmation(true);
});
$("#exportProfile").addEventListener("click", exportProfile);
$("#restoreSeed").addEventListener("click", resetActiveProfile);
$("#copyMd").addEventListener("click", copyAiProfile);
$("#copyPublicMd").addEventListener("click", copyPublicAiProfile);

$("#authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (authCodeRequested) await verifyLoginCode();
  else await requestLoginCode();
});
$("#registrationForm").addEventListener("submit", registerProfile);
$("#aiImportForm").addEventListener("submit", prepareAiImport);
$("#useLocalAiImportFallback").addEventListener("click", useLocalAiImportFallback);
$("#copyAiImportDraft").addEventListener("click", copyAiImportDraft);
$("#addAiImportLife").addEventListener("click", addAiImportLifeDraft);

window.addEventListener("popstate", () => setRoute(routeFromLocation()));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $("#imageLightbox").classList.contains("open")) closeImageLightbox();
});

applyTheme();
renderContentDateOptions();
renderLocationOptions();
renderHome();
setRoute(routeFromLocation());
checkOwnerSession();
