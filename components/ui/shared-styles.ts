// Shared design tokens used across all dashboard components
// Matches the dark aesthetic from oso-v-01 HTML dashboards

export const colors = {
  bg:       '#0c0c0e',
  surface:  '#131316',
  surface2: '#1a1a1f',
  surface3: '#222228',
  border:   '#2a2a32',
  border2:  '#363640',
  text:     '#f0efe8',
  muted:    '#6b6b78',
  subtle:   '#3a3a44',
  // Role accent colors
  oso:     '#e8c547',
  partner: '#3dd6a3',
  author:  '#9d7df5',
  reader:  '#5ba4f5',
  // Semantic
  coral:   '#f07060',
  amber:   '#e8c547',
  teal:    '#3dd6a3',
  purple:  '#9d7df5',
  blue:    '#5ba4f5',
} as const

export const fonts = {
  sans: "'Syne', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const

// Status pill styles
export const statusColors: Record<string, { bg: string; color: string }> = {
  published: { bg: 'rgba(61,214,163,0.12)',  color: '#3dd6a3' },
  in_review: { bg: 'rgba(157,125,245,0.12)', color: '#9d7df5' },
  draft:     { bg: 'rgba(99,94,128,0.2)',    color: '#6b6b78' },
  rejected:  { bg: 'rgba(240,112,96,0.12)',  color: '#f07060' },
  active:    { bg: 'rgba(61,214,163,0.12)',  color: '#3dd6a3' },
  suspended: { bg: 'rgba(240,112,96,0.12)',  color: '#f07060' },
  pending:   { bg: 'rgba(232,197,71,0.12)',  color: '#e8c547' },
}

// Base inline styles reused across components
export const baseStyles = {
  panel: {
    background:   '#131316',
    border:       '1px solid #2a2a32',
    borderRadius: '10px',
    overflow:     'hidden',
  } as React.CSSProperties,

  panelHead: {
    padding:        '14px 18px',
    borderBottom:   '1px solid #2a2a32',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,

  input: {
    background:   '#1a1a1f',
    border:       '1px solid #2a2a32',
    borderRadius: '8px',
    padding:      '10px 14px',
    fontSize:     '13px',
    color:        '#f0efe8',
    outline:      'none',
    width:        '100%',
    fontFamily:   "'Syne', system-ui, sans-serif",
  } as React.CSSProperties,

  btn: {
    padding:      '8px 16px',
    borderRadius: '6px',
    border:       '1px solid #363640',
    background:   '#1a1a1f',
    color:        '#f0efe8',
    fontSize:     '13px',
    fontWeight:   600,
    cursor:       'pointer',
    fontFamily:   "'Syne', system-ui, sans-serif",
  } as React.CSSProperties,

  btnPrimary: (accent = '#9d7df5') => ({
    padding:      '8px 16px',
    borderRadius: '6px',
    border:       'none',
    background:   accent,
    color:        '#0c0c0e',
    fontSize:     '13px',
    fontWeight:   700,
    cursor:       'pointer',
    fontFamily:   "'Syne', system-ui, sans-serif",
  } as React.CSSProperties),
} as const
