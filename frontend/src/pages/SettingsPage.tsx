import { useEffect, useState } from "react";
import { fetchSettings, updateSettings, type AppSettings } from "../api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sigma, setSigma] = useState(2.5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setSettings(s);
        setSigma(s.anomaly_sigma_threshold);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateSettings({ anomaly_sigma_threshold: sigma });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="empty-state">Loading settings…</div>;
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">⚙ ALERT SENSITIVITY</span>
      </div>
      <div className="panel-body settings-body">
        <label className="settings-label" htmlFor="sigma-slider">
          Anomaly threshold (σ): <strong>{sigma.toFixed(1)}</strong>
        </label>
        <input
          id="sigma-slider"
          type="range"
          min={1}
          max={5}
          step={0.1}
          value={sigma}
          onChange={(e) => setSigma(parseFloat(e.target.value))}
          className="settings-slider"
        />
        <div className="settings-hints">
          <span>More alerts</span>
          <span>Fewer alerts</span>
        </div>
        <p className="settings-desc">
          Lower values (1–2σ) fire alerts sooner — useful for quiet networks.
          Higher values (3–5σ) reduce noise but may miss subtle anomalies.
          Default from env: <code>SPECTRA_ANOMALY_SIGMA_THRESHOLD</code>.
        </p>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || sigma === settings.anomaly_sigma_threshold}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Apply threshold"}
        </button>
        <dl className="settings-meta">
          <dt>Poll interval</dt>
          <dd>{settings.poll_interval_seconds}s</dd>
          <dt>Baseline window</dt>
          <dd>{settings.baseline_days} days</dd>
        </dl>
      </div>
    </div>
  );
}
