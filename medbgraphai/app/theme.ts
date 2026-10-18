'use client';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0284c7', // Sky 600
      light: '#e0f2fe',
      dark: '#0369a1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f172a', // Slate 900
      light: '#334155',
      dark: '#020617',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#fee2e2',
      dark: '#b91c1c',
    },
    warning: {
      main: '#d97706',
      light: '#fef3c7',
      dark: '#b45309',
    },
    info: {
      main: '#0284c7',
      light: '#f0f9ff',
      dark: '#0369a1',
    },
    success: {
      main: '#059669',
      light: '#ccfbf1',
      dark: '#047857',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
  },
});
