Document.addEventListener('DOMContentLoaded', () => {
    // Select all elements
    const originalContent = document.getElementById('original-content');
    const prakaranWrapper = document.getElementById('prakaran-wrapper');
    const prakaranToc = document.getElementById('prakaran-toc');
    const alphaToc = document.getElementById('alpha-toc');
    const alphaBar = alphaToc.querySelector('.alpha-bar');
    const alphaListContent = alphaToc.querySelector('.alpha-list-content');
    const prakaranTitleEl = document.getElementById('prakaran-title');
    const tooltip = document.getElementById('tooltip');
    const tooltipContentDiv = document.getElementById('tooltip-content');
    const tooltipCloseBtn = document.getElementById('tooltip-close-btn');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const overlay = document.getElementById('overlay');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const fontIncBtn = document.getElementById('font-inc-btn');
    const fontDecBtn = document.getElementById('font-dec-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    const searchCloseBtn = document.getElementById('search-close-btn');
    const searchResults = document.getElementById('search-results');
    const contentPanel = document.querySelector('.content-panel');

    // App state
    let prakaranData = [];
    let allVachans = [];
    let searchIndex = [];
    let currentPrakaranIndex = -1;
    let baseFontSize = 1.05;
    const VACHAN_PAGE_SIZE = 30;

    function initializeApp() {
        loadSettings(); // Load saved theme and font size
        parseContent();
        buildPrakaranPages();
        buildPrakaranToc();
        buildAlphaToc();
        setupEventListeners();
    }

    /**
     * Parses the hidden HTML content, builds data structures for prakarans,
     * vachans (including their Tika/Lapika), and the search index.
     */
    function parseContent() {
        let currentPrakaran = null;
        let paragraphIdCounter = 0;
        const children = Array.from(originalContent.children);

        children.forEach((p, i) => {
            const text = p.innerText.trim();
            const contentId = `content-${paragraphIdCounter++}`;
            p.id = contentId; 

            if (p.classList.contains('p5') && text) {
                if (currentPrakaran) prakaranData.push(currentPrakaran);
                currentPrakaran = { title: text, id: `prakaran-${prakaranData.length}`, content: [], vachans: [] };
            }

            if (currentPrakaran) {
                const localVachanNumber = currentPrakaran.vachans.length + 1;
                const contentItem = { tag: p.tagName, className: p.className, html: p.innerHTML, text: text, type: 'default', id: contentId };
                
                if(text) {
                    searchIndex.push({ 
                        text: text, 
                        prakaranIndex: prakaranData.length, 
                        elementId: contentId, 
                        prakaranTitle: currentPrakaran.title,
                        isVachan: text.startsWith('वचन'),
                        vachanNumber: text.startsWith('वचन') ? localVachanNumber : null
                    });
                }

                if (text.startsWith('वचन')) {
                    contentItem.type = 'vachan';
                    const vachanId = `${currentPrakaran.id}-vachan-${localVachanNumber -1}`;
                    contentItem.id = vachanId;
                    
                    // --- REFACTORED LOGIC ---
                    // Look ahead to find Tika and Lapika for this vachan
                    let tika = '', lapika = '';
                    let nextIndex = i + 1;
                    while (nextIndex < children.length) {
                        const nextEl = children[nextIndex];
                        const nextText = nextEl.innerText.trim();
                        
                        // Stop if we hit the next vachan or prakaran title
                        if (nextText.startsWith('वचन') || nextEl.classList.contains('p5')) {
                            break; 
                        }
                        if (nextText.startsWith('टीका :-')) {
                            tika += nextText.replace('टीका :-', '').trim() + '<br><br>';
                        }
                        if (nextText.startsWith('लापिका :-')) {
                            lapika += nextText.replace('लापिका :-', '').trim() + '<br><br>';
                        }
                        nextIndex++;
                    }
                    // --- END REFACTORED LOGIC ---

                    const vachanInfo = { 
                        id: vachanId, 
                        text: text.replace(/^वचन\s*[:\-–—]*/, '').trim(), 
                        prakaranIndex: prakaranData.length, 
                        prakaranTitle: currentPrakaran.title, 
                        number: localVachanNumber,
                        tika: tika || null,     // Store the found Tika
                        lapika: lapika || null // Store the found Lapika
                    };
                    
                    currentPrakaran.vachans.push(vachanInfo);
                    allVachans.push(vachanInfo);
                }
                currentPrakaran.content.push(contentItem);
            }
        });
        if (currentPrakaran) prakaranData.push(currentPrakaran);
    }
    
    /**
     * Dynamically creates the HTML pages for each prakaran.
     */
    function buildPrakaranPages() {
        prakaranWrapper.innerHTML = '';
        prakaranData.forEach((prakaran, index) => {
            const prakaranDiv = document.createElement('div');
            prakaranDiv.id = prakaran.id;
            prakaranDiv.className = 'prakaran-content';
            
            prakaran.content.forEach(item => {
                const p = document.createElement(item.tag);
                p.className = item.className;
                
                if (item.type === 'vachan') {
                    // *** हा नवीन बदल आहे ***
                    p.classList.add('vachan-content'); // <<<<<<< CSS साठी क्लास जोडला
                    // *** बदल समाप्त ***

                    const vachan = prakaran.vachans.find(v => v.id === item.id);
                    if(vachan) {
                        // Inject the vachan number
                        p.innerHTML = item.html.replace(/^(<span[^>]*>)?वचन\s*[:\-–—]*/, `$1वचन ${vachan.number} :-`);
                    } else {
                        p.innerHTML = item.html;
                    }
                } else {
                    p.innerHTML = item.html;
                }
                p.id = item.id;
                prakaranDiv.appendChild(p);
            });
            
            // Add navigation buttons
            const navDiv = document.createElement('div');
            navDiv.className = 'prakaran-nav';
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '&larr; मागील प्रकरण';
            prevBtn.disabled = index === 0;
            prevBtn.onclick = () => showPrakaran(index - 1);
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = 'पुढील प्रकरण &rarr;';
            nextBtn.disabled = index === prakaranData.length - 1;
            nextBtn.onclick = () => showPrakaran(index + 1);
            navDiv.appendChild(prevBtn);
            navDiv.appendChild(nextBtn);
            prakaranDiv.appendChild(navDiv);
            prakaranWrapper.appendChild(prakaranDiv);
        });

        // Create and add the welcome page
        const welcomePage = document.createElement('div');
        welcomePage.className = 'prakaran-content active';
        welcomePage.id = 'welcome-page';
        welcomePage.innerHTML = `
            <h1 class="welcome-title">स्थळ पोथी</h1>
            <h2 class="welcome-subtitle">श्री देवदत्त आश्रम जाधववाडी</h2>
            <p style="text-align: center; font-size: 1.2rem; margin-top: 2rem;">डावीकडील मेनू (☰) मधून प्रकरण किंवा वचन निवडा.</p>
        `;
        prakaranWrapper.prepend(welcomePage);
    }
    
    /**
     * Shows the Tika/Lapika popup for a given vachan.
     * This is now much simpler and reads from pre-parsed data.
     */
    function showTikaPopup(event, vachanId) {
        event.preventDefault();
        event.stopPropagation();
        
        const vachan = allVachans.find(v => v.id === vachanId);
        if (!vachan || (!vachan.tika && !vachan.lapika)) {
            return; // No vachan data or no commentary to show
        }

        let tooltipHTML = '';
        if (vachan.lapika) tooltipHTML += `<h4>लापिका</h4><p class="tooltip-lapika">${vachan.lapika}</p>`;
        if (vachan.tika) tooltipHTML += `<h4>टीका</h4><p class="tooltip-tika">${vachan.tika}</p>`;

        if (tooltipHTML) {
            tooltipContentDiv.innerHTML = tooltipHTML;
            
            // Positioning logic (unchanged)
            const linkRect = event.currentTarget.getBoundingClientRect();
            tooltip.style.left = `${linkRect.right + 15}px`;
            tooltip.style.top = `${linkRect.top}px`;
            tooltip.style.transform = `scale(0.95)`;
            
            tooltip.classList.add('visible');
             void tooltip.offsetWidth;
            tooltip.style.transform = `scale(1)`;

            const tooltipRect = tooltip.getBoundingClientRect();
             if (tooltipRect.right > window.innerWidth - 10) {
                tooltip.style.left = `${linkRect.left - tooltipRect.width - 15}px`;
            }
            if (tooltipRect.bottom > window.innerHeight - 10) {
                tooltip.style.top = `${window.innerHeight - tooltipRect.height - 10}px`;
            }
             if (tooltipRect.left < 10) {
                tooltip.style.left = '10px';
            }
             if (tooltipRect.top < 10) {
                tooltip.style.top = '10px';
            }
        }
    }
    
    /**
     * Sets up the double-tap/click and right-click/long-press
     * interactions for vachan links.
     */
    function setupVachanLinkInteractions(linkElement) {
        let lastTap = 0;
        const vachanId = linkElement.dataset.vachanId;
        const vachan = allVachans.find(v => v.id === vachanId);

        // Click / Tap logic
        linkElement.addEventListener('click', (e) => {
            e.preventDefault();
            const now = new Date().getTime();
            const timeSince = now - lastTap;

            if (timeSince < 300 && timeSince > 0) {
                // Double-tap: Show Tika
                showTikaPopup(e, vachanId);
                lastTap = 0;
            } else {
                // Single-tap: Navigate to vachan
                if (vachan) {
                   showPrakaran(vachan.prakaranIndex, vachan.id);
                }
            }
            lastTap = new Date().getTime();
        });

        // Right-click / Long-press logic
        linkElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showTikaPopup(e, vachanId);
        });
    }

    /**
     * Renders a single page of vachans for the Prakaran TOC.
     */
    function renderVachanPage(prakaranTocContainer, prakaranIndex, page) {
        const vachanListDiv = prakaranTocContainer.querySelector('.vachan-list');
        const paginationDiv = prakaranTocContainer.querySelector('.vachan-pagination');
        const prakaran = prakaranData[prakaranIndex];
        const vachans = prakaran.vachans;
        const totalPages = Math.ceil(vachans.length / VACHAN_PAGE_SIZE);

        vachanListDiv.innerHTML = '';
        
        const start = page * VACHAN_PAGE_SIZE;
        const end = start + VACHAN_PAGE_SIZE;
        const pageVachans = vachans.slice(start, end);

        pageVachans.forEach(vachan => {
            const a = document.createElement('a');
            a.href = `#${vachan.id}`;
            a.dataset.vachanId = vachan.id;
            a.textContent = `${vachan.number}. ${vachan.text.substring(0, 35)}...`;
            setupVachanLinkInteractions(a);
            vachanListDiv.appendChild(a);
        });
        
        paginationDiv.innerHTML = '';
        if (totalPages > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '<<';
            prevBtn.disabled = page === 0;
            prevBtn.onclick = () => renderVachanPage(prakaranTocContainer, prakaranIndex, page - 1);
            paginationDiv.appendChild(prevBtn);

            paginationDiv.append(` ${page + 1} / ${totalPages} `);

            const nextBtn = document.createElement('button');
            nextBtn.textContent = '>>';
            nextBtn.disabled = page === totalPages - 1;
            nextBtn.onclick = () => renderVachanPage(prakaranTocContainer, prakaranIndex, page + 1);
            paginationDiv.appendChild(nextBtn);
        }
    }

    /**
     * Builds the Prakaran (Chapter) Table of Contents.
     */
    function buildPrakaranToc() {
        prakaranToc.innerHTML = ''; 
        prakaranData.forEach((prakaran, index) => {
            const container = document.createElement('div');
            container.className = 'prakaran-toc-container';
            
            const h3 = document.createElement('h3');
            h3.className = 'prakaran-heading';
            h3.textContent = `${prakaran.title} (${prakaran.vachans.length})`;
            container.appendChild(h3);

            const vachanListDiv = document.createElement('div');
            vachanListDiv.className = 'vachan-list';
            container.appendChild(vachanListDiv);

            h3.onclick = () => {
                if (prakaran.vachans.length > 0) {
                    container.classList.toggle('expanded');
                    // Load paginated vachans only when expanded
                    if (container.classList.contains('expanded') && vachanListDiv.children.length === 0 && prakaran.vachans.length > VACHAN_PAGE_SIZE) {
                        renderVachanPage(container, index, 0);
                    }
                } else {
                    // If prakaran has no vachans, just navigate to it
                    showPrakaran(index);
                }
            };
            
            // If 30 or fewer vachans, just show them all (no pagination)
            if (prakaran.vachans.length <= VACHAN_PAGE_SIZE) { 
                prakaran.vachans.forEach(vachan => {
                    const a = document.createElement('a');
                    a.href = `#${vachan.id}`;
                    a.dataset.vachanId = vachan.id;
                    a.textContent = `${vachan.number}. ${vachan.text.substring(0, 35)}...`;
                    setupVachanLinkInteractions(a);
                    vachanListDiv.appendChild(a);
                });
            }
             // If more than 30, add pagination container
             if (prakaran.vachans.length > VACHAN_PAGE_SIZE) {
                const paginationDiv = document.createElement('div');
                paginationDiv.className = 'vachan-pagination';
                container.appendChild(paginationDiv);
            }

            prakaranToc.appendChild(container);
        });
    }
    
    /**
     * Builds the Alphabetical (आद्याक्षर) Table of Contents.
     */
    function buildAlphaToc() {
         const marathiLetters = ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ','क','ख','ग','घ','च','छ','ज','झ','ट','ठ','ड','ढ','ण','त','थ','द','ध','न','प','फ','ब','भ','म','य','र','ल','व','श','ष','स','ह'];
         const groupedVachans = marathiLetters.reduce((acc, letter) => ({ ...acc, [letter]: [] }), {});
         
         allVachans.forEach(vachan => {
             const first = vachan.text.charAt(0);
             if(groupedVachans[first]) {
                groupedVachans[first].push(vachan);
             }
         });
         
         alphaBar.innerHTML = '';
         alphaListContent.innerHTML = '';

         marathiLetters.forEach(letter => {
            if (groupedVachans[letter].length) {
                const btn = document.createElement('button');
                btn.textContent = letter;
                btn.onclick = () => {
                    const target = document.getElementById(`alpha-group-${letter}`);
                    if(target) {
                        // Use the toc-wrapper as the scroller
                        alphaToc.querySelector('.toc-wrapper').scrollTop = target.offsetTop;
                    }
                };
                alphaBar.appendChild(btn);

                const groupDiv = document.createElement('div');
                groupDiv.id = `alpha-group-${letter}`;
                const h3 = document.createElement('h3');
                h3.textContent = letter;
                groupDiv.appendChild(h3);
                
                groupedVachans[letter].forEach(vachan => {
                    const a = document.createElement('a');
                    a.href = `#${vachan.id}`;
                    a.dataset.vachanId = vachan.id;
                    a.innerHTML = `${vachan.number}. ${vachan.text.substring(0, 35)}... <span class="prakaran-ref">(${vachan.prakaranTitle})</span>`;
                    setupVachanLinkInteractions(a);
                    groupDiv.appendChild(a);
                });
                alphaListContent.appendChild(groupDiv);
            }
         });
    }
    
    /**
     * Sets up all main application event listeners.
     */
    function setupEventListeners() {
        // Sidebar toggle
        menuBtn.onclick = () => { sidebar.classList.add('is-open'); overlay.classList.add('is-visible'); };
        overlay.onclick = () => { sidebar.classList.remove('is-open'); overlay.classList.remove('is-visible'); };
        
        // TOC tabs
        const tocPrakaranBtn = document.getElementById('toc-prakaran-btn');
        const tocAlphaBtn = document.getElementById('toc-alpha-btn');
        
        tocPrakaranBtn.onclick = () => {
            document.getElementById('prakaran-toc').classList.add('active-toc');
            document.getElementById('alpha-toc').classList.remove('active-toc');
            tocPrakaranBtn.classList.add('active');
            tocAlphaBtn.classList.remove('active');
        };
        tocAlphaBtn.onclick = () => {
            document.getElementById('prakaran-toc').classList.remove('active-toc');
            document.getElementById('alpha-toc').classList.add('active-toc');
            tocPrakaranBtn.classList.remove('active');
            tocAlphaBtn.classList.add('active');
        };

        // Theme toggle
        themeToggleBtn.onclick = () => {
            document.body.classList.toggle('light-theme');
            document.body.classList.toggle('dark-theme');
            themeToggleBtn.textContent = document.body.classList.contains('dark-theme') ? '🌙' : '☀️';
            saveSettings();
        };

        // Font size
        fontIncBtn.onclick = () => {
            baseFontSize = Math.min(1.5, baseFontSize + 0.05);
            contentPanel.style.fontSize = `${baseFontSize}rem`;
            saveSettings();
        };
        fontDecBtn.onclick = () => {
            baseFontSize = Math.max(0.8, baseFontSize - 0.05);
            contentPanel.style.fontSize = `${baseFontSize}rem`;
            saveSettings();
        };
        
        // Tooltip close
        tooltipCloseBtn.onclick = (e) => {
            e.stopPropagation();
            tooltip.classList.remove('visible');
        };
        let lastTooltipTap = 0;
        tooltip.addEventListener('click', (e) => {
            if(e.target === tooltip || e.target === tooltipContentDiv) {
                const now = Date.now();
                if (now - lastTooltipTap < 300) { 
                    tooltip.classList.remove('visible');
                }
                lastTooltipTap = now;
            }
        });
        
        // Search UI
        searchBtn.onclick = () => { searchOverlay.style.display = 'flex'; searchInput.focus(); };
        searchCloseBtn.onclick = () => { searchOverlay.style.display = 'none'; searchInput.value = ''; searchResults.innerHTML = ''; };
        searchOverlay.onclick = (e) => { if(e.target === searchOverlay) searchCloseBtn.click(); };
        searchInput.oninput = performSearch;
    }

    /**
     * Performs a search on the pre-built search index.
     */
    function performSearch() {
        const query = searchInput.value.trim();
        if (query.length < 1) {
            searchResults.innerHTML = '';
            return;
        }

        const regex = new RegExp(query, 'gi');
        const results = searchIndex
            .filter(item => item.text.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 50); // Limit to 50 results

        searchResults.innerHTML = results.map(result => {
            const snippet = getSnippet(result.text, query);
            const highlightedSnippet = snippet.replace(regex, `<span class="highlight">$&</span>`);
            const vachanPrefix = result.isVachan ? `<span class="result-vachan-num">वचन ${result.vachanNumber}: </span>` : '';
            return `
                <a href="#" class="search-result-item" data-prakaran-index="${result.prakaranIndex}" data-element-id="${result.elementId}">
                    <p>${vachanPrefix}${highlightedSnippet}</p>
                    <span class="result-prakaran">${result.prakaranTitle}</span>
                </a>
            `;
        }).join('');
        
        // Add click handlers to search results
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                const prakaranIndex = parseInt(item.dataset.prakaranIndex);
                const elementId = item.dataset.elementId;
                showPrakaran(prakaranIndex, elementId);
                searchOverlay.style.display = 'none';
                searchInput.value = '';
                searchResults.innerHTML = '';
            };
        });
    }
    
    /**
     * Gets a snippet of text surrounding the search query.
     */
    function getSnippet(text, query) {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text.substring(0, 150) + '...';
        const start = Math.max(0, index - 40);
        const end = Math.min(text.length, index + query.length + 40);
        let snippet = text.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';
        return snippet;
    }

    /**
     * Displays a specific prakaran and optionally scrolls to an element.
     */
    function showPrakaran(index, elementId = null) {
        if (index < 0 || index >= prakaranData.length) {
             document.querySelectorAll('.prakaran-content').forEach(p => p.classList.remove('active'));
             document.getElementById('welcome-page').classList.add('active');
             prakaranTitleEl.textContent = "स्थळ पोथी";
             return;
        };
        currentPrakaranIndex = index;

        // Hide all prakarans, show the selected one
        document.querySelectorAll('.prakaran-content').forEach(p => p.classList.remove('active'));
        const prakaranToShow = document.getElementById(prakaranData[index].id);
        
        if (prakaranToShow) {
            prakaranToShow.classList.add('active');
            prakaranTitleEl.textContent = prakaranData[index].title;
            
            if (elementId) {
                const targetEl = document.getElementById(elementId);
                if (targetEl) {
                    // Scroll to the element
                    setTimeout(() => {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add flash effect
                        targetEl.classList.remove('flash-highlight');
                        void targetEl.offsetWidth; // Trigger reflow
                        targetEl.classList.add('flash-highlight');
                    }, 100);
                }
            } else {
                // Scroll to top of prakaran
                contentPanel.scrollTop = 0;
            }
        }
        
        // Close sidebar after navigation
        sidebar.classList.remove('is-open');
        overlay.classList.remove('is-visible');
    }

    // --- NEW FUNCTIONS FOR SAVING SETTINGS ---

    /**
     * Saves current theme and font size to localStorage.
     */
    function saveSettings() {
        try {
            localStorage.setItem('pothiTheme', document.body.className);
            localStorage.setItem('pothiFontSize', baseFontSize);
        } catch (e) {
            console.error("Could not save settings to localStorage:", e);
        }
    }

    /**
     * Loads theme and font size from localStorage on app start.
     */
    function loadSettings() {
        try {
            const savedTheme = localStorage.getItem('pothiTheme');
            const savedFontSize = localStorage.getItem('pothiFontSize');

            if (savedTheme) {
                document.body.className = savedTheme;
            } else {
                 document.body.className = 'dark-theme'; // Default to dark
            }
            themeToggleBtn.textContent = document.body.classList.contains('dark-theme') ? '🌙' : '☀️';


            if (savedFontSize) {
                baseFontSize = parseFloat(savedFontSize);
                contentPanel.style.fontSize = `${baseFontSize}rem`;
            }
        } catch (e)
         {
            console.error("Could not load settings from localStorage:", e);
            document.body.className = 'dark-theme'; // Fallback
            themeToggleBtn.textContent = '🌙';
        }
    }

    // Start the application
    initializeApp();
});
