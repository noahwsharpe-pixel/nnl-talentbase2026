import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const ADMIN_EMAIL = 'noahwsharpe@gmail.com'

function AuthForm({ onSignIn, onSignUp, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div>
      <input className='input mb-2' placeholder='Email' value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input className='input mb-2' placeholder='Password' type='password' value={password} onChange={(e)=>setPassword(e.target.value)} />
      <div className='flex gap-2'>
        <button className='btn' onClick={()=>onSignIn(email,password)} disabled={loading}>Sign in</button>
        <button className='btn-ghost' onClick={()=>onSignUp(email,password)} disabled={loading}>Sign up</button>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [query, setQuery] = useState('')
  const [filterTop, setFilterTop] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('nnl_theme') || 'light')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    supabase.auth.getUser().then(res=>setUser(res.data.user||null))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session)=>setUser(session?.user ?? null))
    fetchAll()
    return ()=>sub?.subscription?.unsubscribe?.()
  },[])

  useEffect(()=>{
    document.documentElement.classList.toggle('dark', theme==='dark')
    localStorage.setItem('nnl_theme', theme)
  },[theme])

  async function fetchAll() {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([
      supabase.from('teams').select('*').order('name', { ascending: true }),
      supabase.from('players').select('*').order('name', { ascending: true })
    ])
    if(tRes.error) console.error(tRes.error)
    if(pRes.error) console.error(pRes.error)
    setTeams(tRes.data || [])
    setPlayers(pRes.data || [])
    setLoading(false)
  }

  async function signUp(email,password) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if(error) alert(error.message)
    else alert('Sign-up started. Confirm email if required, then sign in.')
  }
  async function signIn(email,password) {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if(error) alert(error.message); else setUser(data.user)
  }
  async function signOut() {
    await supabase.auth.signOut(); setUser(null)
  }

  function isAdmin() {
    if(!user) return false
    if(!ADMIN_EMAIL) return true
    return user.email === ADMIN_EMAIL
  }

  async function addOrUpdatePlayer(player) {
    if(!isAdmin()) return alert('Only admin can edit')
    setLoading(true)
    player.name = `${player.first_name || ''} ${player.last_name || ''}`.trim()
    if(player.id) {
      const { error } = await supabase.from('players').update(player).eq('id', player.id)
      if(error) alert(error.message)
    } else {
      const { data, error } = await supabase.from('players').insert(player).select().single()
      if(error) alert(error.message); else player = data
    }
    await fetchAll()
    setSelectedPlayer(player.id)
    setLoading(false)
  }

  async function addOrUpdateTeam(team) {
    if(!isAdmin()) return alert('Only admin can edit')
    setLoading(true)
    if(team.id) {
      const { error } = await supabase.from('teams').update(team).eq('id', team.id)
      if(error) alert(error.message)
    } else {
      const { data, error } = await supabase.from('teams').insert(team).select().single()
      if(error) alert(error.message); else team = data
    }
    await fetchAll()
    setSelectedTeam(team.id)
    setLoading(false)
  }

  async function deletePlayer(id) {
    if(!isAdmin()) return alert('Only admin can delete')
    if(!confirm('Delete player?')) return
    setLoading(true)
    const { error } = await supabase.from('players').delete().eq('id', id)
    if(error) alert(error.message)
    await fetchAll()
    setSelectedPlayer(null)
    setLoading(false)
  }

  async function deleteTeam(id) {
    if(!isAdmin()) return alert('Only admin can delete')
    if(!confirm('Delete team?')) return
    setLoading(true)
    const { error } = await supabase.from('teams').delete().eq('id', id)
    if(error) alert(error.message)
    await supabase.from('players').update({ team_id: null }).eq('team_id', id)
    await fetchAll()
    setSelectedTeam(null)
    setLoading(false)
  }

  async function uploadPhoto(file) {
    if(!file) return null
    const filePath = 'player-photos/' + Date.now() + '_' + file.name
    const { error } = await supabase.storage.from('player-photos').upload(filePath, file)
    if(error) { alert(error.message); return null }
    const { data } = supabase.storage.from('player-photos').getPublicUrl(filePath)
    return data.publicUrl
  }

  function filteredPlayers() {
    let list = [...players]
    if(query) {
      const q = query.toLowerCase()
      list = list.filter(p => (p.name||'').toLowerCase().includes(q) || (p.nationality||'').toLowerCase().includes(q))
    }
    if(filterTop) list = list.filter(p => p.top_talent)
    return list
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4'>
      <div className='max-w-6xl mx-auto'>
        <header className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-bold'>NNL TalentBase</h1>
          <div className='flex items-center gap-3'>
            <button className='btn-ghost' onClick={() => setTheme(t => t==='light'?'dark':'light')}>Toggle {theme==='light'?'Dark':'Light'}</button>
            {user ? <div className='text-sm'>Signed in {user.email}</div> : null}
            {user ? <button className='btn-ghost' onClick={signOut}>Sign out</button> : null}
          </div>
        </header>

        {!user && (
          <div className='bg-white dark:bg-gray-800 p-6 rounded shadow max-w-md mx-auto'>
            <h2 className='text-xl font-semibold mb-3'>Admin login</h2>
            <AuthForm onSignIn={signIn} onSignUp={signUp} loading={loading} />
            <div className='text-xs text-gray-500 mt-3'>Use the admin email you configured: <strong>{ADMIN_EMAIL}</strong></div>
          </div>
        )}

        {user && (
          <div className='grid grid-cols-4 gap-4'>
            <aside className='col-span-1'>
              <div className='bg-white dark:bg-gray-800 p-3 rounded shadow mb-3'>
                <div className='mb-2 font-medium'>Teams</div>
                <div className='space-y-2 max-h-56 overflow-auto'>
                  {teams.map(t => <button key={t.id} className={`w-full text-left p-2 rounded ${selectedTeam===t.id?'bg-gray-100 dark:bg-gray-700':''}`} onClick={() => setSelectedTeam(t.id)}>{t.name}</button>)}
                </div>
                <div className='mt-3 flex gap-2'>
                  {isAdmin() && <button className='btn' onClick={() => setSelectedTeam('__new__')}>+ New team</button>}
                  <button className='btn-ghost' onClick={() => { setSelectedTeam(null); setSelectedPlayer(null) }}>Clear</button>
                </div>
              </div>

              <div className='bg-white dark:bg-gray-800 p-3 rounded shadow'>
                <div className='font-medium mb-2'>Search</div>
                <input className='input mb-2' placeholder='Search players...' value={query} onChange={(e)=>setQuery(e.target.value)} />
                <label className='flex items-center gap-2'><input type='checkbox' checked={filterTop} onChange={(e)=>setFilterTop(e.target.checked)} /> Top talents</label>
                <div className='mt-3 flex gap-2'>
                  {isAdmin() && <button className='btn' onClick={() => setSelectedPlayer('__new__')}>+ New player</button>}
                  <button className='btn-ghost' onClick={fetchAll}>Refresh</button>
                </div>
              </div>
            </aside>

            <main className='col-span-3'>
              <div className='bg-white dark:bg-gray-800 p-3 rounded shadow mb-3'>
                <h3 className='font-semibold'>Players ({filteredPlayers().length})</h3>
                <div className='space-y-2 mt-2'>
                  {filteredPlayers().map(p => (
                    <div key={p.id} className='p-3 bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-between'>
                      <div>
                        <div className='font-semibold'>{p.name}</div>
                        <div className='text-sm text-gray-600 dark:text-gray-300'>{p.position} • {p.nationality} {p.team_id ? '• team' : ''}</div>
                      </div>
                      <div className='flex gap-2'>
                        <button className='btn-sm' onClick={() => setSelectedPlayer(p.id)}>View</button>
                        {isAdmin() && <button className='btn-sm' onClick={() => setSelectedPlayer(p.id+'__edit__')}>Edit</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {selectedPlayer==='__new__' && <PlayerEditor teams={teams} onSave={addOrUpdatePlayer} onCancel={() => setSelectedPlayer(null)} uploadPhoto={uploadPhoto} />}
                {selectedPlayer && selectedPlayer !== '__new__' && !selectedPlayer.endsWith('__edit__') && (()=>{{
                  const pl = players.find(x=>x.id===selectedPlayer)
                  if(!pl) return <div className='bg-white dark:bg-gray-800 p-4 rounded shadow'>Player not found</div>
                  return (
                    <div className='bg-white dark:bg-gray-800 p-4 rounded shadow'>
                      <div className='flex items-center gap-4'>
                        <div className='w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden'>{pl.photo_url ? <img src={pl.photo_url} alt='p' className='object-cover w-full h-full'/> : <div className='p-3 text-sm'>No photo</div>}</div>
                        <div>
                          <div className='text-xl font-semibold'>{pl.name}</div>
                          <div className='text-sm text-gray-600 dark:text-gray-300'>{pl.position} • {pl.nationality}</div>
                        </div>
                      </div>
                      <div className='mt-3 flex gap-2'>
                        {isAdmin() && <button className='btn' onClick={() => setSelectedPlayer(pl.id+'__edit__')}>Edit</button>}
                        {isAdmin() && <button className='btn-ghost text-red-600' onClick={() => deletePlayer(pl.id)}>Delete</button>}
                      </div>
                    </div>
                  )
                }})()}

                {selectedPlayer && selectedPlayer.endsWith('__edit__') && (()=>{{
                  const id = selectedPlayer.replace('__edit__','')
                  const pl = players.find(x=>x.id===id)
                  if(!pl) return <div className='bg-white dark:bg-gray-800 p-4 rounded shadow'>Player not found</div>
                  return <PlayerEditor player={pl} teams={teams} onSave={addOrUpdatePlayer} onCancel={() => setSelectedPlayer(null)} uploadPhoto={uploadPhoto} />
                }})()}

                {selectedTeam==='__new__' && <TeamEditor onSave={addOrUpdateTeam} onCancel={() => setSelectedTeam(null)} />}
                {selectedTeam && selectedTeam !== '__new__' && !selectedTeam.endsWith('__edit__') && (()=>{{
                  const tm = teams.find(x=>x.id===selectedTeam)
                  if(!tm) return <div className='bg-white dark:bg-gray-800 p-4 rounded shadow'>Team not found</div>
                  return (
                    <div className='bg-white dark:bg-gray-800 p-4 rounded shadow'>
                      <div className='flex items-center gap-4'>
                        <div className='w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden'>{tm.logo_url ? <img src={tm.logo_url} alt='logo' className='object-cover w-full h-full'/> : <div className='p-3 text-sm'>No logo</div>}</div>
                        <div>
                          <div className='text-xl font-semibold'>{tm.name}</div>
                          <div className='text-sm text-gray-600 dark:text-gray-300'>{tm.stadium} • Founded: {tm.founded}</div>
                        </div>
                      </div>
                      <div className='mt-3 flex gap-2'>
                        {isAdmin() && <button className='btn' onClick={() => setSelectedTeam(tm.id+'__edit__')}>Edit</button>}
                        {isAdmin() && <button className='btn-ghost text-red-600' onClick={() => deleteTeam(tm.id)}>Delete</button>}
                      </div>
                    </div>
                  )
                }})()}

                {selectedTeam selectedTeam && selectedTeam.endsWith('__edit__') andselectedTeam && selectedTeam.endsWith('__edit__') and selectedTeam.endsWith('__edit__') selectedTeam && selectedTeam.endsWith('__edit__') andselectedTeam && selectedTeam.endsWith('__edit__') and (()=>{{
                  const id = selectedTeam.replace('__edit__','')
                  const tm = teams.find(x=>x.id===id)
                  if(!tm) return <div className='bg-white dark:bg-gray-800 p-4 rounded shadow'>Team not found</div>
                  return <TeamEditor team={tm} onSave={addOrUpdateTeam} onCancel={() => setSelectedTeam(null)} />
                }})()}

              </div>

            </main>
          </div>
        )}
      </div>
      <style>{`
        .input{ width:100%; padding:0.5rem; border:1px solid #e5e7eb; border-radius:0.375rem }
        .btn{ background:#0f172a; color:white; padding:0.45rem 0.75rem; border-radius:0.375rem }
        .btn-ghost{ background:transparent; padding:0.45rem 0.75rem }
        .btn-sm{ background:#0f172a; color:white; padding:0.25rem 0.5rem; border-radius:0.375rem; font-size:0.85rem }
      `}</style>
    </div>
  )
}

function PlayerEditor({ player = {}, teams = [], onSave, onCancel, uploadPhoto }) {
  const [form, setForm] = useState({ ...player, first_name: player.first_name, last_name: player.last_name })
  const [file, setFile] = useState(null)

  useEffect(()=> setForm({ ...player }), [player])

  function update(k,v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    let photo_url = form.photo_url || null
    if(file) {
      const url = await uploadPhoto(file)
      if(url) photo_url = url
    }
    await onSave({ ...form, photo_url })
  }

  return (
    <div className='bg-white dark:bg-gray-800 p-3 rounded shadow'>
      <h4 className='font-semibold mb-2'>{player.id ? 'Edit Player' : 'New Player'}</h4>
      <div className='grid grid-cols-2 gap-2'>
        <input className='input' placeholder='First name' value={form.first_name || ''} onChange={e=>update('first_name', e.target.value)} />
        <input className='input' placeholder='Last name' value={form.last_name || ''} onChange={e=>update('last_name', e.target.value)} />
        <input className='input' placeholder='DOB YYYY-MM-DD' value={form.date_of_birth || ''} onChange={e=>update('date_of_birth', e.target.value)} />
        <input className='input' placeholder='Nationality' value={form.nationality || ''} onChange={e=>update('nationality', e.target.value)} />
        <select className='input' value={form.position||'CM'} onChange={e=>update('position', e.target.value)}>
          <option>GK</option><option>RB</option><option>LB</option><option>CB</option><option>CM</option><option>RM</option><option>LM</option><option>AM</option><option>ST</option><option>LW</option><option>RW</option>
        </select>
        <input className='input' placeholder='Agent' value={form.agent||''} onChange={e=>update('agent', e.target.value)} />
        <input className='input' placeholder='Market value (NGN)' value={form.market_value||0} onChange={e=>update('market_value', Number(e.target.value))} />
        <input className='input' placeholder='Contract until' value={form.contract_until||''} onChange={e=>update('contract_until', e.target.value)} />
        <select className='input col-span-2' value={form.team_id||''} onChange={e=>update('team_id', e.target.value)}>
          <option value=''>-- Unattached --</option>

          {teams.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className='col-span-2'>
          <label className='block mb-1'>Photo</label>
          <input type='file' accept='image/*' onChange={e=>setFile(e.target.files?.[0] ?? null)} />
          {form.photo_url && <div className='mt-2'>Current: <img src={form.photo_url} alt='photo' className='w-24 h-24 object-cover rounded' /></div>}
        </div>
      </div>
      <div className='mt-3 flex gap-2'>
        <button className='btn' onClick={save}>Save player</button>
        <button className='btn-ghost' onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function TeamEditor({ team = {}, onSave, onCancel }) {
  const [form, setForm] = useState({ ...team })
  useEffect(()=> setForm({ ...team }), [team])
  function update(k,v) { setForm(f=>({ ...f, [k]: v })) }
  return (
    <div className='bg-white dark:bg-gray-800 p-3 rounded shadow'>
      <h4 className='font-semibold mb-2'>{team.id ? 'Edit Team' : 'New Team'}</h4>
      <input className='input mb-2' placeholder='Team name' value={form.name||''} onChange={e=>update('name', e.target.value)} />
      <input className='input mb-2' placeholder='Stadium' value={form.stadium||''} onChange={e=>update('stadium', e.target.value)} />
      <input className='input mb-2' placeholder='Founded' value={form.founded||''} onChange={e=>update('founded', e.target.value)} />
      <input className='input mb-2' placeholder='Logo URL' value={form.logo_url||''} onChange={e=>update('logo_url', e.target.value)} />
      <div className='flex gap-2'>
        <button className='btn' onClick={() => onSave(form)}>Save team</button>
        <button className='btn-ghost' onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
