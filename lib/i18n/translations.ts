export type Language = 'en' | 'kh' | 'th' | 'zh';

type TranslationSet = {
  // Shared / Common
  dashboard: string;
  home: string;
  books: string;
  users: string;
  partners: string;
  revenue: string;
  analytics: string;
  settings: string;
  logout: string;
  profile: string;
  loading: string;
  search: string;
  filter: string;
  clear: string;
  actions: string;
  status: string;
  details: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  add: string;
  view: string;
  viewAll: string;
  back: string;
  next: string;
  previous: string;
  submit: string;
  confirm: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  yes: string;
  no: string;
  active: string;
  inactive: string;
  pending: string;
  completed: string;
  inProgress: string;
  free: string;
  paid: string;
  price: string;
  category: string;
  language: string;
  
  // Auth
  login: string;
  signIn: string;
  signUp: string;
  signOut: string;
  email: string;
  password: string;
  forgotPassword: string;
  welcomeBack: string;
  signInToContinue: string;
  dontHaveAccount: string;
  haveAccount: string;
  
  // OSO / Admin
  commandCenter: string;
  platformCatalog: string;
  totalUsers: string;
  booksPublished: string;
  platformRevenue: string;
  actionNeeded: string;
  recentUsers: string;
  topBooks: string;
  partnerApplications: string;
  managePartners: string;
  manageAuthors: string;
  manageReaders: string;
  platformStats: string;
  
  // Partner
  authorStats: string;
  inviteAuthor: string;
  reviewQueue: string;
  myAuthors: string;
  networkStats: string;
  totalAuthors: string;
  booksInReview: string;
  networkReads: string;
  partnerRevenue: string;
  payoutHistory: string;
  viewAllAuthors: string;
  
  // Author
  myBooks: string;
  newBook: string;
  authorRevenue: string;
  bookTitle: string;
  bookDescription: string;
  bookCategory: string;
  bookPrice: string;
  publishBook: string;
  draftBook: string;
  publishedBook: string;
  totalBooks: string;
  totalReads: string;
  totalEarnings: string;
  chapters: string;
  words: string;
  readingTime: string;
  submitForReview: string;
  
  // Author-Partner
  partner: string;
  partnerNetwork: string;
  joinPartner: string;
  partnerCode: string;
  enterPartnerCode: string;
  myPartner: string;
  partnerReviews: string;
  currentPartner: string;
  noPartner: string;
  partnershipActive: string;
  partnershipPaused: string;
  partnershipTerminated: string;
  terminatePartnership: string;
  pausePartnership: string;
  resumePartnership: string;
  terminationReason: string;
  respondToReview: string;
  yourResponse: string;
  sendResponse: string;
  
  // Reviews
  writeReview: string;
  reviewTitle: string;
  reviewText: string;
  communicationRating: string;
  qualityRating: string;
  reliabilityRating: string;
  professionalismRating: string;
  overallRating: string;
  submitReview: string;
  averageRatings: string;
  
  // Reader
  myLibrary: string;
  browse: string;
  browseBooks: string;
  bookmarks: string;
  continueReading: string;
  readNow: string;
  purchase: string;
  buyNow: string;
  getFree: string;
  booksOwned: string;
  hoursRead: string;
  trendingNow: string;
  newReleases: string;
  featuredPick: string;
  popular: string;
  newest: string;
  priceLowHigh: string;
  priceHighLow: string;
  reviews: string;
  noBooksFound: string;
  startReading: string;
  continue: string;
  
  // Book Details
  by: string;
  author: string;
  chapters_count: string;
  rating: string;
  readMore: string;
  readLess: string;
  bookDetails: string;
  addToLibrary: string;
  
  // Landing Page
  readDiscoverRepeat: string;
  genZReadingPlatform: string;
  startReadingFree: string;
  browseCatalog: string;
  thousandsOfBooks: string;
  findYourNextStory: string;
  joinThousands: string;
  freeToStart: string;
  featuredReads: string;
  handpickedForYou: string;
  readers: string;
  whatEveryoneReading: string;
  freshFromPublishers: string;
  browseByCategory: string;
  findYourGenre: string;
  whyReadersLoveUs: string;
  builtForNextGen: string;
  readAnywhere: string;
  aiPowered: string;
  affordable: string;
  instantAccess: string;
  trackProgress: string;
  customizable: string;
  readyToStart: string;
  readingJourney: string;
  seamlessExperience: string;
  smartRecommendations: string;
  thousandsFree: string;
  startInSeconds: string;
  beautifulStats: string;
  darkModeFonts: string;
  getStartedFree: string;
  copyright: string;
  allRightsReserved: string;
  
  // Navigation
  menu: string;
  quickStats: string;
  signInButton: string;
  getStartedButton: string;
  features: string;
  categories: string;
};

export const translations: Record<Language, TranslationSet> = {
  en: {
    // Shared
    dashboard: 'Dashboard', home: 'Home', books: 'Books', users: 'Users', partners: 'Partners',
    revenue: 'Revenue', analytics: 'Analytics', settings: 'Settings', logout: 'Logout', profile: 'Profile',
    loading: 'Loading...', search: 'Search...', filter: 'Filter', clear: 'Clear', actions: 'Actions',
    status: 'Status', details: 'Details', save: 'Save', cancel: 'Cancel', delete: 'Delete',
    edit: 'Edit', create: 'Create', add: 'Add', view: 'View', viewAll: 'View all', back: 'Back',
    next: 'Next', previous: 'Previous', submit: 'Submit', confirm: 'Confirm', success: 'Success',
    error: 'Error', warning: 'Warning', info: 'Info', yes: 'Yes', no: 'No', active: 'Active',
    inactive: 'Inactive', pending: 'Pending', completed: 'Completed', inProgress: 'In Progress',
    free: 'Free', paid: 'Paid', price: 'Price', category: 'Category', language: 'Language',
    
    // Auth
    login: 'Login', signIn: 'Sign In', signUp: 'Sign Up', signOut: 'Sign Out', email: 'Email address',
    password: 'Password', forgotPassword: 'Forgot password?', welcomeBack: 'Welcome back',
    signInToContinue: 'Sign in to your account to continue', dontHaveAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    
    // OSO
    commandCenter: 'Command Center', platformCatalog: 'Platform Catalog', totalUsers: 'Total Users',
    booksPublished: 'Books Published', platformRevenue: 'Platform Revenue', actionNeeded: 'Action Needed',
    recentUsers: 'Recent Users', topBooks: 'Top Books', partnerApplications: 'Partner Applications',
    managePartners: 'Manage Partners', manageAuthors: 'Manage Authors', manageReaders: 'Manage Readers',
    platformStats: 'Platform Stats',
    
    // Partner
    authorStats: 'Author Stats', inviteAuthor: 'Invite Author', reviewQueue: 'Review Queue',
    myAuthors: 'My Authors', networkStats: 'Network Stats', totalAuthors: 'Total Authors',
    booksInReview: 'Books in Review', networkReads: 'Network Reads', partnerRevenue: 'Partner Revenue',
    payoutHistory: 'Payout History', viewAllAuthors: 'View all authors',
    
    // Author
    myBooks: 'My Books', newBook: 'New Book', authorRevenue: 'Author Revenue', bookTitle: 'Book Title',
    bookDescription: 'Description', bookCategory: 'Category', bookPrice: 'Price', publishBook: 'Publish Book',
    draftBook: 'Draft', publishedBook: 'Published', totalBooks: 'Total Books', totalReads: 'Total Reads',
    totalEarnings: 'Total Earnings', chapters: 'Chapters', words: 'Words', readingTime: 'Reading Time',
    submitForReview: 'Submit for Review',
    
    // Author-Partner
    partner: 'Partner', partnerNetwork: 'Partner Network', joinPartner: 'Join Partner',
    partnerCode: 'Partner Code', enterPartnerCode: 'Enter partner code', myPartner: 'My Partner',
    partnerReviews: 'Partner Reviews', currentPartner: 'Current Partner', noPartner: 'No Partner',
    partnershipActive: 'Active', partnershipPaused: 'Paused', partnershipTerminated: 'Terminated',
    terminatePartnership: 'Terminate Partnership', pausePartnership: 'Pause Partnership',
    resumePartnership: 'Resume Partnership', terminationReason: 'Termination Reason',
    respondToReview: 'Respond to Review', yourResponse: 'Your Response', sendResponse: 'Send Response',
    
    // Reviews
    writeReview: 'Write Review', reviewTitle: 'Review Title', reviewText: 'Detailed Review',
    communicationRating: 'Communication', qualityRating: 'Quality of Work', reliabilityRating: 'Reliability',
    professionalismRating: 'Professionalism', overallRating: 'Overall', submitReview: 'Submit Review',
    averageRatings: 'Average Ratings',
    
    // Reader
    myLibrary: 'My Library', browse: 'Browse', browseBooks: 'Browse Books', bookmarks: 'Bookmarks',
    continueReading: 'Continue Reading', readNow: 'Read Now', purchase: 'Purchase', buyNow: 'Buy Now',
    getFree: 'Get Free', booksOwned: 'Books Owned', hoursRead: 'Hours Read',
    trendingNow: 'Trending Now', newReleases: 'New Releases', featuredPick: 'Featured Pick', readers: 'Readers',
    popular: 'Popular', newest: 'Newest', priceLowHigh: 'Price: Low', priceHighLow: 'Price: High',
    reviews: 'Reviews', noBooksFound: 'No books found', startReading: 'Start Reading', continue: 'Continue',
    
    // Book Details
    by: 'by', author: 'Author', chapters_count: 'Chapters', rating: 'Rating',
    readMore: 'Read more', readLess: 'Read less', bookDetails: 'Book Details',
    addToLibrary: 'Add to Library',
    
    // Landing Page
    readDiscoverRepeat: 'Read. Discover. Repeat.', genZReadingPlatform: 'Gen Z Digital Reading Platform',
    startReadingFree: 'Start Reading Free', browseCatalog: 'Browse Catalog',
    thousandsOfBooks: 'Thousands of books at your fingertips.', findYourNextStory: 'Find your next favorite story',
    joinThousands: 'Join thousands of readers discovering new stories every day.',
    freeToStart: 'Free to get started.', featuredReads: 'Featured Reads', handpickedForYou: 'Handpicked just for you',
    whatEveryoneReading: "What everyone's reading", freshFromPublishers: 'Fresh from the publishers',
    browseByCategory: 'Browse by Category', findYourGenre: 'Find your favorite genre',
    whyReadersLoveUs: 'Why Readers Love Us', builtForNextGen: 'Built for the next generation of readers',
    readAnywhere: 'Read Anywhere', aiPowered: 'AI-Powered', affordable: 'Affordable',
    instantAccess: 'Instant Access', trackProgress: 'Track Progress', customizable: 'Customizable',
    readyToStart: 'Ready to Start Your', readingJourney: 'Reading Journey?',
    seamlessExperience: 'Seamless experience across all your devices.',
    smartRecommendations: 'Smart recommendations and chapter organization.',
    thousandsFree: 'Thousands of free books and competitive pricing.',
    startInSeconds: 'Start reading in seconds. No waiting.',
    beautifulStats: 'Beautiful reading stats and progress tracking.',
    darkModeFonts: 'Dark mode, font sizes, themes - make it yours.',
    getStartedFree: 'Get Started Free', copyright: '©', allRightsReserved: 'All rights reserved.',
    
    // Navigation
    menu: 'Menu', quickStats: 'Quick Stats', signInButton: 'Sign In', getStartedButton: 'Get Started',
    features: 'Features', categories: 'Categories',
  },
  
  kh: {
    // Shared
    dashboard: 'ផ្ទាំងគ្រប់គ្រង', home: 'ទំព័រដើម', books: 'សៀវភៅ', users: 'អ្នកប្រើប្រាស់', partners: 'ដៃគូ',
    revenue: 'ចំណូល', analytics: 'ការវិភាគ', settings: 'ការកំណត់', logout: 'ចាកចេញ', profile: 'ប្រវត្តិរូប',
    loading: 'កំពុងផ្ទុក...', search: 'ស្វែងរក...', filter: 'ចម្រោះ', clear: 'សម្អាត', actions: 'សកម្មភាព',
    status: 'ស្ថានភាព', details: 'ព័ត៌មានលម្អិត', save: 'រក្សាទុក', cancel: 'បោះបង់', delete: 'លុប',
    edit: 'កែសម្រួល', create: 'បង្កើត', add: 'បន្ថែម', view: 'មើល', viewAll: 'មើលទាំងអស់', back: 'ត្រលប់',
    next: 'បន្ទាប់', previous: 'មុន', submit: 'ដាក់ស្នើ', confirm: 'បញ្ជាក់', success: 'ជោគជ័យ',
    error: 'កំហុស', warning: 'ការព្រមាន', info: 'ព័ត៌មាន', yes: 'បាទ/ចាស', no: 'ទេ', active: 'សកម្ម',
    inactive: 'អសកម្ម', pending: 'រង់ចាំ', completed: 'រួចរាល់', inProgress: 'កំពុងធ្វើ',
    free: 'ឥតគិតថ្លៃ', paid: 'បង់ប្រាក់', price: 'តម្លៃ', category: 'ប្រភេទ', language: 'ភាសា',
    
    // Auth
    login: 'ចូលប្រើ', signIn: 'ចូល', signUp: 'ចុះឈ្មោះ', signOut: 'ចេញ', email: 'អាសយដ្ឋានអ៊ីមែល',
    password: 'ពាក្យសម្ងាត់', forgotPassword: 'ភ្លេចពាក្យសម្ងាត់?', welcomeBack: 'សូមស្វាគមន៍មកវិញ',
    signInToContinue: 'ចូលប្រើគណនីរបស់អ្នកដើម្បីបន្ត', dontHaveAccount: "មិនទាន់មានគណនី?",
    haveAccount: 'មានគណនីរួចហើយ?',
    
    // OSO
    commandCenter: 'មជ្ឈមណ្ឌលបញ្ជា', platformCatalog: 'កាតាឡុកប្រព័ន្ធ', totalUsers: 'អ្នកប្រើប្រាស់សរុប',
    booksPublished: 'សៀវភៅដែលបានបោះពុម្ព', platformRevenue: 'ចំណូលប្រព័ន្ធ', actionNeeded: 'សកម្មភាពដែលត្រូវធ្វើ',
    recentUsers: 'អ្នកប្រើប្រាស់ថ្មីៗ', topBooks: 'សៀវភៅពេញនិយម', partnerApplications: 'ពាក្យសុំធ្វើជាដៃគូ',
    managePartners: 'គ្រប់គ្រងដៃគូ', manageAuthors: 'គ្រប់គ្រងអ្នកនិពន្ធ', manageReaders: 'គ្រប់គ្រងអ្នកអាន',
    platformStats: 'ស្ថិតិប្រព័ន្ធ',
    
    // Partner
    authorStats: 'ស្ថិតិអ្នកនិពន្ធ', inviteAuthor: 'អញ្ជើញអ្នកនិពន្ធ', reviewQueue: 'ជួរពិនិត្យ',
    myAuthors: 'អ្នកនិពន្ធរបស់ខ្ញុំ', networkStats: 'ស្ថិតិបណ្តាញ', totalAuthors: 'អ្នកនិពន្ធសរុប',
    booksInReview: 'សៀវភៅកំពុងពិនិត្យ', networkReads: 'ការអានបណ្តាញ', partnerRevenue: 'ចំណូលដៃគូ',
    payoutHistory: 'ប្រវត្តិបង់ប្រាក់', viewAllAuthors: 'មើលអ្នកនិពន្ធទាំងអស់',
    
    // Author
    myBooks: 'សៀវភៅរបស់ខ្ញុំ', newBook: 'សៀវភៅថ្មី', authorRevenue: 'ចំណូលអ្នកនិពន្ធ', bookTitle: 'ចំណង់ជើងសៀវភៅ',
    bookDescription: 'សេចក្តីពិពណ៌នា', bookCategory: 'ប្រភេទ', bookPrice: 'តម្លៃ', publishBook: 'បោះពុម្ព',
    draftBook: 'សេចក្តីពណ៌នា', publishedBook: 'បានបោះពុម្ព', totalBooks: 'សៀវភៅសរុប', totalReads: 'ការអានសរុប',
    totalEarnings: 'ចំណូលសរុប', chapters: 'ជំពូក', words: 'ពាក្យ', readingTime: 'ពេលវេលាអាន',
    submitForReview: 'ដាក់ស្នើពិនិត្យ',
    
    // Author-Partner
    partner: 'ដៃគូ', partnerNetwork: 'បណ្តាញដៃគូ', joinPartner: 'ចូលរួមជាមួយដៃគូ',
    partnerCode: 'លេខកូដដៃគូ', enterPartnerCode: 'បញ្ចូលលេខកូដដៃគូ', myPartner: 'ដៃគូរបស់ខ្ញុំ',
    partnerReviews: 'ការវាយតម្លៃដៃគូ', currentPartner: 'ដៃគូបច្ចុប្បន្ន', noPartner: 'គ្មានដៃគូ',
    partnershipActive: 'សកម្ម', partnershipPaused: 'ផ្អាក', partnershipTerminated: 'បញ្ចប់',
    terminatePartnership: 'បញ្ចប់ភាពជាដៃគូ', pausePartnership: 'ផ្អាកភាពជាដៃគូ',
    resumePartnership: 'បន្តភាពជាដៃគូ', terminationReason: 'មូលហេតុបញ្ចប់',
    respondToReview: 'ឆ្លើយតបការវាយតម្លៃ', yourResponse: 'ការឆ្លើយតបរបស់អ្នក', sendResponse: 'ផ្ញើឆ្លើយតប',
    
    // Reviews
    writeReview: 'សរសេរការវាយតម្លៃ', reviewTitle: 'ចំណង់ជំពូក', reviewText: 'ការពិពណ៌នា',
    communicationRating: 'ទំនាក់ទំនង', qualityRating: 'គុណភាព', reliabilityRating: 'ភាពទុកចិត្ត',
    professionalismRating: 'វិជ្ជាជីវៈ', overallRating: 'ទូទៅ', submitReview: 'ដាក់ស្នើ',
    averageRatings: 'ការវាយតម្លៃមធ្យម',
    
    // Reader
    myLibrary: 'បណ្ណាល័យរបស់ខ្ញុំ', browse: 'រុករក', browseBooks: 'រុករកសៀវភៅ', bookmarks: 'ចំណាំ',
    continueReading: 'បន្តអាន', readNow: 'អានឥឡូវ', purchase: 'ទិញ', buyNow: 'ទិេឥឡូវ',
    getFree: 'ទទួលឥតគិតថ្លៃ', booksOwned: 'សៀវភៅដែលមាន', hoursRead: 'ម៉ោងអាន',
    trendingNow: 'កំពុងពេញនិយម', newReleases: 'ចេញថ្មី',
    featuredPick: 'ជ្រើសរើសពិសេស', popular: 'ពេញនិយម', newest: 'ថ្មីបំផុត', readers: 'អ្នកអាន',
    priceLowHigh: 'តម្លៃ: ទាបទៅខ្ពស់', priceHighLow: 'តម្លៃ: ខ្ពស់ទៅទាប',
    reviews: 'ការវិនិត្យ', noBooksFound: 'រកមិនឃើញសៀវភៅ', startReading: 'ចាប់ផ្តើមអាន', continue: 'បន្ត',
    
    // Book Details
    by: 'ដោយ', author: 'អ្នកនិពន្ធ', chapters_count: 'ជំពូក', rating: 'ការវិនិត្យ',
    readMore: 'អានបន្ថែម', readLess: 'អានតិច', bookDetails: 'ព័ត៌មានសៀវភៅ',
    addToLibrary: 'បន្ថែមទៅបណ្ណាល័យ',
    
    // Landing Page
    readDiscoverRepeat: 'អាន។ ស្វែងរក។ ធ្វើម្តងទៀត។', genZReadingPlatform: 'វេទិកាអានសៀវភៅ Gen Z',
    startReadingFree: 'ចាប់ផ្តើមអានឥតគិតថ្លៃ', browseCatalog: 'រុករកកាតាឡុក',
    thousandsOfBooks: 'សៀវភៅរាប់ពាន់ក្នុងចុងក្រសួងរបស់អ្នក។', findYourNextStory: 'រកឃើញរឿងស្រលាយខ្ទះរបស់អ្នក',
    joinThousands: 'ចូលរួមជាមួយអ្នកអានរាប់ពាន់នាក់ដែលកំពុងរកឃើញរឿងថ្មីៗរៀងរាល់ថ្ងៃ។',
    freeToStart: 'ឥតគិតថ្លៃដើម្បីចាប់ផ្តើម។', featuredReads: 'សៀវភៅពេញនិយម', handpickedForYou: 'ជ្រើសរើសសម្រាប់អ្នក',
    whatEveryoneReading: 'អ្វីដែលគេកំពុងអាន', freshFromPublishers: 'ថ្មីៗពីការបោះពុម្ព',
    browseByCategory: 'រុករកតាមប្រភេទ', findYourGenre: 'រកប្រភេទចូលចិត្តរបស់អ្នក',
    whyReadersLoveUs: 'ហេតុអ្វីអ្នកអានចូលចិត្តពួកយើង', builtForNextGen: 'បង្កើតសម្រាប់ជំនាន់ថ្មី',
    readAnywhere: 'អានគ្រប់ទីកន្លែង', aiPowered: 'ដំណើរការដោយ AI', affordable: 'តម្លៃសមរម្យ',
    instantAccess: 'ចូលប្រើភ្លេងតែមួយ', trackProgress: 'តាមដានវឌ្ឍហាតិ', customizable: 'ប្រកាសផ្ទាល់',
    readyToStart: 'ត្រៀមចាប់ផ្តើម', readingJourney: 'ដំណើរការអាន?',
    seamlessExperience: 'បទពិធីរ៉ាប់គ្រប់ឧបករណ៍របស់អ្នក។', smartRecommendations: 'ផ្តល់អនុស្សាញឆ្លងកាត់ AI ឆ្លាតវៃ។',
    thousandsFree: 'សៀវភៅឥតគិតថ្លៃរាប់ពាន់ និងតម្លៃសមរម្យ។', startInSeconds: 'ចាប់ផ្តើមអានក្នុងវិនាទី។',
    beautifulStats: 'ស្ថិតិអានស្អាត និងតាមដានវឌ្ឍហាតិ។', darkModeFonts: 'របៀបងារ ទំហំអក្សរ ប្រកាសផ្សេងៗ - ធ្វើវាផ្ទាល់ខ្លួនអ្នក។',
    getStartedFree: 'ចាប់ផ្តើមឥតគិតថ្លៃ', copyright: '©', allRightsReserved: 'រក្សាសិទ្ធិទាំងអស់។',
    
    // Navigation
    menu: 'ម៉ឺនុយ', quickStats: 'ស្ថិតិរហ័ស', signInButton: 'ចូល', getStartedButton: 'ចាប់ផ្តើម',
    features: 'លក្ខណៈ', categories: 'ប្រភេទ',
  },
  
  th: {
    // Shared
    dashboard: 'แดชบอร์ด', home: 'หน้าแรก', books: 'หนังสือ', users: 'ผู้ใช้', partners: 'พาร์ทเนอร์',
    revenue: 'รายได้', analytics: 'การวิเคราะห์', settings: 'การตั้งค่า', logout: 'ออกจากระบบ', profile: 'โปรไฟล์',
    loading: 'กำลังโหลด...', search: 'ค้นหา...', filter: 'กรอง', clear: 'ล้าง', actions: 'การดำเนินการ',
    status: 'สถานะ', details: 'รายละเอียด', save: 'บันทึก', cancel: 'ยกเลิก', delete: 'ลบ',
    edit: 'แก้ไข', create: 'สร้าง', add: 'เพิ่ม', view: 'ดู', viewAll: 'ดูทั้งหมด', back: 'กลับ',
    next: 'ถัดไป', previous: 'ก่อนหน้า', submit: 'ส่ง', confirm: 'ยืนยัน', success: 'สำเร็จ',
    error: 'ข้อผิดพลาด', warning: 'คำเตือน', info: 'ข้อมูล', yes: 'ใช่', no: 'ไม่', active: 'เปิดใช้งาน',
    inactive: 'ปิดใช้งาน', pending: 'รอดำเนินการ', completed: 'เสร็จสิ้น', inProgress: 'กำลังดำเนินการ',
    free: 'ฟรี', paid: 'มีค่าใช้จ่าย', price: 'ราคา', category: 'หมวดหมู่', language: 'ภาษา',
    
    // Auth
    login: 'เข้าสู่ระบบ', signIn: 'เข้าสู่ระบบ', signUp: 'ลงทะเบียน', signOut: 'ออกจากระบบ', email: 'อีเมล',
    password: 'รหัสผ่าน', forgotPassword: 'ลืมรหัสผ่าน?', welcomeBack: 'ยินดีต้อนรับกลับ',
    signInToContinue: 'เข้าสู่ระบบเพื่อดำเนินการต่อ', dontHaveAccount: 'ยังไม่มีบัญชี?',
    haveAccount: 'มีบัญชีอยู่แล้ว?',
    
    // OSO
    commandCenter: 'ศูนย์บัญชาการ', platformCatalog: 'แพลตฟอร์ม', totalUsers: 'ผู้ใช้ทั้งหมด',
    booksPublished: 'หนังสือที่ตีพิมพ์', platformRevenue: 'รายได้แพลตฟอร์ม', actionNeeded: 'ต้องดำเนินการ',
    recentUsers: 'ผู้ใช้ใหม่', topBooks: 'หนังสือยอดนิยม', partnerApplications: 'คำขอพาร์ทเนอร์',
    managePartners: 'จัดการพาร์ทเนอร์', manageAuthors: 'จัดการนักเขียน', manageReaders: 'จัดการผู้อ่าน',
    platformStats: 'สถิติแพลตฟอร์ม',
    
    // Partner
    authorStats: 'สถิตินักเขียน', inviteAuthor: 'เชิญนักเขียน', reviewQueue: 'คิวตรวจสอบ',
    myAuthors: 'นักเขียนของฉัน', networkStats: 'สถิติเครือข่าย', totalAuthors: 'นักเขียนทั้งหมด',
    booksInReview: 'หนังสือรอตรวจ', networkReads: 'การอ่านเครือข่าย', partnerRevenue: 'รายได้พาร์ทเนอร์',
    payoutHistory: 'ประวัติการจ่าย', viewAllAuthors: 'ดูนักเขียนทั้งหมด',
    
    // Author
    myBooks: 'หนังสือของฉัน', newBook: 'หนังสือใหม่', authorRevenue: 'รายได้นักเขียน', bookTitle: 'ชื่อหนังสือ',
    bookDescription: 'คำอธิบาย', bookCategory: 'หมวดหมู่', bookPrice: 'ราคา', publishBook: 'เผยแพร่',
    draftBook: 'ฉบับร่าง', publishedBook: 'เผยแพร่แล้ว', totalBooks: 'หนังสือทั้งหมด', totalReads: 'การอ่านทั้งหมด',
    totalEarnings: 'รายได้ทั้งหมด', chapters: 'บท', words: 'คำ', readingTime: 'เวลาอ่าน',
    submitForReview: 'ส่งตรวจสอบ',
    
    // Author-Partner
    partner: 'พาร์ทเนอร์', partnerNetwork: 'เครือข่ายพาร์ทเนอร์', joinPartner: 'เข้าร่วมพาร์ทเนอร์',
    partnerCode: 'รหัสพาร์ทเนอร์', enterPartnerCode: 'ใส่รหัสพาร์ทเนอร์', myPartner: 'พาร์ทเนอร์ของฉัน',
    partnerReviews: 'รีวิวจากพาร์ทเนอร์', currentPartner: 'พาร์ทเนอร์ปัจจุบัน', noPartner: 'ไม่มีพาร์ทเนอร์',
    partnershipActive: 'เปิดใช้งาน', partnershipPaused: 'หยุดชั่วคราว', partnershipTerminated: 'ยุติแล้ว',
    terminatePartnership: 'ยุติความร่วมมือ', pausePartnership: 'หยุดชั่วคราว',
    resumePartnership: 'กลับมาทำงาน', terminationReason: 'เหตุผลในการยุติ',
    respondToReview: 'ตอบกลับรีวิว', yourResponse: 'การตอบกลับของคุณ', sendResponse: 'ส่งการตอบกลับ',
    
    // Reviews
    writeReview: 'เขียนรีวิว', reviewTitle: 'หัวข้อรีวิว', reviewText: 'รายละเอียด',
    communicationRating: 'การสื่อสาร', qualityRating: 'คุณภาพ', reliabilityRating: 'ความน่าเชื่อถือ',
    professionalismRating: 'ความเป็นมืออาชีพ', overallRating: 'โดยรวม', submitReview: 'ส่งรีวิว',
    averageRatings: 'คะแนนเฉลี่ย',
    
    // Reader
    myLibrary: 'ห้องสมุดของฉัน', browse: 'เรียกดู', browseBooks: 'เรียกดูหนังสือ', bookmarks: 'บุ๊กมาร์ก',
    continueReading: 'อ่านต่อ', readNow: 'อ่านเลย', purchase: 'ซื้อ', buyNow: 'ซื้อเลย',
    getFree: 'รับฟรี', booksOwned: 'หนังสือที่มี', hoursRead: 'ชั่วโมงที่อ่าน',
    trendingNow: 'กำลังฮิต', newReleases: 'เผยแพร่ใหม่',
    featuredPick: 'แนะนำพิเศษ', popular: 'ยอดนิยม', newest: 'ใหม่ล่าสุด', readers: 'ผู้อ่าน',
    priceLowHigh: 'ราคา: ต่ำ-สูง', priceHighLow: 'ราคา: สูง-ต่ำ',
    reviews: 'รีวิว', noBooksFound: 'ไม่พบหนังสือ', startReading: 'เริ่มอ่าน', continue: 'ต่อ',
    
    // Book Details
    by: 'โดย', author: 'นักเขียน', chapters_count: 'บท', rating: 'คะแนน',
    readMore: 'อ่านเพิ่ม', readLess: 'อ่านน้อยลง', bookDetails: 'รายละเอียดหนังสือ',
    addToLibrary: 'เพิ่มลงห้องสมุด',
    
    // Landing Page
    readDiscoverRepeat: 'อ่าน. ค้นพบ. ทำซ้ำ.', genZReadingPlatform: 'แพลตฟอร์มการอ่าน Gen Z',
    startReadingFree: 'เริ่มอ่านฟรี', browseCatalog: 'เรียกดูคลัง',
    thousandsOfBooks: 'หนังสือนับพันเล่มรอคุณอยู่', findYourNextStory: 'ค้นหาเรื่องราวโปรดของคุณ',
    joinThousands: 'เข้าร่วมผู้อ่านหลายพันคนที่ค้นพบเรื่องใหม่ทุกวัน',
    freeToStart: 'เริ่มต้นฟรี', featuredReads: 'หนังสือแนะนำ', handpickedForYou: 'คัดสรรให้คุณ',
    whatEveryoneReading: 'สิ่งที่ทุกคนกำลังอ่าน', freshFromPublishers: 'ใหม่จากสำนักพิมพ์',
    browseByCategory: 'เรียกดูตามหมวดหมู่', findYourGenre: 'ค้นหาแนวที่ชอบ',
    whyReadersLoveUs: 'ทำไมผู้อ่านถึงชอบเรา', builtForNextGen: 'สร้างสำหรับคนรุ่นใหม่',
    readAnywhere: 'อ่านได้ทุกที่', aiPowered: 'ขับเคลื่อนด้วย AI', affordable: 'ราคาถูก',
    instantAccess: 'เข้าถึงทันที', trackProgress: 'ติดตามความก้าวหน้า', customizable: 'ปรับแต่งได้',
    readyToStart: 'พร้อมเริ่ม', readingJourney: 'การเดินทางการอ่านของคุณ?',
    seamlessExperience: 'ประสบการณ์ที่ราบรื่นทุกอุปกรณ์', smartRecommendations: 'คำแนะนำอัจฉริยะและการจัดระเบียบบท',
    thousandsFree: 'หนังสือฟรีนับพันเล่มและราคาที่เหมาะสม', startInSeconds: 'เริ่มอ่านในไม่กี่วินาที',
    beautifulStats: 'สถิติการอ่านที่สวยงามและการติดตามความก้าวหน้า', darkModeFonts: 'โหมดมืด ขนาดตัวอักษร ธีม - ปรับแต่งได้',
    getStartedFree: 'เริ่มต้นฟรี', copyright: '©', allRightsReserved: 'สงวนลิขสิทธิ์',
    
    // Navigation
    menu: 'เมนู', quickStats: 'สถิติด่วน', signInButton: 'เข้าสู่ระบบ', getStartedButton: 'เริ่มต้น',
    features: 'ฟีเจอร์', categories: 'หมวดหมู่',
  },
  
  zh: {
    // Shared
    dashboard: '仪表板', home: '首页', books: '书籍', users: '用户', partners: '合作伙伴',
    revenue: '收入', analytics: '分析', settings: '设置', logout: '退出', profile: '个人资料',
    loading: '加载中...', search: '搜索...', filter: '筛选', clear: '清除', actions: '操作',
    status: '状态', details: '详情', save: '保存', cancel: '取消', delete: '删除',
    edit: '编辑', create: '创建', add: '添加', view: '查看', viewAll: '查看全部', back: '返回',
    next: '下一个', previous: '上一个', submit: '提交', confirm: '确认', success: '成功',
    error: '错误', warning: '警告', info: '信息', yes: '是', no: '否', active: '活跃',
    inactive: '不活跃', pending: '待处理', completed: '已完成', inProgress: '进行中',
    free: '免费', paid: '付费', price: '价格', category: '分类', language: '语言',
    
    // Auth
    login: '登录', signIn: '登录', signUp: '注册', signOut: '退出', email: '邮箱',
    password: '密码', forgotPassword: '忘记密码?', welcomeBack: '欢迎回来',
    signInToContinue: '登录您的账户以继续', dontHaveAccount: '没有账户?',
    haveAccount: '已有账户?',
    
    // OSO
    commandCenter: '指挥中心', platformCatalog: '平台目录', totalUsers: '用户总数',
    booksPublished: '已出版书籍', platformRevenue: '平台收入', actionNeeded: '需要操作',
    recentUsers: '新用户', topBooks: '热门书籍', partnerApplications: '合作伙伴申请',
    managePartners: '管理合作伙伴', manageAuthors: '管理作者', manageReaders: '管理读者',
    platformStats: '平台统计',
    
    // Partner
    authorStats: '作者统计', inviteAuthor: '邀请作者', reviewQueue: '审核队列',
    myAuthors: '我的作者', networkStats: '网络统计', totalAuthors: '作者总数',
    booksInReview: '审核中的书籍', networkReads: '网络阅读', partnerRevenue: '合作伙伴收入',
    payoutHistory: '支付历史', viewAllAuthors: '查看所有作者',
    
    // Author
    myBooks: '我的书籍', newBook: '新书', authorRevenue: '作者收入', bookTitle: '书名',
    bookDescription: '描述', bookCategory: '分类', bookPrice: '价格', publishBook: '发布',
    draftBook: '草稿', publishedBook: '已发布', totalBooks: '书籍总数', totalReads: '阅读总数',
    totalEarnings: '总收入', chapters: '章节', words: '字数', readingTime: '阅读时间',
    submitForReview: '提交审核',
    
    // Author-Partner
    partner: '合作伙伴', partnerNetwork: '合作伙伴网络', joinPartner: '加入合作伙伴',
    partnerCode: '合作伙伴代码', enterPartnerCode: '输入合作伙伴代码', myPartner: '我的合作伙伴',
    partnerReviews: '合作伙伴评价', currentPartner: '当前合作伙伴', noPartner: '无合作伙伴',
    partnershipActive: '活跃', partnershipPaused: '暂停', partnershipTerminated: '已终止',
    terminatePartnership: '终止合作关系', pausePartnership: '暂停合作关系',
    resumePartnership: '恢复合作关系', terminationReason: '终止原因',
    respondToReview: '回复评价', yourResponse: '您的回复', sendResponse: '发送回复',
    
    // Reviews
    writeReview: '写评价', reviewTitle: '评价标题', reviewText: '详细评价',
    communicationRating: '沟通', qualityRating: '质量', reliabilityRating: '可靠性',
    professionalismRating: '专业性', overallRating: '总体', submitReview: '提交评价',
    averageRatings: '平均评分',
    
    // Reader
    myLibrary: '我的图书馆', browse: '浏览', browseBooks: '浏览书籍', bookmarks: '书签',
    continueReading: '继续阅读', readNow: '立即阅读', purchase: '购买', buyNow: '立即购买',
    getFree: '免费获取', booksOwned: '拥有的书籍', hoursRead: '阅读时长',
    trendingNow: '热门趋势', newReleases: '新发布',
    featuredPick: '精选推荐', popular: '热门', newest: '最新', readers: '读者',
    priceLowHigh: '价格: 低到高', priceHighLow: '价格: 高到低',
    reviews: '评价', noBooksFound: '未找到书籍', startReading: '开始阅读', continue: '继续',
    
    // Book Details
    by: '作者', author: '作者', chapters_count: '章节', rating: '评分',
    readMore: '阅读更多', readLess: '收起', bookDetails: '书籍详情',
    addToLibrary: '添加到图书馆',
    
    // Landing Page
    readDiscoverRepeat: '阅读。发现。重复。', genZReadingPlatform: 'Z世代数字阅读平台',
    startReadingFree: '免费开始阅读', browseCatalog: '浏览目录',
    thousandsOfBooks: '数千本书尽在指尖。', findYourNextStory: '找到你的下一个故事',
    joinThousands: '加入成千上万的读者，每天发现新故事。',
    freeToStart: '免费开始。', featuredReads: '精选读物', handpickedForYou: '为您精选',
    whatEveryoneReading: '大家都在读什么', freshFromPublishers: '来自出版商的新鲜内容',
    browseByCategory: '按分类浏览', findYourGenre: '找到你喜欢的类型',
    whyReadersLoveUs: '为什么读者喜欢我们', builtForNextGen: '为下一代打造',
    readAnywhere: '随时阅读', aiPowered: 'AI驱动', affordable: '价格实惠',
    instantAccess: '即时访问', trackProgress: '跟踪进度', customizable: '可定制',
    readyToStart: '准备好开始你的', readingJourney: '阅读之旅了吗?',
    seamlessExperience: '跨设备的无缝体验。', smartRecommendations: '智能推荐和章节组织。',
    thousandsFree: '数千本免费书籍和有竞争力的价格。', startInSeconds: '几秒钟内开始阅读。',
    beautifulStats: '美观的阅读统计和进度跟踪。', darkModeFonts: '深色模式、字体大小、主题 - 由你定制。',
    getStartedFree: '免费开始', copyright: '©', allRightsReserved: '版权所有。',
    
    // Navigation
    menu: '菜单', quickStats: '快速统计', signInButton: '登录', getStartedButton: '开始',
    features: '功能', categories: '分类',
  },
};

export type TranslationKeys = keyof TranslationSet;

export function getServerTranslations(lang: Language = 'en') {
  return (key: TranslationKeys): string => translations[lang][key] || translations.en[key] || key;
}
