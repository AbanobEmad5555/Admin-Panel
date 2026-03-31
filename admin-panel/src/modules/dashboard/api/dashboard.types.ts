export type DashboardRange = "7d" | "30d" | "90d" | "thisMonth" | "custom";

export type DashboardOrderType = "ONLINE" | "POS" | "TEMP";

export type DashboardQueryParams = {
  range?: DashboardRange;
  startDate?: string;
  endDate?: string;
  ordersLimit?: number;
};

export type DashboardAppliedFilters = {
  range: DashboardRange;
  startDate: string;
  endDate: string;
};

export type DashboardSummary = {
  totalOrders: number;
  onlineOrdersCount: number;
  posOrdersCount: number;
  tempOrdersCount: number;
  totalExpenses: number;
  totalRevenue: number;
  totalProfit: number;
  totalNetIncome: number;
};

export type DashboardSeriesPoint = {
  label: string;
  value: number;
};

export type DashboardOrderPreviewItem = {
  id: number | string;
  orderType: DashboardOrderType;
  orderNumber: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  paymentType: string;
  total: number;
  createdAt: string;
};

export type DashboardOrderSegment = {
  count: number;
  items: DashboardOrderPreviewItem[];
};

export type DashboardResponse = {
  filters: DashboardAppliedFilters;
  summary: DashboardSummary;
  charts: {
    expensesSeries: DashboardSeriesPoint[];
    profitSeries: DashboardSeriesPoint[];
    netIncomeSeries: DashboardSeriesPoint[];
  };
  orders: {
    online: DashboardOrderSegment;
    pos: DashboardOrderSegment;
    temp: DashboardOrderSegment;
  };
};
