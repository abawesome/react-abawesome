import React, { useState, FunctionComponent, useEffect } from 'react';
import { uuid, rand } from './utils';
import QuestionPopup from './QuestionPopup';
import { QuestionHookConfig } from './useQuestion';
// import QuestionPopup from './QuestionPopup';
import styles from './ABProvider.css';
interface Props {
    config: TestingConfig;
}
export interface Event {
    name: string;
}

export interface Answer {
    name: string;
}

export interface Question {
    name: string;
    id: string;
    kind: 'Rating' | 'YesNo';
}

export interface DisplayedQuestion {
    experimentId: string;
    questionId: string;
}

export interface TestingConfig {
    projectId: string;
    userId?: string;
    options?: {
        maxQuestionsPerSession: number;
    };
}
export interface Experiment {
    id: string;
    readableId: string;
    questions: Question[];
    variantDisplayedEventId: string;
}

export interface Variant {
    id: string;
}
export interface Mapping {
    experiment: Experiment;
    variant: Variant;
}
export interface ABContext {
    logEvent?: (variantId: string) => (eventId: string) => void;
    logQuestionAnswer?: (questionId: string, answer: number) => void;
    showQuestion?: (experimentId: string, config?: QuestionHookConfig) => void;
    mappings: { [experimentId: string]: Mapping };
    loading: boolean;
    error?: Error;
}

export const ABContext = React.createContext<ABContext>({
    loading: true,
    mappings: {},
});

let beaconString = '';

const LOCALSTORAGE_USER = 'abawesome_config_userid';
const API_URL = 'https://api.abaweso.me';

const ABProvider: FunctionComponent<Props> = ({ children, config: { projectId, userId, options: userOptions } }) => {
    const options = {
        maxQuestionsPerSession: 2,
        ...userOptions,
    };

    const [mappings, setMappings] = useState<{ [id: string]: Mapping }>({}); // TODO: integrate Suspense at some point
    const questions: { [id: string]: { variantId: string } & Question } = Object.values(mappings).reduce(
        (obj, curr) => {
            curr.experiment.questions.forEach(qst => {
                obj[qst.id] = { ...qst, variantId: curr.variant.id };
                return obj;
            });
            return obj;
        },
        {},
    );
    const [displayedQuestions, setDisplayedQuestions] = useState<string[]>([]);
    const [events, setEvents] = useState<{ variantId: string; eventId: string }[]>([]);
    const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
    const [sessionId, setSessionId] = useState<String | undefined>(undefined);
    const [error, setError] = useState<Error | undefined>(undefined);
    const getUserId = () => {
        if (userId) return userId;
        const savedUser = localStorage.getItem(LOCALSTORAGE_USER);
        if (savedUser) return savedUser;
        const newId = uuid();
        localStorage.setItem(LOCALSTORAGE_USER, newId);
        return newId;
    };

    useEffect(() => {
        fetch(`${API_URL}/project/${projectId}/experiments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ visitorId: getUserId() }),
        })
            .then(response => response.json())
            .then(data => {
                if (data === projectId) {
                    setError(new Error("Project not found"));
                    return;
                }
                setMappings(
                    data.reduce((obj: {}, item: { experiment: { id: string } }) => {
                        obj[item.experiment.id] = item;
                        return obj;
                    }, {}),
                );

                setSessionId(data.sessionId);
            })
            .catch(error => setError(error));
        window.addEventListener('unload', () => uploadConversion(), false);
        return uploadConversion;
    }, [projectId, setError, setMappings, setSessionId]);
    beaconString = JSON.stringify({
        events: events.map(e => ({ ...e, count: 1 })), //TODO: Make sure auto events not being triggered multiple times
        answers: Object.entries(answers).map(([k, v]) => ({
            questionId: k,
            variantId: questions[k].variantId,
            answer: v,
        })),
    });
    const uploadConversion = () => {
        let headers = {
            type: 'text/plain',
        };
        console.log({ beaconString });
        let blob = new Blob([beaconString], headers);
        navigator.sendBeacon(`${API_URL}/project/${projectId}/log`, blob);
    };

    const logEvent = (variantId: string) => (eventId: string) => {
        setEvents([...events, { variantId, eventId }]);
    };

    const logQuestionAnswer = (questionId: string) => (answer: number) =>
        setAnswers({ ...answers, [questionId]: answer });

    const showQuestion = (experimentId: string, config?: QuestionHookConfig) => {
        if (!(mappings[experimentId] && displayedQuestions.length < options.maxQuestionsPerSession)) return;
        const questionToAsk: Question | undefined =
            config && config.id
                ? questions[config.id]
                : rand(mappings[experimentId].experiment.questions.filter(q => !displayedQuestions.includes(q.id)));
        if (!questionToAsk) return;
        setDisplayedQuestions([...displayedQuestions, questionToAsk.id]);
    };
    return (
        <>
            <ABContext.Provider
                value={{
                    mappings,
                    logEvent: logEvent,
                    loading: !error && !!sessionId,
                    showQuestion,
                    error,
                }}
            >
                <div className={styles.abawesomeListContainer}>
                    {displayedQuestions.filter(qId => answers[qId] === undefined).reverse().map(qId => {
                        const question = questions[qId];
                        if (!question) return null;
                        return (
                            <QuestionPopup
                                onAnswer={logQuestionAnswer(question.id)}
                                type={question.kind}
                                questionText={question.name}
                            />
                        );
                    })}
                </div>

                {children}
            </ABContext.Provider>
        </>
    );
};
export default ABProvider;
