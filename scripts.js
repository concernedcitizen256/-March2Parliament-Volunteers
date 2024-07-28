// Define the shareCard function globally
function shareCard(name) {
    const text = `${name} has volunteered help to the #March2Parliament protesters. Find out more here: ${window.location.href}`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed");

    // Configuration
    const CONFIG = {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRLDJ1VqnYjRrmoFzbGr2AQne78zlj_7zN9VEqeMrMQ7m3jyBIOlEC8WDBvT1pDz4HvrZpxCVX3WaVI/pub?output=csv',
        personsPerPage: 18,
        scrollThreshold: 100,
        scrollDelay: 200
    };

    // DOM elements
    const elements = {
        personsList: document.getElementById('persons'),
        loading: document.getElementById('loading')
    };

    // State
    let state = {
        currentIndex: 0,
        isLoading: false,
        personsData: [],
        allPersonsLoaded: false,
        searchQuery: '',
    };

    let originalPersonsData = [];

    // Fetch the volunteers data
    async function fetchData(url) {
        console.log("Fetching data from:", url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvData = await response.text();
            console.log("Data fetched successfully");

            return processCSVData(csvData);
        } catch (error) {
            console.error("Error fetching data:", error);
            elements.loading.textContent = "An error occurred while fetching volunteers";
            throw error;
        }
    }

    // Process CSV data
    function processCSVData(csvData) {
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');

        return lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = headers.reduce((acc, header, index) => {
                acc[header.trim()] = values[index] ? values[index].trim() : '';
                return acc;
            }, {});

            // Handle privacy preference
            obj.showContact = obj["Are you okay with your contact being displayed publicly? This is crucial for reachability."].toLowerCase() === 'yes';

            return obj;
        });
    }

    // Create person element
    function createPersonElement(person) {
        console.log("Creating person element for:", person);
        const personElement = document.createElement('div');
        personElement.classList.add('person');

        personElement.innerHTML = `
            <div class="card" data-category="${person.Category}">
                <div class="card-inner">
                    <h2 class='card__name'>${person.Name}</h2>
                    <p class='card__profession'>Profession: ${person.Profession}</p>
                    ${person.showContact ? `<p class='card__contact'>Contact: ${person.Contact}</p>` : ''}
                    <p class='card__location'>Location: ${person.Location}</p>
                    <p class='card__twitter'>X: <a target='_blank' href="https://x.com/${person.Twitter}">${person.Twitter || "--"}</a></p>
                </div>
                <button class="share-button twitter" onclick="shareCard('${person.Name}')">Share on X</button>
            </div>
        `;
        return personElement;
    }

    // Load volunteers
    function loadPersons() {
        console.log("Loading persons");
        if (state.isLoading || state.allPersonsLoaded) return;

        state.isLoading = true;
        elements.loading.style.display = 'flex';

        const fragment = document.createDocumentFragment();
        const endIndex = Math.min((state.currentIndex + CONFIG.personsPerPage), state.personsData.length);

        for (let x = state.currentIndex; x < endIndex; x++) {
            const personElement = createPersonElement(state.personsData[x]);
            fragment.appendChild(personElement);
        }

        elements.personsList.appendChild(fragment);
        state.currentIndex = endIndex;

        state.isLoading = false;
        elements.loading.style.display = 'none';

        if (state.currentIndex >= state.personsData.length) {
            state.allPersonsLoaded = true;
            showBackToTopButton();
        }
    }

    // Show Back to Top button
    function showBackToTopButton() {
        const backToTopButton = document.createElement('button');
        backToTopButton.textContent = 'Back to Top';
        backToTopButton.classList.add('back-to-top');
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        const buttonContainer = document.createElement('div');
        buttonContainer.style.textAlign = 'center';
        buttonContainer.appendChild(backToTopButton);
        elements.personsList.appendChild(buttonContainer);
    }

    // Show no results message
    function showNoResultsMessage() {
        const messageElement = document.createElement('p');
        messageElement.textContent = 'No results found';
        messageElement.style.textAlign = 'center';
        messageElement.style.marginTop = '20px';
        elements.personsList.appendChild(messageElement);
    }

    // Handle scroll event
    function handleScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - CONFIG.scrollThreshold) {
            if (!state.allPersonsLoaded) {
                elements.loading.style.display = 'flex';
                setTimeout(() => {
                    loadPersons();
                }, CONFIG.scrollDelay);
            }
        }
    }

    // Search function
    function searchFunction() {
        let input = document.getElementById('searchInput');
        state.searchQuery = input.value.toLowerCase().trim();

        state.currentIndex = 0;
        state.allPersonsLoaded = false;
        elements.personsList.innerHTML = '';

        if (state.searchQuery === '') {
            state.personsData = [...originalPersonsData];
        } else {
            state.personsData = originalPersonsData.filter(person =>
                person.Name.toLowerCase().includes(state.searchQuery) ||
                person.Profession.toLowerCase().includes(state.searchQuery)
            );
        }

        loadPersons();

        if (state.personsData.length === 0) {
            showNoResultsMessage();
        }
    }

    // Filter by category
    function filterCategory(category) {
        state.currentIndex = 0;
        state.allPersonsLoaded = false;
        elements.personsList.innerHTML = '';

        let filteredData = originalPersonsData;

        if (category !== 'All') {
            filteredData = filteredData.filter(person => person.Category === category);
        }

        state.personsData = filteredData;

        loadPersons();

        if (state.personsData.length === 0) {
            showNoResultsMessage();
        }
    }

    // Initialize pagination
    async function initPaginate() {
        console.log("Initializing pagination");
        try {
            originalPersonsData = await fetchData(CONFIG.url);
            state.personsData = [...originalPersonsData];
            loadPersons();
            window.addEventListener("scroll", handleScroll);
        } catch (error) {
            console.error("Error initializing pagination:", error);
        }
    }

    // Event listener for the Volunteer button
    const volunteerButton = document.getElementById('volunteerButton');
    if (volunteerButton) {
        volunteerButton.addEventListener('click', function() {
            window.open('https://forms.gle/9A3muxbqGfzHZwdk9', '_blank');
        });
    }

    // Event listener for the Donate button
    const donateButton = document.getElementById('donateButton');
    if (donateButton) {
        donateButton.addEventListener('click', function() {
            window.open('https://posterity.indeginus.com', '_blank');
        });
    }

    // Event listener for search input
    document.getElementById('searchInput').addEventListener('input', searchFunction);

    // Event listeners for category buttons
    let buttons = document.querySelectorAll('.buttons button');
    buttons.forEach(button => {
        let category = button.getAttribute('data-category');
        button.addEventListener('click', () => {
            filterCategory(category);
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    console.log("Calling initPaginate");
    initPaginate();
});
