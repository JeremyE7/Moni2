import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { MoniData, ReminderType, Subscription } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import { Trash2, Power, Plus, Calendar, Bell, AlertTriangle, Pencil, X } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  data: MoniData;
  onAdd: (s: { name: string; amount: number; category: string; billingDay: number; active: boolean; reminderType: ReminderType; reminderDays?: number }) => void;
  onEdit: (id: string, s: Partial<Subscription>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SubscriptionManager: React.FC<Props> = ({ data, onAdd, onEdit, onToggle, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [billingDay, setBillingDay] = useState(1);
  const [reminderType, setReminderType] = useState<ReminderType>('none');
  const [reminderDays, setReminderDays] = useState(3);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Animate the list when it mounts
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Kill any existing tweens on these elements to prevent conflicts
      gsap.killTweensOf(".sub-card");
      
      gsap.from(".sub-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "all" // Ensure inline styles are removed after animation
      });
    }, containerRef);
    return () => ctx.revert();
  }, [data.subscriptions.length]);

  // Animate the form when opening
  useEffect(() => {
    if (isFormOpen && formRef.current) {
        gsap.fromTo(formRef.current, 
            { height: 0, opacity: 0, marginBottom: 0 },
            { height: "auto", opacity: 1, marginBottom: 24, duration: 0.4, ease: "power3.out" }
        );
        // Scroll to form if editing
        if (editingId) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [isFormOpen, editingId]);

  const handleEditClick = (sub: Subscription) => {
    setEditingId(sub.id);
    setName(sub.name);
    setAmount(sub.amount.toString());
    setCategory(sub.category);
    setBillingDay(sub.billingDay);
    setReminderType(sub.reminderType || 'none');
    setReminderDays(sub.reminderDays || 3);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
      setIsFormOpen(false);
      setEditingId(null);
      setName('');
      setAmount('');
      setCategory('');
      setBillingDay(1);
      setReminderType('none');
      setReminderDays(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      amount: parseFloat(amount),
      category,
      billingDay,
      active: true,
      reminderType,
      reminderDays: reminderType === 'payment' ? reminderDays : undefined
    };

    if (editingId) {
        onEdit(editingId, payload);
    } else {
        onAdd(payload);
    }
    
    handleCancel();
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Suscripciones y Gastos Fijos</h2>
        {!isFormOpen && (
            <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-moni-600 text-white px-4 py-2 rounded-lg hover:bg-moni-700 transition-colors shadow-sm"
            >
            <Plus size={18} /> Nuevo
            </button>
        )}
      </div>

      {isFormOpen && (
        <div ref={formRef} className={`bg-white p-6 rounded-2xl shadow-md border overflow-hidden ${editingId ? 'border-moni-300 ring-1 ring-moni-100' : 'border-gray-100'}`}>
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-800">{editingId ? 'Editar Suscripción' : 'Nueva Suscripción'}</h3>
             <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Netflix, Alquiler, Gimnasio..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-moni-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Mensual</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-moni-500 outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-moni-500 outline-none bg-white"
                >
                  <option value="">Selecciona...</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Día de Cobro (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={billingDay}
                  onChange={(e) => setBillingDay(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-moni-500 outline-none"
                />
              </div>
            </div>

            {/* Reminder Section */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Bell size={16} /> Configuración de Alertas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de recordatorio</label>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value as ReminderType)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-moni-500 outline-none bg-white text-sm"
                  >
                    <option value="none">Sin recordatorio</option>
                    <option value="payment">Recordar pago próximo</option>
                    <option value="cancel">Recordar cancelar suscripción</option>
                  </select>
                </div>
                
                {reminderType === 'payment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Avisar días antes</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={reminderDays}
                      onChange={(e) => setReminderDays(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-moni-500 outline-none text-sm"
                    />
                  </div>
                )}
                
                {reminderType === 'cancel' && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg md:col-span-2">
                    <AlertTriangle size={14} />
                    Se te notificará todos los días durante la semana previa al cobro.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-moni-600 text-white rounded-lg hover:bg-moni-700 shadow-sm"
              >
                {editingId ? 'Actualizar' : 'Guardar Suscripción'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.subscriptions.map((sub) => (
          <div 
            key={sub.id} 
            className={`sub-card p-5 rounded-xl border transition-all relative group ${
              sub.active 
                ? 'bg-white border-gray-200 shadow-sm' 
                : 'bg-gray-50 border-gray-100 opacity-75'
            }`}
          >
            {/* Reminder Badge */}
            {sub.active && sub.reminderType && sub.reminderType !== 'none' && (
               <div className={`absolute top-4 right-4 p-1.5 rounded-full ${sub.reminderType === 'cancel' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600'}`} title={sub.reminderType === 'cancel' ? 'Alerta de cancelación activa' : 'Recordatorio de pago activo'}>
                 {sub.reminderType === 'cancel' ? <AlertTriangle size={14}/> : <Bell size={14}/>}
               </div>
            )}

            <div className="flex justify-between items-start mb-3 pr-8">
              <div>
                <h3 className="font-bold text-gray-800">{sub.name}</h3>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{sub.category}</p>
              </div>
            </div>
            <div className="mb-3">
               <span className="font-bold text-lg text-gray-900">${sub.amount}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Calendar size={14} />
              <span>Día de cobro: {sub.billingDay}</span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
              <button
                onClick={() => onToggle(sub.id)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  sub.active 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <Power size={12} />
                {sub.active ? 'Activo' : 'Pausado'}
              </button>
              
              <div className="flex items-center gap-1">
                 <button
                    onClick={() => handleEditClick(sub)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                 >
                    <Pencil size={16} />
                 </button>
                 <button
                    onClick={() => onDelete(sub.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                 >
                    <Trash2 size={16} />
                 </button>
              </div>
            </div>
          </div>
        ))}

        {data.subscriptions.length === 0 && !isFormOpen && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl">
            <p>No tienes suscripciones registradas.</p>
            <p className="text-sm">Agrega gastos recurrentes como Netflix, alquiler o internet.</p>
          </div>
        )}
      </div>
    </div>
  );
};