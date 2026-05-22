import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  BarChart3,
  Award,
  UserCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  CrmCurrencyProvider,
  useCrmCurrency,
  CrmCurrency,
} from "@/context/CrmCurrencyContext";
import CrmDashboard from "./CrmDashboard";
import Orders from "./Orders";
import Closers from "./Closers";
import ClosersSettings from "./ClosersSettings.tsx";
import Commissions from "./Commissions";
import Customers from "./Customers";

type TabId = "dashboard" | "orders" | "closers" | "closers-settings" | "commissions" | "customers" | "analytics";
const CURRENCIES: CrmCurrency[] = ["MAD", "USD", "EUR"];

function CRMContent() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>("dashboard");
  const { currency, setCurrency } = useCrmCurrency();
  const { isAdmin } = useAuth();

  const TABS = [
    { id: "dashboard" as TabId, label: t('crm.dashboard'), icon: LayoutDashboard, hidden: false },
    { id: "orders" as TabId, label: t('crm.orders'), icon: ShoppingCart, hidden: false },
    { id: "closers" as TabId, label: t('crm.closers'), icon: Users, hidden: false },
    { id: "closers-settings" as TabId, label: t('crm.closersSettings'), icon: UserCircle, hidden: false },
    { id: "commissions" as TabId, label: t('crm.commissions'), icon: Award, hidden: false },
    { id: "customers" as TabId, label: t('crm.customers'), icon: UserCircle, hidden: true },
    { id: "analytics" as TabId, label: t('crm.analyticsTitle'), icon: BarChart3, hidden: true },
  ];

  const visibleTabs = useMemo(
    () =>
      TABS.filter(
        (tb) => !tb.hidden && (tb.id === "closers-settings" ? isAdmin : true),
      ),
    [isAdmin, t],
  );

  useEffect(() => {
    if (!isAdmin && tab === "closers-settings") setTab("dashboard");
  }, [isAdmin, tab]);

  return (
    <div className="min-h-full">
      {/* Tab bar + currency toggle */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between pr-4">
          <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-none">
            {visibleTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
                  tab === id
                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Currency picker */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shrink-0">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                  currency === c
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-6">
        {tab === "dashboard" && (
          <CrmDashboard onNavigate={(tb) => setTab(tb as TabId)} />
        )}
        {tab === "orders" && <Orders />}
        {tab === "closers" && <Closers />}
        {tab === "closers-settings" && <ClosersSettings />}
        {tab === "commissions" && <Commissions />}
        {tab === "customers" && <Customers />}
        {tab === "analytics" && (
          <CrmDashboard onNavigate={(tb) => setTab(tb as TabId)} analyticsMode />
        )}
      </div>
    </div>
  );
}

export default function CRMPage() {
  return (
    <CrmCurrencyProvider>
      <CRMContent />
    </CrmCurrencyProvider>
  );
}
