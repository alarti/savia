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
        userAvatar.src = user.user_metadata.avatar_url;
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.placeholder = "Ask the AI something...";
    } else {
        // User is logged out
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userAvatar.src = '';
        chatInput.disabled = true;
        sendButton.disabled = true;
        chatInput.placeholder = "Please log in to chat.";
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
    chatInput.value = '';
    sendButton.disabled = true;
    chatInput.disabled = true;

    addMessageToUI('AI is thinking...', 'ai');

    try {
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const aiResponse = await response.text();

        // Remove the "thinking" message
        chatMessages.removeChild(chatMessages.lastChild);
        addMessageToUI(aiResponse, 'ai');

    } catch (error) {
        console.error('Error fetching from Pollinations AI:', error);
        // Remove the "thinking" message
        chatMessages.removeChild(chatMessages.lastChild);
        addMessageToUI('Sorry, something went wrong. Please try again.', 'ai');
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

// Initial check
checkSession();

console.log("Script loaded and Supabase initialized!");
