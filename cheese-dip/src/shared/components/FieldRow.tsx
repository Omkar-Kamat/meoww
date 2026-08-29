import type { ReactNode } from "react";
import { Flex, Text } from "@radix-ui/themes";

export const FieldRow = ({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    children: ReactNode;
}) => {
    return (
        <Flex direction="column" gap="1" mb="4">
            <Text as="label" htmlFor={htmlFor} size="2" weight="bold" color="gray">
                {label}
            </Text>
            {children}
            {error && (
                <Text color="ruby" size="1" mt="1" aria-live="polite">
                    {error}
                </Text>
            )}
        </Flex>
    );
};
