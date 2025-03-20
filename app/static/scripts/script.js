const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

// State variables
let currentUserMessage = null;
let isGeneratingResponse = false;

// Flask server configuration
const FLASK_SERVER_URL = "http://127.0.0.1:5000";  // Update if hosted elsewhere
const API_ROUTES = {
    webSearch: `${FLASK_SERVER_URL}/web/search`,
    ragSearch: `${FLASK_SERVER_URL}/rag/search`,
    fileUpload: `${FLASK_SERVER_URL}/file/upload`,
    dbQuery: `${FLASK_SERVER_URL}/db/query`
};

// Load saved chat history from localStorage
const loadSavedChatHistory = () => {
    const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

    document.body.classList.toggle("light_mode", isLightTheme);
    themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon"></i>' : '<i class="bx bx-sun"></i>';

    chatHistoryContainer.innerHTML = '';

    savedConversations.forEach(conversation => {
        // Display user message
        const userMessageHtml = `
            <div class="message__content">
                <img class="message__avatar" src="/static/images/assets/profile.png" alt="User avatar">
                <p class="message__text">${conversation.userMessage}</p>
            </div>
        `;
        chatHistoryContainer.appendChild(createChatMessageElement(userMessageHtml, "message--outgoing"));

        // Display API response
        const responseHtml = `
        <div class="message__content">
            <img class="message__avatar" src="/static/images/assets/gemini.svg" alt="Bot avatar">
            <p class="message__text">${conversation.apiResponse}</p>
        </div>
    `;
    
        chatHistoryContainer.appendChild(createChatMessageElement(responseHtml, "message--incoming"));
    });

    document.body.classList.toggle("hide-header", savedConversations.length > 0);
};

// Create a chat message element
const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
};

// Determine which route to call based on the user's message
const determineApiRoute = (message) => {
    if (message.startsWith("search web")) {
        return API_ROUTES.webSearch;
    } else if (message.startsWith("search rag")) {
        return API_ROUTES.ragSearch;
    } else if (message.startsWith("upload file")) {
        return API_ROUTES.fileUpload;
    } else if (message.startsWith("query db")) {
        return API_ROUTES.dbQuery;
    }
    return null;
};

// Adjust API endpoints based on your Flask routes


// Determine the appropriate Flask route
const getApiEndpoint = (message) => {
    if (message.startsWith("web:")) return API_ROUTES.webSearch;
    if (message.startsWith("rag:")) return API_ROUTES.ragSearch;
    if (message.startsWith("file:")) return API_ROUTES.fileUpload;
    if (message.startsWith("db:")) return API_ROUTES.dbQuery;
    return API_ROUTES.ragSearch;  // Default to RAG search if no prefix
};

// Fetch API response based on user input
const requestApiResponse = async (incomingMessageElement) => {
    const messageTextElement = incomingMessageElement.querySelector(".message__text");

    try {
        // Select the correct Flask route
        const apiUrl = getApiEndpoint(currentUserMessage);

        // Prepare payload based on the route
        let requestBody = {};
        if (apiUrl === API_ROUTES.fileUpload) {
            // If it's a file upload, adjust accordingly
            requestBody = { file_data: currentUserMessage.split("file:")[1].trim() };
        } else {
            requestBody = { query: currentUserMessage };
        }

        // Make the POST request to the Flask server
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error || "Failed to fetch response.");

        // Extract the response text
        const responseText = responseData.response || "No response received.";
        showTypingEffect(responseText, responseText, messageTextElement, incomingMessageElement);

        // Save conversation in local storage
        let savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
        savedConversations.push({
            userMessage: currentUserMessage,
            apiResponse: responseText
        });
        localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));

    } catch (error) {
        isGeneratingResponse = false;
        messageTextElement.innerText = `Error: ${error.message}`;
        messageTextElement.closest(".message").classList.add("message--error");
    } finally {
        incomingMessageElement.classList.remove("message--loading");
    }
};


// Show loading indicator
const displayLoadingAnimation = () => {
    const loadingHtml = `
        <div class="message__content">
            <img class="message__avatar" src="/static/images/assets/gemini.svg" alt="Bot avatar">
            <p class="message__text">Loading...</p>
            <div class="message__loading-indicator">
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
            </div>
        </div>
    `;

    const loadingMessageElement = createChatMessageElement(loadingHtml, "message--incoming", "message--loading");
    chatHistoryContainer.appendChild(loadingMessageElement);

    requestApiResponse(loadingMessageElement);
};

// Handle outgoing user message
const handleOutgoingMessage = () => {
    currentUserMessage = messageForm.querySelector(".prompt__form-input").value.trim();
    if (!currentUserMessage || isGeneratingResponse) return;

    isGeneratingResponse = true;

    const outgoingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="/static/images/assets/profile.png" alt="User avatar">
            <p class="message__text">${currentUserMessage}</p>
        </div>
    `;

    chatHistoryContainer.appendChild(createChatMessageElement(outgoingMessageHtml, "message--outgoing"));
    messageForm.reset();
    setTimeout(displayLoadingAnimation, 500);
};

// Clear chat history
clearChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all chat history?")) {
        localStorage.removeItem("saved-api-chats");
        loadSavedChatHistory();
    }
});

// Toggle theme
themeToggleButton.addEventListener("click", () => {
    const isLightTheme = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
    themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon"></i>' : '<i class="bx bx-sun"></i>';
});

// Send message on form submission
messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});

// Load saved chat history on page load
loadSavedChatHistory();
