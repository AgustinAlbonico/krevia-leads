import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export const Header: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/businesses?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-slate-700 hidden sm:block">
          Gestión de Negocios y Prospección
        </h1>
      </div>

      <form onSubmit={handleSearch} className="relative w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar negocio, ciudad o rubro..."
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />
      </form>
    </header>
  );
};
