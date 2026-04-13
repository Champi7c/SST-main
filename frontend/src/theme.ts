import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h4: { fontSize: '1.5rem' },
    h5: { fontSize: '1.2rem' },
    h6: { fontSize: '1rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 44,
          '@media (min-width: 600px)': { minHeight: 30, padding: '4px 12px' },
        },
        sizeSmall: {
          '@media (min-width: 600px)': { minHeight: 26, padding: '2px 8px', fontSize: '0.75rem' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          '@media (min-width: 600px)': { minWidth: 32, minHeight: 32 },
        },
        sizeSmall: {
          '@media (min-width: 600px)': { minWidth: 28, minHeight: 28 },
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
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          padding: '6px 12px',
          '@media (max-width: 600px)': { paddingLeft: 8, paddingRight: 8, fontSize: '0.75rem' },
        },
        head: {
          fontWeight: 600,
          fontSize: '0.8125rem',
        },
        sizeSmall: {
          padding: '4px 8px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
        },
        sizeSmall: {
          height: 20,
          fontSize: '0.6875rem',
        },
      },
    },
  },
})

export default theme
