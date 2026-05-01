import type { AssistantConfiguration } from '../../types/api';

interface ConfigurationListProps {
  configurations: AssistantConfiguration[];
  selectedConfigurationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function DotsIcon() {
  return <span aria-hidden="true">··</span>;
}

function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function ConfigurationList({ configurations, selectedConfigurationId, onSelect, onDelete }: ConfigurationListProps) {
  return (
    <div className="entity-list">
      {configurations.map((configuration) => {
        const selected = configuration.id === selectedConfigurationId;
        return (
          <button type="button" key={configuration.id} className={`entity-row config-row ${selected ? 'active' : ''}`} onClick={() => onSelect(configuration.id)}>
            <div className="entity-icon-circle"><DotsIcon /></div>
            <div>
              <p className="entity-row-title">{configuration.assistantName || 'Unnamed configuration'}</p>
              <div className="entity-row-subtitle">{configuration.assistantVoice || 'No voice selected'}</div>
            </div>
            <span
              className="entity-delete"
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(configuration.id);
              }}
            >
              <TrashIcon />
            </span>
          </button>
        );
      })}

      {configurations.length === 0 && (
        <div className="empty-state">
          <div>
            <p className="empty-title">No configurations found</p>
            <p className="empty-text">Create your first assistant configuration.</p>
          </div>
        </div>
      )}
    </div>
  );
}
