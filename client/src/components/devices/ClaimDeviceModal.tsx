import {type FormEvent, useState} from 'react';
import {Modal} from '../Modal';

interface ClaimDeviceModalProps {
    onClose: () => void;
    onClaim: (name: string, deviceId: string) => Promise<void>;
    isSubmitting?: boolean;
}

export function ClaimDeviceModal({onClose, onClaim, isSubmitting}: ClaimDeviceModalProps) {
    const [name, setName] = useState('');
    const [deviceId, setDeviceId] = useState('');

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        await onClaim(name.trim(), deviceId.trim());
        onClose();
    };

    return (
        <Modal title="Claim device" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="d-flex flex-column gap-2">
                    <div className="modal-body">
                        <label className="form-label">Device name</label>
                        <input
                            className="form-control"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Living room"
                            required
                        />
                    </div>
                    <div className="modal-body">
                        <label className="form-label">Device ID</label>
                        <input className="form-control" value={deviceId}
                               onChange={(event) => setDeviceId(event.target.value)} placeholder="Paste device UUID"
                               required/>
                    </div>
                    <div className="modal-footer d-flex gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn" style={{backgroundColor: '#7c3aed', color: 'white'}}
                                disabled={isSubmitting}>Claim
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
