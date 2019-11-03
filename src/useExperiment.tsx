import { useContext } from 'react';
import { ABContext } from './ABProvider';

export default function useExperiment(name: string) {
    const { experiments, loading, logEvent, logQuestionAnswer, error } = useContext(ABContext);
    const variant = experiments[name] ? experiments[name].name : undefined;
    return { loading, variant, log: logEvent || (() => null), answer: logQuestionAnswer || (() => null), error };
}
