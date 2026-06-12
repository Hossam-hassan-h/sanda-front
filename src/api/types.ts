export type UserRole = "worker" | "employer" | "admin";

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface VerificationDocument {
  id: string;
  type: "national_id_front" | "national_id_back" | "personal_photo";
  name: string;
  /** Data URL (base64) or external URL */
  url: string;
  size: number;
  uploadedAt: string;
}

export interface VerificationRequest {
  status: VerificationStatus;
  documents: VerificationDocument[];
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// ============================================================================
// SUMMARY TYPES (for embedded objects in API responses)
// ============================================================================

export interface UserSummary {
  id: string;
  _id?: string;
  name: string;
  avatar?: string;
  profileImage?: { url?: string | null; publicId?: string | null };
  profile_image?: { url?: string | null; publicId?: string | null };
  rating?: number;
  ratingsCount?: number;
  city?: string;
  skills?: string[];
}

export interface JobSummary {
  id: string;
  _id?: string;
  title: string;
  city: string;
  price: number;
  category?: string;
  location?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  salary?: number;
}

// ============================================================================
// CORE ENTITY INTERFACES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
  /** Verification request submitted by the user (documents + review state) */
  verificationRequest?: VerificationRequest;
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
  _id?: string;
  jobId: string;
  job?: JobSummary;
  workerId: string;
  worker?: UserSummary;
  employer?: UserSummary;
  checkInTime?: string;    // maps to ERD check_in_time
  checkOutTime?: string;   // maps to ERD check_out_time
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  completedAt?: string | null;
  status: "assigned" | "in_progress" | "completed" | "cancelled" | "checked-in" | "checked-out" | "no-show";
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
  _id?: string;
  job: JobSummary;
  assignment: JobAssignment;
  employer: UserSummary;
  worker: UserSummary;
  lastMessage?: string;
  last_message?: string;
  lastMessageAt?: string | null;
  last_message_at?: string | null;
  unreadCount?: number;
  unread_count?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  _id?: string;
  conversation: string;
  sender: UserSummary | string;
  recipient: string;
  content: string;
  type: "text";
  readAt?: string | null;
  read_at?: string | null;
  createdAt: string;
  updatedAt: string;
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
  _id?: string;
  title: string;
  message: string;
  type: "job" | "user" | "report" | "system" | "message_received" | string;
  entityType?: "application" | "job_assignment" | "rating" | "message" | string;
  entity_type?: "application" | "job_assignment" | "rating" | "message" | string;
  entityId?: string;
  entity_id?: string;
  conversation?: string | { id?: string; _id?: string } | null;
  job?: JobSummary | string | null;
  actor?: UserSummary | string | null;
  roleTarget: "admin" | "user" | "worker" | "all";
  isRead: boolean;
  is_read?: boolean;
  readAt?: string | null;
  read_at?: string | null;
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
  newUsersToday: number;
  applicationsToday: number;
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
  content: string;
}

export interface WithdrawPayload {
  amount: number;
}

export interface CheckInPayload {
  jobId: string;
  qrCode: string;
}
