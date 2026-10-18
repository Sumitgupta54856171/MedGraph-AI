'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import BoltIcon from '@mui/icons-material/Bolt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

interface Column1Props {
  clinicalNotes: string;
  onChangeNotes: (notes: string) => void;
  onRunAnalysis: () => void;
  onRunFileAnalysis: (file: File) => void;
  isAnalyzing: boolean;
  onSelectCase: (caseId: number) => void;
  selectedCaseId: number;
}

export default function Column1RawClinical({
  clinicalNotes,
  onChangeNotes,
  onRunAnalysis,
  onRunFileAnalysis,
  isAnalyzing,
  onSelectCase,
  selectedCaseId,
}: Column1Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const toggleMic = () => {
    setIsRecording(!isRecording);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      onRunFileAnalysis(file);
    }
  };

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: '#0077b6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            1
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1.05rem',
              color: '#0f172a',
              letterSpacing: '-0.01em',
            }}
          >
            Raw Clinical Input
          </Typography>
        </Box>

        <Button
          onClick={toggleMic}
          size="small"
          startIcon={
            <MicIcon
              sx={{
                fontSize: 16,
                color: isRecording ? '#dc2626' : '#e11d48',
              }}
            />
          }
          sx={{
            backgroundColor: isRecording ? '#fee2e2' : '#ffe4e6',
            color: '#e11d48',
            borderRadius: '20px',
            px: 1.6,
            py: 0.4,
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#fecdd3',
            },
          }}
        >
          {isRecording ? 'Listening...' : 'Live Mic'}
        </Button>
      </Box>

      {/* QUICK CLINICAL CASES */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.05em',
            fontSize: '0.7rem',
            display: 'block',
            mb: 0.8,
            textTransform: 'uppercase',
          }}
        >
          Quick Clinical Cases
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { id: 1, label: 'Case 1: Cardiac Discharge' },
            { id: 2, label: 'Case 2: Drug Alert' },
            { id: 3, label: 'Case 3: Low Conf. Triage' },
          ].map((c) => {
            const isSelected = selectedCaseId === c.id;
            return (
              <Chip
                key={c.id}
                label={c.label}
                onClick={() => onSelectCase(c.id)}
                clickable
                size="small"
                sx={{
                  backgroundColor: isSelected ? '#e0f2fe' : '#f1f5f9',
                  color: isSelected ? '#0369a1' : '#475569',
                  border: isSelected
                    ? '1px solid #bae6fd'
                    : '1px solid transparent',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.74rem',
                  height: 28,
                  borderRadius: '14px',
                  '&:hover': {
                    backgroundColor: isSelected ? '#bae6fd' : '#e2e8f0',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Clinical Encounter Notes / EHR Dictation */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0.8,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#1e293b',
            }}
          >
            Clinical Encounter Notes / EHR Dictation
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              px: 0.8,
              py: 0.2,
              borderRadius: '4px',
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 13, color: '#059669' }} />
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#059669',
              }}
            >
              PII Masked
            </Typography>
          </Box>
        </Box>

        <TextField
          multiline
          rows={5}
          fullWidth
          value={clinicalNotes}
          onChange={(e) => onChangeNotes(e.target.value)}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#fafafa',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: '#1e293b',
              lineHeight: 1.5,
              '& fieldset': {
                borderColor: '#e2e8f0',
              },
              '&:hover fieldset': {
                borderColor: '#cbd5e1',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0284c7',
              },
            },
          }}
        />

        {/* File Upload Section */}
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.05em',
              fontSize: '0.7rem',
              display: 'block',
              mb: 0.8,
              textTransform: 'uppercase',
            }}
          >
            Upload Clinical Document (PDF/Image)
          </Typography>
          <Box
            sx={{
              border: '2px dashed #cbd5e1',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#0284c7',
                backgroundColor: '#f0f9ff',
              },
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <CloudUploadIcon sx={{ fontSize: 32, color: '#64748b', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {uploadedFile ? uploadedFile.name : 'Click to upload PDF or image'}
            </Typography>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </Box>
        </Box>

        {/* Notes Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 0.6,
            px: 0.5,
          }}
        >
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            Tokens:{' '}
            <Box component="span" sx={{ fontWeight: 600 }}>
              {Math.max(20, Math.round(clinicalNotes.length / 3.8))}
            </Box>{' '}
            • Latency: 12ms
          </Typography>
          <Typography
            sx={{
              fontSize: '0.72rem',
              color: '#16a34a',
              fontWeight: 600,
            }}
          >
            De-identification: Active
          </Typography>
        </Box>
      </Box>

      {/* HIPAA / De-identification Notice Card */}
      <Box
        sx={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #e0f2fe',
          borderRadius: '8px',
          p: 1.4,
          display: 'flex',
          gap: 1.2,
          alignItems: 'flex-start',
        }}
      >
        <SecurityIcon sx={{ fontSize: 18, color: '#0284c7', mt: 0.2 }} />
        <Typography
          sx={{
            fontSize: '0.72rem',
            color: '#0369a1',
            lineHeight: 1.4,
          }}
        >
          Patient Name & MRN automatically masked before LLM inference via
          HIPAA-compliant on-prem gateway on{' '}
          <Box component="span" sx={{ fontWeight: 700 }}>
            AMD ROCm MI300X
          </Box>{' '}
          cluster.
        </Typography>
      </Box>

      {/* TRIAGE VITALS CHECK */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.05em',
            fontSize: '0.7rem',
            display: 'block',
            mb: 1,
            textTransform: 'uppercase',
          }}
        >
          Triage Vitals Check
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          {/* BP */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              p: 1,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.68rem',
                color: '#64748b',
                fontWeight: 700,
              }}
            >
              BP
            </Typography>
            <Typography
              sx={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              138/88
            </Typography>
          </Box>

          {/* HR (irreg) */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: '#fee2e2',
              borderRadius: '8px',
              p: 1,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.68rem',
                color: '#dc2626',
                fontWeight: 700,
              }}
            >
              HR
            </Typography>
            <Typography
              sx={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#dc2626',
              }}
            >
              82
            </Typography>
            <Typography
              sx={{
                fontSize: '0.62rem',
                color: '#dc2626',
                fontWeight: 600,
              }}
            >
              (irreg)
            </Typography>
          </Box>

          {/* SpO2 */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: '#e0f2fe',
              borderRadius: '8px',
              p: 1,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.68rem',
                color: '#0284c7',
                fontWeight: 700,
              }}
            >
              SpO2
            </Typography>
            <Typography
              sx={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#0284c7',
              }}
            >
              98%
            </Typography>
          </Box>

          {/* Pain */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              p: 1,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.68rem',
                color: '#d97706',
                fontWeight: 700,
              }}
            >
              Pain
            </Typography>
            <Typography
              sx={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#d97706',
              }}
            >
              6 / 10
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Bottom Action Button: Run Multi-Model AMD Analysis */}
      <Box sx={{ mt: 'auto', pt: 1 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          sx={{
            backgroundColor: '#004e7c',
            color: '#ffffff',
            borderRadius: '8px',
            py: 1.4,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.3,
            '&:hover': {
              backgroundColor: '#003a5c',
            },
          }}
        >
          {isAnalyzing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} sx={{ color: '#38bdf8' }} />
              <Typography sx={{ fontSize: '0.86rem', fontWeight: 700 }}>
                Running AMD ROCm & FalkorDB Pipeline...
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <BoltIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
                <Typography
                  sx={{
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Run Multi-Model AMD Analysis
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  color: '#93c5fd',
                  fontWeight: 500,
                }}
              >
                Hardware Acceleration: MI300X • ROCm 6.2
              </Typography>
            </>
          )}
        </Button>
      </Box>
    </Card>
  );
}
