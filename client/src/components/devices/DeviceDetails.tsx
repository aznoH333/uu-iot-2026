import type {AssistantConfiguration, DeviceWithDetails} from '../../types/api';

interface DeviceDetailsProps {
    device: DeviceWithDetails | null;
    currentUserId: string | null;
    configurations: AssistantConfiguration[];
    isLoading?: boolean;
    onAddUser: () => void;
    onLeave: (deviceId: string) => void;
    onSetActiveUser: (userId: string, deviceId: string) => void;
    onSetActiveConfiguration: (relationId: string, configurationId: string) => void;
}

function UserIcon() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2"/>
    </svg>;
}

function CloseIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>;
}

export function DeviceDetails({
                                  device,
                                  currentUserId,
                                  configurations,
                                  isLoading,
                                  onAddUser,
                                  onLeave,
                                  onSetActiveUser,
                                  onSetActiveConfiguration
                              }: DeviceDetailsProps) {
    if (!device) {
        return (
            <div className="panel empty-state">
                <div>
                    <div className="empty-state-icon"/>
                    <p className="empty-title">Select a device to view details</p>
                    <p className="empty-text">Choose a device from the list to manage its users</p>
                </div>
            </div>
        );
    }

    const currentUserRelation = currentUserId
        ? device.relations.find((item) => item.userId === currentUserId)
        : undefined;
    const myConfigurations = configurations.filter((configuration) => configuration.ownerId === currentUserId);
    const isCurrentUserActive = currentUserRelation?.id === device.activeUserRelation;
    const canSetSelfActive = Boolean(currentUserRelation) && !isCurrentUserActive;

    return (
        <div className="panel">
            <div className="panel-body">
                <div className="details-header">
                    <div>
                        <div className="details-title-row">
                            <h2 className="panel-title mb-0">{device.name || 'Unnamed device'}</h2>
                            <button
                                type="button"
                                className="status-badge text-nowrap"
                                onClick={() => currentUserId && onSetActiveUser(currentUserId, device.id)}
                                disabled={!canSetSelfActive}
                                title={canSetSelfActive ? 'Set yourself as active user' : 'You are already active or not assigned to this device'}
                            >
                                {isCurrentUserActive ? 'Active' : 'Set Active'}
                            </button>
                            {currentUserRelation && (
                                <select
                                    className="form-select form-select-sm"
                                    value={currentUserRelation.activeConfigurationId ?? ''}
                                    onChange={(event) => onSetActiveConfiguration(currentUserRelation.id, event.target.value)}
                                >
                                    <option value="" disabled>Select configuration</option>
                                    {myConfigurations.map((configuration) => (
                                        <option key={configuration.id} value={configuration.id}>
                                            {configuration.assistantName ?? ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        {isLoading && <div className="text-muted small mt-2">Loading detail...</div>}
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-purple btn-icon-label" onClick={onAddUser}>+ <span>Add User</span>
                        </button>
                        <button
                            className="icon-danger"
                            title="Leave device"
                            type="button"
                            onClick={() => onLeave(device.id)}
                        >
                            <CloseIcon/>
                        </button>
                    </div>
                </div>

                <h3 className="section-title">Users ({device.users.length})</h3>
                <div className="user-list">
                    {device.users.map((user) => {
                        const relation = device.relations.find((item) => item.userId === user.id);
                        const isActiveUser = relation?.id === device.activeUserRelation;

                        return (
                            <div key={user.id} className="user-row">
                                <div className="avatar"><UserIcon/></div>
                                <div className="min-w-0">
                                    <div>{user.firstName} {user.lastName}</div>
                                    <div className="d-flex align-items-center flex-wrap gap-1">
                                        <span
                                            className={`role-badge ${user.userRole === 'admin' ? 'admin' : ''}`}>{user.userRole}</span>
                                        {isActiveUser && <span className="role-badge admin">active user</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {device.users.length === 0 &&
                        <div className="p-4 text-center text-muted">No users assigned to this device.</div>}
                </div>
            </div>
        </div>
    );
}
