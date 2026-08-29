import { useState } from "react";
import type { FormEvent } from "react";
import { useAuthSession } from "../../auth";
import { accountApi } from "../api/accountApi";
import { getErrorMessage, getApiError } from "../../../shared/utils/error";
import { Input } from "../../../shared/components/Input";
import { Button } from "../../../shared/components/Button";
import { FieldRow } from "../../../shared/components/FieldRow";
import { RULES } from "../../../shared/utils/ui.config";

export const ProfileForm = () => {
    const { user, fetchMe } = useAuthSession();
    const [name, setName] = useState(user?.name ?? "");
    const [username, setUsername] = useState(user?.username ?? "");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    const [prevUserId, setPrevUserId] = useState(user?.id);

    if (user && user.id !== prevUserId) {
        setName(user.name);
        setUsername(user.username);
        setPrevUserId(user.id);
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setMsg("");
        setError("");

        const reservedWords = ["admin", "meoww", "support", "test"];
        if (reservedWords.includes(username.toLowerCase())) {
            setError("This username is not allowed");
            return;
        }

        try {
            await accountApi.updateProfile({ name, username });
            await fetchMe();
            setMsg("Profile updated successfully!");
        } catch (err) {
            const apiErr = getApiError(err);
            if (apiErr?.code === "USERNAME_TAKEN" || apiErr?.code === "USERNAME_EXISTS") {
                setError("This username is already taken.");
            } else if (apiErr?.meta?.issues) {
                setError(apiErr.meta.issues.map((issue) => issue.message).join(", "));
            } else {
                setError(getErrorMessage(err, "Failed to update profile"));
            }
        }
    };

    return (
        <div
            style={{
                marginBottom: "30px",
                border: "1px solid #ccc",
                padding: "20px",
                borderRadius: "8px",
            }}
        >
            <h3>Update Profile</h3>
            <form onSubmit={handleSubmit}>
                <FieldRow label="Name">
                    <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={50}
                    />
                </FieldRow>
                <FieldRow label="Username">
                    <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={RULES.USERNAME_MIN_LENGTH}
                        maxLength={RULES.USERNAME_MAX_LENGTH}
                        pattern="^[a-z0-9_]+$"
                        title="Lowercase letters, numbers, and underscores only"
                    />
                </FieldRow>
                {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
                {msg && <div style={{ color: "green", marginBottom: "10px" }}>{msg}</div>}
                <Button type="submit">Save Changes</Button>
            </form>
        </div>
    );
};
