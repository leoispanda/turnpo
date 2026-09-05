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
    courseAudio: "Course audio",
    recommendedFirstListen: "Recommended first listen",
    podcastLanguage: "Podcast language",
    chineseAudio: "Chinese audio",
    englishAudio: "English audio",
    browserNoAudio: "Your browser does not support audio playback.",
    noCourseAudio: "No course audio is available yet.",
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
    copyForGpt: "Copy for GPT",
    backToMaterials: "← Back to materials",
    copiedForGpt: "Copied the full material. Ready to paste into GPT.",
    unknownError: "Unknown error",
    openLearningPage: "Open learning page →",
    openSourceFile: "Open source file →",
    noClassNotes: "No class notes saved yet.",
    languageEnglish: "English",
    languageDutch: "Dutch",
    languageGerman: "German",
    monthSeptember: "September"
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
    courseAudio: "Cursusaudio",
    recommendedFirstListen: "Aanbevolen eerste luisterbeurt",
    podcastLanguage: "Podcasttaal",
    chineseAudio: "Chinese audio",
    englishAudio: "Engelse audio",
    browserNoAudio: "Je browser ondersteunt geen audioweergave.",
    noCourseAudio: "Er is nog geen cursusaudio beschikbaar.",
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
    copyForGpt: "Kopiëren voor GPT",
    backToMaterials: "← Terug naar materialen",
    copiedForGpt: "Het volledige materiaal is gekopieerd. Klaar om in GPT te plakken.",
    unknownError: "Onbekende fout",
    openLearningPage: "Open leerpagina →",
    openSourceFile: "Open bronbestand →",
    noClassNotes: "Er zijn nog geen lesnotities opgeslagen.",
    languageEnglish: "Engels",
    languageDutch: "Nederlands",
    languageGerman: "Duits",
    monthSeptember: "september"
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
    courseAudio: "Kursaudio",
    recommendedFirstListen: "Empfohlene erste Hörsession",
    podcastLanguage: "Podcastsprache",
    chineseAudio: "Chinesische Audiofassung",
    englishAudio: "Englische Audiofassung",
    browserNoAudio: "Ihr Browser unterstützt keine Audiowiedergabe.",
    noCourseAudio: "Noch kein Kursaudio verfügbar.",
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
    copyForGpt: "Für GPT kopieren",
    backToMaterials: "← Zurück zu den Materialien",
    copiedForGpt: "Das vollständige Material wurde kopiert und kann in GPT eingefügt werden.",
    unknownError: "Unbekannter Fehler",
    openLearningPage: "Lernseite öffnen →",
    openSourceFile: "Quelldatei öffnen →",
    noClassNotes: "Noch keine Kursnotizen gespeichert.",
    languageEnglish: "Englisch",
    languageDutch: "Niederländisch",
    languageGerman: "Deutsch",
    monthSeptember: "September"
  })
});

const CORE_MATERIAL_TRANSLATIONS = Object.freeze({
  "/cfa/materials/2026-09/team-6-befrank-impact-investing.md": {
    en: { file: "/cfa/materials/en/team-6-befrank-impact-investing.md", title: "Team 6 | BeFrank & Impact Investing", notes: "Team 6 examines whether impact investing makes sense for employees from the employer's perspective. The case considers whether the company should ask BeFrank to incorporate more impact investing into its pension offering and, if BeFrank is not the most suitable solution, what alternative pension arrangement could be considered.", cta: "Open Team 6 Assignment →" },
    nl: { file: "/cfa/materials/nl/team-6-befrank-impact-investing.md", title: "Team 6 | BeFrank & Impact Investing", notes: "Team 6 onderzoekt vanuit werkgeversperspectief of impact investing relevant is voor werknemers. De case beoordeelt of de onderneming BeFrank moet vragen meer impact investing in het pensioenaanbod op te nemen en, als BeFrank niet de meest geschikte oplossing is, welke alternatieve pensioenregeling kan worden overwogen.", cta: "Open Team 6-opdracht →" },
    de: { file: "/cfa/materials/de/team-6-befrank-impact-investing.md", title: "Team 6 | BeFrank & Impact Investing", notes: "Team 6 untersucht aus Arbeitgeberperspektive, ob Impact Investing für die Beschäftigten sinnvoll ist. Der Fall prüft, ob das Unternehmen BeFrank bitten sollte, mehr Impact Investing in sein Pensionsangebot aufzunehmen, und welche alternative Altersvorsorgelösung geprüft werden könnte, falls BeFrank dafür nicht die geeignetste Lösung ist.", cta: "Team-6-Aufgabe öffnen →" }
  },
  "/cfa/materials/2026-09/2026-09-cfa-knowledge-map-gpt-pack.md": {
    en: { file: "/cfa/materials/en/knowledge-map.md", title: "September CFA · Knowledge Map & GPT Copy Pack", notes: "A five-day knowledge map covering the required readings, evidence status, core vocabulary, integrated-case sequence, and guided-study prompts.", cta: "Open Knowledge Map →" },
    nl: { file: "/cfa/materials/nl/knowledge-map.md", title: "September CFA · Kenniskaart & GPT Copy Pack", notes: "Een vijfdaagse kenniskaart met verplichte readings, bewijsstatus, kernbegrippen, de volgorde van de geïntegreerde case en prompts voor begeleid studeren.", cta: "Open kenniskaart →" },
    de: { file: "/cfa/materials/de/knowledge-map.md", title: "September CFA · Wissenskarte & GPT Copy Pack", notes: "Eine fünftägige Wissenskarte mit Pflichtlektüren, Evidenzstatus, Kernbegriffen, der Sequenz des integrierten Falls und Prompts für angeleitetes Lernen.", cta: "Wissenskarte öffnen →" }
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

const PREPARATION_MATERIAL_TYPES = new Set([
  "course_overview",
  "course_requirements",
  "daily_course_intro",
  "reading_learning_map",
  "case_inspiration",
  "case_material",
  "syllabus_guide",
  "presentation_prep"
]);
const PODCAST_MATERIAL_TYPE = "podcast";
const FEATURED_COURSE_TYPES = new Set(["case_inspiration", "course_overview", "daily_course_intro"]);

const DAY_PAGE_PODCASTS = Object.freeze({
  "/cfa/materials/2026-09/days/2026-09-07-financial-management.md": {
    versions: [
      {
        language: "zh",
        title: "Day 1 Podcast · The Second Navigation Chart",
        description: "Listen to the story before exploring investment value, cash flow, opportunity cost and risk-taking.",
        file: "https://media.turnpo.com/%E5%88%A9%E6%B6%A6%E8%83%8C%E5%90%8E%E7%9A%84%E7%94%9F%E6%AD%BB%E5%B1%80.m4a"
      },
      {
        language: "en",
        title: "Day 1 Podcast · English version",
        description: "Listen to the English retelling before exploring investment value, cash flow, opportunity cost, and risk.",
        file: "https://media.turnpo.com/day1-en.m4a"
      }
    ]
  },
  "/cfa/materials/2026-09/days/2026-09-08-compliance-sustainability.md": {
    versions: [
      {
        language: "zh",
        title: "Day 2 Podcast · The Clean Checklist",
        description: "Listen to the story before exploring compliance, evidence chains, sustainability reporting and financial leadership.",
        file: "https://media.turnpo.com/%E9%82%A3%E5%BC%A0%E5%B9%B2%E5%87%80%E7%9A%84%E6%A3%80%E6%9F%A5%E8%A1%A8.m4a"
      },
      {
        language: "en",
        title: "Day 2 Podcast · English version",
        description: "Listen to the English retelling before exploring compliance, evidence, sustainability reporting, and financial leadership.",
        file: "https://media.turnpo.com/day2-en.m4a"
      }
    ]
  },
  "/cfa/materials/2026-09/days/2026-09-09-accounting-erm-governance.md": {
    versions: [
      {
        language: "zh",
        title: "Day 3 Podcast · Three Whiteboards in the Pizza Kitchen",
        description: "Listen to the story before connecting profit, cash, risk and governance.",
        file: "https://media.turnpo.com/day-3-three-whiteboards.m4a"
      },
      {
        language: "en",
        title: "Day 3 Podcast · English version",
        description: "Listen to the English retelling before connecting profit, cash, risk, and governance.",
        file: "https://media.turnpo.com/day3-en.m4a"
      }
    ]
  },
  "/cfa/materials/2026-09/days/2026-09-10-management-control.md": {
    versions: [
      {
        language: "zh",
        title: "Day 4 Podcast · The Third Spoon of Chilli Oil",
        description: "Listen to the story before connecting metrics, control, innovation and purpose in one strategic judgement.",
        file: "https://media.turnpo.com/day-4-data-all-green.m4a"
      },
      {
        language: "en",
        title: "Day 4 Podcast · Why Accurate Metrics Sabotage Your Strategy",
        description: "Listen to the English retelling before exploring metrics, control, innovation, and purpose in one strategic judgment.",
        file: "https://media.turnpo.com/day4-en.m4a"
      }
    ]
  },
  "/cfa/materials/2026-09/days/2026-09-11-financial-management-integration.md": {
    versions: [
      {
        language: "zh",
        title: "Day 5 Podcast · The Driving School with the Highest Pass Rate",
        description: "Listen to the story before comparing fund performance through sample selection, risk, cost and investor fit.",
        file: "https://media.turnpo.com/%E4%B8%9A%E7%BB%A9%E6%A6%9C%E5%8D%95%E7%9A%84%E7%8C%AB%E8%85%BB.m4a"
      },
      {
        language: "en",
        title: "Day 5 Podcast · English version",
        description: "Listen to the English retelling before comparing fund performance through sample, risk, cost, and investor fit.",
        file: "https://media.turnpo.com/day5-en.m4a"
      }
    ]
  }
});

const state = {
  month: EMBEDDED_SEPTEMBER_MONTH,
  openBlockId: "",
  materialReader: null,
  podcastLanguage: "en"
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

const PODCAST_COPY = Object.freeze({
  1: {
    zh: { en: "The Second Navigation Chart", nl: "De tweede navigatiekaart", de: "Die zweite Navigationskarte" },
    en: { en: "The Second Navigation Chart · English version", nl: "De tweede navigatiekaart · Engelse versie", de: "Die zweite Navigationskarte · englische Fassung" },
    descriptions: {
      en: "Listen to the story before exploring investment value, cash flow, opportunity cost and risk-taking.",
      nl: "Luister naar het verhaal voordat je investment value, cash flow, opportunity cost en risk-taking verkent.",
      de: "Höre die Geschichte, bevor du Investitionswert, Cashflow, Opportunitätskosten und Risikobereitschaft untersuchst."
    }
  },
  2: {
    zh: { en: "The Clean Checklist", nl: "De schone checklist", de: "Die saubere Checkliste" },
    en: { en: "The Clean Checklist · English version", nl: "De schone checklist · Engelse versie", de: "Die saubere Checkliste · englische Fassung" },
    descriptions: {
      en: "Listen to the story before exploring compliance, evidence chains, sustainability reporting and financial leadership.",
      nl: "Luister naar het verhaal voordat je compliance, bewijsketens, sustainability reporting en financieel leiderschap verkent.",
      de: "Höre die Geschichte, bevor du Compliance, Evidenzketten, Sustainability Reporting und finanzielle Führung untersuchst."
    }
  },
  3: {
    zh: { en: "Three Whiteboards in the Pizza Kitchen", nl: "Drie whiteboards in de pizzakeuken", de: "Drei Whiteboards in der Pizzaküche" },
    en: { en: "Three Whiteboards in the Pizza Kitchen · English version", nl: "Drie whiteboards in de pizzakeuken · Engelse versie", de: "Drei Whiteboards in der Pizzaküche · englische Fassung" },
    descriptions: {
      en: "Listen to the story before connecting profit, cash, risk and governance.",
      nl: "Luister naar het verhaal voordat je profit, cash, risk en governance met elkaar verbindt.",
      de: "Höre die Geschichte, bevor du Gewinn, Cash, Risiko und Governance miteinander verbindest."
    }
  },
  4: {
    zh: { en: "The Third Spoon of Chilli Oil", nl: "De derde lepel chiliolie", de: "Der dritte Löffel Chiliöl" },
    en: { en: "Why Accurate Metrics Sabotage Your Strategy", nl: "Waarom accurate metrics je strategie saboteren", de: "Warum genaue Kennzahlen deine Strategie sabotieren" },
    descriptions: {
      en: "Listen to the story before connecting metrics, control, innovation and purpose in one strategic judgement.",
      nl: "Luister naar het verhaal voordat je metrics, control, innovatie en purpose in één strategisch oordeel verbindt.",
      de: "Höre die Geschichte, bevor du Kennzahlen, Steuerung, Innovation und Purpose in einem strategischen Urteil verbindest."
    }
  },
  5: {
    zh: { en: "The Driving School with the Highest Pass Rate", nl: "De rijschool met het hoogste slagingspercentage", de: "Die Fahrschule mit der höchsten Erfolgsquote" },
    en: { en: "The Driving School with the Highest Pass Rate · English version", nl: "De rijschool met het hoogste slagingspercentage · Engelse versie", de: "Die Fahrschule mit der höchsten Erfolgsquote · englische Fassung" },
    descriptions: {
      en: "Listen to the story before comparing fund performance through sample selection, risk, cost and investor fit.",
      nl: "Luister naar het verhaal voordat je fondsperformance vergelijkt via steekproefkeuze, risico, kosten en fit met de belegger.",
      de: "Höre die Geschichte, bevor du Fondsperformance anhand von Stichprobenauswahl, Risiko, Kosten und Anleger-Fit vergleichst."
    }
  }
});

function localizePodcastMaterial(item, language = currentCfaLanguage) {
  if (!item || item.type !== "podcast") return item;
  const dayMatch = String(item.title || "").match(/\bDay\s+([1-5])\b/i);
  const day = dayMatch ? Number(dayMatch[1]) : 0;
  const copy = PODCAST_COPY[day];
  if (!copy) return { ...item };
  const selectedLanguage = normalizeCfaLanguage(language);
  const dictionary = CFA_I18N[selectedLanguage] || CFA_I18N.en;
  const audioLanguage = /Chinese audio/i.test(String(item.title || "")) ? "zh" : "en";
  const titleCopy = copy[audioLanguage]?.[selectedLanguage] || copy[audioLanguage]?.en || item.title;
  const prefix = selectedLanguage === "nl" ? `Podcast dag ${day}` : selectedLanguage === "de" ? `Podcast Tag ${day}` : `Day ${day} Podcast`;
  const languageSuffix = audioLanguage === "zh" ? ` (${dictionary.chineseAudio})` : "";
  const title = `${prefix} · ${titleCopy}${languageSuffix}`;
  return {
    ...item,
    title,
    notes: copy.descriptions[selectedLanguage] || copy.descriptions.en
  };
}

function localizeMaterial(item, language = currentCfaLanguage) {
  if (!item) return item;
  const lookup = coreMaterialLookup(item.file);
  if (!lookup) return localizePodcastMaterial(item, language);
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

function formatMonth(monthKey = "") {
  const parts = String(monthKey).split("-");
  if (parts.length < 2) return monthKey;
  const year = parts[0];
  const monthNames = currentCfaLanguage === "nl"
    ? ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"]
    : currentCfaLanguage === "de"
      ? ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
      : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = monthNames[monthIdx] || parts[1];
  return `${monthName} ${year}`;
}

function hasTextContent(value = "") {
  return Boolean(String(value || "").trim());
}

function materialsForSection(month, section = "materials") {
  const materials = asArray(month?.materials);
  if (section === "preparation") return materials.filter((item) => PREPARATION_MATERIAL_TYPES.has(item.type));
  if (section === "vocabulary") return materials.filter((item) => item.type === "vocabulary");
  if (section === "podcast") return materials.filter((item) => item.type === PODCAST_MATERIAL_TYPE);
  return materials.filter((item) => !PREPARATION_MATERIAL_TYPES.has(item.type) && item.type !== "vocabulary" && item.type !== PODCAST_MATERIAL_TYPE);
}

function courseDayNumber(item) {
  const match = String(item?.title || "").match(/\b(?:Day|Dag|Tag)\s+([1-5])\b/i);
  return match ? Number(match[1]) : 99;
}

function featuredCourseMaterials(month) {
  const materials = asArray(month?.materials);
  const featured = [];
  const seen = new Set();
  const add = (item) => {
    if (!item || seen.has(item.file)) return;
    seen.add(item.file);
    featured.push(item);
  };

  add(materials.find((item) => item?.type === "case_inspiration" || /team\s*6/i.test(item?.title || "")));
  add(materials.find((item) => item?.type === "course_overview" || /knowledge\s*map/i.test(item?.title || "")));
  materials
    .filter((item) => item?.type === "daily_course_intro")
    .sort((a, b) => courseDayNumber(a) - courseDayNumber(b))
    .forEach(add);
  return featured;
}

function isFeaturedCourseMaterial(item, month = state.month) {
  return FEATURED_COURSE_TYPES.has(item?.type) && featuredCourseMaterials(month).some((featured) => featured.file === item.file);
}

function supportingPreparationMaterials(month) {
  return materialsForSection(month, "preparation").filter((item) => !isFeaturedCourseMaterial(item, month));
}

function materialHasContent(item) {
  return Boolean(item && (item.title || item.file || item.notes));
}

function blockSummary(id, month) {
  if (id === "memory") {
    const count = asArray(month?.memoryMoment).length;
    return count ? `${count} ${count === 1 ? t("photo") : t("photos")}` : t("noPhotosYet");
  }
  if (id === "reflection") {
    return hasTextContent(month?.reflection) ? t("integratedReflection") : t("noReflectionYet");
  }
  if (id === "markdown") {
    return hasTextContent(month?.markdown) ? t("notesSaved") : t("noClassNotesYet");
  }
  if (id === "material") {
    const count = materialsForSection(month, "materials").filter(materialHasContent).length;
    return count ? `${count} ${count === 1 ? t("material") : t("materials")}` : t("noMaterialsYet");
  }
  if (id === "preparation") {
    const count = supportingPreparationMaterials(month).filter(materialHasContent).length;
    return count ? `${count} ${t("supportingGuides")}` : t("noSupportingGuidesYet");
  }
  if (id === "vocabulary") {
    const count = materialsForSection(month, "vocabulary").filter(materialHasContent).length;
    return count ? t("vocabularyMeta") : t("noVocabularyYet");
  }
  if (id === "podcast") {
    const count = materialsForSection(month, "podcast").filter(materialHasContent).length;
    return count ? `${count} ${t("audioEpisodes")}` : t("noCourseAudio");
  }
  return "";
}

function team6Material(month) {
  return asArray(month?.materials).find((item) => item?.type === "case_inspiration" || /team\s*6/i.test(item?.title || ""));
}

function materialActionLabel(item) {
  if (item?.cta) return item.cta;
  if (item?.type === "case_inspiration" || /team\s*6/i.test(item?.title || "")) return `${t("openTeam6")} →`;
  if (item?.type === "course_overview" || /knowledge\s*map|kenniskaart|wissenskarte/i.test(item?.title || "")) return `${t("openKnowledgeMap")} →`;
  if (item?.type === "daily_course_intro") {
    const day = courseDayNumber(item);
    return day < 6 ? `${t("openDayMaterials", { day })} →` : `${t("openMaterial")} →`;
  }
  if (item?.type === "vocabulary") return `${t("openVocabulary")} →`;
  if (item?.type === "course_requirements") return `${t("openSelfStudyGuide")} →`;
  if (item?.type === "reading_learning_map") return `${t("openReadingMap")} →`;
  if (item?.type === "case_material") return `${t("openCaseMaterials")} →`;
  if (item?.type === "presentation_prep") return `${t("openPresentationPrep")} →`;
  if (item?.type === "reflection_notes") return `${t("openReflection")} →`;
  if (item?.type === "syllabus_guide") return `${t("openSyllabusGuide")} →`;
  if (item?.type === "monthly_index") return `${t("openReadingChecklist")} →`;
  if (item?.type === "study_guide") return `${t("openStudyCard")} →`;
  if (item?.type === "case_study") return `${t("openCaseCard")} →`;
  if (item?.type === "source_pdf") return `${t("openSourcePdf")} →`;
  return isReadableMaterial(item?.file) ? `${t("openMaterial")} →` : `${t("openFile")} →`;
}

function materialOpenControl(item, className = "cfa-course-card-action") {
  const label = materialActionLabel(item);
  const title = item?.title || t("defaultMaterial");
  const notes = item?.notes || "";
  if (isReadableMaterial(item?.file)) {
    return `<button class="${className}" type="button" data-material-open="${escapeHtml(item.file)}" data-material-title="${escapeHtml(title)}" data-material-notes="${escapeHtml(notes)}">${escapeHtml(label)}</button>`;
  }
  if (item?.file) {
    return `<a class="${className}" href="${escapeHtml(resolveCfaUrl(item.file))}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  }
  return `<span class="${className} is-disabled">${escapeHtml(label)}</span>`;
}

function renderTeam6Feature(month) {
  const item = team6Material(month);
  if (!item) return "";
  const title = item.title || `${t("team6Title")}`;
  const notes = item.notes || t("team6DefaultNotes");
  const action = isReadableMaterial(item.file)
    ? `<button class="cfa-team6-cta" type="button" data-material-open="${escapeHtml(item.file)}" data-material-title="${escapeHtml(title)}" data-material-notes="${escapeHtml(notes)}">${escapeHtml(t("openTeam6"))} <span aria-hidden="true">→</span></button>`
    : `<a class="cfa-team6-cta" href="${escapeHtml(resolveCfaUrl(item.file || "#"))}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("openTeam6"))} <span aria-hidden="true">→</span></a>`;
  return `
    <section class="cfa-team6-feature" aria-labelledby="cfaTeam6Title">
      <div class="cfa-team6-badge" aria-hidden="true">T6</div>
      <div class="cfa-team6-copy">
        <p class="cfa-eyebrow">${escapeHtml(t("featuredTeam6"))}</p>
        <h3 id="cfaTeam6Title">${escapeHtml(t("team6Title"))}</h3>
        <p>${escapeHtml(notes)}</p>
      </div>
      <div class="cfa-team6-cta-wrap">${action}</div>
    </section>
  `;
}

function renderCourseToolkit(month) {
  const item = featuredCourseMaterials(month).find((entry) => entry?.type === "course_overview");
  if (!item) return "";
  return `
    <section class="cfa-course-toolkit" aria-labelledby="cfaToolkitTitle">
      <div class="cfa-section-heading">
        <div>
          <p class="cfa-eyebrow">${escapeHtml(t("courseToolkit"))}</p>
          <h3 id="cfaToolkitTitle">${escapeHtml(t("toolkitTitle"))}</h3>
        </div>
        <p>${escapeHtml(t("toolkitCopy"))}</p>
      </div>
      <article class="cfa-toolkit-card">
        <div class="cfa-toolkit-mark" aria-hidden="true">MAP</div>
        <div class="cfa-toolkit-copy">
          <span class="cfa-card-kicker">${escapeHtml(t("septemberCfa"))}</span>
          <h4>${escapeHtml(item.title || t("knowledgeMapDefault"))}</h4>
          <p>${escapeHtml(item.notes || t("knowledgeMapNotes"))}</p>
        </div>
        <div class="cfa-toolkit-action">${materialOpenControl(item, "cfa-course-card-action")}</div>
      </article>
    </section>
  `;
}

function renderFiveDayJourney(month) {
  const days = featuredCourseMaterials(month)
    .filter((item) => item?.type === "daily_course_intro")
    .sort((a, b) => courseDayNumber(a) - courseDayNumber(b));
  if (!days.length) return "";
  return `
    <section class="cfa-course-journey" aria-labelledby="cfaJourneyTitle">
      <div class="cfa-section-heading">
        <div>
          <p class="cfa-eyebrow">${escapeHtml(t("fiveDayJourney"))}</p>
          <h3 id="cfaJourneyTitle">${escapeHtml(t("journeyTitle"))}</h3>
        </div>
        <p>${escapeHtml(t("journeyCopy"))}</p>
      </div>
      <div class="cfa-day-grid">
        ${days.map((item) => {
          const day = courseDayNumber(item);
          const subject = String(item.title || `${t("dayLabel")} ${day}`).replace(/^\s*(?:Day|Dag|Tag)\s+[1-5]\s*[·|｜]\s*/i, "");
          return `
            <article class="cfa-day-card">
              <div class="cfa-day-card-top"><span class="cfa-day-number">${String(day).padStart(2, "0")}</span><span class="cfa-card-kicker">${escapeHtml(t("dayLabel"))} ${day}</span></div>
              <h4>${escapeHtml(subject)}</h4>
              <p>${escapeHtml(item.notes || t("completeMaterial"))}</p>
              ${materialOpenControl(item, "cfa-course-card-action")}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function blockTemplate(id, title, month) {
  const isOpen = state.openBlockId === id;
  const summary = blockSummary(id, month);
  return `
    <article class="emba-content-block${isOpen ? " open" : ""}" data-block-id="${escapeHtml(id)}" data-block-card="${escapeHtml(id)}">
      <button class="emba-block-toggle" type="button" aria-expanded="${isOpen}" data-block-toggle="${escapeHtml(id)}">
        <span class="emba-block-title">${escapeHtml(title)}</span>
        <span class="emba-block-meta">${escapeHtml(summary)}</span>
      </button>
    </article>
  `;
}

function renderOpenBlockPanel(month) {
  if (!state.openBlockId) return "";
  const content = renderBlockContent(state.openBlockId, month);
  if (!content) return "";
  return `
    <article class="emba-block-panel" data-block-panel="${escapeHtml(state.openBlockId)}">
      <div class="emba-block-panel-nav">
        <button class="emba-panel-back" type="button" data-block-close>${escapeHtml(t("backToSections"))}</button>
      </div>
      <div class="emba-block-body">${content}</div>
    </article>
  `;
}

function renderBlockContent(id, month) {
  if (id === "memory") return renderMemoryMoment(month);
  if (id === "reflection") return renderReflection(month);
  if (id === "markdown") return renderMarkdown(month);
  if (id === "material") return renderMaterials(month);
  if (id === "preparation") return renderPreparation(month);
  if (id === "vocabulary") return renderMaterials(month, "vocabulary");
  if (id === "podcast") return renderPodcasts(month);
  return "";
}

function renderPodcasts(month) {
  const podcasts = materialsForSection(month, "podcast");
  if (!podcasts.length) return `<p class="emba-empty-copy">${escapeHtml(t("noCourseAudio"))}</p>`;
  return `
    <div class="emba-podcast-list">
      ${podcasts.map((item) => `
        <article class="emba-podcast-card">
          <div class="emba-podcast-card-head">
            <span class="emba-podcast-kicker">${escapeHtml(t("courseAudio"))}</span>
            <h3>${escapeHtml(item.title || t("courseAudio"))}</h3>
            ${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ""}
          </div>
          <audio class="emba-podcast-player" controls controlsList="nodownload" preload="metadata">
            <source src="${escapeHtml(item.file)}" type="audio/mp4" />
            ${escapeHtml(t("browserNoAudio"))}
          </audio>
        </article>
      `).join("")}
    </div>
  `;
}

function renderPreparation(month) {
  if (state.materialReader?.file) return renderMaterialReader();
  return renderMaterialList(supportingPreparationMaterials(month));
}

function isReadableMaterial(file = "") {
  return /^\/(?:cfa|emba)\/materials\/.*\.md$/i.test(String(file || ""));
}

function isWebLearningPage(file = "") {
  return /^\/emba\/[^?#]+\.html(?:[?#].*)?$/i.test(String(file || ""));
}

function externalMaterialLabel(file = "") {
  return isWebLearningPage(file) ? t("openLearningPage") : t("openSourceFile");
}

function renderMaterialList(materials) {
  return materials.length ? `
    <ul class="emba-read-list emba-material-read-list">
      ${materials.map((item) => `
        <li class="emba-material-read-item">
          ${isReadableMaterial(item.file) ? `<button class="emba-material-open" type="button" data-material-open="${escapeHtml(item.file)}" data-material-title="${escapeHtml(item.title || t("defaultMaterial"))}" data-material-notes="${escapeHtml(item.notes || "")}">` : `<div class="emba-read-copy">`}
            <div class="emba-read-copy">
              <span class="emba-read-title">${escapeHtml(item.title || t("defaultMaterial"))}</span>
              ${item.notes ? `<span class="emba-read-note">${escapeHtml(item.notes)}</span>` : ""}
            </div>
            ${isReadableMaterial(item.file) ? `<span class="emba-read-action">${escapeHtml(materialActionLabel(item))}</span>` : ""}
          ${isReadableMaterial(item.file) ? `</button>` : `</div>`}
          ${item.file && !isReadableMaterial(item.file) ? `<a class="emba-file-link" href="${escapeHtml(resolveCfaUrl(item.file))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.cta || externalMaterialLabel(item.file))}</a>` : ""}
        </li>
      `).join("")}
    </ul>
  ` : `<p class="emba-empty-copy">${escapeHtml(t("noMaterials"))}</p>`;
}

function renderMaterials(month, section = "materials") {
  if (state.materialReader?.file) return renderMaterialReader();
  return renderMaterialList(materialsForSection(month, section));
}

function renderMaterialReader() {
  const reader = state.materialReader;
  if (!reader) return "";
  const canCopy = !reader.loading && !reader.error && Boolean(reader.markdown);
  const podcast = DAY_PAGE_PODCASTS[reader.sourceFile || canonicalMaterialFile(reader.file)];
  const podcastVersions = podcast?.versions || [];
  const selectedPodcastBase = podcastVersions.find((version) => version.language === state.podcastLanguage) || podcastVersions[0];
  const selectedPodcast = selectedPodcastBase
    ? { ...selectedPodcastBase, displayLanguage: selectedPodcastBase.language === "zh" ? t("chineseAudio") : t("englishAudio") }
    : null;
  const body = reader.loading
    ? `<p class="emba-empty-copy">${escapeHtml(t("openingMaterial"))}</p>`
    : reader.error
      ? `<p class="emba-empty-copy">${escapeHtml(t("unableMaterial"))} ${escapeHtml(reader.error)}</p>`
      : `<div class="emba-markdown-rendered">${markdownToHtml(reader.markdown || "", reader.file)}</div>`;
  return `
    <article class="emba-material-reader">
      ${selectedPodcast ? `
        <section class="emba-day-page-podcast" aria-label="${escapeHtml(selectedPodcast.displayLanguage || selectedPodcast.language)} ${escapeHtml(t("courseAudio"))}">
          <div class="emba-day-page-podcast-copy">
            <span class="emba-day-page-podcast-kicker">${escapeHtml(t("courseAudio"))} · ${escapeHtml(selectedPodcast.displayLanguage || selectedPodcast.language)} · ${escapeHtml(t("recommendedFirstListen"))}</span>
            <div class="emba-podcast-language-toggle" role="group" aria-label="${escapeHtml(t("podcastLanguage"))}">
              ${podcastVersions.map((version) => `<button type="button" class="${version.language === selectedPodcast.language ? "is-active" : ""}" data-podcast-language="${escapeHtml(version.language)}" aria-pressed="${String(version.language === selectedPodcast.language)}">${escapeHtml(version.language === "zh" ? t("chineseAudio") : t("englishAudio"))}</button>`).join("")}
            </div>
            <strong>${escapeHtml(selectedPodcast.title)}</strong>
            <span>${escapeHtml(selectedPodcast.description)}</span>
          </div>
          <div class="emba-day-page-podcast-player">
            <audio controls controlsList="nodownload" preload="metadata">
              <source src="${escapeHtml(selectedPodcast.file)}" type="audio/mp4" />
              ${escapeHtml(t("browserNoAudio"))}
            </audio>
          </div>
        </section>
      ` : ""}
      <div class="emba-material-reader-head">
        <div>
          <span class="emba-month-kicker">${escapeHtml(t("fullMaterial"))}</span>
          <h3>${escapeHtml(reader.title || t("defaultMaterial"))}</h3>
          ${reader.notes ? `<p>${escapeHtml(reader.notes)}</p>` : ""}
        </div>
        <div class="emba-material-reader-actions">
          <div class="emba-material-utility-actions">
            ${canCopy ? `<button class="emba-file-link emba-material-copy" type="button" data-material-copy>${escapeHtml(t("copyForGpt"))}</button>` : ""}
            <button class="emba-file-link" type="button" data-material-back>${escapeHtml(t("backToMaterials"))}</button>
          </div>
          <span class="emba-material-copy-status" data-material-copy-status role="status" aria-live="polite"></span>
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
  state.podcastLanguage = "en";
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
  document.querySelector("[data-block-panel]")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderReflection(month) {
  const reflection = String(month?.reflection || "").trim();
  return reflection ? `
    <div class="emba-reflection-display">
      <div class="emba-markdown-rendered">${markdownToHtml(reflection)}</div>
    </div>
  ` : `<p class="emba-empty-copy">${escapeHtml(t("noReflectionYet"))}</p>`;
}

function renderMemoryMoment(month) {
  const memories = asArray(month?.memoryMoment);
  return memories.length ? `
    <div class="emba-memory-grid">
      ${memories.map((item) => `
        <figure class="emba-memory-card">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.caption || t("photo"))}" />
          ${item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ""}
        </figure>
      `).join("")}
    </div>
  ` : `<p class="emba-empty-copy">${escapeHtml(t("noPhotosYet"))}</p>`;
}

function renderMarkdown(month) {
  const content = String(month?.markdown || "").trim();
  return content ? `
    <article class="emba-note-reader">
      <div class="emba-markdown-rendered">${markdownToHtml(content)}</div>
    </article>
  ` : `<p class="emba-empty-copy">${escapeHtml(t("noClassNotes"))}</p>`;
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

function renderMonthDetail(month) {
  const detail = $("#embaMonthDetail");
  if (!detail || !month) return;
  const viewMonth = localizeMonth(month);
  detail.dataset.mode = "read";
  detail.innerHTML = `
    <div class="cfa-month-heading">
      <div>
        <p class="cfa-eyebrow">${escapeHtml(formatMonth(viewMonth.month))}</p>
        <h3>${escapeHtml(t("materialsLearningTrail"))}</h3>
      </div>
      <p>${escapeHtml(t("materialsLearningTrailCopy"))}</p>
    </div>
    ${renderTeam6Feature(viewMonth)}
    ${renderCourseToolkit(viewMonth)}
    ${renderFiveDayJourney(viewMonth)}
    ${renderOpenBlockPanel(viewMonth)}
    <div class="emba-block-grid">
      ${supportingPreparationMaterials(viewMonth).some(materialHasContent) ? blockTemplate("preparation", t("supportingCourseToolkit"), viewMonth) : ""}
      ${materialsForSection(viewMonth, "podcast").some(materialHasContent) ? blockTemplate("podcast", t("courseAudio"), viewMonth) : ""}
      ${blockTemplate("material", t("materialsResources"), viewMonth)}
      ${blockTemplate("markdown", t("integratedClassNotes"), viewMonth)}
      ${blockTemplate("reflection", t("reflection"), viewMonth)}
      ${blockTemplate("memory", t("photos"), viewMonth)}
      ${materialsForSection(viewMonth, "vocabulary").some(materialHasContent) ? blockTemplate("vocabulary", t("professionalVocabulary"), viewMonth) : ""}
    </div>
  `;
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  initCfaLanguage();
  initCfaAccess();
  const detail = $("#embaMonthDetail");

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
  detail.addEventListener("click", async (event) => {
    const toggleBtn = event.target.closest("[data-block-toggle]");
    if (toggleBtn) {
      const id = toggleBtn.dataset.blockToggle;
      state.openBlockId = state.openBlockId === id ? "" : id;
      state.materialReader = null;
      renderMonthDetail(state.month);
      if (state.openBlockId) {
        document.querySelector("[data-block-panel]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    const closeBtn = event.target.closest("[data-block-close]");
    if (closeBtn) {
      state.openBlockId = "";
      state.materialReader = null;
      renderMonthDetail(state.month);
      return;
    }

    const openMaterialBtn = event.target.closest("[data-material-open]");
    if (openMaterialBtn) {
      if (!openMaterialBtn.closest("[data-block-panel]")) state.openBlockId = "material";
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
      document.querySelector("[data-block-panel]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const langBtn = event.target.closest("[data-podcast-language]");
    if (langBtn) {
      state.podcastLanguage = langBtn.dataset.podcastLanguage;
      renderMonthDetail(state.month);
      return;
    }

    const copyBtn = event.target.closest("[data-material-copy]");
    if (copyBtn && state.materialReader?.markdown) {
      try {
        await navigator.clipboard.writeText(state.materialReader.markdown);
        const status = detail.querySelector("[data-material-copy-status]");
        if (status) {
          status.textContent = t("copiedForGpt");
          setTimeout(() => { if (status) status.textContent = ""; }, 3000);
        }
      } catch {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = state.materialReader.markdown;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        const status = detail.querySelector("[data-material-copy-status]");
        if (status) {
          status.textContent = t("copiedForGpt");
          setTimeout(() => { if (status) status.textContent = ""; }, 3000);
        }
      }
      return;
    }
  });

  // Audio Playback: ensure only one audio plays at a time
  document.addEventListener("play", (e) => {
    if (e.target.tagName === "AUDIO") {
      document.querySelectorAll("audio").forEach((other) => {
        if (other !== e.target && !other.paused) {
          other.pause();
        }
      });
    }
  }, true);
});
