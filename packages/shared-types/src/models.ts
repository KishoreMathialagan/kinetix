import type {
  AppointmentStatus,
  AssessmentType,
  BloodGroup,
  ConsentStatus,
  DevicePlatform,
  DocumentType,
  Gender,
  InvoiceStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  SessionStatus,
  StrengthScale,
  TherapistStatus,
  TreatmentStatus,
} from './enums';
import type { User } from './auth';

export interface TherapistProfile {
  user: User;
  profile: Therapist;
}

export interface PatientProfile {
  user: User;
  profile: Patient;
}

export interface Patient {
  id: string;
  user_id: string;
  patient_code: string;
  dob: string | null;
  gender: Gender | null;
  blood_group: BloodGroup | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  medical_history: string | null;
  allergies: string | null;
  medications: string | null;
  diagnosis: string | null;
  referred_by: string | null;
  occupation: string | null;
  created_at: string;
  updated_at: string;
  user?: UserLite;
}

export interface UserLite {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url?: string | null;
}

export interface PatientRegistrationRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  dob: string;
  gender: Gender;
  blood_group?: BloodGroup | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  medical_history?: string | null;
  allergies?: string | null;
  medications?: string | null;
}

export interface PatientUpdateRequest {
  dob?: string | null;
  gender?: Gender | null;
  blood_group?: BloodGroup | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  medical_history?: string | null;
  allergies?: string | null;
  medications?: string | null;
  diagnosis?: string | null;
  referred_by?: string | null;
  occupation?: string | null;
}

export interface PatientSearchRequest {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  gender?: Gender | null;
}

export interface Therapist {
  id: string;
  user_id: string;
  license_number: string;
  registration_number: string;
  department: string | null;
  qualification: string | null;
  specialization: string | null;
  languages: string | null;
  years_experience: number | null;
  gender: Gender | null;
  dob: string | null;
  address: string | null;
  emergency_contact: string | null;
  joining_date: string | null;
  status: TherapistStatus;
  capacity: number;
}

export interface TherapistCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  license_number: string;
  registration_number: string;
  department?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  languages?: string | null;
  years_experience?: number | null;
  gender?: Gender | null;
  dob?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  joining_date?: string | null;
  capacity?: number | null;
}

export interface TherapistUpdate {
  department?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  languages?: string | null;
  years_experience?: number | null;
  address?: string | null;
  emergency_contact?: string | null;
  status?: TherapistStatus | null;
  capacity?: number | null;
}

export interface TherapistSummary {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string | null;
  department: string | null;
  status: TherapistStatus;
  active_patients: number;
  max_capacity: number;
  availability_score: number;
}

export interface TherapistListResponse {
  items: TherapistSummary[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TherapistAvailability {
  id: string;
  therapist_id: string;
  weekday: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason: string | null;
}

export interface AvailabilityCreate {
  weekday?: number | null;
  specific_date?: string | null;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  reason?: string | null;
}

export interface TherapistLeave {
  id: string;
  therapist_id: string;
  leave_type: string;
  reason: string | null;
  start_date: string;
  end_date: string;
  status: string;
  admin_notes: string | null;
}

export interface LeaveRequest {
  leave_type: string;
  reason?: string | null;
  start_date: string;
  end_date: string;
}

export interface TherapistCapacity {
  therapist_id: string;
  max_capacity: number;
  active_patients: number;
  remaining_capacity: number;
  upcoming_appointments_count: number;
  availability_score: number;
}

export interface TherapistDashboard {
  therapist_id: string;
  todays_appointments_count: number;
  active_patients_count: number;
  availability_status: string;
  profile_completion_percentage: number;
}

export interface Appointment {
  id: string;
  patient_id: string;
  therapist_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  appointment_type: string | null;
  status: AppointmentStatus;
  address: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_by: string | null;
}

export interface AppointmentCreate {
  patient_id: string;
  therapist_id: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  appointment_type?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface AppointmentUpdate {
  status?: AppointmentStatus | null;
  notes?: string | null;
}

export interface RescheduleRequest {
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  reason?: string | null;
}

export interface CancelRequest {
  reason: string;
}

export interface AppointmentSearchRequest {
  patient_id?: string | null;
  therapist_id?: string | null;
  status?: AppointmentStatus | null;
  start_date?: string | null;
  end_date?: string | null;
  page?: number;
  size?: number;
}

export interface AppointmentSummary {
  id: string;
  patient_id: string;
  therapist_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  appointment_type: string | null;
  status: AppointmentStatus;
}

export interface TherapistAssignment {
  patient_id: string;
  therapist_id: string;
  is_primary: boolean;
  reason: string | null;
  assigned_by: string | null;
  created_at: string;
}

export interface AssignTherapistRequest {
  therapist_id: string;
  is_primary?: boolean;
  reason?: string | null;
}

export interface AssignmentRecommendation {
  therapist_id: string;
  first_name: string;
  last_name: string;
  specialization: string | null;
  score: number;
  reasons: string[];
}

export interface CalendarDay {
  date: string;
  total_appointments: number;
  appointments: AppointmentSummary[];
}

export interface CalendarResponse {
  start_date: string;
  end_date: string;
  total_appointments: number;
  days: CalendarDay[];
}

export interface Assessment {
  id: string;
  patient_id: string;
  therapist_id: string;
  appointment_id: string;
  assessment_type: AssessmentType;
  pain_score: number | null;
  diagnosis: string | null;
  findings: string | null;
  goals: string | null;
  recommendations: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentCreate {
  patient_id: string;
  therapist_id: string;
  appointment_id: string;
  assessment_type?: AssessmentType;
  pain_score?: number | null;
  diagnosis?: string | null;
  findings?: string | null;
  goals?: string | null;
  recommendations?: string | null;
}

export interface AssessmentUpdate {
  assessment_type?: AssessmentType | null;
  pain_score?: number | null;
  diagnosis?: string | null;
  findings?: string | null;
  goals?: string | null;
  recommendations?: string | null;
}

export interface TreatmentSession {
  id: string;
  patient_id: string;
  therapist_id: string;
  appointment_id: string;
  assessment_id: string | null;
  session_number: number | null;
  pain_before: number | null;
  pain_after: number | null;
  treatment_notes: string | null;
  exercises: string | null;
  modalities: string | null;
  response: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface TreatmentSessionCreate {
  appointment_id: string;
  assessment_id?: string | null;
}

export interface TreatmentSessionUpdate {
  pain_before?: number | null;
  pain_after?: number | null;
  treatment_notes?: string | null;
  exercises?: string | null;
  modalities?: string | null;
  response?: string | null;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  therapist_id: string;
  assessment_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlanCreate {
  assessment_id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  status?: string;
}

export interface TreatmentPlanUpdate {
  title?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
}

export interface ProgressMeasurement {
  id: string;
  patient_id: string;
  therapist_id: string | null;
  treatment_session_id: string | null;
  assessment_type: AssessmentType | null;
  measured_at: string;
  pain_score: number | null;
  rom_degrees: number | null;
  strength_scale: StrengthScale | null;
  notes: string | null;
  created_at: string;
}

export interface ProgressMeasurementCreate {
  patient_id: string;
  therapist_id?: string | null;
  treatment_session_id?: string | null;
  assessment_type?: AssessmentType | null;
  measured_at?: string | null;
  pain_score?: number | null;
  rom_degrees?: number | null;
  strength_scale?: StrengthScale | null;
  notes?: string | null;
}

export interface ProgressMeasurementUpdate {
  pain_score?: number | null;
  rom_degrees?: number | null;
  strength_scale?: StrengthScale | null;
  notes?: string | null;
}

export interface TrendPoint {
  date: string;
  value: number | null;
}

export interface ProgressOverview {
  patient_id: string;
  pain_trend: TrendPoint[];
  rom_trend: TrendPoint[];
  strength_trend: TrendPoint[];
  goals: string | null;
  session_timeline: TreatmentSession[];
}

export interface ExerciseItem {
  id: string;
  exercise_program_id: string;
  exercise_name: string;
  category: string | null;
  repetitions: number | null;
  sets: number | null;
  duration: string | null;
  image_url: string | null;
  video_url: string | null;
}

export interface ExerciseItemCreate {
  exercise_name: string;
  category?: string | null;
  repetitions?: number | null;
  sets?: number | null;
  duration?: string | null;
  image_url?: string | null;
  video_url?: string | null;
}

export interface ExerciseProgram {
  id: string;
  patient_id: string;
  therapist_id: string;
  title: string;
  instructions: string | null;
  frequency: string | null;
  duration: string | null;
  exercise_items: ExerciseItem[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseProgramCreate {
  patient_id: string;
  therapist_id?: string | null;
  title: string;
  instructions?: string | null;
  frequency?: string | null;
  duration?: string | null;
  items?: ExerciseItemCreate[];
}

export interface ExerciseProgramUpdate {
  title?: string | null;
  instructions?: string | null;
  frequency?: string | null;
  duration?: string | null;
}

export interface CheckIn {
  id: string;
  patient_id: string;
  exercise_program_id: string;
  exercise_item_id: string | null;
  completed_at: string;
  notes: string | null;
}

export interface CheckInCreate {
  exercise_item_id?: string | null;
  notes?: string | null;
}

export interface ExerciseCompliance {
  exercise_program_id: string;
  patient_id: string;
  title: string;
  expected_count: number;
  completed_count: number;
  score: number;
  completions: CheckIn[];
}

export interface PatientDocument {
  id: string;
  patient_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_no: number;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  note: string | null;
  created_at: string;
}

export interface ConsentForm {
  id: string;
  patient_id: string;
  template_name: string;
  signed_by: string | null;
  signed_at: string | null;
  signature_url: string | null;
  pdf_url: string | null;
  created_at: string;
}

export interface ConsentSignature {
  id: string;
  consent_form_id: string;
  signer_name: string;
  signer_role: string;
  signature_url: string;
  signed_at: string | null;
}

export interface ConsentSignRequest {
  consent_form_id: string;
  signer_name: string;
  signer_role: string;
  signature_url: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: NotificationType;
  read_at: string | null;
  created_at: string;
}

export interface NotificationCreateRequest {
  user_id: string;
  title: string;
  body: string;
  notification_type?: NotificationType;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  platform: DevicePlatform;
  token: string;
  is_active: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  patient_id: string;
  therapist_id: string;
  rating: number;
  communication: number | null;
  professionalism: number | null;
  treatment_quality: number | null;
  comments: string | null;
  created_at: string;
}

export interface FeedbackCreate {
  patient_id: string;
  therapist_id: string;
  rating: number;
  communication?: number | null;
  professionalism?: number | null;
  treatment_quality?: number | null;
  comments?: string | null;
}

export interface Report {
  id: string;
  patient_id: string;
  therapist_id: string | null;
  report_type: string;
  report_url: string;
  generated_at: string;
}

export interface ReportGenerateRequest {
  report_type: string;
  patient_id?: string | null;
  therapist_id?: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface InvoiceItemCreate {
  description: string;
  quantity?: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  patient_id: string;
  therapist_id: string | null;
  appointment_id: string | null;
  package_id: string | null;
  invoice_number: string;
  package: string | null;
  subtotal: number;
  gst_rate: number;
  tax: number;
  total: number;
  due_date: string | null;
  issued_at: string | null;
  status: InvoiceStatus;
  notes: string | null;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreate {
  patient_id: string;
  therapist_id?: string | null;
  appointment_id?: string | null;
  package_id?: string | null;
  items?: InvoiceItemCreate[];
  gst_rate?: number;
  due_date?: string | null;
  notes?: string | null;
  status?: InvoiceStatus;
}

export interface InvoiceUpdate {
  due_date?: string | null;
  notes?: string | null;
  status?: InvoiceStatus | null;
}

export interface Payment {
  id: string;
  billing_id: string;
  payment_method: PaymentMethod;
  transaction_reference: string | null;
  amount: number;
  paid_at: string | null;
  status: PaymentStatus;
  created_at: string;
}

export interface PaymentCreate {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string | null;
  paid_at?: string | null;
}

export interface Receipt {
  invoice: Invoice;
  payments: Payment[];
  paid_total: number;
  balance_due: number;
}

export interface TreatmentPackage {
  id: string;
  name: string;
  description: string | null;
  sessions_count: number;
  price: number;
  gst_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface TreatmentPackageCreate {
  name: string;
  description?: string | null;
  sessions_count?: number;
  price: number;
  gst_rate?: number;
  is_active?: boolean;
}

export interface TreatmentPackageUpdate {
  name?: string | null;
  description?: string | null;
  sessions_count?: number | null;
  price?: number | null;
  gst_rate?: number | null;
  is_active?: boolean | null;
}

export interface RevenueSummary {
  total_billed: number;
  total_collected: number;
  outstanding: number;
  total_invoices: number;
  avg_invoice_value: number | null;
}

export interface AdminDashboardStats {
  total_patients: number;
  total_therapists: number;
  total_appointments: number;
  upcoming_appointments: number;
  completed_sessions: number;
  overall_avg_feedback_rating: number | null;
  revenue: RevenueSummary;
}

export interface TherapistProductivity {
  therapist_id: string;
  name: string | null;
  completed_sessions: number;
  active_patients: number;
}

export interface AdminAnalytics {
  range_days: number;
  revenue: {
    billed: number;
    collected: number;
    outstanding: number;
    invoice_count: number;
    avg_invoice_value: number | null;
  };
  therapist_productivity: TherapistProductivity[];
}

export interface TherapistDashboardStats {
  therapist_id: string;
  total_appointments: number;
  upcoming_appointments: number;
  total_sessions: number;
  active_exercise_programs: number;
  avg_feedback_rating: number | null;
}

export interface AssignedTherapist {
  therapist_id: string;
  name: string | null;
  specialization: string | null;
}

export interface PatientDashboardStats {
  patient_id: string;
  total_appointments: number;
  upcoming_appointments: number;
  total_sessions: number;
  exercise_programs: number;
  unread_notifications: number;
  assigned_therapist: AssignedTherapist | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ClinicSettings {
  [key: string]: unknown;
}
