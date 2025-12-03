import React, { useRef, useState, useLayoutEffect } from 'react';
import { Download, Upload, AlertTriangle, FileJson, Trash2 } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  onExport: () => void;
  onImport: (json: string) => { success: boolean; message: string };
  onClear: () => void;
}

export const DataTools: React.FC<Props> = ({ onExport, onImport, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
        gsap.from(".tool-card", {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out"
        });
        gsap.from(".danger-zone", {
            opacity: 0,
            y: 10,
            duration: 0.5,
            delay: 0.3,
            ease: "power2.out"
        });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = onImport(content);
      setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Gestión de Datos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="tool-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
            <Download size={32} />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Exportar Datos</h3>
          <p className="text-sm text-gray-500 mb-6">Descarga una copia de seguridad de todas tus transacciones y suscripciones en formato JSON.</p>
          <button
            onClick={onExport}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Descargar Respaldo
          </button>
        </div>

        {/* Import Card */}
        <div className="tool-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-moni-50 rounded-full flex items-center justify-center text-moni-500 mb-4">
            <Upload size={32} />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Importar Datos</h3>
          <p className="text-sm text-gray-500 mb-6">Restaura una copia de seguridad seleccionando un archivo JSON previamente exportado.</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 bg-moni-600 hover:bg-moni-700 text-white rounded-lg font-medium transition-colors"
          >
            Seleccionar Archivo
          </button>
        </div>
      </div>

       {/* Danger Zone */}
       <div className="danger-zone bg-red-50 p-6 rounded-2xl border border-red-100">
          <div className="flex items-start gap-4">
             <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                <AlertTriangle size={24} />
             </div>
             <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-1">Zona de Peligro</h3>
                <p className="text-sm text-red-700 mb-4">
                   Esta acción borrará permanentemente todos tus registros guardados en este navegador. Asegúrate de exportar tus datos antes de continuar.
                </p>
                <button 
                  onClick={onClear}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16}/> Borrar todo
                </button>
             </div>
          </div>
       </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
           <FileJson size={20} />
           <span className="font-medium">{message.text}</span>
        </div>
      )}
    </div>
  );
};