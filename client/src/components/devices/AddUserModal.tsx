import { type FormEvent, useState } from 'react';
import { Modal } from '../Modal';

interface AddUserModalProps {
  onClose: () => void;
  onAddUser: (userId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddUserModal({ onClose, onAddUser, isSubmitting }: AddUserModalProps) {
  const [userId, setUserId] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onAddUser(userId.trim());
    onClose();
  };

  return (
    <Modal title="Add user to device" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <label className="form-label">User ID</label>
          <input className="form-control" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="Paste user UUID" required />
        </div>
        <div className="modal-footer d-flex gap-2 mt-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" style={{ backgroundColor: '#7c3aed', color: 'white' }} disabled={isSubmitting}>Add user</button>
        </div>
      </form>
    </Modal>
  );
}
