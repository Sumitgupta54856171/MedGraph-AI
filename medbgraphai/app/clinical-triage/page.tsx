'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import SubHeader from '../../components/SubHeader';
import Column1RawClinical from '../../components/Column1RawClinical';
import Column2SafetyGate from '../../components/Column2SafetyGate';
import Column3PatientDischarge from '../../components/Column3PatientDischarge';
import LiveResultModal from '../../components/LiveResultModal';
import {
  fetchHealth,
  runAnalyzePipeline,
  AnalyzeResponse,
} from '../../services/api';
import { authService, User } from '../../services/auth';
import axios from 'axios';

const DEFAULT_CLINICAL_NOTES =
  'Enter clinical notes here...';

const CASE_PRESETS: Record<number, string> = {
  1: 'Enter clinical notes for patient...',
  2: 'Enter clinical notes for patient...',
  3: 'Enter clinical notes for patient...',
};

export default function ClinicalTriagePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
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

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.role !== 'DOCTOR') {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const handleApprove = async () => {
    if (!user || user.role !== 'DOCTOR') {
      setSnackbar({
        open: true,
        message: 'Only doctors can approve encounters.',
        severity: 'error',
      });
      return;
    }

    try {
      const patientMrn = 'PT-8491';

      // First create the encounter in PostgreSQL
      const createResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/encounter/create`, {
        patient_mrn: patientMrn,
        doctor_id: user.id,
        raw_notes: clinicalNotes,
        sanitized_notes: analysisResult?.sanitized_notes || clinicalNotes,
        clinical_analysis: analysisResult?.clinical_analysis || '',
        status: 'LOCKED_PENDING_REVIEW',
      });

      const encounterId = createResponse.data.encounter_id;

      // Then approve it
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/encounter/approve`, {
        encounter_id: encounterId,
        doctor_name: user.name,
        patient_mrn: patientMrn,
        action: 'APPROVED',
        notes: 'Physician digitally reviewed contraindications and verified clinical safety.'
      });

      setIsPhysicianApproved(true);
      setSnackbar({
        open: true,
        message: `Encounter ${encounterId} created and approved by ${user.name}. Decision logged in FalkorDB.`,
        severity: 'success',
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `Approval failed: ${err.response?.data?.detail || 'Server error'}`,
        severity: 'error',
      });
    }
  };

  const handleSelectCase = (id: number) => {
    setSelectedCaseId(id);
    if (CASE_PRESETS[id]) {
      setClinicalNotes(CASE_PRESETS[id]);
      setIsPhysicianApproved(false);
    }
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

  // TanStack Query: Health check
  const { data: healthData, isError: isHealthError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000,
  });

  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);

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

  const handleRunFileAnalysis = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analyze/file`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setAnalysisResult(response.data);
      setIsPhysicianApproved(false);
      setSnackbar({
        open: true,
        message: `File analysis completed in ${response.data.telemetry.total_pipeline_ms}!`,
        severity: 'success',
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `File analysis failed: ${err.response?.data?.detail || 'Server error'}`,
        severity: 'error',
      });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      <Sidebar
        currentNav={currentNav}
        onSelectNav={setCurrentNav}
        user={user}
        onLogout={() => {
          authService.clearUser();
          window.location.href = '/';
        }}
      />

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
        <TopHeader
          humanInTheLoop={humanInTheLoop}
          onToggleHumanInTheLoop={setHumanInTheLoop}
          backendOnline={!isHealthError && !!healthData}
        />

        <SubHeader />

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
          <Column1RawClinical
            clinicalNotes={clinicalNotes}
            onChangeNotes={setClinicalNotes}
            onRunAnalysis={handleRunAnalysis}
            onRunFileAnalysis={handleRunFileAnalysis}
            isAnalyzing={analyzeMutation.isPending}
            onSelectCase={handleSelectCase}
            selectedCaseId={selectedCaseId}
          />

          <Column2SafetyGate
            analysisData={analysisResult}
            isPhysicianApproved={isPhysicianApproved}
            isDoctor={user?.role === 'DOCTOR'}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onReject={handleReject}
            onViewDeepDive={() => setIsModalOpen(true)}
          />

          <Column3PatientDischarge
            analysisData={analysisResult}
            isPhysicianApproved={isPhysicianApproved}
            onDialEmergency={handleDialEmergency}
          />
        </Box>
      </Box>

      <LiveResultModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysisData={analysisResult}
      />

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
