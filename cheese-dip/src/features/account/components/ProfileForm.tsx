import React, { useState } from "react";
import { useAuthSession } from "../../auth";
import { accountApi } from "../api/accountApi";
import { getErrorMessage } from "../../../shared/utils/error";
import { Input } from "../../../shared/components/Input";
import { Button } from "../../../shared/components/Button";

export const ProfileForm = () => {
  const { user, fetchMe } = useAuthSession();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [prevUserId, setPrevUserId] = useState(user?.id);

  // We reset state during render to avoid an extra render cycle that a useEffect would cause.
  // This is React's recommended pattern for deriving state from props/arguments.
  if (user && user.id !== prevUserId) {
    setName(user.name);
    setUsername(user.username);
    setPrevUserId(user.id);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await accountApi.updateProfile({ name, username });
      await fetchMe();
      setMsg("Profile updated successfully!");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update profile"));
    }
  };

  return (
    <div style={{ marginBottom: "30px", border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
      <h3>Update Profile</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Name</label>
          <Input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Username</label>
          <Input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            
          />
        </div>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        {msg && <div style={{ color: "green", marginBottom: "10px" }}>{msg}</div>}
        <Button type="submit" >
          Save Changes
        </Button>
      </form>
    </div>
  );
};
