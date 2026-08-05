import { createTheme, alpha } from '@mui/material/styles'

// Palette institutionnelle : bleu (identité/navigation), blanc (fond), rouge (actions)
export const brand = {
  blue900: '#0A2540',
  blue800: '#0D3B66',
  blue700: '#0F4C86',
  blue600: '#1565C0',
  blue500: '#2E7DD1',
  blue100: '#E8F1FB',
  red: '#D7263D',
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#D7263D',
      dark: '#B81E32',
      light: '#E8586B',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0F4C86',
      dark: '#0A2540',
      light: '#2E7DD1',
      contrastText: '#ffffff',
    },
    error: {
      main: '#D7263D',
      dark: '#B81E32',
    },
    success: {
      main: '#1E8E5A',
    },
    warning: {
      main: '#E08A00',
    },
    info: {
      main: '#0F4C86',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#132437',
      secondary: '#5B6B7C',
    },
    divider: alpha('#0A2540', 0.09),
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontSize: '1.05rem', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shadows: [
    'none',
    '0 1px 2px rgba(10,37,64,0.06)',
    '0 2px 4px rgba(10,37,64,0.07)',
    '0 3px 6px rgba(10,37,64,0.08)',
    '0 4px 10px rgba(10,37,64,0.08)',
    '0 6px 14px rgba(10,37,64,0.09)',
    '0 8px 18px rgba(10,37,64,0.10)',
    '0 10px 22px rgba(10,37,64,0.10)',
    '0 12px 26px rgba(10,37,64,0.11)',
    '0 14px 28px rgba(10,37,64,0.11)',
    '0 16px 30px rgba(10,37,64,0.12)',
    '0 18px 32px rgba(10,37,64,0.12)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
    '0 20px 34px rgba(10,37,64,0.13)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#C6CFDA transparent',
        },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-thumb': { backgroundColor: '#C6CFDA', borderRadius: 8 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 44,
          borderRadius: 10,
          fontWeight: 600,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
          '@media (min-width: 600px)': { minHeight: 36, padding: '6px 16px' },
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        sizeSmall: {
          '@media (min-width: 600px)': { minHeight: 30, padding: '4px 12px', fontSize: '0.75rem' },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(215,38,61,0.28)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(215,38,61,0.34)',
          },
        },
        containedSecondary: {
          boxShadow: '0 2px 8px rgba(15,76,134,0.28)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(15,76,134,0.34)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5 },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          transition: 'background-color 0.15s ease, transform 0.15s ease',
          '@media (min-width: 600px)': { minWidth: 32, minHeight: 32 },
          '&:hover': { transform: 'translateY(-1px)' },
        },
        sizeSmall: {
          '@media (min-width: 600px)': { minWidth: 28, minHeight: 28 },
        },
        colorPrimary: {
          color: '#0F4C86',
          '&:hover': { backgroundColor: alpha('#0F4C86', 0.08) },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 6px 16px rgba(215,38,61,0.35)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 14,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(10,37,64,0.08), 0 1px 2px rgba(10,37,64,0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${alpha('#0A2540', 0.08)}`,
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(90deg, #0A2540 0%, #0F4C86 100%)',
          boxShadow: '0 2px 10px rgba(10,37,64,0.18)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(180deg, #0A2540 0%, #0D3B66 100%)',
          color: '#E8F1FB',
          border: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          width: 'auto',
          transition: 'background-color 0.15s ease, transform 0.15s ease',
          '&:hover': {
            backgroundColor: alpha('#FFFFFF', 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#D7263D', 0.85),
            '&:hover': { backgroundColor: '#D7263D' },
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.12s ease',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          padding: '10px 12px',
          borderBottomColor: alpha('#0A2540', 0.08),
          '@media (max-width: 600px)': { paddingLeft: 8, paddingRight: 8, fontSize: '0.75rem' },
        },
        head: {
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: '#5B6B7C',
          backgroundColor: '#F5F7FA',
        },
        sizeSmall: {
          padding: '6px 8px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          fontWeight: 600,
          borderRadius: 8,
        },
        sizeSmall: {
          height: 22,
          fontSize: '0.6875rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
          backgroundColor: '#D7263D',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 6,
        },
      },
    },
  },
})

export default theme
