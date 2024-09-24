import StepperRegister from '../../compoents/auth/Register/Stepper';

import { useSteps } from '@chakra-ui/react'

import { Input } from '@chakra-ui/react'
import { Stack, HStack, VStack, Divider } from '@chakra-ui/react'

export default function Register() {
    const steps = [
        { title: 'First', description: 'Contact Info' },
        { title: 'Second', description: 'Date & Time' },
        { title: 'Third', description: 'Select Rooms' },
    ]

    const { activeStep } = useSteps({
        index: 2,
        count: steps.length,
    })

    return (
        <div className='flex justify-center'>
            <div className='
                w-full
                max-w-3xl
                p-4
                rounded-md
                shadow-md
                mt-4
            '>
                <StepperRegister steps={steps} activeStep={activeStep} />
            </div>
        </div>
    )
}