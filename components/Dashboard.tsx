import React, { useMemo, useRef, useLayoutEffect, useState } from 'react';
import { MoniData, Subscription } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, BellRing, AlertOctagon, Sparkles, BrainCircuit, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { GoogleGenAI } from "@google/genai";

interface Props {
  data: MoniData;
  onUpdateAnalysis?: (content: string) => void;
  onNavigateSettings?: () => void;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const Dashboard: React.FC<Props> = ({ data, onUpdateAnalysis, onNavigateSettings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [analyzing, setAnalyzing] = useState(false);

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

      // Animate AI section
      gsap.from(".ai-card", {
        scale: 0.95,
        opacity: 0,
        duration: 0.8,
        delay: 0.1,
        ease: "power2.out",
        clearProps: "all"
      });
      
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
  }, [data]);

  // Helper to calculate upcoming reminders
  const reminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alerts: { sub: Subscription; daysUntil: number; type: 'payment' | 'cancel' }[] = [];

    data.subscriptions.forEach(sub => {
      if (!sub.active || !sub.reminderType || sub.reminderType === 'none') return;

      let nextBillingDate = new Date(today.getFullYear(), today.getMonth(), sub.billingDay);
      if (nextBillingDate < today) {
        nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, sub.billingDay);
      }

      const diffTime = nextBillingDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (sub.reminderType === 'payment') {
        const threshold = sub.reminderDays ?? 3;
        if (daysUntil <= threshold) {
          alerts.push({ sub, daysUntil, type: 'payment' });
        }
      } else if (sub.reminderType === 'cancel') {
        if (daysUntil <= 7) {
          alerts.push({ sub, daysUntil, type: 'cancel' });
        }
      }
    });

    return alerts.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [data.subscriptions]);

  const stats = useMemo(() => {
    const monthlyTransactions = data.transactions.filter(t => t.date.startsWith(currentMonth));
    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const subscriptionsTotal = data.subscriptions.filter(s => s.active).reduce((sum, s) => sum + s.amount, 0);
    const totalExpense = expense + subscriptionsTotal;
    const balance = income - totalExpense;

    const expensesByCategory: Record<string, number> = {};
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
      const catName = t.category.includes(':') ? t.category.split(':')[0] : t.category;
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + t.amount;
    });
    data.subscriptions.filter(s => s.active).forEach(s => {
      const catName = s.category.includes(':') ? s.category.split(':')[0] : s.category;
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + s.amount;
    });

    const chartData = Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return { income, totalExpense, balance, chartData, subscriptionsTotal, expensesByCategory };
  }, [data, currentMonth]);

  const currencyFormatter = (value: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

  const handleAnalyze = async () => {
      if (!data.apiKey || !onUpdateAnalysis) return;
      
      setAnalyzing(true);
      
      try {
          const ai = new GoogleGenAI({ apiKey: data.apiKey });
          
          const prompt = `
            Actúa como un asesor financiero personal experto.
            Analiza mis datos financieros de este mes (${currentMonth}):
            
            - Ingresos Totales: ${currencyFormatter(stats.income)}
            - Gastos Totales (incluyendo suscripciones): ${currencyFormatter(stats.totalExpense)}
            - Balance: ${currencyFormatter(stats.balance)}
            - Gastos por Categoría: ${JSON.stringify(stats.expensesByCategory)}
            - Suscripciones Activas: ${data.subscriptions.filter(s => s.active).map(s => `${s.name} ($${s.amount})`).join(', ')}
            
            Por favor, provee una respuesta corta y directa en texto plano (sin markdown complejo, usa saltos de línea) con:
            1. Un diagnóstico de 1 frase sobre mi salud financiera actual.
            2. Identifica 2 categorías donde estoy gastando mucho y sugiere una acción concreta para limitar gastos el próximo mes.
            3. Una recomendación de ahorro específica basada en mi balance.
            
            Usa un tono alentador pero profesional.
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });

          if (response.text) {
              onUpdateAnalysis(response.text);
          }
      } catch (error) {
          console.error("AI Error:", error);
          alert("Hubo un error conectando con Gemini. Verifica tu API Key.");
      } finally {
          setAnalyzing(false);
      }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* AI Advisor Card */}
      <div ref={aiRef} className="ai-card relative bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <BrainCircuit size={120} />
        </div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-yellow-300" />
                <h3 className="font-bold text-lg">Asesor Financiero IA</h3>
            </div>
            
            {!data.apiKey ? (
                <div>
                    <p className="mb-4 text-purple-100 text-sm">
                        Conecta tu API Key de Gemini para recibir análisis personalizados de tus gastos y consejos de ahorro.
                    </p>
                    <button 
                        onClick={onNavigateSettings}
                        className="bg-white text-purple-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-50 transition-colors"
                    >
                        Configurar API Key <ChevronRight size={16} />
                    </button>
                </div>
            ) : (
                <div>
                    {data.lastAnalysis ? (
                         <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-4">
                            <p className="text-sm leading-relaxed whitespace-pre-line font-medium">
                                {data.lastAnalysis.content}
                            </p>
                            <p className="text-[10px] text-purple-200 mt-2 text-right">
                                Analizado: {new Date(data.lastAnalysis.date).toLocaleDateString()}
                            </p>
                         </div>
                    ) : (
                        <p className="mb-4 text-purple-100 text-sm">
                            Obtén un análisis detallado de tus finanzas y descubre dónde puedes ahorrar.
                        </p>
                    )}
                    
                    <button 
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className={`bg-white text-purple-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-50 transition-colors shadow-sm ${analyzing ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {analyzing ? (
                            <><RefreshCw className="animate-spin" size={16}/> Analizando...</>
                        ) : (
                            <><Sparkles size={16}/> {data.lastAnalysis ? 'Actualizar Análisis' : 'Analizar mis Finanzas'}</>
                        )}
                    </button>
                </div>
            )}
        </div>
      </div>

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