'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import HubIcon from '@mui/icons-material/Hub';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AnalyzeResponse } from '../services/api';
import { cleanOutput, parseClinicalAnalysis } from '../utils/cleanOutput';

interface LiveResultModalProps {
  open: boolean;
  onClose: () => void;
  analysisData: AnalyzeResponse | null;
}

export default function LiveResultModal({
  open,
  onClose,
  analysisData,
}: LiveResultModalProps) {
  if (!analysisData) return null;

  const parsed = parseClinicalAnalysis(analysisData.clinical_analysis);
  const cleanFull = cleanOutput(analysisData.clinical_analysis);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <MemoryIcon sx={{ color: '#38bdf8' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
              AMD ROCm &amp; FalkorDB Multi-Agent Pipeline Trace
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Dual-LLM Safety Verification • {analysisData.telemetry.graph_database}
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<SpeedIcon sx={{ fontSize: 14, color: '#ffffff !important' }} />}
          label={`Total Latency: ${analysisData.telemetry.total_pipeline_ms}`}
          size="small"
          sx={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: 700,
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Agent Trace */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            color: '#0f172a',
            mb: 1.5,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: '0.75rem',
          }}
        >
          1. Multi-Agent Pipeline Execution Trace
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          {analysisData.telemetry.agent_trace.map((step, idx) => (
            <Box
              key={idx}
              sx={{
                flex: 1,
                minWidth: 140,
                p: 1.5,
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                {step.agent}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 0.3 }}>
                {step.status ? `Status: ${step.status}` : `Latency: ${step.latency_ms}ms`}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* FalkorDB Knowledge Graph Paths */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            color: '#0f172a',
            mb: 1.5,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <HubIcon sx={{ fontSize: 16, color: '#0284c7' }} />
          2. FalkorDB Graph Reasoning Paths (Multi-Hop)
        </Typography>

        {analysisData.graph_paths && analysisData.graph_paths.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            {analysisData.graph_paths.map((p, idx) => (
              <Box
                key={idx}
                sx={{
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '8px',
                  p: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    color: '#991b1b',
                    fontWeight: 700,
                  }}
                >
                  {cleanOutput(p.path)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={`Risk: ${cleanOutput(p.risk)}`}
                    size="small"
                    sx={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.68rem' }}
                  />
                  <Chip
                    label={`Severity: ${cleanOutput(p.severity)}`}
                    size="small"
                    sx={{ backgroundColor: '#b91c1c', color: '#ffffff', fontWeight: 800, fontSize: '0.68rem' }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 3 }}>
            No contraindications detected in graph traversals.
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Gemma-4-31B-IT Clinical Safety Assessment (Filtered and Cleaned) */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            color: '#0f172a',
            mb: 1.5,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <SecurityIcon sx={{ fontSize: 16, color: '#059669' }} />
          3. Gemma-4-31B-IT Clinical Safety Assessment (Clean Filtered Output)
        </Typography>

        {parsed.warning && (
          <Box
            sx={{
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '8px',
              p: 1.5,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
              <WarningAmberIcon sx={{ fontSize: 18, color: '#dc2626' }} />
              <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#b91c1c' }}>
                High-Priority Clinical Warning
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.76rem', color: '#7f1d1d', lineHeight: 1.5 }}>
              {parsed.warning}
            </Typography>
          </Box>
        )}

        {/* Full Clean Output Presentation without ** or ## */}
        <Box
          sx={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            p: 2,
            maxHeight: 280,
            overflowY: 'auto',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            color: '#1e293b',
            whiteSpace: 'pre-wrap',
          }}
        >
          {cleanFull}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="contained" sx={{ backgroundColor: '#0f172a' }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
