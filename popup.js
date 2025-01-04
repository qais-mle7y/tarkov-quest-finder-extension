// Cache for storing API responses
const cache = new Map();

// State for tracking current quest index and filters
let currentQuestIndex = 0;
let quests = [];
let filteredQuests = [];

// DOM Elements
const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const prevQuestButton = document.getElementById('prevQuest');
const nextQuestButton = document.getElementById('nextQuest');
const factionFilter = document.getElementById('factionFilter');
const difficultyFilter = document.getElementById('difficultyFilter');

// Event Listeners
searchButton.addEventListener('click', handleSearch);
prevQuestButton.addEventListener('click', () => navigateQuest(-1));
nextQuestButton.addEventListener('click', () => navigateQuest(1));
factionFilter.addEventListener('change', applyFilters);
difficultyFilter.addEventListener('change', applyFilters);

// Handle search button click
async function handleSearch() {
    const query = searchInput.value.trim();
    if (query.length > 2) {
      loadingDiv.classList.remove('hidden'); // Show loading text
      resultsDiv.innerHTML = '';
  
      try {
        const tasks = await fetchQuests(query);
        // Filter tasks locally based on the search query
        filteredQuests = tasks.filter(task =>
          task.name.toLowerCase().includes(query.toLowerCase())
        );
        currentQuestIndex = 0;
        displayQuest(filteredQuests[currentQuestIndex]);
        updateNavigationButtons();
      } catch (error) {
        console.error('Error fetching quests:', error);
        resultsDiv.innerHTML = `
          <p class="text-red-500">
            Failed to fetch quests. Please check your query or try again later.
          </p>
        `;
      } finally {
        loadingDiv.classList.add('hidden'); // Hide loading text
      }
    } else {
      resultsDiv.innerHTML = '<p class="text-gray-600">Please enter at least 3 characters to search.</p>';
      quests = [];
      filteredQuests = [];
      updateNavigationButtons();
    }
  }

// Fetch quests from API or cache
async function fetchQuests(query) {
    if (cache.has(query)) {
      return cache.get(query);
    }
  
    try {
      const response = await fetch('https://api.tarkov.dev/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            {
              tasks {
                id
                name
                faction
                minPlayerLevel
                leadsTo
                map
                objectives {
                  description
                  maps
                }
                rewards {
                  items {
                    item {
                      name
                    }
                    quantity
                  }
                  roubles
                }
                traderStanding
              }
            }
          `
        })
      });
  
      if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('API Response:', data); // Log the API response
  
      // Check if the response contains the expected data
      if (!data.data || !data.data.tasks) {
        throw new Error('Invalid API response structure');
      }
  
      const tasks = data.data.tasks;
      cache.set(query, tasks); // Cache the results
      return tasks;
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      throw error; // Re-throw the error for handling in the caller
    }
  }

// Apply filters based on faction and difficulty
function applyFilters() {
    const faction = factionFilter.value;
    const difficulty = difficultyFilter.value;
  
    filteredQuests = quests.filter(quest => {
      const matchesFaction = faction === '' || quest.faction === faction;
      const matchesDifficulty = difficulty === '' || quest.difficulty === difficulty;
      return matchesFaction && matchesDifficulty;
    });
  
    currentQuestIndex = 0;
    displayQuest(filteredQuests[currentQuestIndex]);
    updateNavigationButtons();
  }

// Display a single quest
function displayQuest(task) {
    if (!task) {
      resultsDiv.innerHTML = '<p class="text-gray-600">No tasks found.</p>';
      return;
    }
  
    resultsDiv.innerHTML = `
      <div class="bg-white p-4 border border-gray-200 rounded-lg shadow-sm transition-transform transform hover:scale-105">
        <h3 class="text-lg font-semibold text-gray-900">${task.name}</h3>
        <p class="text-sm text-gray-700"><strong>Wiki:</strong> <a href="${task.wikiLink}" target="_blank" class="text-blue-500 hover:underline">View Wiki</a></p>
        <p class="text-sm text-gray-700"><strong>Faction:</strong> ${task.faction || 'N/A'}</p>
  
        <div class="mt-4">
          <p class="text-sm text-gray-700"><strong>📋 Start Requirements:</strong></p>
          <ul class="list-disc list-inside">
            <li class="text-sm text-gray-700">Player level: ${task.minPlayerLevel || 'N/A'}</li>
          </ul>
        </div>
  
        <div class="mt-4">
          <p class="text-sm text-gray-700"><strong>➡️📋 Leads to:</strong></p>
          <ul class="list-disc list-inside">
            ${task.leadsTo.map(lead => `
              <li class="text-sm text-gray-700">${lead}</li>
            `).join('')}
          </ul>
        </div>
  
        <div class="mt-4">
          <p class="text-sm text-gray-700"><strong>🗺️ Map:</strong> ${task.map || 'N/A'}</p>
        </div>
  
        <div class="mt-4">
          <p class="text-sm text-gray-700"><strong>🏆 Objectives:</strong></p>
          <ul class="list-disc list-inside">
            ${task.objectives.map(obj => `
              <li class="text-sm text-gray-700">${obj.description} (Maps: ${obj.maps.join(', ')})</li>
            `).join('')}
          </ul>
        </div>
  
        <div class="mt-4">
          <p class="text-sm text-gray-700"><strong>🎁 Rewards:</strong></p>
          <ul class="list-disc list-inside">
            ${task.rewards.items.map(reward => `
              <li class="text-sm text-gray-700">${reward.item.name} (${reward.quantity})</li>
            `).join('')}
          </ul>
          <p class="text-sm text-gray-700"><strong>Roubles:</strong> ${task.rewards.roubles || 'N/A'}</p>
          <p class="text-sm text-gray-700"><strong>Trader Standing:</strong> ${task.traderStanding || 'N/A'}</p>
        </div>
      </div>
    `;
  }
// Navigate between quests
function navigateQuest(direction) {
    currentQuestIndex += direction;
    if (currentQuestIndex < 0) {
      currentQuestIndex = filteredQuests.length - 1; // Wrap around to the last quest
    } else if (currentQuestIndex >= filteredQuests.length) {
      currentQuestIndex = 0; // Wrap around to the first quest
    }
    displayQuest(filteredQuests[currentQuestIndex]);
    updateNavigationButtons();
  }
  
  // Update navigation buttons
  function updateNavigationButtons() {
    prevQuestButton.disabled = filteredQuests.length === 0;
    nextQuestButton.disabled = filteredQuests.length === 0;
  }