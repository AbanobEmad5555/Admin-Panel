import type { Page, Route } from "@playwright/test";

type StaffPermission = {
  id: string;
  key: string;
  moduleKey: string;
  actionKey: string;
  label: string;
};

type StaffRole = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  legacyUserRole?: string | null;
  assignmentCount: number;
  permissions: StaffPermission[];
};

type EmployeeRecord = {
  id: string;
  employeeCode?: string | null;
  fullNameEn: string;
  fullNameAr?: string | null;
  fullName?: string | null;
  role: string;
  status: string;
  salary: number;
  currency: string;
  email?: string | null;
  phone?: string | null;
  employmentType?: "FULL_TIME" | "PART_TIME" | "TRAINEE" | null;
  department?: string | null;
  departmentEn?: string | null;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  hireDate?: string | null;
  workingDays?: string[];
  authAccount?: {
    userId: string;
    email: string;
    phone?: string | null;
    staffAccountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    mustChangePassword?: boolean;
    role: {
      id: string;
      code: string;
      name: string;
      legacyUserRole?: string | null;
      isSystem?: boolean;
    };
  } | null;
};

type AdminAuthProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  legacyRole: string | null;
  isStaffAccount: boolean;
  mustChangePassword: boolean;
  staffAccountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED" | null;
  staffRole: {
    id: string;
    code: string;
    name: string;
    isSystem: boolean;
    legacyUserRole?: string | null;
  } | null;
  permissions: string[];
  moduleEntries?: Record<string, string | null> | null;
  navigation?: {
    defaultEntry: string | null;
    modules: Array<{
      moduleId: string;
      label: string;
      position: number;
      isVisible: boolean;
      entry: string | null;
      permissionKeys: string[];
      links: Array<{
        id: string;
        label: string;
        href: string;
        moduleId: string;
        position: number;
        requiredPermissions: string[];
        accessMode: "any" | "all";
        isEntry: boolean;
        isAccessible: boolean;
      }>;
    }>;
    links: Array<{
      id: string;
      label: string;
      href: string;
      moduleId: string;
      position: number;
      requiredPermissions: string[];
      accessMode: "any" | "all";
      isEntry: boolean;
      isAccessible: boolean;
    }>;
    routes: Array<{
      path: string;
      moduleId: string;
      requiredPermissions: string[];
      accessMode: "any" | "all";
      isAccessible: boolean;
    }>;
  } | null;
  employee: null;
};

type MockFailure = {
  status: number;
  message: string;
};

type NotificationItem = {
  id: string;
  type: string;
  module: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  isRead: boolean;
  createdAt: string;
  redirectUrl?: string | null;
};

type MockAdminApiOptions = {
  profile: AdminAuthProfile;
  loginEmail?: string;
  loginPassword?: string;
  roles?: StaffRole[];
  staffPermissions?: StaffPermission[];
  employees?: EmployeeRecord[];
  duplicateEmployeeEmails?: string[];
  failures?: {
    createRole?: MockFailure;
    updateRoleMetadata?: MockFailure;
    updateRolePermissions?: MockFailure;
    deleteRoleIds?: Record<string, MockFailure>;
    createEmployee?: MockFailure;
    updateEmployee?: MockFailure;
    changeEmployeeStatus?: MockFailure;
    assignStaffRole?: MockFailure;
  };
  notifications?: NotificationItem[];
};

type DashboardLayoutItem = {
  moduleId:
    | "dashboards"
    | "inventory"
    | "crm"
    | "calendar"
    | "pos"
    | "invoices"
    | "purchases"
    | "website"
    | "promo-codes"
    | "team"
    | "loyalty-program";
  position: number;
  isVisible: boolean;
};

type RecordedRequests = {
  createdRoles: Array<Record<string, unknown>>;
  updatedRoleMetadata: Array<{ roleId: string; payload: Record<string, unknown> }>;
  updatedRolePermissions: Array<{ roleId: string; payload: Record<string, unknown> }>;
  deletedRoleIds: string[];
  createdEmployees: Array<Record<string, unknown>>;
  updatedEmployees: Array<{ employeeId: string; payload: Record<string, unknown> }>;
  changedEmployeeStatuses: Array<{ employeeId: string; payload: Record<string, unknown> }>;
  assignedStaffRoles: Array<{ userId: string; payload: Record<string, unknown> }>;
};

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

const success = (route: Route, data: unknown, message: string | null = null) =>
  json(route, 200, { success: true, data, message });

const failure = (route: Route, status: number, message: string) =>
  json(route, status, { success: false, data: null, message });

const clone = <T>(value: T): T => structuredClone(value);

const permissionsToCatalog = (keys: string[]) =>
  keys.map((key, index) => {
    const [moduleKey, actionKey = "view"] = key.split(".");
    return {
      id: `${moduleKey}-${actionKey}-${index}`,
      key,
      moduleKey,
      actionKey,
      label:
        actionKey === "view" || actionKey === "create" || actionKey === "edit" || actionKey === "delete"
          ? `${moduleKey} · ${actionKey}`
          : key.replace(/\./g, " · "),
    };
  });

const withRolePermissions = (
  role: Omit<StaffRole, "permissions"> & { permissionKeys: string[] }
): StaffRole => ({
  ...role,
  permissions: permissionsToCatalog(role.permissionKeys),
});

const defaultRoles = (): StaffRole[] => [
  withRolePermissions({
    id: "role-owner",
    code: "OWNER",
    name: "Owner",
    description: "Top-level owner role.",
    isSystem: true,
    legacyUserRole: "ADMIN",
    assignmentCount: 1,
    permissionKeys: [
      "dashboard.view",
      "orders.view",
      "temp_orders.view",
      "products.view",
      "categories.view",
      "customers.view",
      "leads.view",
      "team.view",
      "team.create",
      "team.edit",
      "team.manage_roles",
      "calendar.view",
      "notifications.view",
      "notifications.preferences",
      "loyalty.view",
      "reviews.view",
      "homepage.view",
      "homepage.edit",
      "homepage.publish",
      "terms.view",
      "terms.edit",
      "privacy.view",
      "privacy.edit",
      "pos.view",
      "purchases.view",
      "promo_codes.view",
      "invoices.view",
    ],
  }),
  withRolePermissions({
    id: "role-manager",
    code: "MANAGER",
    name: "Manager",
    description: "Operations manager.",
    isSystem: true,
    legacyUserRole: "ADMIN",
    assignmentCount: 3,
    permissionKeys: ["dashboard.view", "team.view", "calendar.view"],
  }),
];

const defaultStaffPermissionKeys = [
  "calendar.view",
  "calendar.create",
  "calendar.edit",
  "calendar.delete",
  "categories.view",
  "categories.create",
  "categories.edit",
  "categories.delete",
  "customers.view",
  "customers.create",
  "customers.edit",
  "customers.delete",
  "dashboard.view",
  "dashboard.create",
  "dashboard.edit",
  "dashboard.delete",
  "faq.view",
  "faq.create",
  "faq.edit",
  "faq.delete",
  "footer_settings.view",
  "footer_settings.create",
  "footer_settings.edit",
  "footer_settings.delete",
  "homepage.view",
  "homepage.create",
  "homepage.edit",
  "homepage.delete",
  "homepage.publish",
  "invoices.view",
  "invoices.create",
  "invoices.edit",
  "invoices.delete",
  "leads.view",
  "leads.create",
  "leads.edit",
  "leads.delete",
  "loyalty.view",
  "loyalty.create",
  "loyalty.edit",
  "loyalty.delete",
  "loyalty.adjust_points",
  "notifications.view",
  "notifications.create",
  "notifications.edit",
  "notifications.delete",
  "notifications.preferences",
  "orders.view",
  "orders.create",
  "orders.edit",
  "orders.delete",
  "pos.view",
  "pos.create",
  "pos.edit",
  "pos.delete",
  "privacy.view",
  "privacy.create",
  "privacy.edit",
  "privacy.delete",
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "promo_codes.view",
  "promo_codes.create",
  "promo_codes.edit",
  "promo_codes.delete",
  "purchases.view",
  "purchases.create",
  "purchases.edit",
  "purchases.delete",
  "reviews.view",
  "reviews.create",
  "reviews.edit",
  "reviews.delete",
  "settings.view",
  "settings.create",
  "settings.edit",
  "settings.delete",
  "social_links.view",
  "social_links.create",
  "social_links.edit",
  "social_links.delete",
  "team.view",
  "team.create",
  "team.edit",
  "team.delete",
  "team.manage_roles",
  "temp_orders.view",
  "temp_orders.create",
  "temp_orders.edit",
  "temp_orders.delete",
  "terms.view",
  "terms.create",
  "terms.edit",
  "terms.delete",
] as const;

const defaultProfile = (): AdminAuthProfile => ({
  id: "user-owner",
  email: "owner@test.com",
  firstName: "Owner",
  lastName: "Admin",
  legacyRole: "ADMIN",
  isStaffAccount: true,
  mustChangePassword: false,
  staffAccountStatus: "ACTIVE",
  staffRole: {
    id: "role-owner",
    code: "OWNER",
    name: "Owner",
    isSystem: true,
    legacyUserRole: "ADMIN",
  },
  permissions: defaultRoles()[0].permissions.map((permission) => permission.key),
  moduleEntries: {
    dashboards: "/dashboard",
    inventory: "/admin/products",
    crm: "/admin/crm/pipeline",
    calendar: "/calendar",
    pos: "/admin/pos",
    invoices: "/admin/invoices",
    purchases: "/purchases/summary",
    website: "/admin/homepage-control",
    "promo-codes": "/admin/promo-codes",
    team: "/admin/team",
    "loyalty-program": "/admin/loyalty",
  },
  navigation: {
    defaultEntry: "/dashboard",
    modules: [
      {
        moduleId: "dashboards",
        label: "Dashboards",
        position: 1,
        isVisible: true,
        entry: "/dashboard",
        permissionKeys: ["dashboard.view"],
        links: [
          {
            id: "dashboard-home",
            label: "Dashboard",
            href: "/dashboard",
            moduleId: "dashboards",
            position: 1,
            requiredPermissions: ["dashboard.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "inventory",
        label: "Inventory",
        position: 2,
        isVisible: true,
        entry: "/admin/products",
        permissionKeys: ["products.view", "categories.view"],
        links: [
          {
            id: "inventory-products",
            label: "Products",
            href: "/admin/products",
            moduleId: "inventory",
            position: 1,
            requiredPermissions: ["products.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
          {
            id: "inventory-categories",
            label: "Categories",
            href: "/categories",
            moduleId: "inventory",
            position: 2,
            requiredPermissions: ["categories.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "crm",
        label: "CRM",
        position: 3,
        isVisible: true,
        entry: "/admin/crm/pipeline",
        permissionKeys: ["orders.view", "temp_orders.view", "leads.view", "customers.view"],
        links: [
          {
            id: "crm-pipeline",
            label: "Pipeline",
            href: "/admin/crm/pipeline",
            moduleId: "crm",
            position: 1,
            requiredPermissions: ["orders.view", "temp_orders.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
          {
            id: "crm-leads",
            label: "Leads",
            href: "/admin/crm/leads",
            moduleId: "crm",
            position: 2,
            requiredPermissions: ["leads.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
          {
            id: "crm-users",
            label: "Customers",
            href: "/admin/users",
            moduleId: "crm",
            position: 3,
            requiredPermissions: ["customers.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "calendar",
        label: "Calendar",
        position: 4,
        isVisible: true,
        entry: "/calendar",
        permissionKeys: ["calendar.view"],
        links: [
          {
            id: "calendar-home",
            label: "Calendar",
            href: "/calendar",
            moduleId: "calendar",
            position: 1,
            requiredPermissions: ["calendar.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "pos",
        label: "POS",
        position: 5,
        isVisible: true,
        entry: "/admin/pos",
        permissionKeys: ["pos.view"],
        links: [
          {
            id: "pos-home",
            label: "POS",
            href: "/admin/pos",
            moduleId: "pos",
            position: 1,
            requiredPermissions: ["pos.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "invoices",
        label: "Invoices",
        position: 6,
        isVisible: true,
        entry: "/admin/invoices",
        permissionKeys: ["invoices.view"],
        links: [
          {
            id: "invoices-home",
            label: "Invoices",
            href: "/admin/invoices",
            moduleId: "invoices",
            position: 1,
            requiredPermissions: ["invoices.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "purchases",
        label: "Purchases",
        position: 7,
        isVisible: true,
        entry: "/purchases/summary",
        permissionKeys: ["purchases.view"],
        links: [
          {
            id: "purchases-summary",
            label: "Purchases",
            href: "/purchases/summary",
            moduleId: "purchases",
            position: 1,
            requiredPermissions: ["purchases.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "website",
        label: "Website",
        position: 8,
        isVisible: true,
        entry: "/admin/homepage-control",
        permissionKeys: ["homepage.view"],
        links: [
          {
            id: "website-homepage",
            label: "Homepage",
            href: "/admin/homepage-control",
            moduleId: "website",
            position: 1,
            requiredPermissions: ["homepage.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "promo-codes",
        label: "Promo Codes",
        position: 9,
        isVisible: true,
        entry: "/admin/promo-codes",
        permissionKeys: ["promo_codes.view"],
        links: [
          {
            id: "promo-codes-home",
            label: "Promo Codes",
            href: "/admin/promo-codes",
            moduleId: "promo-codes",
            position: 1,
            requiredPermissions: ["promo_codes.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "team",
        label: "Team",
        position: 10,
        isVisible: true,
        entry: "/admin/team",
        permissionKeys: ["team.view", "team.manage_roles"],
        links: [
          {
            id: "team-home",
            label: "Team",
            href: "/admin/team",
            moduleId: "team",
            position: 1,
            requiredPermissions: ["team.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
          {
            id: "team-roles",
            label: "Staff Roles",
            href: "/admin/team/roles",
            moduleId: "team",
            position: 2,
            requiredPermissions: ["team.manage_roles"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
      {
        moduleId: "loyalty-program",
        label: "Loyalty Program",
        position: 11,
        isVisible: true,
        entry: "/admin/loyalty",
        permissionKeys: ["loyalty.view"],
        links: [
          {
            id: "loyalty-home",
            label: "Loyalty Program",
            href: "/admin/loyalty",
            moduleId: "loyalty-program",
            position: 1,
            requiredPermissions: ["loyalty.view"],
            accessMode: "any",
            isEntry: true,
            isAccessible: true,
          },
        ],
      },
    ],
    links: [],
    routes: [
      { path: "/dashboard", moduleId: "dashboards", requiredPermissions: ["dashboard.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/products", moduleId: "inventory", requiredPermissions: ["products.view"], accessMode: "any", isAccessible: true },
      { path: "/categories", moduleId: "inventory", requiredPermissions: ["categories.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/crm/pipeline", moduleId: "crm", requiredPermissions: ["orders.view", "temp_orders.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/crm/leads", moduleId: "crm", requiredPermissions: ["leads.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/users", moduleId: "crm", requiredPermissions: ["customers.view"], accessMode: "any", isAccessible: true },
      { path: "/calendar", moduleId: "calendar", requiredPermissions: ["calendar.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/pos", moduleId: "pos", requiredPermissions: ["pos.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/invoices", moduleId: "invoices", requiredPermissions: ["invoices.view"], accessMode: "any", isAccessible: true },
      { path: "/purchases/summary", moduleId: "purchases", requiredPermissions: ["purchases.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/homepage-control", moduleId: "website", requiredPermissions: ["homepage.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/promo-codes", moduleId: "promo-codes", requiredPermissions: ["promo_codes.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/team", moduleId: "team", requiredPermissions: ["team.view"], accessMode: "any", isAccessible: true },
      { path: "/admin/team/roles", moduleId: "team", requiredPermissions: ["team.manage_roles"], accessMode: "any", isAccessible: true },
      { path: "/admin/loyalty", moduleId: "loyalty-program", requiredPermissions: ["loyalty.view"], accessMode: "any", isAccessible: true },
    ],
  },
  employee: null,
});

const hasAnyPermission = (profile: AdminAuthProfile, requiredPermissions: string[]) =>
  requiredPermissions.length === 0 ||
  requiredPermissions.some((permission) => profile.permissions.includes(permission));

const buildNavigationForProfile = (profile: AdminAuthProfile) => {
  const baseNavigation = clone(defaultProfile().navigation!);
  const moduleEntries = profile.moduleEntries ?? {};

  const modules = baseNavigation.modules.map((moduleItem) => {
    const links = moduleItem.links.map((link) => ({
      ...link,
      isAccessible: hasAnyPermission(profile, link.requiredPermissions),
    }));
    const accessibleEntry = links.find((link) => link.isEntry && link.isAccessible)?.href ?? null;
    const explicitEntry = Object.prototype.hasOwnProperty.call(moduleEntries, moduleItem.moduleId)
      ? moduleEntries[moduleItem.moduleId]
      : accessibleEntry;

    return {
      ...moduleItem,
      entry: explicitEntry ?? null,
      isVisible: (explicitEntry ?? null) !== null,
      links,
    };
  });

  const links = modules.flatMap((moduleItem) => moduleItem.links);
  const routes = baseNavigation.routes.map((route) => ({
    ...route,
    isAccessible: hasAnyPermission(profile, route.requiredPermissions),
  }));

  return {
    defaultEntry:
      baseNavigation.defaultEntry && hasAnyPermission(profile, ["dashboard.view"])
        ? baseNavigation.defaultEntry
        : modules.find((moduleItem) => moduleItem.entry)?.entry ?? null,
    modules,
    links,
    routes,
  };
};

const defaultEmployees = (): EmployeeRecord[] => [
  {
    id: "employee-1",
    employeeCode: "EMP-001",
    fullNameEn: "Mina Atef",
    fullName: "Mina Atef",
    role: "EMPLOYEE",
    status: "ACTIVE",
    salary: 15000,
    currency: "EGP",
    email: "mina.employee@test.com",
    phone: "+201000000001",
    employmentType: "FULL_TIME",
    department: "Operations",
    departmentEn: "Operations",
    shiftStart: "09:00",
    shiftEnd: "17:00",
    hireDate: "2026-01-15",
    workingDays: ["SUN", "MON", "TUE", "WED", "THU"],
    authAccount: {
      userId: "user-employee-1",
      email: "mina.login@test.com",
      phone: "+201000000001",
      staffAccountStatus: "ACTIVE",
      mustChangePassword: false,
      role: {
        id: "role-manager",
        code: "MANAGER",
        name: "Manager",
        legacyUserRole: "ADMIN",
        isSystem: true,
      },
    },
  },
];

const defaultNotifications = (): NotificationItem[] => [
  {
    id: "notification-1",
    type: "order.created",
    module: "orders",
    title: "New order",
    message: "Order #1001 created.",
    severity: "INFO",
    isRead: false,
    createdAt: "2026-03-29T09:00:00.000Z",
    redirectUrl: "/admin/orders/1001",
  },
];

const toOrderPreview = (id: string, orderType: "ONLINE" | "TEMP" | "POS") => ({
  id,
  orderType,
  orderNumber: id,
  customerName: "Mina Atef",
  status: "PENDING",
  paymentStatus: "UNPAID",
  paymentType: "CASH",
  total: 350,
  createdAt: "2026-03-28T10:00:00.000Z",
});

const defaultDashboardData = () => ({
  filters: {
    range: "30d",
    startDate: "2026-03-01",
    endDate: "2026-03-29",
  },
  summary: {
    totalOrders: 12,
    onlineOrdersCount: 7,
    posOrdersCount: 3,
    tempOrdersCount: 2,
    totalExpenses: 3200,
    totalRevenue: 18250,
    totalProfit: 7050,
    totalNetIncome: 6400,
  },
  charts: {
    expensesSeries: [
      { label: "Week 1", value: 900 },
      { label: "Week 2", value: 1100 },
    ],
    profitSeries: [
      { label: "Week 1", value: 1700 },
      { label: "Week 2", value: 2200 },
    ],
    netIncomeSeries: [
      { label: "Week 1", value: 1500 },
      { label: "Week 2", value: 1900 },
    ],
  },
  orders: {
    online: {
      count: 1,
      items: [toOrderPreview("1001", "ONLINE")],
    },
    pos: {
      count: 1,
      items: [toOrderPreview("POS-1001", "POS")],
    },
    temp: {
      count: 1,
      items: [toOrderPreview("TEMP-1001", "TEMP")],
    },
  },
});

const defaultLoyaltyOverview = () => ({
  summary: {
    totals: {
      availablePoints: "1200.000",
      pendingPoints: "50.000",
      redeemedPoints: "300.000",
      usersCount: 2,
    },
  },
  currentPointUsers: {
    items: [
      {
        userId: 1,
        name: "Mina Atef",
        email: "mina.customer@test.com",
        availablePoints: "900.000",
        pendingPoints: "50.000",
        lifetimeEarned: "1200.000",
        redeemedPoints: "200.000",
      },
    ],
    page: 1,
    limit: 20,
    totalItems: 1,
    totalPages: 1,
  },
  expiringSoonUsers: {
    items: [
      {
        userId: 2,
        name: "Rana Adel",
        email: "rana@test.com",
        expiringPoints: "80.000",
        expiresAt: "2026-04-02T00:00:00.000Z",
        daysLeft: 4,
        availablePoints: "120.000",
      },
    ],
    page: 1,
    limit: 20,
    totalItems: 1,
    totalPages: 1,
  },
  consumedUsers: {
    items: [
      {
        userId: 1,
        name: "Mina Atef",
        email: "mina.customer@test.com",
        redeemedPoints: "200.000",
        lifetimeRedeemed: "300.000",
      },
    ],
    page: 1,
    limit: 20,
    totalItems: 1,
    totalPages: 1,
  },
});

const defaultNotificationPreferences = () => ({
  adminId: 1,
  modules: [
    { module: "orders", label: "Orders", isEnabled: true },
    { module: "team", label: "Team", isEnabled: true },
  ],
  types: [
    { module: "orders", type: "order.created", label: "Order created", isEnabled: true },
    { module: "team", type: "employee.updated", label: "Employee updated", isEnabled: true },
  ],
});

const defaultUsers = () => ({
  items: [
    {
      id: 1,
      fullName: "Mina Customer",
      email: "mina.customer@test.com",
      phone: "+201000000020",
      status: "ACTIVE",
      createdAt: "2026-03-20T09:00:00.000Z",
    },
  ],
  pagination: {
    totalItems: 1,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  },
});

const defaultCategories = () => [
  { id: 1, name: "Flowers" },
  { id: 2, name: "Accessories" },
];

const defaultVariants = () => [
  { id: 1, name: "Standard" },
];

const defaultProducts = () => ({
  items: [
    {
      id: 101,
      name: "Rose Bouquet",
      price: 350,
      priceAfterDiscount: 350,
      category: { id: 1, name: "Flowers" },
      stock: 8,
      images: [{ url: "/uploads/rose-bouquet.jpg" }],
    },
  ],
  pagination: {
    totalItems: 1,
    currentPage: 1,
    totalPages: 1,
    limit: 100,
  },
});

const defaultOrders = () => ({
  orders: [
    {
      id: 1001,
      user: {
        id: 1,
        name: "Mina Customer",
        email: "mina.customer@test.com",
      },
      address: {
        fullName: "Mina Customer",
        area: "Nasr City",
        phone: "+201000000020",
      },
      totalAmount: 350,
      paymentType: "CASH",
      status: "PENDING",
      createdAt: "2026-03-28T12:00:00.000Z",
    },
  ],
  pagination: {
    totalItems: 1,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  },
});

const defaultTempOrders = () => ({
  items: [
    {
      orderId: "TEMP-1001",
      customerName: "Manual Customer",
      mobileNumber: "+201000000030",
      address: "Nasr City",
      totalAmount: 275,
      paymentMethod: "CASH",
      status: "TEMP",
      createdAt: "2026-03-28T13:00:00.000Z",
    },
  ],
  page: 1,
  limit: 100,
  totalItems: 1,
  totalPages: 1,
});

const defaultPosOrders = () => ({
  posOrders: [
    {
      id: "POS-1001",
      tempOrderId: "TEMP-1001",
      customerName: "Mina Customer",
      customerMobileNumber: "+201000000020",
      subtotal: 350,
      total: 350,
      paidAmount: 350,
      dueAmount: 0,
      change: 0,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      status: "COMPLETED",
      createdAt: "2026-03-28T14:00:00.000Z",
      items: [
        {
          productId: 101,
          name: "Rose Bouquet",
          qty: 1,
          unitPrice: 350,
        },
      ],
    },
  ],
  page: 1,
  limit: 10,
  totalItems: 1,
  totalPages: 1,
});

const defaultDashboardLayout = (): DashboardLayoutItem[] => [
  { moduleId: "dashboards", position: 1, isVisible: true },
  { moduleId: "inventory", position: 2, isVisible: true },
  { moduleId: "crm", position: 3, isVisible: true },
  { moduleId: "calendar", position: 4, isVisible: true },
  { moduleId: "pos", position: 5, isVisible: true },
  { moduleId: "invoices", position: 6, isVisible: true },
  { moduleId: "purchases", position: 7, isVisible: true },
  { moduleId: "website", position: 8, isVisible: true },
  { moduleId: "promo-codes", position: 9, isVisible: true },
  { moduleId: "team", position: 10, isVisible: true },
  { moduleId: "loyalty-program", position: 11, isVisible: true },
];

const defaultLocalizationSettings = (): { language: "en" | "ar" } => ({
  language: "en",
});

const defaultCalendarSettings = () => ({
  defaultDeliveryMethod: "STANDARD",
  methods: {
    STANDARD: {
      deliveryDays: 2,
      deliveryCost: 60,
    },
    EXPRESS: {
      deliveryDays: 1,
      deliveryCost: 120,
    },
  },
  STANDARD: {
    deliveryDays: 2,
    deliveryCost: 60,
  },
  EXPRESS: {
    deliveryDays: 1,
    deliveryCost: 120,
  },
});

const defaultLeads = () => ({
  leads: [
    {
      id: 301,
      name: "Mina Lead",
      phone: "+201000000040",
      email: "lead@test.com",
      source: "Instagram",
      status: "New",
      priority: "Medium",
      assignedToId: 1,
      assignedTo: {
        id: 1,
        name: "Owner Admin",
        email: "owner@test.com",
      },
      createdAt: "2026-03-28T10:00:00.000Z",
      updatedAt: "2026-03-28T11:00:00.000Z",
    },
  ],
  pagination: {
    totalItems: 1,
    currentPage: 1,
    totalPages: 1,
    limit: 20,
  },
});

const normalizeRoleSummary = (role: StaffRole | null) =>
  role
    ? {
        id: role.id,
        code: role.code,
        name: role.name,
        isSystem: role.isSystem,
        legacyUserRole: role.legacyUserRole ?? null,
      }
    : null;

const mergeEmployee = (
  employee: EmployeeRecord,
  payload: Record<string, unknown>,
  roles: StaffRole[]
): EmployeeRecord => {
  const account = (payload.account ?? null) as Record<string, unknown> | null;
  const fullNameEn =
    typeof payload.fullNameEn === "string" && payload.fullNameEn.trim()
      ? payload.fullNameEn.trim()
      : employee.fullNameEn;

  let authAccount = employee.authAccount ? clone(employee.authAccount) : null;

  if (account?.createLogin && !authAccount) {
    const selectedRole =
      roles.find((role) => String(role.id) === String(account.roleId ?? "")) ?? roles[0] ?? null;
    authAccount = {
      userId: `user-${employee.id}`,
      email: String(account.email ?? employee.email ?? ""),
      phone: String(account.phone ?? employee.phone ?? "") || null,
      staffAccountStatus:
        (String(account.staffAccountStatus ?? "ACTIVE") as NonNullable<
          EmployeeRecord["authAccount"]
        >["staffAccountStatus"]),
      mustChangePassword: false,
      role: {
        id: selectedRole?.id ?? "",
        code: selectedRole?.code ?? "",
        name: selectedRole?.name ?? "",
        legacyUserRole: selectedRole?.legacyUserRole ?? null,
        isSystem: selectedRole?.isSystem ?? false,
      },
    };
  }

  if (authAccount && account) {
    if (typeof account.email === "string") {
      authAccount.email = account.email;
    }
    if (typeof account.phone === "string") {
      authAccount.phone = account.phone || null;
    }
    if (typeof account.staffAccountStatus === "string" && account.staffAccountStatus) {
      authAccount.staffAccountStatus = account.staffAccountStatus as NonNullable<
        EmployeeRecord["authAccount"]
      >["staffAccountStatus"];
    }
  }

  return {
    ...employee,
    fullNameEn,
    fullName: fullNameEn,
    fullNameAr:
      typeof payload.fullNameAr === "string" ? payload.fullNameAr : employee.fullNameAr ?? null,
    role: typeof payload.role === "string" ? payload.role : employee.role,
    salary:
      typeof payload.salary === "number"
        ? payload.salary
        : Number(payload.salary ?? employee.salary) || employee.salary,
    currency: typeof payload.currency === "string" ? payload.currency : employee.currency,
    email: typeof payload.email === "string" ? payload.email || null : employee.email ?? null,
    phone: typeof payload.phone === "string" ? payload.phone || null : employee.phone ?? null,
    employmentType:
      typeof payload.employmentType === "string"
        ? (payload.employmentType as EmployeeRecord["employmentType"])
        : employee.employmentType ?? null,
    department:
      typeof payload.departmentEn === "string"
        ? payload.departmentEn || null
        : employee.department ?? null,
    departmentEn:
      typeof payload.departmentEn === "string"
        ? payload.departmentEn || null
        : employee.departmentEn ?? null,
    shiftStart:
      typeof payload.shiftStart === "string" ? payload.shiftStart || null : employee.shiftStart ?? null,
    shiftEnd:
      typeof payload.shiftEnd === "string" ? payload.shiftEnd || null : employee.shiftEnd ?? null,
    hireDate:
      typeof payload.hireDate === "string" ? payload.hireDate || null : employee.hireDate ?? null,
    workingDays: Array.isArray(payload.workingDays)
      ? payload.workingDays.map((day) => String(day))
      : employee.workingDays ?? ["SUN", "MON", "TUE", "WED", "THU"],
    authAccount,
  };
};

const findRoleById = (roles: StaffRole[], roleId: string) =>
  roles.find((role) => String(role.id) === String(roleId)) ?? null;

export async function installMockAdminApi(page: Page, options: MockAdminApiOptions) {
  let profile = clone(options.profile ?? defaultProfile());
  profile = {
    ...profile,
    navigation: profile.navigation ?? buildNavigationForProfile(profile),
  };
  const roles = clone(options.roles ?? defaultRoles());
  const staffPermissions = clone(options.staffPermissions ?? permissionsToCatalog([...defaultStaffPermissionKeys]));
  const employees = clone(options.employees ?? defaultEmployees());
  const notifications = clone(options.notifications ?? defaultNotifications());
  let notificationPreferences = clone(defaultNotificationPreferences());
  let dashboardLayout = clone(defaultDashboardLayout());
  let localizationSettings = clone(defaultLocalizationSettings());
  let calendarSettings = clone(defaultCalendarSettings());
  const duplicateEmployeeEmails = new Set(
    (options.duplicateEmployeeEmails ?? []).map((value) => value.toLowerCase())
  );

  const requests: RecordedRequests = {
    createdRoles: [],
    updatedRoleMetadata: [],
    updatedRolePermissions: [],
    deletedRoleIds: [],
    createdEmployees: [],
    updatedEmployees: [],
    changedEmployeeStatuses: [],
    assignedStaffRoles: [],
  };

  const handler = async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const method = request.method();

    if (pathname === "/api/auth/login" && method === "POST") {
      const body = request.postDataJSON() as { email?: string; password?: string };
      const loginEmail = (options.loginEmail ?? profile.email).toLowerCase();
      const loginPassword = options.loginPassword ?? "123456";

      if (
        String(body?.email ?? "").toLowerCase() !== loginEmail ||
        String(body?.password ?? "") !== loginPassword
      ) {
        return failure(route, 401, "Invalid email or password");
      }

      return success(route, {
        token: "test-admin-token",
        role: profile.legacyRole ?? "ADMIN",
        status: "ACTIVE",
      });
    }

    if (pathname === "/api/admin/auth/me" && method === "GET") {
      return success(route, profile);
    }

    if (pathname === "/api/admin/auth/change-initial-password" && method === "POST") {
      profile = {
        ...profile,
        mustChangePassword: false,
      };
      return success(route, { mustChangePassword: false }, "Password changed successfully.");
    }

    if (pathname === "/api/admin/dashboard-layout" && method === "GET") {
      return success(route, dashboardLayout);
    }

    if (pathname === "/api/admin/dashboard-layout" && method === "PATCH") {
      const body = request.postDataJSON() as { modules?: DashboardLayoutItem[] };
      dashboardLayout = clone(body.modules ?? dashboardLayout);
      return success(route, dashboardLayout, "Dashboard layout updated.");
    }

    if (pathname === "/api/admin/dashboard-layout/module" && method === "PATCH") {
      const body = request.postDataJSON() as { moduleId?: string; isVisible?: boolean };
      dashboardLayout = dashboardLayout.map((item) =>
        item.moduleId === body.moduleId
          ? {
              ...item,
              isVisible: Boolean(body.isVisible),
            }
          : item
      );
      return success(route, dashboardLayout, "Dashboard module visibility updated.");
    }

    if (pathname === "/api/admin/settings/localization" && method === "GET") {
      return success(route, localizationSettings);
    }

    if (pathname === "/api/admin/settings/localization" && method === "PATCH") {
      const body = request.postDataJSON() as { language?: "en" | "ar" };
      localizationSettings = {
        language: body.language === "ar" ? "ar" : "en",
      };
      return success(route, localizationSettings, "Localization settings updated.");
    }

    if (pathname === "/api/admin/staff-roles" && method === "GET") {
      return success(route, {
        items: roles.map((role) => ({
          ...role,
          permissions: role.permissions,
        })),
        totalItems: roles.length,
      });
    }

    if (pathname === "/api/admin/staff-permissions" && method === "GET") {
      return success(route, {
        items: staffPermissions,
      });
    }

    if (pathname === "/api/admin/staff-roles" && method === "POST") {
      if (options.failures?.createRole) {
        return failure(
          route,
          options.failures.createRole.status,
          options.failures.createRole.message
        );
      }

      const body = request.postDataJSON() as Record<string, unknown>;
      requests.createdRoles.push(body);
      const permissionKeys = Array.isArray(body.permissionKeys)
        ? body.permissionKeys.map((value) => String(value))
        : [];
      const createdRole: StaffRole = {
        id: `role-custom-${roles.length + 1}`,
        code: `CUSTOM_${String(body.name ?? "ROLE")
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "_")}`,
        name: String(body.name ?? "Custom Role"),
        description: String(body.description ?? "") || null,
        isSystem: false,
        legacyUserRole: String(body.legacyUserRole ?? "EMPLOYEE"),
        assignmentCount: 0,
        permissions: permissionsToCatalog(permissionKeys),
      };
      roles.push(createdRole);
      return success(route, createdRole, "Role created.");
    }

    if (pathname.startsWith("/api/admin/staff-roles/") && method === "GET") {
      const parts = pathname.split("/").filter(Boolean);
      const roleId = parts[parts.length - 1] ?? "";
      const role = findRoleById(roles, roleId);
      if (!role) {
        return failure(route, 404, "Staff role not found");
      }
      return success(route, role);
    }

    if (/^\/api\/admin\/staff-roles\/[^/]+$/.test(pathname) && method === "PATCH") {
      if (options.failures?.updateRoleMetadata) {
        return failure(
          route,
          options.failures.updateRoleMetadata.status,
          options.failures.updateRoleMetadata.message
        );
      }

      const roleId = pathname.split("/").pop() ?? "";
      const role = findRoleById(roles, roleId);
      if (!role) {
        return failure(route, 404, "Staff role not found");
      }

      const body = request.postDataJSON() as Record<string, unknown>;
      requests.updatedRoleMetadata.push({ roleId, payload: body });

      if (!role.isSystem) {
        if (typeof body.name === "string" && body.name.trim()) {
          role.name = body.name.trim();
        }
        role.description = String(body.description ?? "") || null;
        role.legacyUserRole = String(body.legacyUserRole ?? role.legacyUserRole ?? "") || null;
      }

      return success(route, role, "Role updated.");
    }

    if (/^\/api\/admin\/staff-roles\/[^/]+\/permissions$/.test(pathname) && method === "PUT") {
      if (options.failures?.updateRolePermissions) {
        return failure(
          route,
          options.failures.updateRolePermissions.status,
          options.failures.updateRolePermissions.message
        );
      }

      const roleId = pathname.split("/").slice(-2, -1)[0] ?? "";
      const role = findRoleById(roles, roleId);
      if (!role) {
        return failure(route, 404, "Staff role not found");
      }

      const body = request.postDataJSON() as Record<string, unknown>;
      requests.updatedRolePermissions.push({ roleId, payload: body });
      const permissionKeys = Array.isArray(body.permissionKeys)
        ? body.permissionKeys.map((value) => String(value))
        : [];
      role.permissions = permissionsToCatalog(permissionKeys);
      return success(route, role, "Role permissions updated.");
    }

    if (/^\/api\/admin\/staff-roles\/[^/]+$/.test(pathname) && method === "DELETE") {
      const roleId = pathname.split("/").pop() ?? "";
      const role = findRoleById(roles, roleId);
      if (!role) {
        return failure(route, 404, "Staff role not found");
      }

      const configuredFailure = options.failures?.deleteRoleIds?.[roleId];
      if (configuredFailure) {
        return failure(route, configuredFailure.status, configuredFailure.message);
      }
      if (role.assignmentCount > 0) {
        return failure(route, 400, "Role cannot be deleted while assigned to users");
      }

      requests.deletedRoleIds.push(roleId);
      const index = roles.findIndex((entry) => entry.id === roleId);
      if (index !== -1) {
        roles.splice(index, 1);
      }
      return success(route, { id: roleId, deleted: true }, "Role deleted.");
    }

    if (/^\/api\/admin\/staff-users\/[^/]+\/role$/.test(pathname) && method === "PATCH") {
      if (options.failures?.assignStaffRole) {
        return failure(
          route,
          options.failures.assignStaffRole.status,
          options.failures.assignStaffRole.message
        );
      }

      const userId = pathname.split("/").slice(-2, -1)[0] ?? "";
      const body = request.postDataJSON() as Record<string, unknown>;
      requests.assignedStaffRoles.push({ userId, payload: body });
      const nextRole = findRoleById(roles, String(body.roleId ?? ""));
      const employee = employees.find((item) => item.authAccount?.userId === userId);
      if (!employee?.authAccount || !nextRole) {
        return failure(route, 404, "Staff account not found");
      }

      const previousRole = clone(employee.authAccount.role);
      employee.authAccount.role = {
        id: nextRole.id,
        code: nextRole.code,
        name: nextRole.name,
        legacyUserRole: nextRole.legacyUserRole ?? null,
        isSystem: nextRole.isSystem,
      };

      return success(route, {
        userId,
        role: normalizeRoleSummary(nextRole),
        previousRole: previousRole
          ? {
              id: previousRole.id,
              code: previousRole.code,
              name: previousRole.name,
            }
          : null,
      });
    }

    if (pathname === "/api/admin/team/employees" && method === "GET") {
      return success(route, {
        items: employees,
        page: 1,
        limit: 20,
        totalItems: employees.length,
        totalPages: 1,
      });
    }

    if (/^\/api\/admin\/team\/employees\/[^/]+$/.test(pathname) && method === "GET") {
      const employeeId = pathname.split("/").pop() ?? "";
      const employee = employees.find((entry) => entry.id === employeeId);
      if (!employee) {
        return failure(route, 404, "Employee not found");
      }
      return success(route, employee);
    }

    if (pathname === "/api/admin/team/employees" && method === "POST") {
      if (options.failures?.createEmployee) {
        return failure(
          route,
          options.failures.createEmployee.status,
          options.failures.createEmployee.message
        );
      }

      const body = request.postDataJSON() as Record<string, unknown>;
      requests.createdEmployees.push(body);

      const account = (body.account ?? null) as Record<string, unknown> | null;
      const loginEmail = String(account?.email ?? "").trim().toLowerCase();
      if (loginEmail && duplicateEmployeeEmails.has(loginEmail)) {
        return failure(route, 409, "Email already exists");
      }

      const selectedRole =
        roles.find((entry) => String(entry.id) === String(account?.roleId ?? "")) ?? roles[0] ?? null;
      const createdEmployee: EmployeeRecord = {
        id: `employee-${employees.length + 1}`,
        employeeCode: `EMP-00${employees.length + 1}`,
        fullNameEn: String(body.fullNameEn ?? body.fullName ?? "New Employee"),
        fullNameAr: String(body.fullNameAr ?? "") || null,
        fullName: String(body.fullNameEn ?? body.fullName ?? "New Employee"),
        role: String(body.role ?? "EMPLOYEE"),
        status: "ACTIVE",
        salary: Number(body.salary ?? 0),
        currency: String(body.currency ?? "EGP"),
        email: String(body.email ?? "") || null,
        phone: String(body.phone ?? "") || null,
        employmentType:
          (String(body.employmentType ?? "FULL_TIME") as EmployeeRecord["employmentType"]) ?? null,
        department: String(body.departmentEn ?? "") || null,
        departmentEn: String(body.departmentEn ?? "") || null,
        shiftStart: String(body.shiftStart ?? "") || null,
        shiftEnd: String(body.shiftEnd ?? "") || null,
        hireDate: String(body.hireDate ?? "") || null,
        workingDays: Array.isArray(body.workingDays)
          ? body.workingDays.map((day) => String(day))
          : ["SUN", "MON", "TUE", "WED", "THU"],
        authAccount:
          account?.createLogin && selectedRole
            ? {
                userId: `user-${employees.length + 1}`,
                email: String(account.email ?? ""),
                phone: String(account.phone ?? "") || null,
                staffAccountStatus:
                  (String(account.staffAccountStatus ?? "ACTIVE") as NonNullable<
                    EmployeeRecord["authAccount"]
                  >["staffAccountStatus"]),
                mustChangePassword: true,
                role: {
                  id: selectedRole.id,
                  code: selectedRole.code,
                  name: selectedRole.name,
                  legacyUserRole: selectedRole.legacyUserRole ?? null,
                  isSystem: selectedRole.isSystem,
                },
              }
            : null,
      };
      employees.push(createdEmployee);
      return success(route, createdEmployee, "Employee created.");
    }

    if (/^\/api\/admin\/team\/employees\/[^/]+$/.test(pathname) && method === "PATCH") {
      if (options.failures?.updateEmployee) {
        return failure(
          route,
          options.failures.updateEmployee.status,
          options.failures.updateEmployee.message
        );
      }

      const employeeId = pathname.split("/").pop() ?? "";
      const employee = employees.find((entry) => entry.id === employeeId);
      if (!employee) {
        return failure(route, 404, "Employee not found");
      }

      const body = request.postDataJSON() as Record<string, unknown>;
      requests.updatedEmployees.push({ employeeId, payload: body });
      const updated = mergeEmployee(employee, body, roles);
      const index = employees.findIndex((entry) => entry.id === employeeId);
      employees[index] = updated;
      return success(route, updated, "Employee updated.");
    }

    if (/^\/api\/admin\/team\/employees\/[^/]+\/status$/.test(pathname) && method === "PATCH") {
      if (options.failures?.changeEmployeeStatus) {
        return failure(
          route,
          options.failures.changeEmployeeStatus.status,
          options.failures.changeEmployeeStatus.message
        );
      }

      const employeeId = pathname.split("/").slice(-2, -1)[0] ?? "";
      const employee = employees.find((entry) => entry.id === employeeId);
      if (!employee) {
        return failure(route, 404, "Employee not found");
      }

      const body = request.postDataJSON() as Record<string, unknown>;
      requests.changedEmployeeStatuses.push({ employeeId, payload: body });
      employee.status = String(body.status ?? employee.status);
      return success(route, employee, "Employee status updated.");
    }

    if (pathname === "/api/admin/dashboard" && method === "GET") {
      return success(route, defaultDashboardData());
    }

    if (pathname === "/api/admin/notifications/latest" && method === "GET") {
      const limit = Number(searchParams.get("limit") ?? notifications.length);
      return success(route, notifications.slice(0, Math.max(0, limit)));
    }

    if (pathname === "/api/admin/notifications/unread-count" && method === "GET") {
      return success(route, {
        unreadCount: notifications.filter((item) => !item.isRead).length,
      });
    }

    if (pathname === "/api/admin/notifications/since" && method === "GET") {
      return success(route, notifications);
    }

    if (pathname === "/api/admin/notifications" && method === "GET") {
      return success(route, {
        items: notifications,
        pagination: {
          page: Number(searchParams.get("page") ?? "1"),
          limit: Number(searchParams.get("limit") ?? "20"),
          totalItems: notifications.length,
          totalPages: 1,
        },
      });
    }

    if (/^\/api\/admin\/notifications\/[^/]+\/read$/.test(pathname) && method === "PATCH") {
      const notificationId = pathname.split("/").slice(-2, -1)[0] ?? "";
      const notification = notifications.find((item) => item.id === notificationId);
      if (!notification) {
        return failure(route, 404, "Notification not found");
      }
      notification.isRead = true;
      return success(route, notification, "Notification updated.");
    }

    if (pathname === "/api/admin/notifications/read-all" && method === "PATCH") {
      notifications.forEach((item) => {
        item.isRead = true;
      });
      return success(route, { updatedCount: notifications.length }, "Notifications updated.");
    }

    if (pathname === "/api/admin/notification-preferences" && method === "GET") {
      return success(route, notificationPreferences);
    }

    if (pathname === "/api/admin/notification-preferences/modules" && method === "PUT") {
      const body = request.postDataJSON() as { preferences?: Array<Record<string, unknown>> };
      notificationPreferences = {
        ...notificationPreferences,
        modules: (body.preferences ?? []).map((item) => ({
          module: String(item.module ?? "system"),
          label: String(item.label ?? item.module ?? "System"),
          isEnabled: Boolean(item.isEnabled),
        })),
      };
      return success(route, { updated: notificationPreferences.modules.length });
    }

    if (pathname === "/api/admin/notification-preferences/types" && method === "PUT") {
      const body = request.postDataJSON() as { preferences?: Array<Record<string, unknown>> };
      notificationPreferences = {
        ...notificationPreferences,
        types: (body.preferences ?? []).map((item) => ({
          module: String(item.module ?? "system"),
          type: String(item.type ?? ""),
          label: String(item.label ?? item.type ?? ""),
          isEnabled: Boolean(item.isEnabled),
          source: item.source ? String(item.source) : undefined,
        })),
      };
      return success(route, { updated: notificationPreferences.types.length });
    }

    if (pathname === "/api/admin/notification-preferences" && method === "DELETE") {
      notificationPreferences = defaultNotificationPreferences();
      return success(route, { deleted: 1 });
    }

    if (pathname === "/api/admin/loyalty/settings" && method === "GET") {
      return success(route, {
        isEnabled: true,
        earnAmount: "100.00",
        earnPoints: "10.000",
        redeemPoints: "50.000",
        redeemAmount: "5.00",
        expirationDays: 365,
        pointsPrecision: 3,
        moneyPrecision: 2,
        roundingMode: "HALF_UP",
        minRedeemPoints: "0.000",
        maxRedeemPointsPerOrder: "0.000",
        minPayableAmountAfterRedeem: "0.00",
        expiringSoonThresholdDays: 7,
        earnBase: "PRODUCT_SUBTOTAL",
        allowPromoCodeStacking: true,
        allowManualDiscountStacking: true,
        version: 1,
      });
    }

    if (pathname === "/api/admin/calendar/orders" && method === "GET") {
      return success(route, []);
    }

    if (pathname === "/api/admin/calendar/canceled-orders" && method === "GET") {
      return success(route, []);
    }

    if (pathname === "/api/admin/calendar/events" && method === "GET") {
      return success(route, []);
    }

    if (pathname === "/api/admin/calendar/events" && method === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      return success(route, {
        id: "calendar-event-1",
        title: String(body.title ?? "Manual event"),
        date: String(body.date ?? "2026-03-29"),
      });
    }

    if (/^\/api\/admin\/calendar\/events\/[^/]+$/.test(pathname) && method === "PATCH") {
      const eventId = pathname.split("/").pop() ?? "calendar-event-1";
      const body = request.postDataJSON() as Record<string, unknown>;
      return success(route, {
        id: eventId,
        title: String(body.title ?? "Manual event"),
        date: String(body.date ?? "2026-03-29"),
      });
    }

    if (pathname === "/api/admin/calendar/settings" && method === "GET") {
      return success(route, calendarSettings);
    }

    if (pathname === "/api/admin/calendar/settings" && method === "PATCH") {
      const body = request.postDataJSON() as Record<string, unknown>;
      calendarSettings = {
        ...calendarSettings,
        ...body,
      };
      return success(route, calendarSettings, "Delivery settings updated.");
    }

    if (/^\/api\/admin\/orders\/[^/]+\/delivery-date$/.test(pathname) && method === "PATCH") {
      const orderId = pathname.split("/").slice(-2, -1)[0] ?? "1001";
      return success(route, {
        id: Number(orderId),
        status: "OUT_FOR_DELIVERY",
        deliveryDate: "2026-03-29",
      });
    }

    if (pathname === "/api/admin/loyalty/summary" && method === "GET") {
      return success(route, defaultLoyaltyOverview().summary);
    }

    if (pathname === "/api/admin/loyalty/overview" && method === "GET") {
      return success(route, defaultLoyaltyOverview());
    }

    if (pathname === "/api/admin/loyalty/users" && method === "GET") {
      return success(route, {
        items: [
          {
            userId: 1,
            name: "Mina Customer",
            email: "mina.customer@test.com",
            status: "ACTIVE",
            availablePoints: "900.000",
            pendingPoints: "50.000",
            redeemedPoints: "200.000",
            expiredPoints: "0.000",
            annulledPoints: "0.000",
            lifetimeEarned: "1200.000",
            lifetimeRedeemed: "300.000",
          },
        ],
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
      });
    }

    if (/^\/api\/admin\/loyalty\/users\/\d+\/summary$/.test(pathname) && method === "GET") {
      return success(route, {
        userId: 1,
        name: "Mina Customer",
        email: "mina.customer@test.com",
        availablePoints: "900.000",
        pendingPoints: "50.000",
        lifetimeEarned: "1200.000",
        redeemedPoints: "200.000",
        lifetimeRedeemed: "300.000",
        expiredPoints: "0.000",
        annulledPoints: "0.000",
        expiringSoon: [],
      });
    }

    if (/^\/api\/admin\/loyalty\/users\/\d+\/history$/.test(pathname) && method === "GET") {
      return success(route, {
        items: [],
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 1,
      });
    }

    if (pathname === "/admin/users" && method === "GET") {
      return success(route, defaultUsers());
    }

    if (pathname === "/products" && method === "GET") {
      return success(route, defaultProducts());
    }

    if (pathname === "/categories" && method === "GET") {
      return success(route, defaultCategories());
    }

    if (pathname === "/variants" && method === "GET") {
      return success(route, defaultVariants());
    }

    if (pathname === "/orders" && method === "GET") {
      return success(route, defaultOrders());
    }

    if ((pathname === "/leads" || pathname === "/api/leads") && method === "GET") {
      return success(route, defaultLeads());
    }

    if (pathname === "/admin/temp-orders" && method === "GET") {
      return success(route, defaultTempOrders());
    }

    if (pathname === "/api/pos/orders" && method === "GET") {
      return success(route, defaultPosOrders());
    }

    if (/^\/api\/pos\/order\/[^/]+$/.test(pathname) && method === "GET") {
      return success(route, defaultPosOrders().posOrders[0]);
    }

    if (pathname === "/api/pos/session/current" && method === "GET") {
      return success(route, {
        id: "session-1",
        openedAt: "2026-03-29T08:00:00.000Z",
        openingBalance: 500,
        status: "OPEN",
      });
    }

    if (pathname === "/api/pos/report/top-products" && method === "GET") {
      return success(route, {
        items: [
          {
            productId: 101,
            name: "Rose Bouquet",
            quantitySold: 5,
            totalRevenue: 1750,
          },
        ],
      });
    }

    if (pathname.startsWith("/api/pos/report/daily") && method === "GET") {
      return success(route, {
        date: searchParams.get("date") ?? "2026-03-29",
        totalSales: 350,
        totalTax: 0,
        totalDiscount: 0,
        ordersCount: 1,
        paymentBreakdown: [{ method: "CASH", amount: 350 }],
      });
    }

    if (/^\/api\/pos\/report\/session\/[^/]+$/.test(pathname) && method === "GET") {
      return success(route, {
        sessionId: pathname.split("/").pop(),
        totalSales: 350,
        totalOrders: 1,
      });
    }

    if (pathname === "/footer-settings" && method === "GET") {
      return success(route, { websiteName: "Admin Panel" });
    }

    if (pathname === "/homepage-control" && method === "GET") {
      return success(route, { logoUrl: "" });
    }

    if (method === "GET") {
      return success(route, {});
    }

    return failure(route, 500, `Unhandled mock request: ${method} ${pathname}`);
  };

  await page.route("http://127.0.0.1:4000/**", handler);
  await page.route("http://localhost:4000/**", handler);

  return {
    requests,
    getProfile: () => clone(profile),
    getRoles: () => clone(roles),
    getEmployees: () => clone(employees),
  };
}
