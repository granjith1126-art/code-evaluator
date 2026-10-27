import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProblemLibraryPage } from './pages/ProblemLibraryPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { SubmissionDetailPage } from './pages/SubmissionDetailPage';
import { ComparisonStudioPage } from './pages/ComparisonStudioPage';
import { ReviewStudioPage } from './pages/ReviewStudioPage';
import { DatasetPage } from './pages/DatasetPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Subtle Ambient Mesh Background Orbs */}
        <div className="ambient-bg" aria-hidden="true">
          <div className="ambient-orb-1" />
          <div className="ambient-orb-2" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col font-sans transition-colors duration-300">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/problems" element={<ProblemLibraryPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
              <Route path="/compare" element={<ComparisonStudioPage />} />
              <Route path="/reviews" element={<ReviewStudioPage />} />
              <Route path="/datasets" element={<DatasetPage />} />
              <Route path="/status" element={<SystemStatusPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
