const CFA_ACCESS_KEY = "turnpo:cfa-access";
const CFA_ACCESS_PASSWORD = "team6";
const CFA_LANGUAGE_KEY = "turnpo-cfa-language";
const CFA_LANGUAGES = Object.freeze(["en", "nl", "de"]);

const CFA_I18N = Object.freeze({
  en: Object.freeze({
    languageLabel: "Language",
    cfaAccessLabel: "CFA access",
    courseHubLabel: "September 2026 Corporate Finance and Accounting course hub",
    turnpoHome: "Turnpo home",
    embaArchive: "EMBA Archive",
    privateCourseHub: "Private course hub",
    accessTitle: "September 2026 CFA",
    accessAvailability: "This learning hub is available to Team 6 members.",
    accessCodeLabel: "Access code",
    accessCodePlaceholder: "Enter access code",
    openHub: "Open hub",
    accessFootnote: "7–11 September 2026 · MaastrichtMBA / EMBA",
    loadingHub: "Loading the September 2026 course hub…",
    heroEyebrow: "September 2026 · Executive education",
    heroLede: "A five-day learning journey from capital allocation and financial information to risk, control, compliance and long-term value.",
    exploreCourseHub: "Explore the course hub",
    heroCaption: "7–11 September 2026 · 6 ECTS",
    courseAtGlance: "Course at a glance",
    heroAsideTitle: "Financial leadership in practice.",
    courseDays: "course days",
    requiredReadings: "required readings",
    integratedPitch: "integrated pitch",
    courseOverview: "Course overview",
    overviewTitle: "One decision framework for finance, risk and value.",
    overviewCopy: "The module connects investment and financing choices, accounting information, performance control, enterprise risk, compliance and ESG reporting. The aim is not to memorise isolated models, but to use evidence to make and defend a responsible recommendation.",
    courseRouteLabel: "Course route",
    routeJourneyTitle: "Five-day learning journey",
    routeJourneyCopy: "Follow the sequence from financial management to integration and presentation.",
    routeTeam6Title: "Featured · Team 6 impact investing",
    routeTeam6Copy: "Assess BeFrank and Impact Investing from the employer perspective as an integrated group presentation.",
    routeToolkitTitle: "Toolkit, notes & audio",
    routeToolkitCopy: "Read the learning cards, listen to the podcasts and keep the full study trail together.",
    learningHub: "Learning hub",
    hubTitle: "Study, listen, apply.",
    hubCopy: "Open a section below to move from the course map to the daily materials, the Team 6 case, personal reflection and integrated notes.",
    materialsLearningTrail: "Course materials and learning trail",
    materialsLearningTrailCopy: "Use each section as a deliberate step: prepare, listen, read, reflect and apply.",
    supportingCourseToolkit: "Supporting course toolkit",
    materialsResources: "Materials & resources",
    integratedClassNotes: "Integrated class notes",
    reflection: "Reflection",
    professionalVocabulary: "Professional vocabulary",
    wrongPassword: "Incorrect access code. Please try again.",
    openingMaterial: "Opening course material…",
    unableMaterial: "Unable to open this material:",
    noMaterials: "No materials are available yet.",
    noMaterialsYet: "No materials yet",
    noSupportingGuidesYet: "No supporting guides yet",
    supportingGuides: "supporting guides",
    noVocabularyYet: "No vocabulary yet",
    vocabularyMeta: "30 terms · IPA pronunciation",
    noPhotosYet: "No photos yet",
    photo: "photo",
    photos: "photos",
    integratedReflection: "Integrated reflection",
    noReflectionYet: "No reflection yet",
    notesSaved: "Notes saved",
    noClassNotesYet: "No class notes yet",
    material: "material",
    materials: "materials",
    audioEpisodes: "audio episodes",
    openTeam6: "Open Team 6 Assignment",
    openKnowledgeMap: "Open Knowledge Map",
    openDayMaterials: "Open Day {day} Materials",
    openVocabulary: "Open Vocabulary",
    openSelfStudyGuide: "Open Self-Study Guide",
    openReadingMap: "Open Reading Map",
    openCaseMaterials: "Open Case Materials",
    openPresentationPrep: "Open Presentation Prep",
    openReflection: "Open Reflection",
    openSyllabusGuide: "Open Syllabus Guide",
    openReadingChecklist: "Open Reading Checklist",
    openStudyCard: "Open Study Card",
    openCaseCard: "Open Case Card",
    openSourcePdf: "Open Source PDF",
    openMaterial: "Open Material",
    openFile: "Open File",
    featuredTeam6: "Featured · Team 6 · 25% group presentation",
    team6Title: "Team 6 | BeFrank & Impact Investing",
    team6DefaultNotes: "Team 6 examines whether impact investing makes sense for employees from the employer's perspective. The case considers whether the company should ask BeFrank to incorporate more impact investing into its pension offering and, if BeFrank is not the most suitable solution, what alternative pension arrangement could be considered.",
    courseToolkit: "Course toolkit",
    toolkitTitle: "Build the week before you study it.",
    toolkitCopy: "Start with the dependency map, evidence status, vocabulary and GPT prompts that hold the five-day course together.",
    septemberCfa: "September CFA",
    knowledgeMapDefault: "Knowledge Map + GPT Copy Pack",
    knowledgeMapNotes: "A five-day knowledge map and guided-study pack.",
    fiveDayJourney: "Five-day learning journey",
    journeyTitle: "Move from the decision to the defence.",
    journeyCopy: "Each day has its own complete learning page. Open it here and keep the course trail inside the CFA hub.",
    dayLabel: "Day",
    completeMaterial: "Complete course material for this session.",
    backToSections: "← Back to course sections",
    fullMaterial: "September 2026 CFA · Full material",
    defaultMaterial: "Material",
    backToMaterials: "← Back to materials",
    unknownError: "Unknown error",
    openLearningPage: "Open learning page →",
    openSourceFile: "Open source file →",
    noClassNotes: "No class notes saved yet.",
    languageEnglish: "English",
    languageDutch: "Dutch",
    languageGerman: "German",
    monthSeptember: "September",
    courseDate: "September 2026",
    courseTitle: "Corporate Finance & Accounting",
    courseSummary: "An integrated five-day module covering corporate finance, accounting, management control, enterprise risk, compliance and sustainability reporting.",
    courseMeta: "7–11 September 2026 · 6 ECTS · MaastrichtMBA / EMBA",
    courseSyllabus: "Course Syllabus",
    courseSyllabusNotes: "Course structure, learning goals, schedule, assessment and required readings.",
    openCourseSyllabus: "Open Course Syllabus",
    team6Presentation: "25% Group Presentation",
    team6HomepageNotes: "Assess impact investing from the employer perspective, test BeFrank’s suitability, and consider an alternative pension arrangement only if the evidence requires it.",
    courseWeek: "Course Week",
    courseWeekNotes: "Open a day for its overview, key topics and required readings.",
    openDay: "Open Day {day}",
    courseMap: "Course Map",
    courseMapNotes: "Optional five-day map of the module.",
    openCourseMap: "Open Course Map",
    backToCourseWeek: "← Back to Course Week"
  }),
  nl: Object.freeze({
    languageLabel: "Taal",
    cfaAccessLabel: "CFA-toegang",
    courseHubLabel: "Cursusomgeving Corporate Finance and Accounting september 2026",
    turnpoHome: "Naar Turnpo",
    embaArchive: "EMBA-archief",
    privateCourseHub: "Privé-cursusomgeving",
    accessTitle: "September 2026 CFA",
    accessAvailability: "Deze leeromgeving is beschikbaar voor leden van Team 6.",
    accessCodeLabel: "Toegangscode",
    accessCodePlaceholder: "Voer de toegangscode in",
    openHub: "Openen",
    accessFootnote: "7–11 september 2026 · MaastrichtMBA / EMBA",
    loadingHub: "De cursusomgeving van september 2026 wordt geladen…",
    heroEyebrow: "September 2026 · Executive education",
    heroLede: "Een vijfdaags leerprogramma van kapitaalallocatie en financiële informatie naar risico, beheersing, compliance en langetermijnwaarde.",
    exploreCourseHub: "Verken de cursusomgeving",
    heroCaption: "7–11 september 2026 · 6 ECTS",
    courseAtGlance: "De cursus in één oogopslag",
    heroAsideTitle: "Financieel leiderschap in de praktijk.",
    courseDays: "cursusdagen",
    requiredReadings: "verplichte readings",
    integratedPitch: "geïntegreerde pitch",
    courseOverview: "Cursusoverzicht",
    overviewTitle: "Eén besliskader voor finance, risk en value.",
    overviewCopy: "De module verbindt investerings- en financieringskeuzes, accountinginformatie, prestatiebeheersing, Enterprise Risk Management, compliance en ESG-rapportage. Het doel is niet om losse modellen uit het hoofd te leren, maar om met bewijs een verantwoorde aanbeveling te formuleren en te verdedigen.",
    courseRouteLabel: "Cursusroute",
    routeJourneyTitle: "Vijfdaags leerprogramma",
    routeJourneyCopy: "Volg de lijn van financial management naar integratie en presentatie.",
    routeTeam6Title: "Uitgelicht · Team 6 impact investing",
    routeTeam6Copy: "Beoordeel BeFrank en Impact Investing vanuit werkgeversperspectief als geïntegreerde groepspresentatie.",
    routeToolkitTitle: "Toolkit, notities & audio",
    routeToolkitCopy: "Lees de learning cards, luister naar de podcasts en houd het volledige leerpad bij elkaar.",
    learningHub: "Leeromgeving",
    hubTitle: "Bestudeer, luister, pas toe.",
    hubCopy: "Open hieronder een onderdeel om van de cursuskaart naar de dagmaterialen, de Team 6-case, persoonlijke reflectie en geïntegreerde notities te gaan.",
    materialsLearningTrail: "Cursusmateriaal en leerpad",
    materialsLearningTrailCopy: "Gebruik elk onderdeel als een bewuste stap: voorbereiden, luisteren, lezen, reflecteren en toepassen.",
    supportingCourseToolkit: "Ondersteunende cursustoolkit",
    materialsResources: "Materialen & bronnen",
    integratedClassNotes: "Geïntegreerde lesnotities",
    reflection: "Reflectie",
    professionalVocabulary: "Professionele vaktaal",
    wrongPassword: "Onjuiste toegangscode. Probeer het opnieuw.",
    openingMaterial: "Cursusmateriaal openen…",
    unableMaterial: "Dit materiaal kan niet worden geopend:",
    noMaterials: "Er is nog geen materiaal beschikbaar.",
    noMaterialsYet: "Nog geen materiaal",
    noSupportingGuidesYet: "Nog geen ondersteunende gidsen",
    supportingGuides: "ondersteunende gidsen",
    noVocabularyYet: "Nog geen vaktaal",
    vocabularyMeta: "30 termen · IPA-uitspraak",
    noPhotosYet: "Nog geen foto’s",
    photo: "foto",
    photos: "foto’s",
    integratedReflection: "Geïntegreerde reflectie",
    noReflectionYet: "Nog geen reflectie",
    notesSaved: "Notities opgeslagen",
    noClassNotesYet: "Nog geen lesnotities",
    material: "materiaal",
    materials: "materialen",
    audioEpisodes: "audio-afleveringen",
    openTeam6: "Open Team 6-opdracht",
    openKnowledgeMap: "Open kenniskaart",
    openDayMaterials: "Open materiaal van dag {day}",
    openVocabulary: "Open vaktaal",
    openSelfStudyGuide: "Open zelfstudiegids",
    openReadingMap: "Open leeskaart",
    openCaseMaterials: "Open casemateriaal",
    openPresentationPrep: "Open presentatievoorbereiding",
    openReflection: "Open reflectie",
    openSyllabusGuide: "Open syllabusgids",
    openReadingChecklist: "Open leeschecklist",
    openStudyCard: "Open study card",
    openCaseCard: "Open casekaart",
    openSourcePdf: "Open originele PDF",
    openMaterial: "Open materiaal",
    openFile: "Open bestand",
    featuredTeam6: "Uitgelicht · Team 6 · groepspresentatie van 25%",
    team6Title: "Team 6 | BeFrank & Impact Investing",
    team6DefaultNotes: "Team 6 onderzoekt vanuit werkgeversperspectief of impact investing relevant is voor werknemers. De case beoordeelt of de onderneming BeFrank moet vragen meer impact investing in het pensioenaanbod op te nemen en, als BeFrank niet de meest geschikte oplossing is, welke alternatieve pensioenregeling kan worden overwogen.",
    courseToolkit: "Cursustoolkit",
    toolkitTitle: "Bouw de week voordat je haar bestudeert.",
    toolkitCopy: "Begin met de afhankelijkheidskaart, bewijsstatus, vaktaal en GPT-prompts die de vijfdaagse cursus samenbrengen.",
    septemberCfa: "September CFA",
    knowledgeMapDefault: "Kenniskaart + GPT Copy Pack",
    knowledgeMapNotes: "Een vijfdaagse kenniskaart en begeleid studiepakket.",
    fiveDayJourney: "Vijfdaags leerprogramma",
    journeyTitle: "Van besluit naar verdediging.",
    journeyCopy: "Elke dag heeft een eigen volledige leerpagina. Open die hier en houd het cursuspad binnen de CFA-omgeving.",
    dayLabel: "Dag",
    completeMaterial: "Volledig cursusmateriaal voor deze sessie.",
    backToSections: "← Terug naar cursusonderdelen",
    fullMaterial: "September 2026 CFA · Volledig materiaal",
    defaultMaterial: "Materiaal",
    backToMaterials: "← Terug naar materialen",
    unknownError: "Onbekende fout",
    openLearningPage: "Open leerpagina →",
    openSourceFile: "Open bronbestand →",
    noClassNotes: "Er zijn nog geen lesnotities opgeslagen.",
    languageEnglish: "Engels",
    languageDutch: "Nederlands",
    languageGerman: "Duits",
    monthSeptember: "september",
    courseDate: "September 2026",
    courseTitle: "Corporate Finance & Accounting",
    courseSummary: "Een geïntegreerde vijfdaagse module over corporate finance, accounting, management control, enterprise risk, compliance en sustainability reporting.",
    courseMeta: "7–11 september 2026 · 6 ECTS · MaastrichtMBA / EMBA",
    courseSyllabus: "Cursussyllabus",
    courseSyllabusNotes: "Cursusstructuur, leerdoelen, planning, beoordeling en verplichte readings.",
    openCourseSyllabus: "Open cursussyllabus",
    team6Presentation: "Groepspresentatie van 25%",
    team6HomepageNotes: "Beoordeel impact investing vanuit werkgeversperspectief, toets de geschiktheid van BeFrank en overweeg alleen een alternatieve pensioenregeling als het bewijs dat nodig maakt.",
    courseWeek: "Cursusweek",
    courseWeekNotes: "Open een dag voor het overzicht, de kernonderwerpen en de verplichte readings.",
    openDay: "Open materiaal van dag {day}",
    courseMap: "Cursuskaart",
    courseMapNotes: "Optionele kaart van de vijfdaagse module.",
    openCourseMap: "Open cursuskaart",
    backToCourseWeek: "← Terug naar de cursusweek"
  }),
  de: Object.freeze({
    languageLabel: "Sprache",
    cfaAccessLabel: "CFA-Zugang",
    courseHubLabel: "Lernbereich Corporate Finance and Accounting September 2026",
    turnpoHome: "Turnpo-Startseite",
    embaArchive: "EMBA-Archiv",
    privateCourseHub: "Privater Lernbereich",
    accessTitle: "September 2026 CFA",
    accessAvailability: "Dieser Lernbereich steht den Mitgliedern von Team 6 zur Verfügung.",
    accessCodeLabel: "Zugangscode",
    accessCodePlaceholder: "Zugangscode eingeben",
    openHub: "Öffnen",
    accessFootnote: "7.–11. September 2026 · MaastrichtMBA / EMBA",
    loadingHub: "Der Lernbereich für September 2026 wird geladen…",
    heroEyebrow: "September 2026 · Executive education",
    heroLede: "Ein fünftägiges Lernprogramm von Kapitalallokation und Finanzinformationen über Risiko, Steuerung und Compliance bis hin zu langfristigem Wert.",
    exploreCourseHub: "Lernbereich erkunden",
    heroCaption: "7.–11. September 2026 · 6 ECTS",
    courseAtGlance: "Die wichtigsten Kursdaten",
    heroAsideTitle: "Finanzielle Führung in der Praxis.",
    courseDays: "Kurstage",
    requiredReadings: "Pflichtlektüren",
    integratedPitch: "integrierter Pitch",
    courseOverview: "Kursüberblick",
    overviewTitle: "Ein Entscheidungsrahmen für Finance, Risk und Value.",
    overviewCopy: "Das Modul verbindet Investitions- und Finanzierungsentscheidungen, Accountinginformationen, Performance-Steuerung, Enterprise Risk Management, Compliance und ESG-Reporting. Ziel ist nicht das Auswendiglernen isolierter Modelle, sondern eine verantwortungsvolle, evidenzbasierte Empfehlung zu entwickeln und zu verteidigen.",
    courseRouteLabel: "Kursroute",
    routeJourneyTitle: "Fünftägiges Lernprogramm",
    routeJourneyCopy: "Folge der Linie vom Financial Management über die Integration bis zur Präsentation.",
    routeTeam6Title: "Im Fokus · Team 6 Impact Investing",
    routeTeam6Copy: "Beurteile BeFrank und Impact Investing aus Arbeitgeberperspektive als integrierte Gruppenpräsentation.",
    routeToolkitTitle: "Toolkit, Notizen & Audio",
    routeToolkitCopy: "Lies die Learning Cards, höre die Podcasts und halte den vollständigen Lernpfad zusammen.",
    learningHub: "Lernbereich",
    hubTitle: "Lernen, zuhören, anwenden.",
    hubCopy: "Öffne unten einen Abschnitt und gehe von der Kurskarte zu den Tagesmaterialien, dem Team-6-Fall, der persönlichen Reflexion und den integrierten Notizen.",
    materialsLearningTrail: "Kursmaterialien und Lernpfad",
    materialsLearningTrailCopy: "Nutze jeden Abschnitt als bewussten Schritt: vorbereiten, zuhören, lesen, reflektieren und anwenden.",
    supportingCourseToolkit: "Ergänzendes Kurs-Toolkit",
    materialsResources: "Materialien & Ressourcen",
    integratedClassNotes: "Integrierte Kursnotizen",
    reflection: "Reflexion",
    professionalVocabulary: "Fachwortschatz",
    wrongPassword: "Falscher Zugangscode. Bitte versuchen Sie es erneut.",
    openingMaterial: "Kursmaterial wird geöffnet…",
    unableMaterial: "Dieses Material konnte nicht geöffnet werden:",
    noMaterials: "Noch keine Materialien verfügbar.",
    noMaterialsYet: "Noch keine Materialien",
    noSupportingGuidesYet: "Noch keine ergänzenden Leitfäden",
    supportingGuides: "ergänzende Leitfäden",
    noVocabularyYet: "Noch kein Fachwortschatz",
    vocabularyMeta: "30 Begriffe · IPA-Aussprache",
    noPhotosYet: "Noch keine Fotos",
    photo: "Foto",
    photos: "Fotos",
    integratedReflection: "Integrierte Reflexion",
    noReflectionYet: "Noch keine Reflexion",
    notesSaved: "Notizen gespeichert",
    noClassNotesYet: "Noch keine Kursnotizen",
    material: "Material",
    materials: "Materialien",
    audioEpisodes: "Audiofolgen",
    openTeam6: "Team-6-Aufgabe öffnen",
    openKnowledgeMap: "Wissenskarte öffnen",
    openDayMaterials: "Material für Tag {day} öffnen",
    openVocabulary: "Fachwortschatz öffnen",
    openSelfStudyGuide: "Selbststudienleitfaden öffnen",
    openReadingMap: "Lesekarte öffnen",
    openCaseMaterials: "Fallmaterial öffnen",
    openPresentationPrep: "Präsentationsvorbereitung öffnen",
    openReflection: "Reflexion öffnen",
    openSyllabusGuide: "Syllabus-Leitfaden öffnen",
    openReadingChecklist: "Lesecheckliste öffnen",
    openStudyCard: "Study Card öffnen",
    openCaseCard: "Fallkarte öffnen",
    openSourcePdf: "Original-PDF öffnen",
    openMaterial: "Material öffnen",
    openFile: "Datei öffnen",
    featuredTeam6: "Im Fokus · Team 6 · Gruppenpräsentation (25%)",
    team6Title: "Team 6 | BeFrank & Impact Investing",
    team6DefaultNotes: "Team 6 untersucht aus Arbeitgeberperspektive, ob Impact Investing für die Beschäftigten sinnvoll ist. Der Fall prüft, ob das Unternehmen BeFrank bitten sollte, mehr Impact Investing in sein Pensionsangebot aufzunehmen, und welche alternative Altersvorsorgelösung geprüft werden könnte, falls BeFrank dafür nicht die geeignetste Lösung ist.",
    courseToolkit: "Kurs-Toolkit",
    toolkitTitle: "Baue die Woche auf, bevor du sie studierst.",
    toolkitCopy: "Beginne mit der Abhängigkeitskarte, dem Evidenzstatus, dem Fachwortschatz und den GPT-Prompts, die den fünftägigen Kurs zusammenhalten.",
    septemberCfa: "September CFA",
    knowledgeMapDefault: "Wissenskarte + GPT Copy Pack",
    knowledgeMapNotes: "Eine fünftägige Wissenskarte und ein angeleitetes Studienpaket.",
    fiveDayJourney: "Fünftägiges Lernprogramm",
    journeyTitle: "Von der Entscheidung zur Verteidigung.",
    journeyCopy: "Jeder Tag hat eine eigene vollständige Lernseite. Öffne sie hier und halte den Kursweg im CFA-Lernbereich.",
    dayLabel: "Tag",
    completeMaterial: "Vollständiges Kursmaterial für diese Sitzung.",
    backToSections: "← Zurück zu den Kursabschnitten",
    fullMaterial: "September 2026 CFA · Vollständiges Material",
    defaultMaterial: "Material",
    backToMaterials: "← Zurück zu den Materialien",
    unknownError: "Unbekannter Fehler",
    openLearningPage: "Lernseite öffnen →",
    openSourceFile: "Quelldatei öffnen →",
    noClassNotes: "Noch keine Kursnotizen gespeichert.",
    languageEnglish: "Englisch",
    languageDutch: "Niederländisch",
    languageGerman: "Deutsch",
    monthSeptember: "September",
    courseDate: "September 2026",
    courseTitle: "Corporate Finance & Accounting",
    courseSummary: "Ein integriertes fünftägiges Modul zu Corporate Finance, Accounting, Management Control, Enterprise Risk, Compliance und Sustainability Reporting.",
    courseMeta: "7.–11. September 2026 · 6 ECTS · MaastrichtMBA / EMBA",
    courseSyllabus: "Kurssyllabus",
    courseSyllabusNotes: "Kursstruktur, Lernziele, Zeitplan, Bewertung und Pflichtlektüren.",
    openCourseSyllabus: "Kurssyllabus öffnen",
    team6Presentation: "Gruppenpräsentation (25%)",
    team6HomepageNotes: "Bewerte Impact Investing aus Arbeitgeberperspektive, prüfe die Eignung von BeFrank und ziehe eine alternative Altersvorsorgelösung nur in Betracht, wenn die Evidenz dies erfordert.",
    courseWeek: "Kurswoche",
    courseWeekNotes: "Öffne einen Tag für Überblick, Kernthemen und Pflichtlektüren.",
    openDay: "Material für Tag {day} öffnen",
    courseMap: "Kurskarte",
    courseMapNotes: "Optionale Karte der fünftägigen Modulstruktur.",
    openCourseMap: "Kurskarte öffnen",
    backToCourseWeek: "← Zurück zur Kurswoche"
  })
});

const CORE_MATERIAL_TRANSLATIONS = Object.freeze({
  "/cfa/materials/2026-09/team-6-befrank-impact-investing.md": {
    en: { file: "/cfa/materials/en/team-6-befrank-impact-investing.md", title: "Team 6 | BeFrank & Impact Investing", notes: "Team 6 examines whether impact investing makes sense for employees from the employer's perspective. The case considers whether the company should ask BeFrank to incorporate more impact investing into its pension offering and, if BeFrank is not the most suitable solution, what alternative pension arrangement could be considered.", cta: "Open Team 6 Assignment →" },
    nl: { file: "/cfa/materials/nl/team-6-befrank-impact-investing.md", title: "Team 6 | BeFrank & Impact Investing", notes: "Team 6 onderzoekt vanuit werkgeversperspectief of impact investing relevant is voor werknemers. De case beoordeelt of de onderneming BeFrank moet vragen meer impact investing in het pensioenaanbod op te nemen en, als BeFrank niet de meest geschikte oplossing is, welke alternatieve pensioenregeling kan worden overwogen.", cta: "Open Team 6-opdracht →" },
    de: { file: "/cfa/materials/de/team-6-befrank-impact-investing.md", title: "Team 6 | BeFrank & Impact Investing", notes: "Team 6 untersucht aus Arbeitgeberperspektive, ob Impact Investing für die Beschäftigten sinnvoll ist. Der Fall prüft, ob das Unternehmen BeFrank bitten sollte, mehr Impact Investing in sein Pensionsangebot aufzunehmen, und welche alternative Altersvorsorgelösung geprüft werden könnte, falls BeFrank dafür nicht die geeignetste Lösung ist.", cta: "Team-6-Aufgabe öffnen →" }
  },
  "/cfa/materials/2026-09/2026-09-cfa-knowledge-map-gpt-pack.md": {
    en: { file: "/cfa/materials/en/knowledge-map.md", title: "September CFA · Course Map", notes: "A concise map of the five days, their role in the course and the link to the Team 6 assignment.", cta: "Open Course Map →" },
    nl: { file: "/cfa/materials/nl/knowledge-map.md", title: "September CFA · Cursuskaart", notes: "Een beknopte kaart van de vijf dagen, hun rol in de cursus en de verbinding met de Team 6-opdracht.", cta: "Open cursuskaart →" },
    de: { file: "/cfa/materials/de/knowledge-map.md", title: "September CFA · Kurskarte", notes: "Eine kompakte Karte der fünf Tage, ihrer Rolle im Kurs und der Verbindung zur Team-6-Aufgabe.", cta: "Kurskarte öffnen →" }
  },
  "/cfa/materials/2026-09/days/2026-09-07-financial-management.md": {
    en: { file: "/cfa/materials/en/day-1-financial-management.md", title: "Day 1 · Financial Management", notes: "Investment and financing decisions, financial markets, risk and return, diversification, derivatives, and financial risk management, with Nocco & Stulz as the bridge into Day 3 ERM.", cta: "Open Day 1 Materials →" },
    nl: { file: "/cfa/materials/nl/day-1-financial-management.md", title: "Dag 1 · Financial Management", notes: "Investerings- en financieringsbeslissingen, financiële markten, risico en rendement, diversificatie, derivaten en financieel risicomanagement; Nocco & Stulz vormt de brug naar ERM op dag 3.", cta: "Open materiaal van dag 1 →" },
    de: { file: "/cfa/materials/de/day-1-financial-management.md", title: "Tag 1 · Financial Management", notes: "Investitions- und Finanzierungsentscheidungen, Finanzmärkte, Risiko und Rendite, Diversifikation, Derivate und Financial Risk Management; Nocco & Stulz bildet die Brücke zum ERM an Tag 3.", cta: "Material für Tag 1 öffnen →" }
  },
  "/cfa/materials/2026-09/days/2026-09-08-compliance-sustainability.md": {
    en: { file: "/cfa/materials/en/day-2-compliance-sustainability-reporting.md", title: "Day 2 · Compliance & Sustainability Reporting", notes: "VW, ING, COSO, Estra and ESRS: understand how compliance failures can develop into material financial and strategic consequences.", cta: "Open Day 2 Materials →" },
    nl: { file: "/cfa/materials/nl/day-2-compliance-sustainability-reporting.md", title: "Dag 2 · Compliance & Sustainability Reporting", notes: "VW, ING, COSO, Estra en ESRS: begrijp hoe compliance-tekortkomingen kunnen uitgroeien tot materiële financiële en strategische gevolgen.", cta: "Open materiaal van dag 2 →" },
    de: { file: "/cfa/materials/de/day-2-compliance-sustainability-reporting.md", title: "Tag 2 · Compliance & Sustainability Reporting", notes: "VW, ING, COSO, Estra und ESRS: Verstehe, wie Compliance-Versagen zu wesentlichen finanziellen und strategischen Folgen werden kann.", cta: "Material für Tag 2 öffnen →" }
  },
  "/cfa/materials/2026-09/days/2026-09-09-accounting-erm-governance.md": {
    en: { file: "/cfa/materials/en/day-3-financial-accounting-erm-governance.md", title: "Day 3 · Financial Accounting, ERM & Governance", notes: "Financial information, COSO, enterprise risk management, non-financial risk, the DSM annual report, and governance action.", cta: "Open Day 3 Materials →" },
    nl: { file: "/cfa/materials/nl/day-3-financial-accounting-erm-governance.md", title: "Dag 3 · Financial Accounting, ERM & Governance", notes: "Financiële informatie, COSO, Enterprise Risk Management, non-financial risk, het DSM-jaarverslag en governance die tot actie leidt.", cta: "Open materiaal van dag 3 →" },
    de: { file: "/cfa/materials/de/day-3-financial-accounting-erm-governance.md", title: "Tag 3 · Financial Accounting, ERM & Governance", notes: "Finanzinformationen, COSO, Enterprise Risk Management, Non-Financial Risk, der DSM-Geschäftsbericht und Governance als Handlungsrahmen.", cta: "Material für Tag 3 öffnen →" }
  },
  "/cfa/materials/2026-09/days/2026-09-10-management-control.md": {
    en: { file: "/cfa/materials/en/day-4-management-accounting-strategic-control.md", title: "Day 4 · Management Accounting & Strategic Control", notes: "Tennessee Controls, innovation control and purpose-driven organisations, linked to the Team 6 case.", cta: "Open Day 4 Materials →" },
    nl: { file: "/cfa/materials/nl/day-4-management-accounting-strategic-control.md", title: "Dag 4 · Management Accounting & Strategic Control", notes: "Tennessee Controls, innovatiebeheersing en purpose-driven organisaties, verbonden met de Team 6-case.", cta: "Open materiaal van dag 4 →" },
    de: { file: "/cfa/materials/de/day-4-management-accounting-strategic-control.md", title: "Tag 4 · Management Accounting & Strategic Control", notes: "Tennessee Controls, Steuerung von Innovation und purpose-driven Organisationen, verbunden mit dem Team-6-Fall.", cta: "Material für Tag 4 öffnen →" }
  },
  "/cfa/materials/2026-09/days/2026-09-11-financial-management-integration.md": {
    en: { file: "/cfa/materials/en/day-5-financial-management-integration.md", title: "Day 5 · Financial Management Integration & Presentation", notes: "Mutual-fund comparison, integrated financial judgement, and preparation for the group presentation.", cta: "Open Day 5 Materials →" },
    nl: { file: "/cfa/materials/nl/day-5-financial-management-integration.md", title: "Dag 5 · Integratie van Financial Management & presentatie", notes: "Vergelijking van beleggingsfondsen, geïntegreerd financieel oordeel en voorbereiding op de groepspresentatie.", cta: "Open materiaal van dag 5 →" },
    de: { file: "/cfa/materials/de/day-5-financial-management-integration.md", title: "Tag 5 · Integration von Financial Management & Präsentation", notes: "Vergleich von Investmentfonds, integriertes finanzielles Urteil und Vorbereitung auf die Gruppenpräsentation.", cta: "Material für Tag 5 öffnen →" }
  }
});

const SIMPLE_MATERIAL_TRANSLATIONS = Object.freeze({
  "/cfa/materials/2026-09/September-26-Syllabus-Overview.md": {
    en: { file: "/cfa/materials/en/course-syllabus.md", title: "Course Syllabus", notes: "Course structure, learning goals, schedule, assessment and required readings.", cta: "Open Course Syllabus →" },
    nl: { file: "/cfa/materials/nl/course-syllabus.md", title: "Cursussyllabus", notes: "Cursusstructuur, leerdoelen, planning, beoordeling en verplichte readings.", cta: "Open cursussyllabus →" },
    de: { file: "/cfa/materials/de/course-syllabus.md", title: "Kurssyllabus", notes: "Kursstruktur, Lernziele, Zeitplan, Bewertung und Pflichtlektüren.", cta: "Kurssyllabus öffnen →" }
  }
});

let currentCfaLanguage = "en";

const EMBEDDED_SEPTEMBER_MONTH = {
  "id": "2026-09",
  "month": "2026-09",
  "title": "September 2026",
  "materialsRevision": 24,
  "reflectionRevision": 1,
  "followUpRevision": 0,
  "markdownRevision": 1,
  "memoryRevision": 0,
  "materials": [
    {
      "title": "Team 6 | BeFrank & Impact Investing",
      "type": "case_inspiration",
      "file": "/cfa/materials/2026-09/team-6-befrank-impact-investing.md",
      "notes": "Team 6 examines whether impact investing makes sense for employees from the employer's perspective. The case considers whether the company should ask BeFrank to incorporate more impact investing into its pension offering and, if BeFrank is not the most suitable solution, what alternative pension arrangement could be considered.",
      "cta": "Open Team 6 Assignment →"
    },
    {
      "title": "September CFA · Knowledge Map & GPT Copy Pack",
      "type": "course_overview",
      "file": "/cfa/materials/2026-09/2026-09-cfa-knowledge-map-gpt-pack.md",
      "notes": "The five-day knowledge map, evidence status for 16 readings, core vocabulary, integrated-case sequence, and GPT prompts for guided study.",
      "cta": "Open Knowledge Map →"
    },
    {
      "title": "Day 1 · Financial Management",
      "type": "daily_course_intro",
      "file": "/cfa/materials/2026-09/days/2026-09-07-financial-management.md",
      "notes": "A syllabus-aligned route through investment and financing choices, financial markets, risk-return, diversification, derivatives and financial risk management, with Nocco & Stulz used as the bridge into Day 3 ERM.",
      "cta": "Open Day 1 Materials →"
    },
    {
      "title": "Day 2 · Compliance & Sustainability Reporting",
      "type": "daily_course_intro",
      "file": "/cfa/materials/2026-09/days/2026-09-08-compliance-sustainability.md",
      "notes": "Volkswagen, ING, COSO, Estra and ESRS: understand how compliance failures can become material financial and strategic consequences.",
      "cta": "Open Day 2 Materials →"
    },
    {
      "title": "Day 3 · Financial Accounting, ERM & Governance",
      "type": "daily_course_intro",
      "file": "/cfa/materials/2026-09/days/2026-09-09-accounting-erm-governance.md",
      "notes": "Financial information, COSO, risk frameworks, non-financial risk and the DSM annual report, connected to governance action.",
      "cta": "Open Day 3 Materials →"
    },
    {
      "title": "Day 4 · Management Accounting & Strategic Control",
      "type": "daily_course_intro",
      "file": "/cfa/materials/2026-09/days/2026-09-10-management-control.md",
      "notes": "Tennessee Controls, innovation control and purpose-driven organisations, linked to the Team 6 case.",
      "cta": "Open Day 4 Materials →"
    },
    {
      "title": "Day 1 Podcast · The Second Navigation Chart (Chinese audio)",
      "type": "podcast",
      "file": "https://media.turnpo.com/%E5%88%A9%E6%B6%A6%E8%83%8C%E5%90%8E%E7%9A%84%E7%94%9F%E6%AD%BB%E5%B1%80.m4a",
      "notes": "Financial Management: a story about how value, cash flow, opportunity cost and risk-taking shape an apparently attractive investment."
    },
    {
      "title": "Day 1 Podcast · English version",
      "type": "podcast",
      "file": "https://media.turnpo.com/day1-en.m4a",
      "notes": "English retelling of the Day 1 fable on investment value, cash flow, opportunity cost, and risk."
    },
    {
      "title": "Day 2 Podcast · The Clean Checklist (Chinese audio)",
      "type": "podcast",
      "file": "https://media.turnpo.com/%E9%82%A3%E5%BC%A0%E5%B9%B2%E5%87%80%E7%9A%84%E6%A3%80%E6%9F%A5%E8%A1%A8.m4a",
      "notes": "Compliance & Sustainability Reporting: why a checklist full of ticks can still hide risk and breaks in accountability."
    },
    {
      "title": "Day 2 Podcast · English version",
      "type": "podcast",
      "file": "https://media.turnpo.com/day2-en.m4a",
      "notes": "English retelling of the Day 2 fable on compliance, evidence, sustainability reporting, and leadership."
    },
    {
      "title": "Day 3 Podcast · Three Whiteboards in the Pizza Kitchen (Chinese audio)",
      "type": "podcast",
      "file": "https://media.turnpo.com/day-3-three-whiteboards.m4a",
      "notes": "Financial Accounting, ERM & Governance: three whiteboards in a pizza kitchen connect profit, cash, risk and governance."
    },
    {
      "title": "Day 3 Podcast · English version",
      "type": "podcast",
      "file": "https://media.turnpo.com/day3-en.m4a",
      "notes": "English retelling of the Day 3 fable on profit, cash, risk, and governance."
    },
    {
      "title": "Day 4 Podcast · The Third Spoon of Chilli Oil (Chinese audio)",
      "type": "podcast",
      "file": "https://media.turnpo.com/day-4-data-all-green.m4a",
      "notes": "Management Accounting & Strategic Control: why an organisation can lose its judgement and ability to act even when every metric is green."
    },
    {
      "title": "Day 4 Podcast · Why Accurate Metrics Sabotage Your Strategy",
      "type": "podcast",
      "file": "https://media.turnpo.com/day4-en.m4a",
      "notes": "English retelling of the Day 4 fable on metrics, control, innovation, and purpose."
    },
    {
      "title": "Day 5 Podcast · The Driving School with the Highest Pass Rate (Chinese audio)",
      "type": "podcast",
      "file": "https://media.turnpo.com/%E4%B8%9A%E7%BB%A9%E6%A6%9C%E5%8D%95%E7%9A%84%E7%8C%AB%E8%85%BB.m4a",
      "notes": "Financial Management & Mutual Fund Comparison: how to see sample selection, risk, cost and investor fit when comparing fund performance."
    },
    {
      "title": "Day 5 Podcast · English version",
      "type": "podcast",
      "file": "https://media.turnpo.com/day5-en.m4a",
      "notes": "English retelling of the Day 5 fable on fund-performance comparison, risk, cost, and investor fit."
    },
    {
      "title": "Day 5 · Financial Management Integration & Presentation",
      "type": "daily_course_intro",
      "file": "/cfa/materials/2026-09/days/2026-09-11-financial-management-integration.md",
      "notes": "Mutual-fund comparison, integrated judgement and preparation for the group presentation.",
      "cta": "Open Day 5 Materials →"
    },
    {
      "title": "Course Syllabus · Original PDF & Detailed Guide",
      "type": "syllabus_guide",
      "file": "/cfa/materials/2026-09/September-26-Syllabus-Overview.md",
      "notes": "The original syllabus, 6 ECTS scope, five-day schedule, learning outcomes, 16 readings, assessment rules, attendance requirements and high-scoring strategies.",
      "cta": "Open Syllabus Guide →"
    },
    {
      "title": "September CFA reading checklist",
      "type": "monthly_index",
      "file": "/cfa/materials/2026-09/readings/README.md",
      "notes": "Complete syllabus cross-check: 16 required readings, three sessions with no preparatory reading, access routes and local-file status.",
      "cta": "Open Reading Checklist →"
    },
    {
      "title": "Required Reading · 16 Structured Study Cards",
      "type": "study_guide",
      "file": "/cfa/materials/2026-09/readings/summaries/README.md",
      "notes": "Sixteen structured study cards organised across Days 1–5, kept separate from the source texts and clearly marked where the original is still to be obtained.",
      "cta": "Open Study Cards →"
    },
    {
      "title": "COSO 2017 ERM Executive Summary",
      "type": "study_guide",
      "file": "/cfa/materials/2026-09/readings/summaries/coso-2017-erm-executive-summary.md",
      "notes": "Required ERM executive summary; use this local study card to learn the five ERM components and their evidence boundaries.",
      "cta": "Open COSO Study Card →"
    },
    {
      "title": "Tennessee Controls: The Strategic Ranking Problem",
      "type": "case_study",
      "file": "/cfa/materials/2026-09/readings/summaries/tennessee-controls-1991-rev-2010.md",
      "notes": "Required management accounting and control case (HBS 9-191-083, revised 2010), with a local study card and source-PDF link.",
      "cta": "Open Tennessee Case Card →"
    }
  ],
  "reflection": "September 2026 is the first core finance week. The learning goal is financial leadership: connect investment and financing choices, accounting information, performance control, enterprise risk, compliance and ESG reporting into one decision framework. The priority is not memorising isolated models, but using them to diagnose a real company and make a well-supported recommendation.",
  "markdown": "# Corporate Finance and Accounting - September 2026\n\n## Course week\n\n7-11 September 2026. The module covers Financial Management, Compliance, Sustainability Reporting, Financial Accounting and Analysis, Enterprise Risk Management, and Management Accounting and Control.\n\n## What I need to master\n\n1. Make investment, financing and risk decisions using risk-return, discounting and downside-protection logic.\n2. Read financial statements and use accounting information, ratios and KPIs for decisions.\n3. Design management controls that support strategy without creating false precision or harmful incentives.\n4. Apply COSO ERM: governance and culture, strategy/objectives, performance, review/revision, and information/reporting.\n5. Diagnose compliance failure through controls, culture, accountability, data and escalation.\n6. Assess sustainability reporting through double materiality, IROs, value-chain coverage, metrics, targets and assurance.\n\n## Assessment focus\n\nThe individual final assignment is a real-life integrated case. Content and application carry 75%; critical reflection on choices, assumptions, limitations and AI use carries 15%; form, concise writing and APA references carry 10%. Use the study cards to turn each reading into evidence for a recommendation, rather than a standalone summary."
};
const $ = (selector, context = document) => context.querySelector(selector);

function hasCfaAccess() {
  try {
    return window.sessionStorage.getItem(CFA_ACCESS_KEY) === "granted";
  } catch {
    return false;
  }
}

function setCfaAccess(granted) {
  try {
    if (granted) window.sessionStorage.setItem(CFA_ACCESS_KEY, "granted");
    else window.sessionStorage.removeItem(CFA_ACCESS_KEY);
  } catch {
    // Keep the live page state even if sessionStorage is unavailable.
  }
}

function renderCfaAccess(granted) {
  const gate = $("#cfaAccessGate");
  const app = $("#cfaApp");
  if (gate) gate.hidden = granted;
  if (app) app.hidden = !granted;
}

function initCfaAccess() {
  const form = $("#cfaAccessForm");
  const input = $("#cfaPassword");
  const note = $("#cfaAccessNote");
  if (!form || !input) return;

  const granted = hasCfaAccess();
  renderCfaAccess(granted);
  if (granted) return;

  window.setTimeout(() => input.focus(), 0);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input.value.trim() !== CFA_ACCESS_PASSWORD) {
      if (note) note.textContent = t("wrongPassword");
      input.select();
      return;
    }

    setCfaAccess(true);
    if (note) note.textContent = "";
    input.value = "";
    renderCfaAccess(true);
  });
}

const state = {
  month: EMBEDDED_SEPTEMBER_MONTH,
  materialReader: null
};

function normalizeCfaLanguage(value) {
  const language = String(value || "").toLowerCase();
  return CFA_LANGUAGES.includes(language) ? language : "en";
}

function readCfaLanguage() {
  try {
    return normalizeCfaLanguage(window.localStorage.getItem(CFA_LANGUAGE_KEY));
  } catch {
    return "en";
  }
}

function writeCfaLanguage(language) {
  try {
    window.localStorage.setItem(CFA_LANGUAGE_KEY, normalizeCfaLanguage(language));
  } catch {
    // The current page remains usable when localStorage is unavailable.
  }
}

function t(key, replacements = {}) {
  const dictionary = CFA_I18N[currentCfaLanguage] || CFA_I18N.en;
  let value = dictionary[key] ?? CFA_I18N.en[key] ?? key;
  Object.entries(replacements).forEach(([name, replacement]) => {
    value = value.replace(new RegExp(`\\{${name}\\}`, "g"), String(replacement));
  });
  return value;
}

function coreMaterialLookup(file = "") {
  const candidate = String(file || "");
  for (const [canonical, translations] of Object.entries(CORE_MATERIAL_TRANSLATIONS)) {
    if (candidate === canonical || Object.values(translations).some((translation) => translation.file === candidate)) {
      return { canonical, translations };
    }
  }
  return null;
}

function canonicalMaterialFile(file = "") {
  return coreMaterialLookup(file)?.canonical || String(file || "");
}

function localizeMaterial(item, language = currentCfaLanguage) {
  if (!item) return item;
  const lookup = coreMaterialLookup(item.file);
  if (!lookup) {
    const simpleTranslation = SIMPLE_MATERIAL_TRANSLATIONS[String(item.file || "")];
    if (simpleTranslation) {
      const translation = simpleTranslation[normalizeCfaLanguage(language)] || simpleTranslation.en;
      return { ...item, ...translation, sourceFile: String(item.file || "") };
    }
    return { ...item };
  }
  const translation = lookup.translations[normalizeCfaLanguage(language)] || lookup.translations.en;
  return { ...item, ...translation, sourceFile: lookup.canonical };
}

function localizeMonth(month, language = currentCfaLanguage) {
  if (!month) return month;
  const selectedLanguage = normalizeCfaLanguage(language);
  const dictionary = CFA_I18N[selectedLanguage] || CFA_I18N.en;
  return {
    ...month,
    title: selectedLanguage === "en" ? month.title : `${dictionary.monthSeptember} 2026`,
    materials: asArray(month.materials).map((item) => localizeMaterial(item, selectedLanguage))
  };
}

function updateLanguageControls() {
  document.querySelectorAll("[data-cfa-language]").forEach((button) => {
    const active = button.dataset.cfaLanguage === currentCfaLanguage;
    button.setAttribute("aria-pressed", String(active));
  });
}

function applyCfaLanguage(language, { rerender = true } = {}) {
  currentCfaLanguage = normalizeCfaLanguage(language);
  writeCfaLanguage(currentCfaLanguage);
  document.documentElement.lang = currentCfaLanguage;
  document.title = `${t("accessTitle")} | Turnpo`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = `${t("accessTitle")}. ${t("accessAvailability")}`;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (key) element.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (key) element.setAttribute("aria-label", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (key) element.setAttribute("placeholder", t(key));
  });
  updateLanguageControls();

  if (!rerender) return;
  if (state.materialReader?.sourceFile) {
    const sourceFile = state.materialReader.sourceFile;
    const sourceItem = localizeMaterial({ file: sourceFile, title: state.materialReader.title, notes: state.materialReader.notes });
    openMaterialReader(sourceFile, sourceItem.title, sourceItem.notes);
  } else if (state.month) {
    renderMonthDetail(state.month);
  }
}

function initCfaLanguage() {
  currentCfaLanguage = readCfaLanguage();
  document.addEventListener("click", (event) => {
    const languageButton = event.target.closest("[data-cfa-language]");
    if (!languageButton) return;
    const nextLanguage = normalizeCfaLanguage(languageButton.dataset.cfaLanguage);
    if (nextLanguage !== currentCfaLanguage) applyCfaLanguage(nextLanguage);
  });
  applyCfaLanguage(currentCfaLanguage, { rerender: false });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveCfaUrl(value = "") {
  const url = String(value || "").trim();
  if (!url || window.location.protocol !== "file:" || !url.startsWith("/")) return url;
  if (url.startsWith("/cfa/")) return new URL(`./${url.slice(5)}`, document.baseURI).href;
  if (url.startsWith("/emba/")) return new URL(`../emba/${url.slice(6)}`, document.baseURI).href;
  if (url.startsWith("/assets/")) return new URL(`../assets/${url.slice(8)}`, document.baseURI).href;
  if (url === "/favicon.ico") return new URL("../favicon.ico", document.baseURI).href;
  return url;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function courseDayNumber(item) {
  const match = String(item?.title || "").match(/\b(?:Day|Dag|Tag)\s+([1-5])\b/i);
  return match ? Number(match[1]) : 99;
}

function team6Material(month) {
  return asArray(month?.materials).find((item) => item?.type === "case_inspiration" || /team\s*6/i.test(item?.title || ""));
}

function isReadableMaterial(file = "") {
  return /^\/(?:cfa|emba)\/materials\/.*\.md$/i.test(String(file || ""));
}

function renderMaterialReader() {
  const reader = state.materialReader;
  if (!reader) return "";
  const body = reader.loading
    ? `<p class="emba-empty-copy">${escapeHtml(t("openingMaterial"))}</p>`
    : reader.error
      ? `<p class="emba-empty-copy">${escapeHtml(t("unableMaterial"))} ${escapeHtml(reader.error)}</p>`
      : `<div class="emba-markdown-rendered">${markdownToHtml(reader.markdown || "", reader.file)}</div>`;
  return `
    <article class="emba-material-reader">
      <div class="emba-material-reader-head">
        <div>
          <span class="emba-month-kicker">${escapeHtml(t("fullMaterial"))}</span>
          <h3>${escapeHtml(reader.title || t("defaultMaterial"))}</h3>
          ${reader.notes ? `<p>${escapeHtml(reader.notes)}</p>` : ""}
        </div>
        <div class="emba-material-reader-actions">
          <button class="emba-file-link" type="button" data-material-back>${escapeHtml(t("backToCourseWeek"))}</button>
        </div>
      </div>
      ${body}
    </article>
  `;
}

async function openMaterialReader(file, title = "", notes = "") {
  if (!isReadableMaterial(file)) return;
  const sourceFile = canonicalMaterialFile(file);
  const sourceItem = localizeMaterial({ file: sourceFile, title, notes });
  const localizedFile = sourceItem.file || file;
  state.materialReader = {
    sourceFile,
    file: localizedFile,
    title: sourceItem.title || title || t("defaultMaterial"),
    notes: sourceItem.notes || notes,
    markdown: "",
    loading: true,
    error: ""
  };
  renderMonthDetail(state.month);
  try {
    const response = await fetch(resolveCfaUrl(localizedFile), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    if (state.materialReader?.sourceFile !== sourceFile || state.materialReader?.file !== localizedFile) return;
    state.materialReader = { ...state.materialReader, markdown, loading: false, error: "" };
  } catch (error) {
    if (state.materialReader?.sourceFile !== sourceFile || state.materialReader?.file !== localizedFile) return;
    state.materialReader = { ...state.materialReader, markdown: "", loading: false, error: error?.message || t("unknownError") };
  }
  renderMonthDetail(state.month);
  document.querySelector("#cfaCourseWeek")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

function safeMarkdownLink(value = "", basePath = "") {
  const url = String(value || "").trim();
  if (!url || /^javascript:/i.test(url) || /^data:/i.test(url)) return "";
  if (url.startsWith("#")) return url;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("..")) return resolveCfaUrl(url);
  if (/^https?:\/\//i.test(url)) return url;
  if (!basePath) return url;
  try {
    const baseUrl = new URL(basePath, window.location.origin);
    return new URL(url, baseUrl).pathname;
  } catch {
    return "";
  }
}

function markdownInline(value = "", basePath = "") {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
      const safeUrl = safeMarkdownLink(url, basePath);
      return safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
}

function splitFrontmatter(markdown = "") {
  const source = String(markdown || "");
  if (!source.startsWith("---\n")) return { frontmatter: "", body: source };
  const closeIndex = source.indexOf("\n---\n", 4);
  if (closeIndex === -1) return { frontmatter: "", body: source };
  return {
    frontmatter: source.slice(4, closeIndex).trim(),
    body: source.slice(closeIndex + 5).trimStart()
  };
}

function markdownToHtml(markdown = "", basePath = "") {
  const { body } = splitFrontmatter(markdown);
  const lines = body.split(/\r?\n/);
  const html = [];
  let listOpen = false;
  let orderedListOpen = false;
  let codeOpen = false;
  let paragraph = [];
  let tableRows = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${markdownInline(paragraph.join(" "), basePath)}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listOpen) return;
    html.push("</ul>");
    listOpen = false;
  };
  const closeOrderedList = () => {
    if (!orderedListOpen) return;
    html.push("</ol>");
    orderedListOpen = false;
  };
  const tableCells = (line) => String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  const isTableSeparator = (line) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(String(line || "").trim());
  const flushTable = () => {
    if (!tableRows.length) return;
    const rows = tableRows.slice();
    tableRows = [];
    const hasHeader = rows.length > 1 && isTableSeparator(rows[1]);
    const header = hasHeader ? tableCells(rows[0]) : [];
    const bodyRows = (hasHeader ? rows.slice(2) : rows).map(tableCells);
    html.push("<div class=\"emba-markdown-table-wrap\"><table>");
    if (header.length) {
      html.push(`<thead><tr>${header.map((cell) => `<th>${markdownInline(cell, basePath)}</th>`).join("")}</tr></thead>`);
    }
    html.push("<tbody>");
    bodyRows.forEach((cells) => {
      html.push(`<tr>${cells.map((cell) => `<td>${markdownInline(cell, basePath)}</td>`).join("")}</tr>`);
    });
    html.push("</tbody></table></div>");
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      flushParagraph();
      closeList();
      closeOrderedList();
      flushTable();
      if (!codeOpen) {
        codeOpen = true;
        html.push("<pre><code>");
      } else {
        codeOpen = false;
        html.push("</code></pre>");
      }
      return;
    }
    if (codeOpen) {
      html.push(`${escapeHtml(line)}\n`);
      return;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushParagraph();
      closeList();
      closeOrderedList();
      tableRows.push(trimmed);
      return;
    }
    if (tableRows.length) {
      flushTable();
    }

    if (!trimmed) {
      flushParagraph();
      closeList();
      closeOrderedList();
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      closeList();
      closeOrderedList();
      html.push(`<h3>${markdownInline(trimmed.slice(4), basePath)}</h3>`);
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      closeList();
      closeOrderedList();
      html.push(`<h2>${markdownInline(trimmed.slice(3), basePath)}</h2>`);
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      closeList();
      closeOrderedList();
      html.push(`<h1>${markdownInline(trimmed.slice(2), basePath)}</h1>`);
      return;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      closeList();
      closeOrderedList();
      html.push(`<blockquote><p>${markdownInline(trimmed.slice(2), basePath)}</p></blockquote>`);
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      closeOrderedList();
      if (!listOpen) {
        listOpen = true;
        html.push("<ul>");
      }
      html.push(`<li>${markdownInline(trimmed.slice(2), basePath)}</li>`);
      return;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      closeList();
      if (!orderedListOpen) {
        orderedListOpen = true;
        html.push("<ol>");
      }
      html.push(`<li>${markdownInline(orderedMatch[2], basePath)}</li>`);
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  closeList();
  closeOrderedList();
  flushTable();
  return html.join("\n");
}

function simpleMaterialAction(item, label) {
  if (!item?.file) return "";
  const title = item.title || t("defaultMaterial");
  const notes = item.notes || "";
  if (isReadableMaterial(item.file)) {
    return `<button class="cfa-course-card-action" type="button" data-material-open="${escapeHtml(item.file)}" data-material-title="${escapeHtml(title)}" data-material-notes="${escapeHtml(notes)}">${escapeHtml(label)} <span aria-hidden="true">→</span></button>`;
  }
  return `<a class="cfa-course-card-action" href="${escapeHtml(resolveCfaUrl(item.file))}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} <span aria-hidden="true">→</span></a>`;
}

function simpleDayTitle(item, day) {
  const title = String(item?.title || `${t("dayLabel")} ${day}`);
  return title.replace(/^\s*(?:Day|Dag|Tag)\s+[1-5]\s*[·|｜]\s*/i, "") || title;
}

function renderMonthDetail(month) {
  const detail = $("#cfaCourseWeek");
  if (!detail || !month) return;

  if (state.materialReader) {
    detail.dataset.mode = "reader";
    detail.innerHTML = renderMaterialReader();
    return;
  }

  const viewMonth = localizeMonth(month);
  const materials = asArray(viewMonth.materials);
  const syllabus = materials.find((item) => item?.type === "syllabus_guide");
  const team6 = team6Material(viewMonth);
  const courseMap = materials.find((item) => item?.type === "course_overview");
  const days = materials
    .filter((item) => item?.type === "daily_course_intro")
    .sort((a, b) => courseDayNumber(a) - courseDayNumber(b));

  detail.dataset.mode = "home";
  detail.innerHTML = `
    <section class="cfa-primary-grid" aria-label="${escapeHtml(t("courseSyllabus"))}">
      <article class="cfa-syllabus-card">
        <div>
          <span class="cfa-card-kicker">${escapeHtml(t("courseSyllabus"))}</span>
          <h2>${escapeHtml(t("courseSyllabus"))}</h2>
          <p>${escapeHtml(t("courseSyllabusNotes"))}</p>
        </div>
        ${simpleMaterialAction(syllabus, t("openCourseSyllabus"))}
      </article>
      ${team6 ? `
        <article class="cfa-team6-feature" aria-labelledby="cfaTeam6Title">
          <span class="cfa-card-kicker">${escapeHtml(t("team6Presentation"))}</span>
          <div class="cfa-team6-copy">
            <p class="cfa-eyebrow">Team 6</p>
            <h2 id="cfaTeam6Title">${escapeHtml(t("team6Title"))}</h2>
            <p>${escapeHtml(t("team6HomepageNotes"))}</p>
          </div>
          <div class="cfa-team6-cta-wrap">${simpleMaterialAction(team6, t("openTeam6"))}</div>
        </article>
      ` : ""}
    </section>

    <section class="cfa-week-heading" aria-labelledby="cfaWeekTitle">
      <p class="cfa-eyebrow">${escapeHtml(t("courseWeek"))}</p>
      <h2 id="cfaWeekTitle">${escapeHtml(t("courseWeek"))}</h2>
      <p>${escapeHtml(t("courseWeekNotes"))}</p>
    </section>

    <div class="cfa-day-grid">
      ${days.map((item) => {
        const day = courseDayNumber(item);
        return `
          <article class="cfa-day-card">
            <div class="cfa-day-card-top"><span class="cfa-day-number">${String(day).padStart(2, "0")}</span><span class="cfa-card-kicker">${escapeHtml(t("dayLabel"))} ${day}</span></div>
            <h3>${escapeHtml(simpleDayTitle(item, day))}</h3>
            <p>${escapeHtml(item.notes || t("courseWeekNotes"))}</p>
            ${simpleMaterialAction(item, t("openDay", { day }))}
          </article>
        `;
      }).join("")}
    </div>

    ${courseMap ? `
      <div class="cfa-course-map-link">
        <div class="cfa-course-map-copy">
          <strong>${escapeHtml(t("courseMap"))}</strong>
          <span>${escapeHtml(t("courseMapNotes"))}</span>
        </div>
        ${simpleMaterialAction(courseMap, t("openCourseMap"))}
      </div>
    ` : ""}
  `;
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  initCfaLanguage();
  initCfaAccess();
  const detail = $("#cfaCourseWeek");

  // Render immediately with embedded month data
  if (state.month) {
    renderMonthDetail(state.month);
  }

  // Attempt live refresh from /cfa/materials.json (bypassing /emba/ password gate)
  try {
    const response = await fetch(resolveCfaUrl("/cfa/materials.json"), { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      if (data && data.month) {
        state.month = data.month;
        renderMonthDetail(state.month);
      }
    }
  } catch {
    // Embedded data remains available when the live refresh is unavailable.
  }

  // Click delegation
  detail.addEventListener("click", (event) => {
    const openMaterialBtn = event.target.closest("[data-material-open]");
    if (openMaterialBtn) {
      const file = openMaterialBtn.dataset.materialOpen;
      const title = openMaterialBtn.dataset.materialTitle;
      const notes = openMaterialBtn.dataset.materialNotes;
      openMaterialReader(file, title, notes);
      return;
    }

    const backMaterialBtn = event.target.closest("[data-material-back]");
    if (backMaterialBtn) {
      state.materialReader = null;
      renderMonthDetail(state.month);
      detail.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  });
});
