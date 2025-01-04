// Cache quest data in Chrome's storage
const cacheQuests = async (quests) => {
    try {
      await chrome.storage.local.set({ quests });
      console.log('Quests cached successfully.');
    } catch (error) {
      console.error('Failed to cache quests:', error);
    }
  };
  
  // Fetch quests from the Tarkov Dev API
  const fetchQuests = async (query) => {
    try {
      const response = await fetch('https://api.tarkov.dev/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            {
              quests(name: "${query}") {
                id
                name
                description
                objectives
                rewards
                faction
                difficulty
              }
            }
          `
        })
      });
  
      if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.data.quests;
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      throw error; // Re-throw the error for handling in the caller
    }
  };
  
  // Notify the user when new quests are added or updated
  const notifyUser = (message) => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Tarkov Quest Finder',
      message: message
    });
  };
  
  // Periodically update quest data (e.g., every 1 hour)
  const updateQuestsPeriodically = async () => {
    const popularQueries = ['Shootout Picnic', 'The Punisher', 'Delivery from the Past'];
    for (const query of popularQueries) {
      try {
        const newQuests = await fetchQuests(query);
        const cachedQuests = await new Promise((resolve) => {
          chrome.storage.local.get('quests', (data) => resolve(data.quests || []));
        });
  
        // Check if new quests are different from cached quests
        if (JSON.stringify(newQuests) !== JSON.stringify(cachedQuests)) {
          await cacheQuests(newQuests);
          notifyUser(`New quests available for: ${query}`);
          console.log(`Updated quests for query: ${query}`);
        } else {
          console.log(`No new quests for query: ${query}`);
        }
      } catch (error) {
        console.error(`Failed to update quests for query: ${query}`, error);
      }
    }
  };
  
  // Run periodic updates every 1 hour
  chrome.alarms.create('updateQuests', { periodInMinutes: 60 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateQuests') {
      updateQuestsPeriodically();
    }
  });
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getQuests') {
      chrome.storage.local.get('quests', (data) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to retrieve quests from storage:', chrome.runtime.lastError);
          sendResponse([]);
        } else {
          sendResponse(data.quests || []);
        }
      });
      return true; // Required for async sendResponse
    }
  });