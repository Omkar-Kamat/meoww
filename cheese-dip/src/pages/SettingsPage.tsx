import { useState } from "react";
import { ProfileForm, AvatarUpload, accountApi } from "../features/account";
import { useAuthSession } from "../features/auth";
import { useNavigate, Link } from "react-router-dom";
import { getErrorMessage } from "../shared/utils/error";
import { Modal } from "../shared/components/Modal";
import { Flex, Box, Heading, Text, Button, TextField, Card } from "@radix-ui/themes";

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
        <Flex align="center" direction="column" className="page-container">
            <Box width="100%" maxWidth="600px">
                <Flex justify="between" align="center" mb="5">
                    <Heading size="6">Account Settings</Heading>
                    <Button variant="soft" color="gray" asChild>
                        <Link to="/chat" style={{ textDecoration: "none" }}>
                            Back to Chat
                        </Link>
                    </Button>
                </Flex>

                <AvatarUpload />
                <ProfileForm />

                <Card size="3" style={{ marginTop: "2.5rem", borderColor: "var(--tomato-a5)" }}>
                    <Heading size="4" color="tomato" mb="3">
                        Danger Zone
                    </Heading>
                    <Text as="p" color="gray" mb="4">
                        Once you delete your account, there is no going back. Please be certain.
                    </Text>
                    {error && (
                        <Text as="div" color="tomato" mb="3" size="2">
                            {error}
                        </Text>
                    )}
                    <Button
                        onClick={() => setIsDeleteModalOpen(true)}
                        color="tomato"
                        variant="solid"
                        size="3"
                    >
                        Delete Account
                    </Button>
                </Card>
            </Box>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmText("");
                }}
                title="Delete Account"
            >
                <Flex direction="column" gap="4">
                    <Text color="gray">
                        This action cannot be undone. All your data will be permanently removed.
                    </Text>
                    <Text>
                        Please type <strong>{user?.username}</strong> to confirm:
                    </Text>
                    <TextField.Root
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={user?.username}
                        size="3"
                    />
                    <Flex justify="end" gap="3" mt="2">
                        <Button
                            variant="soft"
                            color="gray"
                            size="3"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setDeleteConfirmText("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="tomato"
                            variant="solid"
                            size="3"
                            onClick={confirmDeleteAccount}
                            disabled={deleteConfirmText !== user?.username}
                        >
                            Delete Permanently
                        </Button>
                    </Flex>
                </Flex>
            </Modal>
        </Flex>
    );
};
