import React, { useRef, useState, useLayoutEffect } from 'react';
import { Download, Upload, AlertTriangle, FileJson, Trash2, Key, Save, Eye, EyeOff } from 'lucide-react';
import gsap from 'gsap';

interface Props {
  onExport: () => void;
  onImport: (json: string) => { success: boolean; message: string };
  onClear: () => void;
}

interface ExtendedProps extends Props {
    apiKey?: string;
    onSaveKey: (key: string) => void;
}

export const DataTools: React.FC<ExtendedProps> = ({ onExport, onImport, onClear, apiKey = '', onSaveKey }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

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

  const handleSaveKey = () => {
      onSaveKey(localKey);
      setMessage({ text: "API Key guardada correctamente.", type: "success" });
      setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div ref={containerRef} className="space-y-6 mb-20">
      <h2 className="text-xl font-bold text-gray-800">Configuración y Datos</h2>
      
      {/* AI Settings */}
      <div className="tool-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                 <Key size={24} />
             </div>
             <div>
                <h3 className="font-bold text-gray-800">Gemini AI API Key</h3>
                <p className="text-sm text-gray-500">Para activar el asesor financiero inteligente.</p>
             </div>
         </div>
         
         <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Tu Clave de API
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type={showKey ? "text" : "password"} 
                        value={localKey}
                        onChange={(e) => setLocalKey(e.target.value)}
                        placeholder="Pegar tu API Key aquí..."
                        className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                    />
                    <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <button 
                    onClick={handleSaveKey}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <Save size={18} /> <span className="hidden sm:inline">Guardar</span>
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
                La clave se guarda localmente en tu dispositivo. Puedes obtener una en <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Google AI Studio</a>.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="tool-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
            <Download size={32} />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Exportar Datos</h3>
          <p className="text-sm text-gray-500 mb-6">Descarga una copia de seguridad de transacciones, suscripciones y configuración.</p>
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
          <p className="text-sm text-gray-500 mb-6">Restaura una copia de seguridad seleccionando un archivo JSON.</p>
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
        <div className={`p-4 rounded-lg flex items-center gap-2 fixed bottom-20 left-4 right-4 md:bottom-10 md:left-auto md:right-10 md:w-auto shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
           <FileJson size={20} />
           <span className="font-medium">{message.text}</span>
        </div>
      )}
    </div>
  );
};