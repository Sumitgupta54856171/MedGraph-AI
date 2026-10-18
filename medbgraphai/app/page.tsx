'use client';

import React, { useState } from 'react';
import {
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import SubHeader from '../components/SubHeader';
import Column1RawClinical from '../components/Column1RawClinical';
import Column2SafetyGate from '../components/Column2SafetyGate';
import Column3PatientDischarge from '../components/Column3PatientDischarge';
import LiveResultModal from '../components/LiveResultModal';
import {
  fetchHealth,
  runAnalyzePipeline,
  AnalyzeResponse,
} from '../services/api';

const DEFAULT_CLINICAL_NOTES =
  'Pt 58M c/o acute substernal CP radiating to L arm. Hx of AFib on Warfarin 5mg. Prescribed Aspirin 325mg daily + Atorvastatin 40mg. Discharge home w/ follow-up in 48h.';

const CASE_PRESETS: Record<number, string> = {
  1: 'Pt 58M c/o acute substernal CP radiating to L arm. Hx of AFib on Warfarin 5mg. Prescribed Aspirin 325mg daily + Atorvastatin 40mg. Discharge home w/ follow-up in 48h.',
  2: 'Pt 64F with chronic AFib taking Warfarin 5mg daily. Presented with severe osteoarthritis flare. Prescribed high-dose NSAID daily. High DDI risk assessment requested.',
  3: 'Pt 42M with atypical non-cardiac chest discomfort after exertion. No history of anticoagulants. Routine cardiac workup and outpatient treadmill follow-up.',
};

export default function ClinicalTriageDashboard() {
  const [currentNav, setCurrentNav] = useState('Clinical Triage');
  const [humanInTheLoop, setHumanInTheLoop] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState(1);
  const [clinicalNotes, setClinicalNotes] = useState(DEFAULT_CLINICAL_NOTES);
  const [isPhysicianApproved, setIsPhysicianApproved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // TanStack Query: Health check
  const { data: healthData, isError: isHealthError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000,
  });

  // ONLY real API data: null initially, filled only when /api/analyze responds
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);

  // TanStack Query: Mutation for running the multi-agent AMD analysis
  const analyzeMutation = useMutation({
    mutationFn: runAnalyzePipeline,
    onSuccess: (data) => {
      setAnalysisResult(data);
      setIsPhysicianApproved(false);
      setSnackbar({
        open: true,
        message: `Analysis completed in ${data.telemetry.total_pipeline_ms}! Live API data loaded.`,
        severity: 'success',
      });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: `Pipeline call failed: ${err?.message || 'Server error'}. Please verify backend at :8000.`,
        severity: 'error',
      });
    },
  });

  const handleRunAnalysis = () => {
    analyzeMutation.mutate({
      clinical_notes: clinicalNotes,
      target_language: 'English',
      autonomous_floor: 80,
    });
  };

  const handleSelectCase = (id: number) => {
    setSelectedCaseId(id);
    if (CASE_PRESETS[id]) {
      setClinicalNotes(CASE_PRESETS[id]);
      setIsPhysicianApproved(false);
    }
  };

  const handleApprove = () => {
    setIsPhysicianApproved(true);
    setSnackbar({
      open: true,
      message: 'Attending signature verified: Summary digitally approved by Dr. Sarah Jenkins.',
      severity: 'success',
    });
  };

  const handleEdit = () => {
    setSnackbar({
      open: true,
      message: 'Entering clinical note edit mode.',
      severity: 'info',
    });
  };

  const handleReject = () => {
    setIsPhysicianApproved(false);
    setSnackbar({
      open: true,
      message: 'Summary rejected: Patient discharge held for re-evaluation.',
      severity: 'warning',
    });
  };

  const handleDialEmergency = () => {
    setSnackbar({
      open: true,
      message: 'Connecting to Emergency Cardiac Desk: (555) 019-2834...',
      severity: 'error',
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      {/* 1. Left Sidebar Navigation */}
      <Sidebar currentNav={currentNav} onSelectNav={setCurrentNav} />

      {/* 2. Main Content Column */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          backgroundColor: '#f8fafc',
        }}
      >
        {/* Top Header Bar */}
        <TopHeader
          humanInTheLoop={humanInTheLoop}
          onToggleHumanInTheLoop={setHumanInTheLoop}
          backendOnline={!isHealthError && !!healthData}
        />

        {/* Sub Header (Patient & Session info) */}
        <SubHeader />

        {/* 3-Column Clinical Dashboard Grid */}
        <Box
          sx={{
            p: 3,
            flex: 1,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)',
            },
            gap: 2.5,
            alignItems: 'stretch',
          }}
        >
          {/* Column 1: Raw Clinical Input */}
          <Column1RawClinical
            clinicalNotes={clinicalNotes}
            onChangeNotes={setClinicalNotes}
            onRunAnalysis={handleRunAnalysis}
            isAnalyzing={analyzeMutation.isPending}
            onSelectCase={handleSelectCase}
            selectedCaseId={selectedCaseId}
          />

          {/* Column 2: Clinical Extraction & Safety Gate (Only real API data, filtered) */}
          <Column2SafetyGate
            analysisData={analysisResult}
            isPhysicianApproved={isPhysicianApproved}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onReject={handleReject}
            onViewDeepDive={() => setIsModalOpen(true)}
          />

          {/* Column 3: Patient-Friendly Discharge (Only real API data, filtered) */}
          <Column3PatientDischarge
            analysisData={analysisResult}
            isPhysicianApproved={isPhysicianApproved}
            onDialEmergency={handleDialEmergency}
          />
        </Box>
      </Box>

      {/* Modal for Deep-Dive Pipeline & Graph Reasoning */}
      <LiveResultModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysisData={analysisResult}
      />

      {/* Feedback Snackbars */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
