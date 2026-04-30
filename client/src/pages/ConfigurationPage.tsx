import { ConfigurationEditor } from '../components/configurations/ConfigurationEditor';
import { ConfigurationList } from '../components/configurations/ConfigurationList';
import { ConfigurationMessages } from '../components/configurations/ConfigurationMessages';
import { StateAlert } from '../components/StateAlert';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useConfigurations } from '../hooks/useConfigurations';

export function ConfigurationPage() {
  const configurations = useConfigurations();
  const action = useAsyncAction();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Configurations</h1>
        <button className="btn btn-purple btn-icon-label" onClick={() => void action.run(configurations.createConfiguration)} disabled={action.isSubmitting}>+ <span>Add Configuration</span></button>
      </div>

      <StateAlert error={configurations.error || action.error} />

      <div className="content-grid config-grid">
        <div>{configurations.isLoading ? <div className="panel panel-body text-muted">Loading configurations...</div> : (
          <ConfigurationList
            configurations={configurations.configurations}
            selectedConfigurationId={configurations.selectedConfigurationId}
            onSelect={configurations.setSelectedConfigurationId}
            onDelete={(id) => {
              if (confirm('Are you sure you want to delete this configuration?')) void action.run(() => configurations.deleteConfiguration(id));
            }}
          />
        )}</div>
        <div className="stack">
          <ConfigurationEditor configuration={configurations.selectedConfiguration} onSave={(id, payload) => action.run(() => configurations.updateConfiguration(id, payload))} />
          <ConfigurationMessages messages={configurations.selectedConfigurationMessages} isLoading={configurations.isMessagesLoading} />
        </div>
      </div>
    </>
  );
}
