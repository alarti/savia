// 1. SUPABASE SETUP
// ------------------------------------------------
const SUPABASE_URL = 'https://aaajixktzdglynxhchbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYWppeGt0emRnbHlueGhjaGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzQ5MTYsImV4cCI6MjA3MjUxMDkxNn0.BHkRJGwhLE6ViVX7KOe8g-iXu3n6dlXzMhxAb8GpsDE';
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
const newConvoBtn = document.getElementById('new-convo-btn');
const conversationsList = document.getElementById('conversations-list');

// 3. GLOBAL STATE
// ------------------------------------------------
let activeConversationId = null;
let conversationHistory = [];

// 4. AUTHENTICATION
// ------------------------------------------------
async function loginWithGoogle() {
    await _supabase.auth.signInWithOAuth({ provider: 'google' });
}

async function logout() {
    await _supabase.auth.signOut();
}

function updateUserUI(user) {
    if (user) {
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        if (user.user_metadata?.avatar_url) {
            userAvatar.src = user.user_metadata.avatar_url;
        }
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.placeholder = "Ask the AI something...";
        loadConversations();
        startNewConversation();
    } else {
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userAvatar.src = '';
        chatInput.disabled = true;
        sendButton.disabled = true;
        chatInput.placeholder = "Please log in to chat.";
        conversationsList.innerHTML = '';
        chatMessages.innerHTML = '<div class="message ai">Please log in to chat.</div>';
    }
}

_supabase.auth.onAuthStateChange((_event, session) => {
    updateUserUI(session?.user);
});

// 5. CONVERSATION MANAGEMENT
// ------------------------------------------------
async function loadConversations() {
    const { data, error } = await _supabase
        .from('conversations')
        .select('id, title')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading conversations:', error);
        return;
    }

    conversationsList.innerHTML = '';
    data.forEach(convo => {
        const convoElement = document.createElement('div');
        convoElement.classList.add('conversation-item');
        convoElement.dataset.id = convo.id;

        const title = document.createElement('span');
        title.className = 'conversation-title';
        title.textContent = convo.title;
        convoElement.addEventListener('click', () => loadChatHistory(convo.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-convo-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent loading the conversation
            handleDeleteConversation(convo.id, convo.title);
        });

        convoElement.appendChild(title);
        convoElement.appendChild(deleteBtn);
        conversationsList.appendChild(convoElement);
    });
}

async function loadChatHistory(conversationId) {
    const { data, error } = await _supabase
        .from('messages')
        .select('content, sender')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error loading chat history:', error);
        return;
    }

    activeConversationId = conversationId;
    conversationHistory = [];
    chatMessages.innerHTML = '';
    data.forEach(msg => addMessageToUI(msg.content, msg.sender));

    document.querySelectorAll('.conversation-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === String(conversationId));
    });
}

async function handleDeleteConversation(conversationId, title) {
    const confirmation = confirm(`Are you sure you want to delete the conversation: "${title}"?`);
    if (!confirmation) return;

    const { error } = await _supabase.from('conversations').delete().eq('id', conversationId);

    if (error) {
        console.error('Error deleting conversation:', error);
        alert('Could not delete the conversation. Please try again.');
        return;
    }

    if (activeConversationId === conversationId) {
        startNewConversation();
    }

    await loadConversations(); // Refresh the list
}

function startNewConversation() {
    activeConversationId = null;
    conversationHistory = [];
    chatMessages.innerHTML = '';
    chatInput.value = '';
    chatInput.focus();
    document.querySelectorAll('.conversation-item.active').forEach(el => el.classList.remove('active'));
}

// 6. CHAT & MESSAGES
// ------------------------------------------------
function addMessageToUI(content, sender) {
    conversationHistory.push({ sender, content });
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.innerHTML = marked.parse(content); // Use marked to parse markdown
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function saveMessage(content, sender, convoId) {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;
    await _supabase.from('messages').insert([{ content, sender, conversation_id: convoId, user_id: user.id }]);
}

async function streamResponse(element, text) {
    return new Promise(resolve => {
        let index = 0;
        element.innerHTML = '';
        const interval = setInterval(() => {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                index++;
            } else {
                clearInterval(interval);
                // Re-parse with marked to ensure code blocks are formatted correctly at the end
                element.innerHTML = marked.parse(text);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                resolve();
            }
        }, 20); // Adjust typing speed here (milliseconds)
    });
}

async function handleChatSubmit(event) {
    event.preventDefault();
    const userPrompt = chatInput.value.trim();
    if (!userPrompt) return;

    chatInput.value = '';
    sendButton.disabled = true;
    addMessageToUI(userPrompt, 'user');

    let currentConvoId = activeConversationId;

    // If this is the first message of a new conversation, create it
    if (!currentConvoId) {
        const { data, error } = await _supabase
            .from('conversations')
            .insert({ title: userPrompt, user_id: (await _supabase.auth.getUser()).data.user.id })
            .select()
            .single();

        if (error) {
            console.error('Error creating conversation:', error);
            addMessageToUI('Sorry, I could not start a new conversation.', 'ai');
            return;
        }
        currentConvoId = data.id;
        activeConversationId = data.id;
        await loadConversations(); // Refresh list
        document.querySelector(`.conversation-item[data-id='${currentConvoId}']`)?.classList.add('active');
    }

    await saveMessage(userPrompt, 'user', currentConvoId);

    // Prepare context for the AI
    const context = conversationHistory
        .slice(-7) // Get up to 7 recent messages for context
        .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n');

    const finalPrompt = `Given this conversation history:\n${context}\n\nProvide a response to the last user message in Spanish.`;

    addMessageToUI('AI is thinking...', 'ai');

    const thinkingMessage = chatMessages.lastChild;

    try {
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(finalPrompt)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const aiResponse = await response.text();
        thinkingMessage.remove(); // Remove "thinking" message

        // Create the AI message element and stream the response into it
        const aiMessageElement = document.createElement('div');
        aiMessageElement.classList.add('message', 'ai');
        chatMessages.appendChild(aiMessageElement);

        await streamResponse(aiMessageElement, aiResponse);
        await saveMessage(aiResponse, 'ai', currentConvoId);

    } catch (error) {
        console.error('Error fetching from Pollinations AI:', error);
        thinkingMessage.remove();
        addMessageToUI('Sorry, something went wrong. Please try again.', 'ai');
    } finally {
        sendButton.disabled = false;
        chatInput.focus();
    }
}

// 7. EVENT LISTENERS
// ------------------------------------------------
loginBtn.addEventListener('click', loginWithGoogle);
logoutBtn.addEventListener('click', logout);
chatForm.addEventListener('submit', handleChatSubmit);
menuToggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
newConvoBtn.addEventListener('click', startNewConversation);
