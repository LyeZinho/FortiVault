import StepperRegister from '../../compoents/auth/Register/Stepper';

import { useSteps } from '@chakra-ui/react'



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
        <div>
            <StepperRegister steps={steps}
                activeStep={activeStep}
            />
        </div>
    )
}