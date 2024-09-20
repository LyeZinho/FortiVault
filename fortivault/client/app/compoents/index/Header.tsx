import { Heading, Text } from "@chakra-ui/react";

export default function Header() {
    return (
        <div className="flex flex-col items-center">
            <Heading
                as="h1"
                className="text-6xl font-geist-sans"
                style={{ fontFamily: "var(--font-geist-sans)", fontSize: "5rem" }}
            >
                Forti {" "}
                <span className="text-blue-600 hover:underline">Vault</span>
            </Heading>
            <Text
                as="p"
                className="text-xl font-geist-mono"
                style={{ fontFamily: "var(--font-geist-mono)", fontSize: "2rem" }}
            >
                Your private, secure, password manager.
            </Text>
        </div>
    )
}