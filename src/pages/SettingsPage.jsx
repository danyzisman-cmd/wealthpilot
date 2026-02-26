import { useState, useRef } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';

const STORAGE_KEYS = [
  'wp_profile',
  'wp_budget',
  'wp_portfolio',
  'wp_recurring_transfers',
  'wp_portfolio_seed',
  'wp_rsus',
  'wp_rsus_seed',
  'wp_fmp_api_key',
  'wp_last_price_refresh',
];

const KEY_LABELS = {
  wp_profile: 'Profile',
  wp_budget: 'Budget entries',
  wp_portfolio: 'Portfolio holdings',
  wp_recurring_transfers: 'Recurring investments',
  wp_rsus: 'RSU grants',
  wp_portfolio_seed: 'Portfolio seed version',
  wp_rsus_seed: 'RSU seed version',
  wp_fmp_api_key: 'FMP API key',
  wp_last_price_refresh: 'Last price refresh',
};

function collectData() {
  const data = {};
  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
    }
  }
  return data;
}

function summarize(data) {
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    const label = KEY_LABELS[key] || key;
    if (Array.isArray(value)) {
      lines.push({ label, detail: `${value.length} items` });
    } else if (typeof value === 'object' && value !== null) {
      lines.push({ label, detail: `${Object.keys(value).length} fields` });
    } else {
      lines.push({ label, detail: String(value).slice(0, 40) });
    }
  }
  return lines;
}

export default function SettingsPage() {
  const fileInputRef = useRef(null);
  const [importData, setImportData] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [status, setStatus] = useState(null);

  // ── Export ──
  const handleExport = () => {
    const payload = {
      version: 1,
      app: 'wealthpilot',
      exportedAt: new Date().toISOString(),
      data: collectData(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wealthpilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Data exported successfully.' });
  };

  // ── Import ──
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed.data || parsed.app !== 'wealthpilot') {
          setStatus({ type: 'error', message: 'Invalid WealthPilot backup file.' });
          return;
        }
        setImportData(parsed);
        setImportPreview(summarize(parsed.data));
        setShowImportModal(true);
      } catch {
        setStatus({ type: 'error', message: 'Could not parse file. Make sure it\'s a valid JSON backup.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!importData?.data) return;
    for (const [key, value] of Object.entries(importData.data)) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
    setShowImportModal(false);
    setImportData(null);
    setImportPreview(null);
    setStatus({ type: 'success', message: 'Data imported. Reload the page to see your data.' });
    setTimeout(() => window.location.reload(), 1500);
  };

  // ── Reset ──
  const confirmReset = () => {
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    setShowResetModal(false);
    setStatus({ type: 'success', message: 'All data cleared. Reloading...' });
    setTimeout(() => window.location.reload(), 1000);
  };

  // Current data summary
  const currentData = collectData();
  const currentSummary = summarize(currentData);

  return (
    <div className="max-w-2xl space-y-6">
      {status && (
        <div className={`px-4 py-3 rounded-lg text-sm ${
          status.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {status.message}
        </div>
      )}

      {/* Current Data */}
      <Card title="Your Data" subtitle="Everything stored in this browser">
        <div className="space-y-2">
          {currentSummary.map(({ label, detail }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="text-gray-200 font-medium">{detail}</span>
            </div>
          ))}
          {currentSummary.length === 0 && (
            <p className="text-sm text-gray-500">No data stored yet.</p>
          )}
        </div>
      </Card>

      {/* Export */}
      <Card title="Export Data" subtitle="Download a backup of all your WealthPilot data">
        <Button onClick={handleExport}>
          <DownloadIcon className="w-4 h-4" />
          Download All Data
        </Button>
      </Card>

      {/* Import */}
      <Card title="Import Data" subtitle="Restore from a backup file (replaces current data)">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          <UploadIcon className="w-4 h-4" />
          Choose Backup File
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card
        title="Danger Zone"
        subtitle="Permanently delete all data from this browser"
        className="border-rose-500/20"
      >
        <Button variant="danger" onClick={() => setShowResetModal(true)}>
          Reset All Data
        </Button>
      </Card>

      {/* Import Preview Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Data"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            This will replace your current data with the backup
            {importData?.exportedAt && (
              <> from <span className="text-gray-200">{new Date(importData.exportedAt).toLocaleString()}</span></>
            )}:
          </p>
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            {importPreview?.map(({ label, detail }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-200">{detail}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button onClick={confirmImport}>Import &amp; Reload</Button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset All Data"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            This will permanently delete all your WealthPilot data from this browser.
            This cannot be undone. Consider exporting a backup first.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmReset}>Delete Everything</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DownloadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
