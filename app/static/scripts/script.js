const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

// Fixed form submission handler
messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});

// Remove the onclick attribute from the HTML and use this event listener instead
document.getElementById("sendButton").addEventListener("click", (e) => {
    e.preventDefault();  // Prevent form submission as we'll handle it manually
    handleOutgoingMessage();
});

let isGeneratingResponse = false;

const FLASK_SERVER_URL = "http://127.0.0.1:5000";
const FLASK_SERVER_URL_RENDER="https://sql-w-rag-agent.onrender.com"
const API_ROUTES = {
    webSearch: `${FLASK_SERVER_URL_RENDER}/web/search`,
    ragSearch: `${FLASK_SERVER_URL_RENDER}/rag/search`,
    fileUpload: `${FLASK_SERVER_URL_RENDER}/file/upload`,
    dbQuery: `${FLASK_SERVER_URL_RENDER}/db/query`
};
document.addEventListener("DOMContentLoaded", function () {
    const userId = "550e8400-e29b-41d4-a716-446655440000"; // Replace with real user ID in production
    const toggleButton = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");
    const chatList = document.getElementById("chatList");
    const chatWindow = document.getElementById("chatWindow");

    // Toggle sidebar visibility
    toggleButton.addEventListener("click", function () {
        sidebar.classList.toggle("active");
    });

    // Fetch chat titles when the page loads
    fetchChats(userId);

    // Fetch chat titles
        // Updated fetchChats with auto-load for latest chat
    async function fetchChats(userId) {
        try {
            const response = await fetch(`/db/${userId}/chats`);
            const data = await response.json();

            if (data.status === "success") {
                chatList.innerHTML = "";

                data.chats.forEach((chat, index) => {
                    const chatItem = document.createElement("li");
                    chatItem.classList.add("chat-item");
                    chatItem.innerHTML = `
                        <span class="chat-title" data-chat-id="${chat.id}">${chat.title}</span>
                    `;
                    chatList.appendChild(chatItem);

                    // Load the first chat by default
                    if (index === 0) {
                        fetchChatHistory(chat.id);
                    }

                    chatItem.addEventListener("click", function () {
                        fetchChatHistory(chat.id);
                        sidebar.classList.remove("active");
                    });
                });
            } else {
                console.error("Error fetching chats:", data.message);
            }
        } catch (err) {
            console.error("Error fetching chats:", err);
        }
    }

    // Fetch messages for a given chat
    async function fetchChatHistory(chatId) {
        try {
            const response = await fetch(`/db/chats/${chatId}/history`);
            const data = await response.json();

            if (data.status === "success") {
                chatWindow.innerHTML = "";

                data.messages.forEach(msg => {
                    const msgElement = document.createElement("div");
                    msgElement.className = msg.sender === "user" ? "message user" : "message bot";
                    msgElement.innerHTML = `
                        <p><strong>${msg.sender}</strong>: ${msg.content}</p>
                        <p><small>${new Date(msg.created_at).toLocaleString()}</small></p>
                    `;
                    chatWindow.appendChild(msgElement);
                });

                // Scroll to bottom
                chatWindow.scrollTop = chatWindow.scrollHeight;
            } else {
                console.error("Error loading messages:", data.message);
            }
        } catch (err) {
            console.error("Error fetching chat history:", err);
        }
    }
});

const renderMarkdown = (text) => {
    return marked.parse(text || "");
};

function createLoadingElement() {
    return createMessageElement(
        "Loading...",
        "message--incoming message--loading",
        "/static/images/assets/gemini.svg"
    );
}

// Trigger file input click when upload button is clicked
window.triggerFileUpload = function() {
    document.getElementById('fileInput').click();
};

// Fixed File Upload Handling
const handleFileUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Create a container to display results
    let fileDisplayArea = document.getElementById('file-upload-results');
    if (!fileDisplayArea) {
        fileDisplayArea = document.createElement('div');
        fileDisplayArea.id = 'file-upload-results';
        fileDisplayArea.className = 'file-upload-results';
        chatHistoryContainer.appendChild(fileDisplayArea);
    }

    // Create a user message showing file upload
    const userMessageElement = createMessageElement(
        `Uploading file: ${file.name}`,
        "message--outgoing",
        "/static/images/assets/profile.png"
    );
    chatHistoryContainer.appendChild(userMessageElement);

    // Show loading message
    const loadingElement = createMessageElement(
        `<p>Uploading <strong>${file.name}</strong>...</p><div class="loading-spinner"></div>`,
        "message--incoming message--loading",
        "/static/images/assets/gemini.svg"
    );
    chatHistoryContainer.appendChild(loadingElement);

    // Scroll to the bottom
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;

    try {
        const formData = new FormData();
        formData.append('file', file);

        const userId = localStorage.getItem("user_id");
        if (userId) {
            formData.append('user_id', userId);
        }

        const response = await fetch(API_ROUTES.fileUpload, {
            method: "POST",
            body: formData
        });

        const responseData = await response.json();
        if (!response.ok || responseData.status !== "success") {
            throw new Error(responseData.message || responseData.error || "File upload failed.");
        }

        // 🔥 Render markdown response from backend
        const markdownResponse = responseData.markdown_response || "File uploaded successfully, but no details provided.";

        // Convert Markdown to HTML
        const formattedHTML = formatResponseText(markdownResponse);

        // Update the loading message with response
        updateMessageContent(loadingElement, formattedHTML);

        // 🔒 Save file info for later reference
        const fileId = responseData.raw_data?.file_id;
        const tableName = responseData.raw_data?.table_name;

        if (fileId && tableName) {
            const uploadedFiles = JSON.parse(localStorage.getItem("uploaded_files") || "[]");
            uploadedFiles.push({
                fileName: file.name,
                fileId,
                tableName,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem("uploaded_files", JSON.stringify(uploadedFiles));
        }

        // Save to chat history
        saveToHistory({
            userMessage: `Uploaded file: ${file.name}`,
            formattedResponse: formattedHTML,
            fileId: responseData.raw_data?.file_id
        });

        showToast(`✅ File "${file.name}" uploaded successfully!`);

    } catch (error) {
        updateMessageContent(loadingElement, `
            <div class="message__error">
                <p><strong>Error:</strong> ${error.message}</p>
            </div>
        `);
        loadingElement.classList.add("message--error");
        console.error("Upload failed:", error);
    } finally {
        event.target.value = ''; // Reset file input
    }
};

// Make sure fileInput has an event listener
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

// Add a function to show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    // Animation
    setTimeout(() => {
        toast.classList.add('toast--visible');
    }, 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Function for querying uploaded files
function queryUploadedFile(fileId, sqlQuery) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(`${FLASK_SERVER_URL_RENDER}/db/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    file_id: fileId,
                    query: sqlQuery
                })
            });
            
            const data = await response.json();
            
            if (!response.ok || data.status !== "success") {
                throw new Error(data.message || data.error || "Query failed");
            }
            
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
}

// Helper functions
function createMessageElement(content, styleClass, avatar) {
    const div = document.createElement('div');
    div.className = `message ${styleClass}`;
    div.innerHTML = `
        <div class="message__content">
            <img class="message__avatar" src="${avatar}" alt="Avatar">
            <div class="message__text">${content}</div>
        </div>
    `;
    return div;
}

function updateMessageContent(element, content) {
    if (!element) {
        console.error("Element is null or undefined");
        return;
    }
    
    const textElement = element.querySelector('.message__text');
    if (!textElement) {
        console.error("Message text element not found");
        element.innerHTML = `<div class="message__content">
            <img class="message__avatar" src="/static/images/assets/gemini.svg" alt="Avatar">
            <div class="message__text">${content}</div>
        </div>`;
    } else {
        textElement.innerHTML = content;
    }
    
    element.classList.remove("message--loading");
}

function saveToHistory({ userMessage, rawData, formattedResponse, fileId = null }) {
    const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    savedConversations.push({
        userMessage,
        rawData,
        formattedResponse,
        fileId // This will be null if not provided
    });
    localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
}

function handleUploadError(element, error) {
    const textElement = element.querySelector('.message__text');
    textElement.innerHTML = `
        <div class="message__error">
            <strong>Error:</strong> ${error.message}
            ${error.details ? `<div class="error-details">${error.details}</div>` : ''}
        </div>
    `;
    element.classList.add("message--error");
}

const loadSavedChatHistory = () => {
    const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

    document.body.classList.toggle("light_mode", isLightTheme);
    themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon"></i>' : '<i class="bx bx-sun"></i>';

    chatHistoryContainer.innerHTML = '';

    savedConversations.forEach(conversation => {
        // User message
        const userMessageElement = createMessageElement(
            conversation.userMessage,
            "message--outgoing",
            "/static/images/assets/profile.png"
        );
        chatHistoryContainer.appendChild(userMessageElement);

        // Bot response
        const responseElement = createMessageElement(
            conversation.formattedResponse || conversation.apiResponse || "",
            "message--incoming",
            "/static/images/assets/gemini.svg"
        );
        chatHistoryContainer.appendChild(responseElement);
    });

    document.body.classList.toggle("hide-header", savedConversations.length > 0);
};

// Fixed suggestion box functionality
document.addEventListener('DOMContentLoaded', function() {
    // Handle regular suggestion items
    document.querySelectorAll(".suggests__item").forEach((item) => {
        item.addEventListener("click", () => {
            // Skip if this is the upload button
            if (item.classList.contains('prompt__form-button')) {
                return;
            }
            
            const message = item.querySelector(".suggests__item-text").textContent.trim();
            if (!message) return;

            // Set current message and process it
            const inputElement = document.querySelector(".prompt__form-input");
            inputElement.value = message;
            handleOutgoingMessage();
        });
    });
});

const getApiEndpoint = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Check for keywords anywhere in the message
    if (/\b(web|search|internet|online)\b/.test(lowerMessage)) {
        return API_ROUTES.webSearch;
    }
    if (/\b(db|database|query|sql)\b/.test(lowerMessage)) {
        return API_ROUTES.dbQuery;
    }
    // Default to RAG for general queries
    return API_ROUTES.ragSearch;
};

const requestApiResponse = async (userMessage) => {
    // Create and append loading message
    const loadingMessage = createMessageElement(
        "Loading...",
        "message--incoming message--loading",
        "/static/images/assets/gemini.svg"
    );
    chatHistoryContainer.appendChild(loadingMessage);
    
    // Scroll to the bottom of the chat container
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;

    let displayContent = "";
    let rawData = null;

    try {
        const apiUrl = getApiEndpoint(userMessage);
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: userMessage }),
        });

        const responseData = await response.json();
        
        if (!response.ok || responseData.status !== "success") {
            throw new Error(responseData.error || responseData.message || "Request failed");
        }

        // Handle different response formats
        if (apiUrl === API_ROUTES.webSearch) {
            // Web search results processing
            const searchResults = responseData.result[0][1] || [];
            if (!searchResults.length) throw new Error("No search results found");
            
            displayContent = formatSearchResults(searchResults);
            rawData = searchResults;
        } else {
            // RAG and other routes processing
            const responseText = extractResponseText(responseData);
            displayContent = formatResponseText(responseText);
            rawData = responseText;
        }

        updateMessageContent(loadingMessage, displayContent);

        // Save to history
        saveToHistory({
            userMessage: userMessage,
            formattedResponse: displayContent,
            rawData: rawData
        });

    } catch (error) {
        console.error("Error processing response:", error);
        updateMessageContent(loadingMessage, `<div class="message__error">${error.message}</div>`);
        loadingMessage.classList.add("message--error");
    } finally {
        isGeneratingResponse = false;
    }
};

// Helper function to extract text from RAG responses
function extractResponseText(responseData) {
    try {
        // Handle deeply nested format: [["", [["user msg", "bot response"]]]]
        if (Array.isArray(responseData.result) &&
            responseData.result[0] &&
            Array.isArray(responseData.result[0]) &&
            responseData.result[0].length >= 2 &&
            Array.isArray(responseData.result[0][1]) ){
            
            const innerArray = responseData.result[0][1];
            if (innerArray[0] && Array.isArray(innerArray[0])){
                // Return the bot response from the inner array
                return innerArray[0][1] || "";
            }
        }
        
        // Fallback to previous format handling
        if (Array.isArray(responseData.result) && 
            responseData.result[0] &&
            Array.isArray(responseData.result[0]) ){
            return responseData.result[0][1] || "";
        }
        
        // Handle other formats
        return typeof responseData.result === 'string' ? 
            responseData.result : 
            JSON.stringify(responseData.result || "");
    } catch (e) {
        console.error("Error extracting response:", e);
        return "Could not parse response";
    }
}

// Update the formatResponseText function
function formatResponseText(text) {
    // Clean up any remaining array artifacts
    const cleanText = String(text).replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<em>$1</em>").trim();
    
    if (typeof marked !== 'undefined') {
        try {
            return marked.parse(cleanText);
        } catch (e) {
            console.warn("Marked parsing failed, using plain text:", e);
            return cleanText;
        }
    }
    return cleanText;
}

// Existing formatSearchResults function
function formatSearchResults(results) {
    if (!results || !results.length) return "No results found";
    
    if (typeof marked === 'undefined') {
        console.warn("Marked library not found, displaying plain text");
        let plainResults = "## Search Results\n\n";
        results.forEach((result, index) => {
            plainResults += `### ${result.title}\n\n`;
            plainResults += `${result.content.substring(0, 300)}...\n\n`;
            plainResults += `URL: ${result.url}\n`;
            plainResults += `Relevance score: ${result.score?.toFixed(2) || 'N/A'}\n\n`;
            if (index < results.length - 1) plainResults += "---\n\n";
        });
        return plainResults;
    }
    
    let markdown = "## Search Results\n\n";
    results.forEach((result, index) => {
        const cleanContent = result.content ? 
            result.content.replace(/\n{3,}/g, '\n\n').substring(0, 300) + "..." : 
            "No content available";
        
        markdown += `### [${result.title || "Untitled"}](${result.url || "#"})\n\n`;
        markdown += `${cleanContent}\n\n`;
        markdown += `*Relevance score: ${result.score?.toFixed(2) || 'N/A'}*\n\n`;
        if (index < results.length - 1) markdown += "---\n\n";
    });
    
    return marked.parse(markdown);
}

// Fixed handleOutgoingMessage function
const handleOutgoingMessage = () => {
    const inputElement = document.querySelector(".prompt__form-input");
    const message = inputElement.value.trim();
    
    if (!message || isGeneratingResponse) {
        if (!message) {
            alert("Please enter a message before sending");
        }
        return;
    }

    // Set processing flag
    isGeneratingResponse = true;
    
    // Create and append user message
    const outgoingMessage = createMessageElement(
        message,
        "message--outgoing",
        "/static/images/assets/profile.png"
    );
    chatHistoryContainer.appendChild(outgoingMessage);

    // Clear input after sending
    inputElement.value = "";
    
    // Process the message
    requestApiResponse(message);
};

// Event listeners for theme toggle and clear chat
clearChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all chat history?")) {
        localStorage.removeItem("saved-api-chats");
        loadSavedChatHistory();
    }
});

themeToggleButton.addEventListener("click", () => {
    const isLightTheme = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
    themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon"></i>' : '<i class="bx bx-sun"></i>';
});

// Initialize the app
loadSavedChatHistory();