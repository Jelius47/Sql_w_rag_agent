// Add event listeners to suggestion items
document.querySelectorAll('.suggests__item').forEach(item => {
    item.addEventListener('click', () => {
        const suggestionText = item.querySelector('.suggests__item-text').innerText;
        handleSuggestionClick(suggestionText);
    });
});

// Handle suggestion clicks
function handleSuggestionClick(suggestionText) {
    let simulatedInput = suggestionText;
    displayMessage(simulatedInput, "outgoing");
    const { apiUrl, requestData } = determineApiEndpoint(simulatedInput);
    processRequest(apiUrl, requestData);
}

// Main query function for user input
async function sendQuery() {
    const inputElement = document.querySelector(".prompt__form-input");
    const userInput = inputElement.value.trim();
    inputElement.value = "";
    if (!userInput) return;

    displayMessage(userInput, "outgoing");

    const { apiUrl, requestData } = determineApiEndpoint(userInput);
    processRequest(apiUrl, requestData);
}

// Make the API request
async function processRequest(apiUrl, requestData) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) throw new Error("API request failed");

        const result = await response.json();
        displayMessage(result.data || result.message, "incoming");
    } catch (error) {
        console.error("Error:", error);
        displayMessage("An error occurred. Please try again later.", "incoming");
    }
}

// Determine API endpoint and request data
function determineApiEndpoint(userInput) {
    let apiUrl = "";
    let requestData = {};

    if (userInput.toLowerCase().includes("upload")) {
        apiUrl = "/file/upload";
    } else if (userInput.toLowerCase().includes("search from the web")) {
        apiUrl = "/web/search";
        requestData = { query: userInput };
    } else if (userInput.toLowerCase().includes("find out figures")) {
        apiUrl = "/db/query";
        requestData = { query: userInput };
    } else if (userInput.toLowerCase().includes("ask explanatory questions")) {
        apiUrl = "/rag/search";
        requestData = { prompt: userInput };
    } else {
        apiUrl = "/rag/search";
        requestData = { prompt: userInput };
    }

    return { apiUrl, requestData };
}

// Display message in the chat
function displayMessage(message, type) {
    const chatHistory = document.querySelector(".chats");
    const messageElement = document.createElement("div");
    messageElement.className = `message message--${type}`;
    messageElement.innerHTML = `<div class="message__content"><p>${message}</p></div>`;
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
