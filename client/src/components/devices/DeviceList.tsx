import type { Device } from '../../types/api';

interface DeviceListProps {
  devices: Device[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
  onDelete: (deviceId: string) => void;
}

function PhoneIcon({ selected }: { selected: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="18" rx="2" stroke={selected ? '#fff' : '#111827'} strokeWidth="2" /></svg>;
}

function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function DeviceList({ devices, selectedDeviceId, onSelect, onDelete }: DeviceListProps) {
  return (
    <div className="entity-list">
      {devices.map((device) => {
        const selected = selectedDeviceId === device.id;
        return (
          <button key={device.id} type="button" className={`entity-row ${selected ? 'active' : ''}`} onClick={() => onSelect(device.id)}>
            <PhoneIcon selected={selected} />
            <div>
              <p className="entity-row-title">{device.name || 'Unnamed device'}</p>
              <div className="entity-row-subtitle">
                {device.userCount && device.userCount > 0
                  ? `${device.userCount} user${device.userCount === 1 ? '' : 's'}`
                  : 'No users'}
              </div>
            </div>
            <span
              className="entity-delete"
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(device.id);
              }}
            >
              <TrashIcon />
            </span>
          </button>
        );
      })}

      {devices.length === 0 && (
        <div className="empty-state">
          <div>
            <p className="empty-title">No devices yet</p>
            <p className="empty-text">Add or claim a device to get started.</p>
          </div>
        </div>
      )}
    </div>
  );
}
