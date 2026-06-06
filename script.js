const ACTIVE_PROFILE_KEY = "turnpo:active-profile";
const LOCAL_PREFIX = "turnpo:profile:";
const SOURCE_PREFIX = "turnpo:source:";
const COLLAPSED_YEARS_PREFIX = "turnpo:collapsed-years:";
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

const seedProfiles = {
  leo: {
    id: "profile-leo",
    status: "published",
    seedVersion: "linkedin-export-2026-06-04",
    username: "leo",
    displayName: "Leo Yang",
    oneLineIntro: "L&KM Solution Designer @ ASML | Co-creator of MapKAI | Exploring knowledge, systems, and reflection in the AI era",
    currentChapter: "Exploring AI-native knowledge mapping, reflection, learning systems, and practical decision workflows through MapKAI and public experiments.",
    location: "Eindhoven, Netherlands",
    avatar: "/assets/leo-profile.png",
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
  }
};

let profiles = loadProfiles();
let activeUsername = "leo";
let ownerMode = false;
let editingRef = null;
let activeEditorType = "story";
let pendingOwnerEmail = "";
let authCodeRequested = false;
let ownerTimelineView = "published";

const $ = (selector) => document.querySelector(selector);
const body = document.body;

function clone(value) {
  return structuredClone(value);
}

function localKey(username) {
  return `${LOCAL_PREFIX}${username}`;
}

function sourceKey(username) {
  return `${SOURCE_PREFIX}${username}`;
}

function savedProfile(username) {
  try {
    const saved = JSON.parse(localStorage.getItem(localKey(username)));
    const seed = seedProfiles[username];
    if (!saved) return null;
    if (seed?.seedVersion && saved.seedVersion !== seed.seedVersion) return null;
    return normalizeProfile(saved);
  } catch {
    return null;
  }
}

function loadProfiles() {
  const next = clone(seedProfiles);
  Object.keys(next).forEach((username) => {
    next[username] = savedProfile(username) || normalizeProfile(next[username]);
  });
  return next;
}

function loadOwnerProfile(username) {
  profiles[username] = savedProfile(username) || normalizeProfile(clone(seedProfiles[username]));
}

function normalizeProfile(profile) {
  return {
    ...profile,
    status: profile.status === "published" || profile.username === "leo" ? "published" : "hidden",
    lifeStories: (profile.lifeStories || []).map((item) => normalizeContent(item, "story")),
    aiWorks: (profile.aiWorks || []).map((item) => normalizeContent(item, "work")),
    values: profile.values || [],
    themes: profile.themes || [],
    links: profile.links || []
  };
}

function normalizeContent(item, type) {
  const now = new Date().toISOString();
  const existingImages = Array.isArray(item.images) ? item.images : [];
  const images = type === "story" ? [...new Set([...existingImages, item.image].filter(Boolean))] : item.images;
  const rawStatus = item.status === "draft" ? "hidden" : item.status;
  const status = STATUSES.includes(rawStatus) ? rawStatus : "published";
  return {
    ...item,
    id: item.id || `${type}-${crypto.randomUUID()}`,
    status,
    userApproved: status === "published" ? item.userApproved !== false : false,
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
    publishedAt: item.publishedAt || (status === "published" ? now : ""),
    unpublishedAt: item.unpublishedAt || "",
    deletedAt: item.deletedAt || "",
    ...(type === "story" ? { image: images[0] || "", images } : {})
  };
}

function saveActiveProfile() {
  localStorage.setItem(localKey(activeUsername), JSON.stringify(profiles[activeUsername]));
}

function currentProfile() {
  return profiles[activeUsername] || profiles.leo;
}

function isPublished(item) {
  return item.status === "published" && item.userApproved !== false;
}

function isPublicProfile(profile) {
  return profile.status === "published";
}

function publishedProfiles() {
  return Object.values(profiles).filter(isPublicProfile);
}

function publicStories(profile = currentProfile()) {
  return profile.lifeStories.filter(isPublished).sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
}

function publicWorks(profile = currentProfile()) {
  return profile.aiWorks.filter(isPublished);
}

function ownerItems(collection) {
  return ownerMode ? collection.filter((item) => item.status !== "deleted") : collection.filter(isPublished);
}

function timelineStories(profile = currentProfile()) {
  if (!ownerMode) return publicStories(profile);
  return profile.lifeStories
    .filter((story) => story.status === ownerTimelineView)
    .sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
}

function ownerStoryCounts(profile = currentProfile()) {
  return profile.lifeStories.reduce((counts, story) => ({
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

function absoluteUrl(value = "") {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
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

  activeUsername = profiles[route] && isPublicProfile(profiles[route]) ? route : "leo";
  localStorage.setItem(ACTIVE_PROFILE_KEY, activeUsername);
  body.classList.add("profile-open");
  $("#entryView").hidden = true;
  document.querySelectorAll(".profile-content").forEach((node) => { node.hidden = false; });
  history.pushState(null, "", `/u/${activeUsername}`);
  renderProfile();
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
    ...publicStories(profile).flatMap((story) => [story.title, story.location, story.publicSummary, ...(story.tags || [])]),
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
  $("#profileLinks").innerHTML = profile.links.map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`).join("");
  $("#aiMarkdown").value = generateAiProfile(profile);
  renderTimeline();
  renderAiWorks();
  renderOwnerWorkspace();
  renderJsonLd(profile);
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

function setTimelineYearCollapsed(year, collapsed) {
  const collapsedYears = loadCollapsedYears();
  if (collapsed) collapsedYears.add(year);
  else collapsedYears.delete(year);
  saveCollapsedYears(collapsedYears);
  renderTimeline();
}

function setAllTimelineYearsCollapsed(collapsed) {
  const years = Object.keys(groupedStories()).sort((a, b) => Number(b) - Number(a));
  saveCollapsedYears(collapsed ? new Set(years) : new Set());
  renderTimeline();
}

function statusPill(item) {
  const labels = { published: "visible", hidden: "hidden", deleted: "deleted" };
  return ownerMode ? `<span class="visibility-pill status-${escapeHtml(item.status)}">${escapeHtml(labels[item.status] || item.status)}</span>` : "";
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

function imageValueType(value) {
  if (!value) return "";
  if (value.startsWith("data:image/")) return "Uploaded image";
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

async function useImageFiles(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) return;
  try {
    $("#contentStatusNote").textContent = imageFiles.length === 1 ? "Preparing image..." : "Preparing images...";
    const imageData = await Promise.all(imageFiles.map((file) => optimizeImageFile(file)));
    renderImageUpload([...storyImagesFromValue($("#contentImage").value), ...imageData]);
    $("#contentStatusNote").textContent = "Images ready. Remember to save content.";
  } catch (error) {
    $("#contentStatusNote").textContent = error.message;
  }
}

async function addImageFilesToStory(storyId, files) {
  if (!ownerMode || !storyId) return;
  const story = findContent("story", storyId);
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!story || !imageFiles.length) return;
  const card = document.querySelector(`[data-story-id="${CSS.escape(storyId)}"]`);
  try {
    card?.classList.add("is-uploading");
    const currentImages = story.images?.length ? story.images : (story.image ? [story.image] : []);
    const nextImages = [...currentImages, ...(await Promise.all(imageFiles.map((file) => optimizeImageFile(file))))];
    story.images = nextImages;
    story.image = nextImages[0] || "";
    story.updatedAt = new Date().toISOString();
    saveActiveProfile();
    renderProfile();
  } catch (error) {
    card?.classList.remove("is-uploading");
    openEditor("story", storyId);
    $("#contentStatusNote").textContent = error.message;
  }
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
  renderOwnerContentControls();
  const groups = groupedStories();
  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
  const collapsedYears = loadCollapsedYears();
  $("#yearFilters").innerHTML = years.map((year) => `<button type="button" data-year="${year}">${year}</button>`).join("");
  const viewLabel = ownerMode ? ownerTimelineView : "published";
  $("#timelineList").innerHTML = years.length ? years.map((year) => `
    <article class="year-block ${collapsedYears.has(year) ? "is-collapsed" : ""}" id="timeline-year-${escapeHtml(year)}" tabindex="-1" data-year-block="${escapeHtml(year)}">
      <div class="year-label">${escapeHtml(year)}</div>
      <button class="year-title" type="button" data-toggle-year="${escapeHtml(year)}" aria-expanded="${collapsedYears.has(year) ? "false" : "true"}" aria-controls="timeline-events-${escapeHtml(year)}">
        <span class="year-caret" aria-hidden="true"></span>
        <strong>${escapeHtml(year)}</strong>
        <span>${groups[year].length} ${viewLabel === "published" ? "visible" : viewLabel} highlight${groups[year].length === 1 ? "" : "s"}</span>
      </button>
      <div class="event-stack" id="timeline-events-${escapeHtml(year)}">
        ${groups[year].map((story) => {
          const storyImages = story.images?.length ? story.images : (story.image ? [story.image] : []);
          const coverImage = storyImages[0] || "";
          const extraImages = storyImages.slice(1);
          return `
          <article class="event-card ${story.status !== "published" ? "private-card" : ""} status-${escapeHtml(story.status)}" data-story-id="${escapeHtml(story.id)}">
            <div class="event-media">${coverImage ? `<img class="event-main-image" src="${escapeHtml(coverImage)}" alt="${escapeHtml(story.title)}" />` : `<div class="empty-media" aria-label="No image yet"></div>`}</div>
            <div>
              <div class="event-card-head">
                <div class="event-date">${escapeHtml([story.date, story.location].filter(Boolean).join(" - "))}</div>
                <div class="event-actions owner-only">${storyActions(story)}</div>
              </div>
              <h3>${escapeHtml(story.title)}</h3>
              <p>${escapeHtml(story.publicSummary)}</p>
              ${extraImages.length ? `<details class="event-gallery"><summary>View ${extraImages.length} more photo${extraImages.length === 1 ? "" : "s"}</summary><div>${extraImages.map((image, index) => `<img src="${escapeHtml(image)}" alt="${escapeHtml(`${story.title} photo ${index + 2}`)}" />`).join("")}</div></details>` : ""}
              ${story.fullText ? `<details class="event-full-text"><summary>Full LinkedIn post</summary><p>${escapeHtml(story.fullText)}</p></details>` : ""}
              ${story.sourceUrl ? `<a class="source-link" href="${escapeHtml(story.sourceUrl)}" target="_blank" rel="noopener">Open LinkedIn source</a>` : ""}
              <div class="tag-row">${(story.tags || []).slice(0, 3).map((tag) => `<span class="timeline-tag">${escapeHtml(tag)}</span>`).join("")}</div>
            </div>
          </article>
        `; }).join("")}
      </div>
    </article>
  `).join("") : `<p class="empty-result">No ${ownerMode ? (ownerTimelineView === "published" ? "visible" : ownerTimelineView) : "published"} stories yet</p>`;
}

function renderAiWorks() {
  const works = ownerItems(currentProfile().aiWorks);
  $("#aiWorksList").innerHTML = works.length ? works.map((work) => `
    <${work.link ? "a" : "article"} class="work-card ${work.status !== "published" ? "private-card" : ""}" ${work.link ? `href="${escapeHtml(work.link)}" target="_blank" rel="noopener"` : ""}>
      <div class="work-card-head">
        <div><h3>${escapeHtml(work.title)}</h3></div>
        <div class="event-actions owner-only">${statusPill(work)}<button class="small-action" type="button" data-edit-type="work" data-edit-id="${work.id}">Edit</button></div>
      </div>
      <p>${escapeHtml(work.publicSummary)}</p>
    </${work.link ? "a" : "article"}>
  `).join("") : `<p class="empty-result">No published AI works yet</p>`;
}

function generateAiProfile(profile) {
  const stories = publicStories(profile);
  const works = publicWorks(profile);
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
${stories.length ? stories.map((story) => `- ${story.year}: ${story.title} (${story.location || "location not specified"}) - ${story.publicSummary}`).join("\n") : "- No published stories yet"}

## Public AI works
${works.length ? works.map((work) => `- ${work.title} (${work.type}) - ${work.publicSummary} Human role: ${work.humanRole} AI role: ${work.aiRole} Result: ${work.result}`).join("\n") : "- No published AI works yet"}

## Public links
${profile.links.length ? profile.links.map((link) => `- [${link.label}](${link.url})`).join("\n") : "- No public links yet"}

## Suggested questions for AI-assisted review
- What shaped this person beyond their job title?
- What are they building in the AI era?
- Which values and themes appear across their public stories?

Only published and user-approved Turnpo content is included in this AI-readable profile.`;
}

function renderOwnerWorkspace() {
  $("#sourceWorkspace").value = ownerMode ? localStorage.getItem(sourceKey(activeUsername)) || "" : "";
}

function renderJsonLd(profile) {
  const profileUrl = `${SITE_URL}/u/${profile.username}`;
  const stories = publicStories(profile);
  const works = publicWorks(profile);
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
        sameAs: profile.links.map((link) => link.url),
        subjectOf: [
          ...stories.map((story) => ({
            "@type": "CreativeWork",
            name: story.title,
            dateCreated: String(story.year),
            description: story.publicSummary,
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
  if (enabled) {
    loadOwnerProfile(activeUsername);
  }
  body.classList.toggle("owner-mode", enabled);
  if (body.classList.contains("profile-open")) renderProfile();
  else renderHome($("#personSearch").value);
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
  $("#contentModeLabel").textContent = item ? `Edit ${type}` : `New ${type}`;
  $("#contentFormTitle").textContent = item ? "Update content" : type === "story" ? "Add life story" : "Add AI work";
  $("#contentType").value = type;
  $("#contentTitle").value = item?.title || "";
  const storyDate = parseStoryDate(item);
  $("#contentYear").value = storyDate.year;
  $("#contentMonth").value = storyDate.month;
  $("#contentLocation").value = item?.location || "";
  renderLocationOptions();
  renderImageUpload(item?.images || (item?.image ? [item.image] : []));
  $("#contentStatus").value = item?.status || "published";
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
  const previousSource = localStorage.getItem(sourceKey(previousUsername));
  localStorage.removeItem(localKey(previousUsername));
  if (previousSource !== null) {
    localStorage.removeItem(sourceKey(previousUsername));
    localStorage.setItem(sourceKey(activeUsername), previousSource);
  }
  saveActiveProfile();
  localStorage.setItem(ACTIVE_PROFILE_KEY, activeUsername);
  closeProfileEditor();
  setRoute(activeUsername);
}

function toggleWorkFields(type) {
  document.querySelectorAll(".work-only").forEach((node) => { node.hidden = type !== "work"; });
  document.querySelectorAll(".story-only").forEach((node) => { node.hidden = type !== "story"; });
}

function findContent(type, id) {
  const collection = type === "work" ? currentProfile().aiWorks : currentProfile().lifeStories;
  return collection.find((item) => item.id === id);
}

function upsertContent(event) {
  event.preventDefault();
  const type = $("#contentType").value;
  const status = $("#contentStatus").value;
  const wantsPublish = status === "published";
  const now = new Date().toISOString();
  const base = normalizeContent({
    id: editingRef?.id || `${type}-${crypto.randomUUID()}`,
    title: $("#contentTitle").value.trim(),
    year: $("#contentYear").value.trim(),
    date: storyDateValue($("#contentYear").value.trim(), $("#contentMonth").value.trim()),
    location: $("#contentLocation").value.trim(),
    image: storyImagesFromValue($("#contentImage").value)[0] || "",
    images: storyImagesFromValue($("#contentImage").value),
    publicSummary: $("#contentSummary").value.trim(),
    tags: parseList($("#contentTags").value),
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
  const collection = type === "work" ? currentProfile().aiWorks : currentProfile().lifeStories;
  const existingIndex = collection.findIndex((item) => item.id === base.id);
  const nextItem = type === "work" ? {
    ...base,
    type: $("#workType").value.trim(),
    whyMade: $("#contentWhy").value.trim(),
    toolsUsed: parseList($("#workTools").value),
    humanRole: $("#humanRole").value.trim(),
    aiRole: $("#aiRole").value.trim(),
    result: $("#workResult").value.trim(),
    link: $("#workLink").value.trim()
  } : {
    ...base
  };
  if (existingIndex >= 0) collection[existingIndex] = nextItem;
  else collection.unshift(nextItem);
  saveActiveProfile();
  renderProfile();
  closeEditor();
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
  }
  saveActiveProfile();
  renderProfile();
}

function setContentStatus(type, id, status) {
  const item = findContent(type, id);
  if (!item || !STATUSES.includes(status)) return;
  const now = new Date().toISOString();
  item.status = status;
  item.userApproved = status === "published";
  item.updatedAt = now;
  if (status === "published") item.publishedAt = now;
  if (status === "hidden") item.unpublishedAt = now;
  if (status !== "deleted") item.deletedAt = "";
  saveActiveProfile();
  renderProfile();
}

function restoreContentById(type, id) {
  const item = findContent(type, id);
  if (!item || item.status !== "deleted") return;
  const restoreStatus = item.previousStatus === "published" ? "published" : "hidden";
  delete item.previousStatus;
  setContentStatus(type, id, restoreStatus);
}

function permanentlyDeleteContentById(type, id) {
  const collection = type === "work" ? currentProfile().aiWorks : currentProfile().lifeStories;
  const index = collection.findIndex((item) => item.id === id);
  if (index >= 0) collection.splice(index, 1);
  saveActiveProfile();
  renderProfile();
}

function emptyDeletedStories() {
  currentProfile().lifeStories = currentProfile().lifeStories.filter((story) => story.status !== "deleted");
  saveActiveProfile();
  renderProfile();
}

function setAuthDrawer(open) {
  $("#authDrawer").classList.toggle("open", open);
  $("#authDrawer").setAttribute("aria-hidden", String(!open));
  if (open && !authCodeRequested) $("#ownerEmail").focus();
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
    if (session.profile && profiles[session.profile]) activeUsername = session.profile;
    setOwnerMode(true);
    setAuthDrawer(false);
    setRoute(activeUsername);
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
    if (session.authenticated && session.profile && profiles[session.profile]) {
      activeUsername = session.profile;
      setOwnerMode(true);
    }
  } catch {
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
  setOwnerMode(false);
  resetAuthForm("You have exited owner mode.");
}

async function copyAiProfile() {
  const button = $("#copyMd");
  const original = button.innerHTML;
  const markdown = $("#aiMarkdown");
  let copied = false;
  try {
    await navigator.clipboard.writeText(markdown.value);
    copied = true;
  } catch {
    markdown.focus();
    markdown.select();
    copied = document.execCommand("copy");
    markdown.setSelectionRange(0, 0);
  }
  if (copied) {
    button.classList.add("is-copied");
    button.innerHTML = "Copied";
    $("#copyStatus").textContent = "Copied published-only AI Profile Markdown";
  } else {
    button.innerHTML = "Copy failed";
    $("#copyStatus").textContent = "Copy failed. Select the text and copy manually.";
  }
  setTimeout(() => {
    button.classList.remove("is-copied");
    button.innerHTML = original;
    $("#copyStatus").textContent = "Ready to copy into any AI chat";
  }, 2400);
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
  profiles[activeUsername] = normalizeProfile(clone(seedProfiles[activeUsername]));
  renderProfile();
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
  const storyCard = event.target.closest("[data-story-id]");
  openEditor("story", storyCard ? storyCard.dataset.storyId : "");
});

$("#timelineList").addEventListener("dragover", (event) => {
  if (!ownerMode || !dragHasFiles(event)) return;
  const storyCard = event.target.closest("[data-story-id]");
  if (!storyCard) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  document.querySelectorAll(".event-card.is-drop-target").forEach((card) => {
    if (card !== storyCard) card.classList.remove("is-drop-target");
  });
  storyCard.classList.add("is-drop-target");
});

$("#timelineList").addEventListener("dragleave", (event) => {
  const storyCard = event.target.closest("[data-story-id]");
  if (!storyCard || storyCard.contains(event.relatedTarget)) return;
  storyCard.classList.remove("is-drop-target");
});

$("#timelineList").addEventListener("drop", (event) => {
  if (!ownerMode || !event.dataTransfer?.files?.length) return;
  const storyCard = event.target.closest("[data-story-id]");
  if (!storyCard) return;
  event.preventDefault();
  document.querySelectorAll(".event-card.is-drop-target").forEach((card) => card.classList.remove("is-drop-target"));
  addImageFilesToStory(storyCard.dataset.storyId, event.dataTransfer.files);
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
$("#closeContent").addEventListener("click", closeEditor);
$("#closeBackdrop").addEventListener("click", closeEditor);
$("#closeProfileEditor").addEventListener("click", closeProfileEditor);
$("#closeProfileBackdrop").addEventListener("click", closeProfileEditor);
$("#contentType").addEventListener("change", (event) => toggleWorkFields(event.target.value));
$("#contentForm").addEventListener("submit", upsertContent);
$("#profileForm").addEventListener("submit", saveProfileText);
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
  if ($("#contentType").value !== "story") return;
  const file = imageFileFromPaste(event);
  if (!file) return;
  event.preventDefault();
  useImageFiles([file]);
});
$("#homeOwnerLogin").addEventListener("click", () => setAuthDrawer(true));
$("#ownerLogout").addEventListener("click", logoutOwner);
$("#backToSearch").addEventListener("click", () => setRoute("home"));
$("#closeAuth").addEventListener("click", () => setAuthDrawer(false));
$("#authBackdrop").addEventListener("click", () => setAuthDrawer(false));
$("#exportProfile").addEventListener("click", exportProfile);
$("#restoreSeed").addEventListener("click", resetActiveProfile);
$("#copyMd").addEventListener("click", copyAiProfile);
$("#saveSource").addEventListener("click", () => {
  localStorage.setItem(sourceKey(activeUsername), $("#sourceWorkspace").value);
  $("#sourceStatus").textContent = "Saved as owner-only local source material. It is not included in the public AI profile.";
});

$("#authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (authCodeRequested) await verifyLoginCode();
  else await requestLoginCode();
});

window.addEventListener("popstate", () => setRoute(routeFromLocation()));

renderContentDateOptions();
renderLocationOptions();
renderHome();
setRoute(routeFromLocation());
checkOwnerSession();
