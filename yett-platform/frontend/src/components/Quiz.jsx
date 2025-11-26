import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

function Quiz({ user, token, showToast }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadQuiz();
    }, [id, token]);

    const loadQuiz = async () => {
        try {
            const data = await api.getQuiz(id, token);
            setQuiz(data);
        } catch (err) {
            showToast(err.message || 'Failed to load quiz', 'error');
        }
    };

    const handleSelect = (qIndex, optionIndex) => {
        setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await api.submitQuiz(id, answers, token);
            setResults(response);
            showToast(`Score: ${response.score}/${response.total}`, 'success');
        } catch (err) {
            showToast(err.message || 'Failed to submit quiz', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!quiz) return (
        <div className="loading"><div className="spinner"></div><p>Loading quiz...</p></div>
    );

    return (
        <div className="section">
            <div className="container">
                <h2>{quiz.title || 'Module Quiz'}</h2>
                <form onSubmit={handleSubmit} className="quiz-container">
                    {quiz.questions.map((q, qi) => {
                        const selected = typeof answers[qi] !== 'undefined' ? answers[qi] : null;
                        const res = results?.results ? results.results[qi] : null;
                        return (
                            <div key={qi} className="quiz-question">
                                <h4>{q.question}</h4>
                                <div className="quiz-options">
                                    {q.options.map((opt, oi) => {
                                        const isSelected = selected === oi;
                                        const isCorrect = res ? res.correctIndex === oi : false;
                                        const isUserCorrect = res ? res.correct && isSelected : false;
                                        const cls = res ? (isSelected ? (isUserCorrect ? 'quiz-option correct' : 'quiz-option incorrect selected') : (isCorrect ? 'quiz-option correct' : 'quiz-option')) : (isSelected ? 'quiz-option selected' : 'quiz-option');
                                        return (
                                            <div key={oi} className={cls} onClick={() => { if (!results) handleSelect(qi, oi); }}>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                                {res && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <strong>Result:</strong> {res.correct ? 'Correct' : 'Incorrect'}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
                        {!results && <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Quiz'}</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Quiz;
