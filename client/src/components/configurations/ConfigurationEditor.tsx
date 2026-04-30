import { type FormEvent, useEffect, useState } from 'react';
import type { AssistantConfiguration } from '../../types/api';

interface ConfigurationEditorProps {
  configuration: AssistantConfiguration | null;
  onSave: (id: string, payload: Partial<Pick<AssistantConfiguration, 'assistantName' | 'systemPrompt' | 'topicRestrictions' | 'assistantVoice'>>) => Promise<void>;
}

const voiceOptions = ['placeholder', 'Ava (Female)', 'James (Male)', 'Emma (Female)', 'Robot'];

export function ConfigurationEditor({ configuration, onSave }: ConfigurationEditorProps) {
  const [form, setForm] = useState({ assistantName: '', systemPrompt: '', topicRestrictions: '', assistantVoice: 'placeholder' });
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    if (!configuration) return;
    setForm({
      assistantName: configuration.assistantName,
      systemPrompt: configuration.systemPrompt,
      topicRestrictions: configuration.topicRestrictions,
      assistantVoice: configuration.assistantVoice,
    });
  }, [configuration]);

  if (!configuration) {
    return (
      <div className="panel">
        <div className="empty-state">
          <div>
            <p className="empty-title">Select a configuration</p>
            <p className="empty-text">Choose a configuration from the list.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(configuration.id, form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-body">
        <h2 className="panel-title">Configuration Settings</h2>
        <div className="entity-row-subtitle">{configuration.id}</div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Assistant Name</label>
            <input className="form-control" value={form.assistantName} onChange={(event) => setForm((current) => ({ ...current, assistantName: event.target.value }))} />
          </div>

          <div className="mb-3">
            <label className="form-label">Voice</label>
            <select className="form-select" value={form.assistantVoice} onChange={(event) => setForm((current) => ({ ...current, assistantVoice: event.target.value }))}>
              {voiceOptions.map((voice) => <option key={voice} value={voice}>{voice}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">System Prompt</label>
            <textarea className="form-control" rows={4} value={form.systemPrompt} onChange={(event) => setForm((current) => ({ ...current, systemPrompt: event.target.value }))} />
          </div>

          <div className="mb-3">
            <label className="form-label">Topic Restrictions</label>
            <textarea className="form-control" rows={3} value={form.topicRestrictions} onChange={(event) => setForm((current) => ({ ...current, topicRestrictions: event.target.value }))} />
          </div>

          <button type="submit" className="btn btn-purple" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}
