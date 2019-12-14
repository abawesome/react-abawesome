import { useContext, useEffect, useState } from 'react';
import { ABContext } from './ABProvider';
import { getQuestionHookForExperiment, QuestionHookConfig } from './useQuestion';

export default function useExperiment(id: string) {
    const { mappings, loading, logEvent, logQuestionAnswer, error } = useContext(ABContext);
    const experiment = mappings[id] && mappings[id].experiment;
    const [initEventLogged, setInitEventLogged] = useState(false);
    const variant = mappings[id] && mappings[id].variant;
    
    const [[questionHook], setQuestionHook] = useState<[((config?: QuestionHookConfig) => any)]>([
        getQuestionHookForExperiment(undefined),
    ]);
    useEffect(() => setQuestionHook([getQuestionHookForExperiment(experiment)]), [experiment]);
    useEffect(() => {
        if (logEvent && variant && logEvent(variant.id) && !initEventLogged) {
            logEvent(variant.id)(experiment.variantDisplayedEventId);
            setInitEventLogged(true);
        };
    }, [variant, logEvent]);
    console.log(variant);
    return {
        loading,
        variant: variant ? variant.id : undefined,
        log: (logEvent && variant && logEvent(variant.id)) || (() => null),
        answer: logQuestionAnswer || (() => null),
        error,
        useQuestion: questionHook,
    };
}
