function checkAnswers() {
    let score = 0;

    // Get selected answers
    const q1 = document.querySelector('input[name="q1"]:checked');
    const q2 = document.querySelector('input[name="q2"]:checked');

    // Correct answers
    if (q1 && q1.value === "a") score++;
    if (q2 && q2.value === "b") score++;

    // Display result
    const result = document.getElementById("result");
    if (!q1 || !q2) {
        result.textContent = "Please answer all questions.";
        result.style.color = "orange";
    } else {
        result.textContent = `You scored ${score}/2.`;
        result.style.color = score === 2 ? "green" : "red";
    }
}
