import { Experiment, ABContext } from './ABProvider';
import { useContext } from 'react';

export interface QuestionHookConfig {
    id?: string; // if unspecified, shows a random question from experiment
    override?: boolean;
    probability?: number;
}

export const getQuestionHookForExperiment = (experiment?: Experiment) => (config?: QuestionHookConfig) => {
    const abProvider = useContext(ABContext);
    const show = () => {
        return abProvider.showQuestion && experiment && abProvider.showQuestion(experiment.id, config);
    };
    return { show };
};
