import React, { useState } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { Sentence, AnswerList } from "./components"; // importing from index.ts
import { useDragAndDrop } from "./hooks/useDragAndDrop"; // importing from hooks folder
import { Grid, Button, Paper } from "@mui/material"; // importing Grid component

export interface Question {
  sentence: string;
  answers: string[];
  correctAnswer: string[]; // change this type
}

interface FillInTheBlankProps {
  questions: Question[];
}

const FillInTheBlank: React.FC<FillInTheBlankProps> = ({ questions }) => {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0); // state for current question index
  const [userScore, setUserScore] = useState(0); // state for user score

  const currentQuestion = questions[questionIndex]; // get the current question
  const sentenceParts = currentQuestion.sentence.split("___");
  const { handleDragEnd, answerIndices } = useDragAndDrop(
    currentQuestion.sentence,
    currentQuestion.answers,
    userAnswers,
    setUserAnswers
  );
  const checkAnswers = () => {
    const isCorrect = answerIndices.some((index) => {
      const answerId = userAnswers[`blank_${index}`];
      const expectedAnswers = currentQuestion.correctAnswer[index];
      return expectedAnswers.includes(answerId);
    });
    if (isCorrect) {
      console.log("User answers are correct!");
      setUserScore((prevScore) => prevScore + 1); // increment user score
    } else {
      console.log("User answers are incorrect.");
    }
    setShowResults(true);
  };

  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  const nextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prevIndex) => prevIndex + 1); // move to next question
      setUserAnswers({}); // reset user answers
      setShowResults(false); // hide results
    } else {
      console.log("Quiz completed!");
      console.log(`Your score is ${userScore} out of ${questions.length}`);
    }
  };
  
  const restartQuiz = () => {
    setQuestionIndex(0); // go back to first question
    setUserAnswers({}); // reset user answers
    setShowResults(false); // hide results
    setUserScore(0); // reset user score
  };

  return (
    <Paper // using Paper component
      sx={{
        padding: 3,
        borderRadius: 3,
        boxShadow: 3,
      }}
    >
      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container sx={{ gap: 1 }}>
          <Grid item xs={12} md={12} sx={{ order: { xs: 2, md: 1 } }}>
            <Sentence
              sentenceParts={sentenceParts}
              userAnswers={userAnswers}
              setUserAnswer={setUserAnswers}
              setShowResults={setShowResults}
              answers={currentQuestion.answers}
              question={currentQuestion}
              showResults={showResults}
              index={questionIndex}
              totalQuestions={questions.length}
            />
          </Grid>
          <Grid item xs={12} md={4} sx={{ order: { xs: 1, md: 2 } }}>
            <AnswerList
              answers={currentQuestion.answers}
              userAnswers={userAnswers}
              showResults={showResults}
            />
          </Grid>
          <Grid item xs={12} sx={{ order: { xs: 3, md: 3 }, margin: "1rem" }}>
            {!showResults && !isEmpty(userAnswers) && (
              <Button onClick={checkAnswers}>Check Answers</Button>
            )}
            {showResults && questionIndex < questions.length - 1 && (
              <Button onClick={nextQuestion}>Next Question</Button>
            )}
            {questionIndex === questions.length - 1 && (
              <Button onClick={restartQuiz}>Restart Quiz</Button>
            )}
          </Grid>
        </Grid>
      </DragDropContext>
    </Paper>
  );
};

export default FillInTheBlank;
