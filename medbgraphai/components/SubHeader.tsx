'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

export default function SubHeader() {
  return (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        px: 3,
        py: 1.5,
      }}
    >
      {/* Patient & Pipeline Session Info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          mb: 1,
        }}
      >
        {/* Session */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}
          />
          <Typography
            sx={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            FHIR R4 Session: #ENC-9082-TX
          </Typography>
        </Box>

        <Typography sx={{ color: '#cbd5e1' }}>•</Typography>

        {/* Patient */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <PersonOutlinedIcon sx={{ fontSize: 16, color: '#64748b' }} />
          <Typography
            sx={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#1e293b',
            }}
          >
            Patient:{' '}
            <Box component="span" sx={{ fontWeight: 700 }}>
              M. Reyes (58M)
            </Box>{' '}
            • MRN: ***-**-8491
          </Typography>
        </Box>

        <Typography sx={{ color: '#cbd5e1' }}>•</Typography>

        {/* Dual LLM Pipeline */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <SettingsSuggestIcon sx={{ fontSize: 16, color: '#ea580c' }} />
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: '#475569',
              fontWeight: 500,
            }}
          >
            Dual-LLM Pipeline: Gemma-4-31B-IT (Verification) + DeepSeek-V4.1-Flash (GenUI)
          </Typography>
        </Box>
      </Box>

      {/* Badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label="HIPAA BAA SIGNED"
          size="small"
          sx={{
            backgroundColor: '#ccfbf1',
            color: '#0f766e',
            fontWeight: 700,
            fontSize: '0.68rem',
            height: 20,
            borderRadius: '4px',
          }}
        />
        <Chip
          label="AUDIT LOG #7731-ROCM"
          size="small"
          sx={{
            backgroundColor: '#dbeafe',
            color: '#1d4ed8',
            fontWeight: 700,
            fontSize: '0.68rem',
            height: 20,
            borderRadius: '4px',
          }}
        />
      </Box>
    </Box>
  );
}
