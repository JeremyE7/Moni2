import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useMoniData } from './hooks/useMoniData';
import { ViewState } from './types';
import { LayoutGrid, List, Repeat, Settings, Wallet, Pencil, Trash2, Calendar } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { SubscriptionManager } from './components/SubscriptionManager';
import { DataTools } from './components/DataTools';
import { Transaction } from './types';
import gsap from 'gsap';

// Extracted Component for better Ref handling
interface TransactionListProps {
    transactions: Transaction[];
    onDelete: (id: string) => void;
    onEdit: (t: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit }) => {
    const listRef = useRef<HTMLTableSectionElement>(null);
    
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            if (transactions.length > 0) {
                gsap.from("tr", {
                    x: -20,
                    opacity: 0,
                    stagger: 0.05,
                    duration: 0.4,
                    ease: "power2.out",
                    clearProps: "all"
                });
            }
        }, listRef);
        return () => ctx.revert();
    }, [transactions]); // Re-animate when list changes

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Monto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Acción</th>
                </tr>
            </thead>
            <tbody ref={listRef} className="divide-y divide-gray-100">
                {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{t.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{t.description || '-'}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-moni-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(t)}
                            className="text-gray-400 hover:text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={() => onDelete(t.id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
                {transactions.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No hay transacciones registradas en este periodo.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    );
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // State for date filtering
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const mainRef = useRef<HTMLDivElement>(null);
  
  const { 
    data, 
    addTransaction, 
    editTransaction,
    deleteTransaction,
    addSubscription,
    editSubscription,
    toggleSubscription,
    deleteSubscription,
    exportData,
    importData,
    clearAllData
  } = useMoniData();

  // Filter transactions based on selected month/year
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter(t => t.date.startsWith(filterDate));
  }, [data.transactions, filterDate]);

  // Animate view transitions
  useLayoutEffect(() => {
    gsap.fromTo(mainRef.current, 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, [view]);

  const handleSaveTransaction = (t: any, id?: string) => {
    if (id) {
        editTransaction(id, t);
        setEditingTransaction(null);
    } else {
        addTransaction(t);
    }
  };

  const NavButton = ({ target, icon: Icon, label }: { target: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => setView(target)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        view === target 
          ? 'bg-moni-600 text-white shadow-md shadow-moni-200' 
          : 'text-gray-500 hover:bg-white hover:text-moni-600'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-moni-600">
            <div className="p-2 bg-moni-100 rounded-lg">
              <Wallet size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Moni</span>
          </div>

          <nav className="flex items-center gap-1 md:gap-2">
            <NavButton target="dashboard" icon={LayoutGrid} label="Panel" />
            <NavButton target="transactions" icon={List} label="Movimientos" />
            <NavButton target="subscriptions" icon={Repeat} label="Suscripciones" />
            <NavButton target="settings" icon={Settings} label="Datos" />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main ref={mainRef} className="max-w-6xl mx-auto px-4 py-8">
        {view === 'dashboard' && (
           <div>
             <div className="mb-8">
               <h1 className="text-2xl font-bold text-gray-800 mb-2">Resumen Financiero</h1>
               <p className="text-gray-500">Un vistazo general a tus finanzas de este mes.</p>
             </div>
             <Dashboard data={data} />
           </div>
        )}

        {view === 'transactions' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Movimientos</h1>
                <p className="text-gray-500">Registra y visualiza todos tus ingresos y gastos.</p>
              </div>
              
              <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                 <span className="text-sm font-medium text-gray-500 flex items-center gap-2 pl-2">
                    <Calendar size={16} /> Periodo:
                 </span>
                 <input 
                    type="month" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-gray-50 border-0 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-moni-200 block px-3 py-1.5 outline-none font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                 />
              </div>
            </div>

            <TransactionForm 
                onSave={handleSaveTransaction} 
                initialData={editingTransaction}
                onCancel={() => setEditingTransaction(null)}
            />

            <TransactionList 
                transactions={filteredTransactions} 
                onDelete={deleteTransaction} 
                onEdit={setEditingTransaction}
            />
          </div>
        )}

        {view === 'subscriptions' && (
          <div>
             <SubscriptionManager 
                data={data}
                onAdd={addSubscription}
                onEdit={editSubscription}
                onToggle={toggleSubscription}
                onDelete={deleteSubscription}
             />
          </div>
        )}

        {view === 'settings' && (
          <div>
            <DataTools 
              onExport={exportData}
              onImport={importData}
              onClear={clearAllData}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;