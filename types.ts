
export interface Project {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  budget: string;
  skills: string[];
  postedAt: string;
  category: 'Development' | 'Design' | 'Marketing' | 'AI';
  status: 'active' | 'pending' | 'completed' | 'rejected';
  bids: Bid[];
}

export interface Bid {
  id: string;
  projectId: string;
  freelancerId: string;
  freelancerName: string;
  amount: string;
  coverLetter: string;
  days: number;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export type UserRole = 'freelancer' | 'employer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  token?: string;
  // Profile Fields
  bio?: string;
  location?: string;
  // Freelancer Specific
  skills?: string[];
  hourlyRate?: string;
  portfolio?: string[]; // URLs
  // Employer Specific
  companyName?: string;
  industry?: string;
  jobHistory?: string; // Description of company history or past jobs
  banned?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
  role: UserRole;
  lastMessage?: string;
  online: boolean;
  unreadCount: number;
}

export enum NavCategory {
  FIND_WORK = 'Find Work',
  HIRE_TALENT = 'Hire Talent',
  SOLUTIONS = 'Solutions',
  ENTERPRISE = 'Enterprise'
}

export type Language = 'en' | 'ru' | 'uz';

export interface TranslationDictionary {
  nav: {
    home: string;
    marketplace: string;
    profile: string;
    dashboard: string;
    findWork: string;
    hireTalent: string;
    solutions: string;
    enterprise: string;
    login: string;
    join: string;
    logout: string;
  };
  hero: {
    future: string;
    title: string;
    subtitle: string;
    cta1: string;
    cta2: string;
    scroll: string;
  };
  chat: {
    title: string;
    placeholder: string;
    send: string;
    noMessages: string;
    adminSupport: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    loginTab: string;
    registerTab: string;
    freelancerRole: string;
    employerRole: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submitLogin: string;
    submitRegister: string;
    secureGuard: string;
    errors: {
      invalidEmail: string;
      passwordLength: string;
      nameRequired: string;
      loginFailed: string;
      registerFailed: string;
    }
  };
  common: {
    back: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    loading: string;
    success: string;
    error: string;
    active: string;
    pending: string;
    rejected: string;
    search: string;
    filterBy: string;
    viewAll: string;
    noData: string;
  };
  marketplace: {
    title: string;
    subtitle: string;
    noMissions: string;
    clearFilters: string;
    aiDraft: string;
    aiProposal: string;
    copyApply: string;
    analyzing: string;
    posted: string;
    budget: string;
  };
  profile: {
    editProfile: string;
    success: string;
    jobs: string;
    rating: string;
    verifications: string;
    identity: string;
    payment: string;
    phone: string;
    email: string;
    portfolio: string;
    companyInfo: string;
    organization: string;
    industry: string;
    hq: string;
    visitWebsite: string;
    about: string;
    noBio: string;
    workHistory: string;
    companyHistory: string;
    basicInfo: string;
    fullName: string;
    location: string;
    bio: string;
    hourlyRate: string;
    skills: string;
    addSkill: string;
    portfolioLinks: string;
    companyName: string;
    jobHistory: string;
    professionalDetails: string;
  };
  dashboard: {
    welcome: string;
    subtitle: string;
    accountStatus: string;
    activeBids: string;
    profileViews: string;
    earnings: string;
    successRate: string;
    activeJobs: string;
    totalSpent: string;
    candidates: string;
    avgHourly: string;
    recommended: string;
    yourPostings: string;
    quickActions: string;
    messages: string;
    findWork: string;
    updatePortfolio: string;
    postJob: string;
    searchTalent: string;
    settings: string;
  };
  postProject: {
    title: string;
    subtitle: string;
    aiEnhanced: string;
    projectTitle: string;
    description: string;
    budget: string;
    skills: string;
    category: string;
    enhance: string;
    enhancing: string;
    publish: string;
    placeholderTitle: string;
    placeholderDesc: string;
    placeholderBudget: string;
    placeholderSkills: string;
  };
  admin: {
    title: string;
    subtitle: string;
    tabs: {
      analytics: string;
      projects: string;
      users: string;
      disputes: string;
    };
    revenue: string;
    totalUsers: string;
    projectsPosted: string;
    totalBids: string;
    userAcquisition: string;
    revenueTrend: string;
    userComposition: string;
    projectVelocity: string;
    pending: string;
    active: string;
    userList: {
      user: string;
      role: string;
      status: string;
      actions: string;
    }
  }
}

// Analytics Types
export type TimeRange = '7d' | '30d' | '90d' | '1y';

export interface AnalyticsSummary {
  totalUsers: number;
  totalProjects: number;
  totalBids: number;
  totalRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  projectGrowth: number;
}

export interface UserGrowthPoint {
  date: string;
  freelancers: number;
  employers: number;
}

export interface RevenuePoint {
  date: string;
  amount: number;
}

export interface ProjectStats {
  date: string;
  posted: number;
  completed: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  userGrowth: UserGrowthPoint[];
  revenue: RevenuePoint[];
  projectStats: ProjectStats[];
  roleDistribution: { name: string; value: number }[];
}
