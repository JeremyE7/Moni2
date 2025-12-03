import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { MoniData, Subscription } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, BellRing, AlertOctagon } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  data: MoniData;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const Dashboard: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animate summary cards
      gsap.from(".summary-card", {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.2)",
        clearProps: "all"
      });

      // Animate charts and lists
      gsap.from(".dashboard-section", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        stagger: 0.15,
        ease: "power3.out",
        clearProps: "all"
      });

      // Animate alerts if any
      if (document.querySelector(".alert-card")) {
        gsap.from(".alert-card", {
          x: -20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.1,
          clearProps: "all"
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [data]); // Re-run when data updates to catch new alerts or changes

  // Helper to calculate upcoming reminders
  const reminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alerts: { sub: Subscription; daysUntil: number; type: 'payment' | 'cancel' }[] = [];

    data.subscriptions.forEach(sub => {
      if (!sub.active || !sub.reminderType || sub.reminderType === 'none') return;

      // Determine next billing date
      let nextBillingDate = new Date(today.getFullYear(), today.getMonth(), sub.billingDay);
      // If billing day already passed this month, look at next month
      if (nextBillingDate < today) {
        nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, sub.billingDay);
      }

      const diffTime = nextBillingDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Check conditions
      if (sub.reminderType === 'payment') {
        // Default to 3 days if not specified
        const threshold = sub.reminderDays ?? 3;
        if (daysUntil <= threshold) {
          alerts.push({ sub, daysUntil, type: 'payment' });
        }
      } else if (sub.reminderType === 'cancel') {
        // Fixed 7 days for cancellation
        if (daysUntil <= 7) {
          alerts.push({ sub, daysUntil, type: 'cancel' });
        }
      }
    });

    return alerts.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [data.subscriptions]);

  const stats = useMemo(() => {
    // Filter transactions for current month
    const monthlyTransactions = data.transactions.filter(t => t.date.startsWith(currentMonth));
    
    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate active subscriptions total
    const subscriptionsTotal = data.subscriptions
      .filter(s => s.active)
      .reduce((sum, s) => sum + s.amount, 0);

    const totalExpense = expense + subscriptionsTotal;
    const balance = income - totalExpense;

    // Group expenses by category for Pie Chart
    const expensesByCategory: Record<string, number> = {};
    
    // Add transaction expenses
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
      const catName = t.category.includes(':') ? t.category.split(':')[0] : t.category;
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + t.amount;
    });

    // Add subscription expenses
    data.subscriptions.filter(s => s.active).forEach(s => {
      const catName = s.category.includes(':') ? s.category.split(':')[0] : s.category;
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + s.amount;
    });

    const chartData = Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories

    return { income, totalExpense, balance, chartData, subscriptionsTotal };
  }, [data, currentMonth]);

  const currencyFormatter = (value: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Notifications Area */}
      {reminders.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recordatorios Pendientes</h3>
          {reminders.map((item) => (
            <div 
              key={item.sub.id} 
              className={`alert-card p-4 rounded-xl border flex items-center gap-4 shadow-sm ${
                item.type === 'cancel' 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}
            >
              <div className={`p-2 rounded-full ${item.type === 'cancel' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                {item.type === 'cancel' ? <AlertOctagon size={24} /> : <BellRing size={24} />}
              </div>
              <div>
                <p className="font-bold text-lg">
                  {item.type === 'cancel' ? '¡Cancelar Suscripción!' : 'Pago Próximo'}
                </p>
                <p className="text-sm opacity-90">
                  {item.type === 'cancel' 
                    ? `Recuerda cancelar ${item.sub.name}. Vence en ${item.daysUntil === 0 ? 'hoy' : `${item.daysUntil} días`}.`
                    : `El pago de ${item.sub.name} (${currencyFormatter(item.sub.amount)}) es en ${item.daysUntil === 0 ? 'hoy' : `${item.daysUntil} días`}.`
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="summary-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Ingresos (Mes)</p>
            <h3 className="text-2xl font-bold text-gray-800">{currencyFormatter(stats.income)}</h3>
          </div>
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="summary-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Gastos Totales</p>
            <h3 className="text-2xl font-bold text-gray-800">{currencyFormatter(stats.totalExpense)}</h3>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <RefreshCw size={12}/> Incluye {currencyFormatter(stats.subscriptionsTotal)} en suscripciones
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="summary-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Balance</p>
            <h3 className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-moni-600' : 'text-red-500'}`}>
              {currencyFormatter(stats.balance)}
            </h3>
          </div>
          <div className={`p-3 rounded-full ${stats.balance >= 0 ? 'bg-moni-100 text-moni-600' : 'bg-red-100 text-red-600'}`}>
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-section bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-6">Gastos por Categoría</h4>
          {stats.chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(value: number) => currencyFormatter(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay gastos registrados este mes
            </div>
          )}
        </div>

        {/* Recent Transactions List (Mini) */}
        <div className="dashboard-section bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Últimos Movimientos</h4>
          <div className="overflow-y-auto max-h-64 pr-2 space-y-3">
            {data.transactions.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${t.type === 'income' ? 'bg-moni-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{t.category}</p>
                    <p className="text-xs text-gray-500">{t.date} {t.description && `• ${t.description}`}</p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-moni-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{currencyFormatter(t.amount)}
                </span>
              </div>
            ))}
            {data.transactions.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Sin movimientos recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};