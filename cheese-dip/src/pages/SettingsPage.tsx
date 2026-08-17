import { useState } from "react";
import { ProfileForm, AvatarUpload, accountApi } from "../features/account";
import { useAuthSession } from "../features/auth";
import { useNavigate, Link } from "react-router-dom";
import { getErrorMessage } from "../shared/utils/error";

export const SettingsPage = () => {
  const { user, logout } = useAuthSession();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      return;
    }
    try {
      await accountApi.deleteAccount();
      await logout();
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete account"));
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
        <button 
          onClick={handleDeleteAccount}
          style={{ padding: "10px 15px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};
