/**
 * GIEZRA ERP - Smart Poultry Business Management System
 * Core Types & Data Definitions
 */

export type UserRole = 
  | 'CEO' 
  | 'ASSISTANT_CEO' 
  | 'OPERATIONS_MANAGER' 
  | 'SALES_MANAGER' 
  | 'STOCK_MANAGER'
  | 'SYSTEM_ADMINISTRATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isLocked?: boolean;
  createdAt: string;
  lastLogin?: string;
  officePosition?: string;
  employeeId?: string;
  department?: string;
  officeAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredLanguage?: string;
  timeZone?: string;
  lastLoginDevice?: string;
  lastLoginLocation?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export interface PermissionDefinition {
  module: string;
  action: string;
  description: string;
  allowedRoles: UserRole[];
}

export type CustomerBusinessType = 
  | 'Hotel' 
  | 'Restaurant' 
  | 'Supermarket' 
  | 'Butchery' 
  | 'Wholesaler' 
  | 'Retail' 
  | 'Institution';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  region: string;
  district: string;
  tin: string;
  vrn: string;
  businessType: CustomerBusinessType;
  contactPerson: string;
  creditLimit: number; // in TZS
  paymentTerms: string; // e.g. "Net 15", "Cash on Delivery"
  outstandingBalance: number; // in TZS
  notes?: string;
  createdAt: string;
}

export type OrderStatus = 'Pending' | 'Approved' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unit: string; // e.g. "Kg", "Pcs", "Pack"
  quantity: number;
  unitPrice: number; // in TZS
  discount: number; // percentage or fixed amount
  vatRate: number; // percentage, e.g., 18% in Tanzania
  totalAmount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  totalDiscount: number;
  totalVat: number;
  grandTotal: number;
  amountPaid: number;
  remainingBalance: number;
  deliveryDate: string;
  salesOfficerId: string;
  salesOfficerName: string;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

export type ProductGroup = 
  | 'Whole Chicken'
  | 'Chicken Cuts'
  | 'Offals'
  | 'Packaging'
  | 'By-Products';

export interface Product {
  id: string;
  name: string;
  code: string;
  group: ProductGroup;
  category?: string;
  unit: string; // e.g., 'Kg', 'Piece', 'Carton', 'Packet'
  unitPrice: number; // Selling price per unit in TZS
  costPrice: number; // Cost price per unit in TZS
  currentStock: number;
  lowStockThreshold: number; // acts as minStockLevel
  minStockLevel?: number;
  maxStockLevel?: number;
  status?: 'Available' | 'Low Stock' | 'Out of Stock';
  reservedStock?: number;
  availableStock?: number;
  damagedStock?: number;
  expiredStock?: number;
  frozenStock?: number;
  warehouseLocation?: string; // e.g. "Cold Room 1 (-18°C Blast Freezer)"
  description?: string;
  active: boolean;
  lastUpdated?: string;
}

export type StockMovementType = 
  | 'Stock In'
  | 'Stock Out'
  | 'Production'
  | 'Sales'
  | 'Adjustments'
  | 'Returns'
  | 'Waste'
  | 'Transfers';

export interface StockMovement {
  id: string;
  date: string;
  time: string;
  productId: string;
  productName: string;
  productCode: string;
  type: StockMovementType;
  quantity: number;
  previousBalance: number;
  currentBalance: number;
  performedBy: string;
  reason: string;
  referenceNumber: string;
}

export interface LiveBirdPurchase {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  farmerName: string;
  phone: string;
  location: string;
  collectionDate: string;
  ageDays: number;
  numberOfBirds: number;
  averageLiveWeight: number; // kg
  pricePerKg: number; // TZS
  totalWeight: number; // kg
  totalCost: number; // TZS
  transportCost: number; // TZS
  notes?: string;
  status: 'Collected' | 'In Transit' | 'Received at Abattoir' | 'Slaughtered';
  createdAt: string;
  createdBy: string;
}

export interface SlaughterRecord {
  id: string;
  slaughterNumber: string;
  slaughterDate: string;
  purchaseId?: string;
  supplierName?: string;
  birdsReceived: number;
  birdsSlaughtered: number;
  mortality: number;
  rejectedBirds: number;
  acceptedBirds: number;
  averageLiveWeight: number; // kg
  averageCarcassWeight: number; // kg
  yieldPercentage: number; // %
  officerResponsible: string;
  notes?: string;
  createdAt: string;
}

export type PackagingType = 'Vacuum Pack' | 'Plastic Bag' | 'Carton' | 'Labels';

export interface PackagingRecord {
  id: string;
  packagingNumber: string;
  date: string;
  packagingType: PackagingType;
  packagingQuantityUsed: number;
  packagingCost: number;
  officer: string;
  batchId?: string;
  notes?: string;
  createdAt: string;
}

export type StockAdjustmentType = 
  | 'Increase Stock'
  | 'Decrease Stock'
  | 'Correct Errors'
  | 'Damage Adjustment'
  | 'Expiry Adjustment';

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  date: string;
  productId: string;
  productName: string;
  productCode: string;
  adjustmentType: StockAdjustmentType;
  quantityChange: number; // can be positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

export interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  currentQuantity: number;
  minStockLevel: number;
  unit: string;
  severity: 'Critical' | 'Warning';
  notifiedRoles: string[]; // CEO, Assistant CEO, Operations Manager, Sales Manager, Stock Manager
  status: 'Active' | 'Acknowledged' | 'Resolved';
  lastNotifiedAt: string;
}

export interface CostOfProductionSummary {
  birdPurchaseCost: number;
  feedCost: number;
  medicineCost: number;
  electricityCost: number;
  waterCost: number;
  labourCost: number;
  transportCost: number;
  packagingCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  totalCostOfProduction: number;
  birdsProcessed: number;
  totalWeightProducedKg: number;
  costPerBird: number;
  costPerKg: number;
}

export type PaymentMethod = 'Cash' | 'Bank' | 'Mobile Money';

export interface Payment {
  id: string;
  receiptNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  method: PaymentMethod;
  referenceNumber: string; // e.g., M-Pesa ref or Bank Txn ID
  amountPaid: number;
  paymentDate: string;
  receivedBy: string;
  notes?: string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  date: string;
  supplierName?: string;
  liveBirdsPurchased: number;
  averageLiveWeightKg?: number;
  totalLiveWeightKg?: number;
  liveBirdsCost: number; // in TZS
  slaughteredBirds: number;
  mortalityCount?: number;
  carcassProducedKg: number;
  carcassProducedPcs?: number;
  cutsProducedKg: number;
  cutsBreakdown?: {
    quarterLegsKg?: number;
    drumsticksKg?: number;
    bonelessBreastKg?: number;
    wingsKg?: number;
    thighsKg?: number;
  };
  offalsProducedKg: number;
  offalsBreakdown?: {
    gizzardsKg?: number;
    liversKg?: number;
    feetAndNecksKg?: number;
  };
  packagingUsedUnits: number;
  packagingBreakdown?: {
    vacuumBags1kg?: number;
    boxes5kg?: number;
    trays?: number;
  };
  totalPackagingCost?: number;
  totalOutputKg?: number;
  yieldPercentage: number;
  dressingPercentage?: number;
  costPerKgProduced?: number;
  operatorName: string;
  notes?: string;
  status: 'In Progress' | 'Completed';
  createdAt?: string;
}

export interface ProductionCostBreakdown {
  batchId: string;
  birdPurchaseCost: number;
  feedCost: number;
  medicineCost: number;
  transportCost: number;
  packagingCost: number;
  electricityCost: number;
  labourCost: number;
  waterCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  totalCost: number; // Calculated sum
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  device?: string;
  ipAddress?: string;
}

export interface CompanyPaymentDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  branchName?: string;
  branchCode?: string;
  swiftCode?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SystemSettings {
  companyName: string;
  companyOwner: string;
  tinNumber: string;
  vrnNumber: string;
  currency: string;
  vatRatePercentage: number;
  sessionTimeoutMinutes: number;
  maintenanceMode: boolean;
  autoBackupIntervalHours: number;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  ceoApprovalRequiredForFinancialDelete: boolean;
  paymentDetails?: CompanyPaymentDetails;
}

export interface BackupSnapshot {
  id: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
  createdBy: string;
  type: 'Automated Daily' | 'Manual SysAdmin';
  status: 'Completed' | 'Restored';
  recordCounts: {
    users: number;
    customers: number;
    products: number;
    orders: number;
    auditLogs: number;
  };
}

export interface DatabaseHealth {
  status: 'Healthy' | 'Degraded' | 'Maintenance';
  cpuUtilization: number; // percentage
  ramUsageMb: number;
  totalRamMb: number;
  storageUsedMb: number;
  totalStorageMb: number;
  activeConnections: number;
  maxConnections: number;
  queryLatencyMs: number;
  uptimeSeconds: number;
  lastBackupTime: string;
}

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface SchemaCollection {
  name: string;
  title: string;
  description: string;
  readRoles: UserRole[];
  writeRoles: UserRole[];
  fields: SchemaField[];
}

export interface ExpenseEntry {
  id: string;
  expenseNumber: string;
  category: 
    | 'Live Bird Procurement'
    | 'Feed & Veterinary'
    | 'Transport & Logistics'
    | 'Utilities (Power/Water)'
    | 'Abattoir Direct Labour'
    | 'Packaging Materials (Bags/Boxes)'
    | 'Equipment Maintenance'
    | 'Cold Room Storage & Fuel'
    | 'Regulatory & Halal Compliance'
    | 'Cold Room Storage'
    | 'Other Operating Expense';
  amount: number;
  date: string;
  batchId?: string;
  paymentMethod?: 'CRDB Bank' | 'NMB Bank' | 'M-Pesa Till' | 'Cash' | 'Cheque';
  receiptNumber?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface BatchCostBreakdown {
  batchId: string;
  batchNumber: string;
  date: string;
  supplier: string;
  flockType: string;
  liveBirdsCount: number;
  liveWeightKg: number;
  liveBirdsCost: number;
  costPerLiveBird: number;
  costPerLiveKg: number;
  dressedOutputKg: number;
  dressingYieldPct: number;
  packagingCost: number;
  packagingCostPerBird: number;
  linkedExpensesCount: number;
  linkedExpensesTotal: number;
  totalBatchCost: number;
  costPerDressedKg: number;
  status: string;
}

export interface DailyProfitReport {
  date: string;
  revenue: number;
  cogs: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  marginPercentage: number;
  volumeSoldKg: number;
  ordersCount: number;
}

export interface MonthlyProfitReport {
  month: string;
  revenue: number;
  liveBirdCost: number;
  packagingCost: number;
  operatingExpenses: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  marginPercentage: number;
  totalBirdsProcessed: number;
  totalKgProduced: number;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedQuestions?: string[];
  metricsSnapshot?: {
    revenue?: number;
    profit?: number;
    birdsProcessed?: number;
    avgDressingPct?: number;
    totalStockKg?: number;
    outstandingDebt?: number;
  };
  model?: string;
  status?: 'sending' | 'complete' | 'error';
}

export interface AIExecutiveSummary {
  id: string;
  period: string;
  generatedAt: string;
  model: string;
  headline: string;
  executiveBriefing: string;
  kpis: {
    totalRevenue: number;
    cogs: number;
    operatingExpenses: number;
    netProfit: number;
    netMarginPct: number;
    birdsProcessed: number;
    dressedWeightKg: number;
    averageDressingPct: number;
    totalStockInStorageKg: number;
    totalStockValue: number;
    outstandingCustomerDebt: number;
    overdueDebtPct: number;
  };
  operationalHighlights: string[];
  financialHighlights: string[];
  riskAlerts: string[];
  strategicDirectives: string[];
}

export type AIReportType = 
  | 'executive_pnl' 
  | 'production_yield' 
  | 'inventory_audit' 
  | 'sales_debt';

export interface AIAutomatedReport {
  id: string;
  reportType: AIReportType;
  title: string;
  subtitle: string;
  generatedAt: string;
  generatedBy: string;
  dateRange: string;
  executiveNarrative: string;
  keyMetrics: Record<string, string | number>;
  tableHeaders: string[];
  tableRows: Array<Array<string | number>>;
  strategicRecommendations: string[];
  status: 'Ready' | 'Dispatched';
  sentToEmail?: string;
}


