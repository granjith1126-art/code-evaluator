import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
  );
};

export default App;
