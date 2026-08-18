import React, { useState } from "react";
import { useAuthSession } from "../../auth";
import { accountApi } from "../api/accountApi";
import { getErrorMessage } from "../../../shared/utils/error";
import { Input } from "../../../shared/components/Input";
import { Button } from "../../../shared/components/Button";

export const AvatarUpload = () => {
  const { user, fetchMe } = useAuthSession();
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setMsg("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      await accountApi.updateAvatar(formData);
      await fetchMe();
      setMsg("Avatar updated successfully!");
      setFile(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload avatar"));
    }
  };

  return (
    <div style={{ marginBottom: "30px", border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
      <h3>Profile Photo</h3>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
        {user?.profilePhotoUrl ? (
          <img 
            src={user.profilePhotoUrl} 
            alt="Avatar" 
            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", marginRight: "15px" }} 
          />
        ) : (
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#eee", marginRight: "15px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            No Avatar
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Input 
            type="file" 
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button 
            type="submit" 
            disabled={!file}
            style={{ alignSelf: "flex-start", backgroundColor: file ? "#28a745" : "#ccc" }}
          >
            Upload New Avatar
          </Button>
        </form>
      </div>
      {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}
      {msg && <div style={{ color: "green", marginTop: "10px" }}>{msg}</div>}
    </div>
  );
};
