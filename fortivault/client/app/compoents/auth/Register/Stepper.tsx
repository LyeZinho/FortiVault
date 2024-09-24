/*
    function Example() {
        const { activeStep } = useSteps({
            index: 1,
            count: steps.length,
        })

        return (
            <Stepper size='lg' colorScheme='yellow' index={activeStep}>
                {steps.map((step, index) => (
                    <Step key={index}>
                        <StepIndicator>
                            <StepStatus complete={`✅`} incomplete={`😅`} active={`📍`} />
                        </StepIndicator>

                        <Box flexShrink='0'>
                            <StepTitle>{step.title}</StepTitle>
                            <StepDescription>{step.description}</StepDescription>
                        </Box>

                        <StepSeparator />
                    </Step>
                ))}
            </Stepper>
        )
    }
*/

import {
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Stepper,
    useSteps,
    Box
} from '@chakra-ui/react'

/*
        <Stepper size='lg' colorScheme='yellow' index={activeStep}>
            {steps.map((step, index) => (
                <Step key={index}>
                    <StepIndicator>
                        <StepStatus complete={`✅`} incomplete={`😅`} active={`📍`} />
                    </StepIndicator>

                    <Box flexShrink='0'>
                        <StepTitle>{step.title}</StepTitle>
                        <StepDescription>{step.description}</StepDescription>
                    </Box>

                    <StepSeparator />
                </Step>
            ))}
        </Stepper>
*/


/*

*/

interface StepType {
    title: string;
    description: string;
}

function StepperRegister({ steps, activeStep }: { steps: StepType[], activeStep: number }) {
    return (
        <Stepper size='lg' colorScheme='yellow' index={activeStep}>
            {steps.map((step: StepType, index: number) => (
                <Step key={index}>
                    <StepIndicator>
                        <StepStatus complete={`✅`} incomplete={`😅`} active={`📍`} />
                    </StepIndicator>

                    <Box flexShrink='0'>
                        <StepTitle>{step.title}</StepTitle>
                        <StepDescription>{step.description}</StepDescription>
                    </Box>

                    <StepSeparator />
                </Step>
            ))}
        </Stepper>
    )
}

export default StepperRegister;