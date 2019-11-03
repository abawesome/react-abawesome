import React, { useState, FunctionComponent, useEffect } from 'react';
import { uuid } from './utils';

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
}

export interface TestingConfig {
    projectId: string;
    userId?: string;
}
export interface Experiment {
    name: string;
    variant: { name: string };
}
export interface ABContext {
    logEvent?: (eventId: string) => void;
    logQuestionAnswer?: (questionId: string, answer: number) => void;
    experiments: { [name: string]: Experiment };
    loading: boolean;
    error?: Error;
}

export const ABContext = React.createContext<ABContext>({
    loading: true,
    experiments: {},
});

const LOCALSTORAGE_USER = 'abawesome_config_userid';
const API_URL = 'https://abawesome-rel-staging.azurewebsites.net';
// interface Cookie {
//     userId: string;
// }

const ABProvider: FunctionComponent<Props> = ({ children, config: { projectId, userId } }) => {
    const [experiments, setExperiments] = useState<{ [id: string]: Experiment }>({}); // TODO: integrate Suspense at some point
    const [events, setEvents] = useState<Event[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
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
                if (!data.experiments) {
                    setError(new Error(JSON.stringify(data.errors)));
                    return;
                }
                setExperiments(
                    data.experiments.reduce((obj: {}, item: { experiment: string }) => {
                        obj[item.experiment] = item;
                        return obj;
                    }, []),
                );
                setSessionId(data.sessionId);
            })
            .catch(error => setError(error));
        window.onbeforeunload = uploadConversion;
        return uploadConversion;
    }, [projectId, setError, setExperiments, setSessionId]);

    const uploadConversion = () => {
        fetch(`${API_URL}/project/${projectId}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                visitor_id: getUserId(),
                events: events,
            }),
        }).catch(error => console.error(error));
    };

    const logEvent = (eventName: string) => {
        setEvents([...events, { name: eventName }]);
        // this.setState({
        //     logItems: this.state.logItems.concat([
        //         {
        //             type: type === 'built-in' ? 'built-in' : 'custom',
        //             name: eventName,
        //             time: Math.round(performance.now()),
        //         },
        //     ]),
        // });
    };

    const logQuestionAnswer = (eventName: string) => {
        setAnswers([...answers, { name: eventName }]);
        // this.setState({
        //     logItems: this.state.logItems.concat([
        //         {
        //             type: type === 'built-in' ? 'built-in' : 'custom',
        //             name: eventName,
        //             time: Math.round(performance.now()),
        //         },
        //     ]),
        // });
    };

    // const { children } = this.props;
    // const { experiments, loading } = this.state;
    return (
        <>
            <ABContext.Provider
                value={{
                    experiments,
                    logEvent: logEvent,
                    logQuestionAnswer: logQuestionAnswer,
                    loading: !error && Object.keys(experiments).length === 0,
                    error,
                }}
            >
                {children}
            </ABContext.Provider>
        </>
    );
};
export default ABProvider;
