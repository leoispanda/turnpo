const ACTIVE_PROFILE_KEY = "turnpo:active-profile";
const LOCAL_PREFIX = "turnpo:profile:";
const COLLAPSED_YEARS_PREFIX = "turnpo:collapsed-years:";
const COLLAPSED_YEARS_DEFAULT_PREFIX = "turnpo:collapsed-years-default:";
const STATUSES = ["published", "hidden", "deleted"];
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
      "oneLineIntro": "Digital Business Strategy | Digital & AI Transformation | Stakeholder Management | Data Analytics | AI-enhanced Operational Excellence| Dutch Work Permit",
      "currentChapter": "Building MapKAI and exploring digital business strategy, AI transformation, UX writing, knowledge structuring, and data-informed operational excellence.",
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
          "learning by doing",
          "digital transformation",
          "strategic storytelling",
          "stakeholder alignment",
          "data-informed action",
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
              "title": "LinkedIn profile summary",
              "location": "Eindhoven, North Brabant, Netherlands",
              "image": "/assets/profile-media/cindy/linkedin-2026-05-19-photo-01.jpg",
              "publicSummary": "Recently created and built MapKAI (www.mapkai.com) with a collaborator. It is an AI-assisted knowledge mapping website that reflects my hands-on interest and experience in AI-assisted development, product thinking, UX writing, and knowledge structuring.With ov...",
              "fullText": "Recently created and built MapKAI (www.mapkai.com) with a collaborator. It is an AI-assisted knowledge mapping website that reflects my hands-on interest and experience in AI-assisted development, product thinking, UX writing, and knowledge structuring.With over 10 years of professional experience, I specialize in digital transformation, integrated marketing, and strategic storytelling. At AkzoNobel, Struers and AMETEK, I have contributed to global communication and digital transformation strategies, aligning digital media execution across multiple channels to enhance brand visibility and audience connection. My work integrates data-driven insights with creative narratives to optimize campaign performance and support global initiatives. My expertise lies in translating digital performance data into actionable strategies that balance innovation with measurable results. Passionate about leveraging digital transformation and AI to drive business outcomes, I am committed to enabling impactful communication and fostering organizational alignment in multinational environments.",
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
              "title": "LinkedIn skills",
              "location": "",
              "image": "",
              "publicSummary": "Vibe Coding, Lean Six Sigma, AI Agents, AI-Assisted Web Development, Learning Design, Generative AI for Web Developers, Digital Product Development, Product Thinking, Artificial Intelligence for Design, User Experience Writing, Web Development, Digital Transformation, Artificial Intelligence (AI), DMAIC, AI-Enhanced Operational Excellence, Trade Shows, Cross-Cultural Communication Skills, Organizational Effectiveness, Public Administration, Brand Strategy, Intelligence Analysis, Localization, B2B Marketing Strategy, Integrated Marketing",
              "fullText": "- Vibe Coding\n- Lean Six Sigma\n- AI Agents\n- AI-Assisted Web Development\n- Learning Design\n- Generative AI for Web Developers\n- Digital Product Development\n- Product Thinking\n- Artificial Intelligence for Design\n- User Experience Writing\n- Web Development\n- Digital Transformation\n- Artificial Intelligence (AI)\n- DMAIC\n- AI-Enhanced Operational Excellence\n- Trade Shows\n- Cross-Cultural Communication Skills\n- Organizational Effectiveness\n- Public Administration\n- Brand Strategy\n- Intelligence Analysis\n- Localization\n- B2B Marketing Strategy\n- Integrated Marketing\n- Presentation Skills\n- Digital Marketing\n- Communication\n- Organization Skills\n- Business-to-Business (B2B)\n- Project Management\n- Operational Planning\n- Stakeholder Management\n- Public Relations",
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
              "title": "Co-creator & Builder at MapKAI",
              "location": "Netherlands",
              "image": "",
              "publicSummary": "• Built MapKAI (www.mapkai.com), supporting people in turning fragmented knowledge into clear learning paths and meaningful self-reflection in the AI era. Rather than defining or testing people, MapKAI aims to help users see their knowledge map with more clari...",
              "fullText": "• Built MapKAI (www.mapkai.com), supporting people in turning fragmented knowledge into clear learning paths and meaningful self-reflection in the AI era. Rather than defining or testing people, MapKAI aims to help users see their knowledge map with more clarity and better understand what they know, what they are still exploring, and where they want to go next. • Led the concept development, knowledge structure, UX writing, quiz flow design, and website iteration from concept to launch. • Created and tested the MapKAI Partner Decision Council (PDC), an AI Agent Committee with distinct AI roles designed to support critical discussion, challenge assumptions, and improve structured decision-making. • Conducted self-directed research on AI-assisted learning and decision-making, gaining hands-on experience with different AI tools and advanced functions to clarify personal capabilities, growth direction, and future",
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
              "publicSummary": "•Global brand and digital communication strategy within AkzoNobel Global Communications, contributing to flagship initiatives including Color of the Year (CF25), Paint the Future, and McLaren Formula 1 partnership. •Integrated digital media execution across mu...",
              "fullText": "•Global brand and digital communication strategy within AkzoNobel Global Communications, contributing to flagship initiatives including Color of the Year (CF25), Paint the Future, and McLaren Formula 1 partnership. •Integrated digital media execution across multiple channels, aligning content, storytelling, and engagement objectives to strengthen brand visibility and audience connection. •Digital performance data into actionable insights, supporting campaign optimization and informed decision-making for global stakeholders. •Strategic storytelling that balanced creative narratives with measurable performance outcomes.",
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
              "title": "Digital Marketing at Struers - your metallographic specialist",
              "location": "Shanghai, China",
              "image": "",
              "publicSummary": "•Led the China marketing function, owning the end-to-end integrated marketing and B2B digital transformation agenda, and partnering closely with the Country Manager and HQ leadership in Denmark. •Drove the transformation of marketing from fragmented, activity-...",
              "fullText": "•Led the China marketing function, owning the end-to-end integrated marketing and B2B digital transformation agenda, and partnering closely with the Country Manager and HQ leadership in Denmark. •Drove the transformation of marketing from fragmented, activity-based execution into a scalable, data-driven, and integrated operating model within a matrix organization. •Defined and executed the local digital strategy by translating global priorities into market-relevant initiatives, balancing global alignment with local impact. •Built and scaled a multi-channel digital ecosystem (website, LinkedIn, WeChat, mini-programs, webinars, live streaming), establishing a systematic engine for lead generation, demand creation, and customer engagement. •Established governance, workflows, and performance management frameworks, enhancing visibility, accountability, and data-driven decision-making across the marketing function. •Leveraged data (customer interactions, campaign performance, competitor insights, keyword analysis) to generate actionable insights and support commercial and strategic decisions. •Acted as a strategic bridge across marketing, sales, and HQ, aligning stakeholders, strengthening digital capabilities, and driving cross-functional collaboration. Tools & Platforms: CRM, Power BI, Adobe, e-mailing(A/B), e-commerce, paid search, marketing automation",
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
              "title": "Marketing Communication at AMETEK",
              "location": "Shanghai, China",
              "image": "",
              "publicSummary": "•Created and optimized effective campaigns (online & offline) to increase brand visibility, lead generation and product adoption in high-tech B2B markets. •Initiate and scaled digital transformation initiatives, including the setup of a Live Streaming Studio a...",
              "fullText": "•Created and optimized effective campaigns (online & offline) to increase brand visibility, lead generation and product adoption in high-tech B2B markets. •Initiate and scaled digital transformation initiatives, including the setup of a Live Streaming Studio and the “COE Go Digital” strategy, accelerating digital engagement and internal capabilities. •Led cross-business unit collaboration and brand alliances, enhancing brand consistency and market impact across product lines. •Delivered market intelligence and competitive analysis to inform strategic planning, pricing discussions, and sales enablement. •Managed marketing budgets, agencies, and vendors, while working closely with sales teams to translate market insights into business decisions. •Acted as a bridge between HQ strategy and local execution, supporting organizational alignment and growth objectives. Systems & Tools: Salesforce CRM, ERP, Act-On, GoToWebinar, Bidding analysis, WeChat, email marketing",
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
              "title": "Public Communication Staff at Local Administrative Office",
              "location": "Harbin",
              "image": "",
              "publicSummary": "• Developed public communication strategies and media relations • Drove public engagement and communication impact • Managed cross-stakeholder coordination in large-scale initiatives • Led public projects, such as the National Civilized City Initiative and Pub...",
              "fullText": "• Developed public communication strategies and media relations • Drove public engagement and communication impact • Managed cross-stakeholder coordination in large-scale initiatives • Led public projects, such as the National Civilized City Initiative and Public Legal Education Outreach Programs",
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
              "title": "MSc in Business Administration at University of Amsterdam - Amsterdam Business School",
              "location": "",
              "image": "",
              "publicSummary": "MSc in Business Administration at University of Amsterdam - Amsterdam Business School",
              "fullText": "MSc in Business Administration at University of Amsterdam - Amsterdam Business School",
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
              "title": "Pre-master at University of Amsterdam - Amsterdam Business School",
              "location": "",
              "image": "",
              "publicSummary": "Pre-master at University of Amsterdam - Amsterdam Business School",
              "fullText": "Pre-master at University of Amsterdam - Amsterdam Business School",
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
              "publicSummary": "Bachelor of Commerce at Harbin University of Commerce; Outstanding Graduate Scholarship",
              "fullText": "Bachelor of Commerce at Harbin University of Commerce; Outstanding Graduate Scholarship",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "",
              "publicSummary": "AI is already a trend emerging from individual use. How to guide it responsibly and turn it into a real organisational capability is a topic worth thinking about. A great perspective from Sam Solaimani, PhD, on what it means to lead with integrity in the digit...",
              "fullText": "AI is already a trend emerging from individual use. How to guide it responsibly and turn it into a real organisational capability is a topic worth thinking about. A great perspective from Sam Solaimani, PhD, on what it means to lead with integrity in the digital age.",
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
              "publicSummary": "📽️ A small animation for MapKAI is ready. Warm welcome to take a look! This week, I explored more broadly what is possible with AI-assisted building. With limited time and AI credits, try to see what is possible when ideas, knowledge management, learning desig...",
              "fullText": "📽️ A small animation for MapKAI is ready. Warm welcome to take a look! This week, I explored more broadly what is possible with AI-assisted building. With limited time and AI credits, try to see what is possible when ideas, knowledge management, learning design, and AI come together. Just now, I also created a short animation with AI, turning the idea into a more visual story: AI should not only help us find answers. It should also help us see our knowledge, reflect on ourselves, and find our next direction. Two days after launch, www.mapkai.com, has already received 400+ organic visits. 👏 Thank you to everyone who has shared suggestions, taken a look, or encouraged this small experiment. 🫶 This era we are living in, a time when ideas can move from imagination to something real much faster than before. Riding the wave, learning by doing, and becoming stronger navigators of our own paths. 💪 MapKAI #AI #GenerativeAI #VibeCoding #KnowledgeManagement #LearningInnovation #FutureOfLearning",
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
              "publicSummary": "Ta-da! ✨ Built my very first website with an AI coding agent. From prompting and pushing code on GitHub to buying and connecting a domain ➡️ www.minigrowlab.com is live now 🚀 Words can inspire, energize, and stay with us. Every revisit brings something new. If...",
              "fullText": "Ta-da! ✨ Built my very first website with an AI coding agent. From prompting and pushing code on GitHub to buying and connecting a domain ➡️ www.minigrowlab.com is live now 🚀 Words can inspire, energize, and stay with us. Every revisit brings something new. If you’re interested, feel free to take a look 👏 I feel lucky to witness and experience this technological wave firsthand. This project reminded me that curiosity means nothing without action. Don’t simply wait to be ready. Jump in, build fast, learn faster. Real learning starts when you stop watching and start building. First AI-assisted web project… check! ✅ ➡️ www.minigrowlab.com OpenAI #Codex Cloudflare GitHub #AIcodingagent",
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
              "publicSummary": "So happy to share that I have completed and earned my Lean Six Sigma Green Belt (9.5/10). It has been a highly practical learning experience, allowing me to explore areas I had not previously engaged with in depth. The challenges along the way made the outcome...",
              "fullText": "So happy to share that I have completed and earned my Lean Six Sigma Green Belt (9.5/10). It has been a highly practical learning experience, allowing me to explore areas I had not previously engaged with in depth. The challenges along the way made the outcome even more meaningful and further strengthened my approach to critical questioning. Currently, in the final stage of my Master’s in Business Management at the University of Amsterdam, where I am actively working on my thesis and preparing for the next step in my professional journey. 💪 I’m really enjoying the inspiring connections and the recent lovely sunny days. They’ve given me a great boost to stay motivated, keep learning, and continue improving! ☀️ 🧡 #AIenhancedOE #LeanSixSigma #LSS #GreenBelt #DMAIC #IBISUvA #criticalquestioning #professinaljourney",
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
              "publicSummary": "This Friday, I was so happy and honored to be the student representative for the “Designing Future-Proof Organisations” course of the University of Amsterdam. 😊 It was a great pleasure to share my opinions and experiences with the new prospective fellows and t...",
              "fullText": "This Friday, I was so happy and honored to be the student representative for the “Designing Future-Proof Organisations” course of the University of Amsterdam. 😊 It was a great pleasure to share my opinions and experiences with the new prospective fellows and to help answer their questions and curiosities. 💡 The highlight of the day was meeting and co-presenting with Jeroen [yuh-roon] van Bree, who is the editor and author of the book Organization Design: Frameworks, Principles, and Approaches, a highly practical and thought-provoking resource, and also the lecturer who designed this course in such an applicable and inspiring way. 📚 Even better news: a new edition of the book is on the way, in 2026! Can't wait to discover the new insights it will bring. 🌟 Big thanks to my lecturer Bert Flier for making this course so engaging, enjoyable, memorable, and insightful. I learned a great deal and gained perspectives that will stay with me beyond the classroom. 🧡 On a personal note, my past experience in multinational companies, across HQ and subsidiaries, connecting with Asian and Western cultures, helped me link the theories with real organisational challenges, which made the course even more meaningful and attractive for me. I am quite satisfied with my studying performance as well (score 9/10). 💪 💪 💪 📚 🤩 Once again, I am looking forward to the second edition of Jeroen’s book Organization Design: Frameworks, Principles, and Approaches. Highly recommend if you’re interested in this area like me !!! 👏",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "",
              "publicSummary": "So happy about all the insights and new connections! Such an empowering session on leadership and growth! Feeling motivated, and energized! “Leadership is not a position, but a choice to be influential.” I am deeply grateful to Gerda Slagter for sharing her in...",
              "fullText": "So happy about all the insights and new connections! Such an empowering session on leadership and growth! Feeling motivated, and energized! “Leadership is not a position, but a choice to be influential.” I am deeply grateful to Gerda Slagter for sharing her inspiring reflections on vision, influence, and authentic communication, and to Hilde de Vocht and the entire team for organizing such valuable initiatives as always. Always learning, always growing: self-awareness, life long learning, and meaningful connection with inspiring people. 🤩 🤩 🤩",
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
              "title": "AkzoNobel digital communication milestone",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2025-05-22-feed-photo-05.jpg",
              "publicSummary": "Sometimes, lectures are more than just information sharing, as they broaden your perspective and leave you curious and reflective. Last Friday was one of those moments — it was wonderful to see familiar faces again! This time, Joris Vollebergh and Navninder Si...",
              "fullText": "Sometimes, lectures are more than just information sharing, as they broaden your perspective and leave you curious and reflective. Last Friday was one of those moments — it was wonderful to see familiar faces again! This time, Joris Vollebergh and Navninder Singh joined us as guest speakers. Thank you both, as always, for your engaging and insightful presentations! ✨ (BTW, I just finished refining and finalizing my upcoming assignment, the final presentation on a digital transformation plan. I’m really happy with it, and your insights about digital transformation gave me some great new ideas. 😉) Sometimes, classes are more than just knowledge acquisition, as they leave a lasting mark on how you think and make you eager to explore. Thank you, Zahra Kashanizadeh, for making yours one of them! It was a highlight of my entire learning journey. I feel so lucky to have a teacher who made this whole process fun and meaningful. 📚 #Digitalbusiness #Leadingdigitaltransformation #AkzoNobel #UvA",
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
              "title": "AkzoNobel digital communication milestone",
              "location": "",
              "image": "",
              "publicSummary": "What an amazing experience! 🌟 Trying out a VR spray gun simulator for yacht coating was such a thrill. Putting on the VR headset and holding the spray gun felt just like stepping into an immersive game—precision coating, smooth controls, and loads of fun! ✨ Wh...",
              "fullText": "What an amazing experience! 🌟 Trying out a VR spray gun simulator for yacht coating was such a thrill. Putting on the VR headset and holding the spray gun felt just like stepping into an immersive game—precision coating, smooth controls, and loads of fun! ✨ When work can be as enjoyable as gaming, wouldn’t you want to give it a try? 😉 This experience not only sparks curiosity about technology but also showcases the endless possibilities of combining innovation with real-world applications. 🛳️✈️ A big thanks to the teammates Proma Basu & Maria Waters for sharing this experience together! ♥️ #VR #YachtCoatings #AkzoNobel #METSTRADE",
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
              "title": "University of Amsterdam learning milestone",
              "location": "",
              "image": "",
              "publicSummary": "Many thanks to Rijksmuseum and AkzoNobel for the dedicated contributions to protecting this masterpiece! 🧡 I’ve visited the Rijksmuseum a couple of times last year, and each time, Night Watch stands quietly under its “glass casing”. 🖼️ Though I haven’t yet had...",
              "fullText": "Many thanks to Rijksmuseum and AkzoNobel for the dedicated contributions to protecting this masterpiece! 🧡 I’ve visited the Rijksmuseum a couple of times last year, and each time, Night Watch stands quietly under its “glass casing”. 🖼️ Though I haven’t yet had the chance to see it without this barrier, its immense value and the significance of its preservation make all the waiting worthwhile. 👏",
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
              "publicSummary": "✅I did it! I’m thrilled to have completed my first marathon in Eindhoven!🏃‍♀️🏅 This experience fills me with pride, not just for breaking through my limits and achieving a personal best, but for realizing that success begins with the courage to try. With the r...",
              "fullText": "✅I did it! I’m thrilled to have completed my first marathon in Eindhoven!🏃‍♀️🏅 This experience fills me with pride, not just for breaking through my limits and achieving a personal best, but for realizing that success begins with the courage to try. With the right approach, you can both enjoy the journey and succeed. I’m feeling confident and excited to improve my performance in my next running! 💪 Before today, I never thought I could run such a long distance without discomfort or any intention of giving up, especially since I’d never run more than 5 kilometers during my usual exercise. But thanks to the running techniques I’ve learned and prepared, I focused on monitoring my heart rate and stride length.💓Although I didn’t run very fast, the 10.55 kilometers felt surprisingly manageable, and I enjoyed the whole process! 🤩 Long-distance running is no longer something I want to avoid! A special thanks to everyone who cheered for all the runners during the Marathon event!🥁📯🫶",
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
              "title": "AkzoNobel digital communication milestone",
              "location": "",
              "image": "",
              "publicSummary": "🌞🌞🌞 Cover me in sunshine~ 🎉🎉🎉Embrace me with joy~ Take a look at how AkzoNobel's 2025 Color of the Year can add a bit of sunshine to any space! 🌻 #TrueJoy #JustLeap #TeamJoy #COTY25 #CF25 #ColourFutures #AkzoNobel #Dulux #Flexa #PaintTheFuture🎨#WindowPainting",
              "fullText": "🌞🌞🌞 Cover me in sunshine~ 🎉🎉🎉Embrace me with joy~ Take a look at how AkzoNobel's 2025 Color of the Year can add a bit of sunshine to any space! 🌻 #TrueJoy #JustLeap #TeamJoy #COTY25 #CF25 #ColourFutures #AkzoNobel #Dulux #Flexa #PaintTheFuture🎨#WindowPainting",
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
              "title": "AkzoNobel digital communication milestone",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-09-11-feed-photo-10.jpg",
              "publicSummary": "True Joy – AkzoNobel - Color of the Year 2025! ☀️ A sunny yellow shade that’s on a mission to fill our homes with optimism, pride and a splash of vibrant color, it’s bound to paint a smile on your face.😊 ⬆️Read more: https://akzo.no/CF25 #AkzoNobel #CF25 #True...",
              "fullText": "True Joy – AkzoNobel - Color of the Year 2025! ☀️ A sunny yellow shade that’s on a mission to fill our homes with optimism, pride and a splash of vibrant color, it’s bound to paint a smile on your face.😊 ⬆️Read more: https://akzo.no/CF25 #AkzoNobel #CF25 #TrueJoy #coloroftheyear",
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
              "title": "AkzoNobel digital communication milestone",
              "location": "",
              "image": "",
              "publicSummary": "It’s truly awe-inspiring! What’s being protected is not just the architecture, but also humanity’s shared memory of the past and future.👏 #AkzoNobel #PassionForPaint",
              "fullText": "It’s truly awe-inspiring! What’s being protected is not just the architecture, but also humanity’s shared memory of the past and future.👏 #AkzoNobel #PassionForPaint",
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
              "title": "University of Amsterdam learning milestone",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-09-02-feed-photo-15.jpg",
              "publicSummary": "This September has been truly remarkable and incredibly exciting for me! New Milestone Achieved! 🎉 I’m thrilled to share that I’ve started my first day at AkzoNobel as Digital Media Intern and am loving the company’s vibrant atmosphere. I’ve met many incredibl...",
              "fullText": "This September has been truly remarkable and incredibly exciting for me! New Milestone Achieved! 🎉 I’m thrilled to share that I’ve started my first day at AkzoNobel as Digital Media Intern and am loving the company’s vibrant atmosphere. I’ve met many incredibly energetic and professional colleagues, and I’m grateful to everyone for the warm welcome! I’m eagerly looking forward to the journey ahead! 💫 Balancing my master’s studies with this internship will undoubtedly be challenging, but I see it as a fantastic opportunity for growth. I’m confident that I can thrive in both areas! 💪 A big thanks to AkzoNobel and my supervisor Adriana Mendoza for this incredible opportunity. It’s a valuable experience to continue advancing in the field I’m passionate about while gaining a more comprehensive perspective and empowering my professional development!🌟🚀",
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
              "title": "University of Amsterdam learning milestone",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-08-30-feed-photo-16.jpg",
              "publicSummary": "Amazing day with amazing people! 🥂 I’m thrilled to share that I’ve officially begun my journey at the University of Amsterdam, Amsterdam Business School. Today’s orientation was truly inspiring, and I’m deeply grateful for the opportunity to continue empowerin...",
              "fullText": "Amazing day with amazing people! 🥂 I’m thrilled to share that I’ve officially begun my journey at the University of Amsterdam, Amsterdam Business School. Today’s orientation was truly inspiring, and I’m deeply grateful for the opportunity to continue empowering myself.💫 Studying in an international environment has long been a dream of mine. After years of working and gaining valuable experience, returning to academia required a leap of courage. This relocation to Netherlands means not only living, working, and studying in Europe but also immersing myself in a diverse environment that offers a broad perspective. I’m excited to gain new insights and experiences! I’m particularly excited about this master’s program, which brings together an exceptional group of professionals from various industries. Throughout the program, I’ll learn from esteemed professors and have the opportunity to collaborate with motivated peers from diverse nationalities and sectors. This dynamic mix of perspectives promises a unique and enriching learning experience.💪 I want to express my heartfelt thanks to my previous employers and colleagues. The rich experiences and profound case studies we shared have undoubtedly played a significant role in shaping my master’s journey and will greatly benefit my future.🫶 As I embark on this new chapter, I’m excited for the journey ahead and ready to embrace all the opportunities it brings!🚀🚀🚀",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "",
              "publicSummary": "I’m happy to share that I’ve obtained a new certification: Agile Project Management from Google!",
              "fullText": "I’m happy to share that I’ve obtained a new certification: Agile Project Management from Google!",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "",
              "publicSummary": "This is so inspiring! Thanks for sharing! Karine Allouche Salanon (she,her) I truly love her perspective : “…You can view this change with apprehension, or embrace it with a growth mindset and a commitment to lifelong learning…” Additionally, thanks to Courser...",
              "fullText": "This is so inspiring! Thanks for sharing! Karine Allouche Salanon (she,her) I truly love her perspective : “…You can view this change with apprehension, or embrace it with a growth mindset and a commitment to lifelong learning…” Additionally, thanks to Coursera, I have learned a lot on this online platform and look forward to continuing my learning journey to empower my professional development. 🤩",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "",
              "publicSummary": "AI integration in marketing enhances businesses by providing precise insights into consumer demands and market trends, while also enhancing customer experiences through personalized recommendations and tailored services. 📈 Thanks for the Meet-Up and the opport...",
              "fullText": "AI integration in marketing enhances businesses by providing precise insights into consumer demands and market trends, while also enhancing customer experiences through personalized recommendations and tailored services. 📈 Thanks for the Meet-Up and the opportunity to reflect on balancing AI's strengths with other technologies and human expertise. Simultaneously, focus on using effective tools and avoid relying too heavily on AI alone. 💡",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "",
              "publicSummary": "A successful annual Struers marketing conversion! Congratulations to everyone! What a wonderful team - filled with passion, collaboration, open-mindedness, and continuous input. I truly enjoyed working with all of you and fondly reminisce about my time with th...",
              "fullText": "A successful annual Struers marketing conversion! Congratulations to everyone! What a wonderful team - filled with passion, collaboration, open-mindedness, and continuous input. I truly enjoyed working with all of you and fondly reminisce about my time with the team. It was truly worthwhile to join the team and be a part of you! Struers Life is a journey, not a destination. I see this relocation and gap year as a new beginning, not an endpoint. Embracing changes and evolving locations, I will always follow my heart. Seeing life from multiple perspectives is a gift, not a challenge. 🎁 🏆",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-05-30-feed-photo-17.jpg",
              "publicSummary": "Attending GM Eindhoven has been an incredibly enriching experience! 👏 From the introduction to the roundtable discussion, and to the presentations, I have gained valuable insights into the latest technological trends and developments, also networking in busine...",
              "fullText": "Attending GM Eindhoven has been an incredibly enriching experience! 👏 From the introduction to the roundtable discussion, and to the presentations, I have gained valuable insights into the latest technological trends and developments, also networking in businesses. ( Special thanks to Gigi De Vries for the insightful coffee talk on branding & marketing strategies, and social networking ❤️ ) Moreover, I had the opportunity to connect with many innovative and like-minded individuals, which expanded my perspectives and opened my eyes to new possibilities. 🚀 What a worthwhile and unforgettable day! #emergingtechnologies #GMWorld!#Conference Center High Tech Campus",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-05-10-feed-photo-24.jpg",
              "publicSummary": "A few months ago, I participated in a walking tour of Eindhoven for foreigners, where I had the pleasure of meeting people from diverse backgrounds. As someone new to Europe, I was eager to explore its wonders. During a conversation with a German friend, he re...",
              "fullText": "A few months ago, I participated in a walking tour of Eindhoven for foreigners, where I had the pleasure of meeting people from diverse backgrounds. As someone new to Europe, I was eager to explore its wonders. During a conversation with a German friend, he recommended some German destinations 👏. Thankfully, during the golden months of April and May this year, I embarked on a road trip to these destinations, which exceeded all my expectations 🚘. Watching the sunset by the Rhine River was truly breathtaking 🌇. As the evening sun painted the sky with shades of orange and pink, I found myself fully immersed in the enchanting atmosphere, swaying to the rhythm of music from riverside bars. In Dresden, the magnificent architecture captured my imagination at every turn, each corner resembling a scene from a captivating storybook filled with unique and marvelous tales 📚. I am deeply grateful to the dedicated staff for organizing such engaging and meaningful activities. (Thanks for everything to Sandy Barkowsky😘) These initiatives provided newly arrived internationals like myself with structured opportunities to explore our new environment and connect with individuals from diverse backgrounds. Moreover, I am reminded that \"the journey of a thousand miles begins with a single step.\" I am thankful for the ongoing progress and evolution of human culture and civilization, which continuously enrich our lives with countless treasures to explore and contemplate ❤️. I eagerly anticipate future encounters with more friends and the exploration of my next trips and destinations. Holland Expat Center South👍 Gemeente Eindhoven👍",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "",
              "publicSummary": "Not just technology, but also art...Like ❤️",
              "fullText": "Not just technology, but also art...Like ❤️",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "/assets/profile-media/cindy/linkedin-2024-03-29-feed-photo-32.jpg",
              "publicSummary": "During a relaxed city walk, a remarkable coincidence occurred – I unexpectedly had the pleasure of meeting Dutch Prime Minister Rutte today, Good Friday. Despite taking a break from my career, I found myself constantly thinking about communication, marketing s...",
              "fullText": "During a relaxed city walk, a remarkable coincidence occurred – I unexpectedly had the pleasure of meeting Dutch Prime Minister Rutte today, Good Friday. Despite taking a break from my career, I found myself constantly thinking about communication, marketing strategies and business impacts, getting ideas from daily life, valuble experiences and journeys. This meeting inspired me even more, making me realize that working (eg. marketing for me) isn't just about professional skills; it's also about connecting with people, understanding their needs, and building emotional bonds. Looking back on my work experiences, I've learned that successful marketing and communication is more than just promoting products or services; it's about gaining trust and connecting with the audience. Therefore, I'm excited to continue learning and refining myself for future endeavors in this kind of field.",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "",
              "publicSummary": "A rewarding journey, which is enhancing my expertise and expanding my horizons, providing a robust platform for my personal and professional growth. # keep learning and keep growing # keep living and keep loving",
              "fullText": "A rewarding journey, which is enhancing my expertise and expanding my horizons, providing a robust platform for my personal and professional growth. # keep learning and keep growing # keep living and keep loving",
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
              "title": "LinkedIn post",
              "location": "",
              "image": "",
              "publicSummary": "I'm attending Live Insights: Emerging Markets – Sunny now, variable weather ahead. Join me!",
              "fullText": "I'm attending Live Insights: Emerging Markets – Sunny now, variable weather ahead. Join me!",
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
              "title": "LinkedIn share",
              "location": "",
              "image": "",
              "publicSummary": "https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A6877632610282078208",
              "fullText": "",
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
              "type": "AI-assisted knowledge mapping product",
              "publicSummary": "An AI-assisted knowledge mapping website that helps people turn fragmented knowledge into clearer learning paths and meaningful self-reflection.",
              "whyMade": "To explore how AI can support knowledge structuring, reflection, learning path design, and better personal or team decision-making.",
              "toolsUsed": [
                  "AI-assisted development",
                  "UX writing",
                  "knowledge structure design",
                  "quiz flow design",
                  "web iteration"
              ],
              "humanRole": "Co-created the concept, shaped the knowledge structure, wrote UX content, designed quiz flows, and iterated the website from concept to launch.",
              "aiRole": "Supported product exploration, structure generation, implementation assistance, and reflection design.",
              "result": "A launched public website and Partner Decision Council demo exploring AI-assisted reflection and structured decision-making.",
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
              "publicSummary": "Cindy’s first AI-assisted website, built from prompting and code iteration through to domain launch.",
              "whyMade": "To turn a personal idea into a real web experience and learn by building with AI coding tools.",
              "toolsUsed": [
                  "OpenAI Codex",
                  "GitHub",
                  "Cloudflare",
                  "AI-assisted web development"
              ],
              "humanRole": "Prompted, curated, pushed code, connected the domain, and shaped the concept and writing.",
              "aiRole": "Assisted with code generation, implementation details, and iteration.",
              "result": "A live first AI-assisted website experiment at minigrowlab.com.",
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
let ownerSessionProfile = "";
let ownerTimelineView = "published";
let activeCategoryFilter = "all";
let onlineDraftAvailable = false;
let onlinePublishedAvailable = false;
let onlineSyncInFlight = false;
let lastOnlineSavedAt = "";
let lastOnlinePublishedAt = "";
let lastAiImportDraft = null;

const $ = (selector) => document.querySelector(selector);
const body = document.body;

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
    links: profile.links || []
  };
  ensurePublicState(normalized);
  applyPublicState(normalized);
  return normalized;
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

function contentCollection() {
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
    .sort((a, b) => yearSortValue(b.year) - yearSortValue(a.year));
}

function publicTimelineWorks(profile = currentProfile()) {
  return profile.lifeStories
    .filter((work) => work.category === "work")
    .filter((work) => isPublicContent(profile, work, "hiddenWorkIds", "deletedWorkIds"))
    .sort((a, b) => yearSortValue(b.year) - yearSortValue(a.year));
}

function publicWorks(profile = currentProfile()) {
  return profile.aiWorks
    .filter((work) => isPublicContent(profile, work, "hiddenWorkIds", "deletedWorkIds"))
    .sort((a, b) => yearSortValue(b.year) - yearSortValue(a.year));
}

function publicWorkLinks(profile = currentProfile()) {
  return publicWorks(profile)
    .filter((work) => work.link)
    .map((work) => ({ label: work.title, url: work.link }));
}

function publicTimelineItems(profile = currentProfile()) {
  return [...publicStories(profile), ...publicTimelineWorks(profile)]
    .sort((a, b) => yearSortValue(b.year) - yearSortValue(a.year));
}

function categoryMatchesFilter(item, filter = activeCategoryFilter) {
  return filter === "all" || (item.category || "life") === filter;
}

function timelineStories(profile = currentProfile()) {
  const items = ownerMode ? profile.lifeStories : publicTimelineItems(profile);
  return items
    .filter((item) => categoryMatchesFilter(item))
    .filter((story) => story.status === ownerTimelineView)
    .sort((a, b) => yearSortValue(b.year) - yearSortValue(a.year));
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
    $("#entryView").hidden = false;
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

  const normalizedRoute = normalizeUsername(route);
  activeUsername = normalizedRoute && (profiles[normalizedRoute] || !seedProfiles[normalizedRoute])
    ? normalizedRoute
    : "leo";
  if (!ownerMode) loadPublicProfile(activeUsername);
  localStorage.setItem(ACTIVE_PROFILE_KEY, activeUsername);
  body.classList.add("profile-open");
  $("#entryView").hidden = true;
  document.querySelectorAll(".profile-content").forEach((node) => { node.hidden = false; });
  history.pushState(null, "", `/u/${activeUsername}`);
  renderProfile();
  if (ownerMode) loadDraftProfileOnline(activeUsername);
  else loadPublishedProfileOnline(activeUsername);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function routeFromLocation() {
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
          const summary = ownerMode ? story.publicSummary : publicStorySummary(story);
          return `
          <article class="event-card ${coverImage ? "has-media" : "no-media"} ${story.status !== "published" ? "private-card" : ""} status-${escapeHtml(story.status)}" data-content-id="${escapeHtml(story.id)}" data-content-type="${escapeHtml(itemType)}">
            <div class="event-media">${coverImage ? `<img class="event-main-image" src="${escapeHtml(coverImage)}" alt="${escapeHtml(story.title)}" />` : `<div class="empty-media" aria-label="No image yet"></div>`}</div>
            <div>
              <div class="event-card-head">
                <div class="event-date">${escapeHtml([categoryLabel, story.date, story.location].filter(Boolean).join(" - "))}</div>
                <div class="event-actions owner-only">${itemType === "work" ? workActions(story) : storyActions(story)}</div>
              </div>
              <h3>${escapeHtml(story.title)}</h3>
              ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
              ${extraImages.length ? `<details class="event-gallery"><summary>View ${extraImages.length} more photo${extraImages.length === 1 ? "" : "s"}</summary><div>${extraImages.map((image, index) => `<img src="${escapeHtml(image)}" alt="${escapeHtml(`${story.title} photo ${index + 2}`)}" />`).join("")}</div></details>` : ""}
              ${story.link ? `<a class="source-link" href="${escapeHtml(story.link)}" target="_blank" rel="noopener">Open link</a>` : ""}
              ${ownerMode && story.tags?.length ? `<div class="tag-row owner-only">${story.tags.slice(0, 3).map((tag) => `<span class="timeline-tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
            </div>
          </article>
        `; }).join("")}
      </div>
    </article>
  `).join("") : `<p class="empty-result">No ${activeCategoryFilter === "all" ? "" : `${CATEGORY_LABELS[activeCategoryFilter]} `}${ownerMode ? (ownerTimelineView === "published" ? "visible" : ownerTimelineView) : "published"} items yet</p>`;
}

function renderWorkProjects() {
  const projects = ownerMode ? currentProfile().aiWorks : publicWorks();
  $("#ai-works").hidden = !projects.length;
  $("#aiWorksList").innerHTML = projects.length ? projects.map((work) => `
    <article class="work-card ${work.status !== "published" ? "private-card" : ""}">
      <div class="work-card-head">
        <div><h3>${escapeHtml(work.title)}</h3></div>
        ${ownerMode ? `<span class="visibility-pill status-${escapeHtml(work.status)}">${escapeHtml(work.status === "published" ? "visible" : work.status)}</span>` : ""}
      </div>
      <p>${escapeHtml(work.publicSummary)}</p>
      ${work.link ? `<a class="work-link-action" href="${escapeHtml(work.link)}" target="_blank" rel="noopener">Open link</a>` : ""}
    </article>
  `).join("") : "";
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

function enterOwnerMode(profileUsername = ownerSessionProfile || activeUsername) {
  if (profileUsername && !profiles[profileUsername]) {
    profiles[profileUsername] = starterProfile({ username: profileUsername, displayName: profileUsername });
  }
  if (profiles[profileUsername]) activeUsername = profileUsername;
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
  const cities = [...new Set([...CITY_OPTIONS, ...profileCities])].sort((a, b) => a.localeCompare(b));
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
  const nextUsername = $("#profileEditUsername").value.trim().replace(/^@/, "").toLowerCase();
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
  setRoute(activeUsername);
  setOwnerSaveStatus("Profile text saved to current profile data and local draft. Saving online draft...");
  saveProfileDraftOnline({ quiet: false });
}

function toggleWorkFields(type) {
  document.querySelectorAll(".work-only").forEach((node) => { node.hidden = true; });
  document.querySelectorAll(".story-only").forEach((node) => { node.hidden = false; });
}

function findContent(type, id) {
  const category = categoryForType(type);
  return contentCollection().find((item) => item.id === id && (category === "work" ? item.category === "work" : item.category !== "work"));
}

function upsertContent(event) {
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
  const collection = contentCollection();
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

function setContentStatus(type, id, status) {
  const item = findContent(type, id);
  if (!item || !STATUSES.includes(status)) return;
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
  const collection = contentCollection();
  const index = collection.findIndex((item) => item.id === id);
  if (index >= 0) collection.splice(index, 1);
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
  if (open) $("#registerName").focus();
}

function setAiImportDrawer(open) {
  $("#aiImportDrawer").classList.toggle("open", open);
  $("#aiImportDrawer").setAttribute("aria-hidden", String(!open));
  if (open) $("#aiImportSource").focus();
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
  $("#registrationSubmit").disabled = true;
  $("#registrationNote").textContent = "Creating your Turnpo page...";
  try {
    const data = await authRequest("/api/auth/register", { name, email });
    const username = data.profile;
    profiles[username] = normalizeProfile(data.profileData || starterProfile({ username, displayName: name, email }));
    activeUsername = username;
    ownerSessionProfile = username;
    saveActiveProfile();
    localStorage.setItem(ACTIVE_PROFILE_KEY, username);
    setRegistrationDrawer(false);
    $("#registrationForm").reset();
    enterOwnerMode(username);
    setOwnerSaveStatus("Profile created. Add life stories, AI works, or use AI text import for text-only drafts. Images can be updated manually.");
  } catch (error) {
    $("#registrationNote").textContent = error.message;
  } finally {
    $("#registrationSubmit").disabled = false;
  }
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

function generateAiImportDraft(source = "") {
  const lines = meaningfulSourceLines(source);
  const keywords = keywordSummary(source);
  const title = pickDraftTitle(source);
  const year = pickDraftYear(source);
  const month = pickDraftMonth(source);
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
    publicSummary,
    whyItMatters,
    tags,
    analysis,
    copyText
  };
}

function renderAiImportDraft(draft) {
  lastAiImportDraft = draft;
  $("#aiImportOutput").hidden = false;
  $("#useLocalAiImportFallback").hidden = true;
  $("#aiImportAnalysis").textContent = draft.analysis;
  $("#aiImportDraft").value = draft.copyText;
  $("#aiImportNote").textContent = draft.provider === "openai"
    ? `AI text document generated with ${draft.model || "OpenAI"}. Copy it, or add it as a hidden Life item. Images are added manually after review.`
    : "Text document generated locally. Copy it, or add it as a hidden Life item. Images are added manually after review.";
}

async function requestAiImportDraft(source) {
  const response = await fetch("/api/ai/import-profile", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sourceText: source,
      profileName: currentProfile().displayName || "",
      username: currentProfile().username || ""
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "AI import is not available.");
  return {
    ...data.draft,
    provider: data.provider,
    model: data.model
  };
}

async function prepareAiImport(event) {
  event.preventDefault();
  const source = $("#aiImportSource").value.trim();
  if (!source) {
    $("#aiImportNote").textContent = "Paste CV text, LinkedIn text, a written profile, or personal notes first.";
    return;
  }
  $("#aiImportOutput").hidden = true;
  $("#useLocalAiImportFallback").hidden = true;
  $("#aiImportSubmit").disabled = true;
  $("#aiImportNote").textContent = "Calling AI to generate a text-only Turnpo document...";
  try {
    renderAiImportDraft(await requestAiImportDraft(source));
  } catch (error) {
    lastAiImportDraft = null;
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
  const fallbackDraft = generateAiImportDraft(source);
  fallbackDraft.provider = "local";
  renderAiImportDraft(fallbackDraft);
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
  if (!lastAiImportDraft) {
    $("#aiImportNote").textContent = "Generate a text document before adding it.";
    return;
  }
  const now = new Date().toISOString();
  const item = normalizeContent({
    id: `story-ai-import-${crypto.randomUUID()}`,
    category: "life",
    title: lastAiImportDraft.title,
    year: lastAiImportDraft.year,
    date: storyDateValue(lastAiImportDraft.year, lastAiImportDraft.month || defaultStoryDate().month),
    location: currentProfile().location || "",
    publicSummary: lastAiImportDraft.publicSummary,
    whyItMatters: lastAiImportDraft.whyItMatters,
    tags: lastAiImportDraft.tags,
    status: "hidden",
    userApproved: false,
    ownerEdited: true,
    ownerEditedAt: now,
    updatedAt: now
  }, "story");
  currentProfile().lifeStories.unshift(item);
  syncPublicStateForItem(currentProfile(), "story", item);
  saveActiveProfile();
  renderProfile();
  $("#aiImportNote").textContent = "Added as a hidden text-only Life draft. Review, edit, and add images manually before publishing.";
  saveProfileDraftOnline({ quiet: true });
}

function resetAuthForm(message = "Only approved owner emails can enter founder mode. If your email is approved, Turnpo will send a one-time code.") {
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
    $("#authNote").textContent = "Enter your approved owner email first.";
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
    $("#authNote").textContent = "If this email is approved, a 6-digit code has been sent. Codes expire after 10 minutes.";
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
      if (!profiles[ownerSessionProfile]) {
        profiles[ownerSessionProfile] = starterProfile({
          username: ownerSessionProfile,
          displayName: ownerSessionProfile,
          email: session.email || ""
        });
      }
    }
  } catch {
    ownerSessionProfile = "";
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
$("#saveProfileState").addEventListener("click", saveCurrentProfileState);
$("#publishProfileOnline").addEventListener("click", () => {
  saveActiveProfile();
  publishProfileOnline({ quiet: false });
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

renderContentDateOptions();
renderLocationOptions();
renderHome();
setRoute(routeFromLocation());
checkOwnerSession();
