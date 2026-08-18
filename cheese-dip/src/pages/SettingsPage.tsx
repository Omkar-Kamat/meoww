import { useState } from "react";
import { ProfileForm, AvatarUpload, accountApi } from "../features/account";
import { useAuthSession } from "../features/auth";
import { useNavigate, Link } from "react-router-dom";
import { getErrorMessage } from "../shared/utils/error";
import { Button } from "../shared/components/Button";
import { Modal } from "../shared/components/Modal";

export const SettingsPage = () => {
  const { user, logout } = useAuthSession();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText !== user?.username) return;
    try {
      await accountApi.deleteAccount();
      await logout();
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete account"));
      setIsDeleteModalOpen(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Account Settings</h2>
        <Link to="/chat" style={{ textDecoration: "none", color: "#007bff" }}>Back to Chat</Link>
      </div>
      
      <AvatarUpload />
      <ProfileForm />

      <div style={{ border: "1px solid #dc3545", padding: "20px", borderRadius: "8px", marginTop: "40px" }}>
        <h3 style={{ color: "#dc3545", marginTop: 0 }}>Danger Zone</h3>
        <p>Once you delete your account, there is no going back. Please be certain.</p>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        <Button 
          onClick={() => setIsDeleteModalOpen(true)}
          style={{ backgroundColor: "#dc3545" }}
        >
          Delete Account
        </Button>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmText("");
        }}
        title="Delete Account"
      >
        <p>This action cannot be undone. All your data will be permanently removed.</p>
        <p>Please type <strong>{user?.username}</strong> to confirm:</p>
        <input
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder={user?.username}
          style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Button onClick={() => {
            setIsDeleteModalOpen(false);
            setDeleteConfirmText("");
          }} style={{ backgroundColor: "#6c757d" }}>Cancel</Button>
          <Button 
            onClick={confirmDeleteAccount}
            disabled={deleteConfirmText !== user?.username}
            style={{ backgroundColor: deleteConfirmText !== user?.username ? "#ccc" : "#dc3545", cursor: deleteConfirmText !== user?.username ? "not-allowed" : "pointer" }}
          >
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
};
