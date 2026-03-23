'use client'

import { useState, useEffect } from 'react'

type Tab = 'codes' | 'roles' | 'permissions'

const PERMISSIONS = [
  { key: 'upload_books', label: 'Upload Books' },
  { key: 'edit_own_books', label: 'Edit Own Books' },
  { key: 'delete_own_books', label: 'Delete Own Books' },
  { key: 'manage_chapters', label: 'Manage Chapters' },
  { key: 'view_own_earnings', label: 'View Own Earnings' },
  { key: 'submit_for_review', label: 'Submit for Review' },
  { key: 'invite_co_authors', label: 'Invite Co-Authors' },
  { key: 'manage_promo_codes', label: 'Manage Promo Codes' },
  { key: 'view_reader_stats', label: 'View Reader Stats' },
  { key: 'access_analytics', label: 'Access Analytics' },
  { key: 'export_data', label: 'Export Data' },
  { key: 'bulk_upload', label: 'Bulk Upload' },
]

const COLORS = ['#9d7df5', '#3dd6a3', '#e8c547', '#5ba4f5', '#f07060', '#ff9f43', '#54a0ff', '#5f27cd']

export default function PartnerSettingsPage() {
  const [tab, setTab] = useState<Tab>('codes')
  const [codes, setCodes] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [authors, setAuthors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showCodeForm, setShowCodeForm] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [roleDesc, setRoleDesc] = useState('')
  const [roleColor, setRoleColor] = useState('#9d7df5')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [codesRes, rolesRes, authorsRes] = await Promise.all([
        fetch('/api/partner-codes'),
        fetch('/api/partner/roles'),
        fetch('/api/partners/authors'),
      ])
      const codesJson = await codesRes.json()
      const rolesJson = await rolesRes.json()
      const authorsJson = await authorsRes.json()
      setCodes(codesJson.data?.codes || [])
      setRoles(rolesJson.data?.roles || [])
      setAuthors(authorsJson.data?.authors || [])
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function createCode() {
    const code = newCode.trim() || `PART-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    await fetch('/api/partner-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    setNewCode('')
    setShowCodeForm(false)
    loadData()
  }

  async function toggleCode(codeId: string, isActive: boolean) {
    // Note: Would need to add toggle endpoint, using delete for now
    if (confirm(isActive ? 'Deactivate this code?' : 'Activate this code?')) {
      await fetch(`/api/partner-codes?id=${codeId}`, { method: 'DELETE' })
      loadData()
    }
  }

  async function createRole() {
    if (!roleName.trim()) {
      setError('Role name is required')
      return
    }
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/partner/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roleName, description: roleDesc, color: roleColor, permissions: selectedPerms }),
      })
      const j = await res.json()
      if (j.success) {
        setRoleName('')
        setRoleDesc('')
        setRoleColor('#9d7df5')
        setSelectedPerms([])
        setShowRoleForm(false)
        loadData()
      } else {
        setError(j.error || 'Failed to create role')
      }
    } catch (e) {
      setError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function deleteRole(roleId: string) {
    if (!confirm('Delete this role? Authors with this role will lose their permissions.')) return
    await fetch(`/api/partner/roles?role_id=${roleId}`, { method: 'DELETE' })
    loadData()
  }

  async function assignRole(authorId: string, roleId: string) {
    await fetch('/api/partner/authors/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_id: authorId, role_id: roleId }),
    })
    loadData()
  }

  function togglePerm(perm: string) {
    setSelectedPerms(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, background: '#0c0e0f', color: '#edf0f0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#edf0f0', letterSpacing: '-0.4px' }}>Partner Settings</div>
          <div style={{ fontSize: 12, color: '#5e6b70', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
            Manage codes, roles, and permissions for your authors
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { key: 'codes' as Tab, label: 'Promo Codes' },
          { key: 'roles' as Tab, label: 'Custom Roles' },
          { key: 'permissions' as Tab, label: 'Author Permissions' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: tab === t.key ? '#3dd6a3' : '#1a1c1f', color: tab === t.key ? '#0c0e0f' : '#5e6b70',
              border: '1px solid #252c30', fontFamily: "'JetBrains Mono',monospace" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Promo Codes Tab */}
      {tab === 'codes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Promotional Codes</div>
            <button onClick={() => setShowCodeForm(true)}
              style={{ padding: '7px 14px', borderRadius: 6, background: '#3dd6a3', color: '#0c0e0f', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
              + Create Code
            </button>
          </div>

          {showCodeForm && (
            <div style={{ background: '#131618', border: '1px solid #252c30', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Create Promo Code</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)}
                  placeholder="Auto-generated if empty"
                  style={{ flex: 1, background: '#1a1c1f', border: '1px solid #252c30', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#edf0f0', outline: 'none', fontFamily: "'JetBrains Mono',monospace" }} />
                <button onClick={createCode}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#3dd6a3', color: '#0c0e0f', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                  Create
                </button>
                <button onClick={() => setShowCodeForm(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, background: 'transparent', color: '#5e6b70', fontSize: 11, cursor: 'pointer', border: '1px solid #252c30' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ background: '#131618', border: '1px solid #252c30', borderRadius: 10, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#5e6b70' }}>Loading…</div>
            ) : codes.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#5e6b70' }}>No promo codes created yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a1c1f' }}>
                    {['Code', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, color: '#5e6b70', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #252c30' }}>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <code style={{ fontFamily: "'JetBrains Mono',monospace", background: '#1a1c1f', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>{c.code}</code>
                          <button onClick={() => copyToClipboard(c.code)} style={{ background: 'none', border: 'none', color: '#5e6b70', cursor: 'pointer', fontSize: 12 }}>📋</button>
                        </div>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                          background: c.is_active ? 'rgba(61,214,163,0.12)' : 'rgba(240,112,96,0.12)',
                          color: c.is_active ? '#3dd6a3' : '#f07060'
                        }}>{c.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ padding: '12px 18px', fontSize: 11, color: '#5e6b70' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <button onClick={() => toggleCode(c.id, c.is_active)}
                          style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                            background: 'transparent', border: '1px solid #252c30', color: '#5e6b70' }}>
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {tab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Custom Roles</div>
            <button onClick={() => setShowRoleForm(true)}
              style={{ padding: '7px 14px', borderRadius: 6, background: '#3dd6a3', color: '#0c0e0f', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
              + Create Role
            </button>
          </div>

          {showRoleForm && (
            <div style={{ background: '#131618', border: '1px solid #252c30', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Create Custom Role</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="text" value={roleName} onChange={e => setRoleName(e.target.value)}
                  placeholder="Role name (e.g., Senior Author, Junior Writer)"
                  style={{ background: '#1a1c1f', border: '1px solid #252c30', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#edf0f0', outline: 'none' }} />
                <input type="text" value={roleDesc} onChange={e => setRoleDesc(e.target.value)}
                  placeholder="Description (optional)"
                  style={{ background: '#1a1c1f', border: '1px solid #252c30', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#edf0f0', outline: 'none' }} />
                <div>
                  <div style={{ fontSize: 11, color: '#5e6b70', marginBottom: 8 }}>Color</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setRoleColor(c)}
                        style={{ width: 28, height: 28, borderRadius: 6, background: c, border: roleColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#5e6b70', marginBottom: 8 }}>Permissions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {PERMISSIONS.map(p => (
                      <button key={p.key} onClick={() => togglePerm(p.key)}
                        style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                          background: selectedPerms.includes(p.key) ? `${roleColor}33` : '#1a1c1f',
                          color: selectedPerms.includes(p.key) ? roleColor : '#5e6b70',
                          border: `1px solid ${selectedPerms.includes(p.key) ? roleColor : '#252c30'}` }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                {error && (
                  <div style={{ padding: '8px 12px', background: 'rgba(240,112,96,0.1)', border: '1px solid rgba(240,112,96,0.3)', borderRadius: 6, fontSize: 11, color: '#f07060' }}>
                    {error}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={createRole} disabled={creating}
                    style={{ padding: '8px 16px', borderRadius: 6, background: '#3dd6a3', color: '#0c0e0f', fontSize: 11, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', border: 'none', opacity: creating ? 0.6 : 1 }}>
                    {creating ? 'Creating…' : 'Create Role'}
                  </button>
                  <button onClick={() => { setShowRoleForm(false); setError('') }}
                    style={{ padding: '8px 16px', borderRadius: 6, background: 'transparent', color: '#5e6b70', fontSize: 11, cursor: 'pointer', border: '1px solid #252c30' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: '#131618', border: '1px solid #252c30', borderRadius: 10, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#5e6b70' }}>Loading…</div>
            ) : roles.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#5e6b70' }}>No custom roles created yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a1c1f' }}>
                    {['Role', 'Description', 'Permissions', 'Authors', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, color: '#5e6b70', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roles.map(r => {
                    const perms = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions || []
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #252c30' }}>
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: r.color }} />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 18px', fontSize: 11, color: '#5e6b70' }}>
                          {r.description || '—'}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {perms.slice(0, 3).map((p: string) => {
                              const perm = PERMISSIONS.find(x => x.key === p)
                              return (
                                <span key={p} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: `${r.color}22`, color: r.color }}>
                                  {perm?.label || p}
                                </span>
                              )
                            })}
                            {perms.length > 3 && (
                              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: '#1a1c1f', color: '#5e6b70' }}>
                                +{perms.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 18px', fontSize: 12, color: '#3dd6a3' }}>
                          {r.assigned_count || 0}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <button onClick={() => deleteRole(r.id)}
                            style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                              background: 'rgba(240,112,96,0.1)', border: '1px solid rgba(240,112,96,0.3)', color: '#f07060' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {tab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Assign Roles to Authors</div>
          <div style={{ background: '#131618', border: '1px solid #252c30', borderRadius: 10, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#5e6b70' }}>Loading…</div>
            ) : authors.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#5e6b70' }}>No authors found</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a1c1f' }}>
                    {['Author', 'Current Role', 'Assign Role'].map(h => (
                      <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, color: '#5e6b70', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {authors.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #252c30' }}>
                      <td style={{ padding: '12px 18px' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</div>
                          <div style={{ fontSize: 10, color: '#5e6b70' }}>{a.email}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {a.role_name ? (
                          <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, background: `${a.color}22`, color: a.color }}>
                            {a.role_name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#5e6b70' }}>Default (no custom role)</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <select onChange={e => { if (e.target.value) assignRole(a.id, e.target.value) }}
                          style={{ background: '#1a1c1f', border: '1px solid #252c30', borderRadius: 6, padding: '6px 12px', fontSize: 11, color: '#edf0f0', outline: 'none', cursor: 'pointer' }}>
                          <option value="">Select role…</option>
                          {roles.filter(r => r.is_active).map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
