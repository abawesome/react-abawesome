import React, { FunctionComponent } from 'react';
import styles from './QuestionPopup.css';

const emojiScale = ['😩', '😟', '😐', '😊', '😄'];



const QuestionPopup: FunctionComponent<{
    questionText: string;
    type: 'YesNo' | 'Rating';
    onAnswer: (answer: number) => void;
}> = ({ questionText, type, onAnswer }) => {
    const EmojiButton = ({ emoji, value }: { emoji: string; value: number }) => {
        return (
            <button onClick={() => onAnswer(value)} className={styles.abawesome_button}>
                {emoji}
            </button>
        );
    };
    return (
        <div className={styles.abawesome_container}>
            <h1 className={styles.abawesome_questionText}>{questionText}</h1>
            {type === 'Rating' && (
                <div className={styles.abawesome_emojiScale}>
                    {emojiScale.map((emoji, idx) => (
                        <EmojiButton emoji={emoji} value={idx} />
                    ))}
                </div>
            )}
            {type === 'YesNo' && (
                <div className={styles.abawesome_yesnoContainer}>
                    <button
                        onClick={() => onAnswer(0)}
                        className={styles.abawesome_yesnoButton + ' ' + styles.abawesome_yes}
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => onAnswer(1)}
                        className={styles.abawesome_yesnoButton + ' ' + styles.abawesome_no}
                    >
                        No
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuestionPopup;
