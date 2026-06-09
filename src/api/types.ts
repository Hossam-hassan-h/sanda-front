export type UserRole = "worker" | "employer" | "admin";

// ============================================================================
// SUMMARY TYPES (for embedded objects in API responses)
// ============================================================================

export interface UserSummary {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  ratingsCount?: number;
  city?: string;
  skills?: string[];
}

export interface JobSummary {
  id: string;
  title: string;
  city: string;
  price: number;
}

// ============================================================================
// CORE ENTITY INTERFACES
// ============================================================================

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string; // Only for registration, never returned from API
  role: UserRole;
  avatar?: string;        // maps to ERD profile_image
  walletBalance: number;  // maps to ERD Wallets.balance (denormalized)
  isVerified: boolean;
  isActive?: boolean;     // maps to ERD is_active
  rating?: number;
  ratingsCount?: number;
  skills?: string[];
  bio?: string;
  city?: string;
  createdAt: string;
  updatedAt?: string;
}

export type JobStatus = "open" | "in-progress" | "completed" | "cancelled";

export type LocationMethod = "manual" | "map" | "gps";

export interface Location {
  address: string;
  latitude?: number;
  longitude?: number;
  method: LocationMethod;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;       // Not in ERD but needed in frontend
  city: string;            // Not in ERD but needed in frontend (from location)
  address: string;        // maps to ERD location
  latitude?: number;       // Geographic coordinate
  longitude?: number;      // Geographic coordinate
  method?: LocationMethod;
  price: number;           // maps to ERD salary
  hours: number;           // maps to ERD duration
  startDate: string;       // maps to ERD start_date
  endDate?: string;        // maps to ERD end_date
  requiredWorkers?: number; // maps to ERD required_workers
  status: JobStatus;
  employerId: string;      // maps to ERD user_id
  employer: UserSummary;
  workerId?: string;
  worker?: UserSummary;
  applicantsCount: number;
  qrCode?: string;         // maps to ERD qr_code
  createdAt: string;
  updatedAt?: string;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface Application {
  id: string;
  jobId: string;
  job?: JobSummary;
  workerId?: string;
  worker: UserSummary;
  message: string;         // Not in ERD but needed
  status: ApplicationStatus;
  createdAt: string;       // maps to ERD applied_at
  updatedAt?: string;
}

// ============================================================================
// QR CHECK-IN / JOB ASSIGNMENTS (NEW - was missing from frontend)
// ============================================================================

export interface JobAssignment {
  id: string;
  jobId: string;
  job?: JobSummary;
  workerId: string;
  worker?: UserSummary;
  checkInTime?: string;    // maps to ERD check_in_time
  checkOutTime?: string;   // maps to ERD check_out_time
  status: "checked-in" | "checked-out" | "no-show";
  createdAt: string;
}

// ============================================================================
// WALLET & PAYMENT INTERFACES
// ============================================================================

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  updatedAt: string;
}

export type TransactionType = "hold" | "release" | "withdraw" | "deposit" | "refund";
export type PaymentStatus = "pending" | "completed" | "failed";

export interface WalletTransaction {
  id: string;
  walletId?: string;      // maps to ERD wallet_id
  jobId?: string;
  jobTitle?: string;       // Denormalized for display
  amount: number;
  transactionType: TransactionType;
  paymentStatus: PaymentStatus;
  createdAt?: string;
}

// ============================================================================
// CHAT INTERFACES
// ============================================================================

export interface Conversation {
  id: string;
  jobId: string;
  jobTitle: string;        // Denormalized
  participant: UserSummary; // Denormalized
  lastMessage: string;     // Denormalized
  lastMessageAt: string;   // Denormalized
  unread: number;          // Denormalized
  createdAt?: string;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  conversationId: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: UserSummary;    // Denormalized
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================================================
// RATING & REVIEW INTERFACES
// ============================================================================

export interface Rating {
  id: string;
  rating: number;
  comment: string;
  reviewerId: string;      // maps to ERD reviewer_id (WAS MISSING!)
  reviewer: UserSummary;
  reviewedUserId: string;  // maps to ERD reviewed_user_id (WAS MISSING!)
  reviewedUser?: UserSummary;
  createdAt: string;
}

// ============================================================================
// REPORT INTERFACES
// ============================================================================

export interface Report {
  id: string;
  reportedUserId: string;
  reportedUser: UserSummary;
  reportedById: string;
  reportedBy: UserSummary;
  reason: string;
  status: "open" | "reviewed" | "closed";
  createdAt: string;
  jobId?: string;
  job?: JobSummary;
}

// ============================================================================
// NOTIFICATION INTERFACES (NEW - was completely missing from frontend)
// ============================================================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "job" | "user" | "report" | "system";
  roleTarget: "admin" | "user" | "worker" | "all";
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}

// ============================================================================
// USER LOG INTERFACES (NEW - was completely missing from frontend)
// ============================================================================

export interface UserLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

// ============================================================================
// ADMIN INTERFACES
// ============================================================================

export interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  activeJobs: number;
  heldAmount: number;
  openReports: number;
  jobsToday: number;
  revenueByMonth: { month: string; amount: number }[];
  jobsByCategory: { category: string; count: number }[];
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface ApiSuccessResponse {
  ok: true;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface WalletBalanceResponse {
  available: number;
  held: number;
}

// ============================================================================
// FILTER & PAYLOAD INTERFACES
// ============================================================================

export interface JobFilters {
  q?: string;
  city?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: JobStatus;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  category: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  method?: LocationMethod;
  price: number;
  hours: number;
  startDate: string;
  endDate?: string;
  requiredWorkers?: number;
}

export interface ApplyJobPayload {
  message: string;
}

export interface CreateRatingPayload {
  rating: number;
  comment: string;
  reviewedUserId: string;
  jobId?: string;
}

export interface CreateReportPayload {
  reportedUserId: string;
  reason: string;
  jobId?: string;
}

export interface SendMessagePayload {
  message: string;
}

export interface WithdrawPayload {
  amount: number;
}

export interface CheckInPayload {
  jobId: string;
  qrCode: string;
}
