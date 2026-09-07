const rock = document.querySelector("#rock");
const paper = document.querySelector("#paper");
const scissors = document.querySelector("#scissors");

const yourChoice = document.querySelector("#your-choice");
const computerChoice = document.querySelector("#computer-choice-value");
const winner = document.querySelector("#winner-value");

const choices = ["Rock", "Paper", "Scissors"];

function playGame(userChoice) {
    // Computer ki random choice
    const computer = choices[Math.floor(Math.random() * choices.length)];

    // Screen par choices show karna
    yourChoice.textContent = userChoice;
    computerChoice.textContent = computer;

    // Winner decide karna
    if (userChoice === computer) {
        winner.textContent = "Draw 🤝";
    } 
    else if (
        (userChoice === "Rock" && computer === "Scissors") ||
        (userChoice === "Paper" && computer === "Rock") ||
        (userChoice === "Scissors" && computer === "Paper")
    ) {
        winner.textContent = "You Win 🎉";
    } 
    else {
        winner.textContent = "Computer Wins 🤖";
    }
}

// Buttons par click event
rock.addEventListener("click", () => {
    playGame("Rock");
});

paper.addEventListener("click", () => {
    playGame("Paper");
});

scissors.addEventListener("click", () => {
    playGame("Scissors");
});