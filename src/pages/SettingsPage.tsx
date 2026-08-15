import { Check, Cloud, CloudDownload, CloudUpload, Database, ExternalLink, HardDrive, Info, KeyRound, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import type { Ledger } from '../hooks/useLedger'

export function SettingsPage({ ledger }: { ledger: Ledger }) {
  const [houseName, setHouseName] = useState(ledger.data.houseName)
  const [apiUrl, setApiUrl] = useState(ledger.settings.apiUrl)
  const [accessToken, setAccessToken] = useState(ledger.settings.accessToken)
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { setHouseName(ledger.data.houseName) }, [ledger.data.houseName])

  const save = () => {
    ledger.setHouseName(houseName.trim() || 'My House')
    ledger.saveSettings({ apiUrl: apiUrl.trim(), accessToken: accessToken.trim() })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1_500)
  }

  const sync = async (direction: 'push' | 'pull') => {
    setMessage('')
    try {
      await ledger.syncNow(direction)
      setMessage(direction === 'push' ? 'Your current ledger is secured in S3.' : 'The cloud ledger has been restored to this device.')
    } catch {
      // The hook exposes the detailed error below.
    }
  }

  return (
    <div className="page page--settings">
      <PageHeader eyebrow="Ledger keeping" title="Settings" description="Name your house and connect this device to your private S3 archive." />
      <div className="settings-grid">
        <section className="panel settings-card">
          <header><span className="settings-card__icon"><ShieldCheck /></span><div><h2>House identity</h2><p>Used only inside this companion.</p></div></header>
          <label className="field"><span>House or commander name</span><input value={houseName} onChange={(event) => setHouseName(event.target.value)} placeholder="My House" /></label>
        </section>

        <section className="panel settings-card settings-card--wide">
          <header><span className="settings-card__icon"><Cloud /></span><div><h2>S3 cloud archive</h2><p>The included AWS stack keeps your bucket private and issues short-lived upload links through an authenticated API.</p></div><span className={`sync-status sync-status--${ledger.syncState}`}>{ledger.syncState}</span></header>
          <div className="form-grid">
            <label className="field field--full"><span>Sync API URL</span><div className="field-with-icon"><Database size={16} /><input type="url" value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} placeholder="https://…execute-api…amazonaws.com" /></div></label>
            <label className="field field--full"><span>Personal access token</span><div className="field-with-icon"><KeyRound size={16} /><input type="password" value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Stored only in this browser" /></div></label>
          </div>
          <div className="settings-note"><Info size={17} /><p>This is your app passphrase—not an AWS access key. Never paste AWS credentials into a website. See the deployment guide in the repository README.</p></div>
          {(ledger.syncError || message) && <div className={ledger.syncError ? 'alert alert--error' : 'alert alert--success'}>{ledger.syncError || message}</div>}
          <div className="settings-actions">
            <button className="button button--ghost" disabled={!apiUrl || !accessToken || ledger.syncState === 'syncing'} onClick={() => sync('pull')}><CloudDownload size={16} /> Restore from S3</button>
            <button className="button button--ghost" disabled={!apiUrl || !accessToken || ledger.syncState === 'syncing'} onClick={() => sync('push')}><CloudUpload size={16} /> Back up now</button>
          </div>
        </section>

        <section className="panel settings-card">
          <header><span className="settings-card__icon"><HardDrive /></span><div><h2>Local data</h2><p>Your ledger always saves in this browser first.</p></div></header>
          <div className="storage-summary"><div><strong>{ledger.data.roster.length}</strong><span>champions</span></div><div><strong>{ledger.data.teams.length}</strong><span>teams</span></div></div>
          <button className="button button--danger button--full" onClick={() => window.confirm('Clear the local roster, teams, and activity? A configured cloud backup is not deleted.') && ledger.clearData()}><Trash2 size={16} /> Clear local ledger</button>
        </section>

        <section className="panel settings-card">
          <header><span className="settings-card__icon"><RefreshCcw /></span><div><h2>Official intelligence</h2><p>A scheduled GitHub Action checks the official news feed each day.</p></div></header>
          <a className="button button--ghost button--full" href="https://www.gameofthroneslegends.com/news" target="_blank" rel="noreferrer">Open official source <ExternalLink size={16} /></a>
        </section>
      </div>
      <div className="settings-savebar"><div><Check size={16} /><span>Changes remain on this device until saved.</span></div><button className="button button--primary" onClick={save}>{saved ? <Check size={16} /> : null}{saved ? 'Saved' : 'Save settings'}</button></div>
    </div>
  )
}
