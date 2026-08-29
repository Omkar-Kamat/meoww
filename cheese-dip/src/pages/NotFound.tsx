import { Link } from "react-router-dom";
import { Flex, Heading, Button } from "@radix-ui/themes";

export const NotFound = () => {
    return (
        <Flex className="page-container" align="center" justify="center" direction="column" gap="5">
            <Heading size="8">404 - Page Not Found</Heading>
            <Button asChild size="3" variant="solid" color="ruby">
                <Link to="/">Go Home</Link>
            </Button>
        </Flex>
    );
};
