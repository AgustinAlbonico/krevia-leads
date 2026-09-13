import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Cities } from './pages/Cities';
import { CityDetail } from './pages/CityDetail';
import { Businesses } from './pages/Businesses';
import { BusinessDetail } from './pages/BusinessDetail';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cities" element={<Cities />} />
          <Route path="cities/:id" element={<CityDetail />} />
          <Route path="businesses" element={<Businesses />} />
          <Route path="businesses/:id" element={<BusinessDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
