/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './about';
import DepartmentsPage from './departments';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Home Page (Preserved 100% as before) */}
        <Route path="/" element={<HomePage />} />

        {/* Dedicated About Page (Modular: see src/about/ folder to edit or remove) */}
        <Route path="/about" element={<AboutPage />} />

        {/* Dedicated Departments Page (Modular: see src/departments/ folder to edit or remove) */}
        <Route path="/departments" element={<DepartmentsPage />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
