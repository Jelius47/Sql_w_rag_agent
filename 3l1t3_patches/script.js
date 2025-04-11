const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const suggestionItems = document.querySelectorAll(".suggests__item");

const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

let currentUserMessage = null;
let isGeneratingResponse = false;

const FLASK_SERVER_URL = "http://127.0.0.1:5000";
const API_ROUTES = {
	webSearch: `${FLASK_SERVER_URL}/web/search`,
	ragSearch: `${FLASK_SERVER_URL}/rag/search`,
	fileUpload: `${FLASK_SERVER_URL}/file/upload`,
	dbQuery: `${FLASK_SERVER_URL}/db/query`
};

const loadSavedChatHistory = () => {
	const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
	const isLightTheme = localStorage.getItem("themeColor") === "light_mode";

	document.body.classList.toggle("light_mode", isLightTheme);
	themeToggleButton.innerHTML = isLightTheme ? '<i class="bx bx-moon"></i>' : '<i class="bx bx-sun"></i>';

	chatHistoryContainer.innerHTML = '';

	savedConversations.forEach(conversation => {
		const userMessageHtml = `
	    <div class="message__content">
		<img class="message__avatar" src="/static/images/assets/profile.png" alt="User avatar">
		<p class="message__text">${conversation.userMessage}</p>
	    </div>
	`;
		chatHistoryContainer.appendChild(createChatMessageElement(userMessageHtml, "message--outgoing"));

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

const createChatMessageElement = (htmlContent, ...cssClasses) => {
	const messageElement = document.createElement("div");
	messageElement.classList.add("message", ...cssClasses);
	messageElement.innerHTML = htmlContent;
	return messageElement;
};

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

const getApiEndpoint = (message) => {
	if (message.startsWith("web:")) return API_ROUTES.webSearch;
	if (message.startsWith("rag:")) return API_ROUTES.ragSearch;
	if (message.startsWith("file:")) return API_ROUTES.fileUpload;
	if (message.startsWith("db:")) return API_ROUTES.dbQuery;
	return API_ROUTES.ragSearch;
};

const requestApiResponse = async (incomingMessageElement) => {
	const messageTextElement = incomingMessageElement.querySelector(".message__text");

	try {
		const apiUrl = getApiEndpoint(currentUserMessage);

		let requestBody = {};
		if (apiUrl === API_ROUTES.fileUpload) {
			requestBody = { file_data: currentUserMessage.split("file:")[1].trim() };
		} else {
			requestBody = { query: currentUserMessage };
		}

		const response = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(requestBody),
		});

		const responseData = await response.json();
		if (!response.ok) throw new Error(responseData.error || "Failed to fetch response.");
		const responseText = responseData[0][1] || "No response received.";

		const typeOutResponse = (text, element) => {
			let i = 0;
			const speed = 50;

			function type() {
				if (i < text.length) {
					element.innerHTML += text.charAt(i);
					i++;
					setTimeout(type, speed);
				}
			}

			type();
		};
		messageTextElement.innerText = "";
		typeOutResponse(responseText,messageTextElement);
		isGeneratingResponse = false;

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

messageForm.addEventListener("submit", (e) => {
	e.preventDefault();
	handleOutgoingMessage();
});

loadSavedChatHistory();
