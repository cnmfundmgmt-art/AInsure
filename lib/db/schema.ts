/**
 * CFP Malaysia — Database Schema (v0.2 spec)
 * Drizzle ORM with SQLite (local) / Turso (cloud) via @libsql/client
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── USERS & AUTH ─────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  role: text('role').notNull(),               // admin | advisor | user
  verificationStatus: text('verification_status').default('pending'),
  // ── Advisor-specific fields ──────────────────────────────────────────────
  approvedByAdmin: integer('approved_by_admin', { mode: 'boolean' }).default(false),
  approvedAt: integer('approved_at'),
  rejectionReason: text('rejection_reason'),
  companyName: text('company_name'),
  licenseNumber: text('license_number'),
  // ────────────────────────────────────────────────────────────────────────────
  createdAt: integer('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
});

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  referenceId: text('reference_id').notNull().unique(),   // e.g. CFP-2026-A1B2C3D4
  fullName: text('full_name').notNull(),
  dob: text('dob'),
  gender: text('gender'),
  age: integer('age'),
  icNumber: text('ic_number').unique(),
  nationality: text('nationality'),
  maritalStatus: text('marital_status'),
  dependents: integer('dependents'),
  employmentStatus: text('employment_status'),
  annualIncome: real('annual_income'),
  phoneNumber: text('phone_number'),
  occupation: text('occupation'),
  employer: text('employer'),
  createdAt: integer('created_at').notNull(),
});

// ─── ADVISOR CLIENTS (Separate from KYC clients) ─────────────────────────────

export const advisorClients = sqliteTable('advisor_clients', {
  id: text('id').primaryKey(),
  advisorId: text('advisor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientNumber: text('client_number').notNull().unique(),  // e.g. CFP-2026-A1B2
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  gender: text('gender'),                         // Male | Female
  email: text('email'),
  phone: text('phone'),
  dateOfBirth: text('date_of_birth'),
  nricPassport: text('nric_passport'),           // encrypted
  addressStreet: text('address_street'),
  addressCity: text('address_city'),
  addressPostcode: text('address_postcode'),
  addressState: text('address_state'),
  preferredLanguage: text('preferred_language').default('EN'),  // EN | MS | ZH
  notes: text('notes'),
  deletedAt: integer('deleted_at'),               // soft delete
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ─── ADVISOR CLIENT FINANCIAL DATA ─────────────────────────────────────────

export const advisorClientSnapshots = sqliteTable('advisor_client_snapshots', {
  id: text('id').primaryKey(),
  advisorClientId: text('advisor_client_id').notNull().references(() => advisorClients.id, { onDelete: 'cascade' }),
  monthlyIncome: real('monthly_income'),
  monthlyExpenses: real('monthly_expenses'),
  emergencyFund: real('emergency_fund'),
  snapshotDate: integer('snapshot_date').notNull(),
});

export const advisorClientAssets = sqliteTable('advisor_client_assets', {
  id: text('id').primaryKey(),
  advisorClientId: text('advisor_client_id').notNull().references(() => advisorClients.id, { onDelete: 'cascade' }),
  assetType: text('asset_type').notNull(),
  name: text('name').notNull(),
  value: real('value').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const advisorClientLiabilities = sqliteTable('advisor_client_liabilities', {
  id: text('id').primaryKey(),
  advisorClientId: text('advisor_client_id').notNull().references(() => advisorClients.id, { onDelete: 'cascade' }),
  liabilityType: text('liability_type').notNull(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  interestRate: real('interest_rate'),
  createdAt: integer('created_at').notNull(),
});

export const advisorClientGoals = sqliteTable('advisor_client_goals', {
  id: text('id').primaryKey(),
  advisorClientId: text('advisor_client_id').notNull().references(() => advisorClients.id, { onDelete: 'cascade' }),
  goalType: text('goal_type').notNull(),  // retirement | education | emergency | property | wealth_growth | other
  goalName: text('goal_name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').default(0),
  targetYear: integer('target_year'),
  priority: integer('priority').default(1),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ─── ID DOCUMENTS (KYC) ───────────────────────────────────────────────────────

export const idDocuments = sqliteTable('id_documents', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(),    // ic | passport | driver's_license
  documentNumber: text('document_number'),
  fullName: text('full_name'),
  dateOfBirth: text('date_of_birth'),
  nationality: text('nationality'),
  address: text('address'),
  issueDate: text('issue_date'),
  expiryDate: text('expiry_date'),
  filePath: text('file_path'),
  ocrRawText: text('ocr_raw_text'),
  ocrConfidence: real('ocr_confidence'),
  verificationStatus: text('verification_status'),  // pending | verified | rejected
  verifiedBy: text('verified_by'),
  verifiedAt: integer('verified_at'),
  createdAt: integer('created_at').notNull(),
});

// ─── FACE VERIFICATION ───────────────────────────────────────────────────────

export const faceVerifications = sqliteTable('face_verifications', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  selfiePath: text('selfie_path').notNull(),
  matchScore: real('match_score'),
  verificationStatus: text('verification_status'),  // pending | verified | failed
  createdAt: integer('created_at').notNull(),
});

// ─── FINANCIAL DATA ──────────────────────────────────────────────────────────

export const financialSnapshots = sqliteTable('financial_snapshots', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  monthlyIncome: real('monthly_income'),
  monthlyExpenses: real('monthly_expenses'),
  emergencyFund: real('emergency_fund'),
  snapshotDate: integer('snapshot_date').notNull(),
});

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  assetType: text('asset_type').notNull(),   // cash | property | equity | fixed_income | crypto | retirement | others
  name: text('name').notNull(),
  value: real('value').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const liabilities = sqliteTable('liabilities', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  liabilityType: text('liability_type').notNull(), // mortgage | car | personal | credit_card | education | others
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  interestRate: real('interest_rate'),
  createdAt: integer('created_at').notNull(),
});

// ─── GOALS ───────────────────────────────────────────────────────────────────

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  goalType: text('goal_type').notNull(),     // retirement | education | property | emergency | wealth_growth
  targetAmount: real('target_amount').notNull(),
  targetYear: integer('target_year'),
  priority: integer('priority'),
  createdAt: integer('created_at').notNull(),
});

// ─── RISK PROFILING ──────────────────────────────────────────────────────────

export const riskQuestions = sqliteTable('risk_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionText: text('question_text').notNull(),
  category: text('category').notNull(),
});

export const riskOptions = sqliteTable('risk_options', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id').notNull().references(() => riskQuestions.id, { onDelete: 'cascade' }),
  optionText: text('option_text').notNull(),
  score: integer('score').notNull(),
});

export const riskResults = sqliteTable('risk_results', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  totalScore: integer('total_score').notNull(),
  riskLevel: text('risk_level').notNull(),   // conservative | moderate | aggressive
  completedAt: integer('completed_at').notNull(),
});

// ─── ANALYSIS ────────────────────────────────────────────────────────────────

export const analysis = sqliteTable('analysis', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  netWorth: real('net_worth'),
  monthlySurplus: real('monthly_surplus'),
  emergencyFundMonths: real('emergency_fund_months'),
  insuranceGap: real('insurance_gap'),
  retirementAdequacy: real('retirement_adequacy'),
  healthScore: integer('health_score'),
  createdAt: integer('created_at').notNull(),
});

// ─── RECOMMENDATIONS ─────────────────────────────────────────────────────────

export const portfolioModels = sqliteTable('portfolio_models', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  riskLevel: text('risk_level').notNull().unique(),  // conservative | moderate | aggressive
  equityPct: real('equity_pct').notNull(),
  bondPct: real('bond_pct').notNull(),
  cashPct: real('cash_pct').notNull(),
});

export const recommendations = sqliteTable('recommendations', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  analysisId: text('analysis_id').references(() => analysis.id, { onDelete: 'set null' }),
  portfolioModelId: integer('portfolio_model_id').references(() => portfolioModels.id),
  aiExplanation: text('ai_explanation').notNull(),
  status: text('status').default('pending'),  // pending | accepted | rejected | implemented
  createdAt: integer('created_at').notNull(),
});

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export const investmentProducts = sqliteTable('investment_products', {
  id: text('id').primaryKey(),
  productCode: text('product_code').notNull().unique(),
  productName: text('product_name').notNull(),
  provider: text('provider'),
  category: text('category'),                 // unit_trust | etf | robo_advisor | structured
  riskRating: text('risk_rating'),           // 1-5 or S/M/A/C
  fundSize: real('fund_size'),
  managementFee: real('management_fee'),
  salesCharge: real('sales_charge'),
  navPerUnit: real('nav_per_unit'),
  oneYearReturn: real('one_year_return'),
  isShariahCompliant: integer('is_shariah_compliant', { mode: 'boolean' }).default(false),
  lastUpdated: integer('last_updated'),
});

export const insuranceProducts = sqliteTable('insurance_products', {
  id: text('id').primaryKey(),
  productCode: text('product_code').notNull().unique(),
  productName: text('product_name').notNull(),
  provider: text('provider'),
  policyType: text('policy_type'),
  monthlyPremiumMin: real('monthly_premium_min'),
  coverageAmountMax: real('coverage_amount_max'),
  isTakaful: integer('is_takaful', { mode: 'boolean' }).default(false),
  lastUpdated: integer('last_updated'),
  minEntryAge: integer('min_entry_age').default(0),
  maxEntryAge: integer('max_entry_age').default(65),
  coverageFeatures: text('coverage_features'),
  guaranteedCash10y: real('guaranteed_cash_10y').default(0),
  guaranteedCash20y: real('guaranteed_cash_20y').default(0),
  guaranteedCash30y: real('guaranteed_cash_30y').default(0),
  projectedCash10y: real('projected_cash_10y').default(0),
  projectedCash20y: real('projected_cash_20y').default(0),
  projectedCash30y: real('projected_cash_30y').default(0),
  lifeCover10y: real('life_cover_10y').default(0),
  lifeCover20y: real('life_cover_20y').default(0),
  lifeCover30y: real('life_cover_30y').default(0),
  ciCover: real('ci_cover').default(0),
  medicalCover: real('medical_cover').default(0),
  annualPremium: real('annual_premium').default(0),
  paymentTermYears: integer('payment_term_years').default(0),
  productSummary: text('product_summary'),
});

// ─── INSURANCE ANALYSIS SESSIONS ─────────────────────────────────────────────

export const insuranceAnalysisSessions = sqliteTable('insurance_analysis_sessions', {
  id: text('id').primaryKey(),
  advisorId: text('advisor_id').notNull(),
  clientName: text('client_name'),
  clientIC: text('client_ic'),
  annualIncome: real('annual_income'),
  monthlyBudget: real('monthly_budget'),
  analysisData: text('analysis_data'),
  createdAt: integer('created_at').notNull(),
});

// ─── CHAT MESSAGES ─────────────────────────────────────────────────────────

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull(),
});

// ─── CLIENT POLICIES ─────────────────────────────────────────────────────────

export const clientPolicies = sqliteTable('client_policies', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  provider: text('provider'),
  policyName: text('policy_name'),
  policyType: text('policy_type'),
  annualPremium: real('annual_premium'),
  sumAssured: real('sum_assured'),
  ciCover: real('ci_cover'),
  medicalCover: real('medical_cover'),
  lifeCover: real('life_cover'),
  policyStartDate: text('policy_start_date'),
  status: text('status').default('active'),
  createdAt: integer('created_at').notNull(),
});

// ─── COMPARISONS ─────────────────────────────────────────────────────────────

export const productComparisons = sqliteTable('product_comparisons', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  comparisonType: text('comparison_type').notNull(), // investment | insurance
  createdAt: integer('created_at').notNull(),
});

export const comparisonItems = sqliteTable('comparison_items', {
  id: text('id').primaryKey(),
  comparisonId: text('comparison_id').notNull().references(() => productComparisons.id, { onDelete: 'cascade' }),
  productType: text('product_type').notNull(), // investment | insurance
  productId: text('product_id').notNull(),
  addedAt: integer('added_at').notNull(),
});

// ─── OCR & DOCUMENTS ────────────────────────────────────────────────────────

export const clientDocuments = sqliteTable('client_documents', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  processed: integer('processed', { mode: 'boolean' }).default(false),
  uploadDate: integer('upload_date').notNull(),
});

export const ocrExtractions = sqliteTable('ocr_extractions', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => clientDocuments.id, { onDelete: 'cascade' }),
  extractedText: text('extracted_text'),
  structuredData: text('structured_data'),   // JSON string
  confidenceScore: real('confidence_score'),
  createdAt: integer('created_at').notNull(),
});

export const parsedTransactions = sqliteTable('parsed_transactions', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  transactionDate: text('transaction_date').notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  transactionType: text('transaction_type'), // income | expense
  category: text('category'),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
});

export const parsedHoldings = sqliteTable('parsed_holdings', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  provider: text('provider'),
  productName: text('product_name').notNull(),
  quantity: real('quantity'),
  currentValue: real('current_value'),
});

// ─── AUDIT & CATEGORIES ───────────────────────────────────────────────────────

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
  action: text('action').notNull(),           // create | read | update | delete
  resource: text('resource').notNull(),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at').notNull(),
});

export const categoryRules = sqliteTable('category_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  keyword: text('keyword').notNull(),
  category: text('category').notNull(),
  isRegex: integer('is_regex', { mode: 'boolean' }).default(false),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type AdvisorClient = typeof advisorClients.$inferSelect;
export type AdvisorClientSnapshot = typeof advisorClientSnapshots.$inferSelect;
export type AdvisorClientAsset = typeof advisorClientAssets.$inferSelect;
export type AdvisorClientLiability = typeof advisorClientLiabilities.$inferSelect;
export type AdvisorClientGoal = typeof advisorClientGoals.$inferSelect;
export type InsuranceAnalysisSession = typeof insuranceAnalysisSessions.$inferSelect;
export type ClientPolicy = typeof clientPolicies.$inferSelect;
export type IdDocument = typeof idDocuments.$inferSelect;
export type FaceVerification = typeof faceVerifications.$inferSelect;
export type FinancialSnapshot = typeof financialSnapshots.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Liability = typeof liabilities.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type RiskQuestion = typeof riskQuestions.$inferSelect;
export type RiskOption = typeof riskOptions.$inferSelect;
export type RiskResult = typeof riskResults.$inferSelect;
export type Analysis = typeof analysis.$inferSelect;
export type PortfolioModel = typeof portfolioModels.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type InvestmentProduct = typeof investmentProducts.$inferSelect;
export type InsuranceProduct = typeof insuranceProducts.$inferSelect;
export type ProductComparison = typeof productComparisons.$inferSelect;
export type ComparisonItem = typeof comparisonItems.$inferSelect;
export type ClientDocument = typeof clientDocuments.$inferSelect;
export type OcrExtraction = typeof ocrExtractions.$inferSelect;
export type ParsedTransaction = typeof parsedTransactions.$inferSelect;
export type ParsedHolding = typeof parsedHoldings.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type CategoryRule = typeof categoryRules.$inferSelect;
