import { useState } from 'react';
import { AddUserModal } from '../components/devices/AddUserModal';
import { ClaimDeviceModal } from '../components/devices/ClaimDeviceModal';
import { DeviceDetails } from '../components/devices/DeviceDetails';
import { DeviceList } from '../components/devices/DeviceList';
import { StateAlert } from '../components/StateAlert';
import { useAuth } from '../auth/AuthContext';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useConfigurations } from '../hooks/useConfigurations';
import { useDevices } from '../hooks/useDevices';

export function DevicesPage() {
  const { user } = useAuth();
  const devices = useDevices();
  const configurations = useConfigurations();
  const action = useAsyncAction();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const selectedDeviceId = devices.selectedDevice?.id;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Devices</h1>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-purple btn-icon-label" onClick={() => setShowClaimModal(true)}>+ <span>Add Device</span></button>
        </div>
      </div>

      <StateAlert error={devices.error || configurations.error || action.error} />

      <div className="content-grid">
        <div>
          {devices.isLoading ? <div className="panel panel-body text-muted">Loading devices...</div> : (
            <DeviceList
              devices={devices.devices}
              selectedDeviceId={devices.selectedDeviceId}
              onSelect={devices.setSelectedDeviceId}
              onDelete={(deviceId) => {
                if (confirm('Are you sure you want to delete this device?')) void action.run(() => devices.deleteDevice(deviceId));
              }}
            />
          )}
        </div>
        <DeviceDetails
          device={devices.selectedDevice}
          currentUserId={user?.id ?? null}
          configurations={configurations.configurations}
          isLoading={devices.isDetailLoading}
          onAddUser={() => setShowAddUserModal(true)}
          onLeave={(deviceId) => {
            if (confirm('Do you really want to leave this device?')) void action.run(() => devices.leaveDevice(deviceId));
          }}
          onSetActiveUser={(userId, deviceId) => void action.run(() => devices.setActiveUser(userId, deviceId))}
          onSetActiveConfiguration={(relationId, configurationId) => void action.run(() => devices.setActiveConfiguration(relationId, configurationId))}
        />
      </div>

      {showClaimModal && <ClaimDeviceModal onClose={() => setShowClaimModal(false)} isSubmitting={action.isSubmitting} onClaim={(name, deviceId) => action.run(() => devices.claimDevice(name, deviceId))} />}
      {showAddUserModal && selectedDeviceId && <AddUserModal onClose={() => setShowAddUserModal(false)} isSubmitting={action.isSubmitting} onAddUser={(userId) => action.run(() => devices.addUserToDevice(userId, selectedDeviceId))} />}
    </>
  );
}
