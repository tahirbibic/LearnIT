export type Lang = 'en' | 'sr';

export const translations = {
  sr: {
    // Common
    back: 'NAZAD',
    saveAndGo: 'SAČUVAJ I KRENI',
    library: 'BIBLIOTEKA',
    loading: 'UČITAVANJE...',
    load: 'UČITAJ',
    uploadPdf: 'OTPREMI PDF',

    // IQ Levels
    iqLevelLabel: 'NIVO IQ:',
    iqBeginner: 'POČETNIK',
    iqReasonable: 'RAZUMAN',
    iqSmart: 'PAMETAN',
    iqGenius: 'GENIJE',
    iqExtreme: 'EKSTREMAN',
    iqMystery: 'MISTERIJA',

    // StartMenu
    enterAsProfessor: 'UĐI KAO PROFESOR',
    professorTitle: 'PROFESOR',
    professorSubtext: 'UKOLIKO ŽELIŠ DA USAVRŠIŠ ZNANJE, NASTAVI',
    continue: 'NASTAVI',
    enterAsStudent: 'UĐI KAO UČENIK',
    studentTitle: 'UČENIK',
    studentSubtext: 'UKOLIKO ŽELIŠ DA NAUČIŠ NEŠTO NOVO, NASTAVI',
    viewAnnouncements: 'POGLEDAJ OBAVEŠTENJA',
    openStore: 'OTVORI PRODAVNICU',
    viewLeaderboard: 'POGLEDAJ TOP LISTU',

    // Classroom
    lessonAdded: 'LEKCIJA USPEŠNO DODATA!',
    newLesson: 'NOVA LEKCIJA',
    historyTab: 'ISTORIJA',
    teachingMaterial: 'MATERIJAL ZA PREDAVANJE',
    pasteTextOrUpload: 'Ubacite tekst lekcije ovde ili otpremite fajl:',
    reading: 'ČITANJE...',
    uploadFile: 'OTPREMI FAJL',
    textPlaceholder: 'Zalepljen tekst ili tvoje beleške...',
    contentLibrary: 'BIBLIOTEKA GRADIVA',
    chooseOrUpload: 'Izaberi predefinisanu lekciju ili otpremi sopstveni fajl:',
    loadingLibrary: 'Učitavanje biblioteke...',
    loadingItem: 'UČITAVAM...',
    teachingHistory: 'ISTORIJA PREDAVANJA',
    noAnalyses: 'Još uvek nemate snimljenih analiza.',
    finishForHistory: 'Završite predavanje da bi se pojavilo ovde.',
    scoreLabel: 'SKOR:',
    journalTitle: 'DNEVNIK:',
    levelLabel: 'NIVO:',
    iqRating: 'IQ REJTING',
    currentStatus: 'Trenutni Status',
    topicLabel: 'Tema:',
    notSelected: 'NIJE ODABRANA',
    statusLabel: 'Status:',
    readyForTest: 'SPREMAN ZA TEST',
    waitingForMaterial: 'ČEKA MATERIJAL',
    teacherTip: 'SAVET ZA NASTAVNIKA',
    feynmanQuote: '"Objasni kao da imam pet godina." – to je ključ Feynmanove tehnike. Koristi analogije iz svakodnevnog života!',
    goBack: 'Vrati se nazad',
    goToBoard: 'Idi na tablu',

    // GreenboardMenu
    backToDesk: 'Nazad do klupe',
    handOutExams: 'Podeli testove',
    teachLessonBtn: 'Predaj lekciju',

    // StudentClassroom
    clickToSetMaterial: 'KLIKNI DA POSTAVIŠ MATERIJAL',
    teachMe: 'NAUČI ME',
    journalContent: 'SADRŽAJ DNEVNIKA',
    characters: 'KARAKTERA',
    pasteLessonText: 'Ovdje nalepi tekst lekcije...',
    lectureLevel: 'NIVO PREDAVANJA',
    basicLevel: 'OSNOVNI',
    mediumLevel: 'SREDNJI',
    advancedLevel: 'NAPREDNI',
    instructionsTitle: 'UPUTSTVO:',
    uploadPdfOrWrite: 'Otpremi PDF lekcije ili napiši tekst.',
    aiWillAnalyze: 'AI će analizirati materijal i objasniti ga.',
    chooseDifficulty: 'Odaberi nivo težine pre nego kreneš.',
    libraryEmpty: 'Biblioteka je prazna.',
    professorNeedsToAdd: 'Profesor treba da doda PDFove u biblioteku.',
    analyzing: 'ANALIZIRAM...',
    uploadPdfImage: 'OTPREMI PDF / SLIKU',

    // TeachingMode
    endLecture: 'Završi Predavanje',
    studentVoiceOn: 'Učenik: UKL.',
    studentVoiceOff: 'Učenik: ISKL.',
    confusionLabel: 'Zbunjenost',
    studentPrefix: 'Učenik:',
    thinkingSuffix: 'razmišlja...',
    listeningPlaceholder: 'Slušam...',
    teachLessonPlaceholder: 'Predaj lekciju...',

    // ExamMode
    generatingTest: 'AI Sastavlja Test na osnovu lekcije...',
    studentFillingTest: 'Učenik popunjava test...',
    studentStatusPrefix: 'Status studenta: Nivo',
    resultsTitle: 'REZULTATI',
    correctLabel: 'Tačno:',
    gradeLabel: 'Ocena:',
    iqEarnedLabel: 'Zaradjeni IQ Poeni: +',
    finishTest: 'Završi test',

    // Analytics
    lectureAnalytics: 'ANALITIKA PREDAVANJA',
    writingReport: 'AI PIŠE IZVEŠTAJ...',
    pedagogicalRating: 'Pedagoški Rejting',
    confusionFinalLabel: 'Zbunjenost',
    sessionResult: 'Krajnji rezultat seanse',
    whatWasGood: 'ŠTA JE BILO DOBRO',
    forImprovement: 'ZA POBOLJŠANJE',
    backToSchool: 'NAZAD U ŠKOLU',

    // LearningMode
    exit: 'IZAĐI',
    askProfessor: 'Pitaj profesora nešto...',
    askProfessorNoMic: 'Pitaj profesora nešto...',

    // Store
    isNowYourStudent: 'JE SADA TVOJ STUDENT!',
    priceLabel: 'CENA:',
    activeStudent: '✓ AKTUELAN',
    purchasedStudent: 'KUPLJEN',
    unequipStudent: 'UKLONI',

    // AI language tag (used in system prompts)
    aiLanguage: 'SRPSKOM',
  },
  en: {
    // Common
    back: 'BACK',
    saveAndGo: 'SAVE AND GO',
    library: 'LIBRARY',
    loading: 'LOADING...',
    load: 'LOAD',
    uploadPdf: 'UPLOAD PDF',

    // IQ Levels
    iqLevelLabel: 'IQ LEVEL:',
    iqBeginner: 'BEGINNER',
    iqReasonable: 'REASONABLE',
    iqSmart: 'SMART',
    iqGenius: 'GENIUS',
    iqExtreme: 'EXTREME',
    iqMystery: 'MYSTERY',

    // StartMenu
    enterAsProfessor: 'ENTER AS PROFESSOR',
    professorTitle: 'PROFESSOR',
    professorSubtext: 'IF YOU WANT TO DEEPEN YOUR KNOWLEDGE, CONTINUE',
    continue: 'CONTINUE',
    enterAsStudent: 'ENTER AS STUDENT',
    studentTitle: 'STUDENT',
    studentSubtext: 'IF YOU WANT TO LEARN SOMETHING NEW, CONTINUE',
    viewAnnouncements: 'VIEW ANNOUNCEMENTS',
    openStore: 'OPEN STORE',
    viewLeaderboard: 'VIEW LEADERBOARD',

    // Classroom
    lessonAdded: 'LESSON ADDED SUCCESSFULLY!',
    newLesson: 'NEW LESSON',
    historyTab: 'HISTORY',
    teachingMaterial: 'TEACHING MATERIAL',
    pasteTextOrUpload: 'Paste lesson text here or upload a file:',
    reading: 'READING...',
    uploadFile: 'UPLOAD FILE',
    textPlaceholder: 'Pasted text or your notes...',
    contentLibrary: 'CONTENT LIBRARY',
    chooseOrUpload: 'Choose a predefined lesson or upload your own file:',
    loadingLibrary: 'Loading library...',
    loadingItem: 'LOADING...',
    teachingHistory: 'TEACHING HISTORY',
    noAnalyses: 'No recorded analyses yet.',
    finishForHistory: 'Finish a lecture for it to appear here.',
    scoreLabel: 'SCORE:',
    journalTitle: 'JOURNAL:',
    levelLabel: 'LEVEL:',
    iqRating: 'IQ RATING',
    currentStatus: 'Current Status',
    topicLabel: 'Topic:',
    notSelected: 'NOT SELECTED',
    statusLabel: 'Status:',
    readyForTest: 'READY FOR TEST',
    waitingForMaterial: 'WAITING FOR MATERIAL',
    teacherTip: 'TEACHER TIP',
    feynmanQuote: '"Explain it like I\'m five." – that is the key of the Feynman technique. Use analogies from everyday life!',
    goBack: 'Go Back',
    goToBoard: 'Go to Board',

    // GreenboardMenu
    backToDesk: 'Back to Desk',
    handOutExams: 'Hand Out Exams',
    teachLessonBtn: 'Teach Lesson',

    // StudentClassroom
    clickToSetMaterial: 'CLICK TO SET MATERIAL',
    teachMe: 'TEACH ME',
    journalContent: 'JOURNAL CONTENT',
    characters: 'CHARACTERS',
    pasteLessonText: 'Paste lesson text here...',
    lectureLevel: 'LECTURE LEVEL',
    basicLevel: 'BASIC',
    mediumLevel: 'MEDIUM',
    advancedLevel: 'ADVANCED',
    instructionsTitle: 'INSTRUCTIONS:',
    uploadPdfOrWrite: 'Upload a PDF lesson or write text.',
    aiWillAnalyze: 'AI will analyze and explain the material.',
    chooseDifficulty: 'Choose difficulty level before starting.',
    libraryEmpty: 'Library is empty.',
    professorNeedsToAdd: 'Professor needs to add PDFs to the library.',
    analyzing: 'ANALYZING...',
    uploadPdfImage: 'UPLOAD PDF / IMAGE',

    // TeachingMode
    endLecture: 'End Lecture',
    studentVoiceOn: 'Student: ON',
    studentVoiceOff: 'Student: OFF',
    confusionLabel: 'Confusion',
    studentPrefix: 'Student:',
    thinkingSuffix: 'is thinking...',
    listeningPlaceholder: 'Listening...',
    teachLessonPlaceholder: 'Teach the lesson...',

    // ExamMode
    generatingTest: 'AI is generating a test based on the lesson...',
    studentFillingTest: 'Student is filling out the test...',
    studentStatusPrefix: 'Student status: Level',
    resultsTitle: 'RESULTS',
    correctLabel: 'Correct:',
    gradeLabel: 'Grade:',
    iqEarnedLabel: 'Earned IQ Points: +',
    finishTest: 'Finish Test',

    // Analytics
    lectureAnalytics: 'LECTURE ANALYTICS',
    writingReport: 'AI IS WRITING REPORT...',
    pedagogicalRating: 'Pedagogical Rating',
    confusionFinalLabel: 'Confusion',
    sessionResult: 'Final session result',
    whatWasGood: 'WHAT WENT WELL',
    forImprovement: 'FOR IMPROVEMENT',
    backToSchool: 'BACK TO SCHOOL',

    // LearningMode
    exit: 'EXIT',
    askProfessor: 'Ask the professor something...',
    askProfessorNoMic: 'Ask the professor something... (microphone not available)',

    // Store
    isNowYourStudent: 'IS NOW YOUR STUDENT!',
    priceLabel: 'PRICE:',
    activeStudent: '✓ ACTIVE',
    purchasedStudent: 'PURCHASED',
    unequipStudent: 'REMOVE',

    // AI language tag (used in system prompts)
    aiLanguage: 'ENGLISH',
  },
} as const;

export type TranslationKey = keyof typeof translations.sr;
