import { Button, ButtonGroup } from '@chakra-ui/react'

export default function EnterButtons(){
    return (
        <ButtonGroup variant="solid" size="sm">
            <Button as="a" href="/auth/login">
                Login
            </Button>
            <Button as="a" href="/auth/register">
                Register
            </Button>
        </ButtonGroup>
    )
}