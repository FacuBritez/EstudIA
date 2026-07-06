import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Quiz.css";

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const optionLetters = ["A", "B", "C", "D"];

  const quiz = location.state?.quiz;

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz) {
    return (
      <main className="quiz-empty">
        <h2>No hay ningun quiz generado.</h2>
        <button className="btn-secondary" onClick={() => navigate("/notes")}>
          Volver
        </button>
      </main>
    );
  }

  const score = quiz.questions.reduce((acc, question, index) => {
    return answers[index] === question.correctAnswer ? acc + 1 : acc;
  }, 0);

  return (
    <main className="quiz-shell">
      <header className="quiz-header">
        <div>
          <p className="eyebrow">Practica guiada</p>
          <h1>Trivia</h1>
        </div>
        <button className="btn-secondary" onClick={() => navigate("/notes")}>
          Volver
        </button>
      </header>

      {submitted && (
        <div className="quiz-score">
          Puntaje: {score} / {quiz.questions.length}
        </div>
      )}

      {quiz.questions.map((question, questionIndex) => (
        <section key={questionIndex} className="quiz-question">
          <h3>
            {questionIndex + 1}. {question.question}
          </h3>
          {question.options.map((option, optionIndex) => {
            let optionClass = "quiz-option";

            if (submitted) {
              if (optionIndex === question.correctAnswer) {
                optionClass += " correct";
              }

              if (
                answers[questionIndex] === optionIndex &&
                optionIndex !== question.correctAnswer
              ) {
                optionClass += " incorrect";
              }

              optionClass += " disabled";
            }

            return (
              <label key={optionIndex} className={optionClass}>
                <input
                  type="radio"
                  disabled={submitted}
                  checked={answers[questionIndex] === optionIndex}
                  name={`q-${questionIndex}`}
                  onChange={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [questionIndex]: optionIndex,
                    }))
                  }
                />
                <span className="option-marker">
                  {optionLetters[optionIndex]})
                </span>
                <span>{option}</span>
              </label>
            );
          })}
        </section>
      ))}

      <div className="quiz-actions">
        {!submitted ? (
          <button className="btn-primary" onClick={() => setSubmitted(true)}>
            Enviar respuestas
          </button>
        ) : (
          <button className="btn-secondary" onClick={() => navigate("/notes")}>
            Volver a mis apuntes
          </button>
        )}
      </div>
    </main>
  );
}
