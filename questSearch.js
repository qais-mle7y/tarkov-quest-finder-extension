// Cache for storing API responses
const cache = new Map();

// State for tracking current quest index and filters
let quests = [];
let filteredQuests = [];

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
// DOM Elements
const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');

// Event Listeners
searchButton.addEventListener('click', handleSearch);

// Handle search button click
async function handleSearch() {
    const query = searchInput.value.trim();
    if (query.length > 2) {
      loadingDiv.classList.remove('hidden');
      resultsDiv.innerHTML = '';
  
      try {
        const tasks = await fetchQuests(query);
        const filteredTasks = tasks.filter(task =>
          task.name.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filteredTasks.length > 0) {
          resultsDiv.innerHTML = filteredTasks
            .map(task => createQuestCard(task))
            .join('');
        } else {
          resultsDiv.innerHTML = '<p class="text-gray-400 text-center">No tasks found.</p>';
        }
      } catch (error) {
        console.error('Error fetching quests:', error);
        resultsDiv.innerHTML = `
          <p class="text-red-500">
            Failed to fetch quests. Please check your query or try again later.
          </p>
        `;
      } finally {
        loadingDiv.classList.add('hidden');
      }
    } else {
      resultsDiv.innerHTML = '<p class="text-gray-600">Please enter at least 3 characters to search.</p>';
    }
}

// Display a single quest
function createQuestCard(task) {
    return `
      <div class="quest-card fade-in mb-4">
        <!-- Header Section -->
        <div class="flex flex-col mb-6">
          <h3 class="text-2xl font-bold text-yellow-500 mb-2">${task.name}</h3>
          <div class="flex items-center justify-between">
            <span class="text-gray-400">
              <span class="text-gray-500">Trader:</span> 
              ${task.trader?.name || 'N/A'}
            </span>
            ${task.wikiLink ? `
              <a href="${task.wikiLink}" 
                 target="_blank" 
                 class="wiki-link text-sm">
                Wiki Guide
                <svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ` : ''}
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Left Column -->
          <div class="space-y-4">
            <!-- Requirements Panel -->
            <div class="info-panel">
              <h4 class="panel-header">Requirements</h4>
              <div class="space-y-2">
                <div class="flex items-center justify-between px-3 py-1 bg-gray-800 rounded">
                  <span>Player Level</span>
                  <span class="text-yellow-500">${task.minPlayerLevel || 'N/A'}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-1 bg-gray-800 rounded">
                  <span>Kappa Required</span>
                  <span class="${task.kappaRequired ? 'text-green-500' : 'text-red-500'}">
                    ${task.kappaRequired ? '✓' : '✗'}
                  </span>
                </div>
                <div class="flex items-center justify-between px-3 py-1 bg-gray-800 rounded">
                  <span>Lightkeeper Required</span>
                  <span class="${task.lightkeeperRequired ? 'text-green-500' : 'text-red-500'}">
                    ${task.lightkeeperRequired ? '✓' : '✗'}
                  </span>
                </div>
              </div>
              ${task.traderRequirements?.length ? `
                <div class="mt-3">
                  <h5 class="text-sm text-gray-400 mb-2">Trader Requirements</h5>
                  <div class="space-y-1">
                    ${task.traderRequirements.map(req => `
                      <div class="flex items-center justify-between px-3 py-1 bg-gray-800 rounded">
                        <span>${req.trader.name}</span>
                        <span class="text-blue-400">LL${req.level}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Rewards Panel -->
            <div class="info-panel">
              <h4 class="panel-header">Rewards</h4>
              ${task.finishRewards.items.length > 0 ? `
                <div class="space-y-2">
                  ${task.finishRewards.items.map(reward => `
                    <div class="flex items-center justify-between px-3 py-2 bg-gray-800 rounded">
                      <div class="flex items-center">
                        ${reward.item.iconLink ? `
                          <img src="${reward.item.iconLink}" alt="${reward.item.name}" 
                               class="w-8 h-8 object-contain mr-2">
                        ` : ''}
                        <span>${reward.item.name}</span>
                      </div>
                      <span class="text-yellow-500">×${reward.quantity}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${task.finishRewards.traderStanding.length > 0 ? `
                <div class="mt-3">
                  <h5 class="text-sm text-gray-400 mb-2">Trader Standing Changes</h5>
                  <div class="space-y-1">
                    ${task.finishRewards.traderStanding.map(standing => `
                      <div class="flex items-center justify-between px-3 py-1 bg-gray-800 rounded">
                        <span>${standing.trader.name}</span>
                        <span class="${standing.standing > 0 ? 'text-green-500' : 'text-red-500'}">
                          ${standing.standing > 0 ? '+' : ''}${standing.standing}
                        </span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <!-- Objectives Panel -->
            <div class="info-panel">
              <h4 class="panel-header">Objectives</h4>
              <div class="space-y-3">
                ${task.objectives.map((obj, index) => `
                  <div class="objective-item ${obj.optional ? 'opacity-75' : ''}">
                    <div class="flex items-start">
                      <span class="objective-number">${index + 1}</span>
                      <div class="flex-1">
                        <p class="text-gray-300">${obj.description}</p>
                        ${obj.optional ? `
                          <span class="text-xs text-yellow-500">(Optional)</span>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
}

const suggestionsDiv = document.createElement('div');
suggestionsDiv.className = 'suggestions hidden absolute w-full bg-gray-800 border border-gray-700 rounded-lg mt-1 max-h-60 overflow-y-auto z-50';
searchInput.parentNode.style.position = 'relative';
searchInput.parentNode.appendChild(suggestionsDiv);

// Add input event listener for suggestions
searchInput.addEventListener('input', debounce(handleInputChange, 300));

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target)) {
      suggestionsDiv.classList.add('hidden');
    }
});

async function handleInputChange() {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) {
      suggestionsDiv.classList.add('hidden');
      return;
    }

    try {
      const tasks = await fetchQuests('');  // Fetch all tasks
      const suggestions = tasks
        .filter(task => {
          const taskName = task.name.toLowerCase();
          
          // Simple includes check for the whole query
          if (taskName.includes(query)) {
            return true;
          }

          // Check individual words
          const searchWords = query.toLowerCase().split(' ');
          return searchWords.some(word => 
            word.length > 1 && taskName.includes(word)
          );
        })
        .sort((a, b) => {
          // Sort exact matches first
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const aExact = aName.includes(query);
          const bExact = bName.includes(query);
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Secondary sort by string length (shorter names first)
          return aName.length - bName.length;
        })
        .slice(0, 8);

      if (suggestions.length > 0) {
        suggestionsDiv.innerHTML = suggestions
          .map(task => `
            <div class="suggestion-item p-3 hover:bg-gray-700 cursor-pointer">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-medium text-gray-200">
                    ${highlightMatch(task.name, query)}
                  </div>
                  <div class="text-sm text-gray-400 flex items-center gap-2">
                    <span>${task.trader?.name || 'Unknown Trader'}</span>
                    ${task.minPlayerLevel ? 
                      `<span class="text-xs px-2 py-0.5 bg-gray-600 rounded-full">
                        Level ${task.minPlayerLevel}
                      </span>` : ''
                    }
                  </div>
                </div>
                ${task.kappaRequired ? 
                  `<span class="text-xs text-yellow-500 px-2 py-0.5 bg-gray-800 rounded-full">
                    Kappa
                  </span>` : ''
                }
              </div>
            </div>
          `)
          .join('<div class="border-b border-gray-700"></div>');

        suggestionsDiv.classList.remove('hidden');

        // Add click handlers for suggestions
        const suggestionItems = suggestionsDiv.querySelectorAll('.suggestion-item');
        suggestionItems.forEach((item, index) => {
          item.addEventListener('click', () => {
            searchInput.value = suggestions[index].name;
            suggestionsDiv.classList.add('hidden');
            handleSearch();
          });
        });

        // Add keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
          const items = suggestionsDiv.querySelectorAll('.suggestion-item');
          const current = suggestionsDiv.querySelector('.suggestion-item.bg-gray-700');
          const currentIndex = Array.from(items).indexOf(current);

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (current) {
              current.classList.remove('bg-gray-700');
              const next = items[currentIndex + 1] || items[0];
              next.classList.add('bg-gray-700');
              next.scrollIntoView({ block: 'nearest' });
            } else {
              items[0]?.classList.add('bg-gray-700');
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (current) {
              current.classList.remove('bg-gray-700');
              const prev = items[currentIndex - 1] || items[items.length - 1];
              prev.classList.add('bg-gray-700');
              prev.scrollIntoView({ block: 'nearest' });
            } else {
              items[items.length - 1]?.classList.add('bg-gray-700');
            }
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (current) {
              searchInput.value = suggestions[currentIndex].name;
              suggestionsDiv.classList.add('hidden');
              handleSearch();
            }
          } else if (e.key === 'Escape') {
            suggestionsDiv.classList.add('hidden');
          }
        });
      } else {
        suggestionsDiv.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
}

// Utility function to highlight matching text
function highlightMatch(text, query) {
    // First sanitize the text to prevent XSS
    const sanitizedText = text.replace(/[&<>"']/g, '');
    const sanitizedQuery = query.replace(/[&<>"']/g, '');
    
    // Split into words and filter out empty strings
    const searchWords = sanitizedQuery.toLowerCase().split(' ').filter(Boolean);
    
    // Create a safe version of the text for matching
    let result = sanitizedText;
    
    // Replace each matching word with a highlighted version
    searchWords.forEach(word => {
        if (word) {
            const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
            const regex = new RegExp(`(${safeWord})`, 'gi');
            result = result.replace(regex, '§§§$1§§§');
        }
    });
    
    // Replace our temporary markers with span tags
    result = result.replace(/§§§(.*?)§§§/g, '<span class="highlight">$1</span>');
    
    return result;
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
}
});

// Keep fetchQuests outside since it doesn't need DOM access
async function fetchQuests(query) {
    // First check in-memory cache
    if (cache.has(query)) {
      return cache.get(query);
    }
    
    // Then check Chrome storage
    try {
      const storageData = await chrome.storage.local.get(query);
      if (storageData[query]) {
        cache.set(query, storageData[query]); // Add to in-memory cache
        return storageData[query];
      }
    } catch (error) {
      console.warn('Failed to read from storage:', error);
    }
  
    // If not in cache or storage, fetch from API
    try {
      const response = await fetch('https://api.tarkov.dev/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              tasks {
                id
                name
                trader {
                  name
                  normalizedName
                }
                map {
                  name
                  normalizedName
                }
                taskRequirements {
                  task {
                    id
                    name
                  }
                  status
                }
                traderRequirements {
                  trader {
                    name
                  }
                  level
                }
                kappaRequired
                lightkeeperRequired
                experience
                minPlayerLevel
                wikiLink
                objectives {
                  id
                  type
                  ... on TaskObjectiveBasic {
                description
                  }
                  ... on TaskObjectiveQuestItem {
                    description
                  }
                  ... on TaskObjectiveShoot {
                    description
                  }
                  optional
                }
                finishRewards {
                  items {
                    item {
                      id
                      name
                      iconLink
                    }
                    quantity
                  }
                  traderStanding {
                    trader {
                      name
                    }
                    standing
                  }
                }
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
      cache.set(query, tasks); // Set in-memory cache
      
      // Store in Chrome storage
      try {
        await chrome.storage.local.set({ [query]: tasks });
      } catch (error) {
        console.warn('Failed to save to storage:', error);
      }
      
      return tasks;
    } catch (error) {
      console.error('Failed to fetch quests:', error);
      throw error; // Re-throw the error for handling in the caller
    }
  }