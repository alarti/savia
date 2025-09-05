// 1. SUPABASE SETUP
// ------------------------------------------------
// Replace these with your own Supabase project URL and anon key.
const SUPABASE_URL = 'https://aaajixktzdglynxhchbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYWppeGt0emRnbHlueGhjaGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzQ5MTYsImV4cCI6MjA3MjUxMDkxNn0.BHkRJGwhLE6ViVX7KOe8g-iXu3n6dlXzMhxAb8GpsDE';

// Initialize the Supabase client.
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// 2. DOM ELEMENTS
// ------------------------------------------------
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendButton = chatForm.querySelector('button');
const chatMessages = document.getElementById('chat-messages');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');


// 3. AUTHENTICATION
// ------------------------------------------------

// Function to handle user login
async function loginWithGoogle() {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
    });
    if (error) {
        console.error('Error logging in:', error.message);
    }
}

// Function to handle user logout
async function logout() {
    const { error } = await _supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    }
}

// Function to update the UI based on user session
function updateUserUI(user) {
    if (user) {
        // User is logged in
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');

        // Safely set avatar URL
        if (user.user_metadata && user.user_metadata.avatar_url) {
            userAvatar.src = user.user_metadata.avatar_url;
        } else {
            userAvatar.src = ''; // or a default avatar
        }

        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.placeholder = "Ask the AI something...";

        loadChatHistory(); // Load user's chat history
    } else {
        // User is logged out
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userAvatar.src = '';
        chatInput.disabled = true;
        sendButton.disabled = true;
        chatInput.placeholder = "Please log in to chat.";
        chatMessages.innerHTML = '<div class="message ai">Please log in to see your chat history.</div>';
    }
}

// Check for initial user session
async function checkSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        updateUserUI(session.user);
    } else {
        updateUserUI(null);
    }
}

// Listen for auth state changes
_supabase.auth.onAuthStateChange((_event, session) => {
    updateUserUI(session?.user);
});


// 4. CHAT
// ------------------------------------------------

// Function to save a message to Supabase
async function saveMessage(content, sender) {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        console.error('Cannot save message: no user is logged in.');
        return;
    }

    const { error } = await _supabase
        .from('messages')
        .insert([{ content, sender, user_id: user.id }]);

    if (error) {
        console.error('Error saving message:', error.message);
    }
}

// Function to load chat history from Supabase
async function loadChatHistory() {
    const { data: messages, error } = await _supabase
        .from('messages')
        .select('content, sender')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error loading chat history:', error.message);
        addMessageToUI('Could not load chat history.', 'ai');
        return;
    }

    chatMessages.innerHTML = ''; // Clear existing messages
    for (const message of messages) {
        addMessageToUI(message.content, message.sender);
    }
}

// Function to add a message to the UI
function addMessageToUI(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
}

// Function to handle chat form submission
async function handleChatSubmit(event) {
    event.preventDefault();
    const prompt = chatInput.value.trim();
    if (!prompt) return;

    addMessageToUI(prompt, 'user');
    await saveMessage(prompt, 'user'); // Save user message

    chatInput.value = '';
    sendButton.disabled = true;
    chatInput.disabled = true;

    const thinkingMessage = addMessageToUI('AI is thinking...', 'ai');

    try {
        const response = await fetch(`https://text.pollinations.ai/prompt/q?prompt=${encodeURIComponent(prompt)}`);
        if (!response.ok) {
            throw new Error(`The AI is taking a break... (HTTP status: ${response.status})`);
        }
        const aiResponse = await response.text();

        chatMessages.removeChild(chatMessages.lastChild); // Remove "thinking" message
        addMessageToUI(aiResponse, 'ai');
        await saveMessage(aiResponse, 'ai'); // Save AI response

    } catch (error) {
        console.error('Error fetching from Pollinations AI:', error);
        chatMessages.removeChild(chatMessages.lastChild); // Remove "thinking" message
        const errorMessage = error.message || 'Sorry, something went wrong. Please try again.';
        addMessageToUI(errorMessage, 'ai');
        // Do not save error messages to history
    } finally {
        sendButton.disabled = false;
        chatInput.disabled = false;
        chatInput.focus();
    }
}


// 5. EVENT LISTENERS
// ------------------------------------------------
loginBtn.addEventListener('click', loginWithGoogle);
logoutBtn.addEventListener('click', logout);
chatForm.addEventListener('submit', handleChatSubmit);
menuToggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Initial check
checkSession();

console.log("Script loaded and Supabase initialized!");
