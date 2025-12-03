import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { Transaction, TransactionType } from '../types';
import { PlusCircle, MinusCircle, Save, X } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  onSave: (t: { type: TransactionType; amount: number; category: string; description: string; date: string }, id?: string) => void;
  onCancel: () => void;
  initialData: Transaction | null;
}

export const TransactionForm: React.FC<Props> = ({ onSave, onCancel, initialData }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const formRef = useRef<HTMLDivElement>(null);

  // Load initial data when editing
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDescription(initialData.description);
      setDate(initialData.date);
      
      // Animate focus to form when clicking edit
      if (formRef.current) {
        gsap.from(formRef.current, {
            boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.2)",
            duration: 0.5,
            clearProps: "boxShadow"
        });
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Reset defaults if initialData is cleared (Cancel/Save)
      setType('expense');
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData]);

  useLayoutEffect(() => {
    gsap.from(formRef.current, {
      y: -20,
      opacity: 0,
      duration: 0.5,
      ease: "power3.out",
      clearProps: "all"
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;

    onSave({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date
    }, initialData?.id);

    // Reset handled by useEffect when initialData becomes null
    // But if we are in add mode, we manually clear
    if (!initialData) {
        setAmount('');
        setDescription('');
        setCategory('');
        
        // Quick flash animation on success
        gsap.to(formRef.current, {
            borderColor: type === 'income' ? '#22c55e' : '#ef4444',
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            onComplete: () => gsap.set(formRef.current, { clearProps: 'borderColor' })
        });
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div ref={formRef} className={`bg-white p-6 rounded-2xl shadow-sm border mb-6 transition-colors ${initialData ? 'border-moni-300 ring-1 ring-moni-100' : 'border-gray-100'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {initialData ? (
             <><Save className="text-moni-600" size={20} /> Editar Movimiento</>
          ) : (
             type === 'income' ? <><PlusCircle className="text-moni-600"/> Registrar Ingreso</> : <><MinusCircle className="text-red-500"/> Registrar Gasto</>
          )}
        </h3>
        {initialData && (
          <button 
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full transition-colors"
          >
            <X size={14} /> Cancelar edición
          </button>
        )}
      </div>
      
      {!initialData && (
        <div className="flex gap-4 mb-4">
            <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                type === 'expense' 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'
            }`}
            >
            Gasto
            </button>
            <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                type === 'income' 
                ? 'bg-moni-100 text-moni-700 border border-moni-200' 
                : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'
            }`}
            >
            Ingreso
            </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 focus:border-moni-500 focus:ring-2 focus:ring-moni-200 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-moni-500 focus:ring-2 focus:ring-moni-200 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-moni-500 focus:ring-2 focus:ring-moni-200 outline-none transition-all bg-white"
          >
            <option value="">Selecciona una categoría...</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-moni-500 focus:ring-2 focus:ring-moni-200 outline-none transition-all"
            placeholder="Ej: Cena con amigos"
          />
        </div>

        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-transform active:scale-[0.98] shadow-sm ${
             type === 'income' ? 'bg-moni-600 hover:bg-moni-700' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {initialData ? 'Guardar Cambios' : (type === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto')}
        </button>
      </form>
    </div>
  );
};